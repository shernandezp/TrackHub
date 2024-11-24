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

import React, { useState, useEffect, useContext, useRef } from 'react';
import Grid from "@mui/material/Grid";
import ArgonBox from "components/ArgonBox";
import DashboardLayout from "controls/LayoutContainers/DashboardLayout";
import DashboardNavbar from "controls/Navbars/DashboardNavbar";
import GeofenceEditor from 'controls/Maps/GeofenceEditor';
import MapControlStyle from 'controls/Maps/styles/MapControl';
import Footer from "controls/Footer";
import Table from "controls/Tables/Table";
import useForm from 'controls/Dialogs/useForm';
import ConfirmDialog from 'controls/Dialogs/ConfirmDialog';
import GeofenceFormDialog from 'layouts/geofencemanager/GeofenceFormDialog';
import useGeofencesTableData from "layouts/geofencemanager/data/geofencesData";
import useSettignsService from 'services/settings';
import { LoadingContext } from 'LoadingContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from "AuthContext";

function GeofenceManager() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { getAccountSettings } = useSettignsService();
  const { setLoading } = useContext(LoadingContext);
  const [settings, setSettings] = useState({maps:'OSM', mapsKey:'', refreshMapInterval: 60});

  const handleEditClick = (rowData) => {
    setValues(rowData);
    setErrors({});
  };

  const handleDeleteClick = (geofenceId) => {
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

  const [values, handleChange, setValues, setErrors, validate, errors] = useForm({});
  const [toDelete, setToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const { geofences, columns, rows } = data;
  
  const fetchSettings = async () => {
    setLoading(true);
    var settings = await getAccountSettings();
    setSettings(settings);
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated]);

  const addRef = useRef(null);
  const saveRef = useRef(null);
  const cancelRef = useRef(null);
  const editingRef = useRef(null);
  const removeRef = useRef(null);

  const handleSave = () => {
    let requiredFields = ['name'];
    if (validate(requiredFields)) {
      if (values.new) {
        let result = saveRef.current();
        let coordinates = result.latlngs.map(coord => ({latitude: coord.lat, longitude: coord.lng}));
        let geom = {srid: 4326, coordinates: coordinates};
        values.geom = geom;
        values.geofenceId = result.id;
      } else {
        let coordinates = values.coordinates.map(coord => ({latitude: coord.lat, longitude: coord.lng}));
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
      await onDelete(toDelete)
      removeRef.current(toDelete);
    }
  };

  const handleEdit = async () => {
    if (editingRef.current) {
      setLoading(true);
      const newGeofence = editingRef.current();
      const geofence = await onGet(newGeofence.id);
      geofence.new = false;
      geofence.coordinates = newGeofence.latlngs;
      handleEditClick(geofence);
      setLoading(false);
      setOpen(true);
    }
  };

  return (
    <DashboardLayout>
      {/* <DashboardNavbar searchQuery={searchQuery} handleSearch={handleSearchChange} searchVisibility={true}/> */}
      <ArgonBox py={3}>
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} lg={12}>
            <MapControlStyle>
              <GeofenceEditor 
                initialPolygons={geofences}
                setOpen={setOpen}
                setIsEditing={setIsEditing}
                addRef={addRef}
                saveRef={saveRef}
                cancelRef={cancelRef}
                editingRef={editingRef}
                removeRef={removeRef}
              />
              <div className="mapcontrol">
                <label className="mapcontrol-label" onClick={handleAdd}>&nbsp;+&nbsp;</label>
                {isEditing && <label className="mapcontrol-label" onClick={handleEdit}>&nbsp;💾&nbsp;</label>}
              </div>
            </MapControlStyle>
          </Grid>
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs={12} md={12}>
            <Table columns={columns} rows={rows} selectedField='name' />
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
