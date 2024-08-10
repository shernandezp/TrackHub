import { useState } from 'react';

/**
 * Custom hook for managing form state.
 *
 * @param {Object} initialValues - The initial values for the form fields.
 * @returns {Array} - An array containing the form values, handleChange function, and setValues function.
 */
function useForm(initialValues) {
  const [values, setValues] = useState(initialValues);

  /**
   * Handles the change event for form inputs.
   *
   * @param {Object} event - The change event object.
   */
  const handleChange = (event) => {
    setValues({
      ...values,
      [event.target.name]: event.target.value,
    });
  };

  return [values, handleChange, setValues];
}

export default useForm;