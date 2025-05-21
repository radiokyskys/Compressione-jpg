// --- Dati di Esempio ---

// This is the standard table that will be *displayed* in the middle block
// AND USED FOR ACTUAL QUANTIZATION for Table 3.
const STANDARD_LUMINANCE_QUANT_TABLE = [
  [16, 11, 10, 16, 24, 40, 51, 61],
  [12, 12, 14, 19, 26, 58, 60, 55],
  [14, 13, 16, 24, 40, 57, 69, 56],
  [14, 17, 22, 29, 51, 87, 80, 62],
  [18, 22, 37, 56, 68, 109, 103, 77],
  [24, 35, 55, 64, 81, 104, 113, 92],
  [49, 64, 78, 87, 103, 121, 120, 101],
  [72, 92, 95, 98, 112, 100, 103, 99]
];

// Matrice per i coefficienti DCT quantizzati (usando la tabella di luminanza)
let quantizedDCTCoefficientLuminance = [];
let originalQuantizedForColorMapping = []; // NUOVO: Per conservare i valori originali per il mapping dei colori

// --- Impostazioni e Logica dello Sketch p5.js ---

// Nomi delle tabelle per riferimento
const titleDCTOriginal = "Coefficienti DCT Originali";
const titleQuantTable = "Tabella Quant."; // Static title
const titleDCTQuantized = "DCT Quantizzati"; // Static title

let displayMode = 'numeric'; // 'numeric' or 'visual'
let toggleButton;

// Globals for min/max values for grayscale mapping
let minQDCTVal, maxQDCTVal;

let sourceData = []; // For Table 1 display & as source for Table 3 calculation

// Globals for dimensions, dynamically calculated
let canvasWidthGlobal, canvasHeightGlobal;
let cellWidth, cellHeight, tableSpacingX, tableSpacingY, titleHeight;
let textSizeVal, textSizeTableTitle;
let canvasMargin;

function setup() {
  // Populate sourceData (Table 1) with a diagonal gradient
  const N_SRC = 8;
  for (let r = 0; r < N_SRC; r++) {
    sourceData[r] = [];
    for (let c = 0; c < N_SRC; c++) {
      // Diagonal gradient: 127 (white) top-left to -128 (black) bottom-right
      sourceData[r][c] = Math.round(map(r + c, 0, (N_SRC - 1) * 2, 127, -128));
    }
  }

  // Calculate quantizedDCTCoefficientLuminance (Table 3)
  minQDCTVal = Infinity;
  maxQDCTVal = -Infinity;
  quantizedDCTCoefficientLuminance = []; // Initialize
  originalQuantizedForColorMapping = []; // NUOVO: Inizializza

  for (let r = 0; r < 8; r++) {
    quantizedDCTCoefficientLuminance[r] = [];
    originalQuantizedForColorMapping[r] = []; // NUOVO: Inizializza riga
    for (let c = 0; c < 8; c++) {
      const val = Math.round(sourceData[r][c] / STANDARD_LUMINANCE_QUANT_TABLE[r][c]);
      quantizedDCTCoefficientLuminance[r][c] = val;
      originalQuantizedForColorMapping[r][c] = val; // NUOVO: Salva il valore originale per il colore
      if (val < minQDCTVal) minQDCTVal = val;
      if (val > maxQDCTVal) maxQDCTVal = val;
    }
  }

  // Ensure min/max are different for mapping if all values are the same
  if (minQDCTVal === maxQDCTVal) maxQDCTVal++;

  // --- NUOVA MODIFICA: Aggiungi 1 a tutti i valori di quantizedDCTCoefficientLuminance ---
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      quantizedDCTCoefficientLuminance[r][c] += 1;
    }
  }
  // --- FINE NUOVA MODIFICA ---

  updateLayout(); // Calcola le dimensioni iniziali
  createCanvas(canvasWidthGlobal, canvasHeightGlobal);
  
  toggleButton = select('#toggleViewButton');
  if (toggleButton) {
    toggleButton.mousePressed(toggleDisplayMode);
    // Initialize button text based on current displayMode (already done in HTML, but good practice)
    // toggleButton.html(displayMode === 'numeric' ? 'Mostra Visualizzazione Grafica' : 'Mostra Visualizzazione Numerica');
  }
  // textAlign e textSize verranno impostati dinamicamente in draw() o drawTable()
}

function windowResized() {
  updateLayout();
  resizeCanvas(canvasWidthGlobal, canvasHeightGlobal);
}

