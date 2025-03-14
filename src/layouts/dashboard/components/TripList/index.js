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
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import SingleTrip from "layouts/dashboard/components/TripList/SingleTrip";
import { formatDateTime } from "utils/dateUtils";
import { calculateTotalDistance } from "utils/distanceUtils";
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

function TripList({filters, trips=[], selectedTrip, handleSelected}) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Card sx={{ height: "70vh", overflow: "auto" }}>
      <ArgonBox display="flex" justifyContent="space-between" alignItems="center" pt={3} px={2}>
        <ArgonBox display="flex" alignItems="flex-start">
          <ArgonBox color="text" mr={0.5} lineHeight={0}>
            <Icon color="inherit" fontSize="small">
              date_range
            </Icon>
          </ArgonBox>
          <ArgonTypography variant="button" color="text" fontWeight="regular">
            {formatDateTime(filters.startDate)} - {formatDateTime(filters.endDate)}
          </ArgonTypography>
        </ArgonBox>
      </ArgonBox>
      <ArgonBox pt={3} pb={2} px={2}>
        <ArgonBox mt={1} mb={2}>
          <ArgonTypography
            variant="caption"
            color="text"
            fontWeight="bold"
            textTransform="uppercase">
            {t("tripPanel.totalDistance")} {calculateTotalDistance(trips, "totalDistance")}
          </ArgonTypography>
        </ArgonBox>
        <ArgonBox
          component="ul"
          display="flex"
          flexDirection="column"
          p={0}
          m={0}
          sx={{ listStyle: "none", height: '100%', overflowY: 'auto' }}
        >
          {trips.map((trip) => (
            <ArgonBox 
              key={`p-${trip.tripId}`}
              onClick={() => handleSelected(trip.tripId)}
              sx={{
                cursor: 'pointer',
                backgroundColor: selectedTrip === trip.tripId
                  ? theme.palette.mode === 'dark'
                    ? theme.palette.primary.dark
                    : theme.palette.primary.light
                  : 'inherit',
              }}>
              <SingleTrip
                id={trip.tripId}
                from={trip.from}
                to={trip.to}
                event={trip.type}
                duration={trip.duration}
                distance={trip.totalDistance}
              />
            </ArgonBox>
          ))}
        </ArgonBox>
      </ArgonBox>
    </Card>
  );
}

TripList.propTypes = {
  selectedTrip: PropTypes.string,
  handleSelected: PropTypes.func,
  filters: PropTypes.any.isRequired,
  trips: PropTypes.array.isRequired,
};

export default TripList;
