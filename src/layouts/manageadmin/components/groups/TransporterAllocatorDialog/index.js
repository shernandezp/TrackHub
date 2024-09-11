import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import DynamicTableDialog from 'controls/Dialogs/TableDialogs/DynamicTableDialog';
import CustomSelect from 'controls/Dialogs/CustomSelect';
import useTransporterService from 'services/transporter';
import useGroupService from 'services/groups';
import { LoadingContext } from 'LoadingContext';

function TransporterAllocatorDialog({ open, setOpen, groupId }) {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const { getTransporterByAccount, getTransportersByGroup } = useTransporterService();
  const { createTransporterGroup, deleteTransporterGroup } = useGroupService();
  const [data, setData] = useState([]);
  const [transporters, setTrasporters] = useState([]);
  const [transporterId, setTransporterId] = useState(0);

  const columns = [
    { field: 'name', headerName: t('transporter.name') }
  ];

  const reloadData = async () => {
    const transporters = await getTransporterByAccount();
    const assignedTransporters = await getTransportersByGroup(groupId);
    const unassignedTransporters = transporters.filter(transporter => !assignedTransporters.some(assignedTransporter => assignedTransporter.transporterId === transporter.transporterId));
    setTrasporters(unassignedTransporters.map(transporter => ({
        value: transporter.transporterId,
        label: transporter.name
    })));
    setData(assignedTransporters);
  };

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        await reloadData();
        setLoading(false);
    };
    if (open)
        fetchData();
  }, [open]);

  const handleChange = (event) => {
    setLoading(true);
    setTransporterId(event.target.value);
    setLoading(false);
  };

  const handleAdd = async () => {
    setLoading(true);
    await createTransporterGroup(transporterId, groupId);
    await reloadData();
    setLoading(false);
  };

  const handleDelete = async (selectedRows) => {
    setLoading(true);
    selectedRows.forEach(async(index) => {
      await deleteTransporterGroup(data[index].transporterId, groupId);
    });
    await reloadData();
    setLoading(false);
  };

  const handleClose = async () => {
    setTransporterId(0);
    setData([]);
    setOpen(false);
  };

  return (
    <DynamicTableDialog 
      title={t('group.assignTransporter')}
      handleAdd={handleAdd}
      handleDelete={handleDelete}
      handleClose={handleClose}
      open={open}
      data={data} 
      columns={columns}>
      <CustomSelect
        list={transporters}
        name="transporterId"
        id="transporterId"
        label={t('transporter.singleTitle')}
        value={transporterId}
        handleChange={handleChange}
        required
      />
    </DynamicTableDialog>
  );
}

TransporterAllocatorDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    setOpen: PropTypes.func.isRequired,
    groupId: PropTypes.number.isRequired
};

export default TransporterAllocatorDialog;