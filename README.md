# Express Gateway Setup and Configuration

This guide provides instructions on how to set up and configure the Express Gateway as a replacement for KONG API Gateway for local development. The Express Gateway provides a lightweight, extensible solution for managing your API gateway needs.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14.x or higher)
- npm (v6.x or higher)

### Step 1: **Install Express Gateway**:
    - Ensure you have Node.js installed.
    - Install Express Gateway globally using npm:
    ```bash
    npm install -g express-gateway
    ```

### Step 2: **Create a new Express Gateway instance**:
    - Navigate to the directory where you want to create your gateway instance.
    - Use the `eg` command to create a new gateway:
    ```bash
    eg gateway create my-gateway
    ```
    - Follow the prompts to set up your gateway. This will generate the necessary files and folders.

## Project Structure

Here's the structure of the project for reference:
```
.
├── config
│   ├── gateway.config.yml
│   └── system.config.yml
├── plugins
│   └── token-validator
│       ├── index.js
│       └── schema.json
└── server.js
```

### Step 3: Install Express Gateway

Install other dependencies if required:

```bash
npm install jsonwebtoken
```

### Step 4: Set Up Configuration Files

Create or Update the necessary configuration files for Express Gateway.

#### `system.config.yml`

Update the `system.config.yml` file with:

```yaml
# config/system.config.yml
# Core
db:
  redis:
    emulate: true
    namespace: EG

plugins:
  token-validator:
    package: './plugins/token-validator'

crypto:
  cipherKey: sensitiveKey
  algorithm: aes256
  saltRounds: 10

# OAuth2 Settings
session:
  secret: keyboard cat
  resave: false
  saveUninitialized: false
accessTokens:
  timeToExpiry: 7200000
refreshTokens:
  timeToExpiry: 7200000
authorizationCodes:
  timeToExpiry: 300000

```

#### `gateway.config.yml`

Update the `gateway.config.yml` with:

```yaml
# config/gateway.config.yml
http:
  port: 8080

apiEndpoints:
  service1:
    host: '*'
    paths:
      - '/api/*'
  service2:
    host: '*'
    paths:
      - '/rest/*'

serviceEndpoints:
  service1:
    url: 'http://localhost:3000'
  service2:
    url: 'http://localhost:3001'

policies:
  - token-validator
  - proxy

pipelines:
  service1Pipeline:
    apiEndpoints:
      - service1
    policies:
      - token-validator: {}
      - proxy:
          - action:
              serviceEndpoint: service1
  service2Pipeline:
    apiEndpoints:
      - service2
    policies:
      - token-validator: {}
      - proxy:
          - action:
              serviceEndpoint: service2

```

### Step 5: Create the Token Validator Plugin

Set up the custom `token-validator` plugin.

#### `index.js`

Create a `plugins/token-validator` directory and add `index.js`:

```javascript
const jwt = require('jsonwebtoken');

module.exports = {
  version: '1.0.0',
  init: function (pluginContext) {
    pluginContext.registerPolicy({
      name: 'token-validator',
      policy: (actionParams) => {
        return (req, res, next) => {
          const authHeader = req.headers['authorization'];
          if (!authHeader) {
            return res.status(401).json({ message: 'Unauthorized. Missing Authorization header' });
          }

          const token = authHeader.match(/Bearer\s+(.+)/);
          if (!token) {
            return res.status(401).json({ message: 'Unauthorized. Invalid token' });
          }

          let decoded;
          try {
            decoded = jwt.decode(token[1]);
            if (!decoded) {
              throw new Error('Token decoding failed');
            }
          } catch (err) {
            return res.status(401).json({ message: 'Unauthorized. Failed to decode token' });
          }

          const claims = decoded;
          req.headers['x-user-id'] = claims.sub;
          req.headers['x-user-level'] = claims.userLevel;
          req.headers['x-tenant-id'] = claims.uniqueId;

          Object.keys(claims).forEach((key) => {
            const match = key.match(/^level_(\d+)_id$/);
            if (match) {
              req.headers[`x-level_${match[1]}_id`] = claims[key];
            }
          });

          next();
        };
      }
    });
  },
  policies: ['token-validator'],
  schema: {
    $id: 'http://express-gateway.io/schemas/policies/token-validator.json',
    type: 'object',
    properties: {},
    required: []
  }
};
```

#### `schema.json`

Add `schema.json` to the `plugins/token-validator` directory:

```json
{
  "$id": "http://express-gateway.io/schemas/policies/token-validator.json",
  "type": "object",
  "properties": {},
  "required": []
}
```

### Step 6: Create the Server File

Add `server.js` to the project root:

```javascript
const path = require('path');
const gateway = require('express-gateway');

gateway()
  .load(path.join(__dirname, 'config'))
  .run();
```

## Running the Gateway

To run the Express Gateway, execute the following commands in your terminal:

1. Install dependencies(Optional):
   ```bash
   npm install
   ```

2. Start the gateway:
   ```bash
   node server.js
   ```

Your Express Gateway should now be running on `http://localhost:8080`.

## Testing the Setup

You can test the gateway by sending requests to `http://localhost:8080`. Ensure you include a valid JWT token in the `Authorization` header as `Bearer <token>`.

```bash
curl -H "Authorization: Bearer <your_jwt_token>" http://localhost:8080
```

## Conclusion

This guide provides a basic setup for using the Express Gateway as an API gateway in local development. You can extend and customize it according to your needs. Happy coding!

For more information, visit the [Express Gateway documentation](https://www.express-gateway.io/docs/).