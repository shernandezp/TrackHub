async function handleAdd(device, devices, setDevices, setData, buildTableData, createDevice) {
    let response = await createDevice(device);
    if (response) {
        const updatedDevices = [...devices, response];
        setDevices(updatedDevices);
        setData(buildTableData(updatedDevices));
    }
}

async function handleEdit(device, devices, setDevices, setData, buildTableData, updateDevice, deviceTypes) {
    let response = await updateDevice(device.deviceId, device);
    if (response) {
        const selectedDeviceType = deviceTypes.find(pt => pt.value === device.deviceTypeId);
        device.deviceType = selectedDeviceType.label;
        const updatedDevices = [...devices];
        const index = updatedDevices.findIndex(a => a.deviceId === device.deviceId);
        updatedDevices[index] = device;
        setDevices(updatedDevices);
        setData(buildTableData(updatedDevices));
    }
}

export async function handleSave(device, devices, setDevices, setData, buildTableData, createDevice, updateDevice, deviceTypes) {
    if (!device.deviceId) {
        await handleAdd(device, devices, setDevices, setData, buildTableData, createDevice);
    } else {
        await handleEdit(device, devices, setDevices, setData, buildTableData, updateDevice, deviceTypes);
    }
}

export async function handleDelete(deviceId, devices, setDevices, setData, buildTableData, deleteDevice) {
    let response = await deleteDevice(deviceId);
    if (response) {
        const updatedDevices= devices.filter(a => a.deviceId !== deviceId);
        setDevices(updatedDevices);
        setData(buildTableData(updatedDevices));
    }
}
