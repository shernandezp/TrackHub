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

import type { ReactNode } from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { TestWrapper } from '../components/testHelpers';
import GeofenceManager from 'layouts/geofencemanager';

const GEOFENCE_ID = '11111111-1111-1111-1111-111111111111';

const geofence = {
  geofenceId: GEOFENCE_ID,
  accountId: '22222222-2222-2222-2222-222222222222',
  name: 'Depot',
  description: null,
  type: 1,
  color: 2,
  active: true,
  circleRadiusMeters: null,
  circleCenter: null,
  alertOnEntry: false,
  alertOnExit: false,
  dwellThresholdMinutes: null,
  geom: { srid: 4326, coordinates: [{ latitude: 1, longitude: 1 }] },
};

const deleteGeofence = vi.fn().mockResolvedValue(GEOFENCE_ID);

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('AuthContext', () => ({ useAuth: () => ({ isAuthenticated: true }) }));

vi.mock('api/manager/settings', () => ({
  getAccountSettings: () => Promise.resolve({ maps: 'OSM', mapsKey: '', refreshMapInterval: 60 }),
}));

vi.mock('api/geofencing/geofencing', () => ({ getGeofence: vi.fn() }));

// A map editor that registers no imperative handles: the state the failing run was in.
vi.mock('layouts/geofencemanager/components/GeofenceEditor', () => ({
  default: () => <div data-testid="map" />,
}));

vi.mock('controls/LayoutContainers/DashboardLayout', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('controls/Navbars/DashboardNavbar', () => ({ default: () => <div /> }));

vi.mock('queries/geofences', () => ({
  useAllGeofences: () => ({ data: [geofence], isFetching: false }),
  useGeofencesByAccount: () => ({ data: { items: [geofence], totalCount: 1 }, isFetching: false }),
  useCreateGeofence: () => ({ mutateAsync: vi.fn() }),
  useUpdateGeofence: () => ({ mutateAsync: vi.fn() }),
  useDeleteGeofence: () => ({ mutateAsync: deleteGeofence }),
}));

describe('geofence delete', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  test('confirming deletes the geofence even when the map registered no handles', async () => {
    render(
      <TestWrapper>
        <GeofenceManager />
      </TestWrapper>
    );

    fireEvent.click(await screen.findByTitle('generic.delete'));
    fireEvent.click(await screen.findByRole('button', { name: 'generic.confirm' }));

    await waitFor(() => expect(deleteGeofence).toHaveBeenCalledWith(GEOFENCE_ID));
  });
});
