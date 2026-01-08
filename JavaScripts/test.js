//===== GLOBAL VARIABLES ======
let population = 0;
let generation = 0;
let grid;
let nextGrid;
let cellSize; // Dynamically calculated based on screen size
const GRID_SIZE = 30; // Fixed 30x30 grid on ALL devices
let cols = GRID_SIZE, rows = GRID_SIZE;
let canPress = true;
let intervalID = null;
let timeoutID = null;
const duration = 120000; // 2 minutes
let gridGraphics;
const NEIGHBOURS = [ 
    [-1,-1],[-1,0],[-1,1],
    [0,-1],[0,1],
    [1,-1],[1,0],[1,1]
];
const LiveCells = new Set();

//===== UTILITY FUNCTIONS ======

// Create a 2D array
function make2DArray(cols, rows) {
    let arr = new Array(cols);
    for (let i = 0; i < arr.length; i++) {
        arr[i] = new Array(rows).fill(0);
    }
    return arr;
}

// Constrain a value between min and max
function constrain(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// Count live neighbours for a cell
function countLiveNeighbours(x, y) {
    let count = 0;
    for (let [dx, dy] of NEIGHBOURS) {
        const nx = (x + dx + cols) % cols;
        const ny = (y + dy + rows) % rows;
        if (grid[nx][ny] === 1) count++;
    }
    return count;
}

// Get toroidal (wrapping) coordinates
function getToroidalCoordinates(x, y, width, height) {
    let new_x = (x + width) % width;
    let new_y = (y + height) % height;
    return [new_x, new_y];
}

//===== SETUP & RESIZE HANDLING ======

function setup() {
    console.log("Setting up responsive Conway's Game of Life");
    
    // Get the container
    const container = document.getElementById('game-canvas-container');
    
    // Get parent wrapper to determine available space
    const wrapper = container.closest('.canvas-wrapper') || container.parentElement;
    
    if (!wrapper) {
        console.error("Could not find canvas wrapper!");
        // Fallback: create a wrapper
        const newWrapper = document.createElement('div');
        newWrapper.className = 'canvas-wrapper';
        newWrapper.style.cssText = 'width: 100%; max-width: 500px; margin: 0 auto; aspect-ratio: 1/1;';
        container.parentNode.insertBefore(newWrapper, container);
        wrapper = newWrapper;
        wrapper.appendChild(container);
    }
    
    // Calculate initial canvas size
    const wrapperRect = wrapper.getBoundingClientRect();
    const availableSize = Math.min(wrapperRect.width, wrapperRect.height);
    
    // Calculate cell size (ensure minimum of 4px for visibility)
    cellSize = Math.max(4, Math.floor(availableSize / GRID_SIZE));
    const canvasSize = cellSize * GRID_SIZE;
    
    console.log(`Initial setup: Available=${Math.round(availableSize)}px, CellSize=${cellSize}px, Canvas=${canvasSize}x${canvasSize}`);
    
    // Create canvas
    const canvas = createCanvas(canvasSize, canvasSize);
    const canvasEl = canvas.elt;
    
    // Set canvas styles
    canvasEl.style.cssText = `
        width: 100%;
        height: 100%;
        display: block;
        margin: 0 auto;
        image-rendering: pixelated;
        image-rendering: crisp-edges;
    `;
    
    canvas.parent('game-canvas-container');
    
    // Initialize grids
    grid = make2DArray(cols, rows);
    nextGrid = make2DArray(cols, rows);
    
    // Create grid graphics buffer
    gridGraphics = createGraphics(width, height);
    drawGridLines();
    
    // Initial draw
    background(0);
    image(gridGraphics, 0, 0);
    
    // Update displays
    updatePopulationDisplay();
    updateGenerationDisplay();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Initial debug
    console.log(`Setup complete: Grid=${cols}x${rows}, Canvas=${width}x${height}`);
}

// Handle window resize
function handleResize() {
    if (!grid) return;
    
    // Get container and wrapper
    const container = document.getElementById('game-canvas-container');
    const wrapper = container.closest('.canvas-wrapper') || container.parentElement;
    
    if (!wrapper) return;
    
    const wrapperRect = wrapper.getBoundingClientRect();
    const availableSize = Math.min(wrapperRect.width, wrapperRect.height);
    
    // Calculate new cell size
    const newCellSize = Math.max(4, Math.floor(availableSize / GRID_SIZE));
    const newCanvasSize = newCellSize * GRID_SIZE;
    
    // Only resize if cell size changed by at least 1 pixel
    if (Math.abs(newCellSize - cellSize) >= 1) {
        console.log(`Resizing: New cell size=${newCellSize}px, Canvas=${newCanvasSize}x${newCanvasSize}`);
        
        // Store current live cells (relative positions)
        const oldLiveCells = Array.from(LiveCells).map(str => JSON.parse(str));
        
        // Update cell size and resize canvas
        cellSize = newCellSize;
        resizeCanvas(newCanvasSize, newCanvasSize);
        
        // Recreate grids (maintain same dimensions)
        const newGrid = make2DArray(cols, rows);
        const newNextGrid = make2DArray(cols, rows);
        
        // Clear current live cells
        LiveCells.clear();
        
        // Transfer old live cells to new grid
        oldLiveCells.forEach(([col, row]) => {
            if (col >= 0 && col < cols && row >= 0 && row < rows) {
                newGrid[col][row] = 1;
                LiveCells.add(JSON.stringify([col, row]));
            }
        });
        
        // Update grid references
        grid = newGrid;
        nextGrid = newNextGrid;
        
        // Redraw grid lines
        gridGraphics = createGraphics(width, height);
        drawGridLines();
        
        // Redraw
        background(0);
        image(gridGraphics, 0, 0);
        drawLiveCells();
        
        // Update population display
        population = LiveCells.size;
        updatePopulationDisplay();
    }
}

//===== DRAWING FUNCTIONS ======

// Draw grid lines on the graphics buffer
function drawGridLines() {
    gridGraphics.background(0);
    gridGraphics.stroke(50);
    gridGraphics.strokeWeight(1);
    
    // Draw vertical lines
    for (let x = 0; x <= width; x += cellSize) {
        gridGraphics.line(x, 0, x, height);
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= height; y += cellSize) {
        gridGraphics.line(0, y, width, y);
    }
}

// Draw live cells
function drawLiveCells() {
    noStroke();
    fill(255);
    
    LiveCells.forEach(key => {
        const [i, j] = JSON.parse(key);
        const x = i * cellSize;
        const y = j * cellSize;
        rect(x, y, cellSize, cellSize);
    });
}

// Main draw function (called by p5.js animation loop)
function draw() {
    // Static grid is already drawn in setup/resize
    // Just draw live cells on top
    drawLiveCells();
}

//===== MOUSE/TAP HANDLING ======

function mousePressed() {
    // Check if click is inside canvas
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
        return;
    }
    
    if (!canPress) return;
    
    // Calculate grid cell from mouse coordinates
    let col = Math.floor(mouseX / cellSize);
    let row = Math.floor(mouseY / cellSize);
    
    // Ensure within bounds
    col = constrain(col, 0, cols - 1);
    row = constrain(row, 0, rows - 1);
    
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
    redraw();
}

