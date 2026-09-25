/**
* Copyright (c) 2026 Sergio Hernandez. All rights reserved.
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

import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FormDialog from 'controls/Dialogs/FormDialog';
import { TestWrapper } from '../components/testHelpers';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('FormDialog pending save', () => {
  test('Save is disabled while a save is in flight, so a double click submits once', async () => {
    let finish: () => void = () => {};
    const handleSave = vi.fn(() => new Promise<void>((resolve) => { finish = resolve; }));

    render(
      <TestWrapper>
        <FormDialog title="Title" open setOpen={() => {}} handleSave={handleSave}>
          <div />
        </FormDialog>
      </TestWrapper>
    );

    const save = screen.getByRole('button', { name: 'generic.save' });
    fireEvent.click(save);
    fireEvent.click(save);

    expect(handleSave).toHaveBeenCalledTimes(1);
    expect(save).toBeDisabled();

    await act(async () => finish());
    expect(save).not.toBeDisabled();
  });
});
