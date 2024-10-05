import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Table from "controls/Tables/Table";
import TableAccordion from "controls/Accordions/TableAccordion";
import DeviceAllocatorDialog from 'layouts/manageadmin/components/devices/DeviceAllocatorDialog';
import ConfirmDialog from 'controls/Dialogs/ConfirmDialog';
import useDeviceTableData from "layouts/manageadmin/data/devicesTableData";

function ManageDevices() {
  const { t } = useTranslation();

  const handleDeleteClick = (deviceId) => {
    setToDelete(deviceId);
  };

  const handleAddClick = async () => {
    await refreshData();
  };

  const [expanded, setExpanded] = useState(false);
  const [openAssignment, setOpenAssignment] = useState(false);
  const { 
    data, 
    confirmOpen, 
    onDelete, 
    setConfirmOpen,
    refreshData } = useDeviceTableData(expanded, handleDeleteClick);
  const [toDelete, setToDelete] = useState(null);
  const { columns, rows } = data;

  return (
    <>
      <TableAccordion
        title={t('device.title')}
        showAddIcon={true}
        expanded={expanded}
        setOpen={setOpenAssignment} 
        setExpanded={setExpanded}>
        <Table columns={columns} rows={rows} />
      </TableAccordion>

      <DeviceAllocatorDialog
        open={openAssignment}
        setOpen={setOpenAssignment}
        handleAddClick={handleAddClick}
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
