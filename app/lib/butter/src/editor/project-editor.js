/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define([ "editor/editor", "editor/base-editor",
          "text!layouts/project-editor.html",
          "util/social-media", "ui/widget/textbox",
          "ui/widget/tooltip" ],
  function( Editor, BaseEditor, LAYOUT_SRC, SocialMedia, TextboxWrapper, ToolTip ) {

  Editor.register( "project-editor", LAYOUT_SRC, function( rootElement, butter ) {
    var _rootElement = rootElement,
        _projectTabs = _rootElement.querySelectorAll( ".project-tab" ),
        _saveButton  = _rootElement.querySelector("#butter-save-changes"),
        _downloadButton = _rootElement.querySelector("#butter-download-annotations"),
        _uploadButton = _rootElement.querySelector("#butter-upload-annotations"),
        _this = this,
        _numProjectTabs = _projectTabs.length,
        _project,
        _projectTab,
        _idx;

    function onProjectTabClick( e ) {
      var target = e.target,
          currentDataName = target.getAttribute( "data-tab-name" ),
          dataName;

      for ( var i = 0; i < _numProjectTabs; i++ ) {
        dataName = _projectTabs[ i ].getAttribute( "data-tab-name" );

        if ( dataName === currentDataName ) {
          _rootElement.querySelector( "." + dataName + "-container" ).classList.remove( "display-off" );
          target.classList.add( "butter-active" );
        } else {
          _rootElement.querySelector( "." + dataName + "-container" ).classList.add( "display-off" );
          _projectTabs[ i ].classList.remove( "butter-active" );
        }

      }
    }

    for ( _idx = 0; _idx < _numProjectTabs; _idx++ ) {
      _projectTab = _projectTabs[ _idx ];
      _projectTab.addEventListener( "click", onProjectTabClick, false );
    }

    function updateEmbed( url ) {
      _projectEmbedURL.value = "<iframe src='" + url + "' width='" + _embedWidth + "' height='" + _embedHeight + "'" +
      " frameborder='0' mozallowfullscreen webkitallowfullscreen allowfullscreen></iframe>";
    }

    function applyInputListeners( element, key ) {
      var ignoreBlur = false,
          target;

      function checkValue( e ) {
        target = e.target;
        if ( target.value !== _project[ key ] ) {
          _project[ key ] = target.value;
          if ( butter.cornfield.authenticated() ) {
            _project.save(function() {
              butter.editor.openEditor( "project-editor" );
              checkDescription();
            });
          }
        }
      }

      element.addEventListener( "blur", function( e ) {
        if ( !ignoreBlur ) {
          checkValue( e );
        } else {
          ignoreBlur = false;
        }
      }, false );
    }


    butter.listen( "projectsaved", function onProjectSaved() {
        alert("Project saved.");
    });

    Editor.BaseEditor.extend( this, butter, rootElement, {
      open: function() {
        _project = butter.project;

        _saveButton.onclick = function() {
          if (!this.classList.contains('butter-disabled')) {
            _project.save();
          }
        };

        _downloadButton.onclick = function() {
          if (!this.classList.contains('butter-disabled')) {
            var obj = JSON.parse(_project.export());
            var data = "tetx/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj));

            var button = document.getElementById('butter-download-annotations');
            button.href = 'data:' + data;
            button.download = document.getElementById("video-title").textContent.trim()+'.json';
          }
        }

        _uploadButton.onclick = function() {
          if (confirm("Discard current annotations and replace them with new ones?")) {
            document.getElementById("file-upload").click();
            document.getElementById("file-upload").addEventListener("change", function(e) {
              var reader = new FileReader();
              reader.onload = function(f) {
                // try {
                //   var annotations_file = JSON.parse(f.target.result);
                //   _project.upload(annotations_file);
                // } catch(e) {
                //   //alert(e);//"Invalid File!");
                //   console.log(e);
                //   return;
                // }
                  var annotations_file = JSON.parse(f.target.result);
                  _project.upload(annotations_file);
              }

              reader.readAsText(e.target.files[0])
            });
          }
        }
      },
      close: function() {
      }
    });
  }, true );
});
