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

import type { ReactNode } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import ArgonBox from 'components/ArgonBox';
import FieldLabel from 'controls/Dialogs/FieldLabel';
import { textFieldSx } from 'controls/Dialogs/fieldStyles';

export interface MultiSelectOption {
  value: string;
  label: string;
  detail?: string | null;
}

interface MultiSelectFieldProps {
  id: string;
  label?: ReactNode;
  placeholder?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

function MultiSelectField({ id, label, placeholder, options, value, onChange, disabled = false }: MultiSelectFieldProps) {
  const selected = options.filter((option) => value.includes(option.value));

  return (
    <ArgonBox mt={1} mb={1}>
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <Autocomplete
        id={id}
        multiple
        disableCloseOnSelect
        autoHighlight
        disabled={disabled}
        options={options}
        value={selected}
        onChange={(_, next) => onChange(next.map((option) => option.value))}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, current) => option.value === current.value}
        renderOption={(props, option) => (
          <li {...props} key={option.value}>
            {option.label}
            {option.detail ? <span style={{ marginLeft: 8, opacity: 0.6 }}>{option.detail}</span> : null}
          </li>
        )}
        renderValue={(items, getItemProps) =>
          items.map((option, index) => (
            <Chip {...getItemProps({ index })} key={option.value} label={option.label} size="small" />
          ))
        }
        renderInput={(params) => (
          <TextField {...params} placeholder={selected.length === 0 ? placeholder : undefined} sx={textFieldSx} />
        )}
      />
    </ArgonBox>
  );
}

export default MultiSelectField;
