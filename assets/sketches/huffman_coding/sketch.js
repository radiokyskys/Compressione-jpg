let inputField;
let huffmanCodes = {};
let encoded = '';
let inputText = '';
let paragraph;

function setup() {
  let canvasContainer = select('#canvas-container');
  let cnv = createCanvas(canvasContainer.width, canvasContainer.height);
  cnv.parent('canvas-container');

  paragraph = createP("Huffman – Inserisci solo numeri:");
  paragraph.parent('controls-container');

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
    huffmanCodes = {};
    return;
  }

  let freq = {};
  for (let char of inputText) {
    freq[char] = (freq[char] || 0) + 1;
  }

  let nodes = [];
  for (let char in freq) {
    nodes.push({ char, freq: freq[char], left: null, right: null });
  }

  while (nodes.length > 1) {
    nodes.sort((a, b) => a.freq - b.freq);
    let left = nodes.shift();
    let right = nodes.shift();
    nodes.push({ char: null, freq: left.freq + right.freq, left, right });
  }

  let tree = nodes[0];
  huffmanCodes = {};
  buildCodes(tree, '');

  encoded = '';
  for (let char of inputText) {
    encoded += huffmanCodes[char] + ' ';
  }
}

function buildCodes(node, code) {
  if (!node.left && !node.right) {
    huffmanCodes[node.char] = code;
    return;
  }
  buildCodes(node.left, code + '0');
  buildCodes(node.right, code + '1');
}

function drawScrollableText(str, x, y, w, h, lineHeight = 20) {
  let parts = str.match(new RegExp(`.{1,${Math.floor(w / 10)}}`, 'g')) || [];
  let maxLines = Math.floor(h / lineHeight);
  let totalLines = parts.length;
  let start = totalLines > maxLines ? totalLines - maxLines : 0;

  for (let i = 0; i < maxLines && i + start < totalLines; i++) {
    let line = parts[start + i];
    if (i === 0 && totalLines > maxLines) line = '...' + line.slice(3);
    text(line, x, y + i * lineHeight);
  }
}

function draw() {
  background(240);
  fill(0);
  text("Input:", 20, 30);
  drawScrollableText(inputText, 80, 30, width - 100, height * 0.15);

  text("Codici Huffman:", 20, height * 0.25);
  let sortedDigits = Object.keys(huffmanCodes).sort();
  let huffmanCodesTextY = height * 0.25 + 20;
  let lineHeight = 20;
  for (let i = 0; i < sortedDigits.length; i++) {
    let digit = sortedDigits[i];
    text(`${digit} → ${huffmanCodes[digit]}`, 40, huffmanCodesTextY + i * lineHeight);
  }

  let outputLabelY = height * 0.85;
  text("Output codificato:", 20, outputLabelY);

  let outputTextAreaStartY = outputLabelY + lineHeight;
  let bottomMargin = 20;
  let availableHeightForOutputText = height - outputTextAreaStartY - bottomMargin;
  let outputTextAreaHeight = max(lineHeight, availableHeightForOutputText);

  drawScrollableText(encoded, 20, outputTextAreaStartY, width - 40, outputTextAreaHeight);
}

function windowResized() {
  let canvasContainer = select('#canvas-container');
  resizeCanvas(canvasContainer.width, canvasContainer.height);
}