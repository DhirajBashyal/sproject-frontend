import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "@/app/providers/ThemeProvider";

export function Toaster() {
  const { isDark } = useTheme();
  return (
    <SonnerToaster
      theme={isDark ? "dark" : "light"}
      position="top-right"
      offset={{ top: 68, right: 16 }} // below the header, so it never covers the theme and sign-out buttons
      mobileOffset={{ top: 68 }}
      richColors
      closeButton
      toastOptions={{ style: { fontFamily: "var(--font-sans)" } }}
    />
  );
}
