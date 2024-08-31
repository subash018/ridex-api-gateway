const jwt = require('jsonwebtoken');

module.exports = {
  version: '1.0.0',
  init: function (pluginContext) {
    pluginContext.registerPolicy({
      name: 'token-validator',
      policy: (actionParams) => {
        return (req, res, next) => {

          // Handle OPTIONS requests separately
          if (req.method === 'OPTIONS') {
            // console.log('Handling OPTIONS request');
            return next(); // Proceed to next for preflight requests
          }

          // Custom authorization logic here
          const authHeader = req.headers['authorization'];

          if (!authHeader) {
            console.error('Authorization header is missing');
            return res.status(401).json({ message: 'Unauthorized. Missing Authorization header' });
          }

          // Extract token from Authorization header
          const token = authHeader.match(/Bearer\s+(.+)/);
          if (!token) {
            console.error('Invalid token format in Authorization header');
            return res.status(401).json({ message: 'Unauthorized. Invalid token' });
          }

          // Decode JWT token
          let decoded;
          try {
            decoded = jwt.decode(token[1]);
            if (!decoded) {
              throw new Error('Token decoding failed');
            }
          } catch (err) {
            console.error(`Failed to decode token: ${err.message}`);
            return res.status(401).json({ message: 'Unauthorized. Failed to decode token' });
          }

          // Accessing claims in the JWT payload
          const claims = decoded;
          const userId = claims.sub; // Assuming 'sub' is the user ID
          const role = claims.role; // Assuming 'role' is a claim in your JWT payload
          const userLevel = claims.userLevel; // Assuming 'userLevel' is a claim in your JWT payload
          const roleType = claims.roleType; // Assuming 'roleType' is a claim in your JWT payload
          const uniqueId = claims.uniqueId; // Assuming 'uniqueId' is a claim in your JWT payload

          // Set the extracted values in the headers
          req.headers['x-user-id'] = userId || "";
          req.headers['x-user-level'] = userLevel || "";
          req.headers['x-tenant-id'] = uniqueId || "";
          req.headers['x-role'] = role || "";
          req.headers['x-role-type'] = roleType || "";

          // Dynamically set level IDs based on claims
          Object.keys(claims).forEach((key) => {
            const match = key.match(/^level_(\d+)_id$/);
            if (match) {
              req.headers[`x-level_${match[1]}_id`] = claims[key];
              // console.log(`Set header: x-level_${match[1]}_id=${claims[key]}`);
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
