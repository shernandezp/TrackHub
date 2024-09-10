import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Table from "controls/Tables/Table";
import TableAccordion from "controls/Accordions/TableAccordion";
import RoleAllocatorDialog from 'layouts/manageadmin/components/roles/RoleAllocatorDialog';
import useRoleTableData from "layouts/manageadmin/data/rolesTableData";

function ManageRoles() {
  const { t } = useTranslation();

  const handleOpen = (roleId) => {
    setRoleId(roleId);
    setOpen(true);
  };

  const [expanded, setExpanded] = useState(false);
  const { 
    data, 
    open, 
    setOpen } = useRoleTableData(expanded, handleOpen);
  const { columns, rows } = data;
  const [roleId, setRoleId] = useState(0);

  return (
    <>
      <TableAccordion 
        title={t('role.title')}
        expanded={expanded} 
        setOpen={setOpen} 
        setExpanded={setExpanded}>
        <Table columns={columns} rows={rows} />
      </TableAccordion>

      <RoleAllocatorDialog 
        open={open}
        setOpen={setOpen}
        roleId={roleId}
      />
    </>
  );
}

export default ManageRoles;
