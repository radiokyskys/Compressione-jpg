// sketch.js

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

// Valori di base per il scaling, verranno ricalcolati
let blockDisplaySize = 120;
let cellDisplaySize = blockDisplaySize / N;
let padding = 15;
let labelHeight = 20;

let basisCellSize = 2;
let basisBlockDisplaySize = N * basisCellSize;
let basisInterBlockPadding = 1;
let basisGridTotalWidth;
let basisGridTotalHeight;
let basisGridStartX;
let basisGridStartYGlobal;
let actualBasisGridDrawY;

let quantizationSlider;
let quantizationValueSpan;
let hoverInfoDiv;
let canvasContainer; // Riferimento al div contenitore del canvas

let minDctCoeffGlobal = -1024;
let maxDctCoeffGlobal = 1024;

let hoveredBasisU = -1;
let hoveredBasisV = -1;
let highlightColor;
let dcHighlightColor;
let selectedBlockHighlightColor;
let activeBasisFunctionsCount = N * N;

// --- Funzioni di calcolo e inizializzazione ---
function C_val(k) { return (k === 0) ? (1.0 / Math.sqrt(2.0)) : 1.0; }

function generateAllBasisFunctions() {
    for (let u = 0; u < N; u++) { for (let v = 0; v < N; v++) {
        for (let x = 0; x < N; x++) { for (let y = 0; y < N; y++) {
            allBasisFunctions[u][v][x][y] = Math.cos((2 * x + 1) * u * Math.PI / (2 * N)) *
                                          Math.cos((2 * y + 1) * v * Math.PI / (2 * N));
        }}
    }}}

