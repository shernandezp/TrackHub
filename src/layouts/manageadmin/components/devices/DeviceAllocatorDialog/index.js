import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import StaticTableDialog from 'controls/Dialogs/TableDialogs/StaticTableDialog';
import CustomSelect from 'controls/Dialogs/CustomSelect';
import useDeviceService from 'services/device';
import useRouterService from 'services/router';
import useOperatorService from 'services/operator';
import { LoadingContext } from 'LoadingContext';

function DeviceAllocatorDialog({ open, setOpen }) {
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
    setOpen: PropTypes.func.isRequired
};

export default DeviceAllocatorDialog;