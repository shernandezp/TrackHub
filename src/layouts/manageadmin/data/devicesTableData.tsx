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
import { Name as NameBase, NameDetail as NameDetailBase, Description as DescriptionBase } from "controls/Tables/components/tableComponents";
import Icon from "@mui/material/Icon";
import ArgonBadgeBase from "components/ArgonBadge";
import ArgonButtonBase from "components/ArgonButton";
import { useDevicesByAccount, useDeleteDevice } from 'queries/devices';
import type { Device } from 'api/manager/devices';
import { LoadingContext } from 'LoadingContext';
import { useAuth } from "AuthContext";

/** A column descriptor / rendered row for the vendored devices `Table`. */
export interface DeviceTableColumn { name: string; title?: string; align?: string; }
export type DeviceTableRow = Record<string, ReactNode>;
export interface DeviceTableData { columns: DeviceTableColumn[]; rows: DeviceTableRow[]; }

// Vendored (untyped) controls — type the prop slice crossing the boundary.
const Name = NameBase as unknown as (props: { name?: ReactNode }) => ReactNode;
const NameDetail = NameDetailBase as unknown as (props: { name?: ReactNode; detail?: ReactNode }) => ReactNode;
const Description = DescriptionBase as unknown as (props: { description?: ReactNode }) => ReactNode;
interface ArgonBadgeProps { variant?: string; color?: string; badgeContent?: ReactNode; size?: string; container?: boolean; }
const ArgonBadge = ArgonBadgeBase as unknown as (props: ArgonBadgeProps) => ReactNode;
interface ArgonButtonProps { variant?: string; color?: string; onClick?: () => void; disabled?: boolean; children?: ReactNode; }
const ArgonButton = ArgonButtonBase as unknown as (props: ArgonButtonProps) => ReactNode;

function useDeviceTableData(
  fetchData: boolean,
  handleDeleteClick: (deviceId: string) => void
) {
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { setLoading } = useContext(LoadingContext);
  const { isAuthenticated } = useAuth();

  const devicesQuery = useDevicesByAccount({ enabled: !!fetchData && isAuthenticated });
  const devices = devicesQuery.data ?? [];
  const deleteDevice = useDeleteDevice();

  // Keep the global spinner UX for the initial load / invalidation refetch.
  useEffect(() => {
    setLoading(devicesQuery.isFetching);
  }, [devicesQuery.isFetching, setLoading]);

  const onDelete = async (deviceId: string) => {
    setLoading(true);
    try {
      await deleteDevice.mutateAsync(deviceId);
      setConfirmOpen(false);
    } catch {
      // Failure is surfaced by the global toast.
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDelete = (deviceId: string) => {
    handleDeleteClick(deviceId);
    setConfirmOpen(true);
  };

  const buildTableData = (rows: Device[]): DeviceTableData => ({
    columns: [
      { name: "name", title:t('device.name'), align: "left" },
      { name: "serial", title:t('device.serial'), align: "left" },
      { name: "description", title:t('device.description'), align: "left" },
      { name: "devicetype", title:t('device.type'), align: "center" },
      { name: "action", title:t('generic.action'), align: "center" },
      { name: "id" }
    ],
    rows: rows.map(device => ({
      name: <NameDetail name={device.name} detail={device.identifier} />,
      serial: <Name name={device.serial} />,
      description: <Description description={device.description} />,
      devicetype: (
        <ArgonBadge variant="gradient" badgeContent={device.deviceType} color="success" size="xs" container />
      ),
      action: (
        <>
            <ArgonButton
              variant="text"
              color="error"
              onClick={() => handleOpenDelete(device.deviceId)}>
              <Icon>delete</Icon>&nbsp;{t('generic.delete')}
            </ArgonButton>
        </>
      ),
      id: device.deviceId
    })),
  });

  const data = useMemo(
    () => buildTableData(devices),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [devices, t]
  );

  return {
    data,
    confirmOpen,
    onDelete,
    setConfirmOpen
  };
}

export default useDeviceTableData;
