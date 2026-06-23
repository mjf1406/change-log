import { useEffect, useState } from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

function getDocumentTheme(): "light" | "dark" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

const Toaster = ({ ...props }: ToasterProps) => {
  const [theme, setTheme] = useState<"light" | "dark">(getDocumentTheme)

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(getDocumentTheme())
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => observer.disconnect()
  }, [])

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
        ),
        info: (
          <InfoIcon className="size-4 text-sky-600 dark:text-sky-400" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast !shadow-lg",
          success:
            "cn-toast-success !border-emerald-500/30 !bg-emerald-50 !text-emerald-950 dark:!border-emerald-400/25 dark:!bg-emerald-950 dark:!text-emerald-50 [&_[data-icon]]:!text-emerald-600 dark:[&_[data-icon]]:!text-emerald-400",
          info: "cn-toast-info !border-sky-500/30 !bg-sky-50 !text-sky-950 dark:!border-sky-400/25 dark:!bg-sky-950 dark:!text-sky-50 [&_[data-icon]]:!text-sky-600 dark:[&_[data-icon]]:!text-sky-400",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
