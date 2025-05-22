const sketchRLE = (p) => { 
    let dctCoeffs = []; 
    let zigZagPath = []; 
    let scannedValues = []; 
    let rleValues = []; 
    let currentIndex = 0; 
    let animationPlaying = true; 
    const N_BLOCK = 8; // Rinominato N_s5 per chiarezza (N del Blocco)
    const CELL_SIZE = 48; // Rinominato cellSize_s5
    const MATRIX_DISPLAY_WIDTH = N_BLOCK * CELL_SIZE; 
    const DATA_DISPLAY_WIDTH = 300; 
    let canvasElement; // Per aggiungere l'event listener

    p.setup = () => {
        // Il canvas ospiterà la matrice 8x8 e l'area per i dati scansionati/RLE
        let sketchCanvas = p.createCanvas(
            MATRIX_DISPLAY_WIDTH + DATA_DISPLAY_WIDTH + 30, 
            N_BLOCK * CELL_SIZE + 70
        );
        // Aggancia il canvas al div #sketch-container definito nell'HTML
        sketchCanvas.parent('sketch-container'); 

        // Prova ad usare il font Inter, altrimenti usa Helvetica, Arial e sans-serif di fallback
        try {
            p.textFont('Inter, Helvetica, Arial, sans-serif');
        } catch (e) {
            console.warn("Font 'Inter' non trovato, uso fallback.");
            p.textFont('Helvetica, Arial, sans-serif'); // Fallback chain
        }
        p.textSize(11); // This is a base size, individual text elements might override it
        
        resetAnimationAndData(); 
        zigZagPath = generateZigZagPath(); 
        p.frameRate(4); // Velocità dell'animazione (4 frame al secondo)

        canvasElement = sketchCanvas.elt; // Ottieni l'elemento canvas DOM
        if (canvasElement) {
            canvasElement.addEventListener('click', () => {
                if (currentIndex >= zigZagPath.length) { // Animation finished
                    resetAnimationAndData();
                } else { // Animation is mid-way
                    if (animationPlaying) { // If playing
                        animationPlaying = false; // Pause it
                    } else { // If paused
                        resetAnimationAndData(); // Reset it
                    }
                }
            });
        }
    };

    function resetAnimationAndData() {
        // dctCoeffs = []; 
        // for (let i = 0; i < N_BLOCK; i++) {
        //     dctCoeffs[i] = [];
        //     for (let j = 0; j < N_BLOCK; j++) {
        //         if (i + j < 2) { 
        //             dctCoeffs[i][j] = p.int(p.random(10, 80) * (p.random() > 0.5 ? 1 : -1));
        //         } else if (i + j < 6) { 
        //             dctCoeffs[i][j] = p.int(p.random(-15, 15));
        //         } else { 
        //             dctCoeffs[i][j] = (p.random(1) < 0.65) ? 0 : p.int(p.random(-8, 8));
        //         }
        //     }
        // }
        // dctCoeffs[0][0] = p.int(p.random(30,150)); 

        // Use a fixed static matrix instead of random values
        dctCoeffs = [
            [ 9, 11, 10, 6, 3, 2, 1 ,1],
            [ 10, 9, 6, 4, 2, 1, 1, 1],
            [ 8, 7, 4, 3, 1, 1, 1, 0],
            [ 6, 4, 3, 2, 1, 1, 1,  0],
            [ 4, 3, 1, 1, 1, 1,  0, 0],
            [ 3, 2, 1, 1, 1,  0, 0,0],
            [ 1, 1, 1, 1,  0, 0,0,0],
            [ 1,1, 1,  0, 0,0,0,0]
        ];
        
        currentIndex = 0; 
        scannedValues = []; 
        rleValues = []; 
        animationPlaying = true; 
    }

    p.draw = () => {
        p.background(240); // Changed to light gray
        drawMatrixDisplay(15, 40); 
        drawScannedDataDisplay(MATRIX_DISPLAY_WIDTH + 30, 40); 

        if (animationPlaying && currentIndex < zigZagPath.length) {
            let [r, c] = zigZagPath[currentIndex]; 
            let val = dctCoeffs[r][c]; 
            scannedValues.push(val); 
            
            // Modified RLE encoding to handle all values, not just zeros
            let lastRLE = rleValues.length > 0 ? rleValues[rleValues.length - 1] : null;
            if (lastRLE && lastRLE.type === 'value' && lastRLE.value === val) {
                // If the current value is the same as the last one, increment its count
                lastRLE.count = (lastRLE.count || 1) + 1;
            } else {
                // Otherwise add a new entry
                rleValues.push({type: 'value', value: val, count: 1});
            }
            
            if (val !== 0 || currentIndex === zigZagPath.length - 1) { 
                let remainingAllZeros = true; 
                if (val !== 0) { 
                    for (let k = currentIndex + 1; k < zigZagPath.length; k++) {
                        let [rem_r, rem_c] = zigZagPath[k];
                        if (dctCoeffs[rem_r][rem_c] !== 0) {
                            remainingAllZeros = false; 
                            break;
                        }
                    }
                } else { 
                    remainingAllZeros = (currentIndex === zigZagPath.length - 1);
                }

                if (remainingAllZeros && currentIndex < zigZagPath.length - 1) { 
                    rleValues.push({type: 'EOB'}); 
                    currentIndex = zigZagPath.length; 
                }
            }
            if (currentIndex < zigZagPath.length) currentIndex++; 
        } else if (currentIndex >= zigZagPath.length && animationPlaying) {
            animationPlaying = false; 
        }
    };

    function drawMatrixDisplay(offsetX, offsetY) {
        p.push();
        p.translate(offsetX, offsetY);
        p.textSize(14);
        for (let r = 0; r < N_BLOCK; r++) {
            for (let c = 0; c < N_BLOCK; c++) {
                let val = dctCoeffs[r][c];
                p.fill(255);
                p.stroke(80); 
                p.rect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);

                p.fill(0);
                p.noStroke();
                p.textAlign(p.CENTER, p.CENTER);
                p.text(val, c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2);
            }
        }

        p.noFill();
        p.stroke(255, 0, 0, 180); 
        p.strokeWeight(2.5);
        p.beginShape();
        for (let i = 0; i < currentIndex; i++) {
            if (i >= zigZagPath.length) break;
            let [r, c] = zigZagPath[i];
            p.vertex(c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2);
        }
        p.endShape();

        if (currentIndex < zigZagPath.length) {
            let [r, c] = zigZagPath[currentIndex];
            // p.fill(0, 255, 0, 100); 
            // p.noStroke();
            // p.rect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
        p.pop();
    }

    function drawScannedDataDisplay(offsetX, offsetY) {
        p.push();
        p.translate(offsetX, offsetY);
        p.fill(0); // Changed back to black for visibility on light background
        p.noStroke();
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(12);
        
        p.text("Valori Scansionati (Zig-Zag):", 0, 0);
        let yPos = 18;
        let xPos = 0;
        for (let i = 0; i < scannedValues.length; i++) {
            let valText = scannedValues[i] + ", ";
            if (xPos + p.textWidth(valText) > DATA_DISPLAY_WIDTH - 10) { 
                 xPos = 0; yPos += 16;
            }
            if (yPos > N_BLOCK * CELL_SIZE / 2 - 5) {p.text("...", xPos, yPos); break;} 
            p.text(valText, xPos, yPos);
            xPos += p.textWidth(valText);
        }
        
        yPos = N_BLOCK * CELL_SIZE / 2 + 15; 
        xPos = 0;
        p.text("RLE Semplificato:", 0, yPos);
        yPos += 18;
        for(let i=0; i < rleValues.length; i++){
            let entry = rleValues[i];
            let txt = "";
            if (entry.type === 'value') {
                // Display all values with their count if count > 1
                if (entry.count > 1) {
                    txt = `(${entry.count},${entry.value}), `;
                } else {
                    txt = `${entry.value}, `;
                }
            } else if (entry.type === 'EOB') {
                txt = "EOB (I rimanenti sono 0)";
            }

            if (xPos + p.textWidth(txt) > DATA_DISPLAY_WIDTH - 10) { 
                xPos = 0; yPos += 16;
            }
            if (yPos > N_BLOCK * CELL_SIZE -15) {p.text("...", xPos, yPos); break;} 
            p.text(txt, xPos, yPos);
            xPos += p.textWidth(txt) + 5; // Added 5px padding
        }
        
        // Commenting out the status text display
        // p.textSize(10);
        // p.text(animationPlaying ? "Animazione in corso..." : (currentIndex >= zigZagPath.length ? "Fine. Clicca sulla matrice per resettare." : "Pausa. Clicca sulla matrice per riprendere."), 0, N_BLOCK * CELL_SIZE + 5, DATA_DISPLAY_WIDTH);
        p.pop();
    }

    function generateZigZagPath() {
        let path = []; 
        let r = 0, c = 0; 
        let N_path = N_BLOCK; 
        let movingUp = true; 

        for (let i = 0; i < N_path * N_path; i++) { 
            path.push([r, c]); 
            
            if (movingUp) {
                if (c === N_path - 1) { r++; movingUp = false; } 
                else if (r === 0) { c++; movingUp = false; } 
                else { r--; c++; } 
            } else { 
                if (r === N_path - 1) { c++; movingUp = true; } 
                else if (c === 0) { r++; movingUp = true; } 
                else { r++; c--; } 
            }
        }
        return path;
    }
};

// Istanzia lo sketch e lo lega al div con id 'sketch-container'
new p5(sketchRLE, 'sketch-container'); 