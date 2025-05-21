// --- Variabili Globali ---
const N = 8; // Dimensione del blocco (8x8)
const FULL_PATTERN_SIZE = 16; // Dimensione del pattern originale completo (16x16)

// Matrici per i dati dell'immagine e della DCT
let currentActiveInputBlock = Array(N).fill(null).map(() => Array(N).fill(0));
let dctMatrix = Array(N).fill(null).map(() => Array(N).fill(0));
let quantizedMatrix = Array(N).fill(null).map(() => Array(N).fill(0));
let outputMatrix = Array(N).fill(null).map(() => Array(N).fill(0));

let allBasisFunctions = Array(N).fill(null).map(() => Array(N).fill(null).map(() => Array(N).fill(null).map(() => Array(N).fill(0))));

let originalPattern16x16 = Array(FULL_PATTERN_SIZE).fill(null).map(() => Array(FULL_PATTERN_SIZE).fill(0));
let originalBlocks = Array(4).fill(null).map(() => Array(N).fill(null).map(() => Array(N).fill(0)));
let selectedOriginalBlockIndex = 0;

// Variabili per il layout e le dimensioni nel canvas
let blockDisplaySize = 120; // Valore base, verrà modificato in updateDimensionsBasedOnScale
let cellDisplaySize = blockDisplaySize / N;
let padding = 15;
let labelHeight = 20;
let subLabelHeight = 15;

let basisCellSize;
let basisBlockDisplaySize;
let basisInterBlockPadding;

let originalAreaStartX, basisGridStartX_Global, reconstructedBlockStartX_Global;
let originalAreaWidth_Global, basisGridActualContentWidth, reconstructedBlockWidth_Global;
let basisGridActualContentHeight;

// Elementi HTML
let quantizationSlider;
let hoverInfoDiv;
let canvasContainer;

let minDctCoeffGlobal = -1024;
let maxDctCoeffGlobal = 1024;

let hoveredBasisU = -1;
let hoveredBasisV = -1;
let highlightColor;
let dcHighlightColor;
let selectedBlockHighlightColor;
let activeBasisFunctionsCount = N * N;

let canvasWidthGlobal, canvasHeightGlobal;


// --- Funzioni Logiche per DCT e Pattern ---
function C_val(k) { return (k === 0) ? (1.0 / Math.sqrt(2.0)) : 1.0; }

function generateAllBasisFunctions() {
    for (let u = 0; u < N; u++) {
        for (let v = 0; v < N; v++) {
            for (let x = 0; x < N; x++) {
                for (let y = 0; y < N; y++) {
                    allBasisFunctions[u][v][x][y] = Math.cos((2 * x + 1) * u * Math.PI / (2 * N)) *
                                                     Math.cos((2 * y + 1) * v * Math.PI / (2 * N));
                }
            }
        }
    }
}

