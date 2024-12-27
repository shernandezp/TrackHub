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

import React, { useState } from 'react';
import DashboardTabbar from "controls/Navbars/DashboardTabbar";
import Transporters from "layouts/dashboard/components/Transporters";
import Positions from  "layouts/dashboard/components/Positions";
import { useTranslation } from 'react-i18next';

function Default() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchVisibility, setSearchVisibility] = useState(true);
  
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleTabChange = (newValue) => {
    setSelectedTab(newValue);
    setSearchVisibility(newValue === 0);
  };

  const renderContent = () => {
    switch (selectedTab) {
      case 0:
        return <Transporters searchQuery={searchQuery} />;
      case 1:
        return <Positions searchQuery={searchQuery}/>;
      default:
        return null;
    }
  };

  return (
    <DashboardTabbar 
      stickyNavbar 
      searchQuery={searchQuery} 
      handleSearch={handleSearchChange} 
      searchVisibility={searchVisibility}
      tabs={[t("dashboard.transportersTitle"), t("dashboard.positionsTitle")]}
      onTabChange={handleTabChange}>
      {renderContent()}
    </DashboardTabbar>
  );
}

export default Default;
