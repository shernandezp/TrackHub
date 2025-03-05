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

import { useEffect } from "react";
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import ArgonButton from "components/ArgonButton";
import Icon from "@mui/material/Icon";
import ArgonBox from "components/ArgonBox";
import CustomSelect from 'controls/Dialogs/CustomSelect';
import CustomTextField from 'controls/Dialogs/CustomTextField';
import useFiltersData from "layouts/reports/data/filtersData";
import useForm from 'controls/Dialogs/useForm';
import { useTranslation } from 'react-i18next';

function ReportFilters({selectedReport, generateReport}) {
  const [values, handleChange, setValues, setErrors, validate, errors] = useForm({});

  const { t } = useTranslation();
  const { data } = useFiltersData(selectedReport);
  const { 
    stringFilter1, 
    stringFilter2,
    stringFilter3,
    dateTimeFilter1,
    dateTimeFilter2,
    dateTimeFilter3,
    numericFilter1,
    numericFilter2,
    numericFilter3
  } = data;

  useEffect(() => {
    const fetchFilters = async () => {
      setValues({});
      setErrors({});
    };
  
    fetchFilters();
  }, []);

  async function onGenerate() {
    let requiredFields = [];
    if (validate(requiredFields)) {
      await generateReport(values);
    }
  }

  return (
    <Card>
      <ArgonBox pt={1.5} pb={2} px={2} lineHeight={1.25}>
        {stringFilter1 && stringFilter1.visible && (
          <ArgonBox display="flex" py={1} mb={0.25}>
            <CustomSelect
                list={stringFilter1.data}
                handleChange={handleChange}
                name="selectedItem1"
                id="selectedItem1"
                label={stringFilter1.label}
                value={values.selectedItem1 || ''}
                numericValue={false}
              />
          </ArgonBox>)}
        {errors.selectedItem1 && <p>{errors.selectedItem1}</p>}
        {stringFilter1 && stringFilter2.visible && (
          <ArgonBox display="flex" py={1} mb={0.25}>
            <CustomSelect
                list={stringFilter2.data}
                handleChange={handleChange}
                name="selectedItem2"
                id="selectedItem2"
                label={stringFilter2.label}
                value={values.selectedItem2 || ''}
                numericValue={false}
              />
          </ArgonBox>)}
        {errors.selectedItem2 && <p>{errors.selectedItem2}</p>}
        {stringFilter1 && stringFilter3.visible && (
          <ArgonBox display="flex" py={1} mb={0.25}>
            <CustomSelect
                list={stringFilter3.data}
                handleChange={handleChange}
                name="selectedItem3"
                id="selectedItem3"
                label={stringFilter3.label}
                value={values.selectedItem3 || ''}
                numericValue={false}
              />
          </ArgonBox>)}
        {errors.selectedItem3 && <p>{errors.selectedItem3}</p>}
        {stringFilter1 && dateTimeFilter1.visible && (
          <ArgonBox display="flex" py={1} mb={0.25}>
            <CustomTextField
              name="selectedDate1"
              id="selectedDate1"
              label={dateTimeFilter1.label}
              type="datetime-local"
              fullWidth
              value={values.selectedDate1 || ''}
              errorMsg={errors.selectedDate1}
              onChange={handleChange}/>
          </ArgonBox>)}
        {stringFilter1 && dateTimeFilter2.visible && (
          <ArgonBox display="flex" py={1} mb={0.25}>
            <CustomTextField
              name="selectedDate2"
              id="selectedDate2"
              label={dateTimeFilter2.label}
              type="datetime-local"
              fullWidth
              value={values.selectedDate2 || ''}
              errorMsg={errors.selectedDate2}
              onChange={handleChange}/>
          </ArgonBox>)}
        {stringFilter1 && dateTimeFilter3.visible && (
          <ArgonBox display="flex" py={1} mb={0.25}>
            <CustomTextField
              name="selectedDate3"
              id="selectedDate3"
              label={dateTimeFilter3.label}
              type="datetime-local"
              fullWidth
              value={values.selectedDate3 || ''}
              errorMsg={errors.selectedDate3}
              onChange={handleChange}/>
          </ArgonBox>)}

        <ArgonButton 
          variant="gradient" 
          onClick={onGenerate}
          color="dark">
          <Icon sx={{ fontWeight: "bold" }}>save</Icon>
          &nbsp;{t('reports.generate')}
        </ArgonButton>
      </ArgonBox>
    </Card>
  );
};

ReportFilters.propTypes = {
  selectedReport: PropTypes.string,
  generateReport: PropTypes.func.isRequired
};

export default ReportFilters;