function updateLayout() {
    let W = windowWidth;
    let H = windowHeight; // Altezza dell'iframe (circa 660px)

    // Rapporti per dimensioni dipendenti da cellWidth (1x4 LAYOUT)
    const cellHeightToWidthRatio = 1;
    const tableSpacingXRatio = 0.5;      // Spazio tra tabelle orizzontalmente (ridotto per layout 1x4)
    // tableSpacingYRatio non è più necessario per un layout 1x4
    const titleHeightRatio = 0.6;        // Altezza per il titolo di ogni tabella
    const canvasMarginRatio = 0.25;       // Moltiplicatore per cellWidth per i margini laterali (ridotto)
    const canvasTopBottomMarginRatio = 0.5; // Margini sopra/sotto per il canvas rispetto al contenuto

    // Calcola cellWidth per adattare l'intero layout (1x4 LAYOUT)
    // Larghezza totale in unità di cellWidth: 4 tabelle * 8 celle + 3 spazi tra tabelle + 2 margini laterali
    // let totalContentWidthInCellWidthUnits = (4 * 8) + (3 * tableSpacingXRatio); // OLD for 4 tables
    let totalContentWidthInCellWidthUnits = (3 * 8) + (2 * tableSpacingXRatio); // NEW for 3 tables
    let totalCanvasWidthInCellWidthUnits = totalContentWidthInCellWidthUnits + (2 * canvasMarginRatio);

    // Altezza totale in unità di cellWidth: 1 riga di tabelle (contenuto + titolo) + 2 margini sopra/sotto
    let tableContentHeightInCellWidthUnits = (8 * cellHeightToWidthRatio);
    let oneBlockHeightInCellWidthUnits = tableContentHeightInCellWidthUnits + titleHeightRatio;
    let totalCanvasHeightInCellWidthUnits = oneBlockHeightInCellWidthUnits + (2 * canvasTopBottomMarginRatio);

    // Scegli cellWidth basandoti sulla dimensione più limitante (larghezza o altezza)
    let cellWidth_basedOnWidth = W / totalCanvasWidthInCellWidthUnits;
    let cellWidth_basedOnHeight = H / totalCanvasHeightInCellWidthUnits;

    cellWidth = min(cellWidth_basedOnWidth, cellWidth_basedOnHeight);
    cellWidth = max(cellWidth, 5); // Larghezza minima cella 5px per visibilità

    // Aggiorna tutte le dimensioni dipendenti (1x4 LAYOUT)
    cellHeight = cellWidth * cellHeightToWidthRatio;
    tableSpacingX = cellWidth * tableSpacingXRatio;
    // tableSpacingY non è più necessario
    titleHeight = cellWidth * titleHeightRatio;
    canvasMargin = cellWidth * canvasMarginRatio; // Margini laterali del canvas
    let canvasTopBottomMargin = cellWidth * canvasTopBottomMarginRatio; // Margini sopra/sotto del canvas

    // Dimensioni effettive del canvas (1x4 LAYOUT)
    // La larghezza del canvas usa tutta la larghezza disponibile (W) per permettere lo scroll orizzontale se necessario,
    // oppure la larghezza calcolata se più piccola.
    // L'altezza del canvas è basata sul contenuto calcolato.
    canvasWidthGlobal = max(W, totalCanvasWidthInCellWidthUnits * cellWidth); // Usa W o la larghezza calcolata
    canvasHeightGlobal = totalCanvasHeightInCellWidthUnits * cellWidth;
    
    // Dimensioni testo base (1x4 LAYOUT)
    textSizeVal = cellWidth * 0.35;
    textSizeVal = max(textSizeVal, 6); 
    textSizeTableTitle = cellWidth * 0.4;
    textSizeTableTitle = max(textSizeTableTitle, 7); 
}

