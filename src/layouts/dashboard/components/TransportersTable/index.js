import PropTypes from 'prop-types';
import Table from "controls/Tables/Table";
import useTransportersTableData from "layouts/dashboard/data/transportersData";

function TransportersTable({transporters, selected, handleSelected}) {
  const { data } = useTransportersTableData(transporters);
  const { columns, rows } = data;

  return (
    <>
        <Table 
          columns={columns} 
          rows={rows} 
          selected={selected}
          selectedField="name"
          handleSelected={handleSelected} />
    </>
  );
}

TransportersTable.propTypes = {
    transporters: PropTypes.array,
    selected: PropTypes.string,
    handleSelected: PropTypes.func.isRequired
};

export default TransportersTable;
