//===== GLOBAL VARIABLES ======
let population; //represent the population in the generation
let generation = 0;//represent the current generation
let LiveNeighbours;
let grid;//the current generation grid representation
let nextGrid; //the next generation grid representation
const SQUARE_SIZE = 10;
let cols,rows;
let state;
let canPress = true;//FLAG to allow user to press mouse 
let intervalID = null;
let timeoutID = null;
const duration = 120000; //max duration to run the game of life before ending (2 minutes)
let gridGraphics; //seperate graphics buffer for static grid
//the eight neighbours of any given cell (horizontal,vertical,diagonal)
const NEIGHBOURS = [ 
    [-1,-1],[-1,0],[-1,1],
    [0,-1],         [0,1],
    [1,-1],[1,0],[1,1]
];
const LiveCells = new Set(); //keep track of live cells only
const DeadNeighbourCells = new Set(); //keep track of potential dead neighbour cells to living cells

//==== FUNCTIONS ====

//create a 2D array
function make2DArray(cols, rows) {
    let arr = new Array(cols);
    for (let i = 0; i < arr.length; i++) {
        arr[i] = new Array(rows);
        for (let j = 0; j < arr[i].length; j++) {
            arr[i][j] = 0;
        }
    }
    return arr;
}

//the needed setup initialization
function setup() {
    //const canvas = createCanvas(400, 400); // Create a 400 by 400 canvas to draw onto

    /*======NEW FROM HERE TO BELOW====== */
    const container = document.getElementById('game-canvas-container');

    //use the containers actual dimensions
    const canvas = createCanvas(400,400);

    pixelDensity(1);

    //center the canvas in the container
    canvas.elt.style.width = '400px';
    canvas.elt.style.height = '400px';
    canvas.elt.style.maxWidth = '400px';
    canvas.elt.style.maxHeight = '400px';
    canvas.elt.style.minWidth = '400px';
    canvas.elt.style.minHeight = '400px';
    canvas.elt.style.display = 'block';
    canvas.elt.style.margin = '0';
    canvas.elt.style.padding = '0';

    canvas.elt.width = 400;
    canvas.elt.height = 400;
    
    canvas.parent('game-canvas-container');
    /*=====ALL THIS ABOVE IS NEW======= */

    //createCanvas(400, 400).mousePressed(canvasMousePressed); // Create a 400 by 400 canvas to draw onto

    cols = width / SQUARE_SIZE;// cols = 400 / SQUARE_SIZE
    rows = height / SQUARE_SIZE;// rows = 400 / SQUARE_SIZE

    grid = make2DArray(cols, rows);
    nextGrid = make2DArray(cols, rows);

    //create static grid lines buffer
    gridGraphics = createGraphics(width,height);
    drawGridLines(gridGraphics);

    drawGrid();
    population = countPopulation();
    updatePopulationDisplay(); 

    setTimeout(() => {
        const canvas = document.querySelector('canvas');
        const rect = canvas.getBoundingClientRect();
        console.log('=== CANVAS DEBUG ===');
        console.log('Canvas internal size:', canvas.width, 'x', canvas.height);
        console.log('Canvas displayed size (rect):', rect.width, 'x', rect.height);
        console.log('Device pixel ratio:', window.devicePixelRatio);
        console.log('SQUARE_SIZE:', SQUARE_SIZE);
        console.log('Grid dimensions:', cols, 'x', rows);
        
        // Check if canvas is being scaled
        if (rect.width !== 400 || rect.height !== 400) {
            console.warn('WARNING: Canvas is being displayed at', rect.width, 'x', rect.height, 'instead of 400x400');
            console.warn('Scaling factor:', rect.width/400, 'x', rect.height/400);
        }
    }, 100);
    
}

