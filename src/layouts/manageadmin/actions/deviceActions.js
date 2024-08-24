export async function handleDelete(deviceId, devices, setDevices, setData, buildTableData, deleteDevice) {
    let response = await deleteDevice(deviceId);
    if (response) {
        const updatedDevices= devices.filter(a => a.deviceId !== deviceId);
        setDevices(updatedDevices);
        setData(buildTableData(updatedDevices));
    }
}
