'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('hummedia.services', ['ngResource']).
  value('version', '0.1');
