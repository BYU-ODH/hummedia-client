(function( Popcorn, document ) {

  function HTMLVideojsVideoElement( vjs ) {
    var self = new Popcorn._MediaElementProto(),
        parent = vjs.el();

    vjs.ready( function playerReady() {
      self.dispatchEvent( "durationchange" );
      self.dispatchEvent( "loadedmetadata" );
      self.dispatchEvent( "loadeddata" );
      self.dispatchEvent( "canplay" );
      self.dispatchEvent( "canplaythrough" ); 
    });
    
    self.parentNode = parent;
    self._eventNamespace = Popcorn.guid( "HTMLVideojsVideoElement::" );
    self._util.type = "Videojs";

    self.play = function() {
      self.dispatchEvent( "play" );
      vjs.play();
    };
    
    self.pause = function() {
      self.dispatchEvent( "pause" );
      vjs.pause();
    };

    Object.defineProperties( self, {
      
      src: {
        get: function() { return vjs.src() },
        set: function(val) { return vjs.src(val); }
      },
      autoplay: {
        get: function() { return vjs.autoplay() },
        set: function(val) { return vjs.autoplay(val); }
      },
      loop: {
        get: function() { return vjs.loop() },
        set: function(val) { return vjs.loop(val); }
      },
      width: {
        get: function() { return vjs.width() },
        set: function(val) { return vjs.width(val); }
      },
      height: {
        get: function() { return vjs.height() },
        set: function(val) { return vjs.width(val); }
      },
      currentTime: {
        get: function() { return vjs.currentTime() },
        set: function(val) { return vjs.currentTime(val); }
      },
      duration: {
        get: function() { return vjs.duration() }
      },
      ended: {
        get: function() { return vjs.ended() }
      },
      paused: {
        get: function() { return vjs.paused() }
      },
      seeking: {
        get: function() { return vjs.seeking() }
      },
      volume: {
        get: function() { return vjs.volume() },
        set: function() { return vjs.volume.apply(this, arguments); }
      },
      muted: {
        get: function() { return vjs.muted() },
        set: function(val) { return vjs.muted(val); }
      },
      playbackRate: {
        get: function() { return vjs.playbackRate() },
        set: function(val) { return vjs.playbackRate(val); }
      }
      // TODO: error 
      // TODO: readyState
      // TODO: networkState

    });

    return self;
  };

  Popcorn.HTMLVideojsVideoElement = function( vjs ) {
    return new HTMLVideojsVideoElement( vjs );
  };

}( Popcorn, document ));
