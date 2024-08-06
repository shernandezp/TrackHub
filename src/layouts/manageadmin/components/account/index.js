import { useState } from 'react';
import Card from "@mui/material/Card";

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import Table from "controls/Tables/Table";
import DefaultDialog from "controls/Dialogs/DefaultDialog";
import CustomTextField from 'controls/Dialogs/CustomTextField';
import useForm from 'controls/Dialogs/useForm';

import useAccountsTableData from "layouts/manageadmin/data/accountsTableData";

function ManageAccount() {

  const handleRowClick = (rowData) => {
    setValues(rowData);
  };

  const [expanded, setExpanded] = useState(false);
  const { data: accountsData, open, handleSave, setOpen } = useAccountsTableData(expanded, handleRowClick);
  const [values, handleChange, setValues] = useForm({ name: '', description: '' });

  const { columns: accountCols, rows: accountRows } = accountsData;

  return (
    <>
      <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
        <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header">
          <ArgonTypography variant="h6">Account</ArgonTypography>
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
              <Table columns={accountCols} rows={accountRows} />
            </ArgonBox>
          </Card>
        </AccordionDetails>
      </Accordion>

      <DefaultDialog 
          title="Account Details"
          handleSave={async() => await handleSave(values)}
          open={open}
          setOpen={setOpen}
          maxWidth="md">
        <form>
          <CustomTextField
            autoFocus
            margin="dense"
            name="name"
            id="name"
            label="Name"
            type="text"
            fullWidth
            value={values.name}
            onChange={handleChange}
          />
          
          <CustomTextField
            margin="normal"
            name="description"
            id="description"
            label="Description"
            type="text"
            fullWidth
            value={values.description}
            onChange={handleChange}
          />
        </form>
      </DefaultDialog>
    </>
  );
}

export default ManageAccount;
