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
 * Handles the given error by dispatching a notification event with the error message(s).
 * If the error object contains a response with data and errors, it extracts the error messages.
 * 
 * @param {Error} error - The error object to handle.
 */
export function handleError(error) {
  if (error && error.response && error.response.data && error.response.data.errors) {
    var errors = error.response.data.errors;
    var accountSuspended = errors.some(error => getErrorCode(error) === 'ACCOUNT_SUSPENDED');
    var featureDisabled = errors.some(error => getErrorCode(error) === 'FEATURE_DISABLED');
    var errorMessage;
    var type;
    var code;
    var i18nKey;
    if (accountSuspended) {
      errorMessage = 'This account is not currently operational.';
      type = 'account-suspended';
      code = 'ACCOUNT_SUSPENDED';
      i18nKey = 'errors.accountSuspended';
    } else if (featureDisabled) {
      errorMessage = 'This feature is not enabled for your account.';
      type = 'feature-disabled';
      code = 'FEATURE_DISABLED';
      i18nKey = 'errors.featureDisabled';
    } else {
      errorMessage = errors.map(error => error.message).join('\n');
      type = 'graphql';
      code = getErrorCode(errors[0]);
      i18nKey = undefined;
    }
    window.dispatchEvent(new CustomEvent('app-error', {
      detail: { message: errorMessage, type, code, i18nKey }
    }));
  } else if (process.env.NODE_ENV !== 'production') {
    console.error('Unexpected error:', error);
  }
}

function getErrorCode(error) {
  return error?.extensions?.code || error?.code;
}

/**
 * Handles the given error by logging it to the console (non-production only).
 * 
 * @param {Error} error - The error object to handle.
 */
export function handleSilentError(error) {
  if (process.env.NODE_ENV !== 'production') {
    console.error(error);
  }
}