function initializeRPixelArtPattern() {
    const B = 0;  
    const W = 255;
    const xShift = 2; 

    for (let i = 0; i < FULL_PATTERN_SIZE; i++) {
        for (let j = 0; j < FULL_PATTERN_SIZE; j++) {
            originalPattern16x16[i][j] = B;
        }
    }

    for (let y = 0; y < 16; y++) {
        if (y < originalPattern16x16.length) { 
            if ((1 + xShift) >= 0 && (1 + xShift) < originalPattern16x16[y].length) originalPattern16x16[y][1 + xShift] = W;
            if ((2 + xShift) >= 0 && (2 + xShift) < originalPattern16x16[y].length) originalPattern16x16[y][2 + xShift] = W;
        }
    }

    for (let x = 2; x <= 7; x++) if (0 < originalPattern16x16.length && (x + xShift) >= 0 && (x + xShift) < originalPattern16x16[0].length) originalPattern16x16[0][x + xShift] = W;
   
    if (1 < originalPattern16x16.length) {
        if ((2 + xShift) >= 0 && (2 + xShift) < originalPattern16x16[1].length) originalPattern16x16[1][2 + xShift] = W;
        if ((7 + xShift) >= 0 && (7 + xShift) < originalPattern16x16[1].length) originalPattern16x16[1][7 + xShift] = W;
        if ((8 + xShift) >= 0 && (8 + xShift) < originalPattern16x16[1].length) originalPattern16x16[1][8 + xShift] = W;
    }
     if (2 < originalPattern16x16.length) {
        if ((2 + xShift) >= 0 && (2 + xShift) < originalPattern16x16[2].length) originalPattern16x16[2][2 + xShift] = W;
        if ((8 + xShift) >= 0 && (8 + xShift) < originalPattern16x16[2].length) originalPattern16x16[2][8 + xShift] = W;
        if ((9 + xShift) >= 0 && (9 + xShift) < originalPattern16x16[2].length) originalPattern16x16[2][9 + xShift] = W;
    }
    if (3 < originalPattern16x16.length) {
        if ((2 + xShift) >= 0 && (2 + xShift) < originalPattern16x16[3].length) originalPattern16x16[3][2 + xShift] = W;
        if ((8 + xShift) >= 0 && (8 + xShift) < originalPattern16x16[3].length) originalPattern16x16[3][8 + xShift] = W;
        if ((9 + xShift) >= 0 && (9 + xShift) < originalPattern16x16[3].length) originalPattern16x16[3][9 + xShift] = W;
    }
    if (4 < originalPattern16x16.length) {
        if ((2 + xShift) >= 0 && (2 + xShift) < originalPattern16x16[4].length) originalPattern16x16[4][2 + xShift] = W;
        if ((7 + xShift) >= 0 && (7 + xShift) < originalPattern16x16[4].length) originalPattern16x16[4][7 + xShift] = W;
        if ((8 + xShift) >= 0 && (8 + xShift) < originalPattern16x16[4].length) originalPattern16x16[4][8 + xShift] = W;
    }
    for (let x = 2; x <= 7; x++) if (5 < originalPattern16x16.length && (x + xShift) >= 0 && (x + xShift) < originalPattern16x16[5].length) originalPattern16x16[5][x + xShift] = W;
   
    if (6 < originalPattern16x16.length) {
        if ((3 + xShift) >= 0 && (3 + xShift) < originalPattern16x16[6].length) originalPattern16x16[6][3 + xShift] = W;
        if ((4 + xShift) >= 0 && (4 + xShift) < originalPattern16x16[6].length) originalPattern16x16[6][4 + xShift] = W;
    }

    const legPattern = [
        {y: 7, xCoords: [4,5]}, {y: 8, xCoords: [5,6]},
        {y: 9, xCoords: [6,7]}, {y: 10, xCoords: [7,8]},
        {y: 11, xCoords: [8,9]}, {y: 12, xCoords: [9,10]},
        {y: 13, xCoords: [10,11]}, {y: 14, xCoords: [11,12]},
        {y: 15, xCoords: [12,13]}
    ];

    legPattern.forEach(point => {
        if (point.y < originalPattern16x16.length) {
            point.xCoords.forEach(xCoord => {
                if ((xCoord + xShift) >= 0 && (xCoord + xShift) < originalPattern16x16[point.y].length) {
                    originalPattern16x16[point.y][xCoord + xShift] = W;
                }
            });
        }
    });

    for (let r_block = 0; r_block < 2; r_block++) { 
        for (let c_block = 0; c_block < 2; c_block++) { 
            let blockIndex = r_block * 2 + c_block;
            for (let i_pixel = 0; i_pixel < N; i_pixel++) { 
                for (let j_pixel = 0; j_pixel < N; j_pixel++) { 
                    originalBlocks[blockIndex][i_pixel][j_pixel] = originalPattern16x16[r_block * N + i_pixel][c_block * N + j_pixel];
                }
            }
        }
    }
    setCurrentActiveInputBlock(selectedOriginalBlockIndex); 
}


function setCurrentActiveInputBlock(index) {
    selectedOriginalBlockIndex = index;
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            currentActiveInputBlock[i][j] = originalBlocks[selectedOriginalBlockIndex][i][j];
        }
    }
}