//===== GAME LOGIC FUNCTIONS ======

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
    if (!grid) return;
    
    const cellsToCheck = new Set();
    
    // Get all live cells and their neighbors
    LiveCells.forEach(key => {
        const [col, row] = JSON.parse(key);
        cellsToCheck.add(key);
        
        // Add all 8 neighbors
        for (let [dx, dy] of NEIGHBOURS) {
            const [nx, ny] = getToroidalCoordinates(col + dx, row + dy, cols, rows);
            cellsToCheck.add(JSON.stringify([nx, ny]));
        }
    });
    
    const nextLiveCells = new Set();
    
    // Apply Conway's rules
    cellsToCheck.forEach(key => {
        const [x, y] = JSON.parse(key);
        const isAlive = grid[x][y] === 1;
        const liveNeighbours = countLiveNeighbours(x, y);
        
        if (isAlive) {
            // Rule 1 & 3: Underpopulation or overpopulation
            if (liveNeighbours < 2 || liveNeighbours > 3) {
                nextGrid[x][y] = 0; // Dies
            }
            // Rule 2: Survival
            else if (liveNeighbours === 2 || liveNeighbours === 3) {
                nextGrid[x][y] = 1; // Lives
                nextLiveCells.add(key);
            }
        } else {
            // Rule 4: Reproduction
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
    if (gridGraphics) {
        background(0);
        image(gridGraphics, 0, 0);
    }
    
    console.log("Game reset");
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

// Initialize when the page loads
window.addEventListener('load', () => {
    // Small delay to ensure all CSS is loaded
    setTimeout(() => {
        if (typeof setup === 'function') {
            setup();
            console.log("Conway's Game of Life initialized successfully");
        }
    }, 100);
});

// For p5.js continuous animation loop
function draw() {
    // Empty - we handle drawing manually in response to events
    // This is needed for p5.js to work properly
    background(0);

    image(gridGraphics,0,0);

    drawLiveCells();
}