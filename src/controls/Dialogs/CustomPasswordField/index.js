import TextField from '@mui/material/TextField';
import { styled } from '@mui/system';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useState } from 'react';

const CustomPasswordField = styled(({ errorMsg, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  return (
    <TextField
      type={showPassword ? 'text' : 'password'}
      error={!!errorMsg}
      helperText={errorMsg}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label="toggle password visibility"
              onClick={handleClickShowPassword}
              onMouseDown={handleMouseDownPassword}
            >
              {showPassword ? <Visibility /> : <VisibilityOff />}
            </IconButton>
          </InputAdornment>
        ),
      }}
      {...props}
    />
  );
})({
  '& .MuiInputBase-input': {
    width: '100% !important',
  },
  '& .MuiFormLabel-root': {
    position: 'relative !important',
    top: '10px',
  },
});

export default CustomPasswordField;