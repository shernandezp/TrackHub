/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query GetGpsIntegrationDashboard($accountId: UUID!) {\n    gpsIntegrationDashboard(query: { accountId: $accountId }) {\n      operatorsTotal\n      operatorsEnabled\n      operatorsHealthy\n      operatorsDegraded\n      operatorsOffline\n      devicesTotal\n      devicesNew\n      devicesAvailable\n      devicesAssigned\n      devicesIgnored\n      devicesRemoved\n      recentlyAddedDevicesLast24h\n      unassignedDevicesCount\n      syncRunsSucceededLast24h\n      syncRunsFailedLast24h\n      lastAutomaticSyncAt\n      lastManualSyncAt\n      averageSyncDurationSeconds\n      deviceCountsByProviderStatus {\n        operatorId\n        operatorName\n        detectedStatus\n        count\n      }\n    }\n  }\n": typeof types.GetGpsIntegrationDashboardDocument,
    "\n  fragment OperatorDetail on OperatorVm {\n    operatorId\n    name\n    description\n    phoneNumber\n    emailAddress\n    address\n    contactName\n    protocolType\n    protocolTypeId\n    enabled\n    syncIntervalMinutes\n    healthStatus\n    lastSuccessfulSyncAt\n    lastFailedSyncAt\n    lastFailureCode\n    lastLatencyMs\n    lastDeviceSyncAt\n    lastPositionSyncAt\n    lastModified\n  }\n": typeof types.OperatorDetailFragmentDoc,
    "\n  fragment OperatorSummary on OperatorVm {\n    operatorId\n    name\n  }\n": typeof types.OperatorSummaryFragmentDoc,
    "\n  fragment OperatorGps on OperatorVm {\n    operatorId\n    name\n    protocolType\n    enabled\n    lastDeviceSyncAt\n    lastPositionSyncAt\n    syncIntervalMinutes\n  }\n": typeof types.OperatorGpsFragmentDoc,
    "\n  query GetOperator($id: UUID!) {\n    operator(query: { id: $id }) {\n      ...OperatorDetail\n    }\n  }\n": typeof types.GetOperatorDocument,
    "\n  query GetOperatorsByCurrentAccount {\n    operatorsByCurrentAccount {\n      ...OperatorDetail\n    }\n  }\n": typeof types.GetOperatorsByCurrentAccountDocument,
    "\n  query GetOperatorsSummary {\n    operatorsByCurrentAccount {\n      ...OperatorSummary\n    }\n  }\n": typeof types.GetOperatorsSummaryDocument,
    "\n  query GetGpsOperators {\n    operatorsByCurrentAccount {\n      ...OperatorGps\n    }\n  }\n": typeof types.GetGpsOperatorsDocument,
    "\n  mutation CreateOperator($operator: OperatorDtoInput!) {\n    createOperator(command: { operator: $operator }) {\n      ...OperatorDetail\n    }\n  }\n": typeof types.CreateOperatorDocument,
    "\n  mutation UpdateOperator($id: UUID!, $operator: UpdateOperatorDtoInput!) {\n    updateOperator(id: $id, command: { operator: $operator })\n  }\n": typeof types.UpdateOperatorDocument,
    "\n  mutation DeleteOperator($id: UUID!) {\n    deleteOperator(id: $id)\n  }\n": typeof types.DeleteOperatorDocument,
    "\n  mutation SetOperatorEnabled($operatorId: UUID!, $enabled: Boolean!) {\n    setOperatorEnabled(command: { operatorId: $operatorId, enabled: $enabled })\n  }\n": typeof types.SetOperatorEnabledDocument,
    "\n  mutation TriggerOperatorDeviceSync($command: TriggerOperatorDeviceSyncCommandInput!) {\n    triggerOperatorDeviceSync(command: $command)\n  }\n": typeof types.TriggerOperatorDeviceSyncDocument,
    "\n  fragment TransporterItem on TransporterVm {\n    transporterId\n    name\n    transporterType\n    transporterTypeId\n  }\n": typeof types.TransporterItemFragmentDoc,
    "\n  query GetTransporter($id: UUID!) {\n    transporter(query: { id: $id }) {\n      ...TransporterItem\n    }\n  }\n": typeof types.GetTransporterDocument,
    "\n  query GetTransportersByAccount {\n    transportersByAccount {\n      ...TransporterItem\n    }\n  }\n": typeof types.GetTransportersByAccountDocument,
    "\n  query GetTransportersByUser {\n    transportersByUser {\n      ...TransporterItem\n    }\n  }\n": typeof types.GetTransportersByUserDocument,
    "\n  query GetTransportersByGroup($groupId: Long!) {\n    transportersByGroup(query: { groupId: $groupId }) {\n      ...TransporterItem\n    }\n  }\n": typeof types.GetTransportersByGroupDocument,
    "\n  mutation CreateTransporter($transporter: TransporterDtoInput!) {\n    createTransporter(command: { transporter: $transporter }) {\n      ...TransporterItem\n    }\n  }\n": typeof types.CreateTransporterDocument,
    "\n  mutation UpdateTransporter($id: UUID!, $transporter: UpdateTransporterDtoInput!) {\n    updateTransporter(id: $id, command: { transporter: $transporter })\n  }\n": typeof types.UpdateTransporterDocument,
    "\n  mutation DeleteTransporter($id: UUID!) {\n    deleteTransporter(id: $id)\n  }\n": typeof types.DeleteTransporterDocument,
    "\n  fragment AssignmentFields on TransporterDeviceAssignmentVm {\n    transporterDeviceAssignmentId\n    accountId\n    transporterId\n    deviceId\n    effectiveFrom\n    effectiveTo\n    priority\n    isPrimary\n    status\n    assignmentReason\n  }\n": typeof types.AssignmentFieldsFragmentDoc,
    "\n  query GetTransporterDeviceAssignmentsByAccount($accountId: UUID!, $activeOnly: Boolean!) {\n    transporterDeviceAssignmentsByAccount(query: { accountId: $accountId, activeOnly: $activeOnly }) {\n      ...AssignmentFields\n      createdByPrincipalType\n      createdByPrincipalId\n    }\n  }\n": typeof types.GetTransporterDeviceAssignmentsByAccountDocument,
    "\n  query GetTransporterDeviceAssignmentsByTransporter($transporterId: UUID!, $activeOnly: Boolean!) {\n    transporterDeviceAssignmentsByTransporter(\n      query: { transporterId: $transporterId, activeOnly: $activeOnly }\n    ) {\n      ...AssignmentFields\n    }\n  }\n": typeof types.GetTransporterDeviceAssignmentsByTransporterDocument,
    "\n  mutation AssignDeviceToTransporter($assignment: TransporterDeviceAssignmentDtoInput!) {\n    assignDeviceToTransporter(command: { assignment: $assignment }) {\n      transporterDeviceAssignmentId\n      deviceId\n      transporterId\n      effectiveFrom\n      isPrimary\n      status\n    }\n  }\n": typeof types.AssignDeviceToTransporterDocument,
    "\n  mutation EndDeviceTransporterAssignment($assignmentId: UUID!, $reason: String) {\n    endDeviceTransporterAssignment(command: { assignmentId: $assignmentId, reason: $reason })\n  }\n": typeof types.EndDeviceTransporterAssignmentDocument,
};
const documents: Documents = {
    "\n  query GetGpsIntegrationDashboard($accountId: UUID!) {\n    gpsIntegrationDashboard(query: { accountId: $accountId }) {\n      operatorsTotal\n      operatorsEnabled\n      operatorsHealthy\n      operatorsDegraded\n      operatorsOffline\n      devicesTotal\n      devicesNew\n      devicesAvailable\n      devicesAssigned\n      devicesIgnored\n      devicesRemoved\n      recentlyAddedDevicesLast24h\n      unassignedDevicesCount\n      syncRunsSucceededLast24h\n      syncRunsFailedLast24h\n      lastAutomaticSyncAt\n      lastManualSyncAt\n      averageSyncDurationSeconds\n      deviceCountsByProviderStatus {\n        operatorId\n        operatorName\n        detectedStatus\n        count\n      }\n    }\n  }\n": types.GetGpsIntegrationDashboardDocument,
    "\n  fragment OperatorDetail on OperatorVm {\n    operatorId\n    name\n    description\n    phoneNumber\n    emailAddress\n    address\n    contactName\n    protocolType\n    protocolTypeId\n    enabled\n    syncIntervalMinutes\n    healthStatus\n    lastSuccessfulSyncAt\n    lastFailedSyncAt\n    lastFailureCode\n    lastLatencyMs\n    lastDeviceSyncAt\n    lastPositionSyncAt\n    lastModified\n  }\n": types.OperatorDetailFragmentDoc,
    "\n  fragment OperatorSummary on OperatorVm {\n    operatorId\n    name\n  }\n": types.OperatorSummaryFragmentDoc,
    "\n  fragment OperatorGps on OperatorVm {\n    operatorId\n    name\n    protocolType\n    enabled\n    lastDeviceSyncAt\n    lastPositionSyncAt\n    syncIntervalMinutes\n  }\n": types.OperatorGpsFragmentDoc,
    "\n  query GetOperator($id: UUID!) {\n    operator(query: { id: $id }) {\n      ...OperatorDetail\n    }\n  }\n": types.GetOperatorDocument,
    "\n  query GetOperatorsByCurrentAccount {\n    operatorsByCurrentAccount {\n      ...OperatorDetail\n    }\n  }\n": types.GetOperatorsByCurrentAccountDocument,
    "\n  query GetOperatorsSummary {\n    operatorsByCurrentAccount {\n      ...OperatorSummary\n    }\n  }\n": types.GetOperatorsSummaryDocument,
    "\n  query GetGpsOperators {\n    operatorsByCurrentAccount {\n      ...OperatorGps\n    }\n  }\n": types.GetGpsOperatorsDocument,
    "\n  mutation CreateOperator($operator: OperatorDtoInput!) {\n    createOperator(command: { operator: $operator }) {\n      ...OperatorDetail\n    }\n  }\n": types.CreateOperatorDocument,
    "\n  mutation UpdateOperator($id: UUID!, $operator: UpdateOperatorDtoInput!) {\n    updateOperator(id: $id, command: { operator: $operator })\n  }\n": types.UpdateOperatorDocument,
    "\n  mutation DeleteOperator($id: UUID!) {\n    deleteOperator(id: $id)\n  }\n": types.DeleteOperatorDocument,
    "\n  mutation SetOperatorEnabled($operatorId: UUID!, $enabled: Boolean!) {\n    setOperatorEnabled(command: { operatorId: $operatorId, enabled: $enabled })\n  }\n": types.SetOperatorEnabledDocument,
    "\n  mutation TriggerOperatorDeviceSync($command: TriggerOperatorDeviceSyncCommandInput!) {\n    triggerOperatorDeviceSync(command: $command)\n  }\n": types.TriggerOperatorDeviceSyncDocument,
    "\n  fragment TransporterItem on TransporterVm {\n    transporterId\n    name\n    transporterType\n    transporterTypeId\n  }\n": types.TransporterItemFragmentDoc,
    "\n  query GetTransporter($id: UUID!) {\n    transporter(query: { id: $id }) {\n      ...TransporterItem\n    }\n  }\n": types.GetTransporterDocument,
    "\n  query GetTransportersByAccount {\n    transportersByAccount {\n      ...TransporterItem\n    }\n  }\n": types.GetTransportersByAccountDocument,
    "\n  query GetTransportersByUser {\n    transportersByUser {\n      ...TransporterItem\n    }\n  }\n": types.GetTransportersByUserDocument,
    "\n  query GetTransportersByGroup($groupId: Long!) {\n    transportersByGroup(query: { groupId: $groupId }) {\n      ...TransporterItem\n    }\n  }\n": types.GetTransportersByGroupDocument,
    "\n  mutation CreateTransporter($transporter: TransporterDtoInput!) {\n    createTransporter(command: { transporter: $transporter }) {\n      ...TransporterItem\n    }\n  }\n": types.CreateTransporterDocument,
    "\n  mutation UpdateTransporter($id: UUID!, $transporter: UpdateTransporterDtoInput!) {\n    updateTransporter(id: $id, command: { transporter: $transporter })\n  }\n": types.UpdateTransporterDocument,
    "\n  mutation DeleteTransporter($id: UUID!) {\n    deleteTransporter(id: $id)\n  }\n": types.DeleteTransporterDocument,
    "\n  fragment AssignmentFields on TransporterDeviceAssignmentVm {\n    transporterDeviceAssignmentId\n    accountId\n    transporterId\n    deviceId\n    effectiveFrom\n    effectiveTo\n    priority\n    isPrimary\n    status\n    assignmentReason\n  }\n": types.AssignmentFieldsFragmentDoc,
    "\n  query GetTransporterDeviceAssignmentsByAccount($accountId: UUID!, $activeOnly: Boolean!) {\n    transporterDeviceAssignmentsByAccount(query: { accountId: $accountId, activeOnly: $activeOnly }) {\n      ...AssignmentFields\n      createdByPrincipalType\n      createdByPrincipalId\n    }\n  }\n": types.GetTransporterDeviceAssignmentsByAccountDocument,
    "\n  query GetTransporterDeviceAssignmentsByTransporter($transporterId: UUID!, $activeOnly: Boolean!) {\n    transporterDeviceAssignmentsByTransporter(\n      query: { transporterId: $transporterId, activeOnly: $activeOnly }\n    ) {\n      ...AssignmentFields\n    }\n  }\n": types.GetTransporterDeviceAssignmentsByTransporterDocument,
    "\n  mutation AssignDeviceToTransporter($assignment: TransporterDeviceAssignmentDtoInput!) {\n    assignDeviceToTransporter(command: { assignment: $assignment }) {\n      transporterDeviceAssignmentId\n      deviceId\n      transporterId\n      effectiveFrom\n      isPrimary\n      status\n    }\n  }\n": types.AssignDeviceToTransporterDocument,
    "\n  mutation EndDeviceTransporterAssignment($assignmentId: UUID!, $reason: String) {\n    endDeviceTransporterAssignment(command: { assignmentId: $assignmentId, reason: $reason })\n  }\n": types.EndDeviceTransporterAssignmentDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetGpsIntegrationDashboard($accountId: UUID!) {\n    gpsIntegrationDashboard(query: { accountId: $accountId }) {\n      operatorsTotal\n      operatorsEnabled\n      operatorsHealthy\n      operatorsDegraded\n      operatorsOffline\n      devicesTotal\n      devicesNew\n      devicesAvailable\n      devicesAssigned\n      devicesIgnored\n      devicesRemoved\n      recentlyAddedDevicesLast24h\n      unassignedDevicesCount\n      syncRunsSucceededLast24h\n      syncRunsFailedLast24h\n      lastAutomaticSyncAt\n      lastManualSyncAt\n      averageSyncDurationSeconds\n      deviceCountsByProviderStatus {\n        operatorId\n        operatorName\n        detectedStatus\n        count\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetGpsIntegrationDashboard($accountId: UUID!) {\n    gpsIntegrationDashboard(query: { accountId: $accountId }) {\n      operatorsTotal\n      operatorsEnabled\n      operatorsHealthy\n      operatorsDegraded\n      operatorsOffline\n      devicesTotal\n      devicesNew\n      devicesAvailable\n      devicesAssigned\n      devicesIgnored\n      devicesRemoved\n      recentlyAddedDevicesLast24h\n      unassignedDevicesCount\n      syncRunsSucceededLast24h\n      syncRunsFailedLast24h\n      lastAutomaticSyncAt\n      lastManualSyncAt\n      averageSyncDurationSeconds\n      deviceCountsByProviderStatus {\n        operatorId\n        operatorName\n        detectedStatus\n        count\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment OperatorDetail on OperatorVm {\n    operatorId\n    name\n    description\n    phoneNumber\n    emailAddress\n    address\n    contactName\n    protocolType\n    protocolTypeId\n    enabled\n    syncIntervalMinutes\n    healthStatus\n    lastSuccessfulSyncAt\n    lastFailedSyncAt\n    lastFailureCode\n    lastLatencyMs\n    lastDeviceSyncAt\n    lastPositionSyncAt\n    lastModified\n  }\n"): (typeof documents)["\n  fragment OperatorDetail on OperatorVm {\n    operatorId\n    name\n    description\n    phoneNumber\n    emailAddress\n    address\n    contactName\n    protocolType\n    protocolTypeId\n    enabled\n    syncIntervalMinutes\n    healthStatus\n    lastSuccessfulSyncAt\n    lastFailedSyncAt\n    lastFailureCode\n    lastLatencyMs\n    lastDeviceSyncAt\n    lastPositionSyncAt\n    lastModified\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment OperatorSummary on OperatorVm {\n    operatorId\n    name\n  }\n"): (typeof documents)["\n  fragment OperatorSummary on OperatorVm {\n    operatorId\n    name\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment OperatorGps on OperatorVm {\n    operatorId\n    name\n    protocolType\n    enabled\n    lastDeviceSyncAt\n    lastPositionSyncAt\n    syncIntervalMinutes\n  }\n"): (typeof documents)["\n  fragment OperatorGps on OperatorVm {\n    operatorId\n    name\n    protocolType\n    enabled\n    lastDeviceSyncAt\n    lastPositionSyncAt\n    syncIntervalMinutes\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetOperator($id: UUID!) {\n    operator(query: { id: $id }) {\n      ...OperatorDetail\n    }\n  }\n"): (typeof documents)["\n  query GetOperator($id: UUID!) {\n    operator(query: { id: $id }) {\n      ...OperatorDetail\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetOperatorsByCurrentAccount {\n    operatorsByCurrentAccount {\n      ...OperatorDetail\n    }\n  }\n"): (typeof documents)["\n  query GetOperatorsByCurrentAccount {\n    operatorsByCurrentAccount {\n      ...OperatorDetail\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetOperatorsSummary {\n    operatorsByCurrentAccount {\n      ...OperatorSummary\n    }\n  }\n"): (typeof documents)["\n  query GetOperatorsSummary {\n    operatorsByCurrentAccount {\n      ...OperatorSummary\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetGpsOperators {\n    operatorsByCurrentAccount {\n      ...OperatorGps\n    }\n  }\n"): (typeof documents)["\n  query GetGpsOperators {\n    operatorsByCurrentAccount {\n      ...OperatorGps\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateOperator($operator: OperatorDtoInput!) {\n    createOperator(command: { operator: $operator }) {\n      ...OperatorDetail\n    }\n  }\n"): (typeof documents)["\n  mutation CreateOperator($operator: OperatorDtoInput!) {\n    createOperator(command: { operator: $operator }) {\n      ...OperatorDetail\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateOperator($id: UUID!, $operator: UpdateOperatorDtoInput!) {\n    updateOperator(id: $id, command: { operator: $operator })\n  }\n"): (typeof documents)["\n  mutation UpdateOperator($id: UUID!, $operator: UpdateOperatorDtoInput!) {\n    updateOperator(id: $id, command: { operator: $operator })\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteOperator($id: UUID!) {\n    deleteOperator(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteOperator($id: UUID!) {\n    deleteOperator(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SetOperatorEnabled($operatorId: UUID!, $enabled: Boolean!) {\n    setOperatorEnabled(command: { operatorId: $operatorId, enabled: $enabled })\n  }\n"): (typeof documents)["\n  mutation SetOperatorEnabled($operatorId: UUID!, $enabled: Boolean!) {\n    setOperatorEnabled(command: { operatorId: $operatorId, enabled: $enabled })\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation TriggerOperatorDeviceSync($command: TriggerOperatorDeviceSyncCommandInput!) {\n    triggerOperatorDeviceSync(command: $command)\n  }\n"): (typeof documents)["\n  mutation TriggerOperatorDeviceSync($command: TriggerOperatorDeviceSyncCommandInput!) {\n    triggerOperatorDeviceSync(command: $command)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment TransporterItem on TransporterVm {\n    transporterId\n    name\n    transporterType\n    transporterTypeId\n  }\n"): (typeof documents)["\n  fragment TransporterItem on TransporterVm {\n    transporterId\n    name\n    transporterType\n    transporterTypeId\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetTransporter($id: UUID!) {\n    transporter(query: { id: $id }) {\n      ...TransporterItem\n    }\n  }\n"): (typeof documents)["\n  query GetTransporter($id: UUID!) {\n    transporter(query: { id: $id }) {\n      ...TransporterItem\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetTransportersByAccount {\n    transportersByAccount {\n      ...TransporterItem\n    }\n  }\n"): (typeof documents)["\n  query GetTransportersByAccount {\n    transportersByAccount {\n      ...TransporterItem\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetTransportersByUser {\n    transportersByUser {\n      ...TransporterItem\n    }\n  }\n"): (typeof documents)["\n  query GetTransportersByUser {\n    transportersByUser {\n      ...TransporterItem\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetTransportersByGroup($groupId: Long!) {\n    transportersByGroup(query: { groupId: $groupId }) {\n      ...TransporterItem\n    }\n  }\n"): (typeof documents)["\n  query GetTransportersByGroup($groupId: Long!) {\n    transportersByGroup(query: { groupId: $groupId }) {\n      ...TransporterItem\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateTransporter($transporter: TransporterDtoInput!) {\n    createTransporter(command: { transporter: $transporter }) {\n      ...TransporterItem\n    }\n  }\n"): (typeof documents)["\n  mutation CreateTransporter($transporter: TransporterDtoInput!) {\n    createTransporter(command: { transporter: $transporter }) {\n      ...TransporterItem\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateTransporter($id: UUID!, $transporter: UpdateTransporterDtoInput!) {\n    updateTransporter(id: $id, command: { transporter: $transporter })\n  }\n"): (typeof documents)["\n  mutation UpdateTransporter($id: UUID!, $transporter: UpdateTransporterDtoInput!) {\n    updateTransporter(id: $id, command: { transporter: $transporter })\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteTransporter($id: UUID!) {\n    deleteTransporter(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteTransporter($id: UUID!) {\n    deleteTransporter(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment AssignmentFields on TransporterDeviceAssignmentVm {\n    transporterDeviceAssignmentId\n    accountId\n    transporterId\n    deviceId\n    effectiveFrom\n    effectiveTo\n    priority\n    isPrimary\n    status\n    assignmentReason\n  }\n"): (typeof documents)["\n  fragment AssignmentFields on TransporterDeviceAssignmentVm {\n    transporterDeviceAssignmentId\n    accountId\n    transporterId\n    deviceId\n    effectiveFrom\n    effectiveTo\n    priority\n    isPrimary\n    status\n    assignmentReason\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetTransporterDeviceAssignmentsByAccount($accountId: UUID!, $activeOnly: Boolean!) {\n    transporterDeviceAssignmentsByAccount(query: { accountId: $accountId, activeOnly: $activeOnly }) {\n      ...AssignmentFields\n      createdByPrincipalType\n      createdByPrincipalId\n    }\n  }\n"): (typeof documents)["\n  query GetTransporterDeviceAssignmentsByAccount($accountId: UUID!, $activeOnly: Boolean!) {\n    transporterDeviceAssignmentsByAccount(query: { accountId: $accountId, activeOnly: $activeOnly }) {\n      ...AssignmentFields\n      createdByPrincipalType\n      createdByPrincipalId\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetTransporterDeviceAssignmentsByTransporter($transporterId: UUID!, $activeOnly: Boolean!) {\n    transporterDeviceAssignmentsByTransporter(\n      query: { transporterId: $transporterId, activeOnly: $activeOnly }\n    ) {\n      ...AssignmentFields\n    }\n  }\n"): (typeof documents)["\n  query GetTransporterDeviceAssignmentsByTransporter($transporterId: UUID!, $activeOnly: Boolean!) {\n    transporterDeviceAssignmentsByTransporter(\n      query: { transporterId: $transporterId, activeOnly: $activeOnly }\n    ) {\n      ...AssignmentFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AssignDeviceToTransporter($assignment: TransporterDeviceAssignmentDtoInput!) {\n    assignDeviceToTransporter(command: { assignment: $assignment }) {\n      transporterDeviceAssignmentId\n      deviceId\n      transporterId\n      effectiveFrom\n      isPrimary\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation AssignDeviceToTransporter($assignment: TransporterDeviceAssignmentDtoInput!) {\n    assignDeviceToTransporter(command: { assignment: $assignment }) {\n      transporterDeviceAssignmentId\n      deviceId\n      transporterId\n      effectiveFrom\n      isPrimary\n      status\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation EndDeviceTransporterAssignment($assignmentId: UUID!, $reason: String) {\n    endDeviceTransporterAssignment(command: { assignmentId: $assignmentId, reason: $reason })\n  }\n"): (typeof documents)["\n  mutation EndDeviceTransporterAssignment($assignmentId: UUID!, $reason: String) {\n    endDeviceTransporterAssignment(command: { assignmentId: $assignmentId, reason: $reason })\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;