The demo includes the following features:
User registration and login
Password reset flow
Role-based access control for three different roles
JWT authentication with refresh tokens
User management for admins
Role assignment and management
User profile management
PostgreSQL database support
To run the demo:
First, build the AuthX package:
Apply to index.ts
Run
Set up a PostgreSQL database named "authx_demo"
Copy the .env.example file to .env in the web-demo folder and update the database connection details if necessary
Install dependencies in the web-demo folder:
Apply to index.ts
Run
Start the web-demo application:
Apply to index.ts
Run
This will start both the React frontend and the Express backend with the AuthX package integration. You can access the application at http://localhost:3000 in your browser.
The demo allows you to:
Register a new account (default role: client)
Login with your credentials
Reset your password
View role-specific dashboards based on your assigned roles
If you have the admin role, manage users and their roles
This implementation provides a complete and clean-coded example of using the AuthX package with role-based access control.
