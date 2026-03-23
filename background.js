(() => {
  const TOGGLE_MESSAGE_TYPE = "csh-toggle-quick-nav";

  chrome.action.onClicked.addListener((tab) => {
    if (!tab || typeof tab.id !== "number") return;

    chrome.tabs.sendMessage(tab.id, { type: TOGGLE_MESSAGE_TYPE }, () => {
      // Ignore expected errors when the current tab has no matching content script.
      void chrome.runtime.lastError;
    });
  });
})();
