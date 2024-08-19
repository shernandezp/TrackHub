import { useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Custom hook for managing form state.
 *
 * @param {Object} initialValues - The initial values for the form fields.
 * @param {Array} requiredFields - The names of the required fields.
 * @returns {Array} - An array containing the form values, handleChange function, setValues function, and validate function.
 */
function useForm(initialValues, requiredFields = []) {
  const { t } = useTranslation();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [types, setTypes] = useState({});

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
    setTypes({
      ...types,
      [event.target.name]: event.target.type,
    });
  };

  /**
   * Validates the form values.
   *
   * @returns {boolean} - Whether the form is valid.
   */
  const validate = () => {
    let newErrors = {};
    for (let field of requiredFields) {
      let value = values[field];
      let type = types[field];
      if (type === 'select-one') {
        if (value === '0') {
          newErrors[field] = t('validation.selectValue', { field: field });
        }
      } else {
        if (!value || value === '') {
          newErrors[field] = t('validation.required', { field: field });
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return [values, handleChange, setValues, setErrors, validate, errors];
}

export default useForm;