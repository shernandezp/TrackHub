/**
* Copyright (c) 2026 Sergio Hernandez. All rights reserved.
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

import PropTypes from 'prop-types';
import Card from '@mui/material/Card';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';

function StatCard({ label, value }) {
  return (
    <Card sx={{ height: '100%' }}>
      <ArgonBox p={2} display="flex" flexDirection="column" justifyContent="space-between" height="100%">
        <ArgonTypography
          variant="caption"
          color="secondary"
          fontWeight="medium"
          textTransform="uppercase"
          sx={{ letterSpacing: 0.5, lineHeight: 1.3 }}
        >
          {label}
        </ArgonTypography>
        <ArgonTypography variant="h4" fontWeight="bold" mt={0.5}>
          {value ?? '-'}
        </ArgonTypography>
      </ArgonBox>
    </Card>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
};

export default StatCard;
