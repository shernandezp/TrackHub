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
import useApiService from './apiService';
import { handleError } from 'utils/errorHandler';
import { formatValue } from 'utils/dataUtils';

const useManagerGraphQL = () => {
  const { post } = useApiService(process.env.REACT_APP_MANAGER_ENDPOINT);

  const execute = async (query, selector, fallback = undefined) => {
    try {
      const response = await post({ query });
      return selector(response.data);
    } catch (error) {
      handleError(error);
      return fallback;
    }
  };

  return { execute };
};
const useNotificationRuleService = () => {
  const { execute } = useManagerGraphQL();

  const getNotificationRules = async (accountId, skip = 0, take = 50) => execute(`
    query {
      notificationRules(query: { accountId: ${formatValue(accountId)}, skip: ${skip}, take: ${take} }) {
        notificationRuleId
        accountId
        ruleKey
        ruleType
        enabled
        triggerEvent
        recipientSelector
        channelsJson
        lastModified
      }
    }
  `, data => data.notificationRules, []);

  const createNotificationRule = async (notificationRule) => execute(`
    mutation {
      createNotificationRule(command: { notificationRule: {
        accountId: ${formatValue(notificationRule.accountId)}
        ruleKey: ${formatValue(notificationRule.ruleKey)}
        ruleType: ${formatValue(notificationRule.ruleType)}
        enabled: ${notificationRule.enabled}
        triggerEvent: ${formatValue(notificationRule.triggerEvent)}
        recipientSelector: ${formatValue(notificationRule.recipientSelector)}
        channelsJson: ${formatValue(notificationRule.channelsJson)}
        throttlingJson: ${formatValue(notificationRule.throttlingJson)}
        configurationJson: ${formatValue(notificationRule.configurationJson)}
      }}) {
        notificationRuleId
        accountId
        ruleKey
        enabled
        lastModified
      }
    }
  `, data => data.createNotificationRule, null);

  const updateNotificationRule = async (notificationRuleId, notificationRule) => execute(`
    mutation {
      updateNotificationRule(command: { notificationRuleId: ${formatValue(notificationRuleId)}, notificationRule: {
        accountId: ${formatValue(notificationRule.accountId)}
        ruleKey: ${formatValue(notificationRule.ruleKey)}
        ruleType: ${formatValue(notificationRule.ruleType)}
        enabled: ${notificationRule.enabled}
        triggerEvent: ${formatValue(notificationRule.triggerEvent)}
        recipientSelector: ${formatValue(notificationRule.recipientSelector)}
        channelsJson: ${formatValue(notificationRule.channelsJson)}
        throttlingJson: ${formatValue(notificationRule.throttlingJson)}
        configurationJson: ${formatValue(notificationRule.configurationJson)}
      }})
    }
  `, data => data.updateNotificationRule, false);

  const disableNotificationRule = async (notificationRuleId) => execute(`
    mutation {
      disableNotificationRule(command: { notificationRuleId: ${formatValue(notificationRuleId)} })
    }
  `, data => data.disableNotificationRule, false);

  return { getNotificationRules, createNotificationRule, updateNotificationRule, disableNotificationRule };
};

export default useNotificationRuleService;

