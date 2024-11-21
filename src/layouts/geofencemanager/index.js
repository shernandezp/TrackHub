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

import React, { useState, useEffect, useContext  } from 'react';
import Grid from "@mui/material/Grid";
import ArgonBox from "components/ArgonBox";
import DashboardLayout from "controls/LayoutContainers/DashboardLayout";
import DashboardNavbar from "controls/Navbars/DashboardNavbar";
import GeofenceEditor from 'controls/Maps/GeofenceEditor';
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
  const { columns, rows } = data;
  
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

  const handleSubmit = async () => {
    let requiredFields = ['name'];

    if (validate(requiredFields)) {
      onSave(values);
    }
  };

  const existingGeofences = [
    {
      id: "e53fcf0a-e6c6-44b8-b7a6-db20e695d4e9",
      name: "Geofence 1",
      latlngs: [
        [51.505, -0.09],
        [51.51, -0.1],
        [51.51, -0.08],
      ],
    },
    {
      id: "aa475051-cef6-4e1f-90c0-bd9eb33355e2",
      name: "Geofence 2",
      latlngs: [
        [51.51, -0.11],
        [51.52, -0.12],
        [51.52, -0.1],
      ],
    },
  ];

  return (
    <DashboardLayout>
      {/* <DashboardNavbar searchQuery={searchQuery} handleSearch={handleSearchChange} searchVisibility={true}/> */}
      <ArgonBox py={3}>
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} lg={12}>
            <GeofenceEditor initialPolygons={existingGeofences} />
          </Grid>
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Table columns={columns} rows={rows} selectedField='name' />
          </Grid>
          <Grid item xs={12} md={4}>
            <GeofenceFormDialog 
              handleSubmit={handleSubmit}
              values={values}
              handleChange={handleChange}
              errors={errors}
            />
          </Grid>
        </Grid>
      </ArgonBox>
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
