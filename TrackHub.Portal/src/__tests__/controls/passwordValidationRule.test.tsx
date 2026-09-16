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
 * The password rule must survive the eye toggle. `useForm` used to read the rule from the live DOM
 * `type`, which flips to "text" when the field is revealed — so a revealed field fell through to a
 * bare non-empty check and accepted a one-character secret. The field now declares its rule, and
 * these pin both halves: the attribute reaching the input, and validate() honouring it.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CustomPasswordField from 'controls/Dialogs/CustomPasswordField';
import useForm from 'controls/Dialogs/useForm';
import { TestWrapper } from '../components/testHelpers';

describe('password validation rule', () => {
  it('declares the rule on the input, not through its type', () => {
    const { container } = render(
      <TestWrapper>
        <CustomPasswordField name="password" label="Password" value="" onChange={() => {}} />
      </TestWrapper>
    );

    const input = container.querySelector('input');
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveAttribute('data-validation', 'password');

    // Revealing the value flips the DOM type; the declared rule does not move with it.
    fireEvent.click(screen.getByLabelText(/toggle password visibility/i));
    expect(container.querySelector('input')).toHaveAttribute('type', 'text');
    expect(container.querySelector('input')).toHaveAttribute('data-validation', 'password');
  });

  it('applies the complexity rule to a revealed field', () => {
    const { result } = renderHook(() => useForm({ password: '' }));

    act(() => {
      // What a revealed CustomPasswordField emits: type "text", rule "password".
      result.current[1]({
        target: { name: 'password', value: 'x', type: 'text', dataset: { validation: 'password' } },
      });
    });

    let valid = true;
    act(() => {
      valid = result.current[4](['password']);
    });

    expect(valid).toBe(false);
    expect(result.current[5].password).toBeTruthy();
  });
});
