/**
* Copyright (c) 2024 Sergio Hernandez. All rights reserved.
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
      <Table 
        columns={columns} 
        rows={rows} 
        selected={selected}
        selectedField="name"
        handleSelected={handleSelected} 
        searchQuery={searchQuery}/>
  );
}

TransportersTable.propTypes = {
    transporters: PropTypes.array,
    selected: PropTypes.string,
    handleSelected: PropTypes.func.isRequired,
    searchQuery: PropTypes.string
};

export default TransportersTable;
