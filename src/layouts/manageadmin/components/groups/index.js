import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Table from "controls/Tables/Table";
import TableAccordion from "controls/Accordions/TableAccordion";
import GroupFormDialog from 'layouts/manageadmin/components/groups/GroupDialog';
import TransporterAllocatorDialog from 'layouts/manageadmin/components/groups/TransporterAllocatorDialog';
import UserAllocatorDialog from 'layouts/manageadmin/components/groups/UserAllocatorDialog';
import useForm from 'controls/Dialogs/useForm';
import ConfirmDialog from 'controls/Dialogs/ConfirmDialog';
import useGroupTableData from "layouts/manageadmin/data/groupsTableData";

function ManageGroups() {
  const { t } = useTranslation();
  const handleAddClick = () => {
    setValues({active: true});
    setErrors({});
  };

  const handleEditClick = (rowData) => {
    setValues(rowData);
    setErrors({});
  };

  const handleDeleteClick = (groupId) => {
    setToDelete(groupId);
  };

  const handleUserClick = (groupId) => {
    setGroupId(groupId);
    setOpenUserAllocator(true);
  };

  const handleTransporterClick = (groupId) => {
    setGroupId(groupId);
    setOpenTransporterAllocator(true);
  };

  const [expanded, setExpanded] = useState(false);
  const { 
    data, 
    open, 
    confirmOpen, 
    onSave, 
    onDelete, 
    setOpen, 
    setConfirmOpen} = useGroupTableData(expanded, handleEditClick, handleDeleteClick, handleUserClick, handleTransporterClick);

  const [values, handleChange, setValues, setErrors, validate, errors] = useForm({});
  const [toDelete, setToDelete] = useState(null);
  const { columns, rows } = data;
  const [groupId, setGroupId] = useState(0);
  const [openUserAllocator, setOpenUserAllocator] = useState(false);
  const [openTransporterAllocator, setOpenTransporterAllocator] = useState(false);

  const handleSubmit = async () => {
    let requiredFields = ['name', 'description'];

    if (validate(requiredFields)) {
      onSave(values);
    }
  };

  return (
    <>
      <TableAccordion 
        title={t('group.title')}
        showAddIcon={true}
        expanded={expanded} 
        setOpen={setOpen} 
        handleAddClick={handleAddClick}
        setExpanded={setExpanded}>
        <Table columns={columns} rows={rows} selectedField='group' />
      </TableAccordion>

      <GroupFormDialog 
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        values={values}
        handleChange={handleChange}
        errors={errors}
      />

      <ConfirmDialog 
        title={t('group.deleteTitle')}
        message={t('group.deleteMessage')}
        open={confirmOpen} 
        setOpen={setConfirmOpen} 
        onConfirm={async() => await onDelete(toDelete)} />

      <TransporterAllocatorDialog 
        open={openTransporterAllocator}
        setOpen={setOpenTransporterAllocator}
        groupId={groupId}
      />

      <UserAllocatorDialog 
        open={openUserAllocator}
        setOpen={setOpenUserAllocator}
        groupId={groupId}
      />

    </>
  );
}

export default ManageGroups;