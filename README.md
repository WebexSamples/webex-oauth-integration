# Example of Webex Integration (OAuth flow) in Node.js

This project demonstrates how to create an Webex integration (OAuth client) to obtain
a scoped API access token for the authenticating Webex user. This code accompanies the tutorial [Run a Webex OAuth Integration Locally](https://developer.webex.com/docs/run-an-oauth-integration) on the Webex [Developer Portal](https://developer.webex.com). See the tutorial for details about creating an integration and configuring this project, or see the [quick start](#quick-start).

![OAuth flow diagram](https://images.contentstack.io/v3/assets/bltd74e2c7e18c68b20/blt79c791c28d707a47/636c28e10b52047adbb942a7/brand_new_flow.png)

## Quick Start

1. Clone this repository.

    ```plaintext
    git clone git@github.com:WebexSamples/webex-oauth-integration.git
    ```

2. Create a new [Webex integration](https://developer.webex.com/my-apps/new/integration) with the following settings:

    * Scopes: **spark:people_read**
    * Redirect URI: **http://localhost:8080/oauth**
