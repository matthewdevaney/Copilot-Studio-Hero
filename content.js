(() => {
  // Feature registry pattern: add new features here as separate objects.
  const features = [createTextareaAutosizeFeature(), createCopilotQuickNavFeature()];

  // Run all features on initial page content.
  applyFeaturesToRoot(document, features);

  // Run all features for newly added nodes.
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        applyFeaturesToRoot(node, features);
      }
    }
  });

  observer.observe(document.documentElement || document, {
    childList: true,
    subtree: true,
  });

  // Applies each feature to a root node and all relevant descendants.
  function applyFeaturesToRoot(root, featureList) {
    if (!root) return;

    for (const feature of featureList) {
      applyFeatureToRoot(feature, root);
    }
  }

  // Applies one feature to direct root match and descendant matches.
  function applyFeatureToRoot(feature, root) {
    if (!root || typeof feature?.selector !== "string" || typeof feature?.setup !== "function") {
      return;
    }

    if (root instanceof Element && root.matches(feature.selector)) {
      feature.setup(root);
    }

    if (typeof root.querySelectorAll !== "function") return;

    for (const element of root.querySelectorAll(feature.selector)) {
      feature.setup(element);
    }
  }

  // Feature: autosize textareas as the user types, up to a fixed max height.
  function createTextareaAutosizeFeature() {
    const EXCLUDED_CLASS = "text-area-input";
    const BOUND_ATTR = "data-autosize-bound";
    const MAX_HEIGHT_PX = 1000;
    const ALLOWED_URL_PREFIXES = [
      "https://copilotstudio.preview.",
      "https://copilotstudio",
    ];

    function isUrlAllowed(url) {
      return ALLOWED_URL_PREFIXES.some((prefix) => url.startsWith(prefix));
    }

    function autoSizeTextarea(textarea) {
      textarea.style.height = "auto";
      const nextHeight = Math.min(textarea.scrollHeight, MAX_HEIGHT_PX);
      textarea.style.height = `${nextHeight}px`;
      textarea.style.overflowY = textarea.scrollHeight > MAX_HEIGHT_PX ? "auto" : "hidden";
    }

    function setup(textarea) {
      if (!(textarea instanceof HTMLTextAreaElement)) return;
      if (!isUrlAllowed(window.location.href)) return;
      if (textarea.classList.contains(EXCLUDED_CLASS)) return;
      if (textarea.hasAttribute(BOUND_ATTR)) return;

      textarea.setAttribute(BOUND_ATTR, "true");
      textarea.style.setProperty("resize", "none", "important");
      textarea.style.setProperty("max-height", `${MAX_HEIGHT_PX}px`, "important");

      textarea.addEventListener("input", () => autoSizeTextarea(textarea));
      autoSizeTextarea(textarea);
    }

    return {
      name: "textarea-autosize",
      selector: "textarea",
      setup,
    };
  }

  // Feature: quick navigation menu for Copilot Studio environments.
  function createCopilotQuickNavFeature() {
    // Runtime guardrails and wiring keys for this feature.
    const HOST = "copilotstudio.microsoft.com";
    const MENU_ID = "csh-quick-nav-menu";
    const BOUND_ATTR = "data-csh-quick-nav-bound";
    const TOGGLE_MESSAGE_TYPE = "csh-toggle-quick-nav";

    // In-memory handle so we reuse a single DOM menu instance.
    let menu = null;

    // Finds the in-app Extensions control if we need contextual anchoring.
    function findExtensionsButton() {
      const selectors = [
        'button[aria-label*="Extensions" i]',
        'button[title*="Extensions" i]',
        '[role="button"][aria-label*="Extensions" i]',
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element instanceof HTMLElement) {
          return element;
        }
      }

      const candidates = document.querySelectorAll("button, [role='button']");
      for (const candidate of candidates) {
        if (!(candidate instanceof HTMLElement)) continue;
        const label = (candidate.textContent || "").trim();
        if (/^extensions$/i.test(label)) {
          return candidate;
        }
      }

      return null;
    }

    // Extracts the environment ID from /environments/{id} in the current URL.
    function getEnvironmentIdFromUrl(urlString) {
      try {
        const url = new URL(urlString);
        const match = url.pathname.match(/\/environments\/([^/?#]+)/i);
        return match?.[1] || null;
      } catch {
        return null;
      }
    }

    // Creates one quick-nav action row and opens the target in a new tab.
    function createButton(label, buildUrl) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.style.display = "block";
      button.style.width = "100%";
      button.style.margin = "6px 0";
      button.style.padding = "8px 10px";
      button.style.border = "1px solid #cbd5e1";
      button.style.borderRadius = "8px";
      button.style.background = "#ffffff";
      button.style.color = "#0f172a";
      button.style.cursor = "pointer";
      button.style.fontSize = "13px";
      button.style.fontWeight = "600";
      button.style.textAlign = "left";

      button.addEventListener("mouseenter", () => {
        button.style.background = "#f8fafc";
      });

      button.addEventListener("mouseleave", () => {
        button.style.background = "#ffffff";
      });

      button.addEventListener("click", () => {
        hideMenu();

        const environmentId = getEnvironmentIdFromUrl(window.location.href);
        if (!environmentId) {
          window.alert("No environment ID found in this URL.");
          return;
        }

        const targetUrl = buildUrl(environmentId);
        window.open(targetUrl, "_blank", "noopener,noreferrer");
      });

      return button;
    }

    // Builds the full quick-nav menu container and button list.
    function buildMenu() {
      const container = document.createElement("div");
      container.id = MENU_ID;
      container.style.position = "fixed";
      container.style.right = "16px";
      container.style.top = "72px";
      container.style.width = "220px";
      container.style.zIndex = "2147483647";
      container.style.padding = "12px";
      container.style.border = "1px solid #e2e8f0";
      container.style.borderRadius = "12px";
      container.style.background = "#f8fafc";
      container.style.boxShadow = "0 10px 28px rgba(15, 23, 42, 0.16)";
      container.style.fontFamily = "Segoe UI, Arial, sans-serif";
      container.style.display = "none";

      const title = document.createElement("div");
      title.style.marginBottom = "10px";
      title.style.fontSize = "14px";
      title.style.fontWeight = "700";
      title.style.color = "#0f172a";
      title.style.display = "flex";
      title.style.alignItems = "center";
      title.style.gap = "8px";

      const icon = document.createElement("span");
      icon.textContent = "🌐";
      icon.style.fontSize = "14px";
      icon.style.lineHeight = "1";

      const titleText = document.createElement("span");
      titleText.textContent = "Quick Nav";

      title.appendChild(icon);
      title.appendChild(titleText);

      const tablesButton = createButton(
        "Tables",
        (environmentId) => `https://make.powerapps.com/environments/${environmentId}/entities/`
      );

      const connectionsButton = createButton(
        "Connections",
        (environmentId) => `https://make.powerapps.com/environments/${environmentId}/connections`
      );

      const customConnectorsButton = createButton(
        "Custom Connectors",
        (environmentId) =>
          `https://make.powerautomate.com/environments/${environmentId}/connections/custom`
      );

      const promptsButton = createButton(
        "Prompts",
        (environmentId) => `https://make.powerautomate.com/environments/${environmentId}/aibuilder/prompts`
      );

      container.appendChild(title);
      container.appendChild(tablesButton);
      container.appendChild(connectionsButton);
      container.appendChild(customConnectorsButton);
      container.appendChild(promptsButton);

      return container;
    }

    // Lazily creates and reuses the menu so we only bind it once.
    function ensureMenu() {
      if (menu && document.body.contains(menu)) {
        return menu;
      }

      menu = document.getElementById(MENU_ID);
      if (!menu) {
        menu = buildMenu();
        document.body.appendChild(menu);
      }

      return menu;
    }

    // Applies the fixed dock position for the quick-nav panel.
    function positionMenu() {
      const currentMenu = ensureMenu();
      // Match a Level Up-style fixed dock position in the app chrome area.
      currentMenu.style.left = "";
      currentMenu.style.right = "16px";
      currentMenu.style.top = "16px";
      currentMenu.style.bottom = "";
    }

    // Visibility helpers used by button click and runtime message events.
    function showMenu() {
      const currentMenu = ensureMenu();
      positionMenu();
      currentMenu.style.display = "block";
    }

    function hideMenu() {
      if (!menu) return;
      menu.style.display = "none";
    }

    function toggleMenu() {
      const currentMenu = ensureMenu();
      const isVisible = currentMenu.style.display !== "none";

      if (isVisible) {
        hideMenu();
        return;
      }

      showMenu();
    }

    // Closes the menu when the user clicks anywhere outside it.
    function handleOutsideClick(event) {
      if (!menu || menu.style.display === "none") return;
      if (!(event.target instanceof Node)) return;
      if (menu.contains(event.target)) return;
      hideMenu();
    }

    // Responds to background script messages that toggle quick nav.
    function handleRuntimeMessage(message) {
      if (!message || message.type !== TOGGLE_MESSAGE_TYPE) return;
      toggleMenu();
    }

    // One-time feature bootstrap for top window on the target host.
    function setup(root) {
      if (!(root instanceof HTMLElement)) return;
      if (window.location.hostname !== HOST) return;
      if (window.top !== window) return;
      if (document.documentElement.hasAttribute(BOUND_ATTR)) return;

      document.documentElement.setAttribute(BOUND_ATTR, "true");
      document.addEventListener("mousedown", handleOutsideClick, true);

      if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
        chrome.runtime.onMessage.addListener((message) => {
          handleRuntimeMessage(message);
        });
      }
    }

    return {
      name: "copilot-quick-nav",
      selector: "body",
      setup,
    };
  }
})();
