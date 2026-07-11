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

import ManageAccount from "layouts/manageadmin/components/account";
import ManageDevices from "layouts/manageadmin/components/devices";
import ManageTransporters from "layouts/manageadmin/components/transporters";
import ManageUsers from "layouts/manageadmin/components/users";
import ManageRoles from "layouts/manageadmin/components/roles";
import ManagePolicies from "layouts/manageadmin/components/policies";
import ManageGroups from "layouts/manageadmin/components/groups";
import ManagePois from "layouts/manageadmin/components/pois";
import ManageAccountFeatures from "layouts/manageadmin/components/accountFeatures";
import ManageBranding from "layouts/manageadmin/components/branding";
import ManageDrivers from "layouts/manageadmin/components/drivers";
import ManageAuditTrail from "layouts/manageadmin/components/auditTrail";
import ManageNotificationRules from "layouts/manageadmin/components/notificationRules";
import ManageAlertEvents from "layouts/manageadmin/components/alertEvents";
import ManagePublicLinks from "layouts/manageadmin/components/publicLinks";
import ManageDocuments from "layouts/manageadmin/components/documents";
import ManageBackgroundJobs from "layouts/manageadmin/components/backgroundJobs";
import type { ReactNode } from "react";
import ArgonBoxBase from "components/ArgonBox";
import DashboardLayoutBase from "controls/LayoutContainers/DashboardLayout";
import DashboardNavbarBase from "controls/Navbars/DashboardNavbar";
import FooterBase from "controls/Footer";

// Vendored (untyped) controls — type the prop slice crossing the boundary.
interface ArgonBoxProps { py?: number; children?: ReactNode; }
const ArgonBox = ArgonBoxBase as unknown as (props: ArgonBoxProps) => ReactNode;
interface DashboardLayoutProps { children?: ReactNode; }
const DashboardLayout = DashboardLayoutBase as unknown as (props: DashboardLayoutProps) => ReactNode;
const DashboardNavbar = DashboardNavbarBase as unknown as (props: Record<string, never>) => ReactNode;
const Footer = FooterBase as unknown as (props: Record<string, never>) => ReactNode;

function ManageAdmin() {
  return (
    <DashboardLayout>
      <DashboardNavbar />
        <ArgonBox py={3}>
          <ManageAccount/>
          <ManageBranding/>
          <ManageDevices/>
          <ManageTransporters/>
          <ManageUsers/>
          <ManageRoles/>
          <ManagePolicies/>
          <ManageGroups/>
          <ManagePois/>
          <ManageAccountFeatures/>
          <ManageDrivers/>
          <ManageAuditTrail/>
          <ManageNotificationRules/>
          <ManageAlertEvents/>
          <ManagePublicLinks/>
          <ManageDocuments/>
          <ManageBackgroundJobs/>
        </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default ManageAdmin;
