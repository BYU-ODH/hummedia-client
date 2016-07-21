function defaultBlanks() {
    // Define the places we want to blank the screen.
    var one = {'start': 8, 'end': 12};
    var two = {'start': 47, 'end': 52};

    return [one, two];
}

function defaultBlocks() {
    // Define the regions we want to block.
    var one = {'start': 0, 'end': 20, 'height': 100, 'width': 20, 'x': 10, 'y': 0, 'color': 'red'};
    var two = {'start': 10, 'end': 30, 'height': 20, 'width': 100, 'x': 0, 'y': 50, 'color': 'blue'};
    var three = {'start': 20, 'end': 40, 'height': 20, 'width': 50, 'x': 10, 'y': 30, 'color': 'yellow'};

    return [one, two, three];
}

function defaultMutes() {
    // Define the segments we want to mute.
    var one = {'start': 30, 'end': 50};
    var two = {'start': 75, 'end': 90};

    return [one, two];
}

function defaultPauses() {
    // Define the places we want to pause.
    var one = {'time': 23};
    var two = {'time': 33};

    return [one, two];
}

function defaultSkips() {
    // Define the segments we want to skip.
    var one = {'start': 50, 'end': 60};
    var two = {'start': 70, 'end': 80};

    return [one, two];
}

function defaultMessages() {
    // Define the annotations we want to show.
    var one = {'start': 0, 'end': 20, 'x': 10, 'y': 0, 'text': 'red', 'size': 24};
    var two = {'start': 10, 'end': 30, 'x': 0, 'y': 50, 'text': 'blue', 'size': 48};
    var three = {'start': 20, 'end': 40, 'x': 10, 'y': 30, 'text': 'yellow', 'size': 96};

    return [one, two, three];
}

