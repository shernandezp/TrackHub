import React from 'react';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import PropTypes from 'prop-types';

function CustomSelect({ list, handleChange, name, id, label, value }) {
    return (
        <div>
            <InputLabel id={`${id}-label`} shrink={true}>{label}</InputLabel>
            <Select
                margin="dense"
                labelId={`${id}-label`}
                id={id}
                value={value}
                label={label}
                onChange={handleChange}
                name={name}
            >
                {list.map((item, index) => (
                    <MenuItem key={index} value={item.value}>
                        {item.label}
                    </MenuItem>
                ))}
            </Select>
        </div>
    );
}

CustomSelect.propTypes = {
    list: PropTypes.array.isRequired,
    handleChange: PropTypes.func.isRequired,
    name: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.any.isRequired,
};

export default CustomSelect;