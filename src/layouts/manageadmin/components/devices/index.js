import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Table from "controls/Tables/Table";
import TableAccordion from "controls/Accordions/TableAccordion";
import DeviceFormDialog from "layouts/manageadmin/components/devices/DeviceDialog";
import DeviceOperatorFormDialog from 'layouts/manageadmin/components/devices/DeviceOperatorDialog';
import useForm from 'controls/Dialogs/useForm';
import ConfirmDialog from 'controls/Dialogs/ConfirmDialog';
import useDeviceTableData from "layouts/manageadmin/data/devicesTableData";

function ManageDevices() {
  const { t } = useTranslation();
  const handleAddClick = () => {
    setValues({deviceTypeId: 0});
    setErrors({});
  };

  const handleEditClick = (rowData) => {
    setValues(rowData);
    setErrors({});
  };

  const handleDeleteClick = (deviceId) => {
    setToDelete(deviceId);
  };

  const [expanded, setExpanded] = useState(false);
  const [openAssignment, setOpenAssignment] = useState(false);
  const { 
    data, 
    open, 
    confirmOpen, 
    onSave, 
    onDelete, 
    setOpen, 
    setConfirmOpen } = useDeviceTableData(expanded, handleEditClick, handleDeleteClick);
  const requiredFields = ['name', 'deviceTypeId'];
  const [values, handleChange, setValues, setErrors, validate, errors] = useForm({}, requiredFields);
  const [toDelete, setToDelete] = useState(null);
  const { columns, rows } = data;

  const handleSubmit = async () => {
    if (validate()) {
      onSave(values);
    }
  };

  const handleAssignmentSubmit = async () => {
    console.log('Assignment submitted');
  };

  return (
    <>
      <TableAccordion 
        title={t('device.title')}
        showAddIcon={true}
        expanded={expanded} 
        setOpen={setOpenAssignment} 
        handleAddClick={handleAddClick}
        setExpanded={setExpanded}>
        <Table columns={columns} rows={rows} />
      </TableAccordion>

      <DeviceOperatorFormDialog
        open={openAssignment}
        setOpen={setOpenAssignment}
        handleSubmit={handleAssignmentSubmit}
      />

      <DeviceFormDialog 
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        values={values}
        handleChange={handleChange}
        errors={errors}
      />

      <ConfirmDialog 
        title={t('device.deleteTitle')}
        message={t('device.deleteMessage')}
        open={confirmOpen} 
        setOpen={setConfirmOpen} 
        onConfirm={async() => await onDelete(toDelete)} />

    </>
  );
}

export default ManageDevices;
