HUMMEDIA_SERVICES
    /**
     * Allows the user to upload files asynchronously
     */
    .service('SendFile', ['$q',function($q){
      return function send_file(file, file_field, data, method, url) {
        var deferred = $q.defer(),
          formdata = new FormData(),
          request  = new XMLHttpRequest();

        if(file instanceof FileList) {
          for(var i = 0; i<file.length; i++) {
            formdata.append(file_field, file[i]);
          }
        }
        else
        {
          formdata.append(file_field, file);
        }

        Object.keys(data).forEach(function(i) {
          formdata.append(i, data[i]);
        });

        request.open(method, url);
        request.onload = function() {
          if(request.status == 200) {
            try {
              deferred.resolve(JSON.parse(request.responseText));
            }catch(e){
              deferred.reject("Unable to parse response body.");
            }
          }
          else
          {
            deferred.reject("Server returned status " + request.status);
          }
        };
        request.send(formdata);
        return deferred.promise;
      };
    }]);
