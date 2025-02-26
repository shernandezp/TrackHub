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
 * Handles the given error by displaying the error message(s) in an alert box.
 * If the error object contains a response with data and errors, it extracts the error messages
 * and displays them in the alert box. Otherwise, it logs the error to the console.
 * 
 * @param {Error} error - The error object to handle.
 */
export function handleError(error) {
  if (error && error.response && error.response.data && error.response.data.errors) {
    var errors = error.response.data.errors;
    var errorMessage = errors.map(error => error.message).join('\n');
    alert(errorMessage);
  } else {
    console.error('Unexpected error:', error);
  }
}

/**
 * Handles the given error by logging it to the console.
 * 
 * @param {Error} error - The error object to handle.
 */
export function handleSilentError(error) {
  console.error(error);
}
