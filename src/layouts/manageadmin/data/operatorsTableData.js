import { useEffect, useState, useRef } from "react";
import { NameDetail, Description, DescriptionDetail } from "controls/Tables/components/tableComponents";
import ArgonTypography from "components/ArgonTypography";
import ArgonBadge from "components/ArgonBadge";
import ArgonButton from "components/ArgonButton";
import useOperatorService from "services/operator";
import { formatDateTime } from "utils/dateUtils";
import Icon from "@mui/material/Icon";
import logoJira from "assets/images/small-logos/logo-jira.svg";
import protocolTypes from 'layouts/manageadmin/data/protocolTypes';

function useOperatorTableData(fetchData, handleRowClick) {
  const [data, setData] = useState({ columns: [], rows: [] });
  const [operators, setOperators] = useState([]);
  const [open, setOpen] = useState(false);
  const hasLoaded = useRef(false);
  const { getOperatorsByCurrentAccount, updateOperator } = useOperatorService();

  const handleSave = async (operator) => {
    let response = await updateOperator(operator.operatorId, operator);
    if (response) {
      const selectedProtocolType = protocolTypes.find(pt => pt.value === operator.protocolTypeId);
      operator.protocolType = selectedProtocolType.label;
      const updatedOperators = [...operators];
      const index = updatedOperators.findIndex(a => a.operatorId === operator.operatorId);
      updatedOperators[index] = operator;
      setOperators(updatedOperators);
      setData(buildTableData(updatedOperators));
    }
  };

  const handleOpen = (operator) => {
    handleRowClick(operator);
    setOpen(true);
  };

  const buildTableData = (operators) => ({
    columns: [
      { name: "name", align: "left" },
      { name: "description", align: "left" },
      { name: "address", align: "left" },
      { name: "contactname", align: "left" },
      { name: "protocoltype", align: "center" },
      { name: "modified", align: "center" },
      { name: "action", align: "center" },
      { name: "credential", align: "center" },
    ],
    rows: operators.map(operator => ({
      name: <NameDetail name={operator.name} detail={operator.emailAddress} image={logoJira} />,
      description: <Description description={operator.description} />,
      address: <DescriptionDetail description={operator.address} detail={operator.phoneNumber} />,
      contactname: <Description description={operator.contactName} />,
      protocoltype: (
        <ArgonBadge variant="gradient" badgeContent={operator.protocolType} color="success" size="xs" container />
      ),
      modified: (
        <ArgonTypography variant="caption" color="secondary" fontWeight="medium">
          {formatDateTime(operator.lastModified)}
        </ArgonTypography>
      ),
      action: (
        <>
            <ArgonButton 
                variant="text" 
                color="dark" 
                onClick={() => handleOpen(operator)}>
              <Icon>edit</Icon>&nbsp;Edit
            </ArgonButton>
            <ArgonButton variant="text" color="error">
              <Icon>delete</Icon>&nbsp;Delete
            </ArgonButton>
        </>
      ),
      credential: (
        <ArgonTypography
          component="a"
          href="#"
          variant="caption"
          color="secondary"
          fontWeight="medium"
        >
          Update
        </ArgonTypography>
      ),
    })),
  });

  useEffect(() => {
    if (fetchData && !hasLoaded.current) {
      async function fetchData() {
        const operators = await getOperatorsByCurrentAccount();
        setOperators(operators);
        setData(buildTableData(operators));
        hasLoaded.current = true;
      }
      fetchData();
    }
  }, [fetchData]);

  return { data, open, handleSave, setOpen };
}

export default useOperatorTableData;