function performDCT() {
    minDctCoeffGlobal=Infinity; maxDctCoeffGlobal=-Infinity; 
    for(let u=0; u<N; u++){ for(let v=0; v<N; v++){
        let sum = 0;
        for(let x=0; x<N; x++){ for(let y=0; y<N; y++){
            sum += (currentActiveInputBlock[x][y] - 128) * Math.cos((2*x+1)*u*Math.PI/(2*N)) * Math.cos((2*y+1)*v*Math.PI/(2*N));
        }}
        dctMatrix[u][v] = 0.25 * C_val(u) * C_val(v) * sum;
        if(dctMatrix[u][v] < minDctCoeffGlobal) minDctCoeffGlobal = dctMatrix[u][v];
        if(dctMatrix[u][v] > maxDctCoeffGlobal) maxDctCoeffGlobal = dctMatrix[u][v];
    }}
    if(minDctCoeffGlobal === maxDctCoeffGlobal){ maxDctCoeffGlobal = minDctCoeffGlobal + 1; }
}

function quantizeDCT() {
    let threshold = parseInt(quantizationSlider.value()); 
    activeBasisFunctionsCount = 0; 

    for (let u = 0; u < N; u++) {
        for (let v = 0; v < N; v++) {
            if (u + v > threshold) {
                quantizedMatrix[u][v] = 0;
            } else {
                let qValue = 3 * (1 + (u + v) * 0.5); 
                if (threshold < 3 && u + v > 0) qValue *= 2; 
                if (u === 0 && v === 0) qValue = 1; 

                quantizedMatrix[u][v] = Math.round(dctMatrix[u][v] / qValue) * qValue;
            }
            if (quantizedMatrix[u][v] !== 0) {
                activeBasisFunctionsCount++;
            }
        }
    }
}

function performIDCT() {
    for(let x=0; x<N; x++){ for(let y=0; y<N; y++){
        let sum = 0;
        for(let u=0; u<N; u++){ for(let v=0; v<N; v++){
            sum += C_val(u) * C_val(v) * quantizedMatrix[u][v] * Math.cos((2*x+1)*u*Math.PI/(2*N)) * Math.cos((2*y+1)*v*Math.PI/(2*N));
        }}
        outputMatrix[x][y] = (0.25 * sum) + 128;
    }}
}

// --- Funzioni p5.js ---

function setup() {
    canvasContainer = select('#canvas-container'); 
    if (!canvasContainer || !canvasContainer.elt) {
         console.error("Errore fatale: il div #canvas-container non è stato trovato. Lo script non può continuare.");
         return; 
    }
   
    updateDimensionsBasedOnScale(); 

    let cnv = createCanvas(canvasWidthGlobal, canvasHeightGlobal); 
    if (!cnv || !cnv.elt) { 
        console.error("Errore nella creazione del canvas p5.js!");
        return;
    }
    cnv.parent('canvas-container'); 
   
    calculateLayoutCoordinates(); 

    cnv.mouseMoved(updateHoverInfo); 
    cnv.mousePressed(handleMousePressed); 
    cnv.mouseOut(() => { 
        hoveredBasisU = -1;
        hoveredBasisV = -1;
        if (hoverInfoDiv) hoverInfoDiv.hide(); 
        redraw(); 
    });

    generateAllBasisFunctions(); 
    highlightColor = color(255, 140, 0, 220); 
    dcHighlightColor = color(0, 122, 255, 220); 
    selectedBlockHighlightColor = color(255, 0, 0, 200); 

    hoverInfoDiv = select('#hoverInfoDiv'); 
    if (!hoverInfoDiv) console.error("Elemento hoverInfoDiv non trovato nell'HTML!");

    quantizationSlider = select('#quantizationSlider'); 
    if (!quantizationSlider) console.error("Elemento quantizationSlider non trovato nell'HTML!");
    else quantizationSlider.input(updateSimulation); 
   
    initializeRPixelArtPattern(); 
    runSimulation(); 
    noLoop(); 
}
       
