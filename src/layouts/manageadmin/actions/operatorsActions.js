/**
 * Handles adding a new operator.
 * 
 * @param {Object} operator - The operator to be added.
 * @param {Array} operators - The current list of operators.
 * @param {Function} setOperators - The function to update the list of operators.
 * @param {Function} setData - The function to update the data used for building the table.
 * @param {Function} buildTableData - The function to build the table data.
 * @param {Function} createOperator - The function to create a new operator.
 * @returns {Promise<void>} - A promise that resolves when the operator is added.
 */
async function handleAdd(operator, operators, setOperators, setData, buildTableData, createOperator) {
    let response = await createOperator(operator);
    if (response) {
        const updatedOperators = [...operators, response];
        setOperators(updatedOperators);
        setData(buildTableData(updatedOperators));
    }
}

/**
 * Handles editing an existing operator.
 * 
 * @param {Object} operator - The operator to be edited.
 * @param {Array} operators - The current list of operators.
 * @param {Function} setOperators - The function to update the list of operators.
 * @param {Function} setData - The function to update the data used for building the table.
 * @param {Function} buildTableData - The function to build the table data.
 * @param {Function} updateOperator - The function to update an existing operator.
 * @param {Array} protocolTypes - The list of protocol types.
 * @returns {Promise<void>} - A promise that resolves when the operator is edited.
 */
async function handleEdit(operator, operators, setOperators, setData, buildTableData, updateOperator, protocolTypes) {
    let response = await updateOperator(operator.operatorId, operator);
    if (response) {
        const selectedProtocolType = protocolTypes.find(pt => pt.value === operator.protocolTypeId);
        operator.protocolType = selectedProtocolType.label;
        const updatedOperators = [...operators];
        const index = updatedOperators.findIndex(a => a.operatorId === operator.operatorId);
        updatedOperators[index] = operator;
        setOperators(updatedOperators);
        setData(buildTableData(updatedOperators));
    }
}

/**
 * Handles saving an operator.
 * 
 * @param {Object} operator - The operator to be saved.
 * @param {Array} operators - The current list of operators.
 * @param {Function} setOperators - The function to update the list of operators.
 * @param {Function} setData - The function to update the data used for building the table.
 * @param {Function} buildTableData - The function to build the table data.
 * @param {Function} createOperator - The function to create a new operator.
 * @param {Function} updateOperator - The function to update an existing operator.
 * @param {Array} protocolTypes - The list of protocol types.
 * @returns {Promise<void>} - A promise that resolves when the operator is saved.
 */
export async function handleSave(operator, operators, setOperators, setData, buildTableData, createOperator, updateOperator, protocolTypes) {
    if (!operator.operatorId) {
        await handleAdd(operator, operators, setOperators, setData, buildTableData, createOperator);
    } else {
        await handleEdit(operator, operators, setOperators, setData, buildTableData, updateOperator, protocolTypes);
    }
}

/**
 * Handles deleting an operator.
 * 
 * @param {string} operatorId - The ID of the operator to be deleted.
 * @param {Array} operators - The current list of operators.
 * @param {Function} setOperators - The function to update the list of operators.
 * @param {Function} setData - The function to update the data used for building the table.
 * @param {Function} buildTableData - The function to build the table data.
 * @param {Function} deleteOperator - The function to delete an operator.
 * @returns {Promise<void>} - A promise that resolves when the operator is deleted.
 */
export async function handleDelete(operatorId, operators, setOperators, setData, buildTableData, deleteOperator) {
    let response = await deleteOperator(operatorId);
    if (response) {
        const updatedOperators = operators.filter(a => a.operatorId !== operatorId);
        setOperators(updatedOperators);
        setData(buildTableData(updatedOperators));
    }
}
