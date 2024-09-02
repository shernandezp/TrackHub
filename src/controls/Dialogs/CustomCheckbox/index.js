import React from 'react';
import PropTypes from 'prop-types';
import { FormControlLabel, Checkbox } from '@mui/material';

const CustomCheckbox = ({ handleChange, name, id, value, label }) => (
  <FormControlLabel
    control={
      <Checkbox
        name={name}
        id={id}
        checked={value}
        onChange={handleChange}
      />
    }
    label={label}
  />
);

CustomCheckbox.propTypes = {
    handleChange: PropTypes.func,
    name: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    value: PropTypes.any,
    label: PropTypes.string.isRequired
};

export default CustomCheckbox;