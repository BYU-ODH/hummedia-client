function blockPlugin(options) {
    if (options && options.blocks) {
        var blocks = options.blocks;
    } else {
        var blocks = [];
    }

    // Create the block layer.
    var blockId = 'blocks';
    var blockDiv = document.createElement('div');

    blockDiv.id = blockId;
    blockDiv.style.position = 'absolute';

    this.el().appendChild(blockDiv);

    // Register the block layer with the 'margin' plugin.
    if (!this.overlayDivs) {
        this.overlayDivs = [];
    }

    this.overlayDivs.push(blockDiv);
    this.updateMargins();

    // Create divs for each block.
    for (var i in blocks) {
        var block = blocks[i];

        var x = block.x + '%';
        var y = block.y + '%';
        var width = block.width + '%';
        var height = block.height + '%';

        var div = document.createElement('div');
        div.classList.add('block');
        div.style.backgroundColor = block.color;

        div.style.width = width;
        div.style.height = height;
    
        div.style.left = x;
        div.style.top = y;

        div.class = 'block';

        blockDiv.appendChild(div);

        block['div'] = div;
    }

    // Show or hide blocks as needed.
    function redrawAnnotations(e) {
        var time =  this.currentTime();
        for (var i in blocks) {
            var block = blocks[i];
            if (time > block.start && time < block.end) {
                block.div.style.visibility = 'visible';
            } else {
                block.div.style.visibility = 'hidden';
            }
        }
    };

    this.on('seeked', redrawAnnotations);
    this.on('timeupdate', redrawAnnotations);
};

videojs.plugin('blockPlugin', blockPlugin);
