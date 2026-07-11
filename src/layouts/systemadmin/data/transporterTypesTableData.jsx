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

import { useEffect, useState, useRef, useContext } from "react";
import { useTranslation } from 'react-i18next';
import { Name } from "controls/Tables/components/tableComponents";
import { handleSave } from "layouts/systemadmin/actions/transporterTypesActions";
import { LoadingContext } from 'LoadingContext';
import { getStringValue } from 'utils/booleanUtils';
import { cleanString } from 'utils/stringUtils';
import Icon from "@mui/material/Icon";
import ArgonBadge from "components/ArgonBadge";
import ArgonButton from "components/ArgonButton";
import useTransporterTypeService from "services/transporterType";
import transporterTypes from "data/transporterTypes";

function useTransporterTypesTableData(fetchData, handleEditClick) {
  const { t } = useTranslation();
  const [data, setData] = useState({ columns: [], rows: [] });
  const [transporterTypeList, setTransporterTypeList] = useState([]);
  const [open, setOpen] = useState(false);
  const { setLoading } = useContext(LoadingContext);
  const hasLoaded = useRef(false);
  const { getTransporterTypes, updateTransporterType } = useTransporterTypeService();

  const onSave = async (transporterType) => {
    setLoading(true);
    try {
      await handleSave(
        transporterType, 
        transporterTypeList, 
        setTransporterTypeList, 
        setData, 
        buildTableData, 
        updateTransporterType,
        transporterTypes);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (transporterType) => {
    handleEditClick(transporterType);
    setOpen(true);
  };

  const buildTableData = (transporterTypeList) => ({
    columns: [
      { name: "name", title:t('transporterType.name'), align: "left" },
      { name: "accBased", title:t('transporterType.accBased'), align: "left" },
      { name: "stoppedGap", title:t('transporterType.stoppedGap'), align: "center" },
      { name: "maxTimeGap", title:t('transporterType.maxTimeGap'), align: "center" },
      { name: "maxDistance", title:t('transporterType.maxDistance'), align: "center" },
      { name: "action", title:t('generic.action'), align: "center" },
      { name: "id" }
    ],
    rows: transporterTypeList.map(transporterType => ({
      name: (
        <ArgonBadge 
          variant="gradient" 
          badgeContent={t(`transporterTypes.${cleanString(transporterType.type)}`)} 
          color="success" 
          size="xs" container />
      ),
      accBased: <Name name={t(`generic.${getStringValue(transporterType.accBased)}`)} />,
      stoppedGap: <Name name={transporterType.stoppedGap} />,
      maxTimeGap: <Name name={transporterType.maxTimeGap} />,
      maxDistance: <Name name={transporterType.maxDistance} />,
      action: (
        <ArgonButton 
            variant="text" 
            color="dark" 
            onClick={() => handleOpen(transporterType)}>
          <Icon>edit</Icon>&nbsp;{t('generic.edit')}
        </ArgonButton>
      ),
      id: transporterType.transporterTypeId
    })),
  });

  useEffect(() => {
    if (fetchData && !hasLoaded.current) {
      async function fetchData() {
        setLoading(true);
        const transporterTypeList = await getTransporterTypes();
        setTransporterTypeList(transporterTypeList);
        setData(buildTableData(transporterTypeList));
        hasLoaded.current = true;
        setLoading(false);
      }
      fetchData();
    }
  }, [fetchData]);

  return { 
    data, 
    open,
    onSave,
    setOpen};
}

export default useTransporterTypesTableData;