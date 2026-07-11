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

import type { ReactNode } from 'react';
import ManageAccounts from "layouts/systemadmin/components/accounts";
import ManageClients from "layouts/systemadmin/components/clients";
import ManageTransporterTypes from "layouts/systemadmin/components/transporterTypes";
import ManageGeocodingProviders from "layouts/systemadmin/components/geocodingProviders";
import ManageRoles from "layouts/systemadmin/components/roles";
import ManagePolicies from "layouts/systemadmin/components/policies";
import SystemAccountFeatures from "layouts/systemadmin/components/accountFeatures";
import ManageAccountSupportGrants from "layouts/systemadmin/components/accountSupportGrants";
import ManageServiceClientPermissions from "layouts/systemadmin/components/serviceClientPermissions";
import ArgonBoxBase from "components/ArgonBox";
import DashboardLayoutBase from "controls/LayoutContainers/DashboardLayout";
import DashboardNavbarBase from "controls/Navbars/DashboardNavbar";
import FooterBase from "controls/Footer";

// Vendored (untyped) Argon primitives — type the prop slice crossing the boundary.
const ArgonBox = ArgonBoxBase as unknown as (props: { py?: number; children?: ReactNode }) => ReactNode;
const DashboardLayout = DashboardLayoutBase as unknown as (props: { children?: ReactNode }) => ReactNode;
const DashboardNavbar = DashboardNavbarBase as unknown as () => ReactNode;
const Footer = FooterBase as unknown as () => ReactNode;

function SystemAdmin() {

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        <ManageAccounts/>
        <ManageClients/>
        <ManageServiceClientPermissions/>
        <ManageTransporterTypes/>
        <ManageGeocodingProviders/>
        <ManageRoles/>
        <ManagePolicies/>
        <SystemAccountFeatures/>
        <ManageAccountSupportGrants/>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default SystemAdmin;
