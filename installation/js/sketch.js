/**
 * MEANING BEYOND LANGUAGE
 * A Journey from Home to Horizon
 * 
 * Three untranslatable words, one continuous story:
 * HYGGE (home) → KOMOREBI (threshold) → FERNWEH (horizon)
 * 
 * Demonstrating intersemiotic translation through embodied narrative
 */

// === STATE ===
let currentChapter = 0; // 0=hygge, 1=komorebi, 2=fernweh
let chapterProgress = 0; // 0-100 progress within chapter
let hands = [];
let handDetected = false;

// Chapter completion - TIME BASED (5 seconds of gesture)
let gestureActive = false;
let gestureStartTime = 0;
const GESTURE_DURATION = 5000; // 5 seconds to complete
let chapterComplete = false;

// Phases
let phase = 'title'; // 'title', 'experience', 'reflection', 'transition'
let phaseTimer = 0;

// Visual continuity elements (travel between chapters)
let travelingParticles = [];

// Hand tracking
let prevHandPos = { x: 0, y: 0 };
let handVelocity = 0;

// MediaPipe
let videoElement, mpHands, camera;

// === CHAPTER DATA ===
const CHAPTERS = [
  {
    number: 1,
    word: "HYGGE",
    pronunciation: "HOO-gah",
    origin: "Danish",
    meaning: "The warmth of being together",
    instruction: "Show an open palm for 5 seconds",
    narrative: "You begin at home. The fire is lit. There is warmth here.",
    color: { h: 15, s: 75, b: 70 }  // Warm amber-copper
  },
  {
    number: 2,
    word: "KOMOREBI",
    pronunciation: "koh-moh-REH-bee",
    origin: "Japanese",
    meaning: "Sunlight filtering through leaves",
    instruction: "Raise your hand high for 5 seconds",
    narrative: "You step outside. Light filters through the canopy above.",
    color: { h: 45, s: 65, b: 80 }  // Soft golden light
  },
  {
    number: 3,
    word: "FERNWEH",
    pronunciation: "FERN-vey",
    origin: "German",
    meaning: "An ache for distant places",
    instruction: "Reach toward the camera for 5 seconds",
    narrative: "The road stretches ahead. Something calls you forward.",
    color: { h: 255, s: 50, b: 65 }  // Deep twilight violet
  }
];

// === HYGGE STATE ===
let hyggeWarmth = 0;
let hyggeEmbers = [];
let hyggeGlow = 0;
let hyggeCenterX, hyggeCenterY;

// === KOMOREBI STATE ===
let komorebiLight = 0;
let komorebiRays = [];
let komorebiLeaves = [];
let komorebiHandY = 0.5;

// === FERNWEH STATE ===
let fernwehSpeed = 0;
let fernwehStars = [];
let fernwehDistance = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  textFont('Georgia');
  
  hyggeCenterX = width / 2;
  hyggeCenterY = height / 2;
  
  initAllChapters();
  setupMediaPipe();
  
  // Start with title
  phase = 'title';
  phaseTimer = millis();
}

function initAllChapters() {
  // Hygge embers
  hyggeEmbers = [];
  for (let i = 0; i < 200; i++) {
    hyggeEmbers.push({
      x: random(width), y: random(height),
      vx: 0, vy: 0,
      size: random(3, 10),
      hue: random(20, 45),
      life: random(200)
    });
  }
  
  // Komorebi rays
  komorebiRays = [];
  for (let i = 0; i < 12; i++) {
    komorebiRays.push({
      x: random(width),
      width: random(80, 200),
      brightness: random(50, 90),
      phase: random(TWO_PI)
    });
  }
  
  // Komorebi leaves
  komorebiLeaves = [];
  for (let i = 0; i < 50; i++) {
    komorebiLeaves.push({
      x: random(width), y: random(-50, height),
      size: random(15, 35),
      rotation: random(TWO_PI),
      fallSpeed: random(0.3, 0.8)
    });
  }
  
  // Fernweh stars
  fernwehStars = [];
  for (let i = 0; i < 500; i++) {
    fernwehStars.push({
      x: random(-width, width * 2),
      y: random(-height, height * 2),
      z: random(1, 15),
      size: random(1, 4),
      brightness: random(40, 100)
    });
  }
  
  // Traveling particles (visual continuity)
  travelingParticles = [];
  for (let i = 0; i < 30; i++) {
    travelingParticles.push({
      x: random(width), y: random(height),
      size: random(3, 8),
      hue: 30 // Start warm, will shift
    });
  }
}

