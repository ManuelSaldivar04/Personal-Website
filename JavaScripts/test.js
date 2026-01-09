//===== GLOBAL VARIABLES ======
let population = 0;
let generation = 0;
let grid;
let nextGrid;
let cellSize = 10; // Default, will adjust based on screen
const GRID_SIZE = 30; // Fixed 30x30 grid on all devices
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
let canvasElement; // Reference to the canvas DOM element

//===== SETUP & INITIALIZATION ======

function setup() {
    console.log("Setting up Conway's Game of Life");
    
    // Get container
    const container = document.getElementById('game-canvas-container');
    
    // Clear any existing content
    container.innerHTML = '';
    
    // Get available space
    const containerWidth = container.clientWidth || 400;
    const containerHeight = container.clientHeight || 400;
    const availableSize = Math.min(containerWidth, containerHeight);
    
    // Calculate cell size (minimum 4px for visibility)
    cellSize = Math.max(4, Math.floor(availableSize / GRID_SIZE));
    const canvasSize = cellSize * GRID_SIZE;
    
    console.log(`Canvas size: ${canvasSize}x${canvasSize}, Cell size: ${cellSize}px, Grid: ${GRID_SIZE}x${GRID_SIZE}`);
    
    // Create canvas with exact pixel dimensions
    const canvas = createCanvas(canvasSize, canvasSize);
    canvasElement = canvas.elt; // Store reference to DOM element
    
    // Set canvas element attributes directly
    canvasElement.width = canvasSize;
    canvasElement.height = canvasSize;
    
    // Set canvas styles to prevent any scaling
    canvasElement.style.cssText = `
        width: ${canvasSize}px !important;
        height: ${canvasSize}px !important;
        min-width: ${canvasSize}px !important;
        min-height: ${canvasSize}px !important;
        max-width: ${canvasSize}px !important;
        max-height: ${canvasSize}px !important;
        display: block !important;
        margin: 0 auto !important;
        padding: 0 !important;
        border: none !important;
        image-rendering: pixelated;
        image-rendering: crisp-edges;
        transform: none !important;
        position: static !important;
        background-color: black;
    `;
    
    canvas.parent('game-canvas-container');
    
    // Initialize grids
    grid = make2DArray(cols, rows);
    nextGrid = make2DArray(cols, rows);
    
    // Draw initial grid
    drawGrid();
    
    // Update displays
    updatePopulationDisplay();
    updateGenerationDisplay();
    
    // Add debug click handler
    setupDebugClick();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    console.log("Setup complete. Click on cells to toggle them.");
}

//===== DEBUG FUNCTION ======

function setupDebugClick() {
    // Add a separate click listener for debugging
    canvasElement.addEventListener('click', function(event) {
        const rect = canvasElement.getBoundingClientRect();
        
        console.log('=== DEBUG CLICK INFO ===');
        console.log('Canvas internal size:', canvasElement.width, 'x', canvasElement.height);
        console.log('Canvas displayed size:', rect.width, 'x', rect.height);
        console.log('Canvas position (rect):', rect.left, rect.top);
        console.log('Mouse event position:', event.clientX, event.clientY);
        console.log('Cell size:', cellSize);
        console.log('Grid dimensions:', cols, 'x', rows);
        
        // Calculate the cell based on event coordinates
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        const col = Math.floor(mouseX / cellSize);
        const row = Math.floor(mouseY / cellSize);
        
        console.log('Calculated cell:', col, row);
        console.log('Cell boundaries: x=' + (col*cellSize) + '-' + ((col+1)*cellSize) + 
                    ', y=' + (row*cellSize) + '-' + ((row+1)*cellSize));
        console.log('========================');
    });
}

//===== UTILITY FUNCTIONS ======

function make2DArray(cols, rows) {
    let arr = new Array(cols);
    for (let i = 0; i < arr.length; i++) {
        arr[i] = new Array(rows).fill(0);
    }
    return arr;
}

function countLiveNeighbours(x, y) {
    let count = 0;
    for (let [dx, dy] of NEIGHBOURS) {
        const nx = (x + dx + cols) % cols;
        const ny = (y + dy + rows) % rows;
        if (grid[nx][ny] === 1) count++;
    }
    return count;
}