function updateDimensionsBasedOnScale() {
    if (!canvasContainer || !canvasContainer.elt) { 
        console.error("updateDimensionsBasedOnScale chiamato ma canvasContainer non è valido.");
        return; 
    }
    let containerWidth = canvasContainer.width;
    
    let referenceLayoutWidth = 1300;
    let scaleFactor = containerWidth / referenceLayoutWidth;
    
    if (containerWidth < 450) scaleFactor = 450 / referenceLayoutWidth;

    blockDisplaySize = Math.max(70, 160 * scaleFactor); 
    
    padding = Math.max(5, 15 * scaleFactor);            
    labelHeight = Math.max(15, 20 * scaleFactor);          
    subLabelHeight = Math.max(10, 15 * scaleFactor);
   
    cellDisplaySize = blockDisplaySize / N; 

    let basisGridTargetContentSize = blockDisplaySize; 
    basisInterBlockPadding = Math.max(0.2, 0.5 * scaleFactor); 
   
    basisBlockDisplaySize = (basisGridTargetContentSize - (N - 1) * basisInterBlockPadding) / N;
    if (basisBlockDisplaySize < 0) basisBlockDisplaySize = 0; 
   
    basisCellSize = basisBlockDisplaySize / N;
    if (basisCellSize < 0) basisCellSize = 0;

    basisGridActualContentWidth = N * basisBlockDisplaySize + (N - 1) * basisInterBlockPadding;
    basisGridActualContentHeight = N * basisBlockDisplaySize + (N - 1) * basisInterBlockPadding;

    calculateCanvasDimensions(); 
}

function calculateCanvasDimensions() {
    originalAreaWidth_Global = 2 * blockDisplaySize + padding;
    let originalAreaHeight = 2 * (blockDisplaySize + padding) - padding + labelHeight;

    let basisGridContentHeightWithText = N * basisBlockDisplaySize + (N - 1) * basisInterBlockPadding;
    let basisGridFullHeight = labelHeight + basisGridContentHeightWithText + subLabelHeight + 5; 

    reconstructedBlockWidth_Global = blockDisplaySize;
    let reconstructedBlockHeight = blockDisplaySize + labelHeight;
   
    calculateLayoutCoordinates(); 

    canvasWidthGlobal = reconstructedBlockStartX_Global + reconstructedBlockWidth_Global + padding;
    canvasHeightGlobal = padding + Math.max(originalAreaHeight, basisGridFullHeight, reconstructedBlockHeight) + padding;
}

function calculateLayoutCoordinates() {
    let horizontalOffset = 20; // Shift content to the right by this amount
    originalAreaStartX = padding + horizontalOffset;
    basisGridStartX_Global = originalAreaStartX + originalAreaWidth_Global + padding;
    reconstructedBlockStartX_Global = basisGridStartX_Global + basisGridActualContentWidth + padding;
}
       
function windowResized() {
    if (!canvasContainer || !canvasContainer.elt) { 
         console.error("windowResized chiamato ma canvasContainer non è valido.");
         return;
    }
    updateDimensionsBasedOnScale(); 
    resizeCanvas(canvasWidthGlobal, canvasHeightGlobal); 
    calculateLayoutCoordinates(); 
    redraw(); 
}

function updateSimulation() { quantizeDCT(); performIDCT(); redraw(); }

function runSimulation() {
    performDCT();
    quantizeDCT();
    performIDCT();
    redraw();
}

function handleMousePressed() {
    let startY_blocks = padding + labelHeight; 
    let clickedOnOriginal = false;

    for (let r = 0; r < 2; r++) { 
        for (let c = 0; c < 2; c++) { 
            let blockIndex = r * 2 + c;
            let x0 = originalAreaStartX + c * (blockDisplaySize + padding);
            let y0 = startY_blocks + r * (blockDisplaySize + padding);
            if (mouseX >= x0 && mouseX < x0 + blockDisplaySize && mouseY >= y0 && mouseY < y0 + blockDisplaySize) {
                if (selectedOriginalBlockIndex !== blockIndex) { 
                    setCurrentActiveInputBlock(blockIndex); 
                    runSimulation(); 
                }
                clickedOnOriginal = true;
                break; 
            }
        }
        if (clickedOnOriginal) break; 
    }
}

