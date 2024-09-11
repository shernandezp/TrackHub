
/**
 * Handles adding a new group.
 * @param {Object} group - The group object to be added.
 * @param {Array} groups - The current list of groups.
 * @param {Function} setGroups - The function to update the list of groups.
 * @param {Function} setData - The function to update the data used for building the table.
 * @param {Function} buildTableData - The function to build the table data.
 * @param {Function} createGroup - The function to create a new group.
 * @returns {Promise<void>}
 */
async function handleAdd(group, groups, setGroups, setData, buildTableData, createGroup) {
    let response = await createGroup(group);
    if (response) {
        const updatedGroups = [...groups, response];
        setGroups(updatedGroups);
        setData(buildTableData(updatedGroups));
    }
}

/**
 * Handles editing an existing group.
 * @param {Object} group - The group object to be edited.
 * @param {Array} groups - The current list of groups.
 * @param {Function} setGroups - The function to update the list of groups.
 * @param {Function} setData - The function to update the data used for building the table.
 * @param {Function} buildTableData - The function to build the table data.
 * @param {Function} updateGroup - The function to update an existing group.
 * @returns {Promise<void>}
 */
async function handleEdit(group, groups, setGroups, setData, buildTableData, updateGroup) {
    let response = await updateGroup(group.groupId, group);
    if (response) {
        const updatedGroups = [...groups];
        const index = updatedGroups.findIndex(a => a.groupId === group.groupId);
        updatedGroups[index] = group;
        setGroups(updatedGroups);
        setData(buildTableData(updatedGroups));
    }
}

/**
 * Handles saving a group by either adding or editing it.
 * @param {Object} group - The group object to be saved.
 * @param {Array} groups - The current list of groups.
 * @param {Function} setGroups - The function to update the list of groups.
 * @param {Function} setData - The function to update the data used for building the table.
 * @param {Function} buildTableData - The function to build the table data.
 * @param {Function} createGroup - The function to create a new group.
 * @param {Function} updateGroup - The function to update an existing group.
 * @returns {Promise<void>}
 */
export async function handleSave(group, groups, setGroups, setData, buildTableData, createGroup, updateGroup) {
    if (!group.groupId) {
        await handleAdd(group, groups, setGroups, setData, buildTableData, createGroup);
    } else {
        await handleEdit(group, groups, setGroups, setData, buildTableData, updateGroup);
    }
}

/**
 * Handles deleting a group.
 * @param {string} groupId - The ID of the group to be deleted.
 * @param {Array} groups - The current list of groups.
 * @param {Function} setGroups - The function to update the list of groups.
 * @param {Function} setData - The function to update the data used for building the table.
 * @param {Function} buildTableData - The function to build the table data.
 * @param {Function} deleteGroup - The function to delete a group.
 * @returns {Promise<void>}
 */
export async function handleDelete(groupId, groups, setGroups, setData, buildTableData, deleteGroup) {
    let response = await deleteGroup(groupId);
    if (response) {
        const updatedGroups = groups.filter(a => a.groupId !== groupId);
        setGroups(updatedGroups);
        setData(buildTableData(updatedGroups));
    }
}