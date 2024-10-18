import React from 'react';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import { TableRow, TableBody as MuiTableBody } from '@mui/material';
import ArgonBox from 'components/ArgonBox';
import ArgonAvatar from 'components/ArgonAvatar';
import ArgonTypography from 'components/ArgonTypography';
import borders from 'assets/theme/base/borders';

const extractValue = (obj) => {
  return obj?.props?.children || obj?.props?.name || obj?.props?.description || '';
};

const TableBody = ({ columns, rows, sortedRows, selected, selectedField, handleRowSelection, page, rowsPerPage }) => {
  const { borderWidth } = borders;

  return (
    <MuiTableBody>
      {sortedRows
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map((row, index) => {
          const rowKey = row.id || uuidv4();

          const tableRow = columns
            .filter(({ name }) => name !== 'id')
            .map(({ name, align }) => {
              let template;

              if (Array.isArray(row[name])) {
                template = (
                  <ArgonBox
                    key={uuidv4()}
                    component="td"
                    p={1}
                    sx={({ palette: { light } }) => ({
                      borderBottom: row.hasBorder ? `${borderWidth[1]} solid ${light.main}` : null,
                    })}
                  >
                    <ArgonBox display="flex" alignItems="center" py={0.5} px={1}>
                      <ArgonBox mr={2}>
                        <ArgonAvatar src={row[name][0]} name={row[name][1]} variant="rounded" size="sm" />
                      </ArgonBox>
                      <ArgonTypography variant="button" fontWeight="medium" sx={{ width: 'max-content' }}>
                        {row[name][1]}
                      </ArgonTypography>
                    </ArgonBox>
                  </ArgonBox>
                );
              } else if (React.isValidElement(row[name])) {
                template = (
                  <ArgonBox
                    key={uuidv4()}
                    component="td"
                    p={1}
                    textAlign={align}
                    verticalalign="middle"
                    lineHeight={0.65}
                    sx={({ palette: { light } }) => ({
                      borderBottom: row.hasBorder ? `${borderWidth[1]} solid ${light.main}` : null,
                    })}
                  >
                    {row[name]}
                  </ArgonBox>
                );
              } else {
                template = (
                  <ArgonBox
                    key={uuidv4()}
                    component="td"
                    p={1}
                    textAlign={align}
                    verticalalign="middle"
                    lineHeight={0.65}
                    sx={({ palette: { light } }) => ({
                      borderBottom: row.hasBorder ? `${borderWidth[1]} solid ${light.main}` : null,
                    })}
                  >
                    <ArgonTypography
                      variant="button"
                      fontWeight="regular"
                      color="secondary"
                      sx={{ display: 'inline-block', width: 'max-content' }}
                    >
                      {extractValue(row[name])}
                    </ArgonTypography>
                  </ArgonBox>
                );
              }

              return template;
            });

          return (
            <TableRow
              key={rowKey}
              onClick={() => handleRowSelection(rowKey)}
              selected={selected === extractValue(row[selectedField])}
            >
              {tableRow}
            </TableRow>
          );
        })}
    </MuiTableBody>
  );
};

TableBody.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  sortedRows: PropTypes.arrayOf(PropTypes.object).isRequired,
  selected: PropTypes.string,
  selectedField: PropTypes.string.isRequired,
  handleRowSelection: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
};

export default TableBody;