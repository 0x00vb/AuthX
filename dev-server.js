/**
 * Development Server with Built-in SMTP Server
 * 
 * This script creates:
 * 1. A local SMTP server for development
 * 2. An Ethereal email account for testing
 * 3. Logs all emails with preview links
 */

const { SMTPServer } = require('smtp-server');
const nodemailer = require('nodemailer');
const path = require('path');
const AuthX = require('./src');
const express = require('express');
const cors = require('cors');
const memoryAdapter = require('./src/adapters/memory');

// Create Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Configure trust proxy more securely - only trust localhost
app.set('trust proxy', 'loopback');
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Store email credentials for frontend access
let emailCredentials = null;

// API endpoint to get email info
app.get('/api/email-info', (req, res) => {
  if (emailCredentials) {
    res.json(emailCredentials);
  } else {
    res.status(404).json({ error: 'Email credentials not available' });
  }
});

// Create Ethereal account for email testing
async function setupEtherealAccount() {
  try {
    console.log('Creating Ethereal test account...');
    const testAccount = await nodemailer.createTestAccount();
    
    // Store credentials for API access
    emailCredentials = {
      email: testAccount.user,
      password: testAccount.pass,
      host: testAccount.smtp.host
    };
    
    console.log('\n🔧 Email Testing Setup:');
    console.log('-----------------------');
    console.log('📧 Ethereal Email Account:');
    console.log(`- Email: ${testAccount.user}`);
    console.log(`- Password: ${testAccount.pass}`);
    console.log(`- View emails at: https://ethereal.email`);
    console.log('-----------------------\n');
    return testAccount;
  } catch (error) {
    console.error('Failed to create test account:', error);
    process.exit(1);
  }
}

// Create a local SMTP server for development
function setupLocalSMTPServer(ethAccount) {
  const smtpPort = 2525; // Changed from 8025 to avoid port conflicts
  
  // Create a local SMTP server
  const smtpServer = new SMTPServer({
    secure: false,
    authOptional: true,
    maxAllowedUnauthenticatedCommands: 1000,
    onData(stream, session, callback) {
      let emailData = '';
      stream.on('data', (chunk) => {
        emailData += chunk;
      });
      
      stream.on('end', async () => {
        console.log('\n📬 Email Received:');
        console.log('-----------------------');
        console.log('From Session:', session.envelope);
        
        // Send to Ethereal for viewing
        const transport = nodemailer.createTransport({
          host: ethAccount.smtp.host,
          port: ethAccount.smtp.port,
          secure: ethAccount.smtp.secure,
          auth: {
            user: ethAccount.user,
            pass: ethAccount.pass
          }
        });
        
        try {
          // Parse and forward the email to Ethereal
          const info = await transport.sendMail({
            from: session.envelope.mailFrom.address,
            to: session.envelope.rcptTo.map(rcpt => rcpt.address).join(', '),
            raw: emailData
          });
          
          console.log('📨 Email Preview URL:', nodemailer.getTestMessageUrl(info));
          console.log('-----------------------\n');
        } catch (err) {
          console.error('Failed to forward email to Ethereal:', err);
        }
        
        callback();
      });
    }
  });
  
  // Start the SMTP server
  smtpServer.listen(smtpPort, () => {
    console.log(`📭 SMTP Server running on localhost:${smtpPort}`);
    console.log(`   Use these SMTP settings in your app:`);
    console.log(`   - Host: localhost`);
    console.log(`   - Port: ${smtpPort}`);
    console.log(`   - User: (not required)`);
    console.log(`   - Password: (not required)`);
    console.log(`   - Secure: false`);
  });
  
  // Handle errors
  smtpServer.on('error', (err) => {
    console.error('SMTP Server error:', err);
  });
  
  return smtpPort;
}

