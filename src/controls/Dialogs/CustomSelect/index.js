import React from 'react';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

function CustomSelect({ 
        list, 
        handleChange = () => {},
        name, 
        id, 
        label, 
        value,
        numericValue = true
    }) {
    const { t } = useTranslation();
    const handleSelectChange = (event) => {
        handleChange({
          target: {
            name: name,
            value: event.target.value,
          },
        });
      };

    return (
        <div>
            <InputLabel id={`${id}-label`} shrink={true}>{label}</InputLabel>
            <Select
                margin="dense"
                labelId={`${id}-label`}
                id={id}
                value={value}
                label={label}
                onChange={handleSelectChange}
                name={name}
                displayEmpty
            >
                {numericValue ? (
                    <MenuItem value={0} disabled>
                        {t('generic.selectItem')}
                    </MenuItem>
                ) : (
                    <MenuItem value={''} disabled>
                        {t('generic.selectItem')}
                    </MenuItem>
                )}
                
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
    handleChange: PropTypes.func,
    name: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.any,
    numericValue: PropTypes.bool
};

export default CustomSelect;