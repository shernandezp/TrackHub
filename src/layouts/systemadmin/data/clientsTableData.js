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
import { Name, Description } from "controls/Tables/components/tableComponents";
import Icon from "@mui/material/Icon";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";
import useClientService from "services/clients";
import useUserService from "services/users";
import { handleSave, handleDelete } from "layouts/systemadmin/actions/clientsActions";
import { formatDateTime } from "utils/dateUtils";
import { LoadingContext } from 'LoadingContext';
import { getStringValue } from 'utils/booleanUtils';

function useClientsTableData(fetchData, handleEditClick, handleDeleteClick) {
  const { t } = useTranslation();
  const [data, setData] = useState({ columns: [], rows: [] });
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { setLoading } = useContext(LoadingContext);

  const hasLoaded = useRef(false);
  const { getClients, createClient, updateClient, deleteClient } = useClientService();
  const { getUsers } = useUserService();

  const onSave = async (client) => {
    setLoading(true);
    try {
      await handleSave(
        client, 
        clients, 
        setClients, 
        setData, 
        buildTableData, 
        createClient, 
        updateClient,
        users);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (clientId) => {
    setLoading(true);
    try {
      await handleDelete(
        clientId, 
        clients, 
        setClients, 
        setData, 
        buildTableData, 
        deleteClient);
        setConfirmOpen(false);
      } finally {
        setLoading(false);
      }
  }

  const handleOpen = (client) => {
    handleEditClick(client);
    setOpen(true);
  };

  const handleOpenDelete = (clientId) => {
    handleDeleteClick(clientId);
    setConfirmOpen(true);
  };

  const buildTableData = (clients) => ({
    columns: [
      { name: "name", title:t('clients.name'), align: "left" },
      { name: "description", title:t('clients.description'), align: "left" },
      { name: "secret", title:t('clients.type'), align: "center" },
      { name: "processed", title:t('clients.processed'), align: "center" },
      { name: "modified", title:t('generic.modified'), align: "center" },
      { name: "action", title:t('generic.action'), align: "center" },
      { name: "id" }
    ],
    rows: clients.map(client => ({
      name: <Name name={client.name} />,
      description: <Description description={client.description} />,
      secret: <Description description={client.secret} />,
      processed: <Description description={t(`generic.${getStringValue(client.processed)}`)} />,
      modified: (
        <ArgonTypography variant="caption" color="secondary" fontWeight="medium">
          {formatDateTime(client.lastModified)}
        </ArgonTypography>
      ),
      action: (
        <>
          <ArgonButton 
              variant="text" 
              color="dark" 
              onClick={() => handleOpen(client)}>
            <Icon>edit</Icon>&nbsp;{t('generic.edit')}
          </ArgonButton>
          <ArgonButton 
            variant="text" 
            color="error"
            onClick={() => handleOpenDelete(client.clientId)}>
            <Icon>delete</Icon>&nbsp;{t('generic.delete')}
          </ArgonButton>
        </>
      ),
      id: client.clientId
    })),
  });

  useEffect(() => {
    if (fetchData && !hasLoaded.current) {
      async function fetchData() {
        setLoading(true);
        const users = await getUsers();
        const output = users.map(user => ({
          value: user.userId,
          label: user.emailAddress
        }));
        setUsers(output);
        const clients = await getClients();
        setClients(clients);
        setData(buildTableData(clients));
        hasLoaded.current = true;
        setLoading(false);
      }
      fetchData();
    }
  }, [fetchData]);

  return { 
    data,
    users,
    open,
    confirmOpen,
    onSave,
    onDelete,
    setOpen,
    setConfirmOpen};
}

export default useClientsTableData;