/**
* Copyright (c) 2026 Sergio Hernandez. All rights reserved.
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

import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import Icon from '@mui/material/Icon';
import Table from "controls/Tables/Table";
import TableAccordion from "controls/Accordions/TableAccordion";
import ArgonButton from "components/ArgonButton";
import ArgonTypography from "components/ArgonTypography";
import ConfirmDialog from 'controls/Dialogs/ConfirmDialog';
import useForm from "controls/Dialogs/useForm";
import ServiceClientPermissionDialog from "layouts/systemadmin/components/serviceClientPermissions/ServiceClientPermissionDialog";
import useServiceClientPermissionService from "services/serviceClientPermissions";
import { LoadingContext } from 'LoadingContext';
import { formatDateTime } from "utils/dateUtils";

function TextCell({ children }) {
  return (
    <ArgonTypography variant="caption" color="secondary" fontWeight="medium">
      {children || '-'}
    </ArgonTypography>
  );
}

TextCell.propTypes = {
  children: PropTypes.node
};

const toIsoOrNull = (value) => (value ? new Date(value).toISOString() : null);

function ManageServiceClientPermissions() {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const [expanded, setExpanded] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [values, handleChange, setValues, setErrors, validate, errors] = useForm({});
  const loaded = useRef(false);
  const {
    getServiceClientPermissions,
    createServiceClientPermission,
    updateServiceClientPermission,
    deleteServiceClientPermission
  } = useServiceClientPermissionService();

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const items = await getServiceClientPermissions();
      setPermissions(items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expanded && !loaded.current) {
      loaded.current = true;
      loadPermissions();
    }
  }, [expanded]);

  const handleAddClick = () => {
    setValues({});
    setErrors({});
  };

  const handleEditClick = (permission) => {
    setValues({ ...permission });
    setErrors({});
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!validate(['clientId', 'resource', 'action', 'scope', 'audience'])) return;
    setLoading(true);
    try {
      const dto = {
        clientId: values.clientId,
        accountId: values.accountId || null,
        resource: values.resource,
        action: values.action,
        scope: values.scope,
        audience: values.audience,
        active: values.active !== false,
        effectiveFrom: toIsoOrNull(values.effectiveFrom),
        effectiveTo: toIsoOrNull(values.effectiveTo)
      };
      if (values.serviceClientPermissionId) {
        await updateServiceClientPermission(values.serviceClientPermissionId, dto);
      } else {
        await createServiceClientPermission(dto);
      }
      setOpen(false);
      await loadPermissions();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setLoading(true);
    try {
      await deleteServiceClientPermission(toDelete);
      await loadPermissions();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TableAccordion
        title={t('serviceClientPermissions.title')}
        showAddIcon={true}
        expanded={expanded}
        setOpen={setOpen}
        handleAddClick={handleAddClick}
        setExpanded={setExpanded}>
        <Table
          columns={[
            { name: 'client', title: t('serviceClientPermissions.client'), align: 'left' },
            { name: 'account', title: t('serviceClientPermissions.account'), align: 'left' },
            { name: 'resource', title: t('serviceClientPermissions.resource'), align: 'center' },
            { name: 'action', title: t('serviceClientPermissions.action'), align: 'center' },
            { name: 'scope', title: t('serviceClientPermissions.scope'), align: 'center' },
            { name: 'audience', title: t('serviceClientPermissions.audience'), align: 'center' },
            { name: 'active', title: t('serviceClientPermissions.active'), align: 'center' },
            { name: 'effective', title: t('serviceClientPermissions.effectiveWindow'), align: 'center' },
            { name: 'action2', title: t('generic.action'), align: 'center' },
            { name: 'id' }
          ]}
          rows={permissions.map(p => ({
            client: <TextCell>{p.clientId}</TextCell>,
            account: <TextCell>{p.accountId || t('serviceClientPermissions.allAccounts')}</TextCell>,
            resource: <TextCell>{p.resource}</TextCell>,
            action: <TextCell>{p.action}</TextCell>,
            scope: <TextCell>{p.scope}</TextCell>,
            audience: <TextCell>{p.audience}</TextCell>,
            active: <TextCell>{p.active ? t('generic.active') : t('generic.inactive')}</TextCell>,
            effective: <TextCell>{`${p.effectiveFrom ? formatDateTime(p.effectiveFrom) : '—'} / ${p.effectiveTo ? formatDateTime(p.effectiveTo) : '—'}`}</TextCell>,
            action2: (
              <>
                <ArgonButton variant="text" color="dark" onClick={() => handleEditClick(p)}>
                  <Icon>edit</Icon>
                </ArgonButton>
                <ArgonButton variant="text" color="error" onClick={() => { setToDelete(p.serviceClientPermissionId); setConfirmOpen(true); }}>
                  <Icon>delete</Icon>
                </ArgonButton>
              </>
            ),
            id: p.serviceClientPermissionId
          }))}
          selectedField="client"
        />
      </TableAccordion>

      <ServiceClientPermissionDialog
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        values={values}
        handleChange={handleChange}
        errors={errors}
      />

      <ConfirmDialog
        title={t('serviceClientPermissions.deleteTitle')}
        message={t('serviceClientPermissions.deleteMessage')}
        open={confirmOpen}
        setOpen={setConfirmOpen}
        onConfirm={handleDelete}
      />
    </>
  );
}

export default ManageServiceClientPermissions;
