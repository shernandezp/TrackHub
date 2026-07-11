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
import {Name, Description} from "controls/Tables/components/tableComponents";
import ArgonTypography from "components/ArgonTypography";
import ArgonBadge from "components/ArgonBadge";
import ArgonButton from "components/ArgonButton";
import Icon from "@mui/material/Icon";
import useAccountService from "services/account";
import { formatDateTime } from "utils/dateUtils";
import { handleSave } from "layouts/manageadmin/actions/accountActions";
import { LoadingContext } from 'LoadingContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from "AuthContext";

function useAccountTableData(fetchData, handleEditClick) {
  const { t } = useTranslation();
  const [data, setData] = useState({ columns: [], rows: [] });
  const [accounts, setAccounts] = useState([]);
  const [open, setOpen] = useState(false);
  const hasLoaded = useRef(false);
  const { getAccountByUser, updateAccount } = useAccountService();
  const { setLoading } = useContext(LoadingContext);
  const { isAuthenticated } = useAuth();

  const onSave = (account) => {
    setLoading(true);
    try{
      handleSave(account, 
        accounts, 
        setAccounts, 
        setData, 
        buildTableData, 
        updateAccount);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  const handleOpen = (account) => {
    handleEditClick(account);
    setOpen(true);
  };

  const buildTableData = (accounts) => ({
    columns: [
      { name: "name", title:t('account.name'), align: "left" },
      { name: "description", title:t('account.description'), align: "left" },
      { name: "type", title:t('account.type'), align: "center" },
      { name: "modified", title:t('generic.modified'), align: "center" },
      { name: "action", title:t('generic.action'), align: "center" },
      { name: "id" }
    ],
    rows: accounts.map(account => ({
      name: <Name name={account.name} />,
      description: <Description description={account.description} />,
      type: (
        <ArgonBadge variant="gradient" badgeContent={account.type} color="success" size="xs" container />
      ),
      modified: (
        <ArgonTypography variant="caption" color="secondary" fontWeight="medium">
          {formatDateTime(account.lastModified)}
        </ArgonTypography>
      ),
      action: (
        <ArgonButton 
            variant="text" 
            color="dark" 
            onClick={() => handleOpen(account)}>
          <Icon>edit</Icon>&nbsp;{t('generic.edit')}
        </ArgonButton>
      ),
      id: account.accountId
    })),
  });

  useEffect(() => {
    if (fetchData && !hasLoaded.current && isAuthenticated) {
      async function fetchData() {
        setLoading(true);
        const account = await getAccountByUser();
        const accounts = [account];
        setAccounts(accounts);
        setData(buildTableData(accounts));
        hasLoaded.current = true;
        setLoading(false);
      }
      fetchData();
    }
  }, [fetchData, isAuthenticated]);

  return { data, open, onSave, setOpen };
}

export default useAccountTableData;