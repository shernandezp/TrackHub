import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Table from "controls/Tables/Table";
import TableAccordion from "controls/Accordions/TableAccordion";
import PolicyAllocatorDialog from 'layouts/manageadmin/components/policies/PolicyAllocatorDialog';
import usePolicyTableData from "layouts/manageadmin/data/policiesTableData";

function ManagePolicies() {
  const { t } = useTranslation();

  const handleOpen = (policyId) => {
    setPolicyId(policyId);
    setOpen(true);
  };

  const [expanded, setExpanded] = useState(false);
  const { 
    data, 
    open, 
    setOpen } = usePolicyTableData(expanded, handleOpen);
  const { columns, rows } = data;
  const [policyId, setPolicyId] = useState(0);

  return (
    <>
      <TableAccordion 
        title={t('policy.title')}
        expanded={expanded} 
        setOpen={setOpen} 
        setExpanded={setExpanded}>
        <Table columns={columns} rows={rows} />
      </TableAccordion>

      <PolicyAllocatorDialog 
        open={open}
        setOpen={setOpen}
        policyId={policyId}
      />
    </>
  );
}

export default ManagePolicies;