function updateHoverInfo() {
    let prevHoverU = hoveredBasisU; 
    let prevHoverV = hoveredBasisV;
    hoveredBasisU = -1; 
    hoveredBasisV = -1;
   
    let gridContentActualStartY = padding + labelHeight; 
    
    let currentBasisGridContentHeightForHover = N * basisBlockDisplaySize + (N-1) * basisInterBlockPadding;

    if (typeof basisGridStartX_Global === 'undefined' || typeof gridContentActualStartY === 'undefined') { 
        console.error("updateHoverInfo: Global layout variables (basisGridStartX_Global) or local (gridContentActualStartY) not defined yet.");
        return;
    }

    if (mouseX >= basisGridStartX_Global && mouseX < basisGridStartX_Global + basisGridActualContentWidth &&
        mouseY >= gridContentActualStartY && mouseY < gridContentActualStartY + currentBasisGridContentHeightForHover ) {
        
        for (let u_idx = 0; u_idx < N; u_idx++) { 
            for (let v_idx = 0; v_idx < N; v_idx++) { 
                let basisBlockX = basisGridStartX_Global + v_idx * (basisBlockDisplaySize + basisInterBlockPadding);
                let yOffsetForText = 0; 
                let basisBlockY = gridContentActualStartY + u_idx * basisBlockDisplaySize + yOffsetForText + u_idx * basisInterBlockPadding; 
               
                let blockHeightForHover = basisBlockDisplaySize; 

                if (mouseX >= basisBlockX && mouseX < basisBlockX + basisBlockDisplaySize &&
                    mouseY >= basisBlockY && mouseY < basisBlockY + blockHeightForHover) {
                    hoveredBasisU = u_idx;
                    hoveredBasisV = v_idx;
                    break; 
                }
            }
            if (hoveredBasisU !== -1) break; 
        }
    }

    if (hoverInfoDiv) {
        if (hoveredBasisU !== -1) { 
            hoverInfoDiv.html(`(u,v): ${hoveredBasisU},${hoveredBasisV}`); 
            if (canvasContainer && canvasContainer.elt) { 
                let canvasRect = canvasContainer.elt.getBoundingClientRect(); 
                let divX = constrain(mouseX + 12, 0, width - hoverInfoDiv.width - 10); 
                let divY = constrain(mouseY + 12, 0, height - hoverInfoDiv.height - 10);
                hoverInfoDiv.position(canvasRect.left + window.scrollX + divX, canvasRect.top + window.scrollY + divY);
                hoverInfoDiv.show(); 
            }
        } else {
            hoverInfoDiv.hide(); 
        }
    }

    if (prevHoverU !== hoveredBasisU || prevHoverV !== hoveredBasisV) {
        redraw();
    }
}
       
function draw() {
    clear(); // Ensures canvas is transparent

    let commonLabelY = padding + labelHeight / 2 -3; 
    let commonBlocksStartY = padding + labelHeight;  

    fill(80); 
    textSize(Math.max(8, 12 * (blockDisplaySize/120) )); 
    textAlign(CENTER, CENTER);
    text("Originale (Clicca per selezionare)", originalAreaStartX + originalAreaWidth_Global / 2, commonLabelY);

    for (let r = 0; r < 2; r++) { 
        for (let c = 0; c < 2; c++) { 
            let blockIndex = r * 2 + c;
            let x = originalAreaStartX + c * (blockDisplaySize + padding);
            let y = commonBlocksStartY + r * (blockDisplaySize + padding);
            drawBlock(originalBlocks[blockIndex], x, y, "", "original", 0, 255, blockIndex === selectedOriginalBlockIndex);
        }
    }

    drawBasisFunctionsDisplay(basisGridStartX_Global, commonBlocksStartY, commonLabelY);

    fill(80); textSize(Math.max(8, 12 * (blockDisplaySize/120) )); textAlign(CENTER, CENTER);
    text("Ricostruito", reconstructedBlockStartX_Global + reconstructedBlockWidth_Global / 2, commonLabelY);
    drawBlock(outputMatrix, reconstructedBlockStartX_Global, commonBlocksStartY, "", "reconstructed", 0, 255);
   
}

