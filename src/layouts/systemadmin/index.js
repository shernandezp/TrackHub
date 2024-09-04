import ManageAccounts from "layouts/systemadmin/components/accounts";
import ManageRoles from "layouts/systemadmin/components/roles";
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
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default SystemAdmin;