function initializeLetterKPattern() {
    const bgColor = 0;
    const letterColor = 255;
    for (let i = 0; i < FULL_PATTERN_SIZE; i++) {
        for (let j = 0; j < FULL_PATTERN_SIZE; j++) {
            originalPattern16x16[i][j] = bgColor;
        }
    }
    for (let i = 2; i < FULL_PATTERN_SIZE - 2; i++) {
        originalPattern16x16[i][3] = letterColor;
        originalPattern16x16[i][4] = letterColor; 
    }
    let midPointY = Math.floor(FULL_PATTERN_SIZE / 2) -1; 
    originalPattern16x16[midPointY][5] = letterColor; 
    for (let i = 0; i < midPointY -1; i++) {
        let row = midPointY - i;
        let col1 = 5 + i; let col2 = 6 + i;
        if (row >= 2 && col1 < FULL_PATTERN_SIZE - 3) originalPattern16x16[row][col1] = letterColor;
        if (row >= 2 && col2 < FULL_PATTERN_SIZE - 3) originalPattern16x16[row][col2] = letterColor;
    }
    originalPattern16x16[2][FULL_PATTERN_SIZE - 5] = letterColor;
    originalPattern16x16[2][FULL_PATTERN_SIZE - 4] = letterColor;
    originalPattern16x16[3][FULL_PATTERN_SIZE - 5] = letterColor;
    for (let i = 0; i < (FULL_PATTERN_SIZE - 2 - midPointY); i++) {
        let row = midPointY + i;
        let col1 = 5 + i; let col2 = 6 + i;
        if (row < FULL_PATTERN_SIZE - 2 && col1 < FULL_PATTERN_SIZE - 3) originalPattern16x16[row][col1] = letterColor;
        if (row < FULL_PATTERN_SIZE - 2 && col2 < FULL_PATTERN_SIZE - 3) originalPattern16x16[row][col2] = letterColor;
    }
    originalPattern16x16[FULL_PATTERN_SIZE - 3][FULL_PATTERN_SIZE - 5] = letterColor;
    originalPattern16x16[FULL_PATTERN_SIZE - 3][FULL_PATTERN_SIZE - 4] = letterColor;
    originalPattern16x16[FULL_PATTERN_SIZE - 4][FULL_PATTERN_SIZE - 5] = letterColor;

    for (let r = 0; r < 2; r++) { 
        for (let c = 0; c < 2; c++) { 
            let blockIndex = r * 2 + c;
            for (let i = 0; i < N; i++) {
                for (let j = 0; j < N; j++) {
                    originalBlocks[blockIndex][i][j] = originalPattern16x16[r * N + i][c * N + j];
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
    minDctCoeffGlobal=Infinity;maxDctCoeffGlobal=-Infinity;
    for(let u=0;u<N;u++){for(let v=0;v<N;v++){
        let sum=0;
        for(let x=0;x<N;x++){for(let y=0;y<N;y++){
            sum+=(currentActiveInputBlock[x][y]-128)*Math.cos((2*x+1)*u*Math.PI/(2*N))*Math.cos((2*y+1)*v*Math.PI/(2*N));
        }}
        dctMatrix[u][v]=0.25*C_val(u)*C_val(v)*sum;
        if(dctMatrix[u][v]<minDctCoeffGlobal)minDctCoeffGlobal=dctMatrix[u][v];
        if(dctMatrix[u][v]>maxDctCoeffGlobal)maxDctCoeffGlobal=dctMatrix[u][v];
    }}
    if(minDctCoeffGlobal===maxDctCoeffGlobal){maxDctCoeffGlobal=minDctCoeffGlobal+1;}
}

function quantizeDCT() {
    let threshold = parseInt(quantizationSlider.value());
    quantizationValueSpan.html(threshold);
    const baseQuantVal = 3; 
    activeBasisFunctionsCount = 0; 

    for (let u = 0; u < N; u++) {
        for (let v = 0; v < N; v++) {
            if (u + v > threshold) {
                quantizedMatrix[u][v] = 0;
            } else {
                let qValue = baseQuantVal * (1 + (u + v) * 0.5);
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

function performIDCT() {for(let x=0;x<N;x++){for(let y=0;y<N;y++){let sum=0;for(let u=0;u<N;u++){for(let v=0;v<N;v++){sum+=C_val(u)*C_val(v)*quantizedMatrix[u][v]*Math.cos((2*x+1)*u*Math.PI/(2*N))*Math.cos((2*y+1)*v*Math.PI/(2*N));}}outputMatrix[x][y]=(0.25*sum)+128;}}}

// --- Funzioni di Setup e Disegno p5.js ---
function setup() {
    canvasContainer = select('#canvas-container');
    // Calcola dimensioni iniziali basate sul contenitore
    let containerWidth = canvasContainer.width;
    // Definisci una larghezza di riferimento per il scaling, ad es. la larghezza ideale del layout
    // Questo layout ha 3 colonne principali (originali, pipeline, basis) e padding.
    // Larghezza originale blocchi: 2*120 + 15 (original) + 120 (pipeline) + (8*2 + 7*1) (basis) + 4*15 (paddings) ~ 550
    let referenceLayoutWidth = 550; // Larghezza di riferimento per il design originale
    let scaleFactor = containerWidth / referenceLayoutWidth;
    if (containerWidth < 400) scaleFactor = 400 / referenceLayoutWidth; // Minima larghezza per scaling

    // Scala le dimensioni base
    blockDisplaySize = Math.max(60, 120 * scaleFactor); // Minimo 60px per blocco
    padding = Math.max(5, 15 * scaleFactor);
    labelHeight = Math.max(15, 20 * scaleFactor);
    basisCellSize = Math.max(1, 2 * scaleFactor);
    basisInterBlockPadding = Math.max(0.5, 1 * scaleFactor);

    // Ricalcola le dimensioni derivate
    cellDisplaySize = blockDisplaySize / N;
    basisBlockDisplaySize = N * basisCellSize;

    // Calcola dimensioni del canvas
    calculateCanvasDimensions(); // Usa la nuova funzione per calcolare e impostare le dimensioni

    let cnv = createCanvas(canvasWidth, canvasHeight); // canvasWidth e canvasHeight sono globali ora
    if (!cnv || !cnv.elt) {
        console.error("Errore nella creazione del Canvas!");
        return;
    }
    cnv.parent('canvas-container');
    
    // Calcola le coordinate di layout globali
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
    selectedBlockHighlightColor = color(0, 180, 0, 200); 

    hoverInfoDiv = select('#hoverInfoDiv');
    if (!hoverInfoDiv) console.error("hoverInfoDiv non trovato!");

    quantizationSlider = select('#quantizationSlider');
    if (!quantizationSlider) console.error("quantizationSlider non trovato!");
    else quantizationSlider.input(updateSimulation);
    
    quantizationValueSpan = select('#quantizationValue');
    if (!quantizationValueSpan) console.error("quantizationValueSpan non trovato!");

    initializeLetterKPattern(); 
    runSimulation();
    noLoop();
}

let canvasWidth, canvasHeight; // Variabili globali per le dimensioni del canvas

function calculateCanvasDimensions() {
    let originalAreaWidth = 2 * blockDisplaySize + padding;
    let originalAreaHeight = 2 * blockDisplaySize + padding + labelHeight;

    let pipelineAreaWidth = blockDisplaySize;
    let pipelineAreaHeight = 3 * blockDisplaySize + 2 * padding + 3 * labelHeight; 

    basisGridTotalWidth = N * basisBlockDisplaySize + (N - 1) * basisInterBlockPadding;
    basisGridTotalHeight = N * basisBlockDisplaySize + (N - 1) * basisInterBlockPadding + labelHeight + 15; 

    canvasWidth = padding + originalAreaWidth + padding + pipelineAreaWidth + padding + basisGridTotalWidth + padding;
    canvasHeight = padding + Math.max(originalAreaHeight, pipelineAreaHeight, basisGridTotalHeight) + padding;
}

function calculateLayoutCoordinates() {
    // Calcola le coordinate di partenza per la griglia delle funzioni base
    // Assumendo che originalAreaWidth sia calcolato con blockDisplaySize e padding aggiornati
    let originalAreaWidth = 2 * blockDisplaySize + padding;
    let pipelineAreaWidth = blockDisplaySize;

    basisGridStartX = padding + originalAreaWidth + padding + pipelineAreaWidth + padding; 
    basisGridStartYGlobal = padding; 
    actualBasisGridDrawY = basisGridStartYGlobal + labelHeight + 15; 
}

function windowResized() {
    let containerWidth = canvasContainer.width;
    let referenceLayoutWidth = 550; 
    let scaleFactor = containerWidth / referenceLayoutWidth;
    if (containerWidth < 400) scaleFactor = 400 / referenceLayoutWidth;

    blockDisplaySize = Math.max(60, 120 * scaleFactor);
    padding = Math.max(5, 15 * scaleFactor);
    labelHeight = Math.max(15, 20 * scaleFactor);
    basisCellSize = Math.max(1, 2 * scaleFactor);
    basisInterBlockPadding = Math.max(0.5, 1 * scaleFactor);

    cellDisplaySize = blockDisplaySize / N;
    basisBlockDisplaySize = N * basisCellSize;

    calculateCanvasDimensions();
    resizeCanvas(canvasWidth, canvasHeight);
    calculateLayoutCoordinates(); // Ricalcola le coordinate dopo il resize
    redraw(); // Ridisegna con le nuove dimensioni
}

function updateSimulation() { quantizeDCT(); performIDCT(); redraw(); }

function runSimulation() { 
    performDCT(); 
    quantizeDCT(); 
    performIDCT(); 
    redraw(); 
}

function handleMousePressed() {
    let originalAreaStartX = padding;
    let originalAreaStartY = padding + labelHeight; // Y di inizio per i blocchi originali (sotto l'etichetta)
    let clickedOnOriginal = false;

    for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
            let blockIndex = r * 2 + c;
            // Calcola le coordinate del blocco originale corrente
            let x0 = originalAreaStartX + c * (blockDisplaySize + padding);
            let y0 = originalAreaStartY + r * (blockDisplaySize + padding);
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
    
    // Assicurati che basisGridStartX e actualBasisGridDrawY siano definiti
    if (typeof basisGridStartX === 'undefined' || typeof actualBasisGridDrawY === 'undefined') {
        return; // Esci se le coordinate non sono ancora state calcolate
    }

    if (mouseX >= basisGridStartX && mouseX < basisGridStartX + basisGridTotalWidth &&
        mouseY >= actualBasisGridDrawY && mouseY < actualBasisGridDrawY + N * (basisBlockDisplaySize + basisInterBlockPadding) ) {
        for (let u_idx = 0; u_idx < N; u_idx++) {
            for (let v_idx = 0; v_idx < N; v_idx++) {
                let basisBlockX = basisGridStartX + v_idx * (basisBlockDisplaySize + basisInterBlockPadding);
                let basisBlockY = actualBasisGridDrawY + u_idx * (basisBlockDisplaySize + basisInterBlockPadding); 
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
            hoverInfoDiv.html(`(u,v): ${hoveredBasisU},${hoveredBasisV}`);
            let canvasRect = canvasContainer.elt.getBoundingClientRect(); // Usa canvasContainer
            let divX = constrain(mouseX + 12, 0, width - hoverInfoDiv.width - 10);
            let divY = constrain(mouseY + 12, 0, height - hoverInfoDiv.height - 10);
            hoverInfoDiv.position(canvasRect.left + window.scrollX + divX, canvasRect.top + window.scrollY + divY);
            hoverInfoDiv.show();
        } else {
            hoverInfoDiv.hide();
        }
    }

    if (prevHoverU !== hoveredBasisU || prevHoverV !== hoveredBasisV) {
        redraw();
    }
}

function draw() {
    background(247, 247, 247);

    // Coordinate per i blocchi originali (colonna sinistra)
    let originalAreaStartX = padding;
    let originalAreaStartY = padding + labelHeight; // Y di inizio per i blocchi (sotto l'etichetta)
    
    fill(80); textSize(max(8, 12 * (blockDisplaySize/120) )); textAlign(CENTER, CENTER); // Scala textSize
    text("Originale (Clicca per selezionare)", originalAreaStartX + (2 * blockDisplaySize + padding) / 2, padding + labelHeight / 2 - 3);

    for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
            let blockIndex = r * 2 + c;
            let x = originalAreaStartX + c * (blockDisplaySize + padding);
            let y = originalAreaStartY + r * (blockDisplaySize + padding);
            drawBlock(originalBlocks[blockIndex], x, y, "", "original", 0, 255, blockIndex === selectedOriginalBlockIndex);
        }
    }

    // Coordinate per la pipeline DCT (colonna centrale)
    let pipelineStartX = originalAreaStartX + (2 * blockDisplaySize + padding) + padding;
    let pipelineY1 = padding + labelHeight;
    let pipelineY2 = pipelineY1 + blockDisplaySize + padding + labelHeight;
    let pipelineY3 = pipelineY2 + blockDisplaySize + padding + labelHeight;

    fill(80); textSize(max(8, 12 * (blockDisplaySize/120) )); textAlign(CENTER, CENTER);
    text("Coefficienti DCT", pipelineStartX + blockDisplaySize / 2, pipelineY1 - labelHeight / 2 - 3);
    text("DCT Quantizzati", pipelineStartX + blockDisplaySize / 2, pipelineY2 - labelHeight / 2 - 3);
    text("Ricostruito", pipelineStartX + blockDisplaySize / 2, pipelineY3 - labelHeight / 2 - 3);

    drawBlock(dctMatrix, pipelineStartX, pipelineY1, "", "dct", minDctCoeffGlobal, maxDctCoeffGlobal);
    drawBlock(quantizedMatrix, pipelineStartX, pipelineY2, "", "quantized", minDctCoeffGlobal, maxDctCoeffGlobal);
    drawBlock(outputMatrix, pipelineStartX, pipelineY3, "", "reconstructed", 0, 255);
    
    // Le coordinate per basisGrid (basisGridStartX, basisGridStartYGlobal, actualBasisGridDrawY) 
    // sono ora calcolate in setup e windowResized
    drawBasisFunctionsDisplay();
}

function drawBasisFunctionsDisplay() {
    push();
    
    fill(80); 
    textSize(max(9, 13 * (blockDisplaySize/120) )); // Scala textSize
    textAlign(CENTER, CENTER);
    text("Funzioni Base della DCT", basisGridStartX + basisGridTotalWidth / 2, basisGridStartYGlobal + labelHeight / 2 - 5); 

    fill(100); 
    textSize(max(7, 11 * (blockDisplaySize/120) )); // Scala textSize
    text(`${activeBasisFunctionsCount} / ${N*N} attive`, basisGridStartX + basisGridTotalWidth / 2, basisGridStartYGlobal + labelHeight / 2 + 10);

    for (let u_idx = 0; u_idx < N; u_idx++) {
        for (let v_idx = 0; v_idx < N; v_idx++) {
            let basisBlockX = basisGridStartX + v_idx * (basisBlockDisplaySize + basisInterBlockPadding);
            let basisBlockY = actualBasisGridDrawY + u_idx * (basisBlockDisplaySize + basisInterBlockPadding); 
            
            let isActive = (quantizedMatrix[u_idx][v_idx] !== 0);

            for (let x = 0; x < N; x++) { for (let y = 0; y < N; y++) {
                let val = allBasisFunctions[u_idx][v_idx][x][y];
                let displayVal = map(val, -1, 1, 0, 255);
                fill(displayVal);
                noStroke();
                rect(basisBlockX + y * basisCellSize, basisBlockY + x * basisCellSize, basisCellSize, basisCellSize);
            }}
            
            if (!isActive) {
                fill(0, 0, 0, 150); 
                noStroke();
                rect(basisBlockX, basisBlockY, basisBlockDisplaySize, basisBlockDisplaySize);
            }

            noFill();
            if (u_idx === hoveredBasisU && v_idx === hoveredBasisV) {
                stroke(highlightColor);
                strokeWeight(1.5 * (basisCellSize/2)); // Scala strokeWeight
            } else {
                stroke(isActive ? 180 : 100); 
                strokeWeight(0.5 * (basisCellSize/2)); // Scala strokeWeight
            }
            rect(basisBlockX, basisBlockY, basisBlockDisplaySize, basisBlockDisplaySize);
        }
    }
    pop();
}

function drawBlock(matrix, startX, startY, label, blockType, dataMin, dataMax, isSelected = false) {
    for (let i = 0; i < N; i++) { for (let j = 0; j < N; j++) {
        let val = matrix[i][j];
        let displayVal;
        push();

        let isHoveredCoefficient = (i === hoveredBasisU && j === hoveredBasisV);
        let isDC = (i === 0 && j === 0);

        let cellStrokeColor = color(220);
        let cellStrokeWeight = 0.5 * (cellDisplaySize / (120/N) ); // Scala strokeWeight

        if (blockType === "original") { 
            displayVal = constrain(val, 0, 255);
            fill(displayVal);
            if (isSelected) {
                cellStrokeColor = selectedBlockHighlightColor;
                cellStrokeWeight = 2 * (cellDisplaySize / (120/N) ); // Scala strokeWeight
            }
        } else if (blockType === "reconstructed") {
             displayVal = constrain(val, 0, 255);
            fill(displayVal);
        }else if (blockType === "dct") {
            displayVal = map(val, dataMin, dataMax, 0, 255);
            fill(displayVal);
            if (isHoveredCoefficient) {
                cellStrokeColor = highlightColor;
                cellStrokeWeight = 1.5 * (cellDisplaySize / (120/N) ); // Scala strokeWeight
            } else if (isDC) {
                cellStrokeColor = dcHighlightColor;
                cellStrokeWeight = 1.5 * (cellDisplaySize / (120/N) ); // Scala strokeWeight
            }
        } else if (blockType === "quantized") {
            let isAssociatedBasisActive = (val !== 0); 
            if (!isAssociatedBasisActive && !isHoveredCoefficient) { 
                fill(230); 
            } else {
                displayVal = map(val, dataMin, dataMax, 0, 255);
                fill(displayVal);
            }

            if (isHoveredCoefficient) {
                cellStrokeColor = highlightColor;
                cellStrokeWeight = 1.5 * (cellDisplaySize / (120/N) ); // Scala strokeWeight
            } else if (isDC) { 
                cellStrokeColor = dcHighlightColor;
                cellStrokeWeight = 1.5 * (cellDisplaySize / (120/N) ); // Scala strokeWeight
                if (map(val,dataMin,dataMax,0,255) === 230 && val !==0) { 
                     displayVal = map(val, dataMin, dataMax, 0, 255);
                     fill(displayVal);
                } else if (val === 0 && !isHoveredCoefficient) { 
                    displayVal = map(val, dataMin, dataMax, 0, 255);
                    fill(displayVal);
                }
            }
        }
        stroke(cellStrokeColor);
        strokeWeight(cellStrokeWeight);
        rect(startX + j * cellDisplaySize, startY + i * cellDisplaySize, cellDisplaySize, cellDisplaySize);
        pop();
    }}}

