"use client";

import { useEffect, useState } from "react";

/** The value once it has stopped changing for `delayMilliseconds`. */
export function useDebouncedValue<Value>(
  value: Value,
  delayMilliseconds: number
): Value {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedValue(value),
      delayMilliseconds
    );
    return () => clearTimeout(timeout);
  }, [value, delayMilliseconds]);

  return debouncedValue;
}
