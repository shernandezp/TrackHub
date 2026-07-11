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

import { useState, useEffect, useContext, useRef } from 'react';
import Grid from "@mui/material/Grid";
import ArgonBox from "components/ArgonBox";
import DashboardLayout from "controls/LayoutContainers/DashboardLayout";
import DashboardNavbar from "controls/Navbars/DashboardNavbar";
import GeofenceEditor from 'layouts/geofencemanager/components/GeofenceEditor';
import type {
  AddGeofenceHandler,
  SaveGeofenceHandler,
  CancelGeofenceHandler,
  EditGeofenceHandler,
  RemoveGeofenceHandler,
} from 'layouts/geofencemanager/components/GeofenceEditor';
import Footer from "controls/Footer";
import Table from "controls/Tables/Table";
import useForm from 'controls/Dialogs/useForm';
import ConfirmDialog from 'controls/Dialogs/ConfirmDialog';
import GeofenceFormDialog from 'layouts/geofencemanager/GeofenceFormDialog';
import useGeofencesTableData from "layouts/geofencemanager/data/geofencesData";
import type { GeofenceFormValues, GeofenceColumn, GeofenceRow } from "layouts/geofencemanager/data/geofencesData";
import { getAccountSettings } from 'api/manager/settings';
import type { AccountSettings } from 'api/manager/settings';
import { notifyApiError } from 'api/core/errors';
import { LoadingContext } from 'LoadingContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from "AuthContext";

/** Map-related account settings the geofence editor reads. */
interface GeofenceMapSettings {
  maps: string;
  mapsKey: string | null;
  refreshMapInterval: number;
}


function GeofenceManager() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { setLoading } = useContext(LoadingContext);
  const [settings, setSettings] = useState<GeofenceMapSettings>({maps:'OSM', mapsKey:'', refreshMapInterval: 60});

  const handleEditClick = (rowData: GeofenceFormValues) => {
    setValues(rowData);
    setErrors({});
  };

  const handleDeleteClick = (geofenceId: string) => {
    setToDelete(geofenceId);
  };

  const {
    data,
    open,
    confirmOpen,
    onGet,
    onSave,
    onDelete,
    setOpen,
    setConfirmOpen} = useGeofencesTableData(handleEditClick, handleDeleteClick);

  const [values, handleChange, setValues, setErrors, validate, errors] = useForm<GeofenceFormValues>({});
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [selectedGeofence, setSelectedGeofence] = useState<string | null>(null);
  const { geofences, columns, rows } = data;
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const settings: AccountSettings = await getAccountSettings();
      setSettings(settings);
    } catch (error) {
      notifyApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated]);

  const addRef = useRef<AddGeofenceHandler | null>(null);
  const saveRef = useRef<SaveGeofenceHandler | null>(null);
  const cancelRef = useRef<CancelGeofenceHandler | null>(null);
  const editingRef = useRef<EditGeofenceHandler | null>(null);
  const removeRef = useRef<RemoveGeofenceHandler | null>(null);

  const handleSave = () => {
    const requiredFields = ['name'];
    if (validate(requiredFields)) {
      if (values.new) {
        const result = saveRef.current!(values.name!);
        const coordinates = result.latlngs.map(coord => ({latitude: coord.lat, longitude: coord.lng}));
        const geom = {srid: 4326, coordinates: coordinates};
        values.geom = geom;
        values.geofenceId = result.id;
      } else {
        const coordinates = values.coordinates!.map(coord => ({latitude: coord.lat, longitude: coord.lng}));
        values.geom = {srid: 4326, coordinates: coordinates};
      }
      onSave(values);
    }
  };

  const handleAdd = () => {
    if (addRef.current) {
      setValues({color: 2, type:1, active: true, new: true});
      setErrors({});
      addRef.current();
    }
  };

  const handleCancel = () => {
    if (cancelRef.current) {
      cancelRef.current();
    }
  };

  const handleDelete = async () => {
    if (removeRef.current) {
      await onDelete(toDelete!)
      removeRef.current(toDelete!);
    }
  };

  const handleEdit = async () => {
    if (editingRef.current) {
      setLoading(true);
      const newGeofence = editingRef.current();
      const geofence: GeofenceFormValues = await onGet(newGeofence.id);
      geofence.new = false;
      geofence.coordinates = newGeofence.latlngs;
      handleEditClick(geofence);
      setLoading(false);
      setOpen(true);
    }
  };

  const handleSearchChange = (event: { target: { value: string } }) => {
    setSearchQuery(event.target.value);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar searchQuery={searchQuery} handleSearch={handleSearchChange} searchVisibility={true}/>
      <ArgonBox py={1}>
        <Grid container spacing={3}>
          <Grid size={{xs: 12, lg: 9}} sx={{ position: 'relative', zIndex: 1 }}>
            <GeofenceEditor
               mapType={settings.maps as 'OSM' | 'Google'}
               mapKey={settings.mapsKey}
               geofences={geofences}
               selectedGeofence={selectedGeofence}
               handleSelected={setSelectedGeofence}
               setOpen={setOpen}
               addRef={addRef}
               saveRef={saveRef}
               cancelRef={cancelRef}
               editingRef={editingRef}
               removeRef={removeRef}
               handleAdd={handleAdd}
               handleEdit={handleEdit}
               height="calc(100vh - 180px)"
            />
          </Grid>
          <Grid size={{xs: 12, lg: 3}} sx={{ position: 'relative', zIndex: 2 }}>
            <Table 
              columns={columns} 
              rows={rows} 
              selectedField="name"
              selected={selectedGeofence}
              handleSelected={setSelectedGeofence}
              searchQuery={searchQuery}
              scrollable={true}
              maxHeight="calc(100vh - 180px)"
              compact={true} />
          </Grid>
        </Grid>
      </ArgonBox>
      <GeofenceFormDialog 
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSave}
        handleCancel={handleCancel}
        values={values}
        handleChange={handleChange}
        errors={errors}
      />
      <ConfirmDialog 
        title={t('geofence.deleteTitle')}
        message={t('geofence.deleteMessage')}
        open={confirmOpen} 
        setOpen={setConfirmOpen} 
        onConfirm={async() => await handleDelete()} />
      <Footer />
    </DashboardLayout>
  );
}

export default GeofenceManager;
