import { useEffect, useState, useRef, useContext } from "react";
import { useTranslation } from 'react-i18next';
import { Name } from "controls/Tables/components/tableComponents";
import Icon from "@mui/material/Icon";
import transporterTypes from 'data/transporterTypes';
import ArgonBadge from "components/ArgonBadge";
import ArgonButton from "components/ArgonButton";
import useTransporterService from "services/transporter";
import { handleEdit, handleDelete } from "layouts/manageadmin/actions/transportersActions";
import { LoadingContext } from 'LoadingContext';

function useTransporterTableData(fetchData, handleEditClick, handleDeleteClick) {
  const { t } = useTranslation();
  const [data, setData] = useState({ columns: [], rows: [] });
  const [transporters, setTransporters] = useState([]);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { setLoading } = useContext(LoadingContext);

  const hasLoaded = useRef(false);
  const { getTransporterByAccount, updateTransporter, deleteTransporter } = useTransporterService();

  const onSave = async (transporter) => {
    setLoading(true);
    try {
      await handleEdit(
        transporter, 
        transporters, 
        setTransporters, 
        setData, 
        buildTableData, 
        updateTransporter, 
        transporterTypes);
        setOpen(false);
      } finally {
        setLoading(false);
      }
  };

  const onDelete = async (transporterId) => {
    setLoading(true);
    try {
      await handleDelete(
        transporterId, 
        transporters, 
        setTransporters, 
        setData, 
        buildTableData, 
        deleteTransporter);
        setConfirmOpen(false);
      } finally {
        setLoading(false);
      }
  }

  const handleOpen = (transporter) => {
    handleEditClick(transporter);
    setOpen(true);
  };

  const handleOpenDelete = (transporterId) => {
    handleDeleteClick(transporterId);
    setConfirmOpen(true);
  };

  const buildTableData = (transporters) => ({
    columns: [
      { name: "name", title:t('transporter.name'), align: "left" },
      { name: "transporterType", title:t('transporter.type'), align: "center" },
      { name: "action", title:t('generic.action'), align: "center" }
    ],
    rows: transporters.map(transporter => ({
      name: <Name name={transporter.name} />,
      transporterType: (
        <ArgonBadge variant="gradient" 
          badgeContent={t(`transporterTypes.${transporter.transporterType.toLowerCase()}`)} 
          color="success" size="xs" container />
      ),
      action: (
        <>
          <ArgonButton 
              variant="text" 
              color="dark" 
              onClick={() => handleOpen(transporter)}>
            <Icon>edit</Icon>&nbsp;{t('generic.edit')}
          </ArgonButton>
          <ArgonButton 
            variant="text" 
            color="error"
            onClick={() => handleOpenDelete(transporter.transporterId)}>
            <Icon>delete</Icon>&nbsp;{t('generic.delete')}
          </ArgonButton>
        </>
      )
    })),
  });

  useEffect(() => {
    if (fetchData && !hasLoaded.current) {
      async function fetchData() {
        setLoading(true);
        const transporters = await getTransporterByAccount();
        setTransporters(transporters);
        setData(buildTableData(transporters));
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

export default useTransporterTableData;