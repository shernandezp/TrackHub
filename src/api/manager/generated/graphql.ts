/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type AssignmentStatus =
  | 'ACTIVE'
  | 'ENDED'
  | 'SUPERSEDED';

export type TransporterDeviceAssignmentDtoInput = {
  accountId: string;
  assignmentReason?: string | null | undefined;
  deviceId: string;
  isPrimary: boolean;
  priority: number;
  transporterId: string;
};

export type TransporterDtoInput = {
  accountId: string;
  name: string;
  transporterTypeId: number;
};

export type TransporterType =
  | 'AIRCRAFT'
  | 'ASSET'
  | 'BICYCLE'
  | 'BOAT'
  | 'CAR'
  | 'CARGO_CONTAINER'
  | 'CHILD'
  | 'CONSTRUCTION_VEHICLE'
  | 'DELIVERY_VAN'
  | 'DRONE'
  | 'ELDERLY_PERSON'
  | 'FLEET_VEHICLE'
  | 'HEAVY_EQUIPMENT'
  | 'LIVESTOCK'
  | 'MOTORCYCLE'
  | 'PACKAGE'
  | 'PERSON'
  | 'PET'
  | 'SCHOOL_BUS'
  | 'SCOOTER'
  | 'TAXI'
  | 'TOOL'
  | 'TRACTOR'
  | 'TRUCK';

export type UpdateTransporterDtoInput = {
  name: string;
  transporterId: string;
  transporterTypeId: number;
};

export type TransporterItemFragment = { transporterId: string, name: string, transporterType: TransporterType, transporterTypeId: number };

export type GetTransporterQueryVariables = Exact<{
  id: string;
}>;


export type GetTransporterQuery = { transporter: { transporterId: string, name: string, transporterType: TransporterType, transporterTypeId: number } };

export type GetTransportersByAccountQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTransportersByAccountQuery = { transportersByAccount: Array<{ transporterId: string, name: string, transporterType: TransporterType, transporterTypeId: number }> };

export type GetTransportersByUserQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTransportersByUserQuery = { transportersByUser: Array<{ transporterId: string, name: string, transporterType: TransporterType, transporterTypeId: number }> };

export type GetTransportersByGroupQueryVariables = Exact<{
  groupId: number;
}>;


export type GetTransportersByGroupQuery = { transportersByGroup: Array<{ transporterId: string, name: string, transporterType: TransporterType, transporterTypeId: number }> };

export type CreateTransporterMutationVariables = Exact<{
  transporter: TransporterDtoInput;
}>;


export type CreateTransporterMutation = { createTransporter: { transporterId: string, name: string, transporterType: TransporterType, transporterTypeId: number } };

export type UpdateTransporterMutationVariables = Exact<{
  id: string;
  transporter: UpdateTransporterDtoInput;
}>;


export type UpdateTransporterMutation = { updateTransporter: boolean };

export type DeleteTransporterMutationVariables = Exact<{
  id: string;
}>;


export type DeleteTransporterMutation = { deleteTransporter: string };

export type AssignmentFieldsFragment = { transporterDeviceAssignmentId: string, accountId: string, transporterId: string, deviceId: string, effectiveFrom: string, effectiveTo: string | null, priority: number, isPrimary: boolean, status: AssignmentStatus, assignmentReason: string | null };

export type GetTransporterDeviceAssignmentsByAccountQueryVariables = Exact<{
  accountId: string;
  activeOnly: boolean;
}>;


export type GetTransporterDeviceAssignmentsByAccountQuery = { transporterDeviceAssignmentsByAccount: Array<{ createdByPrincipalType: string, createdByPrincipalId: string, transporterDeviceAssignmentId: string, accountId: string, transporterId: string, deviceId: string, effectiveFrom: string, effectiveTo: string | null, priority: number, isPrimary: boolean, status: AssignmentStatus, assignmentReason: string | null }> };

export type GetTransporterDeviceAssignmentsByTransporterQueryVariables = Exact<{
  transporterId: string;
  activeOnly: boolean;
}>;


export type GetTransporterDeviceAssignmentsByTransporterQuery = { transporterDeviceAssignmentsByTransporter: Array<{ transporterDeviceAssignmentId: string, accountId: string, transporterId: string, deviceId: string, effectiveFrom: string, effectiveTo: string | null, priority: number, isPrimary: boolean, status: AssignmentStatus, assignmentReason: string | null }> };

export type AssignDeviceToTransporterMutationVariables = Exact<{
  assignment: TransporterDeviceAssignmentDtoInput;
}>;


export type AssignDeviceToTransporterMutation = { assignDeviceToTransporter: { transporterDeviceAssignmentId: string, deviceId: string, transporterId: string, effectiveFrom: string, isPrimary: boolean, status: AssignmentStatus } };

export type EndDeviceTransporterAssignmentMutationVariables = Exact<{
  assignmentId: string;
  reason?: string | null | undefined;
}>;


export type EndDeviceTransporterAssignmentMutation = { endDeviceTransporterAssignment: boolean };

