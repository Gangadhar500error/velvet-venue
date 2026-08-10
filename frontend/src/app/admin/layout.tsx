import Script from "next/script";
import { ThemeProvider } from "./_components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import AdminShell from "./AdminShell";

const themeInitScript = `
(function () {
  try {
    var t = localStorage.getItem('vv-admin-theme');
    var root = document.documentElement;
    if (t === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  } catch (e) {}
})();
`;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script id="vv-admin-theme-init" strategy="beforeInteractive">
        {themeInitScript}
      </Script>
      <ThemeProvider>
        <AuthProvider>
          <AdminShell>{children}</AdminShell>
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}
