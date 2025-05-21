// --- Variabili Globali ---
const N = 8; 
const FULL_PATTERN_SIZE = 16; 

let currentActiveInputBlock = Array(N).fill(null).map(() => Array(N).fill(0));
let dctMatrix = Array(N).fill(null).map(() => Array(N).fill(0));
let quantizedMatrix = Array(N).fill(null).map(() => Array(N).fill(0));
let outputMatrix = Array(N).fill(null).map(() => Array(N).fill(0));

let allBasisFunctions = Array(N).fill(null).map(() => Array(N).fill(null).map(() => Array(N).fill(null).map(() => Array(N).fill(0))));

let originalPattern16x16 = Array(FULL_PATTERN_SIZE).fill(null).map(() => Array(FULL_PATTERN_SIZE).fill(0));
let originalBlocks = Array(4).fill(null).map(() => Array(N).fill(null).map(() => Array(N).fill(0))); 
let selectedOriginalBlockIndex = 0; 

let blockDisplaySize = 80; 
let cellDisplaySize = blockDisplaySize / N;
let padding = 8; 
let labelHeight = 15; 
let subLabelHeight = 10; 

let basisCellSize;
let basisBlockDisplaySize;
let basisInterBlockPadding;

let originalAreaStartX, basisGridStartX_Global, reconstructedBlockStartX_Global;
let originalAreaWidth_Global, basisGridActualContentWidth, reconstructedBlockWidth_Global;
let basisGridActualContentHeight;

// Elementi HTML (verranno selezionati in setup)
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
            for (let x_coord = 0; x_coord < N; x_coord++) { 
                for (let y_coord = 0; y_coord < N; y_coord++) { 
                    allBasisFunctions[u][v][x_coord][y_coord] = Math.cos((2 * x_coord + 1) * u * Math.PI / (2 * N)) *
                                                                Math.cos((2 * y_coord + 1) * v * Math.PI / (2 * N));
                }
            }
        }
    }
}

