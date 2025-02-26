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

import React from 'react';
import PropTypes from 'prop-types';
import ArgonBox from 'components/ArgonBox';
import typography from 'assets/theme/base/typography';
import borders from 'assets/theme/base/borders';
import { TableRow } from '@mui/material';

const TableHeader = ({ columns, orderBy, order, handleSort }) => {
  const { size, fontWeightBold } = typography;
  const { borderWidth } = borders;

  return (
    <ArgonBox component="thead">
      <TableRow>
        {columns
          .filter(({ name }) => name !== 'id') // Hide the id column
          .map(({ name, title, align, width }, key) => {
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
                onClick={() => handleSort(name)}
                style={{ cursor: 'pointer' }}
              >
                {(title || name).toUpperCase()}
              </ArgonBox>
            );
          })}
      </TableRow>
    </ArgonBox>
  );
};

TableHeader.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  orderBy: PropTypes.string.isRequired,
  order: PropTypes.string.isRequired,
  handleSort: PropTypes.func.isRequired,
};

export default TableHeader;