export const TransporterItemFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TransporterItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TransporterVm"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transporterId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"transporterType"}},{"kind":"Field","name":{"kind":"Name","value":"transporterTypeId"}}]}}]} as unknown as DocumentNode<TransporterItemFragment, unknown>;
export const AssignmentFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssignmentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TransporterDeviceAssignmentVm"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transporterDeviceAssignmentId"}},{"kind":"Field","name":{"kind":"Name","value":"accountId"}},{"kind":"Field","name":{"kind":"Name","value":"transporterId"}},{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveFrom"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveTo"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"assignmentReason"}}]}}]} as unknown as DocumentNode<AssignmentFieldsFragment, unknown>;
export const GetTransporterDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTransporter"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transporter"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TransporterItem"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TransporterItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TransporterVm"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transporterId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"transporterType"}},{"kind":"Field","name":{"kind":"Name","value":"transporterTypeId"}}]}}]} as unknown as DocumentNode<GetTransporterQuery, GetTransporterQueryVariables>;
export const GetTransportersByAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTransportersByAccount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transportersByAccount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TransporterItem"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TransporterItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TransporterVm"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transporterId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"transporterType"}},{"kind":"Field","name":{"kind":"Name","value":"transporterTypeId"}}]}}]} as unknown as DocumentNode<GetTransportersByAccountQuery, GetTransportersByAccountQueryVariables>;
export const GetTransportersByUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTransportersByUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transportersByUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TransporterItem"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TransporterItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TransporterVm"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transporterId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"transporterType"}},{"kind":"Field","name":{"kind":"Name","value":"transporterTypeId"}}]}}]} as unknown as DocumentNode<GetTransportersByUserQuery, GetTransportersByUserQueryVariables>;
export const GetTransportersByGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTransportersByGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Long"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transportersByGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"groupId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TransporterItem"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TransporterItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TransporterVm"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transporterId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"transporterType"}},{"kind":"Field","name":{"kind":"Name","value":"transporterTypeId"}}]}}]} as unknown as DocumentNode<GetTransportersByGroupQuery, GetTransportersByGroupQueryVariables>;
export const CreateTransporterDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTransporter"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"transporter"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TransporterDtoInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTransporter"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"command"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"transporter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"transporter"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TransporterItem"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TransporterItem"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TransporterVm"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transporterId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"transporterType"}},{"kind":"Field","name":{"kind":"Name","value":"transporterTypeId"}}]}}]} as unknown as DocumentNode<CreateTransporterMutation, CreateTransporterMutationVariables>;
export const UpdateTransporterDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTransporter"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"transporter"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTransporterDtoInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTransporter"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"command"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"transporter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"transporter"}}}]}}]}]}}]} as unknown as DocumentNode<UpdateTransporterMutation, UpdateTransporterMutationVariables>;
export const DeleteTransporterDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteTransporter"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTransporter"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteTransporterMutation, DeleteTransporterMutationVariables>;
export const GetTransporterDeviceAssignmentsByAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTransporterDeviceAssignmentsByAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"activeOnly"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transporterDeviceAssignmentsByAccount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"accountId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"activeOnly"},"value":{"kind":"Variable","name":{"kind":"Name","value":"activeOnly"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AssignmentFields"}},{"kind":"Field","name":{"kind":"Name","value":"createdByPrincipalType"}},{"kind":"Field","name":{"kind":"Name","value":"createdByPrincipalId"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssignmentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TransporterDeviceAssignmentVm"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transporterDeviceAssignmentId"}},{"kind":"Field","name":{"kind":"Name","value":"accountId"}},{"kind":"Field","name":{"kind":"Name","value":"transporterId"}},{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveFrom"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveTo"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"assignmentReason"}}]}}]} as unknown as DocumentNode<GetTransporterDeviceAssignmentsByAccountQuery, GetTransporterDeviceAssignmentsByAccountQueryVariables>;
export const GetTransporterDeviceAssignmentsByTransporterDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTransporterDeviceAssignmentsByTransporter"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"transporterId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"activeOnly"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transporterDeviceAssignmentsByTransporter"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"transporterId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"transporterId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"activeOnly"},"value":{"kind":"Variable","name":{"kind":"Name","value":"activeOnly"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AssignmentFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssignmentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TransporterDeviceAssignmentVm"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transporterDeviceAssignmentId"}},{"kind":"Field","name":{"kind":"Name","value":"accountId"}},{"kind":"Field","name":{"kind":"Name","value":"transporterId"}},{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveFrom"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveTo"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"assignmentReason"}}]}}]} as unknown as DocumentNode<GetTransporterDeviceAssignmentsByTransporterQuery, GetTransporterDeviceAssignmentsByTransporterQueryVariables>;
export const AssignDeviceToTransporterDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AssignDeviceToTransporter"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"assignment"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TransporterDeviceAssignmentDtoInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"assignDeviceToTransporter"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"command"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"assignment"},"value":{"kind":"Variable","name":{"kind":"Name","value":"assignment"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transporterDeviceAssignmentId"}},{"kind":"Field","name":{"kind":"Name","value":"deviceId"}},{"kind":"Field","name":{"kind":"Name","value":"transporterId"}},{"kind":"Field","name":{"kind":"Name","value":"effectiveFrom"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<AssignDeviceToTransporterMutation, AssignDeviceToTransporterMutationVariables>;
export const EndDeviceTransporterAssignmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EndDeviceTransporterAssignment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"assignmentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reason"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"endDeviceTransporterAssignment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"command"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"assignmentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"assignmentId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"reason"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reason"}}}]}}]}]}}]} as unknown as DocumentNode<EndDeviceTransporterAssignmentMutation, EndDeviceTransporterAssignmentMutationVariables>;