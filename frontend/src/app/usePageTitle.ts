import { useEffect } from 'react'

// Sets the browser tab title, e.g. "Documents · DocFlow".
export function usePageTitle(title: string) {
  useEffect(() => {
    window.document.title = title ? `${title} · DocFlow` : 'DocFlow'
  }, [title])
}
