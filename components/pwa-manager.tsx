"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function subscribeConnectivity(notify: () => void) {
  window.addEventListener("online", notify);
  window.addEventListener("offline", notify);
  return () => {
    window.removeEventListener("online", notify);
    window.removeEventListener("offline", notify);
  };
}
function subscribeDisplayMode(notify: () => void) {
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}
export function PwaManager() {
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [workerOffline, setWorkerOffline] = useState(false);
  const browserOffline = !useSyncExternalStore(
    subscribeConnectivity,
    () => navigator.onLine,
    () => true,
  );
  const offline = browserOffline || workerOffline;
  const standalone = useSyncExternalStore(
    subscribeDisplayMode,
    () => window.matchMedia("(display-mode: standalone)").matches,
    () => false,
  );
  const [update, setUpdate] = useState<ServiceWorker | null>(null);
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPrompt);
    };
    const appInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", appInstalled);
    let disposed = false;
    let registration: ServiceWorkerRegistration | undefined;
    let installingWorker: ServiceWorker | null = null;
    const stateChange = () => {
      if (
        installingWorker?.state === "installed" &&
        navigator.serviceWorker.controller &&
        !disposed
      )
        setUpdate(registration?.waiting || installingWorker);
    };
    const updateFound = () => {
      installingWorker = registration?.installing || null;
      installingWorker?.addEventListener("statechange", stateChange);
    };
    const workerStatus = (event: MessageEvent) => {
      if (event.data?.type === "OFFLINE_STATUS") setWorkerOffline(event.data.offline === true);
    };
    const requestStatus = () =>
      navigator.serviceWorker.controller?.postMessage({ type: "GET_OFFLINE_STATUS" });
    const restored = () => {
      setWorkerOffline(false);
      navigator.serviceWorker.controller?.postMessage({ type: "CLEAR_OFFLINE_STATUS" });
    };
    // Development bundles change continuously; production builds alone register offline support.
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", workerStatus);
      navigator.serviceWorker.addEventListener("controllerchange", requestStatus);
      window.addEventListener("online", restored);
      requestStatus();
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((value) => {
          if (disposed) return;
          registration = value;
          if (value.waiting && navigator.serviceWorker.controller) setUpdate(value.waiting);
          value.addEventListener("updatefound", updateFound);
          requestStatus();
        })
        .catch(() => {
          /* The online app remains usable if browser policy prevents service workers. */
        });
    }
    return () => {
      disposed = true;
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", appInstalled);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", workerStatus);
        navigator.serviceWorker.removeEventListener("controllerchange", requestStatus);
      }
      window.removeEventListener("online", restored);
      registration?.removeEventListener("updatefound", updateFound);
      installingWorker?.removeEventListener("statechange", stateChange);
    };
  }, []);

  async function install() {
    if (!installPrompt || installing) return;
    setInstalling(true);
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } catch {
      /* Browser policy may revoke the prompt. Use its install menu instead. */
    } finally {
      setInstallPrompt(null);
      setInstalling(false);
    }
  }
  function applyUpdate() {
    if (!update) return;
    navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), {
      once: true,
    });
    update.postMessage({ type: "SKIP_WAITING" });
  }
  if (!offline && !update && (!installPrompt || installed || standalone)) return null;
  return (
    <aside className="native-status" aria-label="App availability">
      {offline && <span role="status">Offline · saved content available</span>}
      {update && (
        <Button variant="unstyled" className="native-status-action" onClick={applyUpdate}>
          Update available · restart
        </Button>
      )}
      {installPrompt && !installed && !standalone && (
        <Button
          variant="unstyled"
          className="native-status-action"
          onClick={() => void install()}
          disabled={installing}
        >
          {installing ? "Installing…" : "Install Elementals"}
        </Button>
      )}
    </aside>
  );
}