function draw() {
  background(240);
  
  let currentTableContentWidth = 8 * cellWidth;
  let currentTableCellsHeight = 8 * cellHeight; // Altezza solo delle celle (8*cH)
  let canvasActualTopMargin = (canvasHeightGlobal - (currentTableCellsHeight + titleHeight)) / 2;
  canvasActualTopMargin = max(canvasActualTopMargin, cellWidth * 0.25); // Assicura un minimo margine superiore

  // Y comune per tutte le tabelle, centrato verticalmente con spazio per titolo (1x4 LAYOUT)
  // L'origine Y delle celle parte dopo il margine superiore del canvas e l'altezza del titolo
  let common_Y_cells_start = canvasActualTopMargin + titleHeight;

  // X per la prima tabella, considera il margine laterale del canvas
  let table1_cells_X = canvasMargin;

  // X per le tabelle successive
  let table2_cells_X = table1_cells_X + currentTableContentWidth + tableSpacingX;
  let table3_cells_X = table2_cells_X + currentTableContentWidth + tableSpacingX;
  // let table4_cells_X = table3_cells_X + currentTableContentWidth + tableSpacingX; // OLD for 4 tables

  // Seleziona i dati e i titoli corretti in base alla vista corrente - SIMPLIFIED
  // let currentQuantTable, currentQuantizedDCTCoefficients; // REMOVED
  // let titleQuantTable, titleDCTQuantized; // REMOVED local versions

  // Disegna le tabelle
  drawTable(titleDCTOriginal, sourceData, table1_cells_X, common_Y_cells_start, cellWidth, cellHeight, titleHeight, textSizeVal, textSizeTableTitle, displayMode); // First table uses sourceData
  drawTable(titleQuantTable, STANDARD_LUMINANCE_QUANT_TABLE, table2_cells_X, common_Y_cells_start, cellWidth, cellHeight, titleHeight, textSizeVal, textSizeTableTitle, 'numeric'); // Second table uses STANDARD_LUMINANCE_QUANT_TABLE, always numeric
  // drawTable(titleQuantChrominance, chrominanceQuantTable, table3_cells_X, common_Y_cells_start, cellWidth, cellHeight, titleHeight, textSizeVal, textSizeTableTitle); // OLD for 4 tables
  drawTable(titleDCTQuantized, quantizedDCTCoefficientLuminance, table3_cells_X, common_Y_cells_start, cellWidth, cellHeight, titleHeight, textSizeVal, textSizeTableTitle, displayMode); // Third table uses displayMode
}

// Renamed from toggleQuantizationView to toggleDisplayMode
function toggleDisplayMode() {
  if (displayMode === 'numeric') {
    displayMode = 'visual';
    if (toggleButton) toggleButton.html('Mostra Visualizzazione Numerica');
  } else {
    displayMode = 'numeric';
    if (toggleButton) toggleButton.html('Mostra Visualizzazione Grafica');
  }
  redraw(); // Ridisegna lo sketch con la nuova vista
}

function drawTable(title, data, cellsOriginX, cellsOriginY, cW, cH, currentTitleHeight, currentTextSizeVal, currentTextSizeTableTitle, currentDisplayMode) { // Added currentDisplayMode
  push(); // Isola trasformazioni e stili

  // Disegna il titolo della tabella
  fill(0); 
  noStroke();
  textAlign(CENTER, BOTTOM); // Allinea il testo del titolo in basso nello spazio assegnato
  textSize(currentTextSizeTableTitle);
  text(title, cellsOriginX + (8 * cW) / 2, cellsOriginY - 2); // Disegna titolo sopra le celle, con piccolo padding

  translate(cellsOriginX, cellsOriginY); // L'origine è ora in alto a sinistra della prima cella

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      let x = j * cW;
      let y = i * cH;
      let value = data[i][j];

      // Default cell appearance
      stroke(150);
      strokeWeight(max(0.5, cellWidth / 40));
      fill(255);
      rect(x, y, cW, cH);

      // Special red stroke for non-zero values ONLY in numeric mode 
      // Applies to Table 1 (sourceData) and Table 3 (quantizedDCTCoefficientLuminance)
      if (currentDisplayMode === 'numeric' && (title === titleDCTOriginal || title === titleDCTQuantized) && value !== 0) {
        push(); // Save current style
        noFill();
        stroke(255, 0, 0);
        strokeWeight(max(1, cellWidth / 20));
        rect(x, y, cW, cH);
        pop(); // Restore style
      }

      // Conditional drawing based on displayMode
      if (currentDisplayMode === 'numeric' || title === titleQuantTable) { // Show numbers if numeric mode OR if it's the Quantization Table (always numeric)
        noStroke();      
        fill(50);        
        textAlign(CENTER, CENTER);
        textSize(currentTextSizeVal); // Imposta dimensione testo per valori cella
        text(value, x + cW / 2, y + cH / 2);
      } else { // Visual mode for Table 1 or Table 3 (since Table 2 is handled by the condition above)
        let grayVal = 128; // Default gray
        let valueForColor;
        if (title === titleDCTOriginal) {
          // Map value from sourceData (127 white to -128 black) to grayscale (255 white to 60 dark gray)
          valueForColor = value; // 'value' qui è da sourceData
          grayVal = map(valueForColor, -128, 127, 60, 255); 
        } else if (title === titleDCTQuantized) {
          // Usa il valore originale da originalQuantizedForColorMapping per il colore
          valueForColor = originalQuantizedForColorMapping[i][j]; 
          grayVal = map(valueForColor, minQDCTVal, maxQDCTVal, 60, 255);
        }
        fill(grayVal);
        noStroke();
        rect(x, y, cW, cH); // Draw grayscale block over the white one
      }
    }
  }
  pop(); // Ripristina trasformazioni e stili
} 