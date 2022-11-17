/*
 * A Webex Integration based on Node.js that initiates an OAuth authorization
 * to finally obtain an API access to make Webex REST API calls on the authenticating user's behalf.
 * 
 * See the [accompanying tutorial](https://developer.webex.com/docs/run-an-oauth-integration) on the 
 * Webex Developer Portal for instructions for how to configure and run the project.
 */

require("dotenv").config();
const debug = require("debug")("oauth");
const fetch = require("node-fetch");
const express = require("express");
var session = require("express-session");
const app = express();
const crypto = require("crypto");

// Session variable that contains API access token
var ssn;

// Enable session middleware for storing API access tokens
app.use(
  session({
    secret: crypto.randomBytes(64).toString("hex"),
    resave: false,
    saveUninitialized: false,
  })
);

// Create the authorization URL that opens when the user clicks
// 'Start Login'. The base URL is copied from your integration's configuration page
// on the Developer Portal and added to .env as an envioronment variable.

// The following code concatenates the base URL with a
// value for the `state` parameter at the end of the URL.

const initiateURL = new URL(process.env.AUTH_INIT_URL);
var authUrlParams = initiateURL.searchParams;
const clientId = authUrlParams.get("client_id");
const redirectURI = authUrlParams.get("redirect_uri");
const scopes = authUrlParams.get("scope");

// Extract client ID, redirect URI, and scopes from authorization URL
// Set new value for initial URL's 'state` query parameter
const state = process.env.STATE || crypto.randomBytes(64).toString("hex");
authUrlParams.set("state", state);
initiateURL.searchParams = authUrlParams;

// Read client secret and port number from environment
const clientSecret = process.env.CLIENT_SECRET;
const port = process.env.PORT || 8080;

// Output Oauth client settings to console
//
debug(
  `OAuth integration settings:\n - CLIENT_ID : ${clientId}\n - REDIRECT_URI : ${redirectURI}\n - SCOPES : ${scopes}`
);

// Compile initiateURL into index.ejs template, which contains a placeholder
// named `link` for the URL.
//
const read = require("fs").readFileSync;
const join = require("path").join;
const str = read(join(__dirname, "/www/index.ejs"), "utf8");
const ejs = require("ejs");
const compiled = ejs.compile(str)({ link: initiateURL }); // inject the link into the template

// Express routes
app.get("/index.html", function (req, res) {
  // Check if the session contain a token. If so, redirect to the compiled display-name.ejs template.
  var token = req.session.token;
  if (token != undefined) {
    // Token available in session, show user welcome page.
    getUserInfo(token, res);
    return;
  } else {
    console.log(
      "Access token not in session variable, redirecting to home page"
    );
  }
  debug("Serving the www/index.ejs template.");
  res.send(compiled);
});

app.get("/", function (req, res) {
  res.redirect("/index.html");
});

