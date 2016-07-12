function blankPlugin(options) {
    if (options && options.blanks) {
        var blanks = options.blanks;
    } else {
        var blanks = [];
    }

    // Blank video at the desired time.
    function blank(e) {
        var time = this.currentTime();
        var shouldBlank = false;
        for (var i in blanks) {
            var b = blanks[i];
            if (time > b.start && time < b.end) {
                shouldBlank = true;
            }
        }

        var v = this.el().getElementsByTagName('video')[0];
        if (shouldBlank) {
            v.style.visibility = 'hidden';
        } else {
            v.style.visibility = 'visible';
        }
    };

    this.on('seeked', blank);
    this.on('timeupdate', blank);
};

videojs.plugin('blankPlugin', blankPlugin);
