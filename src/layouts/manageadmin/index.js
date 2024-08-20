import Card from "@mui/material/Card";

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ManageAccount from "layouts/manageadmin/components/account";
import ManageOperators from "layouts/manageadmin/components/operators";
import ManageDevices from "layouts/manageadmin/components/devices";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI controls
import DashboardLayout from "controls/LayoutContainers/DashboardLayout";
import DashboardNavbar from "controls/Navbars/DashboardNavbar";
import Footer from "controls/Footer";
import Table from "controls/Tables/Table";

// Data
import projectsTableData from "layouts/manageadmin/data/projectsTableData";

function ManageAdmin() {
  
  const { columns: prCols, rows: prRows } = projectsTableData;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        <ManageAccount/>
        <ManageOperators/>
        <ManageDevices/>

        <Accordion>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel4a-content"
                id="panel4a-header">
              <ArgonTypography variant="h6">Users</ArgonTypography>
            </AccordionSummary>
            <AccordionDetails>
                <Card>
                    <ArgonBox
                        sx={{
                            "& .MuiTableRow-root:not(:last-child)": {
                                "& td": {
                                    borderBottom: ({ borders: { borderWidth, borderColor } }) =>
                                        `${borderWidth[1]} solid ${borderColor}`,
                                },
                            },
                        }}
                    >
                        <Table columns={prCols} rows={prRows} />
                    </ArgonBox>
                </Card>
            </AccordionDetails>
        </Accordion>

        <Accordion>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel5a-content"
                id="panel5a-header">
              <ArgonTypography variant="h6">Groups</ArgonTypography>
            </AccordionSummary>
            <AccordionDetails>
                <Card>
                    <ArgonBox
                        sx={{
                            "& .MuiTableRow-root:not(:last-child)": {
                                "& td": {
                                    borderBottom: ({ borders: { borderWidth, borderColor } }) =>
                                        `${borderWidth[1]} solid ${borderColor}`,
                                },
                            },
                        }}
                    >
                        <Table columns={prCols} rows={prRows} />
                    </ArgonBox>
                </Card>
            </AccordionDetails>
        </Accordion>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default ManageAdmin;
