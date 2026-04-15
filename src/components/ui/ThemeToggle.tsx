"use client"

import { useTheme } from "@/contexts/ThemeContext"
import { Moon, Sun } from "lucide-react"
import { Button } from "./Button"

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      aria-label={`Mudar para modo ${theme === "dark" ? "claro" : "escuro"}`}
      className="rounded-lg p-2"
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-dark-300 hover:text-white transition-colors" />
      ) : (
        <Moon className="w-5 h-5 text-dark-600 hover:text-dark-900 transition-colors" />
      )}
    </Button>
  )
}
