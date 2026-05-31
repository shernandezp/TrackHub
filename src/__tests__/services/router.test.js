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

import useRouterService from 'services/router';
import useApiService from 'services/apiService';
import { handleError } from 'utils/errorHandler';

jest.mock('services/apiService');
jest.mock('utils/errorHandler', () => ({
  handleError: jest.fn(),
  handleSilentError: jest.fn(),
}));

describe('useRouterService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getDevicePositions returns an empty list after a GraphQL feature restriction error', async () => {
    const graphQLError = {
      response: {
        data: {
          errors: [{ message: 'Feature disabled', extensions: { code: 'FEATURE_DISABLED' } }],
        },
      },
    };
    const post = jest.fn().mockRejectedValue(graphQLError);
    useApiService.mockReturnValue({ post });

    const service = useRouterService();
    const result = await service.getDevicePositions();

    expect(result).toEqual([]);
    expect(handleError).toHaveBeenCalledWith(graphQLError);
  });
});
