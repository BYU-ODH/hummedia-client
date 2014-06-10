'use strict';

angular.module('hummedia.services').
  factory('Subtitle', ['appConfig', '$http', '$q', 'SendFile', function(config, $http, $q, send_file){
    function Subtitle() {
     
      /**
       * Deletes the file at the given, full URL
       * @return promise Resolves when the web server returns favorably
       */
      this['delete'] = function(filepath) {
        var deferred = $q.defer();
        $http['delete'](filepath)
          .success( function(data){ deferred.resolve(data); } )
          .error( function(data){ deferred.reject(data); } );
        return deferred.promise;
      };

      /**
       * Replaces the file at the given location with the new file
       * @param new_file Blob the new file to upload to the server
       * @param filepath String the full URL of the file to replace
       * @param data An object with any additional form data to pass up
       *    {
       *      'name': ?, // the name of the subtitle
       *      'lang': ?  // the two-letter language code for the subtitle
       *    }
       * @return promise Resolves when the web server returns favorably
       */
      this.update = function(new_file, filepath, data) {
        return send_file(new_file, 'subtitle', data, 'PUT', filepath);
      }

      /**
       * Uploads a subtitle asynchronously to the given video.
       * @param file Blob the file to upload
       * @param pid String the identifier of the video
       * @param data An object with any additional form data to pass up
       *    {
       *      'name': ?, // the name of the subtitle
       *      'lang': ?  // the two-letter language code for the subtitle
       *    }
       * @return promise Resolves when the web server returns favorably
       */
      this.add = function(file, video_id, data) {
        var URL = config.apiBase + '/video/' + video_id;
        return send_file(file, 'subtitle', data, 'PATCH', URL);
      };
    };

    return new Subtitle();
}]);
