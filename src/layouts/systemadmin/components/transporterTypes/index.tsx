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

import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import TableBase from "controls/Tables/Table";
import TableAccordionBase from "controls/Accordions/TableAccordion";
import TransporterTypeFormDialog from 'layouts/systemadmin/components/transporterTypes/TransporterTypeDialog';
import useForm from 'controls/Dialogs/useForm';
import useTransporterTypesTableData from 'layouts/systemadmin/data/transporterTypesTableData';
import type {
  TransporterTypeFormValues,
  TransporterTypeTableColumn,
  TransporterTypeTableRow,
} from 'layouts/systemadmin/data/transporterTypesTableData';

// Change event shape emitted by the vendored dialog controls.
type FormChangeHandler = (
  event: { target: { name: string; value: string; type?: string; checked?: boolean } }
) => void;

// The vendored useForm hook is still JS; type its tuple result at the boundary.
type TransporterTypeUseFormResult = [
  TransporterTypeFormValues,
  FormChangeHandler,
  (values: TransporterTypeFormValues) => void,
  (errors: Record<string, string>) => void,
  (requiredFields: string[]) => boolean,
  Record<string, string>,
];

// Vendored (untyped) controls — type the prop slice crossing the boundary.
interface TableProps { columns: TransporterTypeTableColumn[]; rows: TransporterTypeTableRow[]; selectedField?: string; }
const Table = TableBase as unknown as (props: TableProps) => ReactNode;

interface TableAccordionProps {
  title: string;
  showAddIcon?: boolean;
  expanded: boolean;
  setOpen?: (open: boolean) => void;
  handleAddClick?: () => void;
  setExpanded: (expanded: boolean) => void;
  children?: ReactNode;
}
const TableAccordion = TableAccordionBase as unknown as (props: TableAccordionProps) => ReactNode;

function ManageTransporterTypes() {
  const { t } = useTranslation();

  const handleEditClick = (rowData: TransporterTypeFormValues) => {
    setValues(rowData);
    setErrors({});
  };

  const [expanded, setExpanded] = useState(false);
  const {
    data,
    open,
    onSave,
    setOpen} = useTransporterTypesTableData(expanded, handleEditClick);

  const [values, handleChange, setValues, setErrors, validate, errors] = useForm({}) as TransporterTypeUseFormResult;
  const { columns, rows } = data;

  const handleSubmit = async () => {
    if (validate(['accBased', 'stoppedGap', 'maxTimeGap', 'maxDistance'])) {
      onSave(values);
    }
  };

  return (
    <>
      <TableAccordion
        title={t('transporterType.title')}
        expanded={expanded}
        setOpen={setOpen}
        setExpanded={setExpanded}>
        <Table columns={columns} rows={rows} selectedField='name'/>
      </TableAccordion>

      <TransporterTypeFormDialog
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        values={values}
        handleChange={handleChange}
        errors={errors}
      />

    </>
  );
}

export default ManageTransporterTypes;
