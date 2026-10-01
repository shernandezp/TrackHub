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

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import TableAccordion from 'controls/Accordions/TableAccordion';
import useForm from 'controls/Dialogs/useForm';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';
import type { SearchOption } from 'edition/SearchSelect';
import { usePermissions } from 'context/permissions';
import { PermissionActions, PermissionResources } from 'constants/permissions';
import { useSetTransporterTollClass, useTollVehicleClasses } from 'queries/trips';
import { useTransporterTypes } from 'queries/transporterTypes';
import type { TransporterTollClass } from 'api/tripManagement/trips';
import { buildTollClassVariables } from 'layouts/manageadmin/components/tollClasses/tollClassForm';
import type { TollClassFormValues } from 'layouts/manageadmin/components/tollClasses/tollClassForm';
import TollClassDialog from './TollClassDialog';

function ManageTollClasses() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const canEdit = can(PermissionResources.Trips, PermissionActions.Edit);
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState(false);
  const [values, handleChange, setValues, setErrors, , errors] = useForm<TollClassFormValues>({
    target: 'transporterType',
  });
  const [transporter, setTransporter] = useState<SearchOption | null>(null);
  const [transporterNames, setTransporterNames] = useState<Map<string, string>>(new Map());
  const [savedMappings, setSavedMappings] = useState<TransporterTollClass[]>([]);

  const vehicleClassesQuery = useTollVehicleClasses({ enabled: canEdit && (expanded || open) });
  const transporterTypesQuery = useTransporterTypes({ enabled: canEdit && open });
  const setTransporterTollClass = useSetTransporterTollClass();

  if (!canEdit) return null;

  const openDialog = () => {
    setValues({ target: 'transporterType' });
    setTransporter(null);
    setErrors({});
  };

  const changeTransporter = (option: SearchOption | null) => {
    setTransporter(option);
    setValues((previous) => ({ ...previous, transporterId: option?.value ?? null }));
  };

  const save = async () => {
    const variables = buildTollClassVariables(values);
    if (!variables) {
      setErrors({
        transporterTypeId: values.target === 'transporterType' ? t('tolls.transporterClass.required') : undefined,
        transporterId: values.target === 'transporter' ? t('tolls.transporterClass.required') : undefined,
        tollVehicleClassCode: values.tollVehicleClassCode ? undefined : t('tolls.transporterClass.required'),
      });
      return;
    }
    try {
      const mapping = await setTransporterTollClass.mutateAsync(variables);
      if (transporter) {
        setTransporterNames((previous) => new Map(previous).set(transporter.value, transporter.label));
      }
      setSavedMappings((previous) => [
        ...previous.filter((candidate) => candidate.transporterTollClassId !== mapping.transporterTollClassId),
        mapping,
      ]);
      setErrors({});
    } catch {
      // Surfaced by the global toast.
    }
  };

  return (
    <>
      <TableAccordion
        sectionKey="toll-classes"
        title={t('tolls.transporterClass.title')}
        showAddIcon
        expanded={expanded}
        setExpanded={setExpanded}
        setOpen={setOpen}
        handleAddClick={openDialog}
      >
        <ArgonTypography variant="caption" color="secondary" display="block">
          {t('tolls.transporterClass.description')}
        </ArgonTypography>
        {vehicleClassesQuery.isSuccess && vehicleClassesQuery.data.length === 0 && (
          <ArgonBox mt={1}>
            <ArgonTypography variant="caption" color="warning" fontWeight="medium" display="block">
              {t('tolls.transporterClass.noClasses')}
            </ArgonTypography>
          </ArgonBox>
        )}
      </TableAccordion>
      <TollClassDialog
        open={open}
        setOpen={setOpen}
        handleSubmit={save}
        values={values}
        handleChange={handleChange}
        errors={errors}
        transporterTypes={transporterTypesQuery.data ?? []}
        transporter={transporter}
        onTransporterChange={changeTransporter}
        vehicleClasses={vehicleClassesQuery.data ?? []}
        savedMappings={savedMappings}
        transporterNames={transporterNames}
        saving={setTransporterTollClass.isPending}
      />
    </>
  );
}

export default ManageTollClasses;
