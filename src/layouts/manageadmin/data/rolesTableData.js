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