import { useEffect } from 'react'
import { DEFAULT_PAGE_TITLE } from '../lib/constants'

/** Set `document.title` and restore the default on unmount. */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title
    return () => { document.title = DEFAULT_PAGE_TITLE }
  }, [title])
}
