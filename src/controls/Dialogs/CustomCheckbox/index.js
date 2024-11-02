/**
* Copyright (c) 2024 Sergio Hernandez. All rights reserved.
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