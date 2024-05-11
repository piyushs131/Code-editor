import { useState, useEffect } from 'react';


function useDebounce(callback: Function, delay: number) {
  const [timer, setTimer] = useState<NodeJS.Timeout>();

  useEffect(() => {
    return () => clearTimeout(timer as NodeJS.Timeout);
  }, [timer]);

  function debouncedCallback(...args: any[]) {
    clearTimeout(timer as NodeJS.Timeout);
    setTimer(setTimeout(() => callback(...args), delay));
  }

  return debouncedCallback;
}

export default useDebounce;
