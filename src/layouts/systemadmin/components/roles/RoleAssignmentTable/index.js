import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import CheckboxGridDialog from 'controls/Dialogs/CheckboxGridDialog';
import CustomSelect from 'controls/Dialogs/CustomSelect';
import useRoleService from 'services/roles';
import { LoadingContext } from 'LoadingContext';

function RoleAssignmentTable({ open }) {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const { getRoles, getResourcesByRole } = useRoleService();
  const [data, setData] = useState({});
  const [roles, setRoles] = useState([]);
  const [role, setRole] = useState(0);

  const actions = [
    { actionId: 1, field: 'Read', headerName: 'Read' },
    { actionId: 2, field: 'Edit', headerName: 'Edit' },
    { actionId: 3, field: 'Export', headerName: 'Export' },
    { actionId: 4, field: 'Execute', headerName: 'Execute' },
    { actionId: 5, field: 'Write', headerName: 'Write' },
    { actionId: 6, field: 'Delete', headerName: 'Delete' },
    { actionId: 7, field: 'UpdatePassword', headerName: 'UpdatePassword' },
    { actionId: 8, field: 'RefreshToken', headerName: 'RefreshToken' },
    { actionId: 9, field: 'ConnectivityTest', headerName: 'ConnectivityTest' }
  ];

  const resources = [
    { resourceId: 1, field: 'Accounts', labelName: 'Accounts' },
    { resourceId: 2, field: 'Positions', labelName: 'Positions' },
    { resourceId: 3, field: 'Permissions', labelName: 'Permissions' },
    { resourceId: 4, field: 'SettingsScreen', labelName: 'SettingsScreen' },
    { resourceId: 5, field: 'Users', labelName: 'Users' },
    { resourceId: 6, field: 'Credentials', labelName: 'Credentials' },
    { resourceId: 7, field: 'Devices', labelName: 'Devices' },
    { resourceId: 8, field: 'Operators', labelName: 'Operators' },
    { resourceId: 9, field: 'Transporters', labelName: 'Transporters' },
    { resourceId: 10, field: 'ManageUsers', labelName: 'ManageUsers' },
    { resourceId: 11, field: 'ManageAccounts', labelName: 'ManageAccounts' }
  ];

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
      data={data} 
      actions={actions}
      resources={resources}>
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