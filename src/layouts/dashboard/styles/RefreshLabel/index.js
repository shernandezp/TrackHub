import { styled } from '@mui/system';

const RefreshLabelStyle = styled('div')({
  position: 'relative',
  '& .label': {
    position: 'absolute',
    top: 8,
    right: 8,
    background: 'white',
    padding: '5px 8px',
    borderRadius: '15px',
    border: '1px solid #ccc',
    zIndex: 1000
  },
});

export default RefreshLabelStyle;