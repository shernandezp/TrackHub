/**
* Copyright (c) 2024 Sergio Hernandez. All rights reserved.
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

import React from 'react';
import PropTypes from 'prop-types';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Icon from "@mui/material/Icon";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArgonTypography from "components/ArgonTypography";
import Card from "@mui/material/Card";
import ArgonBox from "components/ArgonBox";

const TableAccordion = ({ 
        title, 
        expanded, 
        showAddIcon=false, 
        setOpen, 
        setExpanded, 
        handleAddClick = () => {}, 
        children 
    }) => {
    
    const handleOpen = () => {
        handleAddClick();
        setOpen(true);
      };

    return (
        <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1a-content"
                id="panel1a-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <ArgonTypography variant="h6">{title}</ArgonTypography>
                {expanded && showAddIcon && (
                <Icon 
                    style={{ marginRight: '1rem' }}
                    onClick={(event) => {
                    event.stopPropagation();
                    handleOpen();
                    }}
                >add</Icon>
                )}
            </div>
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
                    {children}
                </ArgonBox>
            </Card>
            </AccordionDetails>
      </Accordion>
    );
};

TableAccordion.propTypes = {
    title: PropTypes.string.isRequired,
    expanded: PropTypes.bool.isRequired,
    showAddIcon: PropTypes.bool,
    setOpen: PropTypes.func,
    setExpanded: PropTypes.func.isRequired,
    handleAddClick: PropTypes.func,
    children: PropTypes.node.isRequired,
};

export default TableAccordion;