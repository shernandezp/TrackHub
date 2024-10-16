import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { Name, Description } from "controls/Tables/components/tableComponents";
import ArgonTypography from "components/ArgonTypography";
import Icon from "@mui/material/Icon";
import ArgonButton from "components/ArgonButton";
import { formatDateTime } from "utils/dateUtils";

function useTransportersTableData(transporters) {
  const { t } = useTranslation();
  const [data, setData] = useState({ columns: [], rows: [] });

  const buildTableData = (transporters) => ({
    columns: [
      { name: "status", title:t('transporterMap.status'), align: "center" },
      { name: "name", title:t('transporterMap.name'), align: "left" },
      { name: "datetime", title:t('transporterMap.dateTime'), align: "left" },
      { name: "location", title:t('transporterMap.address'), align: "left" }
    ],
    rows: transporters.map(transporter => ({
      status: (
        <ArgonButton variant="outlined" color={transporter.speed > 0 ? 'success' : 'error'} size="xsmall" iconOnly circular>
          <Icon sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>{transporter.speed > 0 ? 'radio_button_checked' : 'radio_button_unchecked'}</Icon>
        </ArgonButton>
        ),
      name: <Name name={transporter.deviceName} />,
      datetime: (
        <ArgonTypography variant="caption" color="secondary" fontWeight="medium">
          {formatDateTime(transporter.deviceDateTime)}
        </ArgonTypography>
      ),
      location: <Description description={transporter.address} />
    })),
  });

  useEffect(() => {
      function fetchData() {
        if (transporters) {
          setData(buildTableData(transporters));
        }
      }
      fetchData();
  }, [transporters]);

  return { 
    data
  };
}

export default useTransportersTableData;