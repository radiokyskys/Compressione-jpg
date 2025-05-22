let inputText = '';
let encoded = '';
let effectiveEncoded = '';
let inputField;
let titleP;

function setup() {
  let canvasContainer = select('#canvas-container');
  let cnv = createCanvas(canvasContainer.width, canvasContainer.height);
  cnv.parent('canvas-container');

  titleP = createP("RLE – Inserisci solo numeri:");
  titleP.parent('controls-container');

  inputField = createInput('');
  inputField.parent('controls-container');
  inputField.input(processInput);

  textFont('Inter, Helvetica, Arial, sans-serif');
  textSize(16);
}

function processInput() {
  inputText = this.value().replace(/\D/g, '');
  if (inputText.length === 0) {
    encoded = '';
    effectiveEncoded = '';
    return;
  }

  let resultForFormattedEncoded = [];
  let compactRLEString = "";

  let current = inputText[0];
  let count = 1;
  for (let i = 1; i < inputText.length; i++) {
    if (inputText[i] === current) {
      count++;
    } else {
      resultForFormattedEncoded.push(`(${current},${count}), `);
      compactRLEString += `${current}${count} `;
      current = inputText[i];
      count = 1;
    }
  }
  resultForFormattedEncoded.push(`(${current},${count}), `);
  compactRLEString += `${current}${count} `;
  
  encoded = resultForFormattedEncoded.join('');
  if (encoded.length > 2) {
    encoded = encoded.slice(0, -2);
  }
  effectiveEncoded = compactRLEString;
}

function drawScrollableText(str, x, yStartBaseline, w, h, displayLineHeight = 20) { 
  let charsPerLine = 1;
  // Calcola i caratteri per riga in modo più accurato rispetto a 'w/10'
  if (textWidth('M') > 0) { 
      charsPerLine = Math.floor(w / textWidth('M'));
  }
  if (charsPerLine <= 0) charsPerLine = 1; // Salvaguardia

  let parts = [];
  if (str && str.length > 0) {
    const regex = new RegExp(`.{1,${charsPerLine}}`, 'g');
    parts = str.match(regex) || [];
  }
  
  let maxLines = 0;
  if (displayLineHeight > 0) {
      maxLines = Math.floor(h / displayLineHeight);
  }
  if (maxLines < 0) maxLines = 0;
  
  let totalLines = parts.length;
  // Determina da quale riga iniziare a disegnare per l'effetto "scrolling"
  // Se il testo eccede maxLines, startDisplayLineIndex > 0
  let startDisplayLineIndex = 0; 
  if (totalLines > maxLines) {
    startDisplayLineIndex = totalLines - maxLines;
  }

  for (let i = 0; i < maxLines && (startDisplayLineIndex + i) < totalLines; i++) {
    let lineToDraw = parts[startDisplayLineIndex + i];
    
    // --- INIZIO LOGICA PER I TRE PUNTINI (RIPRISTINATA) ---
    // Se stiamo disegnando la prima riga visibile (i === 0) 
    // E il testo è effettivamente "scrollato" (startDisplayLineIndex > 0),
    // allora aggiungi "..." all'inizio.
    if (i === 0 && startDisplayLineIndex > 0) { 
      lineToDraw = '...' + lineToDraw.slice(3); // Sostituisce i primi 3 caratteri con "..."
    }
    // --- FINE LOGICA PER I TRE PUNTINI ---
    
    text(lineToDraw, x, yStartBaseline + i * displayLineHeight);
  }
}

function draw() {
  background(240);
  fill(0);

  // Parametri di layout (come da ultima versione)
  let topPageMargin = 20;
  let bottomPageMargin = 20;
  let xPosition = 20;
  let contentWidth = width - (2 * xPosition);

  let labelBaselineOffset = 16;
  let reservedHeightForLabelArea = 40; 
  let scrollTextLineHeight = 20; // Righe di testo più compatte

  let shortGapBetweenSections = 15;
  let normalGapBetweenSections = 30;

  let availableHeightOnCanvas = height - topPageMargin - bottomPageMargin;
  let totalHeightForAllLabelAreas = 3 * reservedHeightForLabelArea;
  let totalHeightForInBetweenGaps = shortGapBetweenSections + normalGapBetweenSections;
  
  let remainingHeightForTextAreas = availableHeightOnCanvas - totalHeightForAllLabelAreas - totalHeightForInBetweenGaps;
  let textAreaCalculatedHeight = Math.floor(remainingHeightForTextAreas / 3);

  if (textAreaCalculatedHeight < scrollTextLineHeight && scrollTextLineHeight > 0) {
    textAreaCalculatedHeight = scrollTextLineHeight;
  } else if (textAreaCalculatedHeight < 0) {
    textAreaCalculatedHeight = 0;
  }

  let currentY = topPageMargin;

  // --- Sezione 1: Input ---
  text("Input:", xPosition, currentY + labelBaselineOffset);
  drawScrollableText(inputText, xPosition, currentY + reservedHeightForLabelArea, contentWidth, textAreaCalculatedHeight, scrollTextLineHeight);
  currentY += reservedHeightForLabelArea + textAreaCalculatedHeight;

  currentY += shortGapBetweenSections;

  // --- Sezione 2: Output RLE (formato | n,n |) ---
  text("Output RLE formato '( n, n )' (per semplificarne la comprensione):", xPosition, currentY + labelBaselineOffset);
  drawScrollableText(encoded, xPosition, currentY + reservedHeightForLabelArea, contentWidth, textAreaCalculatedHeight, scrollTextLineHeight);
  currentY += reservedHeightForLabelArea + textAreaCalculatedHeight;

  currentY += normalGapBetweenSections;

  // --- Sezione 3: Output RLE compatto (ncncnc...) ---
  text("Output RLE compatto (effettivo output RLE):", xPosition, currentY + labelBaselineOffset);
  drawScrollableText(effectiveEncoded, xPosition, currentY + reservedHeightForLabelArea, contentWidth, textAreaCalculatedHeight, scrollTextLineHeight);
}

function windowResized() {
  let canvasContainer = select('#canvas-container');
  resizeCanvas(canvasContainer.width, canvasContainer.height);
} 