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
=========================================================
* Argon Dashboard 2 MUI - v3.0.1
=========================================================

* Product Page: https://www.creative-tim.com/product/argon-dashboard-material-ui
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { lazy } from "react";
import type { ReactNode } from "react";

const Dashboard = lazy(() => import("layouts/dashboard"));
const ManageAdmin = lazy(() => import("layouts/manageadmin"));
const SystemAdmin = lazy(() => import("layouts/systemadmin"));
const Reports = lazy(() => import("layouts/reports"));
const GpsIntegration = lazy(() => import("layouts/gpsintegration"));
const GeofenceManager = lazy(() => import("layouts/geofencemanager"));
const TripManager = lazy(() => import("layouts/tripmanager"));
const TripTracking = lazy(() => import("layouts/triptracking"));
const Profile = lazy(() => import("layouts/profile"));
const PlatformStatus = lazy(() => import("layouts/platformstatus"));
const Callback = lazy(() => import("layouts/authentication/callback"));
const ErrorPage = lazy(() => import("layouts/authentication/error"));
import PrincipalTypes from "constants/principalTypes";
import type { PrincipalType } from "constants/principalTypes";
import { editionRoutes } from "edition/routes";

/**
 * Consumed by `App` (route rendering + role/feature-flag filtering) and `controls/Sidenav`.
 * `hidden` entries render a `<Route>` but no Sidenav link (auth callbacks).
 */
export interface RouteDefinition {
  type: "route" | "title" | "divider" | "collapse" | "hidden";
  /** i18n key of the Sidenav label (also the display name for hidden routes). */
  name?: string;
  key: string;
  route?: string;
  icon?: ReactNode;
  component?: ReactNode;
  collapse?: RouteDefinition[];
  href?: string;
  title?: string;
  /** Defaults to [User]. */
  principalTypes?: PrincipalType[];
  /**
   * Bypasses the role and principal-type gates entirely; without it, omitting `principalTypes`
   * would DEFAULT to [User] rather than mean "public".
   */
  public?: boolean;
  featureKey?: string;
}

const routes: RouteDefinition[] = [
  { type: "title", title: "screen.groupOperations", key: "group-operations" },
  {
    type: "route",
    name: "screen.dashboard",
    key: "dashboard",
    route: "/dashboard",
    principalTypes: [PrincipalTypes.User],
    icon: "map",
    component: <Dashboard />,
  },
  {
    // Dispatcher-level: no hardcoded role branch in App.tsx. Visibility is the
    // `trip-management` feature flag alone — an account without it never sees
    // the entry, and the backend answers FEATURE_DISABLED anyway.
    type: "route",
    name: "screen.tripManager",
    key: "tripManager",
    route: "/tripManager",
    principalTypes: [PrincipalTypes.User],
    featureKey: "trip-management",
    icon: "route",
    component: <TripManager />,
  },
  {
    type: "route",
    name: "screen.geofence",
    key: "geofenceManager",
    route: "/geofenceManager",
    principalTypes: [PrincipalTypes.User],
    featureKey: "geofencing",
    icon: "share_location",
    component: <GeofenceManager />,
  },
  {
    // Anonymous customer tracking. `public: true` bypasses the role and
    // principal-type gates entirely — the recipient of a shared link is not a
    // platform principal. Deliberately a `route` (not `hidden`) so it carries a
    // help topic; the Sidenav filters the key out (it is not a portal
    // destination — the page is meaningless without a link token).
    type: "route",
    name: "screen.tripTracking",
    key: "tripTracking",
    route: "/track",
    public: true,
    icon: "public",
    component: <TripTracking />,
  },
  { type: "title", title: "screen.groupInsights", key: "group-insights" },
  {
    type: "route",
    name: "screen.reports",
    key: "reports",
    route: "/reports",
    principalTypes: [PrincipalTypes.User],
    icon: "bar_chart",
    component: <Reports />,
  },
  { type: "title", title: "screen.groupAdministration", key: "group-administration" },
  {
    type: "route",
    name: "screen.manageAdmin",
    key: "manageAdmin",
    route: "/manageAdmin",
    principalTypes: [PrincipalTypes.User],
    icon: "business",
    component: <ManageAdmin />,
  },
  {
    type: "route",
    name: "screen.gpsIntegration",
    key: "gpsIntegration",
    route: "/manage-admin/gps-integration",
    principalTypes: [PrincipalTypes.User],
    icon: "sensors",
    component: <GpsIntegration />,
  },
  {
    type: "route",
    name: "screen.systemAdmin",
    key: "systemAdmin",
    route: "/systemAdmin",
    principalTypes: [PrincipalTypes.User],
    icon: "tune",
    component: <SystemAdmin />,
  },
  {
    // Public route: rendered without authentication (App skips the login redirect
    // for /status) so a locked-out user can still see whether sign-in is down.
    // Listed as a normal route so every signed-in role gets the Sidenav link.
    type: "route",
    name: "screen.platformStatus",
    key: "platformStatus",
    route: "/status",
    public: true,
    icon: "monitor_heart",
    component: <PlatformStatus />,
  },
  { type: "title", title: "screen.account", key: "account-pages" },
  {
    type: "route",
    name: "screen.profile",
    key: "profile",
    route: "/profile",
    principalTypes: [PrincipalTypes.User],
    icon: "person",
    component: <Profile />,
  },
  {
    type: "hidden",
    name: "Callback",
    key: "callback",
    route: "/authentication/callback",
    component: <Callback />,
  },
  // Edition extension point (src/edition/routes.ts): additional routes registered by
  // distributions built on this codebase; empty in this repository.
  ...editionRoutes,
  {
    type: "hidden",
    name: "Error",
    key: "error",
    route: "/error",
    component: <ErrorPage />,
  }
];

export default routes;
