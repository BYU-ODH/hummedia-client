function textPlugin(options) {
    if (options && options.messages) {
        var messages = options.messages;
    } else {
        var messages = [];
    }

    // Create the annotation layer.
    var annoId = 'text';
    var annoDiv = document.createElement('div');

    annoDiv.id = annoId;
    annoDiv.style.position = 'absolute';

    this.el().appendChild(annoDiv);

    // Register the annotation layer with the 'margin' plugin.
    if (!this.overlayDivs) {
        this.overlayDivs = [];
    }

    this.overlayDivs.push(annoDiv);

    // Create divs for each annotation.
    for (var i in messages) {
        var anno = messages[i];

        var x = anno.x + '%';
        var y = anno.y + '%';

        var div = document.createElement('div');
        div.classList.add('annotation');
        div.innerText = anno.text;
        div.style.fontSize = anno.size + 'pt'; 

        div.style.left = x;
        div.style.top = y;

        div.class = 'annotation';

        annoDiv.appendChild(div);

        anno['div'] = div;
    }

    // Show or hide annotations as needed.
    function redrawAnnotations(e) {
        var time =  this.currentTime();
        for (var i in messages) {
            var anno = messages[i];
            if (time > anno.start && time < anno.end) {
                anno.div.style.visibility = 'visible';
            } else {
                anno.div.style.visibility = 'hidden';
            }
        }
    };

    this.on('seeked', redrawAnnotations);
    this.on('timeupdate', redrawAnnotations);
};

videojs.plugin('textPlugin', textPlugin);
