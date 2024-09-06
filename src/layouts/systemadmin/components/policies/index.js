import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PolicyAssignmentTable from 'layouts/systemadmin/components/policies/PolicyAssignmentTable';
import TableAccordion from "controls/Accordions/TableAccordion";

function ManagePolicies() {
  const { t } = useTranslation();

  const [expanded, setExpanded] = useState(false);
    
  return (
    <TableAccordion 
        title={t('policy.title')}
        expanded={expanded} 
        setExpanded={setExpanded}>
        <PolicyAssignmentTable open={expanded} />
    </TableAccordion>
  );
}

export default ManagePolicies;