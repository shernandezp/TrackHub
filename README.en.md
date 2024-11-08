## Components and Resources

| Component                | Description                                           | Documentation                                                                 |
|--------------------------|-------------------------------------------------------|-------------------------------------------------------------------------------|
| Argon Dashboard 2 MUI - v3.0.1             | Plantilla basada en React JS y MUI        | [Creative Tim Documentation](https://www.creative-tim.com/product/argon-dashboard-material-ui)                           |
| React JS 18.3.1               | Library for web and native user interfaces     | [React JS Documentation](https://react.dev/) |

# TrackHub Application Overview

TrackHub Application is a web client developed with React, based on the Argon template by [Tim Creative](https://www.creative-tim.com/). This client serves as the user interface for TrackHub Services, allowing users to manage various system aspects such as accounts, operators, devices, carriers, users, and permissions. Additionally, it provides tools for real-time geographical data visualization, such as the location of GPS devices, with corresponding labeling.

---

## Login Page
*The authentication flow is initiated by the login page, which points to the Authority Server of TrackHub as the authentication method for the web client.* 

![Image](https://github.com/shernandezp/TrackHub/tree/main/src/assets/images/login.png)

---

## Main Dashboard
*Once logged in, users are presented with the main dashboard, which includes a map displaying real-time data related to device locations and other geographical information. This web client communicates with TrackHub services using GraphQL endpoints for efficient querying and manipulation of data*

![Image](https://github.com/shernandezp/TrackHub/tree/main/src/assets/images/dashboard.png)

---

## Settings Management Screen
*The settings screen allows administrators to manage system data, such as user accounts, permissions, and operator settings.*

![Image](https://github.com/shernandezp/TrackHub/tree/main/src/assets/images/manage.png)

---

## Main Layers:

1. **Reusable UI Components (components)**  
   The components directory contains reusable UI components used throughout the application. These components are designed to be modular and can be easily integrated into different parts of the application.

2. **Global State Management with Context API (context)**  
   The context directory contains context providers that manage the global state across the application. Context providers are used to share state and functions between components without manually passing props down at each level. The Context API helps to avoid "prop drilling," especially in larger applications, improving maintainability and scalability.

3. **Custom Controls and Specific UI (controls)**  
   The controls directory contains custom controls and UI elements specific to the application's requirements. These controls are built on top of the base components and provide additional functionality and styling.

4. **Data Management and Transformation (data)**  
   The data directory contains files related to data, including mock data, data models, and data transformation functions. This layer is responsible for managing the application's data and ensuring it is in the correct format for use by the components.

5. **Layout Structure and Organization (layout)**  
   The layouts directory contains layout components that define the structure and organization of different sections of the application. Layout components are used to create consistent layouts and navigation across the application.

6. **Multi-language Support (locales)**  
   The locales directory contains localization files that provide support for multiple languages. This layer is responsible for managing translations and ensuring the application can be used in different languages.

7. **Business Services and API Calls (services)**  
   The services directory contains service files that handle data fetching and business logic. Services are responsible for making API calls, processing data, and providing functions that can be used by components and context providers.

8. **Utility Functions for the Application (utils)**  
   The utils directory contains utility functions that provide common functionality used throughout the application. These functions are designed to be reusable and can be easily integrated into different parts of the application.

---

## Environment Variables

The `.env` file contains the following environment variables used in the application:

- **`GENERATE_SOURCEMAP=false`**  
  Disables the generation of source maps in the production build. Source maps are typically used for debugging, but disabling them can improve performance in production environments.

- **`REACT_APP_CLIENT_ID=web_client`**  
  Defines the client ID for the web client application. This value is used for authentication and identification during API calls and user login.

- **`REACT_APP_AUTHORIZATION_ENDPOINT=https://localhost/Identity/authorize`**  
  Specifies the endpoint for user authorization. This URL is used during the authentication process when the client requests a token.

- **`REACT_APP_TOKEN_ENDPOINT=https://localhost/Identity/token`**  
  Defines the endpoint to exchange an authorization code for an access token. This URL is used by the client to request an OAuth token after successful user authorization.

- **`REACT_APP_CALLBACK_ENDPOINT=https://localhost:3000/authentication/callback`**  
  Specifies the callback URL where the authentication provider will redirect the user after successful login. This is where the access token will be sent.

- **`REACT_APP_REVOKE_TOKEN_ENDPOINT=https://localhost/Identity/revoke`**  
  Defines the endpoint used to revoke an access token. This is typically used during logout or when the token is no longer needed.

- **`REACT_APP_LOGOUT_ENDPOINT=https://localhost/Identity/logout`**  
  Specifies the logout endpoint. This URL is used to log the user out and terminate the active session with the authentication provider.

- **`REACT_APP_MANAGER_ENDPOINT=https://localhost/Manager/graphql`**  
  Defines the GraphQL endpoint for managing the application. This endpoint is used to interact with the backend system for administrative functions like managing users, devices, and services.

- **`REACT_APP_ROUTER_ENDPOINT=https://localhost/Router/graphql`**  
  Specifies the GraphQL endpoint for routing-related tasks. It handles the routing and location data, enabling interaction with GPS and mapping services.

- **`REACT_APP_SECURITY_ENDPOINT=https://localhost/Security/graphql`**  
  Defines the GraphQL endpoint for security-related operations, such as authentication, access control, and securing resources within the application.

These environment variables are critical for configuring various aspects of the application, including authentication, API calls, and system management.

---

## Create Local Development Certificate  
To allow a secure connection during local development, it is necessary to create an SSL certificate for the server. You can generate a self-signed certificate using OpenSSL with the following command.

```bash
openssl req -nodes -new -x509 -keyout server.key -out server.cert
```

## Notes  
While TrackHub's goal is to standardize and simplify the code to unify different monitoring providers (operators), its setup, deployment, and maintenance require an intermediate to advanced knowledge of .NET Core and React. Ideally, in the future, detailed deployment and configuration instructions will be included, but this is not the case at the moment.

Not only for this application but for all services in general, the code includes passwords, certificates, environment variables, and some secrets. This information is provided to facilitate and speed up the setup of a new development environment. However, all these configurations and secrets must be properly managed in production environments.

## Upcoming Features:

- **Docker Setup**: The application will include Docker support, allowing for consistent environments across development, testing, and production. This will be achieved through a Dockerfile to containerize the app and Docker Compose for orchestrating multi-container environments, which simplifies deployment and scalability.
  
- **Position Report**: A tool to generate detailed reports of device locations and history in real-time.

- **Basic Report Export**: Functionality to export data and reports in formats like CSV or PDF.

- **Geofence Management**: The application will include functionality to define virtual boundaries (geofences) around specific locations. Alerts or actions can be triggered when devices enter or exit these geofences, enabling automated responses based on real-time location data.

- **Additional Operator Integration**: Expanding the capability to integrate more operators or monitoring service providers.


## License

This project is licensed under the Apache 2.0 License. See the [LICENSE file](https://www.apache.org/licenses/LICENSE-2.0) for more information.