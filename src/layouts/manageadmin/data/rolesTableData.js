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
import { Name } from "controls/Tables/components/tableComponents";
import Icon from "@mui/material/Icon";
import ArgonButton from "components/ArgonButton";
import useRoleService from "services/roles";
import { LoadingContext } from 'LoadingContext';
import { toCamelCase } from 'utils/stringUtils';
import { useAuth } from "AuthContext";

function useRoleTableData(fetchData, handleOpenClick) {
  const { t } = useTranslation();
  const [data, setData] = useState({ columns: [], rows: [] });
  const { setLoading } = useContext(LoadingContext);
  const { isAuthenticated } = useAuth();

  const hasLoaded = useRef(false);
  const { getRoles } = useRoleService();

  const handleOpen = (roleId) => {
    handleOpenClick(roleId);
  };

  const buildTableData = (roles) => ({
    columns: [
      { name: "name", title:t('role.title'), align: "left" },
      { name: "action", title:t('generic.action'), align: "center" },
      { name: "id" }
    ],
    rows: roles.map(role => ({
      name: <Name name={t(`roles.${toCamelCase(role.name)}`, { defaultValue: role.name })} />,
      action: (
        <ArgonButton 
            variant="text" 
            color="dark" 
            onClick={() => handleOpen(role.roleId)}>
          <Icon>assignment</Icon>&nbsp;{t('generic.assign')}
        </ArgonButton>
      ),
      id: role.roleId
    })),
  });

  useEffect(() => {
    if (fetchData && !hasLoaded.current && isAuthenticated) {
      async function fetchData() {
        setLoading(true);
        const roles = await getRoles();
        setData(buildTableData(roles));
        hasLoaded.current = true;
        setLoading(false);
      }
      fetchData();
    }
  }, [fetchData, isAuthenticated]);

  return { 
    data
  };
}

export default useRoleTableData;