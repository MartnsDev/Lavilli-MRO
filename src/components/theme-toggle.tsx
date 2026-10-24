"use client";
import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";
export function ThemeToggle() {
  return (
    <Button
      variant="outline"
      aria-label="Alternar tema claro e escuro"
      onClick={() => {
        const next =
          document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = next;
        localStorage.setItem("lavilli-theme", next);
      }}
    >
      <Sun className="sun" size={17} />
      <Moon className="moon" size={17} />
      <span>Tema</span>
    </Button>
  );
}
