/**
* Copyright (c) 2025 Sergio Hernandez. All rights reserved.
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

import type { Position } from 'api/router/router';

export type UnitStatus = 'moving' | 'stopped' | 'offline';

/** Every field is a pure narrowing; group/operator narrowing is applied server-side by devicePositionsByUser. */
export interface PositionFilterOptions {
  transporterType?: string;
  status?: string;
  searchText?: string;
  onlineInterval?: number;
}

export function countRecentDevices(positions: Position[], interval: number): number {
    const now = new Date();
    const timeAgo = new Date(now.getTime() - 60 * interval * 1000);
    const recentDevices = positions.filter(device => {
      const deviceDateTime = new Date(device.deviceDateTime);
      return deviceDateTime > timeAgo && deviceDateTime <= now;
    });
    return recentDevices.length;
  }

  export function countDevicesInMovement(positions: Position[], onlineIntervalMinutes: number): number {
    return positions.filter(device => getUnitStatus(device, onlineIntervalMinutes) === 'moving').length;
  }

  export function getPercentage(count: number, total: number): string {
    const percentage = total && total > 0 ? (count / total) * 100 : 0;
    return percentage.toFixed(2);
  }

  /**
   * - 'offline': no position within the online interval.
   * - 'moving': recent position with speed > 0 or ignition on.
   * - 'stopped': recent position, not moving.
   */
  export function getUnitStatus(device: Position, onlineIntervalMinutes: number): UnitStatus {
    const interval = onlineIntervalMinutes && onlineIntervalMinutes > 0 ? onlineIntervalMinutes : 60;
    const deviceDateTime = device && device.deviceDateTime ? new Date(device.deviceDateTime) : null;
    // getTime() reproduces the JS `isNaN(date)` coercion while satisfying the
    // number-typed isNaN signature.
    if (!deviceDateTime || isNaN(deviceDateTime.getTime())) {
      return 'offline';
    }
    const now = new Date();
    const timeAgo = new Date(now.getTime() - 60 * interval * 1000);
    const isRecent = deviceDateTime > timeAgo && deviceDateTime <= now;
    if (!isRecent) {
      return 'offline';
    }
    if ((device.speed || 0) > 0 || device.attributes?.ignition === true) {
      return 'moving';
    }
    return 'stopped';
  }

  /** Filters never widen the set the user was authorized to receive. */
  export function filterPositions(
    positions: Position[],
    { transporterType, status, searchText, onlineInterval }: PositionFilterOptions = {}
  ): Position[] {
    let filtered = positions || [];
    if (transporterType && transporterType !== 'all') {
      filtered = filtered.filter(position => position.transporterType === transporterType);
    }
    if (status && status !== 'all') {
      filtered = filtered.filter(position => getUnitStatus(position, onlineInterval as number) === status);
    }
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(position => position.deviceName?.toLowerCase().includes(search));
    }
    return filtered;
  }
