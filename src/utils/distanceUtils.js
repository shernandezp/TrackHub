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

/**
 * Formats a distance value into a human-readable format.
 *  
 * @param {number} value - The distance value to format.
 * @returns {string} The formatted distance string (e.g., "123.45 km") or an empty string if the input is invalid.
 */
export function formatDistance(value) {
    if (typeof value !== 'number') return '';
    return `${value.toFixed(2)} km`;
}

/**
 * Calculates the total distance from a list of objects and formats it.
 * 
 * @param {Array<Object>} list - The list of objects containing distance values.
 * @param {string} key - The key in the objects that holds the distance value.
 * @returns {string} The formatted total distance string (e.g., "123.45 km").
 */
export function calculateTotalDistance(list, key) {
    let total = list.reduce((acc, item) => acc + (Number(item[key]) || 0), 0);
    return formatDistance(total);
}

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} - Distance in meters
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export const toRadians = (degrees) => degrees * (Math.PI / 180);