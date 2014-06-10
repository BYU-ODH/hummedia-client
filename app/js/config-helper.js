/**
  Contains configuration data for connecting to the API.
  
  WARNING: Do not modify this file directly. Copy CONFIG.default.js
           into CONFIG.js and modify its contents.
**/
'use strict';

angular.module('hummedia.config', []).
  factory('appConfig', function() {
    var c = window.HUMMEDIA_GLOBALS;
    return {
      apiBase: c.apiBase,
      flickrKey: c.flickrKey,
      googleAnalyticsKey: c.googleAnalyticsKey,
      googleKey: c.googleKey,
      debugMode: c.debugMode,
      dictionary: c.dictionary
    };
  });
