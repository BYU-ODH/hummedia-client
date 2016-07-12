function mutePlugin(options) {
    if (options && options.mutes) {
        var mutes = options.mutes;
    } else {
        var mutes = [];
    }

    // Mute audio if a muted segment is entered.
    function mute(e) {
        var time = this.currentTime();
        var shouldMute = false;
        for (var i in mutes) {
            var skip = mutes[i];
            if (time > skip.start && time < skip.end) {
                shouldMute = true;
            }
        }

        this.muted(shouldMute);
    };

    this.on('seeked', mute);
    this.on('timeupdate', mute);
    this.on('volumechange', mute);
};

videojs.plugin('mutePlugin', mutePlugin);
