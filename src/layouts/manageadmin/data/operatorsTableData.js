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
import { handleDelete, handleSave } from "layouts/manageadmin/actions/operatorsActions";

function useOperatorTableData(fetchData, handleEditClick, handleDeleteClick) {
  const [data, setData] = useState({ columns: [], rows: [] });
  const [operators, setOperators] = useState([]);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const hasLoaded = useRef(false);
  const { getOperatorsByCurrentAccount, updateOperator, createOperator, deleteOperator } = useOperatorService();

  const onSave = async (operator) => {
    await handleSave(
      operator, 
      operators, 
      setOperators, 
      setData, 
      buildTableData, 
      createOperator, 
      updateOperator, 
      protocolTypes);
  };

  const onDelete = (operatorId) => {
    handleDelete(
      operatorId, 
      operators, 
      setOperators, 
      setData, 
      buildTableData, 
      deleteOperator);
  }

  const handleOpen = (operator) => {
    handleEditClick(operator);
    setOpen(true);
  };

  const handleOpenDelete = (operatorId) => {
    handleDeleteClick(operatorId);
    setConfirmOpen(true);
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
            <ArgonButton 
              variant="text" 
              color="error"
              onClick={() => handleOpenDelete(operator.operatorId)}>
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

  return { data, open, confirmOpen, onSave, onDelete, setOpen, setConfirmOpen };
}

export default useOperatorTableData;