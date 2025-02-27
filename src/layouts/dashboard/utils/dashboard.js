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