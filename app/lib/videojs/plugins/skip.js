function skipPlugin(options) {
    if (options && options.skips) {
        var skips = options.skips;
    } else {
        var skips = [];
    }

    // Skip if one of the segments is entered.
    function skipAhead(e) {
        var time = this.currentTime();
        for (var i in skips) {
            var skip = skips[i];
            if (time > skip.start && time < skip.end) {
                this.currentTime(skip.end);
            }
        }
    };

    this.on('seeked', skipAhead);
    this.on('timeupdate', skipAhead);
};

videojs.plugin('skipPlugin', skipPlugin);
