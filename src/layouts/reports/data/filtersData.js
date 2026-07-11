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
import { useTransportersByUser } from 'queries/transporters';
import { buildTableData } from 'utils/reportUtils';
import { LoadingContext } from "LoadingContext";
import { useTranslation } from 'react-i18next';
import { useAuth } from "AuthContext";

function useFiltersData(reportCode) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { setLoading } = useContext(LoadingContext);
  const [data, setData] = useState({ });

  // Only the two transporter-scoped reports need the transporter list.
  const needsTransporters = reportCode === 'PositionRecord' || reportCode === 'GeofenceEvents';
  const transportersQuery = useTransportersByUser({ enabled: isAuthenticated && needsTransporters });

  // Keep the global spinner UX while the transporter list loads.
  useEffect(() => {
    setLoading(transportersQuery.isFetching);
  }, [transportersQuery.isFetching, setLoading]);

  useEffect(() => {
    if (!reportCode || !isAuthenticated) return;

    const transporterOptions = (transportersQuery.data ?? []).map(transporter => ({
      value: transporter.transporterId,
      label: transporter.name
    }));

    const transporterFilter = () => buildTableData({
      list1: transporterOptions,
      visibility: [true, false, false, true, true, false, false, false, false],
      labels: [t('reports.transporter'), '', '', t('reports.from'), t('reports.to'), '', '', '', '']
    });

    // Map report codes to their respective filter builders.
    const reportStrategies = {
      LiveReport: () => buildTableData({}),
      PositionRecord: transporterFilter,
      TransportersInGeofence: () => buildTableData({}),
      GeofenceEvents: transporterFilter
    };

    const fetchStrategy = reportStrategies[reportCode] || (() => buildTableData({}));
    setData(fetchStrategy());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportCode, isAuthenticated, transportersQuery.data]);

  return { data };
}

export default useFiltersData;
