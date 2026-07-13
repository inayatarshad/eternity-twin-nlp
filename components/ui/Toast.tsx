"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useEffectiveReducedMotion } from "@/components/ClientPreferences";

export type ToastKind = "info" | "success" | "error";

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
  action?: { label: string; onClick: () => void };
}

interface ToastApi {
  toast: (
    message: string,
    options?: { kind?: ToastKind; action?: ToastItem["action"] },
  ) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

const AUTO_DISMISS_MS = 6000;

const kindAccent: Record<ToastKind, string> = {
  info: "var(--color-neural-cyan)",
  success: "var(--color-positive)",
  error: "var(--color-danger)",
};

/** Non-blocking notifications (docs/ui/01 error states). Polite live region. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const reducedMotion = useEffectiveReducedMotion();

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastApi["toast"]>(
    (message, options) => {
      const id = nextId.current++;
      setItems((current) => [
        ...current,
        { id, message, kind: options?.kind ?? "info", action: options?.action },
      ]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const api = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="region"
        aria-live="polite"
        aria-label="Notifications"
        className="fixed right-6 bottom-6 z-(--z-toast) flex w-80 flex-col gap-2"
      >
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              transition={{ duration: reducedMotion ? 0 : 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <GlassPanel
                role="status"
                className="flex items-start gap-3 p-3"
                style={{ borderLeft: `2px solid ${kindAccent[item.kind]}` }}
              >
                <p className="flex-1 text-sm text-text-primary">{item.message}</p>
                {item.action ? (
                  <button
                    type="button"
                    onClick={() => {
                      item.action?.onClick();
                      dismiss(item.id);
                    }}
                    className="shrink-0 text-sm font-medium text-neural-cyan hover:underline"
                  >
                    {item.action.label}
                  </button>
                ) : null}
                <button
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={() => dismiss(item.id)}
                  className="shrink-0 rounded-sm p-0.5 text-text-muted hover:text-text-primary"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              </GlassPanel>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
