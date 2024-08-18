import { useEffect, useState, useRef, useContext } from "react";
import { NameDetail, Description, DescriptionDetail } from "controls/Tables/components/tableComponents";
import ArgonTypography from "components/ArgonTypography";
import ArgonBadge from "components/ArgonBadge";
import ArgonButton from "components/ArgonButton";
import useOperatorService from "services/operator";
import useCredentialService from "services/credential";
import useConnectivityService from "services/connectivity";
import { formatDateTime } from "utils/dateUtils";
import Icon from "@mui/material/Icon";
import logoJira from "assets/images/small-logos/logo-jira.svg";
import protocolTypes from 'layouts/manageadmin/data/protocolTypes';
import { handleDelete, handleSave } from "layouts/manageadmin/actions/operatorsActions";
import { handleSaveCredential, handleTestCredential } from "layouts/manageadmin/actions/credentialActions";
import { LoadingContext } from 'LoadingContext';

function useOperatorTableData(fetchData, handleEditClick, handleEditCredentialClick, handleDeleteClick) {
  const [data, setData] = useState({ columns: [], rows: [] });
  const [operators, setOperators] = useState([]);
  const [open, setOpen] = useState(false);
  const [openCredential, setOpenCredential] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [testMessage, setTestMessage] = useState("");
  const { setLoading } = useContext(LoadingContext);

  const hasLoaded = useRef(false);
  const { getOperatorsByCurrentAccount, updateOperator, createOperator, deleteOperator } = useOperatorService();
  const { getCredentialByOperator, createCredential, updateCredential } = useCredentialService();
  const { testConnectivity } = useConnectivityService();

  const onSave = async (operator) => {
    setLoading(true);
    await handleSave(
      operator, 
      operators, 
      setOperators, 
      setData, 
      buildTableData, 
      createOperator, 
      updateOperator, 
      protocolTypes);

      setOpen(false);
      setLoading(false);
  };

  const onDelete = async (operatorId) => {
    setLoading(true);
    await handleDelete(
      operatorId, 
      operators, 
      setOperators, 
      setData, 
      buildTableData, 
      deleteOperator);
      setConfirmOpen(false);
      setLoading(false);
  }

  const onSaveCredential = async (credential) => {
    setLoading(true);
    await handleSaveCredential(
      credential, 
      createCredential, 
      updateCredential);

      setOpenCredential(false);
      setLoading(false);
  };

  const handleOpen = (operator) => {
    handleEditClick(operator);
    setOpen(true);
  };

  const handleOpenCredential = async (operatorId) => {
    const credential = await getCredentialByOperator(operatorId) || { operatorId };
    handleEditCredentialClick(credential);
    setOpenCredential(true);
  };

  const handleOpenDelete = (operatorId) => {
    handleDeleteClick(operatorId);
    setConfirmOpen(true);
  };

  const onTestCredential = async (operatorId) => {
    setLoading(true);
    let result = await handleTestCredential(
      operatorId, 
      testConnectivity);
    setTestMessage(result ? "Test successful" : "Test failed");
    setTestOpen(true);
    setLoading(false);
  };

  const buildTableData = (operators) => ({
    columns: [
      { name: "name", title:"", align: "left" },
      { name: "description", title:"", align: "left" },
      { name: "address", title:"", align: "left" },
      { name: "contactname", title:"Contact Name", align: "left" },
      { name: "protocoltype", title:"Protocol", align: "center" },
      { name: "modified", title:"", align: "center" },
      { name: "action", title:"", align: "center" },
      { name: "credential", title:"", align: "center" },
      { name: "testcredential", title:"Test Credential", align: "center" }
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
          onClick={async() => await handleOpenCredential(operator.operatorId)}
        >
          Credentials
        </ArgonTypography>
      ),
      testcredential: (
        <>
            <ArgonButton 
                variant="text"
                color="dark" 
                onClick={async() => await onTestCredential(operator.operatorId)}>
              <Icon>check</Icon>
            </ArgonButton>
        </>
      )
    })),
  });

  useEffect(() => {
    if (fetchData && !hasLoaded.current) {
      async function fetchData() {
        setLoading(true);
        const operators = await getOperatorsByCurrentAccount();
        setOperators(operators);
        setData(buildTableData(operators));
        hasLoaded.current = true;
        setLoading(false);
      }
      fetchData();
    }
  }, [fetchData]);

  return { 
    data, 
    open, 
    openCredential, 
    confirmOpen,
    testOpen,
    testMessage,
    onSave, 
    onDelete, 
    onSaveCredential,
    setOpen, 
    setOpenCredential, 
    setConfirmOpen,
    setTestOpen };
}

export default useOperatorTableData;