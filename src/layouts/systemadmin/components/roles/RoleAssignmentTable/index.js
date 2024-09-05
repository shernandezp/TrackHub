import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import CheckboxGridDialog from 'controls/Dialogs/CheckboxGridDialog';
import CustomSelect from 'controls/Dialogs/CustomSelect';
import useRoleService from 'services/roles';
import useActionService from 'services/actions';
import useResourceService from 'services/resources';
import { LoadingContext } from 'LoadingContext';
import { toCamelCase } from 'utils/stringUtils';

function RoleAssignmentTable({ open }) {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const { getRoles, getResourcesByRole } = useRoleService();
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
            label: role.name
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
    console.log(resourceId);
    console.log(actionId);
    console.log(checked);
    setLoading(false);
  };

  return (
    <CheckboxGridDialog 
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
    </CheckboxGridDialog>
  );
}

RoleAssignmentTable.propTypes = {
    open: PropTypes.bool.isRequired
};

export default RoleAssignmentTable;