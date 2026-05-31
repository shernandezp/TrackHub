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

import { renderHook } from '@testing-library/react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import useApiService from 'services/apiService';
import { useAuth } from '../../AuthContext';

jest.mock('axios');
jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(),
}));
jest.mock('../../AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('useApiService GraphQL responses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jwtDecode.mockReturnValue({ exp: Date.now() / 1000 + 60 });
    useAuth.mockReturnValue({
      accessToken: 'access-token',
      handleRefreshToken: jest.fn(),
    });
  });

  test('post returns GraphQL payloads without errors', async () => {
    const payload = { data: { devicePositionsByUser: [] } };
    axios.post.mockResolvedValue({ data: payload });

    const { result } = renderHook(() => useApiService('https://router/graphql'));
    const response = await result.current.post({ query: '{ devicePositionsByUser { transporterId } }' });

    expect(response).toBe(payload);
  });

  test('post rejects GraphQL error payloads with the existing error-handler shape', async () => {
    const payload = {
      errors: [{ message: 'Feature disabled', extensions: { code: 'FEATURE_DISABLED' } }],
      data: null,
    };
    axios.post.mockResolvedValue({ data: payload });

    const { result } = renderHook(() => useApiService('https://router/graphql'));

    await expect(result.current.post({ query: '{ devicePositionsByUser { transporterId } }' }))
      .rejects
      .toMatchObject({ response: { data: payload } });
  });
});
