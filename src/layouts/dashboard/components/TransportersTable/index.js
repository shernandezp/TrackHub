import PropTypes from 'prop-types';
import Table from "controls/Tables/Table";
import useTransportersTableData from "layouts/dashboard/data/transportersData";

function TransportersTable({
    transporters, 
    selected, 
    handleSelected,
    searchQuery = ''}) {
  const { data } = useTransportersTableData(transporters);
  const { columns, rows } = data;

  return (
    <>
        <Table 
          columns={columns} 
          rows={rows} 
          selected={selected}
          selectedField="name"
          handleSelected={handleSelected} 
          searchQuery={searchQuery}/>
    </>
  );
}

TransportersTable.propTypes = {
    transporters: PropTypes.array,
    selected: PropTypes.string,
    handleSelected: PropTypes.func.isRequired,
    searchQuery: PropTypes.string
};

export default TransportersTable;
