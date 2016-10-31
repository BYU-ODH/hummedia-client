/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define([ "ui/widget/tooltip" ], function( Tooltip ) {

  return function( editorAreaDOMRoot, editorModule ) {
    var _this = this;

    var _popcornButton = editorAreaDOMRoot.querySelector( ".butter-editor-header-popcorn" );
    var _projectButton = editorAreaDOMRoot.querySelector( ".butter-editor-header-share" );

    var _focusMap = {
      "plugin-list": _popcornButton,
      "project-editor": _projectButton
    };

    var _currentFocus;

    function openPluginList() {
      editorModule.openEditor( "plugin-list" );
    }  
    
    function openProjectEditor() {
      editorModule.openEditor( "project-editor" );
      if (!_this.isSaved) {
        editorAreaDOMRoot.querySelector( "#butter-save-changes" ).classList.remove( "butter-disabled" );
        editorAreaDOMRoot.querySelector( "#butter-download-annotations" ).classList.add( "butter-disabled" );
      } else {
        editorAreaDOMRoot.querySelector( "#butter-save-changes" ).classList.add( "butter-disabled" );
        editorAreaDOMRoot.querySelector( "#butter-download-annotations" ).classList.remove( "butter-disabled" );
      }
    }  

    this.setFocus = function( editorName ) {
      var focusCandidate = _focusMap[ editorName ];
      if ( _currentFocus ) {
        _currentFocus.classList.remove( "butter-active" );
      }
      if ( focusCandidate ) {
        focusCandidate.classList.add( "butter-active" );
        _currentFocus = focusCandidate;
      }
    };

    Object.defineProperty( this, "focusMap", {
      enumerable: true,
      writeable: false,
      configurable: false,
      get: function() {
        return _focusMap;
      }
    });

    this.views = {
      saved: function() {
        _this.isSaved = true;;
        // _projectButton.classList.add( "butter-editor-btn-disabled" );
        // _projectButton.removeEventListener( "click", openProjectEditor, false );
        // // If the project editor is open, open the media editor instead.
        // if ( _currentFocus === _projectButton ) {
        //     editorModule.openEditor( "plugin-list" );
        // }
        if (_currentFocus === _projectButton) { //TODO: Toggle these without switching
          document.getElementById("butter-save-changes").classList.add( "butter-disabled" );
          document.getElementById("butter-download-annotations").classList.remove( "butter-disabled" );
        }
      },
      unSaved: function() {
        _this.isSaved = false;
        if (_currentFocus === _projectButton) {
          document.getElementById("butter-save-changes").classList.remove( "butter-disabled");
          document.getElementById("butter-download-annotations").classList.add( "butter-disabled" );
        }
        //_projectButton.classList.remove( "butter-editor-btn-disabled" );
        _projectButton.addEventListener( "click", openProjectEditor, false );
      },
      enablePlugins: function() {
        _popcornButton.classList.remove( "butter-editor-btn-disabled" );
        _popcornButton.addEventListener( "click", openPluginList, false );
      },
      disablePlugins: function() {
        _popcornButton.classList.add( "butter-editor-btn-disabled" );
        _popcornButton.removeEventListener( "click", openPluginList, false );
      }
    };

  };

});
