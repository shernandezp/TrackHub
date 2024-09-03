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