function getToroidalCoordinates(x, y, width, height) {
    let new_x = (x + width) % width;
    let new_y = (y + height) % height;
    return [new_x, new_y];
}

//===== DRAWING FUNCTIONS ======

function drawGrid() {
    // Clear the canvas
    background(0);
    
    // Draw grid lines
    stroke(50);
    strokeWeight(1);
    
    // Vertical lines
    for (let x = 0; x <= width; x += cellSize) {
        line(x, 0, x, height);
    }
    
    // Horizontal lines
    for (let y = 0; y <= height; y += cellSize) {
        line(0, y, width, y);
    }
    
    // Draw live cells
    drawLiveCells();
}

function drawLiveCells() {
    noStroke();
    fill(255); // White
    
    LiveCells.forEach(key => {
        const [i, j] = JSON.parse(key);
        const x = i * cellSize;
        const y = j * cellSize;
        rect(x, y, cellSize, cellSize);
    });
}

//===== MOUSE HANDLING ======

function mousePressed() {
    // Check if click is inside canvas
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
        return;
    }
    if (!canPress) return;
    
    // Get the canvas position on screen
    const rect = canvasElement.getBoundingClientRect();
    
    // Calculate mouse position relative to canvas
    // event.clientX/Y are screen coordinates, rect.left/top are canvas position
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    
    // Calculate which cell was clicked
    let col = Math.floor(mouseX / cellSize);
    let row = Math.floor(mouseY / cellSize);
    
    // Ensure within bounds
    col = Math.max(0, Math.min(col, cols - 1));
    row = Math.max(0, Math.min(row, rows - 1));
    
    console.log(`Clicked cell: [${col}, ${row}]`);
    
    // Toggle cell state
    const key = JSON.stringify([col, row]);
    
    if (grid[col][row] === 0) {
        grid[col][row] = 1;
        LiveCells.add(key);
        console.log(`Added cell at [${col}, ${row}]`);
    } else {
        grid[col][row] = 0;
        LiveCells.delete(key);
        console.log(`Removed cell at [${col}, ${row}]`);
    }
    
    // Update and redraw
    population = LiveCells.size;
    updatePopulationDisplay();
    drawGrid();
}

//===== GAME FUNCTIONS ======

function startGame() {
    if (intervalID === null) {
        console.log("Starting game...");
        canPress = false;
        
        intervalID = setInterval(() => {
            updateGeneration();
        }, 100); // 10 frames per second
        
        // Auto-stop after duration
        timeoutID = setTimeout(() => {
            if (intervalID) {
                clearInterval(intervalID);
                intervalID = null;
            }
            resetGame();
            console.log(`Game ended after ${duration/1000} seconds`);
        }, duration);
    }
}

function updateGeneration() {
    const cellsToCheck = new Set();
    
    // Get all live cells and their neighbors
    LiveCells.forEach(key => {
        const [col, row] = JSON.parse(key);
        cellsToCheck.add(key);
        
        for (let [dx, dy] of NEIGHBOURS) {
            let [nx, ny] = getToroidalCoordinates(col + dx, row + dy, cols, rows);
            cellsToCheck.add(JSON.stringify([nx, ny]));
        }
    });
    
    const nextLiveCells = new Set();
    
    cellsToCheck.forEach(key => {
        const [x, y] = JSON.parse(key);
        const isAlive = grid[x][y] === 1;
        const liveNeighbours = countLiveNeighbours(x, y);
        
        if (isAlive) {
            if (liveNeighbours < 2 || liveNeighbours > 3) {
                nextGrid[x][y] = 0; // Dies
            } else if (liveNeighbours === 2 || liveNeighbours === 3) {
                nextGrid[x][y] = 1; // Lives
                nextLiveCells.add(key);
            }
        } else {
            if (liveNeighbours === 3) {
                nextGrid[x][y] = 1; // Becomes alive
                nextLiveCells.add(key);
            }
        }
    });
    
    // Swap grids
    const temp = grid;
    grid = nextGrid;
    nextGrid = temp;
    
    // Clear nextGrid for next iteration
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            nextGrid[i][j] = 0;
        }
    }
    
    // Update live cells set
    LiveCells.clear();
    nextLiveCells.forEach(key => LiveCells.add(key));
    
    // Update statistics
    population = LiveCells.size;
    generation++;
    
    updatePopulationDisplay();
    updateGenerationDisplay();
    
    // Redraw
    drawGrid();
}

