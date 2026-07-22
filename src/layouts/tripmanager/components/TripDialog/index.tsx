/**
* Copyright (c) 2026 Sergio Hernandez. All rights reserved.
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

import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import Grid from '@mui/material/Grid';
import FormDialog from 'controls/Dialogs/FormDialog';
import CustomTextField from 'controls/Dialogs/CustomTextField';
import CustomSelect from 'controls/Dialogs/CustomSelect';
import type { FormChangeHandler } from 'controls/Dialogs/useForm';
import type { Transporter } from 'api/manager/transporters';
import type { Driver } from 'api/manager/drivers';
import type { TollVehicleClass } from 'api/tripManagement/trips';

/** Dialog/form state for a trip. Strings throughout — the caller coerces on save. */
export interface TripFormValues {
  tripId?: string;
  code?: string;
  transporterId?: string;
  driverId?: string;
  serviceOrderId?: string | null;
  externalReference?: string | null;
  customerName?: string | null;
  originName?: string;
  originLatitude?: number | string;
  originLongitude?: number | string;
  plannedStartAt?: string;
  plannedEndAt?: string | null;
  notes?: string | null;
  tollVehicleClass?: string | null;
}

interface TripDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  handleSubmit: () => void | Promise<void>;
  values: TripFormValues;
  handleChange: FormChangeHandler;
  errors: Record<string, string>;
  transporters: Transporter[];
  drivers: Driver[];
  vehicleClasses: TollVehicleClass[];
}

function TripDialog({
  open,
  setOpen,
  handleSubmit,
  values,
  handleChange,
  errors,
  transporters,
  drivers,
  vehicleClasses,
}: TripDialogProps) {
  const { t } = useTranslation();

  const transporterOptions = transporters.map((transporter) => ({
    value: transporter.transporterId,
    label: transporter.name,
  }));
  const driverOptions = drivers
    .filter((driver) => driver.active)
    .map((driver) => ({ value: driver.driverId, label: driver.name }));
  // Only active classes are offerable; an inactive class stays on historical
  // trips but must not be picked for a new one.
  const classOptions = vehicleClasses
    .filter((vehicleClass) => vehicleClass.active)
    .map((vehicleClass) => ({
      value: vehicleClass.code,
      label: `${vehicleClass.code} — ${vehicleClass.name}`,
    }));

  return (
    <FormDialog
      title={values.tripId ? t('trips.editTrip') : t('trips.newTrip')}
      handleSave={handleSubmit}
      open={open}
      setOpen={setOpen}
      maxWidth="md"
    >
      <form>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              autoFocus
              margin="dense"
              name="code"
              id="code"
              label={t('trips.code')}
              type="text"
              value={values.code || ''}
              onChange={handleChange}
              errorMsg={errors.code}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              margin="dense"
              name="customerName"
              id="customerName"
              label={t('trips.customerName')}
              type="text"
              value={values.customerName || ''}
              onChange={handleChange}
              errorMsg={errors.customerName}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomSelect
              list={transporterOptions}
              handleChange={handleChange}
              name="transporterId"
              id="transporterId"
              label={t('trips.transporter')}
              value={values.transporterId}
              numericValue={false}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomSelect
              list={driverOptions}
              handleChange={handleChange}
              name="driverId"
              id="driverId"
              label={t('trips.driver')}
              value={values.driverId}
              numericValue={false}
              placeholder={t('trips.assignment.selectDriver')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              margin="dense"
              name="originName"
              id="originName"
              label={t('trips.originName')}
              type="text"
              value={values.originName || ''}
              onChange={handleChange}
              errorMsg={errors.originName}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <CustomTextField
              margin="dense"
              name="originLatitude"
              id="originLatitude"
              label={t('trips.originLatitude')}
              type="number"
              value={values.originLatitude ?? ''}
              onChange={handleChange}
              errorMsg={errors.originLatitude}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <CustomTextField
              margin="dense"
              name="originLongitude"
              id="originLongitude"
              label={t('trips.originLongitude')}
              type="number"
              value={values.originLongitude ?? ''}
              onChange={handleChange}
              errorMsg={errors.originLongitude}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              margin="dense"
              name="plannedStartAt"
              id="plannedStartAt"
              label={t('trips.plannedStart')}
              type="datetime-local"
              slotProps={{ inputLabel: { shrink: true } }}
              value={values.plannedStartAt || ''}
              onChange={handleChange}
              errorMsg={errors.plannedStartAt}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              margin="dense"
              name="plannedEndAt"
              id="plannedEndAt"
              label={t('trips.plannedEnd')}
              type="datetime-local"
              slotProps={{ inputLabel: { shrink: true } }}
              value={values.plannedEndAt || ''}
              onChange={handleChange}
              errorMsg={errors.plannedEndAt}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomTextField
              margin="dense"
              name="externalReference"
              id="externalReference"
              label={t('trips.externalReference')}
              type="text"
              value={values.externalReference || ''}
              onChange={handleChange}
              errorMsg={errors.externalReference}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CustomSelect
              list={classOptions}
              handleChange={handleChange}
              name="tollVehicleClass"
              id="tollVehicleClass"
              label={t('trips.tollVehicleClass')}
              value={values.tollVehicleClass ?? ''}
              numericValue={false}
              placeholder={t('tolls.selectVehicleClass')}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <CustomTextField
              margin="dense"
              name="notes"
              id="notes"
              label={t('trips.notes')}
              type="text"
              multiline
              rows={2}
              value={values.notes || ''}
              onChange={handleChange}
              errorMsg={errors.notes}
            />
          </Grid>
        </Grid>
      </form>
    </FormDialog>
  );
}

export default TripDialog;
