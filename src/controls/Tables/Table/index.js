/**
=========================================================
* Argon Dashboard 2 MUI - v3.0.1
=========================================================

* Product Page: https://www.creative-tim.com/product/argon-dashboard-material-ui
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useMemo, useState } from "react";

// prop-types is a library for typechecking of props
import PropTypes from "prop-types";

// uuid is a library for generating unique id
import { v4 as uuidv4 } from "uuid";

// @mui material components
import { Table as MuiTable } from "@mui/material";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Box from '@mui/material/Box';

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonAvatar from "components/ArgonAvatar";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI base styles
import typography from "assets/theme/base/typography";
import borders from "assets/theme/base/borders";
import TablePaginationStyle from 'controls/Tables/styles/TablePagination';

function Table({ columns = [], rows = [{}], handleSelected = () => {} }) {
  const { size, fontWeightBold } = typography;
  const { borderWidth } = borders;

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState(null);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSelect = (event, name) => {
    setSelected(name);
    const selectedRow = rows.find((row, index) => `row-${index}` === name);
    handleSelected(selectedRow);
  };

  return useMemo(() => {
    const renderColumns = columns.map(({ name, title, align, width }, key) => {
      let pl;
      let pr;

      if (key === 0) {
        pl = 3;
        pr = 3;
      } else if (key === columns.length - 1) {
        pl = 3;
        pr = 3;
      } else {
        pl = 1;
        pr = 1;
      }

      return (
        <ArgonBox
          key={name}
          component="th"
          width={width || 'auto'}
          pt={1.5}
          pb={1.25}
          pl={align === 'left' ? pl : 3}
          pr={align === 'right' ? pr : 3}
          textAlign={align}
          fontSize={size.xxs}
          fontWeight={fontWeightBold}
          color="secondary"
          opacity={0.7}
          sx={({ palette: { light } }) => ({ borderBottom: `${borderWidth[1]} solid ${light.main}` })}
        >
          {(title || name).toUpperCase()}
        </ArgonBox>
      );
    });

    const renderRows = rows
      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      .map((row, key) => {
        const rowKey = `row-${key}`;

        const tableRow = columns.map(({ name, align }) => {
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
                  {row[name]}
                </ArgonTypography>
              </ArgonBox>
            );
          }

          return template;
        });

        return (
          <TableRow
            key={rowKey}
            onClick={(event) => handleSelect(event, rowKey)}
            selected={selected === rowKey}
          >
            {tableRow}
          </TableRow>
        );
      });

    return (
      <TableContainer>
        <MuiTable>
          <ArgonBox component="thead">
            <TableRow>{renderColumns}</TableRow>
          </ArgonBox>
          <TableBody>{renderRows}</TableBody>
        </MuiTable>
        <Box sx={{ width: 'fit-content', margin: 'auto' }}>
          <TablePaginationStyle
            component="div"
            count={rows.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Box>
      </TableContainer>
    );
  }, [columns, rows, page, rowsPerPage, selected]);
}

Table.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.object),
  rows: PropTypes.arrayOf(PropTypes.object),
  handleSelected: PropTypes.func
};

export default Table;