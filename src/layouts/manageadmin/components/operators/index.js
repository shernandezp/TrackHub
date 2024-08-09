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
import CustomSelect from 'controls/Dialogs/CustomSelect';
import useForm from 'controls/Dialogs/useForm';
import protocolTypes from 'layouts/manageadmin/data/protocolTypes';

import useOperatorTableData from "layouts/manageadmin/data/operatorsTableData";

function ManageOperators() {

  const handleRowClick = (rowData) => {
    setValues(rowData);
  };

  const [expanded, setExpanded] = useState(false);
  const { data: operatorsData, open, handleSave, setOpen } = useOperatorTableData(expanded, handleRowClick);
  const [values, handleChange, setValues] = useForm({ name: '', description: '', protocolTypeId: 0 });

  const { columns, rows } = operatorsData;

  return (
    <>
      <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
        <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header">
          <ArgonTypography variant="h6">Operators</ArgonTypography>
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
              <Table columns={columns} rows={rows} />
            </ArgonBox>
          </Card>
        </AccordionDetails>
      </Accordion>

      <DefaultDialog 
          title="Operator Details"
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

          <CustomTextField
            margin="normal"
            name="phoneNumber"
            id="phoneNumber"
            label="Phone Number"
            type="text"
            fullWidth
            value={values.phoneNumber}
            onChange={handleChange}
          />

          <CustomTextField
            margin="normal"
            name="emailAddress"
            id="emailAddress"
            label="Email Address"
            type="email"
            fullWidth
            value={values.emailAddress}
            onChange={handleChange}
          />

          <CustomTextField
            margin="normal"
            name="address"
            id="address"
            label="Address"
            type="text"
            fullWidth
            value={values.address}
            onChange={handleChange}
          />

          <CustomTextField
            margin="normal"
            name="contactName"
            id="contactName"
            label="Contact Name"
            type="text"
            fullWidth
            value={values.contactName}
            onChange={handleChange}
          />

          <CustomSelect
            list={protocolTypes}
            handleChange={handleChange}
            name="protocolTypeId"
            id="protocolTypeId"
            label="Protocol Type"
            value={values.protocolTypeId}
          />
          
        </form>
      </DefaultDialog>
    </>
  );
}

export default ManageOperators;
