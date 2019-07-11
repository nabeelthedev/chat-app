This is the source code of a chat app in development. CloudFormation is used to manage backend resources.

Working preview at [https://dev.dnqr.xyz](https://dev.dnqr.xyz)

## Authentication
Cognito handles JWT tokens and allows users to login with their existing Google account. A custom session system stores the JWT tokens on the backend and provides users with a session Id to perform actions. JWT tokens are never exposed to the client.

## Chat API
AppSync manages the core functionality (i.e. postMessage, listMessages) through GraphQL resolvers written in VTL.

## Client GUI
The client is a React web app.
