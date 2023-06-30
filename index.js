// start by gaining access to the canvas element
const canvas = document.querySelector('#draw');

// get the context of the canvas
// The context is what we actually draw on
const context = canvas.getContext('2d');

// set the width and height of the canvas to the window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight * 0.88;

// set the stroke style
context.strokeStyle = '#f44336'; // sets the color used to draw lines and shapes
context.lineJoin = 'round'; // determines the shape used to join two line segments where they meet
context.lineCap = 'round'; // determines the shape used to draw the end points of lines
context.lineWidth = 10; // sets the default thickness of lines

// flags
let isDrawing = false; // flag to determine if we are drawing (mouse moving while down) or not
let onPen = true;
let onEraser = false;

// we need starting and ending x and y coordinates to draw a line
let lastX = 0;
let lastY = 0;

// variables for pen and eraser sizes
let penWidth = 10;
let eraserWidth = 10;

// array holding all past steps
let steps = [];
let idx = 0;

// max items to store in the steps array
const maxSteps = 50;

// stuff blank canvas into steps on intialization
context.fillStyle = '#fff';
context.fillRect(0, 0, canvas.width, canvas.height);
steps.push(context.getImageData(0, 0, canvas.width, canvas.height));

// draw functions
const startDrawing = (ev) => {

    isDrawing = true;
    [lastX, lastY] = [ev.offsetX, ev.offsetY]; // update the starting point as soon as the mouse is down
    context.beginPath(); // start a path
    context.moveTo(lastX, lastY); // start from
    ev.preventDefault();
}

const draw = (ev) => {
    
    // stop the function from running when they are not moused down
    if (!isDrawing) return;

    // console.log(ev.layerX, ev.layerY, "off " + ev.offsetX, "off " + ev.offsetY);
    if (onPen) context.lineWidth = penWidth;
    if (onEraser) context.lineWidth = eraserWidth;

    context.lineTo(ev.offsetX, ev.offsetY); // go to
    context.stroke(); // draw the line
};

const endDrawing = (ev) => {

    if (!isDrawing) return;
    isDrawing = false;
    context.stroke();
    context.closePath();

    updateSteps(); // record the current status of the canvas
    
    // debugNum.textContent = `${idx} / ${steps.length - 1}`;
}

// updates the steps array and the index
const updateSteps = () => {

    // slice the steps array to remove all the steps that were undone
    if (idx < steps.length - 1) {
        steps = steps.slice(0, idx + 1);
    }

    // push the stroke to the steps array
    steps.push(context.getImageData(0, 0, canvas.width, canvas.height));
    idx ++;

    // pop the oldest step from the array if it gets too full (i.e. 20 steps)
    if (steps.length > maxSteps) {
        steps.shift();
        idx --;
    }

    toggleUndoRedoClass(); // update the visual state of the undo and redo buttons
}

// enable / disable undo and redo buttons (visually)
const toggleUndoRedoClass = () => {
    if (idx === 0) undoButton.classList.add('disabled');
    else undoButton.classList.remove('disabled');

    if (idx === steps.length - 1) redoButton.classList.add('disabled');
    else redoButton.classList.remove('disabled');
}

// toolbar functions
const handleTools = (ev) => {
    // console.log(ev.target);
    // console.log(ev.target.name);

    if (ev.target.name === 'clear') {
        clearCanvas();
        return;
    }

    if (ev.target.name === 'pen') {
        context.globalCompositeOperation = 'source-over';
        onPen = true;
        onEraser = false;
        strokeWidthSlider.value = penWidth;
        strokeWidthDisplay.textContent = penWidth + 'px';
    }

    if (ev.target.name === 'eraser') {
        context.globalCompositeOperation = 'destination-out';
        onPen = false;
        onEraser = true;
        strokeWidthSlider.value = eraserWidth;
        strokeWidthDisplay.textContent = eraserWidth + 'px';
    }
    
    toggleToolBarClass(ev);
}

const clearCanvas = () => {
    if (!confirm('Are you sure you want to clear the canvas?')) return;
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillRect(0, 0, canvas.width, canvas.height);
    steps = [];
    idx = 0;
    steps.push(context.getImageData(0, 0, canvas.width, canvas.height));

    // reset undo and redo buttons
    undoButton.classList.remove('active');
    redoButton.classList.remove('active');
    toggleUndoRedoClass();
}

