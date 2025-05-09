const express = require('express');
const app = express();
const AuthX = require('./src');

// Initialize AuthX
const authx = new AuthX({
  jwtOptions: {
    secret: 'development-secret-key',
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d'
  },
  adapter: require('./src/adapters/memory')(),
  baseUrl: '/api/auth',
  useRefreshTokens: true,
  useSessionCookies: true,
});

// Initialize and get routes
authx.init(app);

// Function to print all registered routes
function printRoutes(app) {
  function print(path, layer) {
    if (layer.route) {
      layer.route.stack.forEach(print.bind(null, path));
    } else if (layer.name === 'router' && layer.handle.stack) {
      layer.handle.stack.forEach(print.bind(null, path + layer.regexp.source.replace('^\\/','').replace('\\/?(?=\\/|$)','').replace(/\\\//g, '/')));
    } else if (layer.method) {
      console.log('%s %s', layer.method.toUpperCase(), path + layer.regexp.source.replace('^\\/','').replace('\\/?(?=\\/|$)','').replace(/\\\//g, '/'));
    }
  }

  app._router.stack.forEach(print.bind(null, ''));
}

// Print all routes
printRoutes(app);

console.log("\nAuthX baseUrl:", '/api/auth'); 