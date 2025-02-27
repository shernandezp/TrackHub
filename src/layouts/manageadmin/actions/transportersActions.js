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