// Route for redirect URI requested by the Webex OAuth service that contains
// he  authorization code as a query parameter. The integration exchanges this
// code for an access token.
// If the exchange succeeds then the compiled display-name.ejs template is returned to the user.
//
app.get("/oauth", async function (req, res) {
  debug("OAuth redirect URL requested.");

  // Check for errors returned by the Webex OAuth service

  // User declined access to their data.
  if (req.query.error) {
    if (req.query.error == "access_denied") {
      debug("User declined, received err: " + req.query.error);
      const str = read(join(__dirname, "/www/error.ejs"), "utf8");
      const compiled = ejs.compile(str)({
        error_desc:
          "OAuth Integration could not complete. User declined data access request, bye.",
      });
      res.send(compiled);
      return;
    }

    // Invalid scope
    if (req.query.error == "invalid_scope") {
      debug("Wrong scope requested, received err: " + req.query.error);
      const str = read(join(__dirname, "/www/error.ejs"), "utf8");
      const compiled = ejs.compile(str)({
        error_desc:
          "OAuth Integration could not complete. The application requested an invalid scope. Make sure your Integration contains all scopes being requested by the app, bye.",
      });
      res.send(compiled);

      return;
    }

    // Server error
    if (req.query.error == "server_error") {
      debug("Server error, received err: " + req.query.error);
      const compiled = ejs.compile(str)({
        error_desc:
          "OAuth Integration could not complete. Webex sent a server error, bye.",
      });
      res.send(compiled);
      return;
    }

    debug("Received err: " + req.query.error);
    const compiled = ejs.compile(str)({
      error_desc:
        "OAuth Integration could not complete. Error case not implemented, bye.",
    });
    res.send(compiled);
    return;
  }

  // Check request parameters correspond to the specification
  //
  if (!req.query.code || !req.query.state) {
    debug("expected code & state query parameters are not present");
    const compiled = ejs.compile(str)({
      error_desc:
        "OAuth Integration could not complete. Unexpected query parameters, ignoring...",
    });
    res.send(compiled);
    return;
  }

  // If the state query variable does not match the original values, the process fails.
  //
  if (state != req.query.state) {
    debug("State does not match");
    const compiled = ejs.compile(str)({
      error_desc:
        "OAuth Integration could not complete</h1><p>State in response does does not match the one in the request, aborting...",
    });
    res.send(compiled);
    return;
  }

  // Retrieve access token (expires in 14 days) & refresh token (expires in 90 days)
  //
  var access_token_url = "https://webexapis.com/v1/access_token";

  const params = new URLSearchParams([
    ["grant_type", "authorization_code"],
    ["client_id", clientId],
    ["client_secret", clientSecret],
    ["code", req.query.code],
    ["redirect_uri", redirectURI],
  ]);

  const options = {
    method: "POST",
    headers: {
      "Content-type": "application/x-www-form-urlencoded",
    },
    body: params,
  };

  const response = await fetch(access_token_url, options);
  const data = await response.json();

  debug("OAuth flow completed, fetched tokens: " + JSON.stringify(data));

  // Store token in session variable for later use
  sess = req.session;
  sess.token = data.access_token;

  // OAuth flow has completed, return page displaying user's name.
  getUserInfo(data.access_token, res);
});

// Route to log out current user and destroy the session.
//
app.get("/logout", function (req, res) {
  const rootURL = redirectURI.substring(0, redirectURI.length - 5);
  console.log(`rootURL is ${rootURL}`);
  res.redirect(
    "https://idbroker.webex.com/idb/oauth2/v1/logout?token=" + req.session.token
  );
  req.session.destroy();
});

// Returns a list of the users's rooms (spaces). Requires that the access token include the `spark:rooms_read` scope.
// Uses the session's existing API token, if one exists, otherwise the user is redirected to the home page.
//
app.get("/listrooms", async function (req, res) {
  
  var token = req.session.token;
  if (token == undefined) {
    console.log(
      "Access token not in session variable, redirecting to home page."
    );
    res.redirect("/");
  }
  
  var listRoomsURL = "https://webexapis.com/v1/rooms";

  const options = {
    method: "GET",
    headers: {
      authorization: "Bearer " + token,
    },
  };

  const response = await fetch(listRoomsURL, options);
  const data = await response.json();
  
  // Compile EJS template with list of rooms and return to user.
  const str = read(join(__dirname, "/www/list-rooms.ejs"), "utf8");
  const compiled = ejs.compile(str)({ rooms: data.items });
  res.send(compiled);
});

// Make an Webex REST API call using the API access token, and
// return a page that includes the user's Webex display name.
//
async function getUserInfo(access_token, res) {
  // Configure HTTP request options
  var peopleApiUrl = "https://webexapis.com/v1/people/me";
  const options = {
    method: "GET",
    headers: {
      authorization: "Bearer " + access_token,
    },
  };

  // Make API request and await response
  //
  const response = await fetch(peopleApiUrl, options);
  const data = await response.json();

  const str = read(join(__dirname, "/www/display-name.ejs"), "utf8");
  const compiled = ejs.compile(str)({ displayName: data.displayName });
  res.send(compiled);
}

// Statically serve the "/www" directory
//
const path = require("path");
app.use("/", express.static(path.join(__dirname, "www")));



// Start the Express app
app.listen(port, function () {
  console.log(`Webex OAuth Integration started on http://localhost:${port}`);
});
