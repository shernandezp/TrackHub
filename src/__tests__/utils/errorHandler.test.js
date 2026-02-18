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
  let alertSpy;
  let consoleSpy;

  beforeEach(() => {
    alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  test('shows alert with error messages from response', () => {
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
    expect(alertSpy).toHaveBeenCalledWith('Field is required\nInvalid format');
  });

  test('shows alert with single error message', () => {
    const error = {
      response: {
        data: {
          errors: [{ message: 'Something went wrong' }],
        },
      },
    };
    handleError(error);
    expect(alertSpy).toHaveBeenCalledWith('Something went wrong');
  });

  test('logs to console when no response errors structure', () => {
    const error = new Error('Network failed');
    handleError(error);
    expect(consoleSpy).toHaveBeenCalledWith('Unexpected error:', error);
    expect(alertSpy).not.toHaveBeenCalled();
  });

  test('logs to console for null error', () => {
    handleError(null);
    expect(consoleSpy).toHaveBeenCalledWith('Unexpected error:', null);
  });

  test('logs to console when response has no data', () => {
    const error = { response: {} };
    handleError(error);
    expect(consoleSpy).toHaveBeenCalledWith('Unexpected error:', error);
  });

  test('logs to console when response.data has no errors', () => {
    const error = { response: { data: { message: 'fail' } } };
    handleError(error);
    expect(consoleSpy).toHaveBeenCalledWith('Unexpected error:', error);
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

  test('logs error to console', () => {
    const error = new Error('silent failure');
    handleSilentError(error);
    expect(consoleSpy).toHaveBeenCalledWith(error);
  });

  test('logs string to console', () => {
    handleSilentError('something broke');
    expect(consoleSpy).toHaveBeenCalledWith('something broke');
  });

  test('logs null to console', () => {
    handleSilentError(null);
    expect(consoleSpy).toHaveBeenCalledWith(null);
  });
});
