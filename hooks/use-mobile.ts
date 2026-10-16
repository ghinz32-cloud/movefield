import * as React from "react"

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const onChange = () => {
      // Navigation must leave a usable workspace after enlarged text is applied.
      const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      setIsMobile(window.innerWidth < Math.max(1024,64*rem) || window.innerHeight < 32*rem)
    }
    const observer = new MutationObserver(onChange)
    observer.observe(document.documentElement,{attributes:true,attributeFilter:['style','class']})
    window.addEventListener('resize',onChange)
    onChange()
    return () => {observer.disconnect();window.removeEventListener('resize',onChange)}
  }, [])

  return isMobile ?? true
}
