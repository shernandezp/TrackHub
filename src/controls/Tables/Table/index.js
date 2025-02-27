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

import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Table as MuiTable, TableContainer } from '@mui/material';
import TableHeader from './TableHeader';
import TableBody from './TableBody';
import TablePagination from './TablePagination';

const extractValue = (obj) => {
  return obj?.props?.children || obj?.props?.name || obj?.props?.description || '';
};

function Table({ 
    columns = [], 
    rows = [{}], 
    selected = null, 
    selectedField = 'name', 
    handleSelected = () => {}, 
    searchQuery = '' }) {
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

  const filteredRows = useMemo(() => {
    if (searchQuery) {
      return rows.filter(row => 
        columns.some(column => 
          extractValue(row[column.name]).toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    return rows;
  }, [rows, columns, searchQuery]);

  const sortedRows = useMemo(() => {
    if (orderBy) {
      return [...filteredRows].sort((a, b) => {
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
    return filteredRows;
  }, [filteredRows, order, orderBy]);

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
      {filteredRows.length > 10 && (
        <TablePagination
          count={filteredRows.length}
          page={page}
          rowsPerPage={rowsPerPage}
          handleChangePage={handleChangePage}
          handleChangeRowsPerPage={handleChangeRowsPerPage}
        />
      )}
    </TableContainer>
  );
}

Table.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.object),
  rows: PropTypes.arrayOf(PropTypes.object),
  selected: PropTypes.string,
  selectedField: PropTypes.string,
  handleSelected: PropTypes.func,
  searchQuery: PropTypes.string,
};

export default Table;