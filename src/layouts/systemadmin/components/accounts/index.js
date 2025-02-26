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

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Table from "controls/Tables/Table";
import TableAccordion from "controls/Accordions/TableAccordion";
import AccountFormDialog from 'layouts/systemadmin/components/accounts/AccountsDialog';
import UserFormDialog from 'layouts/manageadmin/components/users/UserDialog';
import useForm from 'controls/Dialogs/useForm';
import useAccountsTableData from 'layouts/systemadmin/data/accountsTableData';

function ManageAccounts() {
  const { t } = useTranslation();
  const handleAddClick = () => {
    setAccountValues({active: true, typeId: 0});
    setAccountErrors({});
  };

  const handleEditClick = (rowData) => {
    setAccountValues(rowData);
    setAccountErrors({});
  };

  const handleAddManagerClick = (accountId) => {
    setUserValues({active: true, accountId: accountId});
    setUserErrors({});
  };

  const [expanded, setExpanded] = useState(false);
  const { 
    data, 
    open,
    openUser,
    onSave, 
    onSaveUser,
    setOpen,
    setOpenUser} = useAccountsTableData(expanded, handleEditClick, handleAddManagerClick);

  const [accountValues, handleAccountChange, setAccountValues, setAccountErrors, validateAccount, accountErrors] = useForm({});
  const [userValues, handleUserChange, setUserValues, setUserErrors, validateUser, userErrors] = useForm({});
  const { columns, rows } = data;

  const handleSubmit = async () => {
    if (validateAccount(['name', 'typeId'])) {
      onSave(accountValues);
    }
  };

  const handleSubmitUser = async () => {
    if (validateUser(['emailAddress', 'firstName', 'lastName', 'password'])) {
      onSaveUser(userValues);
    }
  };

  return (
    <>
      <TableAccordion 
        title={t('account.title')}
        showAddIcon={true}
        expanded={expanded} 
        setOpen={setOpen} 
        handleAddClick={handleAddClick}
        setExpanded={setExpanded}>
        <Table columns={columns} rows={rows} selectedField='name'/>
      </TableAccordion>

      <AccountFormDialog 
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        values={accountValues}
        handleChange={handleAccountChange}
        errors={accountErrors}
      />

      <UserFormDialog 
        open={openUser}
        setOpen={setOpenUser}
        handleSubmit={handleSubmitUser}
        values={userValues}
        handleChange={handleUserChange}
        errors={userErrors}
      />
    </>
  );
}

export default ManageAccounts;