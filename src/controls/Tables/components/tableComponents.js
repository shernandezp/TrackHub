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