const toggleToolBarClass = (ev) => {
    // not the best way to handle class toggling I guess
    toolbarButtons.forEach((item) => {
        if (item.name === ev.target.name) { item.classList.add('active'); }
        else { item.classList.remove('active'); }
    });
}

const handleStrokeWidth = (ev) => {
    // console.log(ev.target.value);
    if (onPen) penWidth = ev.target.value;
    if (onEraser) eraserWidth = ev.target.value;
}

const handleStrokeWidthDisplay = (ev) => {
    strokeWidthDisplay.textContent = ev.target.value + 'px';
}

const handleColorChange = (ev) => {
    // console.log(ev.target.name);

    // automatically switch to pen when color is changed
    onPen = true;
    onEraser = false;

    context.globalCompositeOperation = 'source-over';

    switch (ev.target.name) {
        case 'red': context.strokeStyle = "#f44336"; break;
        case 'orange': context.strokeStyle = "#ff9800"; break;
        case 'yellow': context.strokeStyle = "#ffeb3b"; break;
        case 'green': context.strokeStyle = "#4caf50"; break;
        case 'blue': context.strokeStyle = "#2196f3"; break;
        case 'purple': context.strokeStyle = "#9c27b0"; break;
        case 'black': context.strokeStyle = "#000000"; break;
        case 'color': context.strokeStyle = ev.target.value; break;
    }

    togglePaletteClass(ev);
    toggleToolBarClass({target: {name: 'pen'}});
}

const togglePaletteClass = (ev) => {
    
    colorPicker.classList.remove('active');
    
    palette.forEach((item) => {
        if (item.name === ev.target.name) { item.classList.add('active'); }
        else { item.classList.remove('active'); }
    });

    if (ev.target.name === 'color') colorPicker.classList.add('active');
}

const handleUndo = (ev) => {
    
    // undo
    if (ev.target.name === 'undo') {
        if (idx <= 0) return;
        idx--;
    }

    // redo
    if (ev.target.name === 'redo') {
        if (idx >= steps.length - 1) return;
        idx++;
    }
    context.putImageData(steps[idx], 0, 0);
    ev.target.classList.add('active');

    toggleUndoRedoClass();

    // debugNum.textContent = `${idx} / ${steps.length - 1}`;
}

const handleSave = () => {
    let img = canvas.toDataURL('image/png');
    window.location.href = img;
}

// event listeners

// listen for the mouse event on the canvas
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mouseup', endDrawing);
canvas.addEventListener('mouseout', endDrawing); // treat mouseout like mouseup

// listen for the click event on the pen / eraser button
const toolbarButtons = document.querySelectorAll('.button');
toolbarButtons.forEach((item) => {item.addEventListener('click', handleTools)});

// and the clear button too
const clearButton = document.querySelector('.clear-button');
clearButton.addEventListener('click', handleTools);

// the undo button
const undoButton = document.querySelector('.undo-button');
undoButton.addEventListener('click', handleUndo);
undoButton.addEventListener('transitionend', () => undoButton.classList.remove('active'));

// the redo button
const redoButton = document.querySelector('.redo-button');
redoButton.addEventListener('click', handleUndo);
redoButton.addEventListener('transitionend', () => redoButton.classList.remove('active'));

// const debugNum = document.querySelector('.debug-undo');

// listen for the slider
const strokeWidthSlider = document.querySelector('.stroke-width');
const strokeWidthDisplay = document.querySelector('.stroke-width-label');
strokeWidthSlider.addEventListener('change', handleStrokeWidth);
strokeWidthSlider.addEventListener('mousemove', handleStrokeWidthDisplay);
strokeWidthSlider.addEventListener('mouseup', handleStrokeWidthDisplay);

// listen for the palette
const palette = document.querySelectorAll('.color-button');
palette.forEach((item) => {item.addEventListener('click', handleColorChange)});

const colorPicker = document.querySelector('.color-picker');
colorPicker.addEventListener('change', handleColorChange);

// the save button
const saveButton = document.querySelector('.save-button');
saveButton.addEventListener('click', handleSave);

