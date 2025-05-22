// Variabili Globali
let inputTextElement;
let huffmanStats = {
  overallMinFreq: 0,
  overallMaxFreq: 0
  // minCodeLenAmongPresent e maxCodeLen verranno calcolate dinamicamente in draw
};

// --- Funzione setup di p5.js ---
function setup() {
  createCanvas(800, 950);
  
  let title = createP("Visualizzatore Interattivo Codifica Huffman: l'Effetto Onda");
  title.position(20, 5);
  title.style('font-size', '18px');
  title.style('font-weight', 'bold');

  let inputLabel = createP("Inserisci una stringa di numeri (0-9):");
  inputLabel.position(20, 40);

  inputTextElement = createInput('');
  inputTextElement.position(20, 80);
  inputTextElement.size(350);
  inputTextElement.input(processInputAndUpdate);

  textFont('Inter, Arial, sans-serif');
  
  processInputAndUpdate();
}

// --- Funzione draw di p5.js (loop di disegno) ---
function draw() {
  background(240);
  
  displayStaticText();
  displayHuffmanTable();
  drawHuffmanWaveVisualization();
}

// --- Mostra l'input corrente ---
function displayStaticText() {
  fill(0);
  noStroke();
  textSize(14);
  text("Input Corrente: " + inputTextElement.value().replace(/\D/g, ''), 20, 125);
}

// --- Logica per processare l'input e calcolare Huffman ---
function processInputAndUpdate() {
  let currentText = inputTextElement.value().replace(/\D/g, '');
  // Resetta huffmanStats; min/max freq e len verranno ricalcolati se necessario
  huffmanStats = { overallMinFreq: 0, overallMaxFreq: 0 }; 

  if (currentText.length === 0) {
    return;
  }

  let localFreqMap = {};
  for (let char of currentText) {
    localFreqMap[char] = (localFreqMap[char] || 0) + 1;
  }

  let nodesForTree = [];
  for (let char in localFreqMap) {
    nodesForTree.push({ char: char, freq: localFreqMap[char], left: null, right: null });
  }

  if (nodesForTree.length === 0) return;

  let localHuffmanCodeMap = {};
  if (nodesForTree.length === 1) {
    if (nodesForTree[0] && nodesForTree[0].char) {
      localHuffmanCodeMap[nodesForTree[0].char] = '0';
    }
  } else if (nodesForTree.length > 1) {
    let treeRoot = buildTreeFromNodes(nodesForTree);
    if (treeRoot) {
      generateCodesFromTree(treeRoot, '', localHuffmanCodeMap);
    }
  }
  
  let freqsFound = [];
  for (let i = 0; i <= 9; i++) {
    const sym = i.toString();
    if (localFreqMap[sym]) {
      const code = localHuffmanCodeMap[sym] || '';
      // Assicura che il caso del singolo simbolo abbia codice '0' e lunghezza 1
      const finalCode = (Object.keys(localFreqMap).length === 1 && nodesForTree.length === 1 && nodesForTree[0].char === sym && code === '') ? '0' : code;
      
      huffmanStats[sym] = {
        freq: localFreqMap[sym],
        code: finalCode,
        codeLen: finalCode.length
      };
      if (localFreqMap[sym] > 0) {
        freqsFound.push(localFreqMap[sym]);
      }
    }
  }

  if (freqsFound.length > 0) {
    huffmanStats.overallMinFreq = Math.min(...freqsFound);
    huffmanStats.overallMaxFreq = Math.max(...freqsFound);
  } else {
    huffmanStats.overallMinFreq = 0;
    huffmanStats.overallMaxFreq = 0;
  }
}

function buildTreeFromNodes(nodesArray) {
  let currentNodes = [...nodesArray];
  while (currentNodes.length > 1) {
    currentNodes.sort((a, b) => {
      if (a.freq !== b.freq) return a.freq - b.freq;
      if (a.char && b.char) return a.char.localeCompare(b.char);
      if (a.char) return -1; 
      if (b.char) return 1;
      return 0; 
    });
    let left = currentNodes.shift();
    let right = currentNodes.shift();
    currentNodes.push({ char: null, freq: left.freq + right.freq, left: left, right: right });
  }
  return currentNodes.length > 0 ? currentNodes[0] : null;
}

function generateCodesFromTree(node, currentCode, codeMapToFill) {
  if (!node) return;
  if (!node.left && !node.right) { // Nodo foglia
    if (node.char) {
      codeMapToFill[node.char] = currentCode;
    }
    return;
  }
  generateCodesFromTree(node.left, currentCode + '0', codeMapToFill);
  generateCodesFromTree(node.right, currentCode + '1', codeMapToFill);
}

