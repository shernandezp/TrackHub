/**
* Copyright (c) 2024 Sergio Hernandez. All rights reserved.
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

/* eslint-disable react/prop-types */

import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';

function Name({ name }) {
  return (
    <ArgonBox display="flex" alignItems="center">
      <ArgonBox display="flex" flexDirection="column">
        <ArgonTypography variant="button" fontWeight="medium">
          {name}
        </ArgonTypography>
      </ArgonBox>
    </ArgonBox>
  );
}

function NameDetail({ name, detail, image }) {
  return (
    <ArgonBox display="flex" alignItems="center" px={1} py={0.5}>
      {image && <ArgonBox component="img" src={image} alt={name} width="10%" mr={2} />}
      <ArgonBox display="flex" flexDirection="column">
        <ArgonTypography variant="button" fontWeight="medium">
          {name}
        </ArgonTypography>
        <ArgonTypography variant="caption" color="secondary">
          {detail}
        </ArgonTypography>
      </ArgonBox>
    </ArgonBox>
  );
}

function Description({ description }) {
  return (
    <ArgonBox display="flex" flexDirection="column" px={1} py={0.5}>
      <ArgonTypography variant="caption" fontWeight="medium" color="text">
        {description}
      </ArgonTypography>
    </ArgonBox>
  );
}

function DescriptionDetail({ description, detail }) {
  return (
    <ArgonBox display="flex" flexDirection="column">
      <ArgonTypography variant="caption" fontWeight="medium" color="text">
        {description}
      </ArgonTypography>
      <ArgonTypography variant="caption" color="secondary">
        {detail}
      </ArgonTypography>
    </ArgonBox>
  );
}

export { Name, NameDetail, Description, DescriptionDetail };