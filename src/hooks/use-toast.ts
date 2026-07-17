"use client";

import toast from "react-hot-toast";

export function useToast() {
  return {
    success: (msg: string) => toast.success(msg),
    error: (msg: string) => toast.error(msg),
    loading: (msg: string) => toast.loading(msg),
    dismiss: toast.dismiss,
    promise: toast.promise,
  };
}
