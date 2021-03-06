'use strict';

/**
 * Module dependencies
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Restoration Stations Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin', 'team lead'],
    allows: [{
      resources: '/api/restoration-stations',
      permissions: '*'
    }, {
      resources: '/api/restoration-stations/:stationId/upload-image',
      permissions: '*'
    }, {
      resources: '/api/restoration-stations/:stationId',
      permissions: '*'
    }]
  }, {
    roles: ['user', 'team member', 'partner', 'team lead pending', 'team member pending'],
    allows: [{
      resources: '/api/restoration-stations',
      permissions: ['get']
    }, {
      resources: '/api/restoration-stations/:stationId',
      permissions: ['get']
    }]
  }]);
};

/**
 * Check If Restoration Stations Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  // Check for user roles
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) {
      // An authorization error occurred
      return res.status(500).send('Unexpected authorization error');
    } else {
      if (isAllowed) {
        // Access granted! Invoke next middleware
        return next();
      } else {
        return res.status(403).json({
          message: 'User is not authorized'
        });
      }
    }
  });
};
