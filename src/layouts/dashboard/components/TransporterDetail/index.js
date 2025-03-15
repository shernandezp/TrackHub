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

import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import Detail from "layouts/dashboard/components/TransporterDetail/Detail";
import { useTranslation } from 'react-i18next';
 
function TransporterDetail({positions=[], selectedTransporter}) {
    const { t } = useTranslation();
    const [position, setpPosition] = useState([]);
    useEffect(() => {
        function fetchData() {
            const result = positions.find(item => item.deviceName === selectedTransporter);
            setpPosition(result);
        }
        fetchData();
      }, [selectedTransporter, positions]);

    return (
        <Card id="transporter-detail">
            <ArgonBox pt={3} px={2}>
                <ArgonTypography variant="h6" fontWeight="medium">
                    {t('transporterMap.details')}
                </ArgonTypography>
            </ArgonBox>
            <ArgonBox pt={1} pb={2} px={2}>
                <ArgonBox component="ul" display="flex" flexDirection="column" p={0} m={0}>
                    <Detail
                        name={position.deviceName}
                        position={position} />
                </ArgonBox>
            </ArgonBox>
        </Card>
    );
 }

 TransporterDetail.propTypes = {
    positions: PropTypes.array.isRequired,
    selectedTransporter: PropTypes.string
  };
 
 export default TransporterDetail;