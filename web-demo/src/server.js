const express = require('express');
const cors = require('cors');
const { AuthX } = require('../../dist');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Initialize AuthX with PostgreSQL
const authX = new AuthX({
  dbType: 'postgres',
  dbUri: process.env.DB_URI || 'postgresql://postgres:Valentino@localhost:5432/authx_demo',
  jwtSecret: process.env.JWT_SECRET || 'authx-demo-jwt-secret',
  jwtExpiresIn: '1h',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'authx-demo-refresh-secret',
  refreshTokenExpiresIn: '7d',
  // Add our three custom roles
  roles: ['client', 'mechanic', 'admin'],
  defaultRole: 'client'
});

// Register AuthX routes
app.use('/api/auth', authX.getRouter());

// Protected routes examples
app.get('/api/client-area', 
  authX.middleware.authenticate(),
  authX.middleware.hasRole('client'),
  (req, res) => {
    res.json({ message: 'Client area accessed successfully', user: req.user });
  }
);

app.get('/api/mechanic-area', 
  authX.middleware.authenticate(),
  authX.middleware.hasRole('mechanic'),
  (req, res) => {
    res.json({ message: 'Mechanic area accessed successfully', user: req.user });
  }
);

app.get('/api/admin-area', 
  authX.middleware.authenticate(),
  authX.middleware.hasRole('admin'),
  (req, res) => {
    res.json({ message: 'Admin area accessed successfully', user: req.user });
  }
);

// Role management endpoints (admin only)
app.post('/api/assign-role', 
  authX.middleware.authenticate(),
  authX.middleware.hasRole('admin'),
  async (req, res) => {
    try {
      const { userId, role } = req.body;
      if (!userId || !role) {
        return res.status(400).json({ message: 'User ID and role are required' });
      }
      
      const dbAdapter = authX.getConfig().dbAdapter;
      await dbAdapter.assignRoleToUser(userId, role);
      res.json({ message: `Role '${role}' assigned to user successfully` });
    } catch (error) {
      res.status(500).json({ message: 'Failed to assign role', error: error.message });
    }
  }
);

// Custom endpoint to get all users (admin only)
app.get('/api/users', 
  authX.middleware.authenticate(),
  authX.middleware.hasRole('admin'),
  async (req, res) => {
    try {
      const dbAdapter = authX.getConfig().dbAdapter;
      const users = await dbAdapter.findAllUsers();
      res.json({ users });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
  }
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 