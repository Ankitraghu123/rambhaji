// src/core/utils/useDeferredVal.js
// Custom React Hook to defer rendering or values until native UI interactions/transitions finish.
// Ensures 60 FPS transitions on screens containing heavy components like maps or lists.

import { useState, useEffect } from 'react';
import { InteractionManager } from 'react-native';

/**
 * Hook that returns a deferred value which changes to `deferredValue` 
 * after screen transitions/interactions finish.
 *
 * @param {any} initialValue - The initial value before interaction finishes (e.g. false, empty array).
 * @param {any} deferredValue - The value to switch to after interactions finish.
 * @param {number} delay - Optional additional delay in ms.
 * @returns {any}
 */
export function useDeferredVal(initialValue, deferredValue, delay = 150) {
  const [val, setVal] = useState(initialValue);

  useEffect(() => {
    // Use simple setTimeout to bypass InteractionManager queue blocking by infinite loop animations (like PulsingDot)
    const timer = setTimeout(() => {
      setVal(deferredValue);
    }, delay);

    return () => clearTimeout(timer);
  }, [deferredValue, delay]);

  return val;
}
