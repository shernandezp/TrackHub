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

/**
 * Handles adding a new client.
 * @param {Object} client - The client to be added.
 * @param {Array} clients - The current list of clients.
 * @param {Function} setClients - The function to update the list of clients.
 * @param {Function} setData - The function to update the data used for building the table.
 * @param {Function} buildTableData - The function to build the table data.
 * @param {Function} createClient - The function to create a new client.
 * @returns {Promise<void>}
 */
async function handleAdd(client, clients, setClients, setData, buildTableData, createClient) {
    let response = await createClient(client);
    if (response) {
        const updatedClients = [...clients, response];
        setClients(updatedClients);
        setData(buildTableData(updatedClients));
    }
}

/**
 * Handles editing an existing client.
 * @param {Object} client - The client to be edited.
 * @param {Array} clients - The current list of clients.
 * @param {Function} setClients - The function to update the list of clients.
 * @param {Function} setData - The function to update the data used for building the table.
 * @param {Function} buildTableData - The function to build the table data.
 * @param {Function} updateClient - The function to update an existing client.
 * @param {Array} users - The list of users.
 * @returns {Promise<void>}
 */
async function handleEdit(client, clients, setClients, setData, buildTableData, updateClient, users) {
    let response = await updateClient(client.clientId, client);
    if (response) {
        const selectedUser = users.find(u => u.value === client.userId);
        client.userId = selectedUser !== undefined ? selectedUser.value : null;
        const updatedClients = [...clients];
        const index = updatedClients.findIndex(a => a.clientId === client.clientId);
        updatedClients[index] = client;
        setClients(updatedClients);
        setData(buildTableData(updatedClients));
    }
}

/**
 * Handles deleting a client.
 * @param {string} clientId - The ID of the client to be deleted.
 * @param {Array} clients - The current list of clients.
 * @param {Function} setClients - The function to update the list of clients.
 * @param {Function} setData - The function to update the data used for building the table.
 * @param {Function} buildTableData - The function to build the table data.
 * @param {Function} deleteClient - The function to delete a client.
 * @returns {Promise<void>}
 */
export async function handleDelete(clientId, clients, setClients, setData, buildTableData, deleteClient) {
    let response = await deleteClient(clientId);
    if (response) {
        const updatedClients = clients.filter(a => a.clientId !== clientId);
        setClients(updatedClients);
        setData(buildTableData(updatedClients));
    }
}

/**
 * Handles saving an client. If the client has an clientId, it will be edited, otherwise it will be added.
 * @param {Object} client - The client to be saved.
 * @param {Array} clients - The current list of clients.
 * @param {Function} setClients - The function to update the list of clients.
 * @param {Function} setData - The function to update the data used for building the table.
 * @param {Function} buildTableData - The function to build the table data.
 * @param {Function} createClient - The function to create a new client.
 * @param {Function} updateClient - The function to update an existing client.
 * @param {Array} users - The list of users.
 * @returns {Promise<void>}
 */
export async function handleSave(client, clients, setClients, setData, buildTableData, createClient, updateClient, users) {
    if (!client.clientId) {
        await handleAdd(client, clients, setClients, setData, buildTableData, createClient);
    } else {
        await handleEdit(client, clients, setClients, setData, buildTableData, updateClient, users);
    }
}