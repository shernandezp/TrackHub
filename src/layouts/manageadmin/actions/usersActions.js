async function handleAdd(user, users, setUsers, setData, buildTableData, createUser) {
    let response = await createUser(user);
    if (response) {
        const updatedUsers = [...users, response];
        setUsers(updatedUsers);
        setData(buildTableData(updatedUsers));
    }
}

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

export async function handleSave(user, users, setUsers, setData, buildTableData, createUser, updateUser, protocolTypes) {
    if (!user.userId) {
        await handleAdd(user, users, setUsers, setData, buildTableData, createUser);
    } else {
        await handleEdit(user, users, setUsers, setData, buildTableData, updateUser, protocolTypes);
    }
}

export async function handleDelete(userId, users, setUsers, setData, buildTableData, deleteUser) {
    let response = await deleteUser(userId);
    if (response) {
        const updatedUsers = users.filter(a => a.userId !== userId);
        setUsers(updatedUsers);
        setData(buildTableData(updatedUsers));
    }
}

export async function handleUpdatePassword(user, updatePassword) {
    await updatePassword(user.userId, user);
}
