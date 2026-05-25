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

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ArgonBox from 'components/ArgonBox';
import FieldLabel from 'controls/Dialogs/FieldLabel';

// Make the chevron visible (the theme hides it globally) and reserve space for it
// so the displayed value never overlaps the icon and the whole control area is clickable.
const selectSx = {
    width: '100%',
    cursor: 'pointer',
    '& .MuiSelect-icon': {
        display: 'inline-block !important',
        right: 10,
        color: 'inherit',
        pointerEvents: 'none',
    },
    '& .MuiSelect-select': {
        width: '100% !important',
        paddingRight: '32px !important',
        cursor: 'pointer',
    },
};

function CustomSelect({
    list,
    handleChange = () => {},
    name,
    id,
    label,
    value,
    numericValue = true,
    required = false,
    fullWidth = true,
    placeholder,
}) {
    const { t } = useTranslation();
    const emptyValue = numericValue ? 0 : '';
    const currentValue = value ?? emptyValue;

    const onChange = (event) => {
        handleChange({ target: { name, value: event.target.value } });
    };

    return (
        <ArgonBox mt={1} mb={1} width={fullWidth ? '100%' : 'auto'}>
            {label && (
                <FieldLabel htmlFor={id} required={required}>{label}</FieldLabel>
            )}
            <FormControl fullWidth={fullWidth} variant="outlined">
                <Select
                    id={id}
                    name={name}
                    value={currentValue}
                    onChange={onChange}
                    displayEmpty
                    IconComponent={KeyboardArrowDownIcon}
                    inputProps={{ 'aria-label': typeof label === 'string' ? label : id }}
                    sx={selectSx}
                >
                    <MenuItem value={emptyValue} disabled>
                        {placeholder || t('generic.selectItem')}
                    </MenuItem>
                    {list.map((item, index) => (
                        <MenuItem key={index} value={item.value}>
                            {item.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </ArgonBox>
    );
}

CustomSelect.propTypes = {
    list: PropTypes.array.isRequired,
    handleChange: PropTypes.func,
    name: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    label: PropTypes.node,
    value: PropTypes.any,
    numericValue: PropTypes.bool,
    required: PropTypes.bool,
    fullWidth: PropTypes.bool,
    placeholder: PropTypes.string,
};

export default CustomSelect;
