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