// === MEDIAPIPE ===
function setupMediaPipe() {
  videoElement = document.getElementById('webcam');
  
  mpHands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });
  
  mpHands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  
  mpHands.onResults(onHandResults);
  
  camera = new Camera(videoElement, {
    onFrame: async () => {
      await mpHands.send({ image: videoElement });
    },
    width: 640,
    height: 480
  });
  
  camera.start();
}

function onHandResults(results) {
  hands = [];
  handDetected = results.multiHandLandmarks && results.multiHandLandmarks.length > 0;
  
  if (results.multiHandLandmarks) {
    for (let landmarks of results.multiHandLandmarks) {
      let palm = landmarks[9];
      let wrist = landmarks[0];
      let middleTip = landmarks[12];
      
      let handSize = dist(wrist.x * width, wrist.y * height, middleTip.x * width, middleTip.y * height);
      
      // Palm open detection
      let fingertips = [landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
      let mcps = [landmarks[5], landmarks[9], landmarks[13], landmarks[17]];
      let openCount = 0;
      for (let i = 0; i < 4; i++) {
        if (fingertips[i].y < mcps[i].y) openCount++;
      }
      
      hands.push({
        x: (1 - palm.x) * width,
        y: palm.y * height,
        z: map(handSize, 80, 280, 0, 1, true),
        open: openCount >= 3
      });
    }
    
    // Track velocity
    if (hands[0]) {
      handVelocity = dist(hands[0].x, hands[0].y, prevHandPos.x, prevHandPos.y);
      prevHandPos = { x: hands[0].x, y: hands[0].y };
    }
  }
}

// === MAIN DRAW ===
function draw() {
  let chapter = CHAPTERS[currentChapter];
  
  switch (phase) {
    case 'title':
      drawTitle();
      break;
    case 'experience':
      drawExperience();
      break;
    case 'reflection':
      drawReflection();
      break;
    case 'transition':
      drawTransition();
      break;
    case 'complete':
      drawComplete();
      break;
  }
}

// === TITLE PHASE ===
function drawTitle() {
  let chapter = CHAPTERS[currentChapter];
  let elapsed = millis() - phaseTimer;
  
  // Background
  background(chapter.color.h, chapter.color.s * 0.2, 5);
  
  // Ambient particles
  drawTravelingParticles(0.3);
  
  textAlign(CENTER, CENTER);
  noStroke();
  
  // Chapter number
  let numAlpha = map(elapsed, 0, 500, 0, 50, true);
  fill(0, 0, 100, numAlpha);
  textSize(18);
  text(`CHAPTER ${chapter.number} OF 3`, width/2, height * 0.25);
  
  // Word
  let wordAlpha = map(elapsed, 300, 1000, 0, 100, true);
  fill(chapter.color.h, chapter.color.s * 0.5, 90, wordAlpha);
  textSize(min(width * 0.18, 150));
  text(chapter.word, width/2, height * 0.4);
  
  // Pronunciation + origin
  let subAlpha = map(elapsed, 600, 1200, 0, 60, true);
  fill(0, 0, 70, subAlpha);
  textSize(20);
  text(`${chapter.pronunciation}  ·  ${chapter.origin}`, width/2, height * 0.4 + 80);
  
  // Meaning
  let meaningAlpha = map(elapsed, 900, 1500, 0, 90, true);
  fill(0, 0, 100, meaningAlpha);
  textSize(28);
  textStyle(ITALIC);
  text(`"${chapter.meaning}"`, width/2, height * 0.58);
  textStyle(NORMAL);
  
  // Narrative
  let narrAlpha = map(elapsed, 1200, 1800, 0, 70, true);
  fill(0, 0, 80, narrAlpha);
  textSize(18);
  text(chapter.narrative, width/2, height * 0.70);
  
  // Instruction
  let instrAlpha = map(elapsed, 1500, 2100, 0, 60, true);
  fill(chapter.color.h, 40, 80, instrAlpha);
  textSize(16);
  text(chapter.instruction, width/2, height * 0.80);
  
  // Begin prompt
  if (elapsed > 2500) {
    let pulse = sin(elapsed * 0.004) * 20 + 50;
    fill(0, 0, 100, pulse);
    textSize(14);
    text("[ show your hand to begin ]", width/2, height * 0.92);
    
    // Start on hand detection
    if (handDetected) {
      phase = 'experience';
      phaseTimer = millis();
      chapterProgress = 0;
      chapterComplete = false;
      gestureActive = false;
      gestureStartTime = 0;
    }
  }
}

// === EXPERIENCE PHASE ===
function drawExperience() {
  let chapter = CHAPTERS[currentChapter];
  
  // Draw the appropriate chapter
  if (currentChapter === 0) drawHygge();
  else if (currentChapter === 1) drawKomorebi();
  else if (currentChapter === 2) drawFernweh();
  
  // Draw traveling particles (continuity)
  drawTravelingParticles(0.5);
  
  // Chapter indicator
  drawChapterIndicator();
  
  // Instruction
  drawInstruction();
  
  // TIME-BASED COMPLETION: 5 seconds of gesture
  if (gestureActive) {
    let elapsed = millis() - gestureStartTime;
    chapterProgress = map(elapsed, 0, GESTURE_DURATION, 0, 100, true);
    
    // Draw progress bar
    drawProgressBar();
    
    // Check if 5 seconds complete
    if (elapsed >= GESTURE_DURATION) {
      chapterComplete = true;
      phase = 'reflection';
      phaseTimer = millis();
    }
  } else {
    // Not doing gesture - show hint
    drawProgressBar();
  }
}

// === HYGGE ===
function drawHygge() {
  // Deep warm charcoal with amber undertone
  background(15, 40, 6);
  
  // Interaction: open palm = warmth gathering
  let targetWarmth = 0;
  let targetX = width / 2;
  let targetY = height / 2;
  let doingGesture = false;
  
  if (hands.length >= 1) {
    // Use first hand
    targetX = hands[0].x;
    targetY = hands[0].y;
    
    // GESTURE: Open palm detected
    if (hands[0].open) {
      targetWarmth = 0.8;
      doingGesture = true;
    } else {
      targetWarmth = 0.3;
    }
  }
  
  // Update gesture timer
  if (doingGesture) {
    if (!gestureActive) {
      gestureActive = true;
      gestureStartTime = millis();
      console.log("HYGGE: Gesture started - open palm");
    }
  } else {
    if (gestureActive) {
      console.log("HYGGE: Gesture stopped");
    }
    gestureActive = false;
  }
  
  hyggeWarmth = lerp(hyggeWarmth, targetWarmth, 0.05);
  hyggeCenterX = lerp(hyggeCenterX, targetX, 0.05);
  hyggeCenterY = lerp(hyggeCenterY, targetY, 0.05);
  hyggeGlow = lerp(hyggeGlow, hyggeWarmth * 400, 0.03);
  
  // Central glow (hearth)
  noStroke();
  for (let r = hyggeGlow; r > 0; r -= 15) {
    let alpha = map(r, 0, hyggeGlow, 55, 0) * hyggeWarmth;
    // Rich amber-gold glow
    fill(18, 85, 75, alpha);
    ellipse(hyggeCenterX, hyggeCenterY, r * 2);
  }
  
  // Embers
  for (let e of hyggeEmbers) {
    let dx = hyggeCenterX - e.x;
    let dy = hyggeCenterY - e.y;
    let d = max(dist(e.x, e.y, hyggeCenterX, hyggeCenterY), 1);
    
    e.vx += (dx / d) * hyggeWarmth * 0.1;
    e.vy += (dy / d) * hyggeWarmth * 0.1 - 0.02;
    e.vx *= 0.97;
    e.vy *= 0.97;
    e.x += e.vx;
    e.y += e.vy;
    
    e.life--;
    if (e.life < 0 || e.y < -50) {
      e.x = hyggeWarmth > 0.3 ? hyggeCenterX + random(-50, 50) : random(width);
      e.y = hyggeWarmth > 0.3 ? hyggeCenterY + random(30, 80) : height + 20;
      e.life = random(150, 250);
    }
    
    let alpha = map(e.life, 0, 200, 0, 60) * (0.3 + hyggeWarmth * 0.7);
    fill(e.hue, 85, 70, alpha);
    ellipse(e.x, e.y, e.size * (0.5 + hyggeWarmth));
  }
  
  // Warmth indicator
  if (hyggeWarmth > 0.5) {
    fill(0, 0, 100, (hyggeWarmth - 0.5) * 40);
    textAlign(CENTER, CENTER);
    textSize(16);
    textStyle(ITALIC);
    text("warmth gathers...", width/2, height - 150);
    textStyle(NORMAL);
  }
  
  drawVignette(0.6 - hyggeWarmth * 0.3);
}

// === KOMOREBI ===
function drawKomorebi() {
  // Deep forest green with soft warmth
  background(135, 45, 8);
  
  // Interaction: hand height controls light
  let targetLight = 0.2;
  let doingGesture = false;
  
  if (hands.length > 0) {
    komorebiHandY = lerp(komorebiHandY, hands[0].y / height, 0.08);
    targetLight = map(komorebiHandY, 0.8, 0.15, 0, 1, true);
    
    // GESTURE: hand raised high (upper third of screen)
    if (hands[0].y < height * 0.4) {
      doingGesture = true;
    }
  }
  
  // Update gesture timer
  if (doingGesture) {
    if (!gestureActive) {
      gestureActive = true;
      gestureStartTime = millis();
      console.log("KOMOREBI: Gesture started - hand raised high");
    }
  } else {
    if (gestureActive) {
      console.log("KOMOREBI: Gesture stopped");
    }
    gestureActive = false;
  }
  
  komorebiLight = lerp(komorebiLight, targetLight, 0.04);
  
  // Light rays
  noStroke();
  for (let ray of komorebiRays) {
    let brightness = ray.brightness * komorebiLight;
    let sway = sin(frameCount * 0.01 + ray.phase) * 20;
    
    push();
    translate(ray.x + sway, -30);
    
    for (let i = 3; i >= 0; i--) {
      let w = ray.width * (1 + i * 0.4);
      let alpha = brightness * 0.15 / (i + 1);
      
      let grad = drawingContext.createLinearGradient(0, 0, 0, height * 1.2);
      // Soft warm golden light rays
      grad.addColorStop(0, `hsla(42, 65%, ${90 * komorebiLight}%, ${alpha})`);
      grad.addColorStop(1, `hsla(38, 55%, ${65 * komorebiLight}%, 0)`);
      drawingContext.fillStyle = grad;
      
      beginShape();
      vertex(-w * 0.1, 0);
      vertex(w * 0.1, 0);
      vertex(w, height * 1.2);
      vertex(-w, height * 1.2);
      endShape(CLOSE);
    }
    pop();
  }
  
  // Light pool at hand position
  if (hands.length > 0) {
    let poolSize = 200 * komorebiLight;
    for (let r = poolSize; r > 0; r -= 20) {
      // Soft golden light pool
      fill(45, 50, 85, map(r, 0, poolSize, 45, 0) * komorebiLight);
      ellipse(hands[0].x, hands[0].y, r * 2, r * 1.2);
    }
  }
  
  // Falling leaves
  for (let leaf of komorebiLeaves) {
    leaf.y += leaf.fallSpeed;
    leaf.x += sin(frameCount * 0.02 + leaf.rotation) * 0.5;
    leaf.rotation += 0.01;
    
    if (leaf.y > height + 50) {
      leaf.y = -50;
      leaf.x = random(width);
    }
    
    push();
    translate(leaf.x, leaf.y);
    rotate(leaf.rotation);
    // Soft olive-green leaves
    fill(95, 40, 35, 55);
    ellipse(0, 0, leaf.size * 0.4, leaf.size);
    pop();
  }
  
  // Canopy - deep forest green
  fill(140, 50, 6);
  for (let i = 0; i < 20; i++) {
    ellipse(i * width/12 - 50, -20, 180, 140);
  }
  
  // Light message
  if (komorebiLight > 0.5) {
    fill(0, 0, 100, (komorebiLight - 0.5) * 50);
    textAlign(CENTER, CENTER);
    textSize(16);
    textStyle(ITALIC);
    text("light filters through...", width/2, height - 150);
    textStyle(NORMAL);
  }
  
  drawVignette(0.5 - komorebiLight * 0.2);
}

// === FERNWEH ===
function drawFernweh() {
  // Twilight sky gradient - deep violet to indigo
  for (let y = 0; y < height * 0.6; y++) {
    let inter = y / (height * 0.6);
    stroke(lerpColor(color(270, 60, 8), color(250, 50, 20), inter));
    line(0, y, width, y);
  }
  noStroke();
  
  // Interaction: reach forward (hand size / z depth)
  let targetSpeed = 0;
  let doingGesture = false;
  
  if (hands.length > 0) {
    targetSpeed = map(hands[0].z, 0, 1, 0, 1, true);
    // Also respond to hand position - higher = more longing
    let yBonus = map(hands[0].y, height, 0, 0, 0.3, true);
    targetSpeed = max(targetSpeed, yBonus);
    
    // GESTURE: reaching toward camera (z depth > 0.3) OR hand in upper half
    if (hands[0].z > 0.3 || hands[0].y < height * 0.5) {
      doingGesture = true;
    }
  }
  
  // Update gesture timer
  if (doingGesture) {
    if (!gestureActive) {
      gestureActive = true;
      gestureStartTime = millis();
      console.log("FERNWEH: Gesture started - reaching forward");
    }
  } else {
    if (gestureActive) {
      console.log("FERNWEH: Gesture stopped");
    }
    gestureActive = false;
  }
  
  fernwehSpeed = lerp(fernwehSpeed, targetSpeed, 0.04);
  fernwehDistance += fernwehSpeed * 5;
  
  // Stars
  let cx = width / 2;
  let cy = height * 0.4;
  
  for (let star of fernwehStars) {
    star.z -= fernwehSpeed * star.z * 0.05;
    
    if (star.z < 0.5) {
      star.z = 15;
      star.x = random(-width, width * 2);
      star.y = random(-height, height * 2);
    }
    
    let px = cx + (star.x - cx) / star.z;
    let py = cy + (star.y - cy) / star.z;
    let pSize = star.size / star.z * (1 + fernwehSpeed * 3);
    
    if (px < -20 || px > width + 20 || py < -20 || py > height * 0.7) continue;
    
    // Motion trail
    if (fernwehSpeed > 0.2) {
      // Star trails - soft lavender
      stroke(260, 25, star.brightness, 30 * fernwehSpeed);
      strokeWeight(pSize * 0.5);
      let trail = fernwehSpeed * 40 / star.z;
      line(px, py, px - (px - cx) * 0.01 * trail, py - (py - cy) * 0.01 * trail);
      noStroke();
    }
    
    // Stars with soft lavender tint
    fill(260, 25, star.brightness, map(star.z, 0.5, 15, 100, 20));
    ellipse(px, py, pSize);
  }
  
  // Mountains
  let horizonY = height * 0.5;
  
  // Distant mountains - deep violet
  fill(265, 40, 18);
  beginShape();
  vertex(0, height);
  for (let x = 0; x <= width; x += 20) {
    vertex(x, horizonY + 60 - noise(x * 0.004 + fernwehDistance * 0.0001) * 120);
  }
  vertex(width, height);
  endShape(CLOSE);
  
  // Closer mountains - darker violet
  fill(260, 35, 12);
  beginShape();
  vertex(0, height);
  for (let x = 0; x <= width; x += 15) {
    vertex(x, horizonY + 30 - noise(x * 0.006 + 50 + fernwehDistance * 0.0002) * 90);
  }
  vertex(width, height);
  endShape(CLOSE);
  
  // Road - deep charcoal with violet tint
  fill(255, 20, 8);
  beginShape();
  vertex(width * 0.2, height);
  vertex(cx - 2, horizonY);
  vertex(cx + 2, horizonY);
  vertex(width * 0.8, height);
  endShape(CLOSE);
  
  // Road lines
  for (let i = 0; i < 25; i++) {
    let z = ((i * 30 + fernwehDistance * 15) % 400) / 400;
    let y = lerp(horizonY, height, z);
    let w = lerp(1, 10, z);
    fill(45, 70, 60, map(z, 0, 1, 20, 70));
    rect(cx - w/2, y, w, lerp(3, 30, z));
  }
  
  // Horizon glow
  let glowInt = 0.3 + fernwehSpeed * 0.7;
  for (let r = 150 * glowInt; r > 0; r -= 12) {
    fill(40, 50, 80, (r / 150) * 30 * glowInt);
    ellipse(cx, horizonY - 10, r * 3, r);
  }
  
  // Longing message
  if (fernwehSpeed > 0.4) {
    fill(0, 0, 100, (fernwehSpeed - 0.4) * 60);
    textAlign(CENTER, CENTER);
    textSize(16);
    textStyle(ITALIC);
    text("the horizon calls...", width/2, height - 150);
    textStyle(NORMAL);
  }
  
  drawVignette(0.45 - fernwehSpeed * 0.2);
}

// === REFLECTION PHASE ===
function drawReflection() {
  let chapter = CHAPTERS[currentChapter];
  let elapsed = millis() - phaseTimer;
  
  background(chapter.color.h, chapter.color.s * 0.15, 5);
  drawTravelingParticles(0.4);
  
  textAlign(CENTER, CENTER);
  noStroke();
  
  // "You felt"
  let labelAlpha = map(elapsed, 0, 600, 0, 50, true);
  fill(0, 0, 60, labelAlpha);
  textSize(16);
  text("YOU EXPERIENCED", width/2, height * 0.3);
  
  // Word
  let wordAlpha = map(elapsed, 300, 900, 0, 100, true);
  fill(chapter.color.h, chapter.color.s * 0.5, 85, wordAlpha);
  textSize(min(width * 0.12, 100));
  text(chapter.word, width/2, height * 0.42);
  
  // Meaning
  let meaningAlpha = map(elapsed, 600, 1200, 0, 80, true);
  fill(0, 0, 90, meaningAlpha);
  textSize(24);
  textStyle(ITALIC);
  text(`"${chapter.meaning}"`, width/2, height * 0.55);
  textStyle(NORMAL);
  
  // "Through speculative storytelling"
  let methodAlpha = map(elapsed, 900, 1500, 0, 50, true);
  fill(0, 0, 60, methodAlpha);
  textSize(14);
  text("through embodied, speculative translation", width/2, height * 0.65);
  
  // Continue prompt
  if (elapsed > 2000) {
    let pulse = sin(elapsed * 0.004) * 20 + 45;
    fill(0, 0, 100, pulse);
    textSize(14);
    
    if (currentChapter < 2) {
      text("[ show hand to continue the journey ]", width/2, height * 0.85);
      
      if (handDetected) {
        phase = 'transition';
        phaseTimer = millis();
      }
    } else {
      text("[ show hand to complete ]", width/2, height * 0.85);
      
      if (handDetected) {
        phase = 'complete';
        phaseTimer = millis();
      }
    }
  }
}

// === TRANSITION PHASE ===
function drawTransition() {
  let elapsed = millis() - phaseTimer;
  let fromChapter = CHAPTERS[currentChapter];
  let toChapter = CHAPTERS[currentChapter + 1];
  
  // Blend backgrounds
  let blend = map(elapsed, 0, 2000, 0, 1, true);
  let h = lerp(fromChapter.color.h, toChapter.color.h, blend);
  let s = lerp(fromChapter.color.s, toChapter.color.s, blend);
  background(h, s * 0.15, 5);
  
  // Traveling particles shift color
  for (let p of travelingParticles) {
    p.hue = lerp(fromChapter.color.h, toChapter.color.h, blend);
  }
  drawTravelingParticles(0.6);
  
  textAlign(CENTER, CENTER);
  noStroke();
  
  if (elapsed < 1500) {
    // "The journey continues"
    let alpha = sin(map(elapsed, 0, 1500, 0, PI)) * 70;
    fill(0, 0, 100, alpha);
    textSize(20);
    text("The journey continues...", width/2, height/2);
  } else {
    // Preview next word
    let alpha = map(elapsed, 1500, 2500, 0, 80, true);
    fill(toChapter.color.h, toChapter.color.s * 0.4, 80, alpha);
    textSize(60);
    text(toChapter.word, width/2, height/2);
  }
  
  if (elapsed > 3000) {
    currentChapter++;
    phase = 'title';
    phaseTimer = millis();
    // Reset for next chapter
    chapterProgress = 0;
    chapterComplete = false;
    gestureActive = false;
    gestureStartTime = 0;
  }
}

// === COMPLETE PHASE ===
function drawComplete() {
  let elapsed = millis() - phaseTimer;
  
  // Deep twilight for completion
  background(260, 35, 6);
  drawTravelingParticles(0.3);
  
  textAlign(CENTER, CENTER);
  noStroke();
  
  // Journey complete
  let titleAlpha = map(elapsed, 0, 800, 0, 100, true);
  fill(0, 0, 100, titleAlpha);
  textSize(28);
  text("JOURNEY COMPLETE", width/2, height * 0.25);
  
  // Three words summary
  let wordsAlpha = map(elapsed, 500, 1500, 0, 80, true);
  fill(0, 0, 80, wordsAlpha);
  textSize(18);
  text("HYGGE  →  KOMOREBI  →  FERNWEH", width/2, height * 0.35);
  
  // Home to Horizon
  let subAlpha = map(elapsed, 800, 1800, 0, 60, true);
  fill(0, 0, 60, subAlpha);
  textSize(16);
  textStyle(ITALIC);
  text("from home to horizon", width/2, height * 0.42);
  textStyle(NORMAL);
  
  // Question
  let qAlpha = map(elapsed, 1500, 2500, 0, 90, true);
  fill(0, 0, 100, qAlpha);
  textSize(22);
  text("Did you feel what the words could not say?", width/2, height * 0.58);
  
  // Method note
  let methodAlpha = map(elapsed, 2000, 3000, 0, 50, true);
  fill(0, 0, 60, methodAlpha);
  textSize(14);
  text("You experienced intersemiotic translation:", width/2, height * 0.70);
  text("meaning moved from text to embodied gesture", width/2, height * 0.74);
  
  // Continue to SAM
  if (elapsed > 3500) {
    let pulse = sin(elapsed * 0.004) * 20 + 50;
    fill(0, 0, 100, pulse);
    textSize(14);
    text("[ show hand to measure the experience ]", width/2, height * 0.88);
    
    if (handDetected && elapsed > 4000) {
      document.getElementById('sam-overlay').style.display = 'flex';
    }
  }
}

// === UI HELPERS ===
function drawProgressBar() {
  let chapter = CHAPTERS[currentChapter];
  let barWidth = width * 0.4;
  let barHeight = 6;
  let x = (width - barWidth) / 2;
  let y = height - 50;
  
  // Background
  fill(0, 0, 100, 15);
  noStroke();
  rect(x, y, barWidth, barHeight, 3);
  
  // Progress (time-based: 0-100 from gestureActive timer)
  let progress = chapterProgress / 100;
  
  // Change color based on whether gesture is active
  if (gestureActive) {
    // Active: bright glow
    fill(chapter.color.h, chapter.color.s * 0.8, 85, 90);
  } else {
    // Inactive: dimmer
    fill(chapter.color.h, chapter.color.s * 0.4, 60, 50);
  }
  rect(x, y, barWidth * progress, barHeight, 3);
  
  // Time indicator text
  if (gestureActive) {
    let elapsed = millis() - gestureStartTime;
    let secondsLeft = max(0, ceil((GESTURE_DURATION - elapsed) / 1000));
    fill(0, 0, 100, 80);
    textAlign(CENTER, BOTTOM);
    textSize(14);
    text(`${secondsLeft}s`, width/2, y - 8);
  } else if (handDetected && chapterProgress < 100) {
    fill(0, 0, 100, 40);
    textAlign(CENTER, BOTTOM);
    textSize(12);
    text("hold gesture for 5 seconds", width/2, y - 8);
  }
}

function drawChapterIndicator() {
  let y = 30;
  textAlign(CENTER, TOP);
  textSize(12);
  
  for (let i = 0; i < 3; i++) {
    let x = width/2 + (i - 1) * 80;
    let isCurrent = i === currentChapter;
    let isPast = i < currentChapter;
    
    fill(0, 0, 100, isCurrent ? 70 : (isPast ? 40 : 20));
    ellipse(x, y, isCurrent ? 12 : 8);
    
    if (i < 2) {
      stroke(0, 0, 100, 20);
      strokeWeight(1);
      line(x + 15, y, x + 65, y);
      noStroke();
    }
  }
}

function drawInstruction() {
  let chapter = CHAPTERS[currentChapter];
  
  fill(0, 0, 100, 50);
  textAlign(CENTER, BOTTOM);
  textSize(14);
  text(chapter.instruction, width/2, height - 60);
}

function drawCompletionPrompt(progress) {
  let cx = width/2;
  let cy = height/2;
  
  // Overlay
  fill(0, 0, 0, 40);
  rect(0, 0, width, height);
  
  // Ring
  noFill();
  strokeWeight(4);
  stroke(0, 0, 100, 30);
  ellipse(cx, cy, 100);
  
  stroke(CHAPTERS[currentChapter].color.h, 60, 80, 90);
  arc(cx, cy, 100, 100, -HALF_PI, -HALF_PI + progress * TWO_PI);
  
  // Text
  noStroke();
  fill(0, 0, 100, 80);
  textAlign(CENTER, CENTER);
  textSize(14);
  text("CHAPTER COMPLETE", cx, cy - 8);
  textSize(11);
  fill(0, 0, 100, 50);
  text("hold to continue...", cx, cy + 10);
}

function drawTravelingParticles(alpha) {
  noStroke();
  for (let p of travelingParticles) {
    p.x += random(-1, 1);
    p.y += random(-1, 1);
    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    if (p.y > height) p.y = 0;
    
    fill(p.hue, 50, 60, 20 * alpha);
    ellipse(p.x, p.y, p.size);
  }
}

function drawVignette(intensity) {
  let maxDist = dist(0, 0, width/2, height/2);
  noFill();
  for (let r = maxDist; r > maxDist * 0.3; r -= 20) {
    stroke(0, 0, 0, map(r, maxDist * 0.3, maxDist, 0, 70 * intensity));
    strokeWeight(25);
    ellipse(width/2, height/2, r * 2, r * 1.9);
  }
  noStroke();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
