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

import { handleError, handleSilentError } from 'utils/errorHandler';

describe('handleError', () => {
  let dispatchSpy;
  let consoleSpy;

  beforeEach(() => {
    dispatchSpy = jest.spyOn(window, 'dispatchEvent').mockImplementation(() => {});
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    dispatchSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  test('dispatches app-error event with error messages from response', () => {
    const error = {
      response: {
        data: {
          errors: [
            { message: 'Field is required' },
            { message: 'Invalid format' },
          ],
        },
      },
    };
    handleError(error);
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const event = dispatchSpy.mock.calls[0][0];
    expect(event.type).toBe('app-error');
    expect(event.detail.message).toBe('Field is required\nInvalid format');
  });

  test('dispatches app-error event with single error message', () => {
    const error = {
      response: {
        data: {
          errors: [{ message: 'Something went wrong' }],
        },
      },
    };
    handleError(error);
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const event = dispatchSpy.mock.calls[0][0];
    expect(event.type).toBe('app-error');
    expect(event.detail.message).toBe('Something went wrong');
  });

  test('does not dispatch event when no response errors structure', () => {
    const error = new Error('Network failed');
    handleError(error);
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  test('does not dispatch event for null error', () => {
    handleError(null);
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  test('does not dispatch event when response has no data', () => {
    const error = { response: {} };
    handleError(error);
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  test('does not dispatch event when response.data has no errors', () => {
    const error = { response: { data: { message: 'fail' } } };
    handleError(error);
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  test('dispatches event with escaped special characters in messages', () => {
    const error = {
      response: {
        data: {
          errors: [{ message: 'Error with "quotes" & <tags>' }],
        },
      },
    };
    handleError(error);
    const event = dispatchSpy.mock.calls[0][0];
    expect(event.detail.message).toBe('Error with "quotes" & <tags>');
  });

  test('dispatches feature-disabled error type when GraphQL code matches', () => {
    const error = {
      response: {
        data: {
          errors: [{ message: 'Forbidden', extensions: { code: 'FEATURE_DISABLED' } }],
        },
      },
    };
    handleError(error);
    const event = dispatchSpy.mock.calls[0][0];
    expect(event.detail.type).toBe('feature-disabled');
    expect(event.detail.code).toBe('FEATURE_DISABLED');
    expect(event.detail.i18nKey).toBe('errors.featureDisabled');
  });
});

describe('handleSilentError', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test('logs error to console in non-production', () => {
    const error = new Error('silent failure');
    handleSilentError(error);
    expect(consoleSpy).toHaveBeenCalledWith(error);
  });

  test('logs string to console in non-production', () => {
    handleSilentError('something broke');
    expect(consoleSpy).toHaveBeenCalledWith('something broke');
  });

  test('logs null to console in non-production', () => {
    handleSilentError(null);
    expect(consoleSpy).toHaveBeenCalledWith(null);
  });
});
