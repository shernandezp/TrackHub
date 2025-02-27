/**
* Copyright (c) 2025 Sergio Hernandez. All rights reserved.
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

import { useEffect, useState, useRef, useContext } from "react";
import { useTranslation } from 'react-i18next';
import { NameDetail, Description, DescriptionDetail } from "controls/Tables/components/tableComponents";
import Icon from "@mui/material/Icon";
import protocolTypes from 'data/protocolTypes';
import ArgonTypography from "components/ArgonTypography";
import ArgonBadge from "components/ArgonBadge";
import ArgonButton from "components/ArgonButton";
import useOperatorService from "services/operator";
import useCredentialService from "services/credential";
import useRouterService from "services/router";
import { formatDateTime } from "utils/dateUtils";
import { handleDelete, handleSave } from "layouts/manageadmin/actions/operatorsActions";
import { handleSaveCredential, handleTestCredential } from "layouts/manageadmin/actions/credentialActions";
import { LoadingContext } from 'LoadingContext';
import { useAuth } from "AuthContext";

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
  const { isAuthenticated } = useAuth();

  const hasLoaded = useRef(false);
  const { getOperatorsByCurrentAccount, updateOperator, createOperator, deleteOperator } = useOperatorService();
  const { getCredentialByOperator, createCredential, updateCredential } = useCredentialService();
  const { testConnectivity } = useRouterService();

  const onSave = async (operator) => {
    setLoading(true);
    try {
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
      } finally {
        setLoading(false);
      }
  };

  const onDelete = async (operatorId) => {
    setLoading(true);
    try {
      await handleDelete(
        operatorId, 
        operators, 
        setOperators, 
        setData, 
        buildTableData, 
        deleteOperator);
        setConfirmOpen(false);
      } finally {
        setLoading(false);
      }
  }

  const onSaveCredential = async (credential) => {
    setLoading(true);
    try {
      await handleSaveCredential(
        credential, 
        createCredential, 
        updateCredential);
        setOpenCredential(false);
      } finally {
        setLoading(false);
      }
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
    try {
      let result = await handleTestCredential(
        operatorId, 
        testConnectivity);
      setTestMessage(result ? t('credential.testSuccess') : t('credential.testError'));
      setTestOpen(true);
    } finally {
      setLoading(false);
    }
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
      { name: "testcredential", title:t('credential.testCredential'), align: "center" },
      { name: "id" }
    ],
    rows: operators.map(operator => ({
      name: <NameDetail name={operator.name} detail={operator.emailAddress} />,
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
      ),
      id: operator.operatorId
    })),
  });

  useEffect(() => {
    if (fetchData && !hasLoaded.current && isAuthenticated) {
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
  }, [fetchData, isAuthenticated]);

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