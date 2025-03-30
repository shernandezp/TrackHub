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

import PropTypes from "prop-types";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import { useTranslation } from 'react-i18next';
 
function Detail({ name, position }) {
    const { t } = useTranslation();
   return (
     <ArgonBox
       component="li"
       display="flex"
       justifyContent="space-between"
       alignItems="flex-start"
       borderRadius="lg"
       p={3}
       mt={2}>
       <ArgonBox width="100%" display="flex" flexDirection="column">
         <ArgonBox
           display="flex"
           justifyContent="space-between"
           alignItems={{ xs: "flex-start", sm: "center" }}
           flexDirection={{ xs: "column", sm: "row" }}
           mb={1}>
           <ArgonTypography variant="button" fontWeight="medium" textTransform="capitalize">
             {name}
           </ArgonTypography>
         </ArgonBox>
         <ArgonBox mb={1} lineHeight={0}>
           <ArgonTypography variant="caption" color="text">
             {t('transporterMap.address')}:&nbsp;&nbsp;&nbsp;
             <ArgonTypography variant="caption" fontWeight="medium" textTransform="capitalize">
               {position.address}
             </ArgonTypography>
           </ArgonTypography>
         </ArgonBox>
         <ArgonBox mb={1} lineHeight={0}>
           <ArgonTypography variant="caption" color="text">
           {t('transporterMap.state')}:&nbsp;&nbsp;&nbsp;
             <ArgonTypography variant="caption" fontWeight="medium">
               {position.state}
             </ArgonTypography>
           </ArgonTypography>
         </ArgonBox>
         <ArgonBox mb={1} lineHeight={0}>
           <ArgonTypography variant="caption" color="text">
           {t('transporterMap.city')}:&nbsp;&nbsp;&nbsp;
             <ArgonTypography variant="caption" fontWeight="medium">
               {position.city}
             </ArgonTypography>
           </ArgonTypography>
         </ArgonBox>
         {position && position.attributes && position.attributes.ignition!== undefined && position.attributes.ignition !== null && (
            <ArgonBox mb={1} lineHeight={0}>
                <ArgonTypography variant="caption" color="text">
                {t('transporterMap.accStatus')}:&nbsp;&nbsp;&nbsp;
                <ArgonTypography variant="caption" fontWeight="medium">
                    {position.attributes.ignition ? t('transporterMap.accOn') : t('transporterMap.accOff')}
                </ArgonTypography>
                </ArgonTypography>
            </ArgonBox>
         )}
         {position && position.attributes && position.attributes.mileage && (
            <ArgonBox mb={1} lineHeight={0}>
                <ArgonTypography variant="caption" color="text">
                {t('transporterMap.mileage')}:&nbsp;&nbsp;&nbsp;
                    <ArgonTypography variant="caption" fontWeight="medium">
                        {position.attributes.mileage}
                    </ArgonTypography>
                </ArgonTypography>
            </ArgonBox>
        )}
        {position && position.attributes && position.attributes.temperature !== undefined && position.attributes.temperature !== null && (
         <ArgonTypography variant="caption" color="text">
           {t('transporterMap.temperature')}:&nbsp;&nbsp;&nbsp;
           <ArgonTypography variant="caption" fontWeight="medium">
             {position.attributes.temperature} &nbsp; °C
           </ArgonTypography>
         </ArgonTypography>
        )}
       </ArgonBox>
     </ArgonBox>
   );
 }
 
 Detail.propTypes = {
   name: PropTypes.string,
   position: PropTypes.object
 };
 
 export default Detail;