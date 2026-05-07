"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { DownloadIcon, ShareIcon, SmartphoneIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt: () => Promise<void>;
}

function isRunningStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOSDevice() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function subscribeToEnvironment() {
  return () => {};
}

export function InstallPrompt() {
  const isStandalone = useSyncExternalStore(
    subscribeToEnvironment,
    isRunningStandalone,
    () => true
  );
  const isIOS = useSyncExternalStore(
    subscribeToEnvironment,
    isIOSDevice,
    () => false
  );
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissedState] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    if (typeof window !== "undefined") {
      setDismissedState(sessionStorage.getItem("installPromptDismissed") === "true");
    }
  }, []);

  const setDismissed = (value: boolean) => {
    setDismissedState(value);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("installPromptDismissed", String(value));
    }
  };

  useEffect(() => {
    if (isStandalone) {
      return;
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setDeferredPrompt(null);
      setDismissed(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [isStandalone]);

  async function handleInstall() {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice.catch(() => null);
    setDeferredPrompt(null);
    setDismissed(true);
  }

  const open = hasMounted && !dismissed && !isStandalone && Boolean(deferredPrompt || isIOS);

  if (!open) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => setDismissed(!nextOpen)}>
      <DialogContent className="border-white/10 bg-black/95 text-white shadow-2xl sm:max-w-sm">
        <DialogHeader className="pr-8">
          <div className="mb-1 flex size-10 items-center justify-center rounded-lg border border-white/10 bg-white/10">
            <SmartphoneIcon className="size-5" />
          </div>
          <DialogTitle>HUMAN NATURE uygulamasini yukle</DialogTitle>
          <DialogDescription className="text-white/70">
            Magazaya daha hizli ulasmak icin uygulamayi telefonunun ana
            ekranina ekleyebilirsin.
          </DialogDescription>
        </DialogHeader>

        {isIOS && !deferredPrompt && (
          <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/75">
            <div className="mb-2 flex items-center gap-2 font-medium text-white">
              <ShareIcon className="size-4" />
              iPhone icin
            </div>
            Safari&apos;de Paylas dugmesine dokun, sonra &quot;Ana Ekrana
            Ekle&quot; sec.
          </div>
        )}

        <DialogFooter className="border-white/10 bg-white/[0.03]">
          <Button
            type="button"
            variant="outline"
            className="border-white/15 bg-transparent text-white hover:bg-white/10"
            onClick={() => setDismissed(true)}
          >
            Daha Sonra
          </Button>
          {deferredPrompt && (
            <Button type="button" onClick={handleInstall}>
              <DownloadIcon data-icon="inline-start" />
              Yukle
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
