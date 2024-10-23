import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import transporterTypes from 'data/transporterTypes';
import { useTranslation } from 'react-i18next';

function TransporterList({ title, positions }) {
  const [types, setTypes] = useState([]);
  const { t } = useTranslation();

  useEffect(() => {
    function fetchData() {
      const typesObject = positions.reduce((acc, position) => {
        if (!acc[position.transporterType]) {
          const transporterType = transporterTypes.find(t => t.label === position.transporterType);
          const icon = transporterType ? transporterType.icon : 'unknown_5';
          acc[position.transporterType] = { name: position.transporterType, total: 0, moving: 0, icon };
        }
        acc[position.transporterType].total += 1;
        if (position.speed > 0) {
          acc[position.transporterType].moving += 1;
        }
        return acc;
      }, {});
      setTypes(Object.values(typesObject));
    }
    fetchData();
  }, [positions]);

  const renderItems = types.map(({ icon, name, total, moving }, key) => (
    <ArgonBox
      key={name}
      component="li"
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      borderRadius="lg"
      py={1}
      pr={2}
      mb={types.length - 1 === key ? 0 : 1}
    >
      <ArgonBox display="flex" alignItems="center">
        <ArgonBox
          display="grid"
          alignItems="center"
          justifyContent="center"
          bgColor='dark'
          borderRadius="lg"
          shadow="md"
          color="white"
          width="2rem"
          height="2rem"
          mr={2}
          variant="gradient"
        >
          <Icon
            sx={{
              display: "grid",
              placeItems: "center",
            }}
          >
            {icon}
          </Icon>
        </ArgonBox>
        <ArgonBox display="flex" flexDirection="column">
          <ArgonTypography variant="button" color='dark' fontWeight="medium" gutterBottom>
            {t(`transporterTypes.${name.toLowerCase()}`)}
          </ArgonTypography>
          <ArgonTypography variant="caption" color="text">
              {`${t('dashboard.totalTitle')}: ${total}, `}
            <ArgonTypography variant="caption" color="text" fontWeight="medium">
              {`${t('dashboard.movementTitle')}: ${moving}`}
            </ArgonTypography>
          </ArgonTypography>
        </ArgonBox>
      </ArgonBox>
    </ArgonBox>
  ));

  return (
    <Card>
      <ArgonBox pt={2} px={2}>
        <ArgonTypography variant="h6" fontWeight="medium" textTransform="capitalize">
          {title}
        </ArgonTypography>
      </ArgonBox>
      <ArgonBox p={2}>
        <ArgonBox component="ul" display="flex" flexDirection="column" p={0} m={0}>
          {renderItems}
        </ArgonBox>
      </ArgonBox>
    </Card>
  );
}

// Typechecking props for the CategoriesList
TransporterList.propTypes = {
  title: PropTypes.string.isRequired,
  positions: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default TransporterList;
