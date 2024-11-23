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
    onSave, 
    onDelete, 
    setOpen, 
    setConfirmOpen} = useGeofencesTableData(handleEditClick, handleDeleteClick);

  const [values, handleChange, setValues, setErrors, validate, errors] = useForm({});
  const [toDelete, setToDelete] = useState(null);
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

  const handleSave = () => {
    if (saveRef.current) {
      let result = saveRef.current();
      let requiredFields = ['name'];
      if (validate(requiredFields)) {
        let coordinates = result.latlngs.map(coord => ({latitude: coord.lat, longitude: coord.lng}));
        let geom = {srid: 4326, coordinates: coordinates};
        values.geom = geom;
        values.geofenceId = result.id;
        values.new = true;
        onSave(values);
      }
    }
  };

  const handleCancel = () => {
    if (cancelRef.current) {
      cancelRef.current();
    }
  };

  const handleAdd = () => {
    if (addRef.current) {
      setValues({color: 2, type:1, active: true});
      setErrors({});
      addRef.current();
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
                addRef={addRef}
                saveRef={saveRef}
                cancelRef={cancelRef}
              />
              <div className="mapcontrol">
                <label onClick={handleAdd}>&nbsp;+&nbsp;</label>
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
        onConfirm={async() => await onDelete(toDelete)} />
      <Footer />
    </DashboardLayout>
  );
}

export default GeofenceManager;
