/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type CoordinateVmInput = {
  latitude: number;
  longitude: number;
};

export type GeofenceDtoInput = {
  active: boolean;
  color: number;
  description?: string | null | undefined;
  geofenceId: string;
  geom: MultiPolygonVmInput;
  name: string;
  type: number;
};

export type MultiPolygonVmInput = {
  coordinates: Array<CoordinateVmInput>;
  srid: number;
};

export type GeofenceFieldsFragment = { geofenceId: string, accountId: string, name: string, description: string | null, type: number, color: number, active: boolean, geom: { srid: number, coordinates: Array<{ latitude: number, longitude: number }> } };

export type GetGeofenceQueryVariables = Exact<{
  id: string;
}>;


export type GetGeofenceQuery = { geofence: { geofenceId: string, accountId: string, name: string, description: string | null, type: number, color: number, active: boolean, geom: { srid: number, coordinates: Array<{ latitude: number, longitude: number }> } } };

export type GetGeofencesByAccountQueryVariables = Exact<{
  enableCaching: boolean;
}>;


export type GetGeofencesByAccountQuery = { geofencesByAccount: Array<{ geofenceId: string, accountId: string, name: string, description: string | null, type: number, color: number, active: boolean, geom: { srid: number, coordinates: Array<{ latitude: number, longitude: number }> } }> };

export type GetTransportersInGeofenceQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTransportersInGeofenceQuery = { transportersInGeofence: Array<{ transporterId: string, transporterName: string, geofenceId: string, geofenceName: string }> };

export type CreateGeofenceMutationVariables = Exact<{
  geofence: GeofenceDtoInput;
}>;


export type CreateGeofenceMutation = { createGeofence: { geofenceId: string, accountId: string, name: string, description: string | null, type: number, color: number, active: boolean, geom: { srid: number, coordinates: Array<{ latitude: number, longitude: number }> } } };

export type UpdateGeofenceMutationVariables = Exact<{
  id: string;
  geofence: GeofenceDtoInput;
}>;


export type UpdateGeofenceMutation = { updateGeofence: boolean };

export type DeleteGeofenceMutationVariables = Exact<{
  id: string;
}>;


export type DeleteGeofenceMutation = { deleteGeofence: string };

export const GeofenceFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GeofenceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GeofenceVm"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"geofenceId"}},{"kind":"Field","name":{"kind":"Name","value":"accountId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"geom"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"srid"}},{"kind":"Field","name":{"kind":"Name","value":"coordinates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}}]}}]}}]}}]} as unknown as DocumentNode<GeofenceFieldsFragment, unknown>;
export const GetGeofenceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetGeofence"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"geofence"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GeofenceFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GeofenceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GeofenceVm"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"geofenceId"}},{"kind":"Field","name":{"kind":"Name","value":"accountId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"geom"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"srid"}},{"kind":"Field","name":{"kind":"Name","value":"coordinates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}}]}}]}}]}}]} as unknown as DocumentNode<GetGeofenceQuery, GetGeofenceQueryVariables>;
export const GetGeofencesByAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetGeofencesByAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"enableCaching"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"geofencesByAccount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"query"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"enableCaching"},"value":{"kind":"Variable","name":{"kind":"Name","value":"enableCaching"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GeofenceFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GeofenceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GeofenceVm"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"geofenceId"}},{"kind":"Field","name":{"kind":"Name","value":"accountId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"geom"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"srid"}},{"kind":"Field","name":{"kind":"Name","value":"coordinates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}}]}}]}}]}}]} as unknown as DocumentNode<GetGeofencesByAccountQuery, GetGeofencesByAccountQueryVariables>;
export const GetTransportersInGeofenceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTransportersInGeofence"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transportersInGeofence"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transporterId"}},{"kind":"Field","name":{"kind":"Name","value":"transporterName"}},{"kind":"Field","name":{"kind":"Name","value":"geofenceId"}},{"kind":"Field","name":{"kind":"Name","value":"geofenceName"}}]}}]}}]} as unknown as DocumentNode<GetTransportersInGeofenceQuery, GetTransportersInGeofenceQueryVariables>;
export const CreateGeofenceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateGeofence"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"geofence"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GeofenceDtoInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createGeofence"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"command"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"geofence"},"value":{"kind":"Variable","name":{"kind":"Name","value":"geofence"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GeofenceFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GeofenceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GeofenceVm"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"geofenceId"}},{"kind":"Field","name":{"kind":"Name","value":"accountId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"color"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"geom"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"srid"}},{"kind":"Field","name":{"kind":"Name","value":"coordinates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}}]}}]}}]}}]} as unknown as DocumentNode<CreateGeofenceMutation, CreateGeofenceMutationVariables>;
export const UpdateGeofenceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateGeofence"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"geofence"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GeofenceDtoInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateGeofence"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"command"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"geofence"},"value":{"kind":"Variable","name":{"kind":"Name","value":"geofence"}}}]}}]}]}}]} as unknown as DocumentNode<UpdateGeofenceMutation, UpdateGeofenceMutationVariables>;
export const DeleteGeofenceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteGeofence"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteGeofence"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteGeofenceMutation, DeleteGeofenceMutationVariables>;