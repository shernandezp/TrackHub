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

export function formatISODuration(value: string): string {
    // Router serialises a TimeSpan the .NET way: a trip of a day or more reads `P1DT2H`, and the
    // seconds may carry a fraction (`PT5M3.25S`), so both are parsed.
    const match = (value || '').match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/);
    if (!match || match[0] === 'P' || match[0] === 'PT') return "";

    const parts: string[] = [];
    if (match[1]) parts.push(`${match[1]} d`);
    if (match[2]) parts.push(`${match[2]} hr`);
    if (match[3]) parts.push(`${match[3]} min`);
    if (match[4]) parts.push(`${Math.round(Number(match[4]))} s`);

    return parts.join(" ");
}

export function formatTime(value: number | string | Date): string {
    const date = new Date(value);
    return `${(date.getHours()).toString().padStart(2, '0')}:${(date.getMinutes()).toString().padStart(2, '0')}:${(date.getSeconds()).toString().padStart(2, '0')}`;
}
