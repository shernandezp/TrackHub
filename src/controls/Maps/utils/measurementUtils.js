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
 * Calculate total distance along a path of coordinates
 * @param {Array} latlngs - Array of {lat, lng} objects
 * @returns {number} - Total distance in meters
 */
export const calculatePathDistance = (latlngs) => {
    if (!latlngs || latlngs.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 0; i < latlngs.length - 1; i++) {
        totalDistance += calculateDistance(
            latlngs[i].lat, latlngs[i].lng,
            latlngs[i + 1].lat, latlngs[i + 1].lng
        );
    }
    
    return totalDistance;
};

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} - Distance in meters
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Format distance to human-readable string
 * @param {number} meters - Distance in meters
 * @param {string} unit - 'metric' or 'imperial'
 * @returns {string} - Formatted distance string
 */
export const formatDistance = (meters, unit = 'metric') => {
    if (unit === 'imperial') {
        const feet = meters * 3.28084;
        if (feet < 5280) {
            return `${Math.round(feet)} ft`;
        }
        const miles = feet / 5280;
        return `${miles.toFixed(2)} mi`;
    }
    
    // Metric
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }
    const km = meters / 1000;
    return `${km.toFixed(2)} km`;
};

/**
 * Calculate area of a polygon
 * @param {Array} latlngs - Array of {lat, lng} objects forming a closed polygon
 * @returns {number} - Area in square meters
 */
export const calculateArea = (latlngs) => {
    if (!latlngs || latlngs.length < 3) return 0;
    
    const R = 6371000; // Earth's radius in meters
    let area = 0;
    
    const coords = [...latlngs];
    if (coords[0] !== coords[coords.length - 1]) {
        coords.push(coords[0]); // Close the polygon
    }
    
    for (let i = 0; i < coords.length - 1; i++) {
        const p1 = coords[i];
        const p2 = coords[i + 1];
        area += toRadians(p2.lng - p1.lng) * 
                (2 + Math.sin(toRadians(p1.lat)) + 
                 Math.sin(toRadians(p2.lat)));
    }
    
    area = Math.abs(area * R * R / 2);
    return area;
};

/**
 * Format area to human-readable string
 * @param {number} squareMeters - Area in square meters
 * @param {string} unit - 'metric' or 'imperial'
 * @returns {string} - Formatted area string
 */
export const formatArea = (squareMeters, unit = 'metric') => {
    if (unit === 'imperial') {
        const sqFeet = squareMeters * 10.7639;
        if (sqFeet < 43560) {
            return `${Math.round(sqFeet)} ft²`;
        }
        const acres = sqFeet / 43560;
        return `${acres.toFixed(2)} acres`;
    }
    
    // Metric
    if (squareMeters < 10000) {
        return `${Math.round(squareMeters)} m²`;
    }
    const sqKm = squareMeters / 1000000;
    return `${sqKm.toFixed(2)} km²`;
};

const toRadians = (degrees) => degrees * (Math.PI / 180);
