/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [ "core/eventmanager", "core/media", "util/sanitizer", "util/xhr", "core/config" ],
        function( EventManager, Media, Sanitizer, xhr, Config ) {

  var __butterStorage = window.localStorage;

  function Project( butter ) {

    var _this = this,
        _id, _name, _template, _author, _description, _dataObject,
        _publishUrl, _iframeUrl, _remixedFrom,

        // Whether or not a save to server is required (project data has changed)
        _isDirty = false,

        // Whether or not a backup to storage is required (project data has changed)
        _needsBackup = false,

        // Whether or not the project is saved to the db and published.
        // The notion of "saving" to consumers of this code is unware of
        // the save vs. publish distinction. As such, we use isSaved externally
        // and isPublished internally, where Publish follows Save and is
        // more correct.
        _isPublished = false,

        // How often to backup data in ms. If 0, no backups are done.
        _backupIntervalMS = butter.config.value( "backupInterval" )|0,

        // Interval for backups, starts first time user clicks Save.
        _backupInterval = -1;

    function invalidate() {
      // Project is dirty, needs save, backup
      _isDirty = true;
      _needsBackup = true;

      // If the project has an id (if it was saved), start backups again
      // since they may have been stopped if LocalStorage size limits were
      // exceeded.
      if ( _id ) {
        startBackups();
      }

      // Let consumers know that the project changed
      _this.dispatch( "projectchanged" );
    }

    // Manage access to project properties.  Some we only want
    // to be read (and managed by db/butter), others we want to
    // affect save logic.
    Object.defineProperties( _this, {
      "id": {
        get: function() {
          return _id;
        },
        enumerable: true
      },

      "name": {
        get: function() {
          return _name;
        },
        set: function( value ) {
          if ( value !== _name ) {
            _name = value;
            invalidate();
          }
        },
        enumerable: true
      },

      "template": {
        get: function() {
          return _template;
        },
        set: function( value ) {
          if ( value !== _template ) {
            _template = value;
            invalidate();
          }
        },
        enumerable: true
      },

      "author": {
        get: function() {
          return _author;
        },
        set: function( value ) {
          if ( value !== _author ) {
            _author = value;
            invalidate();
          }
        },
        enumerable: true
      },

      "description": {
        get: function() {
          return _description;
        },
        set: function( value ) {
          if ( value !== _description ) {
            _description = value;
            invalidate();
          }
        },
        enumerable: true
      },

      "data": {
        get: function() {
          // Memoize value, since it doesn't always change
          if ( !_dataObject || _isDirty ) {
            var exportJSONMedia = [];
            for ( var i = 0; i < butter.media.length; ++i ) {
              var json = butter.media[ i ].json;
              json.id = butter.config.value( "video" ); // so the server can reference the video accurately

              // The backend requires this to be an array
              if( !(json.url instanceof Array) ) {
                json.url = [json.url];
              }
              exportJSONMedia.push( json );
            }
            _dataObject = {
              media: exportJSONMedia
            };
          }
          return _dataObject;
        },
        enumerable: true
      },

      "publishUrl": {
        get: function() {
          return _publishUrl;
        },
        enumerable: true
      },

      "previewUrl": {
        get: function() {
          return _publishUrl + "?preview=true";
        },
        enumerable: true
      },

      "iframeUrl": {
        get: function() {
          return _iframeUrl;
        },
        enumerable: true
      },

      // Have changes made it to the db and been published?
      "isSaved": {
        get: function() {
          return _isPublished && !_isDirty;
        },
        enumerable: true
      }

    });

    EventManager.extend( _this );

    // Once saved data is loaded, and media is ready, we start to care about
    // the app's data states changing, and want to track.
    butter.listen( "mediaready", function mediaReady() {
      butter.unlisten( "mediaready", mediaReady );

      // Listen for changes in the project data so we know when to save.
      [ "mediacontentchanged",
        "mediaclipadded",
        "mediaclipremoved",
        "mediatargetchanged",
        "trackadded",
        "trackremoved",
        "tracktargetchanged",
        "trackeventadded",
        "trackeventremoved",
        "trackeventupdated"
      ].forEach( function( event ) {
        butter.listen( event, invalidate );
      });
    });

    function startBackups() {
      if ( _backupInterval === -1 && _backupIntervalMS > 0 ) {
        _needsBackup = true;
        _backupInterval = setInterval( backupData, _backupIntervalMS );
        // Do a backup now so we don't miss anything
        backupData();
      }
    }

    // Import project data from JSON (i.e., created with project.export())
    _this.import = function( json ) {
      var oldTarget, targets, targetData,
          mediaData, media, m, i, l;

      // If JSON, convert to Object
      if ( typeof json === "string" ) {
        try {
          json = JSON.parse( json );
        } catch( e ) {
          return;
        }
      }

      if ( json.projectID ) {
        _id = json.projectID;
        _isPublished = true;
      }

      if ( json.name ) {
        // replace HTML entities ("&amp;", etc), possibly introduced by
        // templating rules being applied to project metadata, with
        // their plain form counterparts ("&", etc).
        _name = Sanitizer.reconstituteHTML( json.name );
      }

      if ( json.template ) {
        _template = json.template;
      }

      if ( json.author ) {
        _author = json.author;
      }

      if ( json.description ) {
        _description = json.description;
      }

      if ( json.publishUrl ) {
        _publishUrl = json.publishUrl;
      }

      if ( json.iframeUrl ) {
        _iframeUrl = json.iframeUrl;
      }

      if ( json.remixedFrom ) {
        _remixedFrom = json.remixedFrom;
      }

      targets = json.targets;
      if ( targets && Array.isArray( targets ) ) {
        for ( i = 0, l = targets.length; i < l; ++i ) {
          targetData = targets[ i ];
          oldTarget = butter.getTargetByType( "elementID", targetData.element );
          // Only add target if it's not already added.
          if ( !oldTarget ) {
            butter.addTarget( targetData );
          } else {
            // If it was already added, just update its json.
            oldTarget.json = targetData;
          }
        }
      } else if ( console ) {
        console.warn( "Ignored imported target data. Must be in an Array." );
      }

      media = json.media;
      if ( media && Array.isArray( media ) ) {
        for ( i = 0, l = media.length; i < l; ++i ) {
          mediaData = media[ i ];
          m = butter.getMediaByType( "target", mediaData.target );
          m.clear();

          if ( !m ) {
            m = new Media();
            m.json = mediaData;
            butter.addMedia( m );
          } else {
            m.json = mediaData;
          }
        }
      } else if ( console ) {
        console.warn( "Ignored imported media data. Must be in an Array." );
      }

      // If this is a restored backup, restart backups now (vs. on first save)
      // since the user indicated they want it.
      if( json.backupDate ) {
        startBackups();
      }
    };

    // Export project data as JSON string (e.g., for use with project.import())
    _this.export = function() {
      return JSON.stringify( _this.data );
    };

    // Expose backupData() to make testing possible
    var backupData = _this.backupData = function() {
      // If the project isn't different from last time, or if it's known
      // to not fit in storage, don't bother trying.
      if ( !_needsBackup ) {
        return;
      }
      // Save everything but the project id
      var data = _this.data;
      data.name = _name;
      data.template = _template;
      data.author = _author;
      data.description = _description;
      data.backupDate = Date.now();
      try {
        __butterStorage.setItem( "butter-backup-project", JSON.stringify( data ) );
        _needsBackup = false;
      } catch ( e ) {
        // Deal with QUOTA_EXCEEDED_ERR when localStorage is full.
        // Stop the backup loop because we know we can't save anymore until the
        // user changes something about the project.
        clearInterval( _backupInterval );
        _backupInterval = -1;

        // Purge the saved project, since it won't be complete.
        __butterStorage.removeItem( "butter-backup-project" );

        console.warn( "Warning: Popcorn Maker LocalStorage quota exceeded. Stopping automatic backup. Will be restarted when project changes again." );
      }
    };

    // Save and Publish a project.  Saving only happens if project data needs
    // to be saved (i.e., it has been changed since last save, or was never
    // saved before).
    _this.save = function( callback, refresh ) {
      if ( !callback ) {
        callback = function() {};
      }

      // Don't save if there is nothing new to save.
      if ( _this.isSaved ) {
        callback({ error: "okay" });
        return;
      }


      // Save to local storage first in case network is down.
      backupData();

      function success() {
          // Since we've now fully saved, blow away autosave backup
          _isDirty = false;
          __butterStorage.removeItem( "butter-backup-project" );

          // Start keeping backups in storage, if not already started
          startBackups();

          // If this was a first save, grab id generated by server and store
          // @TODO
          if ( false && !_id ) {
            _id = e.projectId;
          }

          // Let consumers know that the project is now saved;
          if (!refresh) {
            _this.dispatch( "projectsaved" );
          } else {
            _this.dispatch( "projectsavedrefresh" );
          }
      }


      // remove track events whose popcornOptions object contains a key equaling the value passed in
      function stripEventsByOption(data, key, value) {
          var tracks = data.media[0].tracks;
          tracks.forEach(function(track) {
              var events = track.trackEvents;

              for(var i = 0; i < events.length; i++) {
                  var ev = events[i];
                  if(ev.popcornOptions[key] == value) {
                      events.splice(i,1);
                      i--; // compensate for the missing value
                  }
              }
          });
      }

      // so we can know when both the required and the non-required annotations have been saved
      var count = 0;
      function projectSaved() {
          count++;

          // how many saves do we need before this is complete? If permitted, we have to save required as well
          required = butter.config.value('canAddRequired') ? 2 : 1;
          if(count === required) {
              success();
          }
      }

      // clone data into a required object and an nonrequired object
      var required = JSON.parse(JSON.stringify(_this.data));
      var nonrequired = JSON.parse(JSON.stringify(_this.data));
      
      var baseUrl = butter.config.value('annotationUrl');
          baseUrl = baseUrl.replace(/\\:/g, ':');

      // strip nonrequired fields from the required object
      stripEventsByOption(required, '__humrequired', false);

      // strip required fields from the nonrequired object
      stripEventsByOption(nonrequired, '__humrequired', true);
      
      function failure(xhr) {
          alert("There was an error saving your project. The web server returned: " + xhr['status']);
      }

      /**@TODO: Should use Annotation Resource object if possible **/

      // first save required annotations
      if(butter.config.value('canAddRequired')) {
          var reqUrl = baseUrl;
          if(butter.config.value('requiredAnnotationID')) {
              reqUrl +=  '/' + butter.config.value('requiredAnnotationID') + '?client=popcorn';
              xhr.patch( reqUrl, required, projectSaved, failure);
          }
          else
          {
              reqUrl +=  '?client=popcorn';
              xhr.post( reqUrl, required, function(data) {
                  var updatedConfig = Config.parse(JSON.stringify({requiredAnnotationID: data.media[0].tracks[0].id}));
                  butter.config.override(updatedConfig);
                  projectSaved(data);
              }, failure); 
          }
      }
      
      // then save all other annotations
      var defUrl = baseUrl;
      if(butter.config.value('annotationID')) {
          defUrl +=  '/' + butter.config.value('annotationID') + '?client=popcorn';
          xhr.patch( defUrl, nonrequired, projectSaved, failure); 
      }
      else
      {
          defUrl +=  '?collection=' + butter.config.value('collection') + '&client=popcorn';
          xhr.post( defUrl, nonrequired, function(data) {
              var updatedConfig = Config.parse(JSON.stringify({annotationID: data.media[0].tracks[0].id}));
              butter.config.override(updatedConfig);
              projectSaved(data);
          }, failure); 
      }
    };

    _this.download = function() {
        return(_this.data);
    };

    _this.upload = function(json) {
      var newObj = json;
      var oldObj = _this.data;

      if (JSON.stringify(Object.keys(newObj).sort()) === JSON.stringify(Object.keys(oldObj).sort()) &&
        JSON.stringify(Object.keys(newObj.media[0]).sort()) === JSON.stringify(Object.keys(oldObj.media[0]).sort())) {
          if (newObj.media[0].id === oldObj.media[0].id) {
            _this.import(json);
            _this.save(undefined, true);
          } else {
            alert("The selected annotation file is not for this video.");
          }
      } else {
        alert("The selected annotation file is invalid.");
      }
    };
  }

  // Check for an existing project that was autosaved but not saved.
  // Returns project backup data as JS object if found, otherwise null.
  // NOTE: caller must create a new Project object and call import.
  Project.checkForBackup = function( butter, callback ) {
    // See if we already have a project autosaved from another session.
    var projectBackup, backupDate;

    // For testing purposes, we can skip backup recovery
    if ( butter.config.value( "recover" ) === "purge" ) {
      callback( null, null );
      return;
    }

    try {
      projectBackup = __butterStorage.getItem( "butter-backup-project" );
      projectBackup = JSON.parse( projectBackup );

      // Delete since user can save if he/she wants.
      __butterStorage.removeItem( "butter-backup-project" );

      if ( projectBackup ) {
        backupDate = projectBackup.backupDate;
      }
    } catch( e ) { }

    callback( projectBackup, backupDate );
  };

  return Project;
});