function drawBasisFunctionsDisplay(startX, startContentY, labelYForThisSection) {
    push(); 
   
    fill(80); 
    textSize(Math.max(9, 13 * (blockDisplaySize/120) )); 
    textAlign(CENTER, CENTER);
    text("DCT", startX + basisGridActualContentWidth / 2, labelYForThisSection); 

    let gridContentActualStartY_local = startContentY; 
    let currentGridContentHeight = 0; 

    for (let u_idx = 0; u_idx < N; u_idx++) { 
        for (let v_idx = 0; v_idx < N; v_idx++) { 
            let yOffsetForTextInLoop = 0; 
            let basisBlockX = startX + v_idx * (basisBlockDisplaySize + basisInterBlockPadding);
            let basisBlockY = gridContentActualStartY_local + u_idx * basisBlockDisplaySize + yOffsetForTextInLoop + u_idx * basisInterBlockPadding;
           
            let isActive = (quantizedMatrix[u_idx][v_idx] !== 0); 

            for (let x_cell = 0; x_cell < N; x_cell++) { for (let y_cell = 0; y_cell < N; y_cell++) {
                let val = allBasisFunctions[u_idx][v_idx][x_cell][y_cell]; 
                let displayVal = map(val, -1, 1, 0, 255); 
                fill(displayVal); 
                noStroke(); 
                rect(basisBlockX + y_cell * basisCellSize, basisBlockY + x_cell * basisCellSize, basisCellSize, basisCellSize); 
            }}
           
            if (!isActive) {
                fill(0, 0, 0, 150); 
                noStroke();
                rect(basisBlockX, basisBlockY, basisBlockDisplaySize, basisBlockDisplaySize); 
            }

            noFill();
            if (u_idx === hoveredBasisU && v_idx === hoveredBasisV) { 
                stroke(highlightColor); 
                strokeWeight(1.5 * (basisCellSize > 1 ? basisCellSize/2 : 0.5) ); 
            } else {
                stroke(isActive ? 180 : 100); 
                strokeWeight(0.5 * (basisCellSize > 1 ? basisCellSize/2 : 0.2) ); 
            }
            rect(basisBlockX, basisBlockY, basisBlockDisplaySize, basisBlockDisplaySize); 
            
             if (u_idx === N - 1 && v_idx === N - 1) { 
                currentGridContentHeight = basisBlockY + basisBlockDisplaySize - gridContentActualStartY_local;
            }
        }
    }
    currentGridContentHeight = N * basisBlockDisplaySize + (N - 1) * basisInterBlockPadding;


    fill(100); 
    textSize(Math.max(7, 11 * (blockDisplaySize/120) )); 
    textAlign(CENTER, CENTER);
    text(`${activeBasisFunctionsCount} / ${N*N} attive`, startX + basisGridActualContentWidth / 2, gridContentActualStartY_local + currentGridContentHeight + subLabelHeight / 2 + 5);

    pop(); 
}
       
function drawBlock(matrix, startX, startY, label, blockType, dataMin, dataMax, isSelected = false) {
    for (let i = 0; i < N; i++) { for (let j = 0; j < N; j++) { 
        let val = matrix[i][j]; 
        push(); 

        let cellStrokeColor = color(220); 
        let cellStrokeWeight = 0.5 * (cellDisplaySize / (120/N) ); 
        let displayVal;

        if (blockType === "original" || blockType === "reconstructed") {
            displayVal = constrain(val, 0, 255); 
           
            fill(displayVal); 
            stroke(cellStrokeColor);
            strokeWeight(cellStrokeWeight);
            rect(startX + j * cellDisplaySize, startY + i * cellDisplaySize, cellDisplaySize, cellDisplaySize);
            
             if (isSelected) { 
                noFill();
                stroke(selectedBlockHighlightColor); 
                strokeWeight(2 * (cellDisplaySize / (120/N) )); 
                rect(startX + j * cellDisplaySize, startY + i * cellDisplaySize, cellDisplaySize, cellDisplaySize);
            }
        }
        pop(); 
    }}}
