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

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import CustomCheckbox from 'controls/Dialogs/CustomCheckbox';
import CustomTextField from 'controls/Dialogs/CustomTextField';
import CustomSelect from 'controls/Dialogs/CustomSelect';
import Card from "@mui/material/Card";
import ArgonBox from "components/ArgonBox";
import ArgonButton from "components/ArgonButton";
import Icon from "@mui/material/Icon";
import colors from 'data/colors';

function GeofenceFormDialog({ handleSubmit, values, handleChange, errors }) {
  const { t } = useTranslation();
  const translatedColors = colors.map(type => ({
    ...type,
    label: t(`colors.${type.label.toLowerCase()}`)
  }));
  return (
    <Card sx={{ height: "100%" }}>
        <ArgonBox p={2}>
            <form>
                <CustomTextField
                    autoFocus
                    margin="dense"
                    name="name"
                    id="name"
                    label={t('geofence.name')}
                    type="text"
                    fullWidth
                    value={values.name || ''}
                    onChange={handleChange}
                    required
                    errorMsg={errors.name}
                />

                <CustomTextField
                    margin="normal"
                    name="description"
                    id="description"
                    label={t('geofence.description')}
                    type="text"
                    fullWidth
                    value={values.description || ''}
                    onChange={handleChange}
                />

                <CustomSelect
                    list={translatedColors}
                    handleChange={handleChange}
                    name="color"
                    id="color"
                    label={t('geofence.color')}
                    value={values.color}
                    required
                />
                
                <CustomCheckbox 
                name="active" 
                id="active" 
                value={values.active} 
                handleChange={handleChange} 
                label={t('geofence.active')} />
            </form>
        </ArgonBox>
        <ArgonButton 
          variant="gradient" 
          onClick={handleSubmit}>
          <Icon sx={{ fontWeight: "bold" }}>save</Icon>
          &nbsp;{t('generic.save')}
        </ArgonButton>
    </Card>
  );
}

GeofenceFormDialog.propTypes = {
    handleSubmit: PropTypes.func.isRequired,
    values: PropTypes.object.isRequired,
    handleChange: PropTypes.func.isRequired,
    errors: PropTypes.object.isRequired,
};

export default GeofenceFormDialog;