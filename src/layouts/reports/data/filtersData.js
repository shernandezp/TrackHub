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

import { useEffect, useState, useContext } from "react";
import useTransporterService from "services/transporter";
import { fetchList, buildTableData } from 'utils/reportUtils';
import { LoadingContext } from "LoadingContext";
import { useTranslation } from 'react-i18next';
import { useAuth } from "AuthContext";

function useFiltersData(reportCode) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { setLoading } = useContext(LoadingContext);
  const { getTransportersByUser } = useTransporterService();
  const [data, setData] = useState({ });

  // Define individual fetch functions with custom mappings
  const defaultFetchFilters = async () => buildTableData({});
  const fetchLiveReport = async () => buildTableData({});
  const fetchTransportersInGeofence = async () => buildTableData({});

  const fetchPositionRecord = async () => {
    const list1 = await fetchList(getTransportersByUser, transporter => ({
      value: transporter.transporterId,
      label: transporter.name
    }));
    return buildTableData({
      list1,
      visibility: [true, false, false, true, true, false, false, false, false],
      labels: [t('reports.transporter'), '', '', t('reports.from'), t('reports.to'), '', '', '', '']
    });
  };

  // Map report codes to their respective functions
  const reportStrategies = {
    LiveReport: fetchLiveReport,
    PositionRecord: fetchPositionRecord,
    TransportersInGeofence: fetchTransportersInGeofence
  };

  useEffect(() => {
    if (reportCode && isAuthenticated) {
      async function fetchData() {
        setLoading(true);
        const fetchStrategy = reportStrategies[reportCode] || defaultFetchFilters;
        setData(await fetchStrategy());
        setLoading(false);
      }
      fetchData();
    }
  }, [reportCode, isAuthenticated]);

  return { data };
}

export default useFiltersData;