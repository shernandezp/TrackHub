import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import FormDialog from "controls/Dialogs/FormDialog";
import TableDialog from 'controls/Dialogs/TableDialog';
import CustomSelect from 'controls/Dialogs/CustomSelect';
import useRouterService from 'services/router';
import useOperatorService from 'services/operator';
import { LoadingContext } from 'LoadingContext';

function DeviceOperatorFormDialog({ open, setOpen, handleSubmit }) {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const { getDevicesByOperator } = useRouterService();
  const { getOperators } = useOperatorService();
  const [data, setData] = useState([]);
  const [operators, setOperators] = useState([]);
  const [operator, setOperator] = useState(0);

  const columns = [
    { field: 'identifier', headerName: 'ID' },
    { field: 'name', headerName: 'Name' },
    { field: 'serial', headerName: 'Serial' }
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

    fetchOperators();
  }, []);

  const handleChange = async (event) => {
    setLoading(true);
    setOperator(event.target.value);
    let devices = await getDevicesByOperator(event.target.value);
    setData(devices);
    setLoading(false);
  };

  return (
    <FormDialog 
      title={t('device.details')}
      handleSave={handleSubmit}
      open={open}
      setOpen={setOpen}
      maxWidth="md"
    >
      <form>
        <CustomSelect
          list={operators}
          name="name"
          id="operatorId"
          label={t('operator.singleTitle')}
          value={operator}
          handleChange={handleChange}
          required
        />
        <TableDialog data={data} columns={columns}/>
      </form>
    </FormDialog>
  );
}

DeviceOperatorFormDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    setOpen: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
};

export default DeviceOperatorFormDialog;