/**
* Copyright (c) 2026 Sergio Hernandez. All rights reserved.
*
*  Licensed under the Apache License, Version 2.0 (the "License").
*  You may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
*/

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';

// Duration of a full trip playback at 1x speed.
const BASE_DURATION_MS = 60000;

/**
 * Builds a normalized timeline from trip points: each point gets a 0..1
 * timestamp proportional to its deviceDateTime delta within the trip.
 * @param {Array} points - Trip points ({ latitude, longitude, course, deviceDateTime }).
 * @returns {Object|null} { points, stamps } or null when no usable points.
 */
export function buildTimeline(points) {
  if (!points || points.length === 0) return null;
  const sorted = points
    .filter(point => point.deviceDateTime && !isNaN(new Date(point.deviceDateTime)))
    .sort((a, b) => new Date(a.deviceDateTime) - new Date(b.deviceDateTime));
  if (sorted.length === 0) return null;
  const start = new Date(sorted[0].deviceDateTime).getTime();
  const end = new Date(sorted[sorted.length - 1].deviceDateTime).getTime();
  const total = Math.max(end - start, 1);
  const stamps = sorted.map(point => (new Date(point.deviceDateTime).getTime() - start) / total);
  return { points: sorted, stamps };
}

const toPosition = (point) => ({
  lat: point.latitude,
  lng: point.longitude,
  course: point.course || 0
});

/**
 * Interpolates the playback position for a progress value (0..1), linearly
 * between the two surrounding points proportional to their time deltas.
 * @param {Object} timeline - Result of buildTimeline.
 * @param {number} progress - Playback progress 0..1.
 * @returns {Object|null} { lat, lng, course } or null.
 */
export function interpolatePosition(timeline, progress) {
  if (!timeline) return null;
  const { points, stamps } = timeline;
  if (points.length === 1 || progress <= 0) return toPosition(points[0]);
  if (progress >= 1) return toPosition(points[points.length - 1]);
  let index = 1;
  while (index < stamps.length && stamps[index] < progress) index += 1;
  if (index >= points.length) return toPosition(points[points.length - 1]);
  const previous = points[index - 1];
  const next = points[index];
  const span = stamps[index] - stamps[index - 1];
  const k = span > 0 ? (progress - stamps[index - 1]) / span : 1;
  return {
    lat: previous.latitude + (next.latitude - previous.latitude) * k,
    lng: previous.longitude + (next.longitude - previous.longitude) * k,
    course: next.course ?? previous.course ?? 0
  };
}

/**
 * Client-side trip playback state: play/pause, speed multiplier, timeline
 * progress and the interpolated marker position. Purely client-side over
 * already-fetched trip points.
 * @param {Array} points - Points of the selected trip.
 * @returns {Object} Playback API.
 */
export function usePlayback(points) {
  const timeline = useMemo(() => buildTimeline(points), [points]);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const speedRef = useRef(1);
  const frameRef = useRef(null);
  const lastTickRef = useRef(null);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Reset when the selected trip changes.
  useEffect(() => {
    setPlaying(false);
    progressRef.current = 0;
    setProgress(0);
  }, [timeline]);

  useEffect(() => {
    if (!playing || !timeline) return undefined;
    lastTickRef.current = performance.now();
    const step = (now) => {
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;
      const next = progressRef.current + (delta * speedRef.current) / BASE_DURATION_MS;
      if (next >= 1) {
        progressRef.current = 1;
        setProgress(1);
        setPlaying(false);
        return;
      }
      progressRef.current = next;
      setProgress(next);
      frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [playing, timeline]);

  const toggle = useCallback(() => {
    if (!timeline) return;
    setPlaying(previous => {
      if (!previous && progressRef.current >= 1) {
        progressRef.current = 0;
        setProgress(0);
      }
      return !previous;
    });
  }, [timeline]);

  const seek = useCallback((value) => {
    const clamped = Math.min(Math.max(value, 0), 1);
    progressRef.current = clamped;
    setProgress(clamped);
  }, []);

  const position = useMemo(() => interpolatePosition(timeline, progress), [timeline, progress]);

  return {
    playing,
    toggle,
    speed,
    setSpeed,
    progress,
    seek,
    position,
    hasTimeline: !!timeline
  };
}
