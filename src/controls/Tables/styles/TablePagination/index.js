import { styled } from '@mui/system';
import TablePagination from '@mui/material/TablePagination';

const TablePaginationStyle = styled(TablePagination)({
    '& .MuiInputBase-root': {
      width: 'auto !important',
    },
    '& .MuiTablePagination-select': {
      width: 'auto !important',
      minWidth: 'auto !important'
    },
  });

export default TablePaginationStyle;