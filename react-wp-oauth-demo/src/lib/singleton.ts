import React from 'react'

/**
 * Creates a function that can only be executed once per application reload.
 * Subsequent calls will be ignored.
 * 
 * @param fn - The function to execute only once
 * @returns A wrapper function that ensures single execution
 */
export function createSingleton<T extends (...args: any[]) => any>(fn: T): T {
  let hasExecuted = false
  let result: ReturnType<T>

  return ((...args: Parameters<T>) => {
    if (hasExecuted) {
      return result
    }
    
    hasExecuted = true
    result = fn(...args)
    return result
  }) as T
}

/**
 * Hook version that wraps useEffect to ensure it only runs once per app reload,
 * even with React Strict Mode double-mounting.
 */
export function useEffectOnce(effect: () => void | (() => void)) {
  const singletonEffect = createSingleton(effect)
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useEffect(() => {
    return singletonEffect()
  }, []) // Intentionally empty - we want this to run only once per app load
}
