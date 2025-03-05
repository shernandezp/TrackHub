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

import React, { useState, useEffect, useContext } from 'react';
import Grid from "@mui/material/Grid";
import ArgonBox from "components/ArgonBox";
import DashboardLayout from "controls/LayoutContainers/DashboardLayout";
import DashboardNavbar from "controls/Navbars/DashboardNavbar";
import CustomSelect from 'controls/Dialogs/CustomSelect';
import useReportService from "services/reports";
import ReportFilters from "layouts/reports/components/Filters";
import useExcelReportService from "services/excelReports";
import { useTranslation } from 'react-i18next';
import { LoadingContext } from 'LoadingContext';
import { useAuth } from "AuthContext";
import { toCamelCase } from 'utils/stringUtils';

function Reports() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { getReports } = useReportService();
  const { setLoading } = useContext(LoadingContext);
  const { getReport } = useExcelReportService();

  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    var result = await getReports();
    setReports(result.map(report => ({
      value: report.code,
      label: t(`reportList.${toCamelCase(report.code)}`)
    })));
    setSelectedReport(result.length > 0 ? result[0].code : '');
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchReports();
    }
  }, [isAuthenticated]);

  const handleSearch = async (values) => {
    var reportName = reports.find(report => report.value === selectedReport).label;
    await getReport(selectedReport, reportName, values);
  };

  const handleChange = (event) => {
    setSelectedReport(event.target.value);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} lg={12}>
            <ArgonBox py={3}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <CustomSelect
                    list={reports}
                    handleChange={handleChange}
                    name="selectedReport"
                    id="selectedReport"
                    label={t('reports.select')}
                    value={selectedReport}
                    required
                  />
                </Grid>
              </Grid>
            </ArgonBox>
          </Grid>
        </Grid>
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} lg={6}>
            <ReportFilters 
              selectedReport={selectedReport} 
              generateReport={handleSearch} />
          </Grid>
        </Grid>
      </ArgonBox>
    </DashboardLayout>
  );
};

export default Reports;
