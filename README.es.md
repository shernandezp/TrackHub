## Componentes y Recursos Utilizados

| Componente                | Descripción                                             | Documentación                                                                 |
|---------------------------|---------------------------------------------------------|-------------------------------------------------------------------------------|
| Argon Dashboard 2 MUI - v3.0.1             | Plantilla basada en React JS y MUI        | [Documentación Creative Tim](https://www.creative-tim.com/product/argon-dashboard-material-ui)                           |
| React JS 18.3.1               | Biblioteca para interfaces de usuario nativas y web     | [Documentación React JS](https://react.dev/) |


# Descripción general de la aplicación TrackHub

La aplicación TrackHub es un cliente web desarrollado con React, basado en la plantilla Argon de [Creative Tim](https://www.creative-tim.com/). Este cliente sirve como la interfaz de usuario para los servicios de TrackHub, permitiendo a los usuarios gestionar varios aspectos del sistema, como cuentas, operadores, dispositivos, transportistas, usuarios y permisos. Además, proporciona herramientas para la visualización de datos geográficos en tiempo real, como la ubicación de dispositivos GPS, con las etiquetas correspondientes.

---

## Página de inicio de sesión
*El flujo de autenticación se inicia en la página de inicio de sesión, que apunta al Servidor de Autoridad de TrackHub como el método de autenticación para el cliente web.* 

![Image](https://github.com/shernandezp/TrackHub/blob/main/src/assets/images/login.png?raw=true)

---

## Panel principal
*Una vez iniciada la sesión, los usuarios se presentan con el panel principal, que incluye un mapa que muestra datos en tiempo real relacionados con la ubicación de los dispositivos y otra información geográfica. Este cliente web se comunica con los servicios de TrackHub utilizando endpoints de GraphQL para realizar consultas y manipular datos de manera eficiente.*

![Image](https://github.com/shernandezp/TrackHub/blob/main/src/assets/images/dashboard.png?raw=true)
![Image](https://github.com/shernandezp/TrackHub/blob/main/src/assets/images/trips.png?raw=true)

---

## Geocercas
*TrackHub permite crear, actualizar y eliminar geocercas para monitorear las unidades en función de su ubicación geográfica.*

![Image](https://github.com/shernandezp/TrackHub/blob/main/src/assets/images/geofence.png?raw=true)

---

## Pantalla de gestión de configuración
*La pantalla de configuración permite a los administradores gestionar los datos del sistema, como cuentas de usuario, permisos y configuraciones de operadores.*

![Image](https://github.com/shernandezp/TrackHub/blob/main/src/assets/images/manage.png?raw=true)

---

## Informes
*Exportación de datos de unidades en formato Excel.*

![Image](https://github.com/shernandezp/TrackHub/blob/main/src/assets/images/reports.png?raw=true)

---

## REST API
*Para facilitar la integración con terceros, TrackHub proporciona una API REST con métodos para recuperar información de las unidades. Esta API utiliza el Router API como middleware para acceder a los datos de ubicación GPS de todas las unidades.*

![Image](https://github.com/shernandezp/TrackHub/blob/main/src/assets/images/api.png?raw=true)

---

## Capas principales:

1. **Componentes reutilizables de UI (components)**  
   El directorio de componentes contiene componentes reutilizables de UI utilizados en toda la aplicación. Estos componentes están diseñados para ser modulares y se pueden integrar fácilmente en diferentes partes de la aplicación.

2. **Gestión global de estado con Context API (context)**  
   El directorio de contexto contiene proveedores de contexto que gestionan el estado global en toda la aplicación. Los proveedores de contexto se usan para compartir estado y funciones entre los componentes sin pasar manualmente las propiedades en cada nivel. La API de Contexto ayuda a evitar el "prop drilling", especialmente en aplicaciones más grandes, mejorando la mantenibilidad y escalabilidad.

3. **Controles personalizados y UI específica (controls)**  
   El directorio de controles contiene controles personalizados y elementos de UI específicos para los requisitos de la aplicación. Estos controles se construyen sobre los componentes base y proporcionan funcionalidades y estilos adicionales.

4. **Gestión y transformación de datos (data)**  
   El directorio de datos contiene archivos relacionados con datos, incluidos datos simulados, modelos de datos y funciones de transformación de datos. Esta capa es responsable de gestionar los datos de la aplicación y asegurarse de que estén en el formato adecuado para su uso por los componentes.

5. **Estructura y organización de diseño (layouts)**  
   El directorio de layouts contiene componentes de diseño que definen la estructura y organización de diferentes secciones de la aplicación. Los componentes de diseño se utilizan para crear layouts consistentes y navegación a través de la aplicación.

6. **Soporte multilingüe (locales)**  
   El directorio de locales contiene archivos de localización que proporcionan soporte para varios idiomas. Esta capa es responsable de gestionar las traducciones y garantizar que la aplicación pueda ser utilizada en diferentes idiomas.

7. **Servicios de negocio y llamadas a la API (services)**  
   El directorio de servicios contiene archivos de servicio que gestionan la obtención de datos y la lógica de negocio. Los servicios son responsables de realizar llamadas a la API, procesar datos y proporcionar funciones que puedan ser utilizadas por los componentes y proveedores de contexto.

8. **Funciones utilitarias para la aplicación util**  
   El directorio de utilidades contiene funciones utilitarias que proporcionan funcionalidad común utilizada en toda la aplicación. Estas funciones están diseñadas para ser reutilizables y se pueden integrar fácilmente en diferentes partes de la aplicación.

---

## Variables de entorno

El archivo `.env` contiene las siguientes variables de entorno utilizadas en la aplicación:

- **`GENERATE_SOURCEMAP=false`**  
  Desactiva la generación de mapas de origen en la compilación de producción. Los mapas de origen se utilizan normalmente para depurar, pero desactivarlos puede mejorar el rendimiento en entornos de producción.

- **`REACT_APP_DEFAULT_LAT=4.624335`**  
- **`REACT_APP_DEFAULT_LNG=-74.063644`**  
  Estas dos variables definen el centro predeterminado del mapa en caso de que el usuario deniegue los permisos de ubicación en el navegador.

- **`REACT_APP_CLIENT_ID=web_client`**  
  Define el ID de cliente para la aplicación web. Este valor se utiliza para la autenticación e identificación durante las llamadas a la API y el inicio de sesión del usuario.

- **`REACT_APP_AUTHORIZATION_ENDPOINT=https://localhost/Identity/authorize`**  
  Especifica el punto final para la autorización del usuario. Esta URL se utiliza durante el proceso de autenticación cuando el cliente solicita un token.

- **`REACT_APP_TOKEN_ENDPOINT=https://localhost/Identity/token`**  
  Define el punto final para intercambiar un código de autorización por un token de acceso. Esta URL es utilizada por el cliente para solicitar un token OAuth después de una autorización exitosa del usuario.

- **`REACT_APP_CALLBACK_ENDPOINT=https://localhost:3000/authentication/callback`**  
  Especifica la URL de devolución de llamada a donde el proveedor de autenticación redirigirá al usuario después de un inicio de sesión exitoso. Aquí es donde se enviará el token de acceso.

- **`REACT_APP_REVOKE_TOKEN_ENDPOINT=https://localhost/Identity/revoke`**  
  Define el punto final utilizado para revocar un token de acceso. Esto se utiliza típicamente durante el cierre de sesión o cuando el token ya no es necesario.

- **`REACT_APP_LOGOUT_ENDPOINT=https://localhost/Identity/logout`**  
  Especifica el punto final de cierre de sesión. Esta URL se utiliza para cerrar la sesión del usuario y terminar la sesión activa con el proveedor de autenticación.

- **`REACT_APP_MANAGER_ENDPOINT=https://localhost/Manager/graphql`**  
  Define el punto final de GraphQL para gestionar la aplicación. Este punto final se utiliza para interactuar con el sistema backend para funciones administrativas como gestionar usuarios, dispositivos y servicios.

- **`REACT_APP_ROUTER_ENDPOINT=https://localhost/Router/graphql`**  
  Especifica el punto final de GraphQL para tareas relacionadas con el enrutamiento. Maneja los datos de enrutamiento y ubicación, permitiendo la interacción con los servicios de GPS y mapeo.

- **`REACT_APP_SECURITY_ENDPOINT=https://localhost/Security/graphql`**  
  Define el punto final de GraphQL para operaciones relacionadas con la seguridad, como la autenticación, el control de acceso y la protección de recursos dentro de la aplicación.

- **`REACT_APP_GEOFENCING_ENDPOINT=https://localhost/Geofence/graphql`**  
  Especifica el endpoint GraphQL para operaciones de geocercas. Se usa para gestionar geocercas dentro del sistema.

- **`REACT_APP_REPORTING_ENDPOINT=https://localhost/Reporting/`**  
  Define el endpoint REST para operaciones de generación de informes. Este endpoint recupera archivos de Excel en formato binario según la solicitud del usuario.

Estas variables de entorno son críticas para configurar varios aspectos de la aplicación, incluyendo la autenticación, las llamadas a la API y la gestión del sistema.

---

## Crear certificado de desarrollo local  
Para permitir una conexión segura durante el desarrollo local, es necesario crear un certificado SSL para el servidor. Puedes generar un certificado autofirmado usando OpenSSL con el siguiente comando.

```bash
openssl req -nodes -new -x509 -keyout server.key -out server.cert
```

## Notas  
Aunque el objetivo de TrackHub es estandarizar y simplificar el código para unificar diferentes proveedores de monitoreo (operadores), su configuración, despliegue y mantenimiento requieren conocimientos intermedios a avanzados de .NET Core y React.

No solo para esta aplicación, sino para todos los servicios en general, el código incluye contraseñas, certificados, variables de entorno y algunos secretos. Esta información se proporciona para facilitar y acelerar la configuración de un nuevo entorno de desarrollo. Sin embargo, todas estas configuraciones y secretos deben ser gestionados adecuadamente en los entornos de producción.

---

## Funciones próximas:

- **Reporte de Alarmas**: Incluir un método en el componente Router para consulta de alarmas estándar. 

- **Integración adicional de operadores**: Ampliación de la capacidad para integrar más operadores o proveedores de servicios de monitoreo.

## Licencia

Este proyecto está bajo la Licencia Apache 2.0. Consulta el archivo [LICENSE](https://www.apache.org/licenses/LICENSE-2.0) para más información.