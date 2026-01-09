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
const duration = 120000; //2 minute duration
const NEIGHBOURS = [  //all 8 neighbours of the cell
    [-1,-1],[-1,0],[-1,1],
    [0,-1],         [0,1],
    [1,-1],[1,0],[1,1]
];
const LiveCells = new Set();
let canvasElement;

//====SETUP & INITIALIZATION=====

function setup() {
    
    const container = document.getElementById('game-canvas-container');
    container.innerHTML = '';

    const containerWidth = container.clientWidth || 400; //set canvas drawing buffer size to match its display size in the browser
    const containerHeight = container.clientHeight || 400; //set canvas drawing buffer size to match its display size in the browser
    const availableSize = Math.min(containerWidth, containerHeight);

    cellSize = Math.max(4, Math.floor(availableSize / GRID_SIZE));
    const canvasSize = cellSize * GRID_SIZE;
    
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

function enableMousePress(){
    canPress = true;
}

function disableMousePress(){
    canPress = false;
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
        
        //now calculate grid cell
        let col = Math.round(mouseX / cellSize);
        let row = Math.round(mouseY / cellSize);

        let key = JSON.stringify([col,row]);

        if(grid[col][row] === 0){
            grid[col][row] = 1;
            //add to set
            if(!LiveCells.has(key)){
                LiveCells.add(key);
            }
        }else{
            grid[col][row] = 0;
            //remove from set
            LiveCells.delete(key);
        }
        population = countPopulation();
        updatePopulationDisplay();
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
        disableMousePress();
        
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

        // Auto-stop after duration to ensure that it doesnt just forever keep going
        timeoutID = setTimeout(() => {
            if(intervalID){
                clearInterval(intervalID);
                intervalID = null;
            }
            resetGame();
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
    
    enableMousePress();
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
