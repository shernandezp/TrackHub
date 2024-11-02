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

import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import CheckboxTableDialog from 'controls/Dialogs/TableDialogs/CheckboxTableDialog';
import CustomSelect from 'controls/Dialogs/CustomSelect';
import useRoleService from 'services/roles';
import useActionService from 'services/actions';
import useResourceService from 'services/resources';
import { LoadingContext } from 'LoadingContext';
import { toCamelCase } from 'utils/stringUtils';

function RoleAssignmentTable({ open }) {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const { getRoles, getResourcesByRole, createResourceActionRole, deleteResourceActionRole } = useRoleService();
  const { getActions } = useActionService();
  const { getResources } = useResourceService();
  const [data, setData] = useState({});
  const [roles, setRoles] = useState([]);
  const [actions, setActions] = useState([]);
  const [resources, setResources] = useState([]);
  const [role, setRole] = useState(0);

  useEffect(() => {
    const fetchActions = async () => {
        setLoading(true);
        const result = await getActions();
        setActions(result.map(action => ({
            value: action.actionId,
            name: action.actionName,
            label: t(`actions.${toCamelCase(action.actionName)}`)
        })));
        setLoading(false);
    };
    if (open)
      fetchActions();
  }, [open]);

  useEffect(() => {
    const fetchResources = async () => {
        setLoading(true);
        const result = await getResources();
        setResources(result.map(resource => ({
            value: resource.resourceId,
            name: resource.resourceName,
            label: t(`resources.${toCamelCase(resource.resourceName)}`)
        })));
        setLoading(false);
    };
    if (open)
      fetchResources();
  }, [open]);

  useEffect(() => {
    const fetchRoles = async () => {
        setLoading(true);
        const result = await getRoles();
        setRoles(result.map(role => ({
            value: role.roleId,
            label: t(`roles.${toCamelCase(role.name)}`, { defaultValue: role.name })
        })));
        setLoading(false);
    };
    if (open)
      fetchRoles();
  }, [open]);

  const handleChange = async (event) => {
    setLoading(true);
    setRole(event.target.value);
    let data = await getResourcesByRole(event.target.value);
    let actionMap = data.resources.reduce((map, resource) => {
      map[resource.resourceId] = resource.actions.reduce((actionMap, action) => {
          actionMap[action.actionId] = action;
          return actionMap;
      }, {});
      return map;
    }, {});
    setData(actionMap);
    setLoading(false);
  };

  const handleSubmit = async (resourceId, actionId, checked) => {
    setLoading(true);
    let result = null;
    if (checked) {
      result = await createResourceActionRole(resourceId, actionId, role);
    } else {
      result = await deleteResourceActionRole(resourceId, actionId, role);
    }
    setLoading(false);
    return result;
  };

  return (
    <CheckboxTableDialog 
      key="role"
      handleSave={handleSubmit}
      title={t('role.resources')}
      data={data} 
      columns={actions}
      rows={resources}>
      <CustomSelect
        list={roles}
        name="name"
        id="roleId"
        label={t('role.singleTitle')}
        value={role}
        handleChange={handleChange}
        required
      />
    </CheckboxTableDialog>
  );
}

RoleAssignmentTable.propTypes = {
    open: PropTypes.bool.isRequired
};

export default RoleAssignmentTable;