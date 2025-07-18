# 🔐 Example of a Webex Integration (OAuth flow) in Node.js

This project demonstrates how to create a Webex integration (OAuth client) to obtain a scoped API access token for the authenticating Webex user. This code accompanies the tutorial [Run a Webex OAuth Integration Locally](https://developer.webex.com/docs/run-an-oauth-integration) on the Webex [Developer Portal](https://developer.webex.com). See the tutorial for details about creating an integration and configuring this project.

![OAuth flow diagram](https://images.contentstack.io/v3/assets/bltd74e2c7e18c68b20/blt79c791c28d707a47/636c28e10b52047adbb942a7/brand_new_flow.png)

## ✨ Features

- **🔒 OAuth 2.0 Authorization** - Complete authorization code flow implementation
- **🎯 Token Management** - Secure access and refresh token handling with session storage
- **👤 User Authentication** - Obtain scoped access to user's Webex account
- **🏠 Room Listing** - Display user's Webex spaces with appropriate scopes
- **🛡️ State Validation** - CSRF protection with state parameter verification
- **⚠️ Error Handling** - Comprehensive error handling for all OAuth scenarios
- **🎨 Clean UI** - Simple, responsive web interface using Water.css
- **🔁 Session Management** - Express sessions with secure logout functionality

## 🚀 Quick Start

### Prerequisites

- Node.js 14.x or later
- npm or yarn package manager
- Webex Integration configured on [Developer Portal](https://developer.webex.com)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd webex-oauth-integration
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables:**
   
   Copy the `.env` file template and configure your integration settings:
   
   ```bash
   # Create .env file with your integration details
   AUTH_INIT_URL=https://webexapis.com/v1/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost:8080/oauth&scope=spark:all
   CLIENT_SECRET=your_client_secret_here
   STATE=your_random_state_string
   PORT=8080
   ```

4. **Start the server:**
   ```bash
   npm start
   # or
   yarn start
   ```

5. **Access the application:**
   - Open your browser to `http://localhost:8080`
   - Click "Start OAuth flow" to begin authentication
   - Complete the Webex authorization process

## 📖 Usage Guide

### OAuth Flow Process

1. **Initiate OAuth:**
   - User clicks "Start OAuth flow" on the home page
   - Application redirects to Webex authorization server
   - User grants permissions to your integration

2. **Authorization Callback:**
   - Webex redirects back to your application with authorization code
   - Application exchanges code for access token
   - User is authenticated and session is established

3. **API Access:**
   - Use the access token to make Webex API calls
   - Display user information and available spaces
   - Maintain session for continued access

### Available Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/` | GET | Home page with OAuth initiation link |
| `/index.html` | GET | Main application page (redirects based on auth status) |
| `/oauth` | GET | OAuth callback endpoint for authorization code |
| `/logout` | GET | Logout user and destroy session |
| `/listrooms` | GET | Display user's Webex spaces (requires auth) |

## 🏗️ Project Structure

```
webex-oauth-integration/
├── server.js               # Main Express application and OAuth logic
├── package.json            # Dependencies and scripts
├── .env                    # Environment variables (not in repo)
├── .gitignore              # Git ignore patterns
├── LICENSE                 # Cisco Sample Code License
├── README.md               # This documentation
└── www/                    # EJS templates and static files
    ├── index.ejs           # Home page template
    ├── display-name.ejs    # Authenticated user page
    ├── list-rooms.ejs      # Rooms listing template
    └── error.ejs           # Error page template
```

### Core Components

| Component | Description | File Location |
|-----------|-------------|---------------|
| **OAuth Handler** | Authorization code flow implementation | [`server.js`](server.js) lines 93-199 |
| **Token Exchange** | Authorization code to access token exchange | [`server.js`](server.js) lines 170-199 |
| **Session Management** | Express session configuration and handling | [`server.js`](server.js) lines 21-27 |
| **API Integration** | Webex API calls with access token | [`server.js`](server.js) lines 246-264 |
| **Error Handling** | OAuth error scenarios and user feedback | [`server.js`](server.js) lines 99-142 |

## 🔧 OAuth Implementation Details

### Authorization URL Construction

```javascript
// Build authorization URL from environment variables
const initiateURL = new URL(process.env.AUTH_INIT_URL);
var authUrlParams = initiateURL.searchParams;
const clientId = authUrlParams.get("client_id");
const redirectURI = authUrlParams.get("redirect_uri");
const scopes = authUrlParams.get("scope");

// Add state parameter for CSRF protection
const state = process.env.STATE || crypto.randomBytes(64).toString("hex");
authUrlParams.set("state", state);
```

### Token Exchange Process

```javascript
// Exchange authorization code for access token
const params = new URLSearchParams([
  ["grant_type", "authorization_code"],
  ["client_id", clientId],
  ["client_secret", clientSecret],
  ["code", req.query.code],
  ["redirect_uri", redirectURI],
]);

const response = await fetch("https://webexapis.com/v1/access_token", {
  method: "POST",
  headers: { "Content-type": "application/x-www-form-urlencoded" },
  body: params,
});

const data = await response.json();
// Store token in session for API calls
sess.token = data.access_token;
```

### API Integration Example

```javascript
// Make authenticated API call to get user info
async function getUserInfo(access_token, res) {
  const response = await fetch("https://webexapis.com/v1/people/me", {
    method: "GET",
    headers: { authorization: "Bearer " + access_token },
  });
  
  const data = await response.json();
  // Render template with user data
  const compiled = ejs.compile(template)({ displayName: data.displayName });
  res.send(compiled);
}
```

## 🎨 UI Templates

### EJS Template System

The application uses EJS templates for dynamic content rendering:

#### Home Page (`index.ejs`)
```html
<h1>Webex Integration example: Home</h1>
<a href="<%= link %>">Start OAuth flow</a>
```

#### Authenticated Page (`display-name.ejs`)
```html
<h1>Webex Integration example: Authenticated</h1>
<a href="/logout">Logout</a>
<p>So happy to meet, <%= displayName %>!</p>
```

#### Rooms List (`list-rooms.ejs`)
```html
<h1>Webex Integration example: Spaces List</h1>
<ul>
  <% rooms.forEach(function(room) { %>
    <li><%= room.title %></li>
  <% }); %>
</ul>
```

### Styling

The application uses [Water.css](https://watercss.kognise.dev/) for clean, minimal styling without custom CSS:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">
```

## ⚙️ Configuration

### Environment Variables

```bash
# Required OAuth settings
AUTH_INIT_URL=https://webexapis.com/v1/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost:8080/oauth&scope=spark:all
CLIENT_SECRET=your_integration_client_secret
STATE=random_string_for_csrf_protection
PORT=8080
```

### OAuth Scopes

The integration can request various scopes depending on your needs:

| Scope | Description | Usage |
|-------|-------------|-------|
| `spark:all` | Full access to user's Webex account | Complete integration access |
| `spark:people_read` | Read user profile information | User identification |
| `spark:rooms_read` | Read user's spaces/rooms | Room listing functionality |
| `spark:messages_read` | Read messages in spaces | Message access |
| `spark:messages_write` | Send messages to spaces | Message posting |

### Integration Configuration

1. **Create Integration:**
   - Visit [Webex Developer Portal](https://developer.webex.com/my-apps)
   - Click "Create a New App" → "Integration"
   - Configure redirect URI: `http://localhost:8080/oauth`

2. **Copy Credentials:**
   - Client ID and Client Secret from integration page
   - Construct AUTH_INIT_URL with your client ID and desired scopes

## 🛡️ Security Features

### State Parameter Validation

```javascript
// Generate cryptographically secure state parameter
const state = process.env.STATE || crypto.randomBytes(64).toString("hex");

// Validate state in callback to prevent CSRF attacks
if (state != req.query.state) {
  // Reject request - possible CSRF attack
  return res.send(errorTemplate);
}
```

### Session Security

```javascript
// Secure session configuration
app.use(session({
  secret: crypto.randomBytes(64).toString("hex"),  // Random session secret
  resave: false,                                   // Don't save unchanged sessions
  saveUninitialized: false,                        // Don't create sessions until needed
}));
```

### Error Handling

```javascript
// Comprehensive OAuth error handling
if (req.query.error) {
  switch(req.query.error) {
    case "access_denied":
      // User declined authorization
    case "invalid_scope":
      // Requested invalid scope
    case "server_error":
      // Webex server error
    default:
      // Handle unexpected errors
  }
}
```

## 🧪 Testing

### Manual Testing

1. **OAuth Flow Testing:**
   - Start application and initiate OAuth flow
   - Test with valid Webex account
   - Verify user information display
   - Test logout functionality

2. **Error Scenarios:**
   - Decline authorization and verify error handling
   - Test with invalid client credentials
   - Verify state parameter validation

3. **API Integration:**
   - Test user info retrieval
   - Verify rooms listing (if scope included)
   - Test session persistence

### Integration Testing

```javascript
// Test OAuth callback endpoint
app.get('/oauth', async function (req, res) {
  // Verify required parameters
  if (!req.query.code || !req.query.state) {
    return res.send(errorTemplate);
  }
  
  // Validate state parameter
  if (state != req.query.state) {
    return res.send(errorTemplate);
  }
  
  // Exchange code for token
  const tokenResponse = await exchangeCodeForToken(req.query.code);
  // Continue with user authentication...
});
```

## 🚨 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **Redirect URI Mismatch** | Ensure redirect URI in .env matches integration configuration |
| **Invalid Client** | Verify CLIENT_ID and CLIENT_SECRET are correct |
| **Invalid Scope** | Check that requested scopes are configured in your integration |
| **State Mismatch** | Ensure STATE parameter is consistent across requests |
| **Session Issues** | Clear browser cookies and restart application |

### Debug Mode

Enable debug logging to troubleshoot OAuth issues:

```javascript
// Add to server.js for detailed logging
const debug = require("debug")("oauth");
debug("OAuth flow initiated with client:", clientId);
debug("OAuth callback received:", req.query);
```

Run with debug output:
```bash
DEBUG=oauth npm start
```

### Common Error Messages

```javascript
// Error handling examples from the application
"User declined data access request"           // User clicked "Deny"
"Invalid scope requested"                     // Scope not configured in integration
"State does not match"                       // Possible CSRF attack
"Unexpected query parameters"                // Missing code or state parameters
```

## 📚 Documentation

### Tutorial Reference

This code accompanies the tutorial [Run a Webex OAuth Integration Locally](https://developer.webex.com/docs/run-an-oauth-integration) on the Webex [Developer Portal](https://developer.webex.com). See the tutorial for:

- Step-by-step integration creation
- Detailed configuration instructions
- OAuth flow explanation
- Production deployment considerations

### Additional Resources

- [Webex OAuth Guide](https://developer.webex.com/docs/oauth)
- [Webex Integration Documentation](https://developer.webex.com/docs/integrations)
- [Webex API Reference](https://developer.webex.com/docs/api/v1)
- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)

## 🤝 Contributing

We truly appreciate your contribution to the Webex Samples!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/oauth-enhancement`
3. Commit changes: `git commit -am 'Add OAuth feature'`
4. Push to branch: `git push origin feature/oauth-enhancement`
5. Submit a Pull Request

### Development Guidelines

- Follow OAuth 2.0 security best practices
- Implement comprehensive error handling
- Test with multiple OAuth scenarios
- Update documentation for new features
- Ensure environment variable security

## 📄 License

This project is licensed under the Cisco Sample Code License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For technical support and questions:

- **Issues**: Submit via GitHub Issues
- **OAuth Documentation**: [Webex OAuth Guide](https://developer.webex.com/docs/oauth)
- **Integration Support**: [Webex Developer Portal](https://developer.webex.com)
- **Community**: [Webex Developer Community](https://developer.webex.com/community)

## Thanks!

Made with ❤️ by the Webex Developer Relations Team at Cisco

---

**Note**: This integration is designed for learning and development purposes. For production use, implement additional security measures, proper error handling, and consider using a production-grade session store.
