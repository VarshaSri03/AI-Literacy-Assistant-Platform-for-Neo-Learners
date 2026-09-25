// src/InstallPrompt.jsx
//
// Shows a small "Install Learnly" banner once the browser signals the app
// is installable (Chrome/Edge/Android fire `beforeinstallprompt`). iOS
// Safari never fires that event — there's no programmatic install trigger
// there — so on iOS this shows manual "Add to Home Screen" steps instead
// of pretending a button will work.
//
// Self-contained: no props needed. Render it once, near the top of the
// app (see the one-line addition to App.jsx).

import { useEffect, useState } from "react";

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true // iOS Safari's own flag
  );
}

function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem("learnly_install_dismissed") === "1");

  useEffect(() => {
    if (isStandalone() || dismissed) return;

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // iOS never fires beforeinstallprompt — show the banner anyway with
    // manual steps, after a short delay so it's not the first thing a
    // new visitor sees.
    let iosTimer;
    if (isIos()) {
      iosTimer = setTimeout(() => setVisible(true), 4000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      clearTimeout(iosTimer);
    };
  }, [dismissed]);

  const dismiss = () => {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem("learnly_install_dismissed", "1");
  };

  const install = async () => {
    if (isIos()) {
      setShowIosSteps(true);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted" || outcome === "dismissed") dismiss();
  };

  if (!visible || dismissed) return null;

  return (
    <div className="install-banner">
      {!showIosSteps ? (
        <>
          <span className="install-banner-icon">📲</span>
          <div className="install-banner-text">
            <strong>Install Learnly</strong>
            <small>Add it to your home screen for a faster, full-screen experience.</small>
          </div>
          <button className="primary-button" onClick={install}>Install</button>
          <button className="icon-btn" onClick={dismiss} aria-label="Dismiss">✕</button>
        </>
      ) : (
        <>
          <div className="install-banner-text">
            <strong>Add Learnly to your Home Screen</strong>
            <small>
              Tap the Share button <span aria-hidden="true">⬆️</span> in Safari's toolbar, then choose
              "Add to Home Screen".
            </small>
          </div>
          <button className="icon-btn" onClick={dismiss} aria-label="Dismiss">✕</button>
        </>
      )}
    </div>
  );
}

export default InstallPrompt;
