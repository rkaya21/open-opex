"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

type ToastKind = "success" | "error" | "info";

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  show: (message: string, kind?: ToastKind) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const styles: Record<ToastKind, { border: string; icon: React.ElementType; color: string }> =
  {
    success: { border: "border-l-emerald-500", icon: CheckCircle2, color: "text-emerald-600" },
    error: { border: "border-l-red-500", icon: AlertTriangle, color: "text-red-600" },
    info: { border: "border-l-teal-500", icon: Info, color: "text-teal-600" },
  };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (message: string, kind: ToastKind = "info") => {
      const id = (counter.current += 1);
      setToasts((current) => [...current, { id, kind, message }]);
      setTimeout(() => remove(id), 3500);
    },
    [remove],
  );

  const value: ToastContextValue = {
    show,
    success: (message) => show(message, "success"),
    error: (message) => show(message, "error"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((toast) => {
          const style = styles[toast.kind];
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-2.5 rounded-lg border border-slate-200 border-l-4 ${style.border} bg-white px-4 py-3 shadow-lg`}
              role="status"
            >
              <style.icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.color}`} />
              <span className="grow text-sm text-slate-700">{toast.message}</span>
              <button
                onClick={() => remove(toast.id)}
                aria-label="Kapat"
                className="shrink-0 text-slate-400 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
