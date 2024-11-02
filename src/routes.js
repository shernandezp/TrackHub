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

/**
=========================================================
* Argon Dashboard 2 MUI - v3.0.1
=========================================================

* Product Page: https://www.creative-tim.com/product/argon-dashboard-material-ui
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

/** 
  All of the routes for the Soft UI Dashboard React are added here,
  You can add a new route, customize the routes and delete the routes here.
  Once you add a new route on this file it will be visible automatically on
  the Sidenav.
  For adding a new route you can follow the existing routes in the routes array.
  1. The `type` key with the `collapse` value is used for a route.
  2. The `type` key with the `title` value is used for a title inside the Sidenav. 
  3. The `type` key with the `divider` value is used for a divider between Sidenav items.
  4. The `name` key is used for the name of the route on the Sidenav.
  5. The `key` key is used for the key of the route (It will help you with the key prop inside a loop).
  6. The `icon` key is used for the icon of the route on the Sidenav, you have to add a node.
  7. The `collapse` key is used for making a collapsible item on the Sidenav that has other routes
  inside (nested routes), you need to pass the nested routes inside an array as a value for the `collapse` key.
  8. The `route` key is used to store the route location which is used for the react router.
  9. The `href` key is used to store the external links location.
  10. The `title` key is only for the item with the type of `title` and its used for the title text on the Sidenav.
  10. The `component` key is used to store the component of its route.
*/

// Argon Dashboard 2 MUI layouts
import Dashboard from "layouts/dashboard";
import ManageAdmin from "layouts/manageadmin";
import SystemAdmin from "layouts/systemadmin";
import Billing from "layouts/reports";
import Profile from "layouts/profile";
import Callback from "layouts/authentication/callback";
import AuthorizeRedirect from "layouts/authentication/authorizeredirect";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";

const routes = [
  {
    type: "route",
    name: "screen.dashboard",
    key: "dashboard",
    route: "/dashboard",
    icon: <ArgonBox component="i" color="primary" fontSize="14px" className="ni ni-tv-2" />,
    component: <Dashboard />,
  },
  {
    type: "route",
    name: "screen.superManager",
    key: "systemAdmin",
    route: "/systemAdmin",
    icon: (
      <ArgonBox component="i" color="warning" fontSize="14px" className="ni ni-key-25" />
    ),
    component: <SystemAdmin />,
  },
  {
    type: "route",
    name: "screen.manager",
    key: "manageAdmin",
    route: "/manageAdmin",
    icon: (
      <ArgonBox component="i" color="warning" fontSize="14px" className="ni ni-settings" />
    ),
    component: <ManageAdmin />,
  },
  /*{
    type: "route",
    name: "screen.reports",
    key: "billing",
    route: "/billing",
    icon: <ArgonBox component="i" color="success" fontSize="14px" className="ni ni-credit-card" />,
    component: <Billing />,
  },*/
  { type: "title", title: "Account Pages", key: "account-pages" },
  {
    type: "route",
    name: "screen.profile",
    key: "profile",
    route: "/profile",
    icon: <ArgonBox component="i" color="dark" fontSize="14px" className="ni ni-single-02" />,
    component: <Profile />,
  },
  {
    type: "route",
    name: "Callback",
    key: "callback",
    route: "/authentication/callback",
    icon: <ArgonBox component="i" color="info" fontSize="14px" className="ni ni-collection" />,
    component: <Callback />,
  },
  {
    type: "route",
    name: "Authorize Redirect",
    key: "authorize-redirect",
    route: "/authentication/authorize",
    component: <AuthorizeRedirect />,
  }
];

export default routes;
