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
        _saveCoursesButton = _rootElement.querySelector("#butter-save-course-changes"),
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
            _project.save();
        };

        _saveCoursesButton.onclick = function() {
            collections = _project.saveCourses();
            var foo = collections.query({},function(){
              for(var i=0; i<foo.length; i++){
                $('#courses-select').append($("<option></option>").text(foo[i]['dc:title']));
              }
              $('select').chosen({"placeholder_text_multiple":"No Courses Selected"})

            });
        }

      },
      close: function() {
      }
    });
  }, true );
});
