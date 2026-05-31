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

import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import ArgonBox from 'components/ArgonBox';
import FieldLabel from 'controls/Dialogs/FieldLabel';
import { textFieldSx } from 'controls/Dialogs/fieldStyles';

const marginMap = { none: 0, dense: 1, normal: 2 };

const CustomTextField = ({
  errorMsg,
  label,
  id,
  name,
  required = false,
  fullWidth = true,
  margin = 'dense',
  ...props
}) => {
  const top = marginMap[margin] ?? 1;
  return (
    <ArgonBox mt={top} mb={1} width={fullWidth ? '100%' : 'auto'}>
      {label && (
        <FieldLabel htmlFor={id || name} required={required}>
          {label}
        </FieldLabel>
      )}
      <TextField
        id={id}
        name={name}
        fullWidth={fullWidth}
        error={!!errorMsg}
        helperText={errorMsg}
        required={required}
        sx={textFieldSx}
        {...props}
      />
    </ArgonBox>
  );
};

CustomTextField.propTypes = {
  errorMsg: PropTypes.string,
  label: PropTypes.node,
  id: PropTypes.string,
  name: PropTypes.string,
  required: PropTypes.bool,
  fullWidth: PropTypes.bool,
  margin: PropTypes.oneOf(['none', 'dense', 'normal']),
};

export default CustomTextField;