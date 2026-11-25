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

import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { validateEmail, validatePassword } from 'utils/validationUtils';

/** Every dialog control emits a `target` bearing a `name`; native `ChangeEvent`s are assignable to this shape. */
export interface FormChangeEvent {
  target: {
    name: string;
    value?: string | number | boolean;
    type?: string;
    checked?: boolean;
    /** Validation rule the control declares, independent of its live DOM type. */
    dataset?: { validation?: string };
  };
}

export type FormChangeHandler = (event: FormChangeEvent) => void;

export type FormErrors = Record<string, string>;

/** `setErrors` accepts sparse maps (undefined entries) so callers can clear individual fields. */
export type UseFormResult<T> = [
  T,
  FormChangeHandler,
  Dispatch<SetStateAction<T>>,
  (errors: Record<string, string | undefined>) => void,
  (requiredFields: string[]) => boolean,
  FormErrors,
  (field1: string, field2: string) => boolean,
];

function useForm<T extends object>(initialValues: T | (() => T)): UseFormResult<T> {
  const { t } = useTranslation();
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrorsState] = useState<FormErrors>({});
  const [types, setTypes] = useState<Record<string, string | undefined>>({});

  /**
   * Functional updaters are required: pickers apply several fields in one synchronous handler, and
   * spreading the render-time `values` snapshot would let only the last write survive.
   */
  const handleChange: FormChangeHandler = (event) => {
    const isCheckbox = event.target.type === 'checkbox';
    setValues((previous) => ({
      ...previous,
      [event.target.name]: isCheckbox ? event.target.checked : event.target.value,
    }) as T);
    setTypes((previous) => ({
      ...previous,
      // A field declares its validation rule through data-validation; the live DOM type is only the
      // fallback, because a revealed password field reports type "text" and would skip its rule.
      [event.target.name]: event.target.dataset?.validation ?? event.target.type,
    }));
  };

  const setErrors = (next: Record<string, string | undefined>): void => {
    setErrorsState(next as FormErrors);
  };

  const validate = (requiredFields: string[]): boolean => {
    const newErrors: FormErrors = {};
    const current = values as Record<string, unknown>;
    for (const field of requiredFields) {
      const value = current[field];
      const type = types[field];

      switch (type) {
        case 'select-one':
          if (value === '0') {
            newErrors[field] = t('validation.selectValue', { field });
          }
          break;
        case 'email':
          if (!validateEmail(value as string | null | undefined)) {
            newErrors[field] = t('validation.invalidEmail', { field });
          }
          break;
        case 'password':
          if (!validatePassword(value as string | null | undefined)) {
            newErrors[field] = t('validation.passwordComplexity', { field });
          }
          break;
        default:
          if (!value || value === '') {
            newErrors[field] = t('validation.required', { field });
          }
      }
    }
    setErrorsState(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateMatch = (field1: string, field2: string): boolean => {
    const newErrors: FormErrors = { ...errors };
    const current = values as Record<string, unknown>;

    if (current[field1] !== current[field2]) {
      newErrors[field2] = t('validation.fieldsMustMatch', { field1, field2 });
    } else {
      delete newErrors[field1];
      delete newErrors[field2];
    }

    setErrorsState(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return [values, handleChange, setValues, setErrors, validate, errors, validateMatch];
}

export default useForm;
