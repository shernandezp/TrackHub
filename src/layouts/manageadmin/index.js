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
import ManageOperators from "layouts/manageadmin/components/operators";
import ManageDevices from "layouts/manageadmin/components/devices";
import ManageTransporters from "layouts/manageadmin/components/transporters";
import ManageUsers from "layouts/manageadmin/components/users";
import ManageRoles from "layouts/manageadmin/components/roles";
import ManagePolicies from "layouts/manageadmin/components/policies";
import ManageGroups from "layouts/manageadmin/components/groups";
import ManageAccountFeatures from "layouts/manageadmin/components/accountFeatures";
import ManageDrivers from "layouts/manageadmin/components/drivers";
import ManageAuditTrail from "layouts/manageadmin/components/auditTrail";
import ManageNotificationRules from "layouts/manageadmin/components/notificationRules";
import ManageAlertEvents from "layouts/manageadmin/components/alertEvents";
import ManagePublicLinks from "layouts/manageadmin/components/publicLinks";
import ManageBackgroundJobs from "layouts/manageadmin/components/backgroundJobs";
import ArgonBox from "components/ArgonBox";
import DashboardLayout from "controls/LayoutContainers/DashboardLayout";
import DashboardNavbar from "controls/Navbars/DashboardNavbar";
import Footer from "controls/Footer";

function ManageAdmin() {

  return (
    <DashboardLayout>
      <DashboardNavbar />
        <ArgonBox py={3}>
          <ManageAccount/>
          <ManageOperators/>
          <ManageDevices/>
          <ManageTransporters/>
          <ManageUsers/>
          <ManageRoles/>
          <ManagePolicies/>
          <ManageGroups/>
          <ManageAccountFeatures/>
          <ManageDrivers/>
          <ManageAuditTrail/>
          <ManageNotificationRules/>
          <ManageAlertEvents/>
          <ManagePublicLinks/>
          <ManageBackgroundJobs/>
        </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default ManageAdmin;

