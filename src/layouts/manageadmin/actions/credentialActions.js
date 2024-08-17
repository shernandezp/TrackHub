/**
 * Handles adding a new credential.
 * @param {Object} credential - The credential object to be added.
 * @param {Function} createCredential - The function to create a new credential.
 * @returns {Promise<void>} - A promise that resolves when the credential is created.
 */
async function handleAdd(credential, createCredential) {
    await createCredential(credential);
}

/**
 * Handles editing an existing credential.
 * @param {Object} credential - The updated credential object.
 * @param {Function} updateCredential - The function to update an existing credential.
 * @returns {Promise<void>} - A promise that resolves when the credential is updated.
 */
async function handleEdit(credential, updateCredential) {
    await updateCredential(credential.credentialId, credential);
}

/**
 * Handles saving a credential by either adding or editing it.
 * @param {Object} credential - The credential object to be saved.
 * @param {Function} createCredential - The function to create a new credential.
 * @param {Function} updateCredential - The function to update an existing credential.
 * @returns {Promise<void>} - A promise that resolves when the credential is saved.
 */
export async function handleSaveCredential(credential, createCredential, updateCredential) {
    if (!credential.credentialId) {
        await handleAdd(credential, createCredential);
    } else {
        await handleEdit(credential, updateCredential);
    }
}