function drawGridLines(buffer){
    buffer.background(0);
    buffer.stroke(255);
    buffer.strokeWeight(1);

    //draw vertical lines
    for(let x = 0; x <= width; x += SQUARE_SIZE){
        buffer.line(x,0,x,height);
    }

    //draw horizontal lines
    for(let y = 0; y <= height; y += SQUARE_SIZE){
        buffer.line(0,y,width,y);
    }
}

//function to redraw the grid
function drawGrid(){
   // background(0);
   image(gridGraphics,0,0);

    //only draw live cells
    stroke(255);
    fill(255);

    LiveCells.forEach(key =>{
        const [i,j]= JSON.parse(key);
        const x = i * SQUARE_SIZE;
        const y = j * SQUARE_SIZE;
        square(x,y,SQUARE_SIZE);
    });
}

function drawResetGrid(){
    image(gridGraphics,0,0);
    //reset all the current live cells to size 0
    LiveCells.clear();
}
//mouse clicked function
function mousePressed(){
    if(mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height){
        return;//click was outside the canvas do
    }
    if(canPress){
        
        //get the actual canvas element
        const canvas = document.querySelector('canvas');
        const rect = canvas.getBoundingClientRect();

        //get the device pixel ratio
        const dpr = window.devicePixelRatio || 1;
        //get the scaling factor
        const scaleX = canvas.width / (rect.width * dpr); //400 / actual display width
        const scaleY = canvas.height / (rect.height * dpr);

        //conver mouse coordinates to canvas pixel coordinates
        const canvasX = mouseX * scaleX;
        const canvasY = mouseY* scaleY;

        //now calculate grid cell
        let col = floor(canvasX / SQUARE_SIZE);
        let row = floor(canvasY / SQUARE_SIZE);
        
    //    let col = floor(mouseX / SQUARE_SIZE);
    //    let row = floor (mouseY / SQUARE_SIZE);

        col = constrain(col,0,cols-1);
        row = constrain(row,0,rows-1);

        let key = JSON.stringify([col,row]);

        if(grid[col][row] === 0){
            grid[col][row] = 1;
            //add to set
            if(!LiveCells.has(key)){
                LiveCells.add(key);
                console.log("Added to Set: Row: "+row+" col: "+col);

            }
        }else{
            grid[col][row] = 0;
            //remove from set
            LiveCells.delete(key);
            console.log("Removed from Set: Row: "+row+" col: "+col);
        }
        population = countPopulation();
        updatePopulationDisplay();
        //redraw grid
        drawGrid();

        /* ====DEBUGGING */
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        console.log(`viewport width:${viewportWidth}px, viewport height:${viewportHeight}px, DPR:${dpr}`);
    } 
}

function constrain(value,min,max){
    return Math.max(min,Math.min(max,value));
}

function checkSizes() {
    const container = document.getElementById('game-canvas-container');
    const canvas = document.querySelector('canvas');
    const rect = canvas.getBoundingClientRect();
    
    console.log('Container computed style:', {
        width: getComputedStyle(container).width,
        height: getComputedStyle(container).height
    });
    
    console.log('Canvas:', {
        width: canvas.width,
        height: canvas.height,
        styleWidth: canvas.style.width,
        styleHeight: canvas.style.height,
        rectWidth: rect.width,
        rectHeight: rect.height
    });
}


