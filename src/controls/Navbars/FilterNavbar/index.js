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

import React from 'react';
import { Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ArgonBox from 'components/ArgonBox';
import ArgonButton from 'components/ArgonButton';
import PropTypes from 'prop-types';
import CustomTextField from 'controls/Dialogs/CustomTextField';
import CustomSelect from 'controls/Dialogs/CustomSelect';

function FilterNavbar({ list = [], values, handleChange, errors, handleSearch }) {
  const { t } = useTranslation();

  return (
    <ArgonBox py={3}>
      <Grid container spacing={3} alignItems="center">
        <Grid item size={{xs: 12, sm:3}}>
          <CustomTextField
            label={t('filters.startDate')}
            type="datetime-local"
            name="startDate"
            id="startDate"
            value={values.startDate || ''}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            errorMsg={errors.startDate}
            fullWidth
          />
        </Grid>
        <Grid item size={{xs: 12, sm: 3}}>
          <CustomTextField
            label={t('filters.endDate')}
            type="datetime-local"
            name="endDate"
            id="endDate"
            value={values.endDate || ''}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            errorMsg={errors.endDate}
            fullWidth
          />
        </Grid>
        <Grid item size={{xs: 12, sm: 3}}>
          <CustomSelect
            list={list}
            handleChange={handleChange}
            name="selectedItem"
            id="selectedItem"
            label={t('filters.transporter')}
            value={values.selectedItem || ''}
            required
          />
          {errors.selectedItem && <p>{errors.selectedItem}</p>}
        </Grid>
        <Grid item size={{xs: 12, sm:3}}>
          <ArgonButton variant="contained" color="primary" onClick={handleSearch} fullWidth>
            {t('filters.search')}
          </ArgonButton>
        </Grid>
      </Grid>
    </ArgonBox>
  );
}

FilterNavbar.propTypes = {
    list: PropTypes.array,
    values: PropTypes.object.isRequired,
    handleChange: PropTypes.func.isRequired,
    errors: PropTypes.object.isRequired,
    handleSearch: PropTypes.func.isRequired
};

export default FilterNavbar;