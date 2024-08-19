import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Table from "controls/Tables/Table";
import TableAccordion from "controls/Accordions/TableAccordion";
import OperatorFormDialog from 'layouts/manageadmin/components/operators/OperatorDialog';
import CredentialFormDialog from 'layouts/manageadmin/components/operators/CredentialDialog';
import useForm from 'controls/Dialogs/useForm';
import ConfirmDialog from 'controls/Dialogs/ConfirmDialog';
import MessageDialog from 'controls/Dialogs/MessageDialog';
import useOperatorTableData from "layouts/manageadmin/data/operatorsTableData";

function ManageOperators() {
  const { t } = useTranslation();
  const handleAddClick = () => {
    setOperatorValues({protocolTypeId: 0});
    setOperatorErrors({});
  };

  const handleEditClick = (rowData) => {
    setOperatorValues(rowData);
    setOperatorErrors({});
  };

  const handleEditCredentialClick = (rowData) => {
    setCredentialValues(rowData);
    setCredentialErrors({});
  };

  const handleDeleteClick = (operatorId) => {
    setToDelete(operatorId);
  };

  const [expanded, setExpanded] = useState(false);
  const { 
    data, 
    open, 
    openCredential, 
    confirmOpen, 
    testOpen,
    testMessage,
    onSave, 
    onSaveCredential, 
    onDelete, 
    setOpen, 
    setOpenCredential, 
    setConfirmOpen,
    setTestOpen } = useOperatorTableData(expanded, handleEditClick, handleEditCredentialClick, handleDeleteClick);
  const requiredOperatorFields = ['name', 'protocolTypeId'];
  const requiredCredentialFields = ['uri'];
  const [operatorValues, handleOperatorChange, setOperatorValues, setOperatorErrors, validateOperator, operatorErrors] = useForm({}, requiredOperatorFields);
  const [credentialValues, handleCredentialChange, setCredentialValues, setCredentialErrors, validateCredential, credentialErrors] = useForm({}, requiredCredentialFields);
  const [toDelete, setToDelete] = useState(null);
  const { columns, rows } = data;

  const handleSubmit = async () => {
    if (validateOperator()) {
      onSave(operatorValues);
    }
  };

  const handleSubmitCredential = async () => {
    if (validateCredential()) {
      onSaveCredential(credentialValues);
    }
  };

  return (
    <>
      <TableAccordion 
        title={t('operator.title')}
        showAddIcon={true}
        expanded={expanded} 
        setOpen={setOpen} 
        handleAddClick={handleAddClick}
        setExpanded={setExpanded}>
        <Table columns={columns} rows={rows} />
      </TableAccordion>

      <OperatorFormDialog 
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        values={operatorValues}
        handleChange={handleOperatorChange}
        errors={operatorErrors}
      />

      <CredentialFormDialog 
        open={openCredential}
        setOpen={setOpenCredential}
        handleSubmit={handleSubmitCredential}
        values={credentialValues}
        handleChange={handleCredentialChange}
        errors={credentialErrors}
      />

      <ConfirmDialog 
        title={t('operator.deleteTitle')}
        message={t('operator.deleteMessage')}
        open={confirmOpen} 
        setOpen={setConfirmOpen} 
        onConfirm={async() => await onDelete(toDelete)} />

      <MessageDialog 
        title={t('credential.connectivityTest')}
        message={testMessage}
        open={testOpen} 
        setOpen={setTestOpen} />
    </>
  );
}

export default ManageOperators;
