import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
type Theme = "light" | "dark";
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "dark",
  toggle: () => {},
});
const ToastContext = createContext<(message: string) => void>(() => {});
export const useTheme = () => useContext(ThemeContext);
export const useToast = () => useContext(ToastContext);
export function Providers({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem("ag.v2.theme");
      if (stored === "light" || stored === "dark") return stored;
    } catch {}
    return matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  });
  const [message, setMessage] = useState("");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try {
      localStorage.setItem("ag.v2.theme", theme);
    } catch {}
  }, [theme]);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 5000);
    return () => clearTimeout(timer);
  }, [message]);
  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
      }}
    >
      <ToastContext.Provider value={setMessage}>
        {children}
        <div className="toast-region" role="status" aria-live="polite">
          {message && (
            <div className="toast">
              {message}
              <button
                aria-label="Fechar notificação"
                onClick={() => setMessage("")}
              >
                ×
              </button>
            </div>
          )}
        </div>
      </ToastContext.Provider>
    </ThemeContext.Provider>
  );
}
