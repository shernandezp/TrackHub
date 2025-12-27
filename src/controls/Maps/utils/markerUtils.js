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
 * Get marker color based on status and speed
 * @param {number} speed - Current speed
 * @param {boolean} isOnline - Device online status
 * @returns {string} - Hex color code
 */
export const getMarkerColor = (speed, isOnline = true) => {
    if (!isOnline) return '#808080'; // Gray for offline
    if (speed > 0) return '#00FF00'; // Green for moving
    return '#FF0000'; // Red for stopped
};

/**
 * Get status color based on speed and online status
 * @param {number} speed - Current speed
 * @param {boolean} isOnline - Device online status
 * @returns {string} - Status color name
 */
export const getStatusColor = (speed, isOnline = true) => {
    if (!isOnline) return 'secondary';
    if (speed > 0) return 'success';
    return 'error';
};

/**
 * Get marker text/label based on status
 * @param {number} speed - Current speed
 * @param {boolean} isOnline - Device online status
 * @returns {string} - Single character label
 */
export const getMarkerLabel = (speed, isOnline = true) => {
    if (!isOnline) return 'O'; // Offline
    if (speed > 0) return 'M'; // Moving
    return 'S'; // Stopped
};

/**
 * Filter markers by criteria
 * @param {Array} markers - Array of marker objects
 * @param {Object} filters - Filter criteria
 * @returns {Array} - Filtered markers
 */
export const filterMarkers = (markers, filters) => {
    let filtered = [...markers];
    
    if (filters.minSpeed !== undefined) {
        filtered = filtered.filter(m => m.speed >= filters.minSpeed);
    }
    
    if (filters.maxSpeed !== undefined) {
        filtered = filtered.filter(m => m.speed <= filters.maxSpeed);
    }
    
    if (filters.status) {
        filtered = filtered.filter(m => {
            if (filters.status === 'moving') return m.speed > 0;
            if (filters.status === 'stopped') return m.speed === 0;
            return true;
        });
    }
    
    if (filters.searchText) {
        const search = filters.searchText.toLowerCase();
        filtered = filtered.filter(m => 
            m.name?.toLowerCase().includes(search)
        );
    }
    
    return filtered;
};

/**
 * Find nearest marker to a given position
 * @param {Array} markers - Array of marker objects
 * @param {Object} position - {lat, lng}
 * @returns {Object|null} - Nearest marker or null
 */
export const findNearestMarker = (markers, position) => {
    if (!markers || markers.length === 0) return null;
    
    let nearest = null;
    let minDistance = Infinity;
    
    markers.forEach(marker => {
        const distance = calculateDistance(
            position.lat, position.lng,
            marker.lat, marker.lng
        );
        if (distance < minDistance) {
            minDistance = distance;
            nearest = marker;
        }
    });
    
    return nearest;
};

/**
 * Calculate distance between two points (Haversine formula)
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} - Distance in meters
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const toRadians = (degrees) => degrees * (Math.PI / 180);
