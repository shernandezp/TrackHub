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

export function countRecentDevices(devices, interval) {
    const now = new Date();
    const timeAgo = new Date(now.getTime() - 60 * interval * 1000);
    const recentDevices = devices.filter(device => {
      const deviceDateTime = new Date(device.deviceDateTime);
      return deviceDateTime > timeAgo && deviceDateTime <= now;
    });
    return recentDevices.length;
  }

  export function countDevicesInMovement(devices) {
    const movingDevices = devices.filter(device => device.speed > 0);
    return movingDevices.length;
  }

  export function getPercentage(count, total) {
    const percentage = total && total > 0 ? (count / total) * 100 : 0;
    return percentage.toFixed(2);
  }

  /**
   * Computes the live status of a unit from its latest position.
   * - 'offline': no position within the online interval.
   * - 'moving': recent position with speed > 0 or ignition on.
   * - 'stopped': recent position, not moving.
   * @param {Object} device - Position record (deviceDateTime, speed, attributes).
   * @param {number} onlineIntervalMinutes - AccountSettings online interval in minutes.
   * @returns {'moving'|'stopped'|'offline'} Unit status.
   */
  export function getUnitStatus(device, onlineIntervalMinutes) {
    const interval = onlineIntervalMinutes && onlineIntervalMinutes > 0 ? onlineIntervalMinutes : 60;
    const deviceDateTime = device && device.deviceDateTime ? new Date(device.deviceDateTime) : null;
    if (!deviceDateTime || isNaN(deviceDateTime)) {
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

  /**
   * Client-side narrowing of the already-authorized position set.
   * Filters never widen the set the user was authorized to receive.
   * @param {Array} positions - Positions returned by devicePositionsByUser.
   * @param {Object} filters - { transporterType?, status?, searchText?, onlineInterval?,
   *   groupTransporterIds?, operatorTransporterIds? }. The membership sets are Sets of
   *   transporterIds resolved for the selected group/operator; null/undefined means no narrowing.
   * @returns {Array} Filtered positions.
   */
  export function filterPositions(positions, { transporterType, status, searchText, onlineInterval, groupTransporterIds, operatorTransporterIds } = {}) {
    let filtered = positions || [];
    if (groupTransporterIds) {
      filtered = filtered.filter(position => groupTransporterIds.has(position.transporterId));
    }
    if (operatorTransporterIds) {
      filtered = filtered.filter(position => operatorTransporterIds.has(position.transporterId));
    }
    if (transporterType && transporterType !== 'all') {
      filtered = filtered.filter(position => position.transporterType === transporterType);
    }
    if (status && status !== 'all') {
      filtered = filtered.filter(position => getUnitStatus(position, onlineInterval) === status);
    }
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(position => position.deviceName?.toLowerCase().includes(search));
    }
    return filtered;
  }