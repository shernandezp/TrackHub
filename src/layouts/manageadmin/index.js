import ManageAccount from "layouts/manageadmin/components/account";
import ManageOperators from "layouts/manageadmin/components/operators";
import ManageDevices from "layouts/manageadmin/components/devices";
import ManageTransporters from "layouts/manageadmin/components/transporters";
import ManageUsers from "layouts/manageadmin/components/users";
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
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default ManageAdmin;
