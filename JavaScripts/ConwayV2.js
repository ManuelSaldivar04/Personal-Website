//===== GLOBAL VARIABLES ======
let population = 0; // Initialize to 0
let generation = 0;
let grid;
let nextGrid;
let cellSize = 10;
const GRID_SIZE = 30;
let cols = GRID_SIZE, rows = GRID_SIZE;
let canPress = true;
let intervalID = null;
let timeoutID = null;
const duration = 120000;
const NEIGHBOURS = [ 
    [-1,-1],[-1,0],[-1,1],
    [0,-1],[0,1],
    [1,-1],[1,0],[1,1]
];
const LiveCells = new Set();
let canvasElement;

//====SETUP & INITIALIZATION=====

function setup() {
    console.log("Setting up Conway's Game of Life");

    const container = document.getElementById('game-canvas-container');
    container.innerHTML = '';

    const containerWidth = container.clientWidth || 400; //set canvas drawing buffer size to match its display size in the browser
    const containerHeight = container.clientHeight || 400; //set canvas drawing buffer size to match its display size in the browser
    const availableSize = Math.min(containerWidth, containerHeight);

    cellSize = Math.max(4, Math.floor(availableSize / GRID_SIZE));
    const canvasSize = cellSize * GRID_SIZE;
    
    console.log(`Canvas: ${canvasSize}x${canvasSize}, Cell: ${cellSize}px, Grid: ${GRID_SIZE}x${GRID_SIZE}`);

    const canvas = createCanvas(canvasSize, canvasSize);
    canvasElement = canvas.elt;

    canvasElement.width = canvasSize;
    canvasElement.height = canvasSize;

    canvasElement.style.cssText = `
        width: ${canvasSize}px !important;
        height: ${canvasSize}px !important;
        display: block !important;
        margin: 0 auto !important;
        background-color: black;
        image-rendering: pixelated;
    `;
  
    canvas.parent('game-canvas-container');

    // Initialize grids
    grid = make2DArray(cols, rows);
    nextGrid = make2DArray(cols, rows);

    pixelDensity(1);
    
    updatePopulationDisplay(); 
    updateGenerationDisplay();

    // Add resize listener
    window.addEventListener('resize', handleResize);
}

//======UTILITY FUNCTIONS=====

function make2DArray(cols, rows) {
    let arr = new Array(cols);
    for (let i = 0; i < arr.length; i++) {
        arr[i] = new Array(rows).fill(0);
    }
    return arr;
}

function NumLiveNeighbours(x, y) {
    let count = 0;
    for(let [dx, dy] of NEIGHBOURS) {
        let nx = (x + dx + cols) % cols;
        let ny = (y + dy + rows) % rows;
        if(grid[nx][ny] == 1) {
            count++;
        }
    }
    return count;
}

function countPopulation(){
    return LiveCells.size;
}

function getCurrentLiveCells(){
    return Array.from(LiveCells).map(str => JSON.parse(str));
}

function updatePopulationDisplay(){
    const element = document.getElementById("dynamic-population");
    if (element) element.textContent = population;
}

function updateGenerationDisplay(){
    const element = document.getElementById("dynamic-generation");
    if (element) element.textContent = generation;
}

//======MOUSE HANDLING=======

