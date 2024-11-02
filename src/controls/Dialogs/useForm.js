/**
* Copyright (c) 2024 Sergio Hernandez. All rights reserved.
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

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { validateEmail, validatePassword } from 'utils/validationUtils';

/**
 * Custom hook for managing form state.
 *
 * @param {Object} initialValues - The initial values for the form fields.
 * @param {Array} requiredFields - The names of the required fields.
 * @returns {Array} - An array containing the form values, handleChange function, setValues function, and validate function.
 */
function useForm(initialValues) {
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
    const isCheckbox = event.target.type === 'checkbox';
    setValues({
      ...values,
      [event.target.name]: isCheckbox ? event.target.checked : event.target.value,
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
  const validate = (requiredFields) => {
    let newErrors = {};
    for (let field of requiredFields) {
      let value = values[field];
      let type = types[field];
      
      switch (type) {
        case 'select-one':
          if (value === '0') {
            newErrors[field] = t('validation.selectValue', { field: field });
          }
          break;
        case 'email':
          if (!validateEmail(value)) {
            newErrors[field] = t('validation.invalidEmail', { field: field });
          }
          break;
        case 'password':
          if (!validatePassword(value)) {
            newErrors[field] = t('validation.passwordComplexity', { field: field });
          }
          break;
        default:
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