import { useEffect, useState, useRef, useContext } from "react";
import { useTranslation } from 'react-i18next';
import { NameDetail, Description, DescriptionDetail } from "controls/Tables/components/tableComponents";
import Icon from "@mui/material/Icon";
import logoJira from "assets/images/small-logos/logo-jira.svg";
import protocolTypes from 'layouts/manageadmin/data/protocolTypes';
import ArgonTypography from "components/ArgonTypography";
import ArgonBadge from "components/ArgonBadge";
import ArgonButton from "components/ArgonButton";
import useOperatorService from "services/operator";
import useCredentialService from "services/credential";
import useConnectivityService from "services/connectivity";
import { formatDateTime } from "utils/dateUtils";
import { handleDelete, handleSave } from "layouts/manageadmin/actions/operatorsActions";
import { handleSaveCredential, handleTestCredential } from "layouts/manageadmin/actions/credentialActions";
import { LoadingContext } from 'LoadingContext';

function useOperatorTableData(fetchData, handleEditClick, handleEditCredentialClick, handleDeleteClick) {
  const { t } = useTranslation();
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
    setTestMessage(result ? t('credential.testSuccess') : t('credential.testError'));
    setTestOpen(true);
    setLoading(false);
  };

  const buildTableData = (operators) => ({
    columns: [
      { name: "name", title:t('operator.name'), align: "left" },
      { name: "description", title:t('operator.description'), align: "left" },
      { name: "address", title:t('generic.address'), align: "left" },
      { name: "contactname", title:t('operator.contactName'), align: "left" },
      { name: "protocoltype", title:t('operator.type'), align: "center" },
      { name: "modified", title:t('generic.modified'), align: "center" },
      { name: "action", title:t('generic.action'), align: "center" },
      { name: "credential", title:t('credential.title'), align: "center" },
      { name: "testcredential", title:t('credential.testCredential'), align: "center" }
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
              <Icon>edit</Icon>&nbsp;{t('generic.edit')}
            </ArgonButton>
            <ArgonButton 
              variant="text" 
              color="error"
              onClick={() => handleOpenDelete(operator.operatorId)}>
              <Icon>delete</Icon>&nbsp;{t('generic.delete')}
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
          {t('credential.title')}
        </ArgonTypography>
      ),
      testcredential: (
        <ArgonButton 
            variant="text"
            color="dark" 
            onClick={async() => await onTestCredential(operator.operatorId)}>
          <Icon>check</Icon>
        </ArgonButton>
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