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

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PolicyAssignmentTable from 'layouts/systemadmin/components/policies/PolicyAssignmentTable';
import TableAccordion from "controls/Accordions/TableAccordion";

function ManagePolicies() {
  const { t } = useTranslation();

  const [expanded, setExpanded] = useState(false);
    
  return (
    <TableAccordion 
        title={t('policy.title')}
        expanded={expanded} 
        setExpanded={setExpanded}>
        <PolicyAssignmentTable open={expanded} />
    </TableAccordion>
  );
}

export default ManagePolicies;