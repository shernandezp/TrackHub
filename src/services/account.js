import { apiService } from './apiService';
import { handleError } from 'utils/errorHandler';

const API_ENDPOINT = process.env.REACT_APP_MANAGER_ENDPOINT;
const { post } = apiService(API_ENDPOINT);

export const getAccount = async (accountId) => {
    try {
        const data = {
            query: `
              query {
                account(query: { id: "${accountId}" }) {
                  accountId
                  active
                  description
                  name
                  type
                }
              }
            `
          };

        const response = await post(data);
        return response.account;
    } catch (error) {
        handleError(error);
    }
};

export const getAccounts = async () => {
    try {
        const data = {
            query: `
                query {
                    accounts {
                    accountId
                    active
                    description
                    name
                    type
                    }
                }
            `
        };

        const response = await post(data);
        return response.accounts;
    } catch (error) {
        handleError(error);
    }
};

export const createAccount = async (accountData) => {
    try {
        const data = {
            query: `
                mutation {
                    createAccount(
                        command: { account: { 
                            active: ${accountData.active},
                            description: "${accountData.description}",
                            name: "${accountData.name}",
                            type: "${accountData.type}"
                        } }
                    ) {
                        accountId
                        active
                        description
                        name
                        type
                    }
                }
            `
        };

        const response = await post(data);
        return response.createAccount;
    } catch (error) {
        handleError(error);
    }
};

export const updateAccount = async (accountId, accountData) => {
    try {
        const data = {
            query: `
                mutation {
                    updateAccount(
                        id: "${accountId}",
                        command: {
                            account: {
                                type: ${accountData.type},
                                name: "${accountData.name}",
                                description: "${accountData.description}",
                                active: ${accountData.active},
                                accountId: "${accountData.accountId}"
                            }
                        }
                    )
                }
            `
        };

        const response = await post(data);
        return response.updateAccount;
    } catch (error) {
        handleError(error);
        return false;
    }
};

export const deleteAccount = async (accountId) => {
    try {
        const data = {
            query: `
                mutation {
                    deleteAccount(id: "${accountId}")
                }
            `
        };

        const response = await post(data);
        return response.deleteAccount;
    } catch (error) {
        handleError(error);
        return false;
    }
};