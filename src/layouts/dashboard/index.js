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

import React, { useState, useEffect, useContext } from 'react';
import DashboardTabbar from "controls/Navbars/DashboardTabbar";
import Transporters from "layouts/dashboard/components/Transporters";
import Positions from  "layouts/dashboard/components/Positions";
import useSettignsService from 'services/settings';
import { LoadingContext } from 'LoadingContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from "AuthContext";

function Default() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { setLoading } = useContext(LoadingContext);
  const { getAccountSettings } = useSettignsService();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchVisibility, setSearchVisibility] = useState(true);
  const [settings, setSettings] = useState({maps:'OSM', mapsKey:'', refreshMapInterval: 60});

  const fetchSettings = async () => {
    setLoading(true);
    var settings = await getAccountSettings();
    setSettings(settings);
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated]);
  
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
        return <Transporters searchQuery={searchQuery} settings={settings} />;
      case 1:
        return <Positions searchQuery={searchQuery} settings={settings}/>;
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
