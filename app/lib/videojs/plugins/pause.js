function pausePlugin(options) {
    if (options && options.pauses) {
        var pauses = options.pauses;
    } else {
        var pauses = [];
    }

    // Pause video at the desired time.
    function pause(e) {
        var time = this.currentTime();
        for (var i in pauses) {
            var p = pauses[i];
            if (Math.floor(time) == p.time && !p.done) {
                this.pause();
                p.done = true;
            }
        }
    };

    this.on('seeked', pause);
    this.on('timeupdate', pause);
};

videojs.plugin('pausePlugin', pausePlugin);