function pauseGame() {
    if (intervalID !== null) {
        clearInterval(intervalID);
        intervalID = null;
    }
    
    if (timeoutID !== null) {
        clearTimeout(timeoutID);
        timeoutID = null;
    }
    
    canPress = true;
    console.log("Game paused");
}

function resetGame() {
    pauseGame();
    
    generation = 0;
    population = 0;
    
    // Clear grids
    if (grid) {
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                grid[i][j] = 0;
                if (nextGrid) nextGrid[i][j] = 0;
            }
        }
    }
    
    // Clear live cells
    LiveCells.clear();
    
    // Update displays
    updateGenerationDisplay();
    updatePopulationDisplay();
    
    // Redraw empty grid
    drawGrid();
    
    console.log("Game reset");
}

//===== RESPONSIVE HANDLING ======

function handleResize() {
    // Get container
    const container = document.getElementById('game-canvas-container');
    
    // Get available space
    const containerWidth = container.clientWidth || 400;
    const containerHeight = container.clientHeight || 400;
    const availableSize = Math.min(containerWidth, containerHeight);
    
    // Calculate new cell size
    const newCellSize = Math.max(4, Math.floor(availableSize / GRID_SIZE));
    const newCanvasSize = newCellSize * GRID_SIZE;
    
    // Only resize if cell size changed significantly (at least 1 pixel)
    if (Math.abs(newCellSize - cellSize) >= 1) {
        console.log(`Resizing: New cell size = ${newCellSize}px, New canvas = ${newCanvasSize}x${newCanvasSize}`);
        
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
        
        // Recreate grids
        const newGrid = make2DArray(cols, rows);
        const newNextGrid = make2DArray(cols, rows);
        
        // Clear and restore live cells
        LiveCells.clear();
        oldLiveCells.forEach(([col, row]) => {
            if (col >= 0 && col < cols && row >= 0 && row < rows) {
                newGrid[col][row] = 1;
                LiveCells.add(JSON.stringify([col, row]));
            }
        });
        
        // Update grid references
        grid = newGrid;
        nextGrid = newNextGrid;
        
        // Redraw
        drawGrid();
        
        // Update population display
        population = LiveCells.size;
        updatePopulationDisplay();
    }
}

//===== DISPLAY FUNCTIONS ======

function updatePopulationDisplay() {
    const element = document.getElementById("dynamic-population");
    if (element) {
        element.textContent = population;
    }
}

function updateGenerationDisplay() {
    const element = document.getElementById("dynamic-generation");
    if (element) {
        element.textContent = generation;
    }
}

function enableMousePress() {
    canPress = true;
}

function disableMousePress() {
    canPress = false;
}

//===== INITIALIZATION ======

// Initialize when page loads
window.addEventListener('load', () => {
    // Wait for CSS to load and DOM to be ready
    setTimeout(() => {
        if (typeof setup === 'function') {
            setup();
            
            // Add a test pattern to verify drawing works
            setTimeout(() => {
                console.log("Adding test pattern...");
                
                // Add a simple pattern (glider) in the top-left corner
                const testPattern = [
                    [1, 0], [2, 1], [0, 2], [1, 2], [2, 2]
                ];
                
                testPattern.forEach(([col, row]) => {
                    if (col < cols && row < rows) {
                        grid[col][row] = 1;
                        LiveCells.add(JSON.stringify([col, row]));
                    }
                });
                
                population = LiveCells.size;
                updatePopulationDisplay();
                drawGrid();
                
                console.log("Test pattern added. You should see 5 white cells forming a glider pattern.");
            }, 500);
        }
    }, 100);
});

// p5.js draw function (called automatically by p5.js)
function draw() {
    // We handle all drawing manually in response to events
    // This function is needed for p5.js but remains empty
    background(0);

    image(gridGraphics,0,0);

    drawLiveCells();
}