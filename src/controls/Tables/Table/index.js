import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Table as MuiTable, TableContainer } from '@mui/material';
import TableHeader from './TableHeader';
import TableBody from './TableBody';
import TablePagination from './TablePagination';

const extractValue = (obj) => {
  return obj?.props?.children || obj?.props?.name || obj?.props?.description || '';
};

function Table({ columns = [], rows = [{}], selected = null, selectedField = 'name', handleSelected = () => {} }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('');

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRowSelection = (rowKey) => {
    const selectedRow = rows.find((row) => row.id === rowKey);
    const selectedValue = extractValue(selectedRow[selectedField]);
    if (selected === selectedValue) {
      handleSelected(null);
    } else {
      handleSelected(selectedValue);
    }
  };

  const handleSort = (columnName) => {
    const isAsc = orderBy === columnName && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnName);
  };

  const sortedRows = useMemo(() => {
    if (orderBy) {
      return [...rows].sort((a, b) => {
        const aValue = extractValue(a[orderBy]);
        const bValue = extractValue(b[orderBy]);
        if (aValue < bValue) {
          return order === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return order === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return rows;
  }, [rows, order, orderBy]);

  return (
    <TableContainer>
      <MuiTable>
        <TableHeader columns={columns} orderBy={orderBy} order={order} handleSort={handleSort} />
        <TableBody
          columns={columns}
          rows={rows}
          sortedRows={sortedRows}
          selected={selected}
          selectedField={selectedField}
          handleRowSelection={handleRowSelection}
          page={page}
          rowsPerPage={rowsPerPage}
        />
      </MuiTable>
      <TablePagination
        count={rows.length}
        page={page}
        rowsPerPage={rowsPerPage}
        handleChangePage={handleChangePage}
        handleChangeRowsPerPage={handleChangeRowsPerPage}
      />
    </TableContainer>
  );
}

Table.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.object),
  rows: PropTypes.arrayOf(PropTypes.object),
  selected: PropTypes.string,
  selectedField: PropTypes.string,
  handleSelected: PropTypes.func,
};

export default Table;