function displayHuffmanTable() {
  let startY = 155;
  let xPosSymbol = 30;
  let xPosFreq = 120;
  let xPosCode = 200;
  let xPosLen = 330;
  let lineHeight = 20;

  fill(50);
  noStroke();
  textSize(14);
  textStyle(BOLD);
  text("Simbolo", xPosSymbol, startY);
  text("Freq.", xPosFreq, startY);
  text("Codice Huffman", xPosCode, startY);
  text("Lunghezza", xPosLen, startY);
  textStyle(NORMAL);
  startY += lineHeight;

  stroke(180);
  line(xPosSymbol - 10, startY - (lineHeight / 2) + 2, xPosLen + 80, startY - (lineHeight / 2) + 2);
  noStroke();

  let displayOrder = "0123456789".split('');
  for (let sym of displayOrder) {
    if (huffmanStats[sym]) {
      let stat = huffmanStats[sym];
      let codeDisplay = stat.code.length > 0 ? stat.code : "-";
      let lenDisplay = stat.code.length > 0 ? stat.codeLen : "-"; // Già gestito da codeLen
      text(sym, xPosSymbol + 25, startY + 5);
      text(stat.freq, xPosFreq + 15, startY + 5);
      text(codeDisplay, xPosCode, startY + 5);
      text(lenDisplay, xPosLen + 30, startY + 5);
      startY += lineHeight;
    }
  }
}

