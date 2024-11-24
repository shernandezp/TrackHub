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
import { Name, Description } from "controls/Tables/components/tableComponents";
import Icon from "@mui/material/Icon";
import ArgonButton from "components/ArgonButton";
import useGeofenceService from "services/geofence";
import { getGeofenceType } from 'data/geofenceTypes';
import { getColor } from 'data/colors';
import { toCamelCase } from 'utils/stringUtils';
import { handleDelete, handleSave } from "layouts/geofencemanager/actions/geofenceActions";
import { LoadingContext } from 'LoadingContext';
import { useAuth } from "AuthContext";

function useGeofencesTableData(handleEditClick, handleDeleteClick) {
  const { t } = useTranslation();
  const [data, setData] = useState({ columns: [], rows: [] });
  const [geofences, setGeofences] = useState([]);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { setLoading } = useContext(LoadingContext);
  const { isAuthenticated } = useAuth();

  const hasLoaded = useRef(false);
  const { getGeofencesByAccount, getGeofence, createGeofence, updateGeofence, deleteGeofence } = useGeofenceService();

  const onSave = async (geofence) => {
    setLoading(true);
    try {
      await handleSave(
        geofence, 
        geofences, 
        setGeofences, 
        setData, 
        buildTableData, 
        createGeofence, 
        updateGeofence);
        setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (geofenceId) => {
    setLoading(true);
    try {
      await handleDelete(
        geofenceId, 
        geofences, 
        setGeofences, 
        setData, 
        buildTableData, 
        deleteGeofence);
        setConfirmOpen(false);
      } finally {
        setLoading(false);
      }
  }

  const handleOpen = (geofence) => {
    handleEditClick(geofence);
    setOpen(true);
  };

  const handleOpenDelete = (geofenceId) => {
    handleDeleteClick(geofenceId);
    setConfirmOpen(true);
  };

  const onGet = async (geofenceId) => {
    return await getGeofence(geofenceId);
  }

  const buildTableData = (geofences) => ({
    geofences: geofences.map(item => ({
      id: item.geofenceId,
      latlngs: item.geom.coordinates.map(coord => [coord.longitude, coord.latitude])
    })),
    columns: [
      { name: "name", title:t('geofence.name'), align: "left" },
      { name: "description", title:t('geofence.description'), align: "left" },
      { name: "type", title:t('geofence.type'), align: "left" },
      { name: "color", title:t('geofence.color'), align: "left" },
      { name: "action", title:t('generic.action'), align: "center" },
      { name: "id" }
    ],
    rows: geofences.map(geofence => ({
      name: <Name name={geofence.name} />,
      description: <Description description={geofence.description || ''} />,
      type: <Name name={t(`geofenceTypes.${toCamelCase(getGeofenceType(geofence.type))}`)} />,
      color: <Name name={t(`colors.${getColor(geofence.color).toLowerCase()}`)} />,
      action: (
        <>
            <ArgonButton 
                variant="text" 
                color="dark" 
                onClick={() => handleOpen(geofence)}>
              <Icon>edit</Icon>&nbsp;{t('generic.edit')}
            </ArgonButton>
            <ArgonButton 
              variant="text" 
              color="error"
              onClick={() => handleOpenDelete(geofence.geofenceId)}>
              <Icon>delete</Icon>&nbsp;{t('generic.delete')}
            </ArgonButton>
        </>
      ),
      id: geofence.geofenceId
    })),
  });

  useEffect(() => {
    if (!hasLoaded.current && isAuthenticated) {
      async function fetchData() {
        setLoading(true);
        const geofences = await getGeofencesByAccount();
        setGeofences(geofences);
        setData(buildTableData(geofences));
        hasLoaded.current = true;
        setLoading(false);
      }
      fetchData();
    }
  }, [isAuthenticated]);

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