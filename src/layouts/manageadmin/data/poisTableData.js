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

import { useEffect, useState, useRef, useContext } from "react";
import { useTranslation } from 'react-i18next';
import { Name, Description } from "controls/Tables/components/tableComponents";
import Icon from "@mui/material/Icon";
import ArgonBadge from "components/ArgonBadge";
import ArgonButton from "components/ArgonButton";
import usePointOfInterestService from "services/pointsOfInterest";
import useGroupService from "services/groups";
import { handleDelete, handleSave } from "layouts/manageadmin/actions/poisActions";
import { getPoiType } from "data/poiTypes";
import { toCamelCase } from 'utils/stringUtils';
import { LoadingContext } from 'LoadingContext';
import { useAuth } from "AuthContext";

function usePoiTableData(fetchData, handleEditClick, handleDeleteClick) {
  const { t } = useTranslation();
  const [data, setData] = useState({ columns: [], rows: [] });
  const [pois, setPois] = useState([]);
  const [groups, setGroups] = useState([]);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { setLoading } = useContext(LoadingContext);
  const { isAuthenticated } = useAuth();

  const hasLoaded = useRef(false);
  const { getPointsOfInterestByAccount, createPointOfInterest, updatePointOfInterest, deletePointOfInterest } = usePointOfInterestService();
  const { getGroups } = useGroupService();

  const onSave = async (poi) => {
    setLoading(true);
    try {
      await handleSave(
        poi,
        pois,
        setPois,
        setData,
        buildTableData,
        createPointOfInterest,
        updatePointOfInterest);
        setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (pointOfInterestId) => {
    setLoading(true);
    try {
      await handleDelete(
        pointOfInterestId,
        pois,
        setPois,
        setData,
        buildTableData,
        deletePointOfInterest);
        setConfirmOpen(false);
      } finally {
        setLoading(false);
      }
  }

  const handleOpen = (poi) => {
    handleEditClick(poi);
    setOpen(true);
  };

  const handleOpenDelete = (pointOfInterestId) => {
    handleDeleteClick(pointOfInterestId);
    setConfirmOpen(true);
  };

  const buildTableData = (pois, groupList = groups) => ({
    columns: [
      { name: "name", title:t('poi.name'), align: "left" },
      { name: "type", title:t('poi.type'), align: "left" },
      { name: "coordinates", title:t('poi.coordinates'), align: "center" },
      { name: "group", title:t('poi.group'), align: "left" },
      { name: "active", title:t('poi.active'), align: "center" },
      { name: "action", title:t('generic.action'), align: "center" },
      { name: "id" }
    ],
    rows: pois.map(poi => {
      const group = groupList.find(g => g.groupId === poi.groupId);
      // Unknown type values must not render a dangling i18n key.
      const typeLabel = getPoiType(poi.type);
      return {
        name: <Name name={poi.name} />,
        type: <Description description={typeLabel ? t(`poi.types.${toCamelCase(typeLabel)}`) : '-'} />,
        coordinates: <Description description={`${poi.latitude}, ${poi.longitude}`} />,
        group: <Description description={group ? group.name : '-'} />,
        active: (
          <ArgonBadge
            variant="gradient"
            color={poi.active ? 'success' : 'secondary'}
            size="xs"
            container
            badgeContent={poi.active ? t('generic.yes') : t('generic.no')} />
        ),
        action: (
          <>
            <ArgonButton
                variant="text"
                color="dark"
                onClick={() => handleOpen(poi)}>
              <Icon>edit</Icon>&nbsp;{t('generic.edit')}
            </ArgonButton>
            <ArgonButton
              variant="text"
              color="error"
              onClick={() => handleOpenDelete(poi.pointOfInterestId)}>
              <Icon>delete</Icon>&nbsp;{t('generic.delete')}
            </ArgonButton>
          </>
        ),
        id: poi.pointOfInterestId
      };
    }),
  });

  useEffect(() => {
    if (fetchData && !hasLoaded.current && isAuthenticated) {
      async function fetchData() {
        setLoading(true);
        try {
          const groupList = await getGroups() || [];
          setGroups(groupList);
          const pois = await getPointsOfInterestByAccount();
          setPois(pois);
          setData(buildTableData(pois, groupList));
          hasLoaded.current = true;
        } finally {
          setLoading(false);
        }
      }
      fetchData();
    }
  }, [fetchData, isAuthenticated]);

  const groupOptions = groups.map(group => ({ value: group.groupId, label: group.name }));

  return {
    data,
    groupOptions,
    open,
    confirmOpen,
    onSave,
    onDelete,
    setOpen,
    setConfirmOpen };
}

export default usePoiTableData;
