import { useEffect, useState, useRef, useContext } from "react";
import { useTranslation } from 'react-i18next';
import { Name } from "controls/Tables/components/tableComponents";
import Icon from "@mui/material/Icon";
import ArgonButton from "components/ArgonButton";
import useRoleService from "services/roles";
import { LoadingContext } from 'LoadingContext';
import { toCamelCase } from 'utils/stringUtils';

function useRoleTableData(fetchData) {
  const { t } = useTranslation();
  const [data, setData] = useState({ columns: [], rows: [] });
  const [open, setOpen] = useState(false);
  const { setLoading } = useContext(LoadingContext);

  const hasLoaded = useRef(false);
  const { getRoles } = useRoleService();

  const handleOpen = () => {
    setOpen(true);
  };

  const buildTableData = (roles) => ({
    columns: [
      { name: "name", title:t('role.title'), align: "left" },
      { name: "action", title:t('generic.action'), align: "center" }
    ],
    rows: roles.map(role => ({
      name: <Name name={t(`roles.${toCamelCase(role.name)}`, { defaultValue: role.name })} />,
      action: (
        <ArgonButton 
            variant="text" 
            color="dark" 
            onClick={() => handleOpen(role)}>
          <Icon>assign</Icon>&nbsp;{t('generic.assign')}
        </ArgonButton>
      )
    })),
  });

  useEffect(() => {
    if (fetchData && !hasLoaded.current) {
      async function fetchData() {
        setLoading(true);
        const roles = await getRoles();
        setData(buildTableData(roles));
        hasLoaded.current = true;
        setLoading(false);
      }
      fetchData();
    }
  }, [fetchData]);

  return { 
    data, 
    open, 
    setOpen 
  };
}

export default useRoleTableData;