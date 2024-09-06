import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import CheckboxGridDialog from 'controls/Dialogs/CheckboxGridDialog';
import CustomSelect from 'controls/Dialogs/CustomSelect';
import usePolicyService from 'services/policies';
import useActionService from 'services/actions';
import useResourceService from 'services/resources';
import { LoadingContext } from 'LoadingContext';
import { toCamelCase } from 'utils/stringUtils';

function PolicyAssignmentTable({ open }) {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const { getPolicies, getResourcesByPolicy, createResourceActionPolicy, deleteResourceActionPolicy } = usePolicyService();
  const { getActions } = useActionService();
  const { getResources } = useResourceService();
  const [data, setData] = useState({});
  const [policies, setPolicies] = useState([]);
  const [actions, setActions] = useState([]);
  const [resources, setResources] = useState([]);
  const [policy, setPolicy] = useState(0);

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
    const fetchPolicies = async () => {
        setLoading(true);
        const result = await getPolicies();
        setPolicies(result.map(policy => ({
            value: policy.policyId,
            label: t(`policies.${toCamelCase(policy.name)}`, { defaultValue: policy.name })
        })));
        setLoading(false);
    };
    if (open)
        fetchPolicies();
  }, [open]);

  const handleChange = async (event) => {
    setLoading(true);
    setPolicy(event.target.value);
    let data = await getResourcesByPolicy(event.target.value);
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
      result = await createResourceActionPolicy(resourceId, actionId, policy);
    } else {
      result = await deleteResourceActionPolicy(resourceId, actionId, policy);
    }
    setLoading(false);
    return result;
  };

  return (
    <CheckboxGridDialog 
      key="policy"
      handleSave={handleSubmit}
      title={t('policy.resources')}
      data={data} 
      columns={actions}
      rows={resources}>
      <CustomSelect
        list={policies}
        name="name"
        id="policyId"
        label={t('policy.singleTitle')}
        value={policy}
        handleChange={handleChange}
        required
      />
    </CheckboxGridDialog>
  );
}

PolicyAssignmentTable.propTypes = {
    open: PropTypes.bool.isRequired
};

export default PolicyAssignmentTable;