//when the start button is clicked, the function will initialize
function startGame(){
    //only start if not already running
    if(intervalID === null){
        intervalID = setInterval( //replace for setInterval
    function draw(){
        //console.log("Size of the LiveCells set is: "+LiveCells.size);
        drawGrid();
        disableMousePress();//cannot press mouse
        // Iterate through the grid and move each cell independently
        const CurrentLiveCells = getCurrentLiveCells();

        const cellsToCheck = new Set();

        CurrentLiveCells.forEach(([col,row]) => {
            cellsToCheck.add(JSON.stringify([col,row]));

            //add all 8 neighbours
            for(let [dx,dy] of NEIGHBOURS){
                let [nx,ny] = get_toroidal_coordinates(col + dx, row + dy, cols, rows);
                cellsToCheck.add(JSON.stringify([nx,ny]));
            }
        });
        //calculate new generation
        const nextLiveCells = new Set();

        cellsToCheck.forEach(key =>{
            const [x,y] = JSON.parse(key);
            const isAlive = grid[x][y] === 1;
            const LiveNeighbours = NumLiveNeighbours(grid,x,y);

            if(isAlive){
                //conways First and Third rule of Game of Life
                if(LiveNeighbours < 2 || LiveNeighbours > 3){
                    nextGrid[x][y] = 0;//dies
                }
                //conways Second Rule of Game of Life
                else if(LiveNeighbours === 2 || LiveNeighbours === 3){
                    nextGrid[x][y] = 1;//lives
                    nextLiveCells.add(key);
                }
            }else{
                if(LiveNeighbours === 3){
                    nextGrid[x][y] = 1;//lives
                    nextLiveCells.add(key);
                }
            }
        });
        // Update grids for next frame
        const temp = grid; //NEW
        grid = nextGrid;
        nextGrid = temp; //NEW

       for(let i = 0;i < cols;i++){
            for(let j = 0; j < rows;j++){
                nextGrid[i][j] = 0;
            }
        }

        LiveCells.clear();//NEW
        nextLiveCells.forEach(key => LiveCells.add(key));

        //clearInterval(intervalID); //needed

        population = countPopulation();
        generation++;
        updateGenerationDisplay();
        updatePopulationDisplay();
        },100);

        //set a timeout to stop the game after duration
        timeoutID = setTimeout(() =>{
            clearInterval(intervalID);
            intervalID = null;
            resetGame();
            console.log(`Game of Life ended after ${duration/1000} seconds`);
        },duration);
    }
}

//pause the game
function pauseGame(){
    clearInterval(intervalID);
    intervalID = null;

    //clear the timeout if it exists
    if(timeoutID != null){
        clearTimeout(timeoutID);
        timeoutID = null;
    }
    disableMousePress();//cannot use mouse
}
//reset the game
function resetGame(){
    //pause if its running
    pauseGame();
    enableMousePress();
    population = 0;
    updatePopulationDisplay();
    generation = 0;
    updateGenerationDisplay();
    //reset the drawing board
    for(let i = 0;i < cols;i++){
        for(let j = 0; j < rows;j++){
            grid[i][j] = 0;
            nextGrid[i][j] = 0;
        }
    }
    //clear the timeout if it exists
    if(timeoutID != null){
        clearTimeout(timeoutID);
        timeoutID = null;
    }
    drawResetGrid();
}

//function to count the population of the generation
function countPopulation(){
    return LiveCells.size;
}

//function to return the current live cells
function getCurrentLiveCells(){
    return Array.from(LiveCells).map(str => JSON.parse(str));
}

//function to anable the mouse pressing on the grid
function enableMousePress(){
    canPress = true;
}

//function to disable the mouse pressing on the grid
function disableMousePress(){
    canPress = false;
}

//function to update the display of the population
function updatePopulationDisplay(){
    document.getElementById("dynamic-population").textContent = population;
}

//function to update the display of the generation
function updateGenerationDisplay(){
    document.getElementById("dynamic-generation").textContent = generation;
}

//method to return the number of neighbours in cell
function NumLiveNeighbours(matrix,posX,posY){
    let LNeighbours = 0;
    //need to check current cells live neighbours
    for(let [dx,dy] of NEIGHBOURS){
        let [newX,newY] = get_toroidal_coordinates(posX + dx,posY + dy,cols,rows);
        if(matrix[newX][newY] == 1){
            LNeighbours++;
        }
    }
    return LNeighbours;//returns all the live neighbours of current cell
}

//function to "wrap" the coordinates around the grid
function get_toroidal_coordinates(x,y,width,height){
    let new_x = (x + width)%width;
    let new_y = (y + height)%height;

    return [new_x,new_y];
}