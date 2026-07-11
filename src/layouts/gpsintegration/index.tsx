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

import type { ReactNode } from "react";
import ArgonBoxBase from "components/ArgonBox";
import DashboardLayoutBase from "controls/LayoutContainers/DashboardLayout";
import DashboardNavbarBase from "controls/Navbars/DashboardNavbar";
import FooterBase from "controls/Footer";
import GpsDashboard from "layouts/gpsintegration/components/Dashboard";
import ManageOperators from "layouts/gpsintegration/components/operators";
import ManageSynchronizedDevices from "layouts/gpsintegration/components/SynchronizedDevices";
import ManageDeviceAssignments from "layouts/gpsintegration/components/Assignments";
import RecentSyncRuns from "layouts/gpsintegration/components/RecentSyncRuns";
import OpenAlerts from "layouts/gpsintegration/components/OpenAlerts";
import RetentionSettings from "layouts/gpsintegration/components/RetentionSettings";

// Vendored (untyped) Argon primitives / layout — type the props crossing the boundary.
interface ArgonBoxProps { py?: number; mb?: number; children?: ReactNode; }
const ArgonBox = ArgonBoxBase as unknown as (props: ArgonBoxProps) => ReactNode;
const DashboardLayout = DashboardLayoutBase as unknown as (props: { children?: ReactNode }) => ReactNode;
const DashboardNavbar = DashboardNavbarBase as unknown as (props: Record<string, never>) => ReactNode;
const Footer = FooterBase as unknown as (props: Record<string, never>) => ReactNode;

function GpsIntegration() {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        <ArgonBox mb={3}>
          <GpsDashboard />
        </ArgonBox>
        <ManageOperators />
        <RecentSyncRuns />
        <OpenAlerts />
        <ManageSynchronizedDevices />
        <ManageDeviceAssignments />
        <RetentionSettings />
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default GpsIntegration;
