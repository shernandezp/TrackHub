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

import ManageAccounts from "layouts/systemadmin/components/accounts";
import ManageTransporterTypes from "layouts/systemadmin/components/transporterTypes";
import ManageRoles from "layouts/systemadmin/components/roles";
import ManagePolicies from "layouts/systemadmin/components/policies";
import ArgonBox from "components/ArgonBox";
import DashboardLayout from "controls/LayoutContainers/DashboardLayout";
import DashboardNavbar from "controls/Navbars/DashboardNavbar";
import Footer from "controls/Footer";

function SystemAdmin() {
  
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        <ManageAccounts/>
        <ManageTransporterTypes/>
        <ManageRoles/>
        <ManagePolicies/>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default SystemAdmin;
