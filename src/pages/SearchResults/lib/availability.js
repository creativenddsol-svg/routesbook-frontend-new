// src/pages/lib/availability.js
import { useEffect, useRef } from "react";
import apiClient from "../../api";
import {
  LIVE_POLL_MS,
  MAX_REFRESH_BUSES,
  AVAIL_TTL_MS,
  AVAIL_FORCE_TTL_MS,
} from "../lib/constants";

/**
 * Creates an availability controller that mirrors the logic you had in index.jsx.
 * Pass getters so we always read the freshest state.
 *
 * @param {Object} args
 * @param {() => Array} args.getBuses - returns current buses array
 * @param {() => string} args.getSearchDateParam - returns current date string (YYYY-MM-DD)
 * @param {(updater: (prev: Object) => Object) => void} args.setAvailability - state setter
 */
export function createAvailabilityController({
  getBuses,
  getSearchDateParam,
  setAvailability,
}) {
  const inFlightAvailRef = useRef(new Map());
  const lastFetchedAtRef = useRef(new Map());
  const backoffUntilRef = useRef(0);
  const availabilityRef = useRef({});

  // allow the owner to keep us synced with availability state
  const bindAvailabilityRef = (currentAvailability) => {
    availabilityRef.current = currentAvailability || {};
  };

  /**
   * Fetch availability for a list of buses with throttling, dedupe and backoff.
   * @param {Array} targetBuses
   * @param {{ force?: boolean }} opts
   */
  const refreshAvailability = async (targetBuses, opts = {}) => {
    const { force = false } = opts;
    const list = (targetBuses && targetBuses.length ? targetBuses : getBuses()) || [];
    if (!list.length) return;

    const now = Date.now();
    if (!force && now < backoffUntilRef.current) return;

    const date = getSearchDateParam();
    const updates = {};

    await Promise.all(
      list.map(async (bus) => {
        const key = `${bus._id}-${bus.departureTime}`;
        const last = lastFetchedAtRef.current.get(key) || 0;
        const minGap = force ? AVAIL_FORCE_TTL_MS : AVAIL_TTL_MS;
        if (!force && now - last < minGap) return;

        if (inFlightAvailRef.current.has(key)) {
          try {
            const data = await inFlightAvailRef.current.get(key);
            if (data) updates[key] = data;
          } catch {}
          return;
        }

        const p = (async () => {
          try {
            const res = await apiClient.get(`/bookings/availability/${bus._id}`, {
              params: { date, departureTime: bus.departureTime },
            });
            const payload = {
              available: res.data.availableSeats,
              window: res.data.availableWindowSeats || null,
              bookedSeats: Array.isArray(res.data.bookedSeats)
                ? res.data.bookedSeats.map(String)
                : [],
              seatGenderMap: res.data.seatGenderMap || {},
            };
            lastFetchedAtRef.current.set(key, Date.now());
            return payload;
          } catch (e) {
            if (e?.response?.status === 429) {
              backoffUntilRef.current = Date.now() + 15000;
            }
            const prev = availabilityRef.current?.[key];
            return prev || {
              available: null,
              window: null,
              bookedSeats: [],
              seatGenderMap: {},
            };
          } finally {
            inFlightAvailRef.current.delete(key);
          }
        })();

        inFlightAvailRef.current.set(key, p);
        const data = await p;
        if (data) updates[key] = data;
      })
    );

    if (Object.keys(updates).length) {
      setAvailability((prev) => ({ ...prev, ...updates }));
    }
  };

  return {
    refreshAvailability,
    bindAvailabilityRef,
    inFlightAvailRef,
    lastFetchedAtRef,
    backoffUntilRef,
  };
}

/**
 * Interval polling hook that mirrors your previous tick logic.
 * Calls refreshAvailability on the expanded card + visible list (capped).
 */
export function useAvailabilityPolling({
  buses,
  expandedBusId,
  page,
  RESULTS_PER_PAGE,
  refreshAvailability,
}) {
  const pollInFlightRef = useRef(false);
  const visibleForPolling = buses ? [...buses] : [];

  useEffect(() => {
    if (!buses || !buses.length) return;
    let stopped = false;

    const tick = async () => {
      if (pollInFlightRef.current) return;
      pollInFlightRef.current = true;
      try {
        if (document.hidden) return;

        const list = [];

        if (expandedBusId) {
          const lastDash = expandedBusId.lastIndexOf("-");
          const id = lastDash >= 0 ? expandedBusId.slice(0, lastDash) : expandedBusId;
          const time = lastDash >= 0 ? expandedBusId.slice(lastDash + 1) : "";
          const b = buses.find((x) => x._id === id && x.departureTime === time);
          if (b) list.push(b);
        }

        const visible = visibleForPolling.slice(0, page * RESULTS_PER_PAGE);
        for (const b of visible) {
          const key = `${b._id}-${b.departureTime}`;
          if (expandedBusId && key === expandedBusId) continue;
          list.push(b);
          if (list.length >= MAX_REFRESH_BUSES) break;
        }

        if (!stopped && list.length) {
          await refreshAvailability(list);
        }
      } finally {
        pollInFlightRef.current = false;
      }
    };

    const id = setInterval(tick, LIVE_POLL_MS);
    // run once immediately
    tick();

    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [buses, expandedBusId, page, RESULTS_PER_PAGE, refreshAvailability]);
}
