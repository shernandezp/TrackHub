/**
* Copyright (c) 2025 Sergio Hernandez. All rights reserved.
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

import { useEffect, useMemo, useState, useContext } from "react";
import type { ReactNode } from "react";
import { useTranslation } from 'react-i18next';
import { Name as NameBase } from "controls/Tables/components/tableComponents";
import Icon from "@mui/material/Icon";
import ArgonButtonBase from "components/ArgonButton";
import { getGeofence } from "api/geofencing/geofencing";
import type { Geofence, GeofenceDtoInput } from "api/geofencing/geofencing";
import {
  useGeofencesByAccount,
  useCreateGeofence,
  useUpdateGeofence,
  useDeleteGeofence,
} from 'queries/geofences';
import { getGeofenceType } from 'data/geofenceTypes';
import { getColor } from 'data/colors';
import { toCamelCase } from 'utils/stringUtils';
import { LoadingContext } from 'LoadingContext';
import { useAuth } from "AuthContext";
import type { MapPoint, MapPolygon } from 'layouts/geofencemanager/components/GeofenceEditor';

// Vendored (untyped) controls — type the prop slice crossing the boundary.
const Name = NameBase as unknown as (props: { name: ReactNode }) => ReactNode;
interface ArgonButtonProps {
  variant?: string;
  color?: string;
  onClick?: () => void;
  children?: ReactNode;
}
const ArgonButton = ArgonButtonBase as unknown as (props: ArgonButtonProps) => ReactNode;

/**
 * Dialog/form state for a geofence. Merges an API {@link Geofence} with UI-only
 * fields the editor adds (`new`, `coordinates`) before submit. `type`/`color`
 * may arrive as strings from the select controls, hence the widened unions.
 */
export interface GeofenceFormValues {
  geofenceId?: string;
  name?: string;
  description?: string | null;
  type?: number | string;
  color?: number | string;
  active?: boolean;
  new?: boolean;
  /** Points drawn on the map ({lat,lng}) for the non-new save path. */
  coordinates?: MapPoint[];
  geom?: { srid: number; coordinates: { latitude: number; longitude: number }[] };
}

/** A column descriptor consumed by the vendored `Table` control. */
export interface GeofenceColumn { name: string; title?: string; align?: string; }
/** A rendered table row for the geofence list. */
export interface GeofenceRow {
  name: ReactNode;
  type: ReactNode;
  color: ReactNode;
  action: ReactNode;
  id: string;
}
export interface GeofenceTableData {
  geofences: MapPolygon[];
  columns: GeofenceColumn[];
  rows: GeofenceRow[];
}

export interface UseGeofencesTableData {
  data: GeofenceTableData;
  open: boolean;
  confirmOpen: boolean;
  onGet: (geofenceId: string) => Promise<Geofence>;
  onSave: (geofence: GeofenceFormValues) => Promise<void>;
  onDelete: (geofenceId: string) => Promise<void>;
  setOpen: (open: boolean) => void;
  setConfirmOpen: (open: boolean) => void;
}

// Builds a clean GeofenceDtoInput from the dialog values, dropping the UI-only
// fields (new, coordinates, accountId, ...) the schema does not accept.
function toGeofenceInput(geofence: GeofenceFormValues): GeofenceDtoInput {
  return {
    geofenceId: geofence.geofenceId as string,
    name: geofence.name as string,
    description: geofence.description ?? null,
    type: Number(geofence.type),
    color: Number(geofence.color),
    active: !!geofence.active,
    geom: {
      srid: geofence.geom!.srid,
      coordinates: geofence.geom!.coordinates.map(coord => ({
        latitude: coord.latitude,
        longitude: coord.longitude,
      })),
    },
  };
}

function useGeofencesTableData(
  handleEditClick: (rowData: GeofenceFormValues) => void,
  handleDeleteClick: (geofenceId: string) => void
): UseGeofencesTableData {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { setLoading } = useContext(LoadingContext);
  const { isAuthenticated } = useAuth();

  const geofencesQuery = useGeofencesByAccount(false, { enabled: isAuthenticated });
  const geofences = geofencesQuery.data ?? [];
  const createGeofence = useCreateGeofence();
  const updateGeofence = useUpdateGeofence();
  const deleteGeofence = useDeleteGeofence();

  // Keep the global spinner UX for the initial load / invalidation refetch.
  useEffect(() => {
    setLoading(geofencesQuery.isFetching);
  }, [geofencesQuery.isFetching, setLoading]);

  const onSave = async (geofence: GeofenceFormValues) => {
    setLoading(true);
    try {
      const input = toGeofenceInput(geofence);
      if (geofence.new) {
        await createGeofence.mutateAsync(input);
      } else {
        await updateGeofence.mutateAsync({ geofenceId: geofence.geofenceId as string, geofence: input });
      }
      setOpen(false);
    } catch {
      // Failure is surfaced by the global toast; keep the dialog open so the
      // user can retry without re-drawing the shape.
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (geofenceId: string) => {
    setLoading(true);
    try {
      await deleteGeofence.mutateAsync(geofenceId);
      setConfirmOpen(false);
    } catch {
      // Failure is surfaced by the global toast.
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDelete = (geofenceId: string) => {
    handleDeleteClick(geofenceId);
    setConfirmOpen(true);
  };

  // Imperative single-geofence read for the map editor. Throws on failure
  // (surfaced by the global toast) — the caller decides what to do next.
  const onGet = async (geofenceId: string): Promise<Geofence> => getGeofence(geofenceId);

  const buildTableData = (rows: Geofence[]): GeofenceTableData => ({
    geofences: rows.map(item => ({
      id: item.geofenceId,
      name: item.name,
      latlngs: item.geom.coordinates.map((coord): [number, number] => [coord.latitude, coord.longitude])
    })),
    columns: [
      { name: "name", title:t('geofence.name'), align: "left" },
      { name: "type", title:t('geofence.type'), align: "left" },
      { name: "color", title:t('geofence.color'), align: "left" },
      { name: "action", title:t('generic.action'), align: "center" },
      { name: "id" }
    ],
    rows: rows.map(geofence => ({
      name: <Name name={geofence.name} />,
      type: <Name name={t(`geofenceTypes.${toCamelCase(getGeofenceType(geofence.type))}` as 'geofenceTypes.office')} />,
      color: <Name name={t(`colors.${getColor(geofence.color).toLowerCase()}` as 'colors.red')} />,
      action: (
        <ArgonButton
          variant="text"
          color="error"
          onClick={() => handleOpenDelete(geofence.geofenceId)}>
          <Icon>delete</Icon>
        </ArgonButton>
      ),
      id: geofence.geofenceId
    })),
  });

  const data = useMemo(
    () => buildTableData(geofences),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [geofences, t]
  );

  return {
    data,
    open,
    confirmOpen,
    onGet,
    onSave,
    onDelete,
    setOpen,
    setConfirmOpen };
}

export default useGeofencesTableData;
