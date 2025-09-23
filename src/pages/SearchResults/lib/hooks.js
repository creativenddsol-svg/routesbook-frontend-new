// src/pages/lib/hooks.js
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * useStableCallback
 * Keeps a stable function identity while always calling the latest fn.
 */
export const useStableCallback = (fn) => {
  const ref = useRef(fn);
  useLayoutEffect(() => {
    ref.current = fn;
  }, [fn]);
  return useCallback((...args) => ref.current?.(...args), []);
};

/**
 * usePrevious
 * Returns the previous value of a state/prop.
 */
export const usePrevious = (value) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
};

/**
 * useDebouncedCallback
 * Debounce an input function with a given delay.
 */
export const useDebouncedCallback = (fn, delay = 250) => {
  const stable = useStableCallback(fn);
  const timer = useRef(null);

  const debounced = useCallback(
    (...args) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = null;
        stable(...args);
      }, delay);
    },
    [delay, stable]
  );

  useEffect(() => () => timer.current && clearTimeout(timer.current), []);

  return debounced;
};

/**
 * useEventListener
 * Attaches an event listener with proper cleanup and stable handler.
 */
export const useEventListener = (target, type, handler, options) => {
  const stable = useStableCallback(handler);

  useEffect(() => {
    const el = typeof target === "function" ? target() : target || window;
    if (!el?.addEventListener) return;
    el.addEventListener(type, stable, options);
    return () => el.removeEventListener(type, stable, options);
  }, [target, type, stable, options]);
};

/**
 * useInfiniteScroll
 * Calls onLoadMore when user nears bottom. Returns a ref to attach to the scroller (optional).
 */
export const useInfiniteScroll = ({ onLoadMore, hasMore = true, offset = 200 }) => {
  const stableLoad = useStableCallback(onLoadMore);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!hasMore) return;

    const handler = () => {
      const root = scrollRef.current || document.documentElement;
      const scrollTop = root.scrollTop || window.pageYOffset || document.body.scrollTop || 0;
      const height = root.scrollHeight || document.body.scrollHeight || 0;
      const viewport = window.innerHeight || root.clientHeight || 0;

      if (viewport + scrollTop >= height - offset) {
        stableLoad();
      }
    };

    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [hasMore, offset, stableLoad]);

  return scrollRef;
};
