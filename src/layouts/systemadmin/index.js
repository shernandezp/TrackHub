import ManageAccounts from "layouts/systemadmin/components/accounts";
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
        <ManageRoles/>
        <ManagePolicies/>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default SystemAdmin;
