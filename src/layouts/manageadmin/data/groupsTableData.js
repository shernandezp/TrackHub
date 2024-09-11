import { useEffect, useState, useRef, useContext } from "react";
import { useTranslation } from 'react-i18next';
import { Name, Description } from "controls/Tables/components/tableComponents";
import Icon from "@mui/material/Icon";
import ArgonButton from "components/ArgonButton";
import useGroupService from "services/groups";
import { handleDelete, handleSave } from "layouts/manageadmin/actions/groupsActions";
import { LoadingContext } from 'LoadingContext';

function useGroupTableData(fetchData, handleEditClick, handleDeleteClick, handleUserClick, handleTransporterClick) {
  const { t } = useTranslation();
  const [data, setData] = useState({ columns: [], rows: [] });
  const [groups, setGroups] = useState([]);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { setLoading } = useContext(LoadingContext);

  const hasLoaded = useRef(false);
  const { getGroups, createGroup, updateGroup, deleteGroup } = useGroupService();

  const onSave = async (group) => {
    setLoading(true);
    try {
      await handleSave(
        group, 
        groups, 
        setGroups, 
        setData, 
        buildTableData, 
        createGroup, 
        updateGroup);
        setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (groupId) => {
    setLoading(true);
    try {
      await handleDelete(
        groupId, 
        groups, 
        setGroups, 
        setData, 
        buildTableData, 
        deleteGroup);
        setConfirmOpen(false);
      } finally {
        setLoading(false);
      }
  }

  const handleOpenUser = (groupId) => {
    handleUserClick(groupId);
  };

  const handleOpenTransporter = (groupId) => {
    handleTransporterClick(groupId);
  };

  const handleOpen = (group) => {
    handleEditClick(group);
    setOpen(true);
  };

  const handleOpenDelete = (groupId) => {
    handleDeleteClick(groupId);
    setConfirmOpen(true);
  };

  const buildTableData = (groups) => ({
    columns: [
      { name: "group", title:t('group.title'), align: "left" },
      { name: "description", title:t('group.description'), align: "left" },
      { name: "action", title:t('generic.action'), align: "center" },
      { name: "user", title:t('user.title'), align: "center" },
      { name: "transporter", title:t('transporter.title'), align: "center" }
    ],
    rows: groups.map(group => ({
      group: <Name name={group.name} />,
      description: <Description description={group.description} />,
      action: (
        <>
            <ArgonButton 
                variant="text" 
                color="dark" 
                onClick={() => handleOpen(group)}>
              <Icon>edit</Icon>&nbsp;{t('generic.edit')}
            </ArgonButton>
            <ArgonButton 
              variant="text" 
              color="error"
              onClick={() => handleOpenDelete(group.groupId)}>
              <Icon>delete</Icon>&nbsp;{t('generic.delete')}
            </ArgonButton>
        </>
      ),
      user: (
        <ArgonButton 
            variant="text" 
            color="dark" 
            onClick={() => handleOpenUser(group.groupId)}>
          <Icon>assignment</Icon>&nbsp;{t('generic.assign')}
        </ArgonButton>
      ),
      transporter: (
        <ArgonButton 
            variant="text" 
            color="dark" 
            onClick={() => handleOpenTransporter(group.groupId)}>
          <Icon>assignment</Icon>&nbsp;{t('generic.assign')}
        </ArgonButton>
      )
    })),
  });

  useEffect(() => {
    if (fetchData && !hasLoaded.current) {
      async function fetchData() {
        setLoading(true);
        const groups = await getGroups();
        setGroups(groups);
        setData(buildTableData(groups));
        hasLoaded.current = true;
        setLoading(false);
      }
      fetchData();
    }
  }, [fetchData]);

  return { 
    data, 
    open, 
    confirmOpen,
    onSave, 
    onDelete, 
    setOpen, 
    setConfirmOpen };
}

export default useGroupTableData;