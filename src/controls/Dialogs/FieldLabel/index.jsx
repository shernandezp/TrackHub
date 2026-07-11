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
import ArgonTypography from 'components/ArgonTypography';

const FieldLabel = ({ htmlFor, required = false, children }) => (
  <ArgonTypography
    component="label"
    htmlFor={htmlFor}
    variant="caption"
    fontWeight="bold"
    color="dark"
    sx={{ display: 'block', mb: 0.5, lineHeight: 1.2 }}
  >
    {children}
    {required && <span aria-hidden="true" style={{ marginLeft: 2 }}>*</span>}
  </ArgonTypography>
);

FieldLabel.propTypes = {
  htmlFor: PropTypes.string,
  required: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

export default FieldLabel;