// Create and configure AuthX
function setupAuthX(ethAccount) {
  return new AuthX({
    jwtOptions: {
      secret: 'development-secret-key',
      accessExpiresIn: '15m',
      refreshExpiresIn: '7d'
    },
    emailOptions: {
      from: 'noreply@development.local',
      transport: {
        host: ethAccount.smtp.host,
        port: ethAccount.smtp.port,
        secure: ethAccount.smtp.secure,
        auth: {
          user: ethAccount.user,
          pass: ethAccount.pass
        },
      },
      verificationUrl: 'http://localhost:3001/auth/verify-email',
      passwordResetUrl: 'http://localhost:3001/auth/reset-password'
    },
    passwordPolicy: {
      minLength: 8,
      requireLowercase: true,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },
    adapter: memoryAdapter(),
    baseUrl: '/api',
    useRefreshTokens: true,
    useSessionCookies: true,
    requireEmailVerification: true, // Enable email verification for testing
    enablePasswordReset: true,      // Enable password reset for testing
    cookieOptions: {
      secure: false,
      sameSite: 'lax'
    }
  });
}

// Serve static files for testing
function setupStaticFiles(app) {
  app.use(express.static(path.join(__dirname, 'test/public')));
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'test/views'));
  
  // Basic routes for testing UI
  app.get('/', (req, res) => {
    res.render('index');
  });
  
  app.get('/login', (req, res) => {
    res.render('login');
  });
  
  app.get('/register', (req, res) => {
    res.render('register');
  });
  
  app.get('/reset-password', (req, res) => {
    res.render('reset-password');
  });
  
  app.get('/verify-email', (req, res) => {
    res.render('verify-email');
  });
}

// Start everything
async function start() {
  try {
    // Setup email testing
    const ethAccount = await setupEtherealAccount();
    
    // Log email configuration info
    console.log('\n📧 Email Configuration:');
    console.log('-----------------------');
    console.log('Ethereal Email Test Account Created:');
    console.log(`- Email: ${ethAccount.user}`);
    console.log(`- Password: ${ethAccount.pass}`);
    console.log(`- SMTP Host: ${ethAccount.smtp.host}`);
    console.log(`- All verification emails will be visible at: https://ethereal.email/messages`);
    console.log(`- Login with the credentials above to view emails`);
    console.log('-----------------------\n');
    
    // Setup AuthX
    const authx = setupAuthX(ethAccount);
    
    // Initialize AuthX
    authx.init(app);
    
    // Debug: Print all routes
    console.log('\n📋 Registered API Routes:');
    console.log('-----------------------');
    try {
      // Use a simpler way to print routes
      const printRoute = (layer) => {
        if (!layer.route) return;
        
        const path = layer.route.path;
        const methods = Object.keys(layer.route.methods)
          .filter(method => layer.route.methods[method])
          .map(method => method.toUpperCase())
          .join(',');
          
        console.log(`${methods} ${path}`);
      };
      
      const printLayer = (path, layer) => {
        if (layer.route) {
          printRoute(layer);
        } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
          const routerPath = path + (layer.regexp.toString().replace(/^\/\^\\\//, '/').replace(/\\\/\?\(\?=\\\/\|\$\)\/i$/, ''));
          layer.handle.stack.forEach(stackItem => printLayer(routerPath, stackItem));
        }
      };
      
      if (app._router && app._router.stack) {
        app._router.stack.forEach(layer => printLayer('', layer));
        console.log(`API URL base path is configured as: ${authx.config.baseUrl}`);
      } else {
        console.log('No routes registered yet.');
      }
    } catch (error) {
      console.error('Error printing routes:', error);
    }
    console.log('-----------------------\n');
    
    // Setup static files
    setupStaticFiles(app);
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running at http://localhost:${PORT}`);
      console.log(`🔐 AuthX API endpoints available at http://localhost:${PORT}/api/auth`);
      console.log('📝 Available test pages:');
      console.log(`   - Home: http://localhost:${PORT}/`);
      console.log(`   - Register: http://localhost:${PORT}/register`);
      console.log(`   - Login: http://localhost:${PORT}/login`);
      console.log(`   - Reset Password: http://localhost:${PORT}/reset-password`);
      console.log(`   - Verify Email: http://localhost:${PORT}/verify-email`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Run the application
start(); 