function initializeCustomPattern() {
    const placeholderImagePixelData16x16 = [ // Dati immagine utente
        [125, 122, 119, 117, 119, 122, 118, 123, 126, 125, 120, 119, 125, 123, 120, 122],
        [128, 131, 131, 130, 129, 131, 129, 122, 104, 103, 116, 125, 131, 129, 124, 126],
        [135, 137, 142, 139, 140, 139, 102, 79, 63, 46, 37, 63, 129, 134, 129, 133],
        [144, 147, 148, 146, 149, 116, 118, 149, 123, 70, 35, 24, 61, 141, 140, 140],
        [155, 155, 155, 153, 150, 93, 182, 192, 176, 120, 54, 25, 19, 117, 143, 149],
        [158, 161, 160, 162, 114, 98, 175, 182, 169, 143, 96, 28, 18, 62, 114, 130],
        [116, 128, 161, 166, 82, 91, 130, 158, 116, 105, 86, 33, 22, 44, 86, 107],
        [91, 97, 127, 119, 66, 105, 145, 147, 149, 143, 123, 34, 23, 37, 74, 90],
        [84, 75, 76, 73, 52, 99, 171, 158, 161, 162, 92, 31, 28, 32, 79, 93],
        [84, 79, 76, 63, 42, 65, 150, 114, 131, 131, 73, 30, 29, 28, 58, 67],
        [75, 73, 72, 71, 48, 41, 127, 133, 121, 114, 60, 30, 25, 28, 64, 74],
        [69, 74, 82, 93, 51, 36, 48, 128, 99, 66, 45, 30, 27, 28, 63, 81],
        [82, 92, 102, 106, 58, 37, 32, 55, 75, 60, 69, 48, 26, 27, 50, 75],
        [86, 86, 92, 89, 57, 35, 39, 72, 135, 116, 121, 83, 35, 36, 32, 63],
        [78, 68, 51, 54, 37, 40, 95, 158, 167, 167, 165, 122, 56, 49, 31, 48],
        [95, 67, 59, 54, 33, 72, 173, 192, 190, 190, 179, 125, 64, 40, 41, 41]
    ];

    if (placeholderImagePixelData16x16.length !== FULL_PATTERN_SIZE ||
        (placeholderImagePixelData16x16[0] && placeholderImagePixelData16x16[0].length !== FULL_PATTERN_SIZE)) {
        console.error(`Errore: I dati immagine devono essere ${FULL_PATTERN_SIZE}x${FULL_PATTERN_SIZE}. Uso pattern di default.`);
        for (let i = 0; i < FULL_PATTERN_SIZE; i++) {
            for (let j = 0; j < FULL_PATTERN_SIZE; j++) {
                originalPattern16x16[i][j] = (i + j) % 2 === 0 ? 200 : 50; 
            }
        }
    } else {
        for (let i = 0; i < FULL_PATTERN_SIZE; i++) {
            for (let j = 0; j < FULL_PATTERN_SIZE; j++) {
                originalPattern16x16[i][j] = placeholderImagePixelData16x16[i][j];
            }
        }
    }

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
        for(let x_coord=0; x_coord<N; x_coord++){ for(let y_coord=0; y_coord<N; y_coord++){
            sum += (currentActiveInputBlock[x_coord][y_coord] - 128) * allBasisFunctions[u][v][x_coord][y_coord];
        }}
        dctMatrix[u][v] = 0.25 * C_val(u) * C_val(v) * sum;
        if(dctMatrix[u][v] < minDctCoeffGlobal) minDctCoeffGlobal = dctMatrix[u][v];
        if(dctMatrix[u][v] > maxDctCoeffGlobal) maxDctCoeffGlobal = dctMatrix[u][v];
    }}
    if(minDctCoeffGlobal === maxDctCoeffGlobal){ 
        maxDctCoeffGlobal = minDctCoeffGlobal + 1; 
    }
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
    for(let x_coord=0; x_coord<N; x_coord++){ for(let y_coord=0; y_coord<N; y_coord++){
        let sum = 0;
        for(let u=0; u<N; u++){ for(let v=0; v<N; v++){
            sum += C_val(u) * C_val(v) * quantizedMatrix[u][v] * allBasisFunctions[u][v][x_coord][y_coord];
        }}
        outputMatrix[x_coord][y_coord] = (0.25 * sum) + 128;
    }}
}

// --- Funzioni p5.js ---
function setup() {
    canvasContainer = select('#canvas-container');
    if (!canvasContainer || !canvasContainer.elt) {
        console.error("Errore fatale: div #canvas-container non trovato.");
        return; 
    }
    
    updateDimensionsBasedOnScale(); 

    let cnv = createCanvas(canvasWidthGlobal, canvasHeightGlobal);
    if (!cnv || !cnv.elt) {
        console.error("Errore creazione canvas p5.js!");
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
        if (typeof width !== 'undefined') redraw(); 
    });

    generateAllBasisFunctions(); 
    highlightColor = color(255, 140, 0, 220); 
    dcHighlightColor = color(0, 122, 255, 220); 
    selectedBlockHighlightColor = color(255, 0, 0, 200); // Rosso per selezione

    hoverInfoDiv = select('#hoverInfoDiv'); 
    if (!hoverInfoDiv) console.error("Elemento hoverInfoDiv non trovato!");

    quantizationSlider = select('#quantizationSlider'); 
    if (!quantizationSlider) console.error("Elemento quantizationSlider non trovato!");
    else quantizationSlider.input(updateSimulation); 
    
    initializeCustomPattern(); 
    runSimulation(); 
    noLoop(); 
}

