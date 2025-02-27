/**
* Copyright (c) 2025 Sergio Hernandez. All rights reserved.
*
*  Licensed under the Apache License, Version 2.0 (the "License").
*  You may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
*/

import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import DynamicTableDialog from 'controls/Dialogs/TableDialogs/DynamicTableDialog';
import CustomSelect from 'controls/Dialogs/CustomSelect';
import useTransporterService from 'services/transporter';
import useGroupService from 'services/groups';
import { LoadingContext } from 'LoadingContext';
import { useAuth } from "AuthContext";

function TransporterAllocatorDialog({ open, setOpen, groupId }) {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const { isAuthenticated } = useAuth();
  const { getTransporterByAccount, getTransportersByGroup } = useTransporterService();
  const { createTransporterGroup, deleteTransporterGroup } = useGroupService();
  const [data, setData] = useState([]);
  const [accountTransporters, setAccountTrasporters] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [transporterId, setTransporterId] = useState('');

  const columns = [
    { field: 'name', headerName: t('transporter.name') }
  ];

  const reloadData = async () => {
    const assignedTransporters = await getTransportersByGroup(groupId);
    const unassignedTransporters = accountTransporters.filter(transporter => !assignedTransporters.some(assignedTransporter => assignedTransporter.transporterId === transporter.transporterId));
    setTransporterId('');
    setTransporters(unassignedTransporters.map(transporter => ({
      value: transporter.transporterId,
      label: transporter.name
    })));
    setData(assignedTransporters);
  };

  useEffect(() => {
    const fetchData = async () => {
      const transporters = await getTransporterByAccount();
      setAccountTrasporters(transporters);
    };
    if (isAuthenticated)
      fetchData();
  }, [open, isAuthenticated]);

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
    const deletePromises = selectedRows.map(index => deleteTransporterGroup(data[index].transporterId, groupId));
    await Promise.all(deletePromises);
    await reloadData();
    setLoading(false);
  };

  const handleClose = async () => {
    setTransporterId('');
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
        numericValue={false}
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