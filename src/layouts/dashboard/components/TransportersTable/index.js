import PropTypes from 'prop-types';
import Table from "controls/Tables/Table";
import useTransportersTableData from "layouts/dashboard/data/transportersData";

function TransportersTable({transporters}) {
  const { data } = useTransportersTableData(transporters);
  const { columns, rows } = data;

  return (
    <>
        <Table columns={columns} rows={rows} />
    </>
  );
}

TransportersTable.propTypes = {
    transporters: PropTypes.array
};

export default TransportersTable;
