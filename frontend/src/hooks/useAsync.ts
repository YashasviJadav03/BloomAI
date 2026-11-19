import { useCallback, useEffect, useRef, useState } from 'react'

/** Load data on mount with loading/error state and a reload() function. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const fnRef = useRef(fn)
  fnRef.current = fn

  const run = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    return fnRef.current()
      .then((d) => { setData(d); return d })
      .catch((e: unknown) => { setError(e instanceof Error ? e.message : 'Something went wrong') })
      .finally(() => setLoading(false))
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void run() }, deps)
  return { data, setData, error, loading, reload: () => run(true), retry: () => run(false) }
}
