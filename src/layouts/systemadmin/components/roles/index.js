import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import RoleAssignmentTable from 'layouts/systemadmin/components/roles/RoleAssignmentTable';
import TableAccordion from "controls/Accordions/TableAccordion";

function ManageRoles() {
  const { t } = useTranslation();

  const [expanded, setExpanded] = useState(false);
    
  return (
    <TableAccordion 
        title={t('role.title')}
        expanded={expanded} 
        setExpanded={setExpanded}>
        <RoleAssignmentTable open={expanded} />
    </TableAccordion>
  );
}

export default ManageRoles;