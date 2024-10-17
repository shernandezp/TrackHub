import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import TablePaginationStyle from 'controls/Tables/styles/TablePagination';

const TablePagination = ({ count, page, rowsPerPage, handleChangePage, handleChangeRowsPerPage }) => {
  return (
    <Box sx={{ width: 'fit-content', margin: 'auto' }}>
      <TablePaginationStyle
        component="div"
        count={count}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
};

TablePagination.propTypes = {
  count: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  handleChangePage: PropTypes.func.isRequired,
  handleChangeRowsPerPage: PropTypes.func.isRequired,
};

export default TablePagination;