function updateDimensionsBasedOnScale() {
    if (!canvasContainer || !canvasContainer.elt) {
        return;
    }
    let containerWidth = canvasContainer.width; 
    
    let referenceLayoutWidth = 500; 
    let scaleFactor = containerWidth / referenceLayoutWidth;
    
    if (containerWidth < 320) scaleFactor = 320 / referenceLayoutWidth; 

    blockDisplaySize = Math.max(30, 80 * scaleFactor); 
    
    padding = Math.max(4, 8 * scaleFactor);      
    labelHeight = Math.max(10, 14 * scaleFactor);       
    subLabelHeight = Math.max(8, 10 * scaleFactor);
    
    cellDisplaySize = blockDisplaySize / N; 

    basisGridTargetContentSize = blockDisplaySize;
    basisInterBlockPadding = Math.max(0.1, 0.3 * scaleFactor); 
    
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

    let basisGridFullHeight = labelHeight + basisGridActualContentHeight + subLabelHeight + 2; 

    reconstructedBlockWidth_Global = blockDisplaySize;
    let reconstructedBlockHeight = blockDisplaySize + labelHeight; 
    
    calculateLayoutCoordinates(); 

    canvasWidthGlobal = reconstructedBlockStartX_Global + reconstructedBlockWidth_Global + padding;
    canvasHeightGlobal = padding + Math.max(originalAreaHeight, basisGridFullHeight, reconstructedBlockHeight) + padding;
}

function calculateLayoutCoordinates() {
    originalAreaStartX = padding;
    basisGridStartX_Global = originalAreaStartX + originalAreaWidth_Global + padding;
    reconstructedBlockStartX_Global = basisGridStartX_Global + basisGridActualContentWidth + padding;
}

function windowResized() {
    if (!canvasContainer || !canvasContainer.elt) {
        return;
    }
    updateDimensionsBasedOnScale(); 
    if (typeof width !== 'undefined' && typeof height !== 'undefined') {
        resizeCanvas(canvasWidthGlobal, canvasHeightGlobal); 
        calculateLayoutCoordinates(); 
        redraw(); 
    }
}

function updateSimulation() { quantizeDCT(); performIDCT(); if (typeof width !== 'undefined') redraw(); }

