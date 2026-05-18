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
    var featureDisabled = errors.some(error => getErrorCode(error) === 'FEATURE_DISABLED');
    var errorMessage = featureDisabled
      ? 'This feature is not enabled for your account.'
      : errors.map(error => error.message).join('\n');
    window.dispatchEvent(new CustomEvent('app-error', {
      detail: {
        message: errorMessage,
        type: featureDisabled ? 'feature-disabled' : 'graphql',
        code: featureDisabled ? 'FEATURE_DISABLED' : getErrorCode(errors[0]),
        i18nKey: featureDisabled ? 'errors.featureDisabled' : undefined
      }
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
