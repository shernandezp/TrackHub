## License

This project is licensed under the Apache 2.0 License. See the [LICENSE file](https://www.apache.org/licenses/LICENSE-2.0) for more information.

.ENV file:

REACT_APP_CLIENT_ID=web_client
REACT_APP_AUTHORIZATION_ENDPOINT=https://localhost/Identity/authorize
REACT_APP_TOKEN_ENDPOINT=https://localhost/Identity/token
REACT_APP_CALLBACK_ENDPOINT=http://localhost:3000/authentication/callback

Create local certificate
openssl req -nodes -new -x509 -keyout server.key -out server.cert
