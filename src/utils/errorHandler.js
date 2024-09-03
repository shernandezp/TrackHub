export function handleError(error) {
  // Log the error for debugging purposes
  if (error && error.response && error.response.data && error.response.data.errors) {
    var errors = error.response.data.errors;
    var errorMessage = errors.map(error => error.message).join('\n');
    alert(errorMessage);
  } else {
    console.error('Unexpected error:', error);
  }
}

  export function handleSilentError(error) {
    // Log the error for debugging purposes
    console.error(error);
  }