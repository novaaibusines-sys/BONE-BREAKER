import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share, PlusSquare, X, ShieldAlert, Sparkles } from 'lucide-react';
import { sounds } from '../utils/sound';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // If already installed as PWA or dismissed, hide
  if (isInstalled || dismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    sounds.playClick();
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      {/* Banner / Card for mobile or top header */}
      <div className="relative mb-4 flex items-center justify-between gap-3 border border-[#E0262B]/30 bg-[#231b19] px-4 py-3 text-sm text-[#EDEFF1] shadow-lg clip-angular sm:rounded-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[#E0262B]/20 text-[#E0262B]">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-warrior text-xs font-bold tracking-wider text-[#EDEFF1]">
                ARMOR YOUR DEVICE
              </span>
              <span className="rounded bg-[#E0262B] px-1.5 py-0.2 text-[10px] font-bold text-white">
                PWA
              </span>
            </div>
            <p className="text-xs text-[#9A9DA1]">
              Install BONE BREAKER on Home Screen for offline training & instant notifications.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 bg-[#E0262B] hover:bg-[#c01d22] active:scale-95 text-white px-3.5 py-1.5 text-xs font-bold font-warrior transition-all glow-red clip-angular-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            INSTALL
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-[#9A9DA1] hover:text-[#EDEFF1] p-1 transition"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* iOS Modal Guide */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md border-2 border-[#E0262B] bg-[#231b19] p-6 shadow-2xl clip-angular">
            <div className="flex items-center justify-between pb-3 border-b border-[#382d2a]">
              <div className="flex items-center gap-2 text-[#E0262B]">
                <ShieldAlert className="h-5 w-5" />
                <h3 className="font-warrior text-base font-bold text-[#EDEFF1]">
                  INSTALL ON IPHONE / IPAD
                </h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-[#9A9DA1] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm text-[#EDEFF1]">
              <div className="rounded bg-[#181211] p-3 text-xs border border-[#382d2a] text-[#9A9DA1]">
                <strong className="text-[#E0262B]">Notice for iOS:</strong> Apple requires web apps to be added to the Home Screen before allowing web notifications and true offline caching.
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#181211] text-[#E0262B] border border-[#382d2a]">
                  1
                </div>
                <div>
                  <p className="font-medium text-xs">
                    Tap the <strong className="text-white">Share</strong> icon in the Safari bottom toolbar.
                  </p>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-[#9A9DA1]">
                    <Share className="h-3.5 w-3.5 text-[#E0262B]" />
                    <span>(Box with an upward arrow)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#181211] text-[#E0262B] border border-[#382d2a]">
                  2
                </div>
                <div>
                  <p className="font-medium text-xs">
                    Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.
                  </p>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-[#9A9DA1]">
                    <PlusSquare className="h-3.5 w-3.5 text-[#E0262B]" />
                    <span>Select "Add" in top-right corner</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#181211] text-[#E0262B] border border-[#382d2a]">
                  3
                </div>
                <div>
                  <p className="font-medium text-xs">
                    Launch <strong className="text-[#E0262B]">BONE BREAKER</strong> from your home screen. Full standalone mode & notifications will activate!
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-6 w-full bg-[#E0262B] py-2.5 text-xs font-bold font-warrior text-white hover:bg-[#c01d22] transition clip-angular-sm"
            >
              UNDERSTOOD. RETURN TO ARENA.
            </button>
          </div>
        </div>
      )}
    </>
  );
};
