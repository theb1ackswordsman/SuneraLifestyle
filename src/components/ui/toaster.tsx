"use client";

import { Toaster as HotToaster } from "react-hot-toast";
import { useTheme } from "next-themes";

export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <HotToaster
      position="bottom-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 3000,
        style: {
          background: resolvedTheme === "dark" ? "#111111" : "#ffffff",
          color: resolvedTheme === "dark" ? "#fafafa" : "#0a0a0a",
          border: `1px solid ${resolvedTheme === "dark" ? "#262626" : "#e5e5e5"}`,
          borderRadius: "12px",
          fontSize: "14px",
          fontWeight: "500",
          padding: "12px 16px",
          boxShadow: "0 8px 32px 0 rgb(0 0 0 / 0.12)",
        },
        success: {
          iconTheme: { primary: "#1a5c14", secondary: "#ffffff" },
        },
        error: {
          iconTheme: { primary: "#ef4444", secondary: "#ffffff" },
        },
      }}
    />
  );
}
