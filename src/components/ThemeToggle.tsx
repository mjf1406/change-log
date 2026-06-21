import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }

  return (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Light mode" : "Dark mode"}
    >
      {theme === "light" ? <Sun /> : <Moon />}
    </Button>
  );
}
