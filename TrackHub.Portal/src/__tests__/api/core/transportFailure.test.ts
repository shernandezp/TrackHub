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

import { ApiError, isTransportFailure } from 'api/core/errors';

describe('isTransportFailure', () => {
  test('a lost request or a 5xx is worth retrying', () => {
    expect(isTransportFailure(new ApiError('network down'))).toBe(true);
    expect(isTransportFailure(new ApiError('bad gateway', { status: 502 }))).toBe(true);
  });

  test('an answered refusal is not', () => {
    expect(isTransportFailure(new ApiError('limit', { code: 'LOOKUP_LIMIT_EXCEEDED' }))).toBe(false);
    expect(isTransportFailure(new ApiError('bad request', { status: 400 }))).toBe(false);
    expect(isTransportFailure(new ApiError('refused', { graphQLErrors: [{ message: 'x', extensions: { code: 'POD_REQUIRED' } }] }))).toBe(false);
    expect(isTransportFailure(new Error('plain'))).toBe(false);
  });
});
