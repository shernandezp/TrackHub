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
 * Handles adding a new user.
 * @param {Object} user - The user object to be added.
 * @param {Array} users - The array of existing users.
 * @param {Function} setUsers - The function to update the users state.
 * @param {Function} setData - The function to update the data state.
 * @param {Function} buildTableData - The function to build table data.
 * @param {Function} createUser - The function to create a new user.
 * @returns {Promise<void>}
 */
async function handleAdd(user, users, setUsers, setData, buildTableData, createUser) {
    let response = await createUser(user);
    if (response) {
        const updatedUsers = [...users, response];
        setUsers(updatedUsers);
        setData(buildTableData(updatedUsers));
    }
}

/**
 * Handles editing an existing user.
 * @param {Object} user - The user object to be edited.
 * @param {Array} users - The array of existing users.
 * @param {Function} setUsers - The function to update the users state.
 * @param {Function} setData - The function to update the data state.
 * @param {Function} buildTableData - The function to build table data.
 * @param {Function} updateUser - The function to update an existing user.
 * @returns {Promise<void>}
 */
async function handleEdit(user, users, setUsers, setData, buildTableData, updateUser) {
    let response = await updateUser(user.userId, user);
    if (response) {
        const updatedUsers = [...users];
        const index = updatedUsers.findIndex(a => a.userId === user.userId);
        updatedUsers[index] = user;
        setUsers(updatedUsers);
        setData(buildTableData(updatedUsers));
    }
}

/**
 * Handles saving a user.
 * If the user has a userId, it calls handleEdit, otherwise it calls handleAdd.
 * @param {Object} user - The user object to be saved.
 * @param {Array} users - The array of existing users.
 * @param {Function} setUsers - The function to update the users state.
 * @param {Function} setData - The function to update the data state.
 * @param {Function} buildTableData - The function to build table data.
 * @param {Function} createUser - The function to create a new user.
 * @param {Function} updateUser - The function to update an existing user.
 * @returns {Promise<void>}
 */
export async function handleSave(user, users, setUsers, setData, buildTableData, createUser, updateUser) {
    if (!user.userId) {
        await handleAdd(user, users, setUsers, setData, buildTableData, createUser);
    } else {
        await handleEdit(user, users, setUsers, setData, buildTableData, updateUser);
    }
}

/**
 * Handles deleting a user.
 * @param {string} userId - The ID of the user to be deleted.
 * @param {Array} users - The array of existing users.
 * @param {Function} setUsers - The function to update the users state.
 * @param {Function} setData - The function to update the data state.
 * @param {Function} buildTableData - The function to build table data.
 * @param {Function} deleteUser - The function to delete a user.
 * @returns {Promise<void>}
 */
export async function handleDelete(userId, users, setUsers, setData, buildTableData, deleteUser) {
    let response = await deleteUser(userId);
    if (response) {
        const updatedUsers = users.filter(a => a.userId !== userId);
        setUsers(updatedUsers);
        setData(buildTableData(updatedUsers));
    }
}

/**
 * Handles updating a user's password.
 * @param {Object} user - The user object to be updated.
 * @param {Function} updatePassword - The function to update a user's password.
 * @returns {Promise<void>}
 */
export async function handleUpdatePassword(user, updatePassword) {
    await updatePassword(user.userId, user);
}