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
import StaticTableDialog from 'controls/Dialogs/TableDialogs/StaticTableDialog';
import CustomSelect from 'controls/Dialogs/CustomSelect';
import useDeviceService from 'services/device';
import useRouterService from 'services/router';
import useOperatorService from 'services/operator';
import { LoadingContext } from 'LoadingContext';

function DeviceAllocatorDialog({ open, setOpen, handleAddClick }) {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const { processDevice, wipeDevices } = useDeviceService();
  const { getDevicesByOperator } = useRouterService();
  const { getOperators } = useOperatorService();
  const [data, setData] = useState([]);
  const [operators, setOperators] = useState([]);
  const [operator, setOperator] = useState(0);

  const columns = [
    { field: 'identifier', headerName: t('device.identifier') },
    { field: 'name', headerName: t('device.name') },
    { field: 'serial', headerName: t('device.serial') }
  ];

  useEffect(() => {
    const fetchOperators = async () => {
        setLoading(true);
        const result = await getOperators();
        setOperators(result.map(operator => ({
          value: operator.operatorId,
          label: operator.name
        })));
        setLoading(false);
    };
    if (open)
      fetchOperators();
  }, [open]);

  const handleChange = async (event) => {
    setLoading(true);
    setOperator(event.target.value);
    let devices = await getDevicesByOperator(event.target.value);
    setData(devices);
    setLoading(false);
  };

  const handleSubmit = async (selectedRows, checked) => {
    setLoading(true);
    if (checked)
    {
      await wipeDevices(operator);
    }
    selectedRows.forEach(async(index) => {
      await processDevice(data[index], operator);
    });
    await handleAddClick();
    setLoading(false);
    setOperator(0);
    setData([]);
    setOpen(false);
  };

  return (
    <StaticTableDialog 
      title={t('device.details')}
      handleSave={handleSubmit}
      open={open}
      setOpen={setOpen}
      checkLabel={t('device.overwrite')}
      data={data} 
      columns={columns}>
      <CustomSelect
        list={operators}
        name="name"
        id="operatorId"
        label={t('operator.singleTitle')}
        value={operator}
        handleChange={handleChange}
        required
      />
    </StaticTableDialog>
  );
}

DeviceAllocatorDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    setOpen: PropTypes.func.isRequired,
    handleAddClick: PropTypes.func.isRequired
};

export default DeviceAllocatorDialog;