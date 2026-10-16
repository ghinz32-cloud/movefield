/* This small independent script keeps first-load failures recoverable. */
(() => {
  const panel = document.querySelector('[data-app-loading]');
  const root = document.getElementById('root');
  if (!panel || !root) return;
  const status = panel.querySelector('[data-loading-status]');
  const failed = () => {
    if (panel.isConnected && status) status.textContent = 'The app could not finish opening. Check your connection, then try again.';
  };
  const onError = event => { if (event.target instanceof HTMLScriptElement) failed(); };
  const timer = setTimeout(failed, 12000);
  const observer = new MutationObserver(() => {
    if (panel.isConnected) return;
    clearTimeout(timer);
    window.removeEventListener('error', onError, true);
    observer.disconnect();
  });
  observer.observe(root, {childList: true});
  window.addEventListener('error', onError, true);
})();
