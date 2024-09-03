import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Table from "controls/Tables/Table";
import TableAccordion from "controls/Accordions/TableAccordion";
import TransporterFormDialog from 'layouts/manageadmin/components/transporters/TransporterDialog';
import useForm from 'controls/Dialogs/useForm';
import ConfirmDialog from 'controls/Dialogs/ConfirmDialog';
import useTransporterTableData from "layouts/manageadmin/data/transportersTableData";

function ManageTransporters() {
  const { t } = useTranslation();

  const handleEditClick = (rowData) => {
    setValues(rowData);
    setErrors({});
  };

  const handleDeleteClick = (transporterId) => {
    setToDelete(transporterId);
  };

  const [expanded, setExpanded] = useState(false);
  const { 
    data, 
    open, 
    confirmOpen, 
    onSave, 
    onDelete, 
    setOpen, 
    setConfirmOpen } = useTransporterTableData(expanded, handleEditClick, handleDeleteClick);
  const [values, handleChange, setValues, setErrors, validate, errors] = useForm({});
  const [toDelete, setToDelete] = useState(null);
  const { columns, rows } = data;

  const handleSubmit = async () => {
    if (validate(['name', 'transporterTypeId'])) {
      onSave(values);
    }
  };

  return (
    <>
      <TableAccordion 
        title={t('transporter.title')}
        expanded={expanded} 
        setOpen={setOpen} 
        setExpanded={setExpanded}>
        <Table columns={columns} rows={rows} />
      </TableAccordion>

      <TransporterFormDialog 
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        values={values}
        handleChange={handleChange}
        errors={errors}
      />

      <ConfirmDialog 
        title={t('transporter.deleteTitle')}
        message={t('transporter.deleteMessage')}
        open={confirmOpen} 
        setOpen={setConfirmOpen} 
        onConfirm={async() => await onDelete(toDelete)} />
    </>
  );
}

export default ManageTransporters;
