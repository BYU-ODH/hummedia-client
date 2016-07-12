function marginPlugin(options) {
    // Calculate letterboxing/pillaring margins.
    this.updateMargins = function() {
        var el = this.contentEl();

        var idealRatio = this.videoWidth() / this.videoHeight();
        var actualRatio = el.clientWidth / el.clientHeight;

        if (actualRatio < idealRatio) {
            // letterboxed - margins on top and bottom.
            var scale = el.clientWidth / this.videoWidth();
            var width = scale * this.videoWidth();
            var height = scale * this.videoHeight();
            var horizMargin = 0;
            var vertMargin = (el.clientHeight - height) / 2;
        } else {
            // pillared - margins on sides.
            var scale = el.clientHeight / this.videoHeight();
            var width = scale * this.videoWidth();
            var height = scale * this.videoHeight();
            var vertMargin = 0;
            var horizMargin = (el.clientWidth - width) / 2;
        }

        for (var i in this.overlayDivs) {
            var div = this.overlayDivs[i];

            div.style.height = height + 'px';
            div.style.width = width + 'px';

            div.style.top = vertMargin + 'px';
            div.style.left = horizMargin + 'px';
        }
    };

    // Set the player to re-calculate margins whenever the window is resized.
    var player = this; // Needed for closure - 'this' will be bound to the window when called.
    window.onresize = function() {
        player.updateMargins();
    }

    // We also need to calculate margins on 'play' events.
    // This avoids a bug where margins aren't calculated when the media starts.
    this.on('play', player.updateMargins);
};

videojs.plugin('marginPlugin', marginPlugin);
