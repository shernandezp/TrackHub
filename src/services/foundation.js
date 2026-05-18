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

const useFoundationService = () => {
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

  const getCurrentPrincipal = async () => execute(`
    query {
      currentPrincipal {
        subjectId
        principalType
        userId
        driverId
        clientId
        publicLinkGrantId
        role
        accountId
        scopes
        correlationId
      }
    }
  `, data => data.currentPrincipal, null);

  const getAccountFeatures = async (accountId) => execute(`
    query {
      accountFeatures(query: { accountId: ${formatValue(accountId)} }) {
        accountFeatureId
        accountId
        featureKey
        enabled
        tier
        source
        effectiveFrom
        effectiveTo
        configurationJson
        lastModified
      }
    }
  `, data => data.accountFeatures, []);

  const setAccountFeature = async (feature) => execute(`
    mutation {
      setAccountFeature(command: { feature: {
        accountId: ${formatValue(feature.accountId)}
        featureKey: ${formatValue(feature.featureKey)}
        enabled: ${feature.enabled}
        tier: ${formatValue(feature.tier || 'default')}
        source: ${formatValue(feature.source || 'portal')}
        effectiveFrom: ${formatValue(feature.effectiveFrom)}
        effectiveTo: ${formatValue(feature.effectiveTo)}
        configurationJson: ${formatValue(feature.configurationJson)}
      }}) {
        accountFeatureId
        accountId
        featureKey
        enabled
        tier
        source
        effectiveFrom
        effectiveTo
        configurationJson
        lastModified
      }
    }
  `, data => data.setAccountFeature, null);

  const getDriversByAccount = async (accountId, skip = 0, take = 50) => execute(`
    query {
      driversByAccount(query: { accountId: ${formatValue(accountId)}, skip: ${skip}, take: ${take} }) {
        driverId
        accountId
        name
        phone
        documentType
        documentNumber
        active
        employeeCode
        licenseNumber
        licenseExpiresAt
        defaultTransporterId
        lastModified
      }
    }
  `, data => data.driversByAccount, []);

  const getAuditTrail = async (accountId, skip = 0, take = 50) => execute(`
    query {
      auditTrail(query: { accountId: ${formatValue(accountId)}, skip: ${skip}, take: ${take} }) {
        auditEventId
        accountId
        actorType
        actorId
        action
        resourceType
        resourceId
        result
        reason
        correlationId
        occurredAt
      }
    }
  `, data => data.auditTrail, []);

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

  const getAlertEvents = async (accountId, skip = 0, take = 50) => execute(`
    query {
      alertEvents(query: { accountId: ${formatValue(accountId)}, skip: ${skip}, take: ${take} }) {
        alertEventId
        accountId
        eventType
        severity
        sourceModule
        resourceType
        resourceId
        status
        firstSeenAt
        lastSeenAt
        deduplicationKey
      }
    }
  `, data => data.alertEvents, []);

  const getBackgroundJobRuns = async (accountId, skip = 0, take = 50) => execute(`
    query {
      backgroundJobRuns(query: { accountId: ${formatValue(accountId)}, skip: ${skip}, take: ${take} }) {
        backgroundJobRunId
        jobKey
        accountId
        resourceKey
        idempotencyKey
        status
        attempts
        startedAt
        completedAt
        errorCode
        errorMessage
      }
    }
  `, data => data.backgroundJobRuns, []);

  const getDocumentsForOwner = async (accountId, ownerEntityType, ownerEntityId, skip = 0, take = 50) => execute(`
    query {
      documentsForOwner(query: { accountId: ${formatValue(accountId)}, ownerEntityType: ${formatValue(ownerEntityType)}, ownerEntityId: ${formatValue(ownerEntityId)}, skip: ${skip}, take: ${take} }) {
        documentId
        accountId
        ownerEntityType
        ownerEntityId
        contentType
        sizeBytes
        classification
        status
        expiresAt
        visibilityScope
        scanStatus
        lastModified
      }
    }
  `, data => data.documentsForOwner, []);

  const getPublicLinkGrant = async (publicLinkGrantId) => execute(`
    query {
      publicLinkGrant(query: { publicLinkGrantId: ${formatValue(publicLinkGrantId)} }) {
        publicLinkGrantId
        accountId
        resourceType
        resourceId
        scopes
        purpose
        expiresAt
        revokedAt
        accessCount
        lastAccessedAt
        lastModified
      }
    }
  `, data => data.publicLinkGrant, null);

  const getPublicLinkGrantsByAccount = async (accountId, skip = 0, take = 50) => execute(`
    query {
      publicLinkGrantsByAccount(query: { accountId: ${formatValue(accountId)}, skip: ${skip}, take: ${take} }) {
        publicLinkGrantId
        accountId
        resourceType
        resourceId
        scopes
        purpose
        expiresAt
        revokedAt
        revokedBy
        createdByPrincipalId
        accessCount
        lastAccessedAt
        lastModified
      }
    }
  `, data => data.publicLinkGrantsByAccount, []);

  const getSupportGrantStatus = async (accountSupportGrantId) => execute(`
    query {
      supportGrantStatus(query: { accountSupportGrantId: ${formatValue(accountSupportGrantId)} }) {
        accountSupportGrantId
        accountId
        supportUserId
        reason
        ticketReference
        approvedBy
        approvedAt
        accessLevel
        startsAt
        endsAt
        revokedAt
        revokedBy
        lastModified
      }
    }
  `, data => data.supportGrantStatus, null);

  const getAccountSupportGrants = async (accountId, skip = 0, take = 50) => execute(`
    query {
      accountSupportGrants(query: { accountId: ${formatValue(accountId)}, skip: ${skip}, take: ${take} }) {
        accountSupportGrantId
        accountId
        supportUserId
        reason
        ticketReference
        approvedBy
        approvedAt
        accessLevel
        startsAt
        endsAt
        revokedAt
        revokedBy
        lastModified
      }
    }
  `, data => data.accountSupportGrants, []);

  const createDriver = async (driver) => execute(`
    mutation {
      createDriver(command: { driver: {
        accountId: ${formatValue(driver.accountId)}
        name: ${formatValue(driver.name)}
        phone: ${formatValue(driver.phone)}
        documentType: ${formatValue(driver.documentType)}
        documentNumber: ${formatValue(driver.documentNumber)}
        active: ${driver.active}
        employeeCode: ${formatValue(driver.employeeCode)}
        licenseNumber: ${formatValue(driver.licenseNumber)}
        licenseExpiresAt: ${formatValue(driver.licenseExpiresAt)}
        defaultTransporterId: ${formatValue(driver.defaultTransporterId)}
      }}) {
        driverId
        accountId
        name
        active
        lastModified
      }
    }
  `, data => data.createDriver, null);

  const updateDriver = async (driverId, driver) => execute(`
    mutation {
      updateDriver(command: { driverId: ${formatValue(driverId)}, driver: {
        accountId: ${formatValue(driver.accountId)}
        name: ${formatValue(driver.name)}
        phone: ${formatValue(driver.phone)}
        documentType: ${formatValue(driver.documentType)}
        documentNumber: ${formatValue(driver.documentNumber)}
        active: ${driver.active}
        employeeCode: ${formatValue(driver.employeeCode)}
        licenseNumber: ${formatValue(driver.licenseNumber)}
        licenseExpiresAt: ${formatValue(driver.licenseExpiresAt)}
        defaultTransporterId: ${formatValue(driver.defaultTransporterId)}
      }})
    }
  `, data => data.updateDriver, false);

  const deactivateDriver = async (driverId) => execute(`
    mutation {
      deactivateDriver(command: { driverId: ${formatValue(driverId)} })
    }
  `, data => data.deactivateDriver, false);

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

  const acknowledgeAlertEvent = async (alertEventId) => execute(`
    mutation {
      acknowledgeAlertEvent(command: { alertEventId: ${formatValue(alertEventId)} })
    }
  `, data => data.acknowledgeAlertEvent, false);

  const resolveAlertEvent = async (alertEventId) => execute(`
    mutation {
      resolveAlertEvent(command: { alertEventId: ${formatValue(alertEventId)} })
    }
  `, data => data.resolveAlertEvent, false);

  const createPublicLinkGrant = async (grant) => execute(`
    mutation {
      createPublicLinkGrant(command: { publicLinkGrant: {
        accountId: ${formatValue(grant.accountId)}
        resourceType: ${formatValue(grant.resourceType)}
        resourceId: ${formatValue(grant.resourceId)}
        scopes: ${formatValue(grant.scopes)}
        purpose: ${formatValue(grant.purpose)}
        subjectTokenIdHash: ${formatValue(grant.subjectTokenIdHash)}
        expiresAt: ${formatValue(grant.expiresAt)}
        createdByPrincipalId: ${formatValue(grant.createdByPrincipalId)}
      }}) {
        publicLinkGrantId
        accountId
        resourceType
        resourceId
        token
        expiresAt
        lastModified
      }
    }
  `, data => data.createPublicLinkGrant, null);

  const revokePublicLinkGrant = async (publicLinkGrantId, revokedBy) => execute(`
    mutation {
      revokePublicLinkGrant(command: { publicLinkGrantId: ${formatValue(publicLinkGrantId)}, revokedBy: ${formatValue(revokedBy)} })
    }
  `, data => data.revokePublicLinkGrant, false);

  const createAccountSupportGrant = async (grant) => execute(`
    mutation {
      createAccountSupportGrant(command: { accountSupportGrant: {
        accountId: ${formatValue(grant.accountId)}
        supportUserId: ${formatValue(grant.supportUserId)}
        reason: ${formatValue(grant.reason)}
        ticketReference: ${formatValue(grant.ticketReference)}
        accessLevel: ${formatValue(grant.accessLevel)}
        startsAt: ${formatValue(grant.startsAt)}
        endsAt: ${formatValue(grant.endsAt)}
      }}) {
        accountSupportGrantId
        accountId
        supportUserId
        approvedAt
        revokedAt
        lastModified
      }
    }
  `, data => data.createAccountSupportGrant, null);

  const approveAccountSupportGrant = async (accountSupportGrantId, approvedBy) => execute(`
    mutation {
      approveAccountSupportGrant(command: { accountSupportGrantId: ${formatValue(accountSupportGrantId)}, approvedBy: ${formatValue(approvedBy)} })
    }
  `, data => data.approveAccountSupportGrant, false);

  const revokeAccountSupportGrant = async (accountSupportGrantId, revokedBy) => execute(`
    mutation {
      revokeAccountSupportGrant(command: { accountSupportGrantId: ${formatValue(accountSupportGrantId)}, revokedBy: ${formatValue(revokedBy)} })
    }
  `, data => data.revokeAccountSupportGrant, false);

  return {
    getCurrentPrincipal,
    getAccountFeatures,
    setAccountFeature,
    getDriversByAccount,
    getAuditTrail,
    getNotificationRules,
    getAlertEvents,
    getBackgroundJobRuns,
    getDocumentsForOwner,
    getPublicLinkGrant,
    getPublicLinkGrantsByAccount,
    getSupportGrantStatus,
    getAccountSupportGrants,
    createDriver,
    updateDriver,
    deactivateDriver,
    createNotificationRule,
    updateNotificationRule,
    disableNotificationRule,
    acknowledgeAlertEvent,
    resolveAlertEvent,
    createPublicLinkGrant,
    revokePublicLinkGrant,
    createAccountSupportGrant,
    approveAccountSupportGrant,
    revokeAccountSupportGrant
  };
};

export default useFoundationService;
