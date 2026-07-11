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

import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import type { SelectChangeEvent } from '@mui/material/Select';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ArgonBox from 'components/ArgonBox';
import { useTranslation } from 'react-i18next';

/** An option for one of the filter-bar selects. */
export interface FilterOption {
  value: string | number;
  label: string;
}

/** Client-side filter state driving the live map narrowing. */
export interface DashboardFilters {
  transporterType: string;
  groupId: string | number;
  operatorId: string;
  status: string;
}

// Make the chevron visible (the theme hides it globally) and keep the
// control compact enough for a single-row filter bar.
const selectSx = {
  minWidth: 130,
  fontSize: '0.75rem',
  cursor: 'pointer',
  '& .MuiSelect-icon': {
    display: 'inline-block !important',
    right: 8,
    color: 'inherit',
    pointerEvents: 'none',
  },
  '& .MuiSelect-select': {
    width: '100% !important',
    paddingRight: '28px !important',
    paddingTop: '4px !important',
    paddingBottom: '4px !important',
    cursor: 'pointer',
  },
};

interface CompactSelectProps {
  name: string;
  value: string | number;
  options: FilterOption[];
  label: string;
  onChange: (name: string, value: string | number) => void;
}

// Compact select: the "all" option doubles as the field label, so no
// stacked label is rendered and the bar stays a single light row.
function CompactSelect({ name, value, options, label, onChange }: CompactSelectProps) {
  const labelFor = (selected: string | number) => {
    const option = options.find((item) => item.value === selected);
    return option ? option.label : label;
  };
  return (
    <FormControl size="small" variant="outlined">
      <Select<string | number>
        id={name}
        name={name}
        value={value}
        onChange={(event: SelectChangeEvent<string | number>) => onChange(name, event.target.value)}
        displayEmpty
        size="small"
        IconComponent={KeyboardArrowDownIcon}
        inputProps={{ 'aria-label': label }}
        renderValue={(selected) => (selected === 'all' ? labelFor(selected) : `${label}: ${labelFor(selected)}`)}
        sx={selectSx}
      >
        {options.map((item) => (
          <MenuItem key={item.value} value={item.value}>
            {item.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

interface FilterBarProps {
  typeOptions?: FilterOption[];
  groupOptions?: FilterOption[];
  operatorOptions?: FilterOption[];
  filters: DashboardFilters;
  onFilterChange: (name: string, value: string | number) => void;
  showPois?: boolean;
  onTogglePois?: () => void;
  followMode?: boolean;
  onToggleFollow?: () => void;
  followDisabled?: boolean;
  showTrail?: boolean;
  onToggleTrail?: () => void;
}

// Client-side filter bar for the live map. Filters only narrow the
// already-authorized set; stat cards and the table keep the full set.
// Unit search-by-plate lives in the page's top-right search box.
function FilterBar({
  typeOptions = [],
  groupOptions = [],
  operatorOptions = [],
  filters,
  onFilterChange,
  showPois,
  onTogglePois,
  followMode,
  onToggleFollow,
  followDisabled = false,
  showTrail,
  onToggleTrail
}: FilterBarProps) {
  const { t } = useTranslation();

  const statusOptions: FilterOption[] = [
    { value: 'all', label: t('dashboard.allStatuses') },
    { value: 'moving', label: t('dashboard.statusMoving') },
    { value: 'stopped', label: t('dashboard.statusStopped') },
    { value: 'offline', label: t('dashboard.statusOffline') }
  ];

  return (
    <ArgonBox mb={1} display="flex" flexWrap="wrap" alignItems="center" gap={1}>
      <CompactSelect
        name="groupId"
        value={filters.groupId ?? 'all'}
        options={[{ value: 'all', label: t('dashboard.allGroups') }, ...groupOptions]}
        label={t('dashboard.filterGroup')}
        onChange={onFilterChange}
      />
      <CompactSelect
        name="transporterType"
        value={filters.transporterType || 'all'}
        options={[{ value: 'all', label: t('dashboard.allTypes') }, ...typeOptions]}
        label={t('dashboard.filterType')}
        onChange={onFilterChange}
      />
      <CompactSelect
        name="operatorId"
        value={filters.operatorId || 'all'}
        options={[{ value: 'all', label: t('dashboard.allOperators') }, ...operatorOptions]}
        label={t('dashboard.filterOperator')}
        onChange={onFilterChange}
      />
      <CompactSelect
        name="status"
        value={filters.status || 'all'}
        options={statusOptions}
        label={t('dashboard.filterStatus')}
        onChange={onFilterChange}
      />
      <ArgonBox display="flex" alignItems="center" gap={0.5} ml="auto">
        <Chip
          label={t('dashboard.poiLayer')}
          size="small"
          clickable
          color={showPois ? 'primary' : 'default'}
          variant="outlined"
          onClick={onTogglePois}
        />
        <Chip
          label={t('dashboard.followMode')}
          size="small"
          clickable
          disabled={followDisabled}
          color={followMode ? 'primary' : 'default'}
          variant="outlined"
          onClick={onToggleFollow}
        />
        <Chip
          label={t('dashboard.trail')}
          size="small"
          clickable
          color={showTrail ? 'primary' : 'default'}
          variant="outlined"
          onClick={onToggleTrail}
        />
      </ArgonBox>
    </ArgonBox>
  );
}

export default FilterBar;
