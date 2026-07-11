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
import GroupFormDialog from 'layouts/manageadmin/components/groups/GroupDialog';
import TransporterAllocatorDialog from 'layouts/manageadmin/components/groups/TransporterAllocatorDialog';
import UserAllocatorDialog from 'layouts/manageadmin/components/groups/UserAllocatorDialog';
import useForm from 'controls/Dialogs/useForm';
import ConfirmDialogBase from 'controls/Dialogs/ConfirmDialog';
import useGroupTableData from "layouts/manageadmin/data/groupsTableData";
import type { GroupFormValues, GroupColumn, GroupRow } from "layouts/manageadmin/data/groupsTableData";

// Change event shape emitted by the vendored dialog controls.
type FormChangeHandler = (
  event: { target: { name: string; value: string; type?: string; checked?: boolean } }
) => void;

// The vendored useForm hook is still JS; type its tuple result at the boundary.
type GroupUseFormResult = [
  GroupFormValues,
  FormChangeHandler,
  (values: GroupFormValues) => void,
  (errors: Record<string, string>) => void,
  (requiredFields: string[]) => boolean,
  Record<string, string>,
];

// Vendored (untyped) controls — type the prop slice crossing the boundary.
interface TableProps { columns: GroupColumn[]; rows: GroupRow[]; selectedField?: string; }
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

function ManageGroups() {
  const { t } = useTranslation();
  const handleAddClick = () => {
    setValues({ active: true });
    setErrors({});
  };

  const handleEditClick = (rowData: GroupFormValues) => {
    setValues(rowData);
    setErrors({});
  };

  const handleDeleteClick = (groupId: number) => {
    setToDelete(groupId);
  };

  const handleUserClick = (groupId: number) => {
    setGroupId(groupId);
    setOpenUserAllocator(true);
  };

  const handleTransporterClick = (groupId: number) => {
    setGroupId(groupId);
    setOpenTransporterAllocator(true);
  };

  const [expanded, setExpanded] = useState(false);
  const {
    data,
    open,
    confirmOpen,
    onSave,
    onDelete,
    setOpen,
    setConfirmOpen} = useGroupTableData(expanded, handleEditClick, handleDeleteClick, handleUserClick, handleTransporterClick);

  const [values, handleChange, setValues, setErrors, validate, errors] = useForm({}) as GroupUseFormResult;
  const [toDelete, setToDelete] = useState<number | null>(null);
  const { columns, rows } = data;
  const [groupId, setGroupId] = useState(0);
  const [openUserAllocator, setOpenUserAllocator] = useState(false);
  const [openTransporterAllocator, setOpenTransporterAllocator] = useState(false);

  const handleSubmit = async () => {
    const requiredFields = ['name', 'description'];

    if (validate(requiredFields)) {
      onSave(values);
    }
  };

  return (
    <>
      <TableAccordion
        title={t('group.title')}
        showAddIcon={true}
        expanded={expanded}
        setOpen={setOpen}
        handleAddClick={handleAddClick}
        setExpanded={setExpanded}>
        <Table columns={columns} rows={rows} selectedField='group' />
      </TableAccordion>

      <GroupFormDialog
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        values={values}
        handleChange={handleChange}
        errors={errors}
      />

      <ConfirmDialog
        title={t('group.deleteTitle')}
        message={t('group.deleteMessage')}
        open={confirmOpen}
        setOpen={setConfirmOpen}
        onConfirm={async() => await onDelete(toDelete!)} />

      <TransporterAllocatorDialog
        open={openTransporterAllocator}
        setOpen={setOpenTransporterAllocator}
        groupId={groupId}
      />

      <UserAllocatorDialog
        open={openUserAllocator}
        setOpen={setOpenUserAllocator}
        groupId={groupId}
      />

    </>
  );
}

export default ManageGroups;
