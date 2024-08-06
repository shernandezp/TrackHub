import TextField from '@mui/material/TextField';
import { styled } from '@mui/system';

const CustomTextField = styled(TextField)({
  '& .MuiInputBase-input': {
    width: '100% !important',
  },
});

export default CustomTextField;