function runSimulation() {
    performDCT();
    quantizeDCT();
    performIDCT();
    if (typeof width !== 'undefined') redraw();
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

    if (typeof basisGridStartX_Global === 'undefined' || typeof basisGridActualContentWidth === 'undefined' || typeof basisGridActualContentHeight === 'undefined') {
        if (hoverInfoDiv) hoverInfoDiv.hide();
        return;
    }

    if (mouseX >= basisGridStartX_Global && mouseX < basisGridStartX_Global + basisGridActualContentWidth &&
        mouseY >= gridContentActualStartY && mouseY < gridContentActualStartY + basisGridActualContentHeight ) { 
        
        for (let u_idx = 0; u_idx < N; u_idx++) {
            for (let v_idx = 0; v_idx < N; v_idx++) {
                let basisBlockX = basisGridStartX_Global + v_idx * (basisBlockDisplaySize + basisInterBlockPadding);
                let basisBlockY = gridContentActualStartY + u_idx * (basisBlockDisplaySize + basisInterBlockPadding);
                
                if (mouseX >= basisBlockX && mouseX < basisBlockX + basisBlockDisplaySize &&
                    mouseY >= basisBlockY && mouseY < basisBlockY + basisBlockDisplaySize) {
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
            hoverInfoDiv.html(`u,v: ${hoveredBasisU},${hoveredBasisV}`); 
            if (canvasContainer && canvasContainer.elt && typeof width !== 'undefined' && typeof height !== 'undefined') {
                let canvasRect = canvasContainer.elt.getBoundingClientRect(); 
                let divX = constrain(mouseX + 8, 0, width - (hoverInfoDiv.width || 60) - 6); 
                let divY = constrain(mouseY + 8, 0, height - (hoverInfoDiv.height || 20) - 6);
                hoverInfoDiv.position(canvasRect.left + window.scrollX + divX, canvasRect.top + window.scrollY + divY);
                hoverInfoDiv.show();
            }
        } else {
            hoverInfoDiv.hide(); 
        }
    }

    if (prevHoverU !== hoveredBasisU || prevHoverV !== hoveredBasisV) {
        if (typeof width !== 'undefined') redraw();
    }
}

function draw() {
    // background(240, 244, 248); 

    let commonLabelY = padding + labelHeight / 2 -1; 
    let commonBlocksStartY = padding + labelHeight;  

    fill(80); 
    textSize(Math.max(6, 8 * (blockDisplaySize/80) )); 
    textAlign(CENTER, CENTER);
    text("Originale (Clicca per selezionare)", originalAreaStartX + originalAreaWidth_Global / 2, commonLabelY);

    for (let r = 0; r < 2; r++) { 
        for (let c = 0; c < 2; c++) { 
            let blockIndex = r * 2 + c;
            let x_pos = originalAreaStartX + c * (blockDisplaySize + padding); 
            let y_pos = commonBlocksStartY + r * (blockDisplaySize + padding); 
            drawBlock(originalBlocks[blockIndex], x_pos, y_pos, "original", 0, 255, blockIndex === selectedOriginalBlockIndex);
        }
    }

    drawBasisFunctionsDisplay(basisGridStartX_Global, commonBlocksStartY, commonLabelY);

    fill(80); textSize(Math.max(6, 8 * (blockDisplaySize/80) )); textAlign(CENTER, CENTER);
    text("Ricostruito", reconstructedBlockStartX_Global + reconstructedBlockWidth_Global / 2, commonLabelY);
    drawBlock(outputMatrix, reconstructedBlockStartX_Global, commonBlocksStartY, "reconstructed", 0, 255);
    
}

function drawBasisFunctionsDisplay(startX, startContentY, labelYForThisSection) {
    push(); 
    
    fill(80); 
    textSize(Math.max(6, 8 * (blockDisplaySize/80) )); 
    textAlign(CENTER, CENTER);
    text("Base DCT & Coeff.", startX + basisGridActualContentWidth / 2, labelYForThisSection);

    let gridContentActualStartY_local = startContentY; 

    for (let u_idx = 0; u_idx < N; u_idx++) {
        for (let v_idx = 0; v_idx < N; v_idx++) {
            let basisBlockX = startX + v_idx * (basisBlockDisplaySize + basisInterBlockPadding);
            let basisBlockY = gridContentActualStartY_local + u_idx * (basisBlockDisplaySize + basisInterBlockPadding);
            
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
                stroke( (u_idx===0 && v_idx===0) ? dcHighlightColor : highlightColor ); 
                strokeWeight(1.0 * (basisCellSize > 0.5 ? basisCellSize/2 : 0.3) ); 
            } else {
                stroke(isActive ? 180 : 100); 
                strokeWeight(0.3 * (basisCellSize > 0.5 ? basisCellSize/2 : 0.1) ); 
            }
            rect(basisBlockX, basisBlockY, basisBlockDisplaySize, basisBlockDisplaySize);
        }
    }
    
    fill(100); 
    textSize(Math.max(5, 7 * (blockDisplaySize/80) )); 
    textAlign(CENTER, CENTER);
    let textY = gridContentActualStartY_local + basisGridActualContentHeight + subLabelHeight / 2 + 2; 
    text(`${activeBasisFunctionsCount} / ${N * N} coeff. attivi`, startX + basisGridActualContentWidth / 2, textY);

    pop(); 
}

function drawBlock(matrix, startX, startY, blockType, dataMin, dataMax, isSelected = false) {
    for (let i = 0; i < N; i++) { for (let j = 0; j < N; j++) {
        let val = matrix[i][j];
        push();

        let cellStrokeColor = color(220); 
        let cellStrokeWeight = 0.3 * (cellDisplaySize / (80/N) ); 
        let displayVal;

        if (blockType === "original" || blockType === "reconstructed") {
            displayVal = constrain(val, 0, 255); 
            
            fill(displayVal); 
            stroke(cellStrokeColor);
            strokeWeight(cellStrokeWeight);
            rect(startX + j * cellDisplaySize, startY + i * cellDisplaySize, cellDisplaySize, cellDisplaySize);
        }
        pop();
    }}
    if (isSelected && blockType === "original") {
        push();
        noFill();
        stroke(selectedBlockHighlightColor); 
        strokeWeight(1.8 * (blockDisplaySize/80)); 
        rect(startX, startY, blockDisplaySize, blockDisplaySize);
        pop();
    }
} 