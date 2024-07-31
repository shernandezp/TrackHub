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

function Description({ description }) {
  return (
    <ArgonBox display="flex" flexDirection="column" px={1} py={0.5}>
      <ArgonTypography variant="caption" fontWeight="medium" color="text">
        {description}
      </ArgonTypography>
    </ArgonBox>
  );
}

export { Name, Description };