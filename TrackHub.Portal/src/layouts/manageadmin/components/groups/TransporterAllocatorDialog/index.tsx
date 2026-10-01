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

import { useEffect, useMemo, useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import DynamicTableDialog from 'controls/Dialogs/TableDialogs/DynamicTableDialog';
import SearchSelect from 'edition/SearchSelect';
import type { SearchOption } from 'edition/SearchSelect';
import { excludingOptions, useAccountTransporterOptions } from 'edition/pickerOptions';
import { useTransportersByGroup } from 'queries/transporters';
import { createTransporterGroup, deleteTransporterGroup } from 'api/manager/groups';
import { notifyApiError } from 'api/core/errors';
import { LoadingContext } from 'LoadingContext';

interface TransporterAllocatorDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  groupId: number;
}

function TransporterAllocatorDialog({ open, setOpen, groupId }: TransporterAllocatorDialogProps) {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const [transporter, setTransporter] = useState<SearchOption | null>(null);

  // The assigned side is drained so an already-assigned unit never reappears as available in
  // the server-searched picker (it would create a duplicate membership).
  const assignedQuery = useTransportersByGroup(open ? groupId : undefined);
  const assignedTransporters = assignedQuery.data ?? [];
  const useAvailableTransporterOptions = useMemo(
    () =>
      excludingOptions(
        useAccountTransporterOptions,
        new Set(assignedTransporters.map((assigned) => assigned.transporterId))
      ),
    [assignedTransporters]
  );

  const columns = [
    { field: 'name', headerName: t('transporter.name') }
  ];

  // Keep the global spinner UX while the assigned-transporter list loads/refreshes.
  useEffect(() => {
    setLoading(assignedQuery.isFetching);
  }, [assignedQuery.isFetching, setLoading]);

  const handleAdd = async () => {
    if (!transporter) return;
    setLoading(true);
    try {
      // createTransporterGroup surfaces failures via the global toast (legacy handleError).
      await createTransporterGroup(transporter.value, groupId);
    } catch (e) {
      notifyApiError(e);
    }
    setTransporter(null);
    // Group membership is read via the transporters query; refetch it manually.
    await assignedQuery.refetch();
    setLoading(false);
  };

  const handleDelete = async (selectedRows: number[]) => {
    setLoading(true);
    // deleteTransporterGroup keeps the legacy silent semantics (handleSilentError).
    const deletePromises = selectedRows.map(index =>
      deleteTransporterGroup(assignedTransporters[index].transporterId, groupId).catch(() => undefined));
    await Promise.all(deletePromises);
    await assignedQuery.refetch();
    setLoading(false);
  };

  const handleClose = async () => {
    setTransporter(null);
    setOpen(false);
  };

  return (
    <DynamicTableDialog
      title={t('group.assignTransporter')}
      handleAdd={handleAdd}
      handleDelete={handleDelete}
      handleClose={handleClose}
      open={open}
      data={assignedTransporters}
      columns={columns}>
      <SearchSelect
        id="transporterId"
        label={t('transporter.singleTitle')}
        value={transporter?.value ?? null}
        valueLabel={transporter?.label}
        onChange={setTransporter}
        useOptions={useAvailableTransporterOptions}
      />
    </DynamicTableDialog>
  );
}

export default TransporterAllocatorDialog;
