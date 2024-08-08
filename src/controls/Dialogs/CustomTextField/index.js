import TextField from '@mui/material/TextField';
import { styled } from '@mui/system';

const CustomTextField = styled(TextField)({
  '& .MuiInputBase-input': {
    width: '100% !important',
  },
  '& .MuiFormLabel-root': {
    position: 'relative !important',
    top: '10px',
  },
});

export default CustomTextField;