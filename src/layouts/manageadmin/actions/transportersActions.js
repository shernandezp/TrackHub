export async function handleEdit(transporter, transporters, setTransporters, setData, buildTableData, updateTransporter, transporterTypes) {
    let response = await updateTransporter(transporter.transporterId, transporter);
    if (response) {
        const selectedTransporterType = transporterTypes.find(pt => pt.value === transporter.transporterTypeId);
        transporter.transporterType = selectedTransporterType.label;
        const updatedTransporters = [...transporters];
        const index = updatedTransporters.findIndex(a => a.transporterId === transporter.transporterId);
        updatedTransporters[index] = transporter;
        setTransporters(updatedTransporters);
        setData(buildTableData(updatedTransporters));
    }
}

export async function handleDelete(transporterId, transporters, setTransporters, setData, buildTableData, deleteTransporter) {
    let response = await deleteTransporter(transporterId);
    if (response) {
        const updatedTransporters = transporters.filter(a => a.transporterId !== transporterId);
        setTransporters(updatedTransporters);
        setData(buildTableData(updatedTransporters));
    }
}
