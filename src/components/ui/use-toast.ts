"use client";

import { useState, useCallback } from "react";

type ToastVariant = "default" | "destructive";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

let toastCount = 0;
let listeners: Array<(toasts: Toast[]) => void> = [];
let memoryToasts: Toast[] = [];

function dispatch(toasts: Toast[]) {
  memoryToasts = toasts;
  listeners.forEach((listener) => listener(toasts));
}

export function toast({
  title,
  description,
  variant = "default",
}: Omit<Toast, "id">) {
  const id = String(++toastCount);
  const newToast = { id, title, description, variant };
  dispatch([...memoryToasts, newToast]);
  setTimeout(() => {
    dispatch(memoryToasts.filter((t) => t.id !== id));
  }, 4000);
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(memoryToasts);

  useState(() => {
    listeners.push(setToasts);
    return () => {
      listeners = listeners.filter((l) => l !== setToasts);
    };
  });

  return { toasts, toast };
}