function drawHuffmanWaveVisualization() {
  let tableApproxEndHeight = 155 + 20 + (10 * 20) + 20; 
  let plotX = 60;
  let plotY = tableApproxEndHeight;
  let plotWidth = width - plotX * 2; 
  let plotHeight = height - plotY - 70;
  if (plotHeight < 150) plotHeight = 150;

  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(16);
  textStyle(BOLD);
  //text("Lunghezze Codici Huffman ('Effetto Onda')", plotX + plotWidth / 2, plotY - 25);
  textStyle(NORMAL);

  stroke(100);
  strokeWeight(1);
  line(plotX, plotY + plotHeight, plotX + plotWidth, plotY + plotHeight);
  line(plotX, plotY, plotX, plotY + plotHeight);

  fill(0);
  noStroke();
  textAlign(CENTER, TOP);
  textSize(12);
  for (let i = 0; i <= 9; i++) {
    let x = map(i, 0, 9, plotX, plotX + plotWidth);
    text(i.toString(), x, plotY + plotHeight + 8);
  }
  
  push();
  translate(plotX - 45, plotY + plotHeight / 2);
  rotate(-HALF_PI);
  textAlign(CENTER, CENTER);
  textSize(14);
  text("Lunghezza Codice", 0, 0);
  pop();

  // Calcolo min/max CodeLen per la normalizzazione del colore e dell'asse Y
  let maxCodeLen = 0;
  let minCodeLenAmongPresent = Infinity; // Inizializza alto per trovare il minimo
  let actualSymbolsPresent = 0;

  for (let i = 0; i <= 9; i++) {
    const sym = i.toString();
    if (huffmanStats[sym] && huffmanStats[sym].codeLen > 0) {
      actualSymbolsPresent++;
      let len = huffmanStats[sym].codeLen;
      if (len > maxCodeLen) maxCodeLen = len;
      // --- CORREZIONE DEL REFUSO QUI ---
      if (len < minCodeLenAmongPresent) minCodeLenAmongPresent = len; 
      // --- FINE CORREZIONE ---
    }
  }

  // Gestione casi limite per min/max CodeLen
  if (actualSymbolsPresent === 0) { 
    maxCodeLen = 1; 
    minCodeLenAmongPresent = 1; 
  } else if (actualSymbolsPresent === 1) {
    // Se c'è un solo simbolo, la sua lunghezza è 1 (per il codice '0')
    // minCodeLenAmongPresent e maxCodeLen dovrebbero già essere 1 dal loop sopra
    // Ma per sicurezza, li forziamo se necessario
     for (let sym in huffmanStats) { 
         if (huffmanStats[sym] && huffmanStats[sym].code === '0' && huffmanStats[sym].codeLen === 1) {
             maxCodeLen = 1;
             minCodeLenAmongPresent = 1;
         }
         // Se c'è un solo simbolo, questo loop girerà una volta sola
         if(huffmanStats[sym] && huffmanStats[sym].codeLen > 0){ // In caso di un solo simbolo, len è 1
            maxCodeLen = huffmanStats[sym].codeLen;
            minCodeLenAmongPresent = huffmanStats[sym].codeLen;
         }
         break; 
     }
     if(maxCodeLen === 0) maxCodeLen = 1; // Fallback se il simbolo unico non ha len
     if(minCodeLenAmongPresent === Infinity) minCodeLenAmongPresent = maxCodeLen;


  } else {
    // Se minCodeLenAmongPresent è rimasto Infinity ma ci sono simboli, 
    // significa che tutti i simboli avevano len 0 (improbabile con Huffman corretto)
    // o c'è stato un problema. Fallback sicuro:
    if (minCodeLenAmongPresent === Infinity) minCodeLenAmongPresent = (maxCodeLen > 0 ? maxCodeLen : 1); 
  }
  // Assicura che maxCodeLen sia almeno quanto minCodeLenAmongPresent e almeno 1 se ci sono simboli
  if (maxCodeLen < minCodeLenAmongPresent) maxCodeLen = minCodeLenAmongPresent;
  if (maxCodeLen === 0 && actualSymbolsPresent > 0) maxCodeLen = 1;


  textAlign(RIGHT, CENTER);
  textSize(10);
  for (let l = 0; l <= maxCodeLen; l++) {
    // Mostra etichette solo per lunghezze nel range effettivo o 0
    if (l === 0 || (l >= minCodeLenAmongPresent && l <= maxCodeLen && minCodeLenAmongPresent !== Infinity) || maxCodeLen === 1 ) {
        let yTick = map(l, 0, maxCodeLen, plotY + plotHeight, plotY);
        fill(50);
        text(l, plotX - 8, yTick);
        if (l > 0 || (l===0 && minCodeLenAmongPresent === 0) ) {
            stroke(220);
            line(plotX - 2, yTick, plotX + plotWidth, yTick); 
        }
    }
  }
  
  let plottedPointsData = [];
  for (let i = 0; i <= 9; i++) {
    const symString = i.toString();
    if (huffmanStats[symString]) {
      let currentLen = huffmanStats[symString].codeLen;
      if (actualSymbolsPresent === 1 && huffmanStats[symString].code === '0') currentLen = 1;
      
      if (currentLen > 0 || (actualSymbolsPresent === 1 && currentLen === 1)) {
        let xPoint = map(i, 0, 9, plotX, plotX + plotWidth); 
        let yPoint = map(currentLen, 0, maxCodeLen, plotY + plotHeight, plotY);
        plottedPointsData.push({ x: xPoint, y: yPoint, len: currentLen, freq: huffmanStats[symString].freq, symbol: symString });
      }
    }
  }

  let waveStrokeWeight = 8;
  strokeWeight(waveStrokeWeight);
  noFill();

  let colorWhite = color(255);
  let colorBlack = color(0);

  if (plottedPointsData.length > 1) {
    for (let i = 0; i < plottedPointsData.length - 1; i++) {
      let p_b = plottedPointsData[i];    
      let p_c = plottedPointsData[i+1];  
      let p_a = (i === 0) ? p_b : plottedPointsData[i-1];
      let p_d = (i + 2 >= plottedPointsData.length) ? p_c : plottedPointsData[i+2];
      
      let numSubSegments = 15;
      let prevSubX = p_b.x;
      let prevSubY = p_b.y;

      for (let s = 1; s <= numSubSegments; s++) {
        let t = s / numSubSegments;
        let currentSubX = curvePoint(p_a.x, p_b.x, p_c.x, p_d.x, t);
        let currentSubY = curvePoint(p_a.y, p_b.y, p_c.y, p_d.y, t);

        let normYvalue;
        // Mappa l'altezza Y del punto corrente della curva (currentSubY) a un valore normalizzato 0-1
        // per la sfumatura. plotY+plotHeight (len bassa) -> 0 (bianco), plotY (len alta) -> 1 (nero).
        if (plotY + plotHeight === plotY) { // Evita divisione per zero se plotHeight è 0
            normYvalue = 0;
        } else {
            normYvalue = map(currentSubY, plotY + plotHeight, plotY, 0, 1);
        }
        normYvalue = constrain(normYvalue, 0, 1);
        
        let subSegmentColor = lerpColor(colorWhite, colorBlack, normYvalue);
        stroke(subSegmentColor);
        line(prevSubX, prevSubY, currentSubX, currentSubY);

        prevSubX = currentSubX;
        prevSubY = currentSubY;
      }
    }
  }
  
  for (let p of plottedPointsData) {
    let normLenPoint;
    if (plotY + plotHeight === plotY) {
        normLenPoint = 0;
    } else {
        normLenPoint = map(p.y, plotY + plotHeight, plotY, 0, 1);
    }
    normLenPoint = constrain(normLenPoint, 0, 1);
    let pointFillColor = lerpColor(colorWhite, colorBlack, normLenPoint);
    
    fill(pointFillColor);
    stroke(50, 50, 50, 150);
    strokeWeight(1.5); 
    ellipse(p.x, p.y, 24, 24);

    let textColor;
    if (normLenPoint < 0.5) { 
      textColor = color(0); // Nero
    } else { 
      textColor = color(255); // Bianco
    }
    fill(textColor); 
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(11); 
    text(p.symbol, p.x, p.y + 1);

    fill(0); 
    textSize(10);
    textAlign(CENTER, TOP); 
    text(`F:${p.freq}`, p.x, p.y + 15); 
  }

  textAlign(LEFT, BASELINE);
  textSize(14);
} 