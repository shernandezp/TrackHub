/**
* Copyright (c) 2024 Sergio Hernandez. All rights reserved.
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

import { useEffect, useState, useRef, useContext } from "react";
import { useTranslation } from 'react-i18next';
import { Name, NameDetail, Description } from "controls/Tables/components/tableComponents";
import Icon from "@mui/material/Icon";
import ArgonBadge from "components/ArgonBadge";
import ArgonButton from "components/ArgonButton";
import useDeviceService from "services/device";
import { handleDelete } from "layouts/manageadmin/actions/deviceActions";
import { LoadingContext } from 'LoadingContext';
import { useAuth } from "AuthContext";

function useDeviceTableData(fetchData, handleDeleteClick) {
  const { t } = useTranslation();
  const [data, setData] = useState({ columns: [], rows: [] });
  const [devices, setDevices] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { setLoading } = useContext(LoadingContext);
  const { isAuthenticated } = useAuth();

  const hasLoaded = useRef(false);
  const { getDevicesByAccount, deleteDevice } = useDeviceService();

  const onDelete = async (deviceId) => {
    setLoading(true);
    try {
      await handleDelete(
        deviceId, 
        devices, 
        setDevices, 
        setData, 
        buildTableData, 
        deleteDevice);
        setConfirmOpen(false);
      } finally {
        setLoading(false);
      }
  }

  const handleOpenDelete = (deviceId) => {
    handleDeleteClick(deviceId);
    setConfirmOpen(true);
  };

  const refreshData = async () => {
    const devices = await getDevicesByAccount();
    setDevices(devices);
    setData(buildTableData(devices));
  }

  const buildTableData = (devices) => ({
    columns: [
      { name: "name", title:t('device.name'), align: "left" },
      { name: "serial", title:t('device.serial'), align: "left" },
      { name: "description", title:t('device.description'), align: "left" },
      { name: "devicetype", title:t('device.type'), align: "center" },
      { name: "action", title:t('generic.action'), align: "center" },
      { name: "id" }
    ],
    rows: devices.map(device => ({
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

  useEffect(() => {
    if (fetchData && !hasLoaded.current && isAuthenticated) {
      async function fetchData() {
        setLoading(true);
        await refreshData();
        hasLoaded.current = true;
        setLoading(false);
      }
      fetchData();
    }
  }, [fetchData, isAuthenticated]);

  return { 
    data, 
    confirmOpen,
    onDelete, 
    setConfirmOpen,
    refreshData
  };
}

export default useDeviceTableData;