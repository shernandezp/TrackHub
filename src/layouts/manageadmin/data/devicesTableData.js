import { useEffect, useState, useRef, useContext } from "react";
import { useTranslation } from 'react-i18next';
import { Name, NameDetail, Description } from "controls/Tables/components/tableComponents";
import Icon from "@mui/material/Icon";
import ArgonBadge from "components/ArgonBadge";
import ArgonButton from "components/ArgonButton";
import useDeviceService from "services/device";
import { handleDelete } from "layouts/manageadmin/actions/deviceActions";
import { LoadingContext } from 'LoadingContext';

function useDeviceTableData(fetchData, handleDeleteClick) {
  const { t } = useTranslation();
  const [data, setData] = useState({ columns: [], rows: [] });
  const [devices, setDevices] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { setLoading } = useContext(LoadingContext);

  const hasLoaded = useRef(false);
  const { getDevicesByAccount, deleteDevice } = useDeviceService();

  const onDelete = async (deviceId) => {
    setLoading(true);
    await handleDelete(
      deviceId, 
      devices, 
      setDevices, 
      setData, 
      buildTableData, 
      deleteDevice);
      setConfirmOpen(false);
      setLoading(false);
  }

  const handleOpenDelete = (deviceId) => {
    handleDeleteClick(deviceId);
    setConfirmOpen(true);
  };

  const buildTableData = (devices) => ({
    columns: [
      { name: "name", title:t('device.name'), align: "left" },
      { name: "serial", title:t('device.serial'), align: "left" },
      { name: "description", title:t('device.description'), align: "left" },
      { name: "devicetype", title:t('device.type'), align: "center" },
      { name: "action", title:t('generic.action'), align: "center" }
    ],
    rows: devices.map(device => ({
      name: <NameDetail name={device.name} detail={device.identifier} />,
      serial: <Name name={device.serial} />,
      description: <Description description={device.description} />,
      devicetype: (
        <ArgonBadge variant="gradient" badgeContent={device.deviceType} color="success" size="xs" container />
      ),
      action: (
        <>
            <ArgonButton 
              variant="text" 
              color="error"
              onClick={() => handleOpenDelete(device.deviceId)}>
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
        const devices = await getDevicesByAccount();
        setDevices(devices);
        setData(buildTableData(devices));
        hasLoaded.current = true;
        setLoading(false);
      }
      fetchData();
    }
  }, [fetchData]);

  return { 
    data, 
    confirmOpen,
    onDelete, 
    setConfirmOpen
  };
}

export default useDeviceTableData;