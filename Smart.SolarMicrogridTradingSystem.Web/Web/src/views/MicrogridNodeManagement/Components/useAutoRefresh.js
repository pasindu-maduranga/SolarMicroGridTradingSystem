import { useState, useEffect, useRef, useCallback } from 'react';

const useAutoRefresh = (refreshFn, intervalSeconds = 10) => {
  const [secondsLeft, setSecondsLeft] = useState(intervalSeconds);
  const refreshFnRef = useRef(refreshFn);
  refreshFnRef.current = refreshFn;

  const tick = useCallback(() => {
    setSecondsLeft((s) => {
      if (s <= 1) {
        refreshFnRef.current();
        return intervalSeconds;
      }
      return s - 1;
    });
  }, [intervalSeconds]);

  useEffect(() => {
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tick]);

  return secondsLeft;
};

export default useAutoRefresh;
