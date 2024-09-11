import { useEffect, useState, useRef, useContext } from "react";
import { useTranslation } from 'react-i18next';
import { Name } from "controls/Tables/components/tableComponents";
import Icon from "@mui/material/Icon";
import ArgonButton from "components/ArgonButton";
import usePolicyService from "services/policies";
import { LoadingContext } from 'LoadingContext';
import { toCamelCase } from 'utils/stringUtils';

function usePolicyTableData(fetchData, handleOpenClick) {
  const { t } = useTranslation();
  const [data, setData] = useState({ columns: [], rows: [] });
  const { setLoading } = useContext(LoadingContext);

  const hasLoaded = useRef(false);
  const { getPolicies } = usePolicyService();

  const handleOpen = (policyId) => {
    handleOpenClick(policyId);
  };

  const buildTableData = (policies) => ({
    columns: [
      { name: "name", title:t('policy.title'), align: "left" },
      { name: "action", title:t('generic.action'), align: "center" }
    ],
    rows: policies.map(policy => ({
      name: <Name name={t(`policies.${toCamelCase(policy.name)}`, { defaultValue: policy.name })} />,
      action: (
        <ArgonButton 
            variant="text" 
            color="dark" 
            onClick={() => handleOpen(policy.policyId)}>
          <Icon>assignment</Icon>&nbsp;{t('generic.assign')}
        </ArgonButton>
      )
    })),
  });

  useEffect(() => {
    if (fetchData && !hasLoaded.current) {
      async function fetchData() {
        setLoading(true);
        const policies = await getPolicies();
        setData(buildTableData(policies));
        hasLoaded.current = true;
        setLoading(false);
      }
      fetchData();
    }
  }, [fetchData]);

  return { 
    data
  };
}

export default usePolicyTableData;