//mouse clicked function
function mousePressed(){
    //if not within bounds then return
    if(mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height){
        return;//click was outside the canvas do
    }
    //if cant press then return
    if(!canPress)return; 
        
        //get the actual canvas element
        const canvas = document.querySelector('canvas');
        const rect = canvas.getBoundingClientRect();

        //get the device pixel ratio
        const dpr = window.devicePixelRatio || 1;
        //get the scaling factor
         const scaleX = canvas.width / (rect.width * dpr); //400 / actual display width
         const scaleY = canvas.height / (rect.height * dpr);
        const scaleXo = canvas.width / rect.width;
        const scaleYo = canvas.height / rect.height;

        //conver mouse coordinates to canvas pixel coordinates
        const canvasX = mouseX * scaleXo;//scaleX;
        const canvasY = mouseY* scaleYo;//scaleY;

        //now calculate grid cell
        // let col = floor(canvasX / cellSize);
        // let row = floor(canvasY / cellSize);
        let col = Math.round(mouseX / cellSize);
        let row = Math.round(mouseY / cellSize);
        const rawX = event.clientX - rect.left;
        const rawY = event.clientY - rect.top;

        //let col = Math.floor(rawX / cellSize);
        //let row = Math.floor(rawY / cellSize);
        
    //    let col = floor(mouseX / SQUARE_SIZE);
    //    let row = floor (mouseY / SQUARE_SIZE);

        //col = constrain(col,0,cols-1);
        //row = constrain(row,0,rows-1);

        let key = JSON.stringify([col,row]);

        if(grid[col][row] === 0){
            grid[col][row] = 1;
            //add to set
            if(!LiveCells.has(key)){
                LiveCells.add(key);
                console.log("Added to Set: Row: "+row+" col: "+col);
                console.log(`The cell size is: ${cellSize} and DPR ${dpr}`);
                console.log(`original scaleX: ${canvas.width} / ${rect.width}*${dpr} = ${scaleX}`);
                console.log(`original scaleY: ${canvas.height} / ${rect.height}*${dpr} = ${scaleY}`);
                console.log(`new scaleX:${scaleXo}`);
                console.log(`new scaleY:${scaleYo}`);
                console.log(`canvasX = ${mouseX} * ${scaleX}`);
                console.log(`canvasY = ${mouseY} * ${scaleY}`);

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
        //drawGrid();

        /* ====DEBUGGING */
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        console.log(`viewport width:${viewportWidth}px, viewport height:${viewportHeight}px, DPR:${dpr}`);
     
}

//======DRAW FUNCTION=======

function draw() {
    // Clear with black background
    background(0);
    
    // Draw grid lines (gray)
    stroke(50);
    strokeWeight(1);
    
    // Vertical lines
    for(let x = 0; x <= width; x += cellSize) {
        line(x, 0, x, height);
    }
    
    // Horizontal lines
    for(let y = 0; y <= height; y += cellSize) {
        line(0, y, width, y);
    }
    
    // Draw live cells (white)
    noStroke();
    fill(255);
    LiveCells.forEach(key => {
        const [i, j] = JSON.parse(key);
        const x = i * cellSize;
        const y = j * cellSize;
        rect(x, y, cellSize, cellSize);
    });
}

//=====GAME FUNCTIONS=====

function startGame(){
    if(intervalID === null){
        console.log("Starting game...");
        canPress = false;
        
        intervalID = setInterval(() => {
            // Get all cells to check (live cells and their neighbors)
            const cellsToCheck = new Set();
            const CurrentLiveCells = getCurrentLiveCells();

            CurrentLiveCells.forEach(([col, row]) => {
                cellsToCheck.add(JSON.stringify([col, row]));
                
                // Add all 8 neighbours
                for(let [dx, dy] of NEIGHBOURS){
                    let nx = (col + dx + cols) % cols;
                    let ny = (row + dy + rows) % rows;
                    cellsToCheck.add(JSON.stringify([nx, ny]));
                }
            });
            
            // Calculate next generation
            const nextLiveCells = new Set();

            cellsToCheck.forEach(key => {
                const [x, y] = JSON.parse(key);
                const isAlive = grid[x][y] === 1;
                const liveNeighbours = NumLiveNeighbours(x, y);

                if(isAlive){
                    // Underpopulation or overpopulation
                    if(liveNeighbours < 2 || liveNeighbours > 3){
                        nextGrid[x][y] = 0;
                    }
                    // Survival
                    else if(liveNeighbours === 2 || liveNeighbours === 3){
                        nextGrid[x][y] = 1;
                        nextLiveCells.add(key);
                    }
                } else {
                    // Reproduction
                    if(liveNeighbours === 3){
                        nextGrid[x][y] = 1;
                        nextLiveCells.add(key);
                    }
                }
            });
            
            // Swap grids for next frame
            const temp = grid;
            grid = nextGrid;
            nextGrid = temp;
            
            // Clear nextGrid for next iteration
            for(let i = 0; i < cols; i++){
                for(let j = 0; j < rows; j++){
                    nextGrid[i][j] = 0;
                }
            }
            
            // Update live cells set
            LiveCells.clear();
            nextLiveCells.forEach(key => LiveCells.add(key));
            
            // Update statistics
            population = countPopulation();
            generation++;
            updateGenerationDisplay();
            updatePopulationDisplay();
            
        }, 100); // 100ms = 10 frames per second

        // Auto-stop after duration
        timeoutID = setTimeout(() => {
            if(intervalID){
                clearInterval(intervalID);
                intervalID = null;
            }
            resetGame();
            console.log(`Game ended after ${duration/1000} seconds`);
        }, duration);
    }
}

function pauseGame(){
    if(intervalID){
        clearInterval(intervalID);
        intervalID = null;
    }
    
    if(timeoutID){
        clearTimeout(timeoutID);
        timeoutID = null;
    }
    
    canPress = true;
    console.log("Game paused");
}

function resetGame(){
    pauseGame();
    
    generation = 0;
    population = 0;
    
    // Clear grids
    if(grid){
        for(let i = 0; i < cols; i++){
            for(let j = 0; j < rows; j++){
                grid[i][j] = 0;
                if(nextGrid) nextGrid[i][j] = 0;
            }
        }
    }
    
    // Clear live cells
    LiveCells.clear();
    
    updateGenerationDisplay();
    updatePopulationDisplay();
    
    console.log("Game reset");
}

//===== RESPONSIVE HANDLING ======

function handleResize() {
    const container = document.getElementById('game-canvas-container');
    const containerWidth = container.clientWidth || 400;
    const containerHeight = container.clientHeight || 400;
    const availableSize = Math.min(containerWidth, containerHeight);
    
    const newCellSize = Math.max(4, Math.floor(availableSize / GRID_SIZE));
    const newCanvasSize = newCellSize * GRID_SIZE;
    
    if(Math.abs(newCellSize - cellSize) >= 1) {
        console.log(`Resizing to ${newCanvasSize}x${newCanvasSize}, cell size: ${newCellSize}px`);
        
        // Store current live cells
        const oldLiveCells = Array.from(LiveCells).map(str => JSON.parse(str));
        
        // Update cell size
        cellSize = newCellSize;
        
        // Resize canvas
        resizeCanvas(newCanvasSize, newCanvasSize);
        
        // Update canvas element attributes
        canvasElement.width = newCanvasSize;
        canvasElement.height = newCanvasSize;
        canvasElement.style.width = `${newCanvasSize}px`;
        canvasElement.style.height = `${newCanvasSize}px`;
        
        // Recreate grids and restore live cells
        const newGrid = make2DArray(cols, rows);
        const newNextGrid = make2DArray(cols, rows);
        
        LiveCells.clear();
        oldLiveCells.forEach(([col, row]) => {
            if(col >= 0 && col < cols && row >= 0 && row < rows) {
                newGrid[col][row] = 1;
                LiveCells.add(JSON.stringify([col, row]));
            }
        });
        
        grid = newGrid;
        nextGrid = newNextGrid;
        
        population = LiveCells.size;
        updatePopulationDisplay();
    }
}

//===== INITIALIZATION ======

window.addEventListener('load', () => {
    setTimeout(() => {
        if(typeof setup === 'function') {
            setup();
            
            // Add test pattern
            setTimeout(() => {
                console.log("Adding test pattern...");
                
                const testPattern = [
                    [1, 0], [2, 1], [0, 2], [1, 2], [2, 2]
                ];
                
                testPattern.forEach(([col, row]) => {
                    if(col < cols && row < rows) {
                        grid[col][row] = 1;
                        LiveCells.add(JSON.stringify([col, row]));
                    }
                });
                
                population = LiveCells.size;
                updatePopulationDisplay();
                
                console.log("Test pattern added. You should see a glider pattern.");
            }, 500);
        }
    }, 100);
});