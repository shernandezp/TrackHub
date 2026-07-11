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

import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import TableBase from "controls/Tables/Table";
import TableAccordionBase from "controls/Accordions/TableAccordion";
import ClientsFormDialog from 'layouts/systemadmin/components/clients/ClientsDialog';
import ConfirmDialogBase from 'controls/Dialogs/ConfirmDialog';
import useForm from 'controls/Dialogs/useForm';
import useClientsTableData from 'layouts/systemadmin/data/clientsTableData';
import type {
  ClientFormValues,
  ClientTableColumn,
  ClientTableRow,
} from 'layouts/systemadmin/data/clientsTableData';

// Change event shape emitted by the vendored dialog controls.
type FormChangeHandler = (
  event: { target: { name: string; value: string; type?: string; checked?: boolean } }
) => void;

// The vendored useForm hook is still JS; type its tuple result at the boundary.
type ClientUseFormResult = [
  ClientFormValues,
  FormChangeHandler,
  (values: ClientFormValues) => void,
  (errors: Record<string, string>) => void,
  (requiredFields: string[]) => boolean,
  Record<string, string>,
];

// Vendored (untyped) controls — type the prop slice crossing the boundary.
interface TableProps { columns: ClientTableColumn[]; rows: ClientTableRow[]; selectedField?: string; }
const Table = TableBase as unknown as (props: TableProps) => ReactNode;

interface TableAccordionProps {
  title: string;
  showAddIcon?: boolean;
  expanded: boolean;
  setOpen?: (open: boolean) => void;
  handleAddClick?: () => void;
  setExpanded: (expanded: boolean) => void;
  children?: ReactNode;
}
const TableAccordion = TableAccordionBase as unknown as (props: TableAccordionProps) => ReactNode;

interface ConfirmDialogProps {
  title: string;
  message: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}
const ConfirmDialog = ConfirmDialogBase as unknown as (props: ConfirmDialogProps) => ReactNode;

function ManageClients() {
  const { t } = useTranslation();
  const handleAddClick = () => {
    setValues({});
    setErrors({});
  };

  const handleEditClick = (rowData: ClientFormValues) => {
    setValues(rowData);
    setErrors({});
  };

  const handleDeleteClick = (clientId: string) => {
    setToDelete(clientId);
  };

  const [expanded, setExpanded] = useState(false);
  const {
    data,
    users,
    open,
    confirmOpen,
    onSave,
    onDelete,
    setOpen,
    setConfirmOpen} = useClientsTableData(expanded, handleEditClick, handleDeleteClick);

  const [values, handleChange, setValues, setErrors, validate, errors] = useForm({}) as ClientUseFormResult;
  const [toDelete, setToDelete] = useState<string | null>(null);
  const { columns, rows } = data;

  const handleSubmit = async () => {
    if (validate(values.clientId ? ['name'] : ['name', 'secret'])) {
      onSave(values);
    }
  };

  return (
    <>
      <TableAccordion
        title={t('clients.title')}
        showAddIcon={true}
        expanded={expanded}
        setOpen={setOpen}
        handleAddClick={handleAddClick}
        setExpanded={setExpanded}>
        <Table columns={columns} rows={rows} selectedField='name'/>
      </TableAccordion>

      <ClientsFormDialog
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        values={values}
        handleChange={handleChange}
        errors={errors}
        users={users} />

      <ConfirmDialog
        title={t('clients.deleteTitle')}
        message={t('clients.deleteMessage')}
        open={confirmOpen}
        setOpen={setConfirmOpen}
        onConfirm={async() => await onDelete(toDelete!)} />
    </>
  );
}

export default ManageClients;
