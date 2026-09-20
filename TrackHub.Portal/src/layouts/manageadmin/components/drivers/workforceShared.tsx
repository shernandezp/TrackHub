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

/**
 * Small presentation helpers shared by the workforce accordions (credentials,
 * qualifications, assignments, expirations).
 */

import type { ReactNode } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';
import FieldLabel from 'controls/Dialogs/FieldLabel';
import { textFieldSx } from 'controls/Dialogs/fieldStyles';
import type { Driver } from 'api/manager/drivers';
import { daysUntilDateOnly } from 'utils/dateUtils';

export type BadgeColor =
  | 'primary'
  | 'secondary'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'light'
  | 'dark';

export function TextCell({ children }: { children?: ReactNode }) {
  return (
    <ArgonTypography variant="caption" color="secondary" fontWeight="medium">
      {children || '-'}
    </ArgonTypography>
  );
}

/**
 * Whole calendar days from today until a DateOnly expiry (negative once it has
 * passed, 0 on the day itself). Delegates to the DateOnly-aware helper: mixing a
 * UTC-midnight parse with a local `Date.now()` put the count — and therefore the
 * severity colour — off by one for every viewer at a negative UTC offset.
 */
export function daysUntil(value: string | null | undefined): number | null {
  return daysUntilDateOnly(value);
}

/**
 * Severity color for an expiration date, mirroring the alert thresholds the
 * backend scan uses (30/15/7/0 days). No date at all is neutral.
 */
export function expiryColor(expiresAt: string | null | undefined): BadgeColor {
  const days = daysUntil(expiresAt);
  if (days === null) return 'secondary';
  if (days < 0) return 'dark';
  if (days <= 7) return 'error';
  if (days <= 15) return 'warning';
  if (days <= 30) return 'info';
  return 'success';
}

/** Assignment/qualification lifecycle status color. */
export function statusColor(status: string | null | undefined): BadgeColor {
  switch ((status || '').toUpperCase()) {
    case 'ACTIVE':
    case 'VALID':
      return 'success';
    case 'EXPIRED':
    case 'REVOKED':
    case 'CANCELLED':
      return 'error';
    case 'ENDED':
      return 'secondary';
    default:
      return 'info';
  }
}

interface DriverPickerProps {
  drivers: Driver[];
  value: string;
  onChange: (driverId: string) => void;
  label: string;
  placeholder: string;
  id: string;
}

/** Shared "which driver" picker: type any part of the name, pick from the matches. */
export function DriverPicker({ drivers, value, onChange, label, placeholder, id }: DriverPickerProps) {
  const selected = drivers.find((driver) => driver.driverId === value) ?? null;
  return (
    <ArgonBox>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Autocomplete
        id={id}
        options={drivers}
        value={selected}
        onChange={(_, driver) => onChange(driver?.driverId ?? '')}
        getOptionLabel={(driver) => driver.name ?? ''}
        isOptionEqualToValue={(option, current) => option.driverId === current.driverId}
        autoHighlight
        renderInput={(params) => <TextField {...params} placeholder={placeholder} sx={textFieldSx} />}
      />
    </ArgonBox>
  );
}
