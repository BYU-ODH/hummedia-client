/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [], function() {

  return function( rootElement, clickHandler, elementTitle, startState ){
    var _element = rootElement;

    if ( startState !== false && startState !== true ) {
      startState = false;
    }

    _element.title = elementTitle || "Show/Hide";

    if ( clickHandler ) {
      _element.addEventListener( "click", clickHandler, false );
    }

    Object.defineProperties( this, {
      element: {
        enumerable: true,
        get: function(){
          return _element;
        }
      },
      state: {
        enumerable: true,
        get: function() {
          return _element.classList.contains( "toggled" );
        },
        set: function( state ) {
          if ( state ) {
            _element.classList.add( "toggled" );
            
            //Check for right chevron icons and change them to lefties            
            var chevrons = _element.getElementsByClassName('icon-right-open');
                      
            for(var i=0; i<chevrons.length; i++){
                chevrons[i].classList.add('icon-left-open');
                chevrons[i].classList.remove('icon-right-open');
            }
            
          }
          else {
            _element.classList.remove( "toggled" );

            //Check for left chevron icons and change them to righties            
            var chevrons = _element.getElementsByClassName('icon-left-open');
                      
            for(var i=0; i<chevrons.length; i++){
                chevrons[i].classList.add('icon-right-open');
                chevrons[i].classList.remove('icon-left-open');
            }

          }
        }
      },
      visible: {
        enumerable: true,
        get: function(){
          return _element.style.display !== "none";
        },
        set: function( val ){
          _element.style.display = val ? "block" : "none";
        }
      }
    });

    this.state = startState;

  };
});
