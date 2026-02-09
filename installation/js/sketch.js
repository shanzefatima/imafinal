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

// === AUDIO SYSTEM ===
let audioStarted = false;
let audioContext = null;

// Hygge Audio: Wind (cold) + Warmth (fire crackle)
let hyggeWind, hyggeWindFilter, hyggeWarmth_audio, hyggeWarmthFilter;
let hyggeCrackle, hyggeHum;

// Komorebi Audio: Crystalline chimes
let komorebiChime, komorebiReverb, komorebiDelay;
let komorebiDrone;

// Fernweh Audio: Shepard tone / infinite rise
let fernwehDrone, fernwehLFO, fernwehFilter;
let fernwehWhistle;

// Audio initialization flag
let audioInitialized = false;

// === CHAPTER DATA ===
const CHAPTERS = [
  {
    number: 1,
    word: "HYGGE",
    native: "hygge",  // Danish uses Latin script
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
    native: "木漏れ日",  // Japanese kanji/hiragana
    pronunciation: "koh-moh-REH-bee",
    origin: "Japanese",
    meaning: "Sunlight filtering through leaves",
    instruction: "Spread your fingers open to let light through",
    narrative: "You step outside. Light filters through the canopy above.",
    color: { h: 45, s: 65, b: 80 }  // Soft golden light
  },
  {
    number: 3,
    word: "FERNWEH",
    native: "Fernweh",  // German uses Latin script
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
let fernwehMist = [];
let fernwehMemories = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  textFont('Cormorant Garamond, Noto Sans JP, Georgia, serif');
  
  hyggeCenterX = width / 2;
  hyggeCenterY = height / 2;
  
  initAllChapters();
  setupMediaPipe();
  
  // Start with title
  phase = 'title';
  phaseTimer = millis();
}

// === AUDIO INITIALIZATION ===
async function initAudio() {
  if (audioInitialized) return;
  
  try {
    await Tone.start();
    console.log("Audio context started");
    
    // === HYGGE AUDIO ===
    // Cold wind (filtered noise)
    hyggeWind = new Tone.Noise("brown").start();
    hyggeWindFilter = new Tone.Filter(800, "lowpass");
    const windGain = new Tone.Gain(0.15);
    hyggeWind.connect(hyggeWindFilter);
    hyggeWindFilter.connect(windGain);
    windGain.toDestination();
    
    // Warm fire crackle/hum
    hyggeHum = new Tone.FMSynth({
      harmonicity: 1,
      modulationIndex: 2,
      oscillator: { type: "sine" },
      envelope: { attack: 2, decay: 1, sustain: 0.8, release: 2 },
      modulation: { type: "triangle" },
      modulationEnvelope: { attack: 0.5, decay: 0.5, sustain: 1, release: 0.5 }
    });
    hyggeWarmthFilter = new Tone.Filter(200, "lowpass");
    const warmGain = new Tone.Gain(0);
    hyggeHum.connect(hyggeWarmthFilter);
    hyggeWarmthFilter.connect(warmGain);
    warmGain.toDestination();
    hyggeHum.triggerAttack("C2");
    hyggeHum.warmGain = warmGain; // Store reference
    
    // === KOMOREBI AUDIO ===
    // Crystalline shimmer synth
    komorebiReverb = new Tone.Reverb({ decay: 4, wet: 0.6 }).toDestination();
    komorebiDelay = new Tone.FeedbackDelay("8n", 0.4).connect(komorebiReverb);
    komorebiChime = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.02, decay: 1.5, sustain: 0, release: 1.5 }
    });
    komorebiChime.connect(komorebiDelay);
    komorebiChime.volume.value = -12;
    
    // Soft pad drone
    komorebiDrone = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 3, decay: 1, sustain: 0.6, release: 3 }
    });
    const droneFilter = new Tone.Filter(400, "lowpass");
    const droneGain = new Tone.Gain(0);
    komorebiDrone.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(komorebiReverb);
    komorebiDrone.droneGain = droneGain;
    
    // === FERNWEH AUDIO ===
    // Infinite rising Shepard tone effect
    fernwehDrone = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 2, decay: 0.5, sustain: 0.8, release: 2 }
    });
    fernwehFilter = new Tone.Filter(300, "lowpass");
    const fernwehReverb = new Tone.Reverb({ decay: 6, wet: 0.7 }).toDestination();
    const fernwehGain = new Tone.Gain(0);
    fernwehDrone.connect(fernwehFilter);
    fernwehFilter.connect(fernwehGain);
    fernwehGain.connect(fernwehReverb);
    fernwehDrone.fernwehGain = fernwehGain;
    
    // Distant whistle/wind
    fernwehWhistle = new Tone.Noise("pink").start();
    const whistleFilter = new Tone.Filter(1200, "bandpass", -24);
    const whistleGain = new Tone.Gain(0);
    fernwehWhistle.connect(whistleFilter);
    whistleFilter.connect(whistleGain);
    whistleGain.connect(fernwehReverb);
    fernwehWhistle.whistleGain = whistleGain;
    fernwehWhistle.whistleFilter = whistleFilter;
    
    audioInitialized = true;
    console.log("Audio system initialized");
    
  } catch (e) {
    console.error("Audio init failed:", e);
  }
}

// Start audio on first user interaction
function mousePressed() {
  if (!audioInitialized) {
    initAudio();
  }
}

function touchStarted() {
  if (!audioInitialized) {
    initAudio();
  }
  return false;
}

// === AUDIO UPDATE FUNCTIONS ===

function updateHyggeAudio(warmth) {
  if (!audioInitialized) return;
  
  // HYGGE: Contrast of cold outside vs warm inside
  // Wind fades dramatically as warmth increases
  const windFreq = map(warmth, 0, 1, 600, 80);
  const windVol = map(warmth, 0, 1, 0.12, 0);
  hyggeWindFilter.frequency.rampTo(windFreq, 0.5);
  
  // Fire crackle warmth - only audible when hands are together
  const warmVol = warmth > 0.4 ? map(warmth, 0.4, 1, 0, 0.15) : 0;
  const warmFreq = map(warmth, 0, 1, 120, 350);
  hyggeHum.warmGain.gain.rampTo(warmVol, 0.4);
  hyggeWarmthFilter.frequency.rampTo(warmFreq, 0.4);
  
  // Occasional crackle sounds when warm
  if (warmth > 0.5 && random() < 0.008) {
    // Random crackle pitch
    hyggeHum.modulationIndex.rampTo(random(3, 8), 0.1);
    setTimeout(() => hyggeHum.modulationIndex.rampTo(2, 0.3), 100);
  }
}

function updateKomorebiAudio(lightLevel, handY) {
  if (!audioInitialized) return;
  
  // KOMOREBI: Delicate, fleeting - like Japanese wind chimes (furin)
  // Only plays when light is actively filtering through
  
  // Chimes triggered by light changes - more musical, less random
  if (lightLevel > 0.35 && random() < 0.015 * lightLevel) {
    // Pentatonic scale for Japanese feel
    const notes = ['D5', 'E5', 'G5', 'A5', 'B5', 'D6'];
    const note = notes[floor(random(notes.length))];
    const vel = map(lightLevel, 0.35, 1, 0.15, 0.5);
    komorebiChime.triggerAttackRelease(note, "4n", undefined, vel);
  }
  
  // Soft forest ambience - very subtle, not continuous
  if (lightLevel > 0.3 && !komorebiDrone._playing) {
    komorebiDrone.triggerAttack("D4");
    komorebiDrone._playing = true;
  } else if (lightLevel <= 0.2 && komorebiDrone._playing) {
    komorebiDrone.triggerRelease();
    komorebiDrone._playing = false;
  }
  
  if (komorebiDrone.droneGain) {
    // Very subtle pad, mostly silence
    const droneVol = lightLevel > 0.4 ? map(lightLevel, 0.4, 1, 0, 0.05) : 0;
    komorebiDrone.droneGain.gain.rampTo(droneVol, 0.8);
  }
  
  // Reverb - more when in shadow (muffled forest)
  if (komorebiReverb) {
    const reverbWet = map(lightLevel, 0, 1, 0.7, 0.3);
    komorebiReverb.wet.rampTo(reverbWet, 0.5);
  }
}

function updateFernwehAudio(reachIntensity) {
  if (!audioInitialized) return;
  
  // FERNWEH: The ache for somewhere you've never been
  // A low, melancholic minor chord that swells but never resolves
  // Like hearing a distant train at night — it stirs something deep
  
  // Start the drone with a minor 7th — inherently unresolved and yearning
  if (reachIntensity > 0.1 && !fernwehDrone._playing) {
    fernwehDrone.triggerAttack(["D2", "A2", "F3", "C4"]); // Dm7 — melancholic, unresolved
    fernwehDrone._playing = true;
  } else if (reachIntensity <= 0.05 && fernwehDrone._playing) {
    fernwehDrone.triggerRelease();
    fernwehDrone._playing = false;
  }
  
  // The ache grows as you reach — it never becomes comfortable
  if (fernwehDrone.fernwehGain) {
    const vol = reachIntensity > 0.1 ? map(reachIntensity, 0.1, 1, 0.03, 0.16) : 0;
    fernwehDrone.fernwehGain.gain.rampTo(vol, 0.8);
  }
  
  // Filter opens slowly — like a memory coming into focus
  const filterFreq = map(reachIntensity, 0, 1, 120, 700);
  fernwehFilter.frequency.rampTo(filterFreq, 0.6);
  
  // Distant whistle — a train, a wind, the call of faraway
  if (fernwehWhistle.whistleGain) {
    // Faint and mournful — only when reaching significantly
    const whistleVol = reachIntensity > 0.3 ? map(reachIntensity, 0.3, 1, 0, 0.035) : 0;
    fernwehWhistle.whistleGain.gain.rampTo(whistleVol, 1.0);
    
    // Wavering pitch — like something calling from far away
    const baseFreq = 900;
    const waver = sin(millis() * 0.001) * 200; // Gentle wavering
    fernwehWhistle.whistleFilter.frequency.rampTo(baseFreq + waver * reachIntensity, 0.3);
  }
  
  // Occasional single melancholic note — like a distant bell
  if (reachIntensity > 0.5 && random() < 0.003) {
    const notes = ['D4', 'F4', 'A4']; // Minor triad fragments
    komorebiChime.triggerAttackRelease(notes[floor(random(3))], "1n", undefined, 0.15);
  }
}

function stopAllAudio() {
  if (!audioInitialized) return;
  
  // Fade out everything gracefully
  if (hyggeHum && hyggeHum.warmGain) hyggeHum.warmGain.gain.rampTo(0, 1.5);
  if (hyggeWindFilter) hyggeWindFilter.frequency.rampTo(100, 1);
  if (komorebiDrone && komorebiDrone.droneGain) {
    komorebiDrone.droneGain.gain.rampTo(0, 1.5);
    komorebiDrone._playing = false;
  }
  if (fernwehDrone && fernwehDrone.fernwehGain) {
    fernwehDrone.fernwehGain.gain.rampTo(0, 1.5);
    fernwehDrone._playing = false;
  }
  if (fernwehWhistle && fernwehWhistle.whistleGain) {
    fernwehWhistle.whistleGain.gain.rampTo(0, 1.5);
  }
}

function updateTransitionAudio(fromChapter, progress) {
  if (!audioInitialized) return;
  
  // Transition audio tells the story of leaving one place, entering another
  
  if (fromChapter === 0) {
    // Hygge → Komorebi: Fire dying, door opening, nature awakening
    
    // Fire/warmth fades out
    if (hyggeHum && hyggeHum.warmGain) {
      let warmth = map(progress, 0, 0.4, 0.1, 0, true);
      hyggeHum.warmGain.gain.rampTo(warmth, 0.3);
    }
    
    // Wind returns briefly (going outside)
    if (hyggeWindFilter) {
      let windFreq = map(progress, 0.2, 0.5, 100, 500, true);
      hyggeWindFilter.frequency.rampTo(windFreq, 0.5);
    }
    
    // Then nature sounds begin (birds/chimes)
    if (progress > 0.5 && progress < 0.7 && random() < 0.03) {
      const notes = ['E5', 'G5', 'A5'];
      komorebiChime.triggerAttackRelease(notes[floor(random(3))], "8n", undefined, 0.2);
    }
    
    // Forest drone fades in
    if (komorebiDrone && komorebiDrone.droneGain && progress > 0.6) {
      let vol = map(progress, 0.6, 1, 0, 0.04, true);
      komorebiDrone.droneGain.gain.rampTo(vol, 0.5);
      if (!komorebiDrone._playing && progress > 0.7) {
        komorebiDrone.triggerAttack("D4");
        komorebiDrone._playing = true;
      }
    }
  }
  else if (fromChapter === 1) {
    // Komorebi → Fernweh: Light fading, longing awakening
    
    // Forest sounds fade
    if (komorebiDrone && komorebiDrone.droneGain) {
      let vol = map(progress, 0, 0.4, 0.04, 0, true);
      komorebiDrone.droneGain.gain.rampTo(vol, 0.5);
    }
    
    // Single melancholic chime
    if (progress > 0.3 && progress < 0.35 && random() < 0.1) {
      komorebiChime.triggerAttackRelease("A4", "2n", undefined, 0.3);
    }
    
    // Fernweh drone slowly awakens
    if (fernwehDrone && fernwehDrone.fernwehGain && progress > 0.5) {
      let vol = map(progress, 0.5, 1, 0, 0.08, true);
      fernwehDrone.fernwehGain.gain.rampTo(vol, 0.8);
      if (!fernwehDrone._playing && progress > 0.6) {
        fernwehDrone.triggerAttack(["A1", "E2", "A2"]);
        fernwehDrone._playing = true;
      }
      // Filter slowly opens
      let freq = map(progress, 0.5, 1, 100, 400, true);
      fernwehFilter.frequency.rampTo(freq, 0.5);
    }
    
    // Distant whistle hints at the call of faraway
    if (fernwehWhistle && fernwehWhistle.whistleGain && progress > 0.8) {
      let vol = map(progress, 0.8, 1, 0, 0.02, true);
      fernwehWhistle.whistleGain.gain.rampTo(vol, 0.5);
    }
  }
}

function updateCompleteAudio(elapsed) {
  if (!audioInitialized) return;
  
  // Final resolution - all three cultures harmonize
  let progress = min(elapsed / 5000, 1);
  
  // Gentle chord that combines all three moods
  if (elapsed < 500 && !fernwehDrone._completePlayed) {
    // Final resolving chord
    fernwehDrone.triggerAttack(["A2", "D3", "F#3", "A3"]);
    fernwehDrone._completePlayed = true;
  }
  
  if (fernwehDrone && fernwehDrone.fernwehGain) {
    // Slowly fade to silence
    let vol = map(progress, 0, 0.8, 0.1, 0.02, true);
    fernwehDrone.fernwehGain.gain.rampTo(vol, 1);
  }
  
  // Final chimes - resolution
  if (progress > 0.2 && progress < 0.5 && random() < 0.01) {
    const notes = ['A4', 'D5', 'F#5'];
    komorebiChime.triggerAttackRelease(notes[floor(random(3))], "2n", undefined, 0.2);
  }
  
  fernwehFilter.frequency.rampTo(300, 2);
}

function updateReflectionAudio(chapterIndex, elapsed) {
  if (!audioInitialized) return;
  
  // Gentle, resolving audio after completing a chapter
  let progress = min(elapsed / 2500, 1);
  
  if (chapterIndex === 0) {
    // After Hygge: Warmth lingers, then slowly fades
    if (hyggeHum && hyggeHum.warmGain) {
      let warmth = map(progress, 0, 1, 0.08, 0.02, true);
      hyggeHum.warmGain.gain.rampTo(warmth, 0.5);
    }
    // Wind stays quiet
    hyggeWindFilter.frequency.rampTo(100, 1);
  }
  else if (chapterIndex === 1) {
    // After Komorebi: A final chime, then silence
    if (progress < 0.2 && random() < 0.02) {
      komorebiChime.triggerAttackRelease("D5", "2n", undefined, 0.25);
    }
    if (komorebiDrone && komorebiDrone.droneGain) {
      let vol = map(progress, 0, 0.8, 0.03, 0, true);
      komorebiDrone.droneGain.gain.rampTo(vol, 0.5);
    }
  }
  else if (chapterIndex === 2) {
    // After Fernweh: The longing settles into quiet acceptance
    if (fernwehDrone && fernwehDrone.fernwehGain) {
      let vol = map(progress, 0, 1, 0.1, 0.03, true);
      fernwehDrone.fernwehGain.gain.rampTo(vol, 0.8);
    }
    fernwehFilter.frequency.rampTo(150, 1);
  }
}

function updateTitleAudio(chapterIndex, elapsed) {
  if (!audioInitialized) return;
  
  // Ambient mood-setting audio during title display
  let progress = min(elapsed / 3000, 1); // 3 second buildup
  
  if (chapterIndex === 0) {
    // Hygge title: Cold wind, anticipating warmth
    let windVol = map(progress, 0, 0.5, 0.08, 0.12, true);
    // Wind stays present, setting the "cold outside" mood
    hyggeWindFilter.frequency.rampTo(500, 0.5);
  }
  else if (chapterIndex === 1) {
    // Komorebi title: Soft forest ambience, birdsong hints
    if (progress > 0.3 && random() < 0.008) {
      // Occasional soft chime like distant birds
      const notes = ['G5', 'A5', 'D6'];
      komorebiChime.triggerAttackRelease(notes[floor(random(3))], "4n", undefined, 0.15);
    }
  }
  else if (chapterIndex === 2) {
    // Fernweh title: Deep, anticipatory drone
    if (fernwehDrone && !fernwehDrone._playing && progress > 0.2) {
      fernwehDrone.triggerAttack(["A1", "E2"]);
      fernwehDrone._playing = true;
    }
    if (fernwehDrone && fernwehDrone.fernwehGain) {
      let vol = map(progress, 0.2, 1, 0, 0.06, true);
      fernwehDrone.fernwehGain.gain.rampTo(vol, 0.8);
    }
    fernwehFilter.frequency.rampTo(200, 1);
  }
}

function setChapterAudio(chapterIndex) {
  if (!audioInitialized) return;
  
  // Reset all audio for clean chapter start
  stopAllAudio();
  
  // Setup audio state for new chapter
  if (chapterIndex === 0) {
    // Hygge: Wind present, warmth will come with gesture
    hyggeWindFilter.frequency.rampTo(600, 0.5);
  }
  else if (chapterIndex === 1) {
    // Komorebi: Quiet forest, sounds respond to light
    if (komorebiDrone) komorebiDrone._playing = false;
  }
  else if (chapterIndex === 2) {
    // Fernweh: Drone will build with reaching
    if (fernwehDrone) fernwehDrone._playing = false;
  }
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
  
  // Komorebi leaves - fewer but larger for visual impact
  komorebiLeaves = [];
  for (let i = 0; i < 25; i++) {
    komorebiLeaves.push({
      x: random(width), y: random(-100, height),
      size: random(45, 95),  // Much bigger leaves
      rotation: random(TWO_PI),
      fallSpeed: random(0.4, 1.0)
    });
  }
  
  // Fernweh stars
  fernwehStars = [];
  for (let i = 0; i < 400; i++) {
    fernwehStars.push({
      x: random(-width, width * 2),
      y: random(-height, height * 0.6),
      z: random(1, 15),
      size: random(1, 4),
      brightness: random(40, 100),
      twinkle: random(TWO_PI)
    });
  }
  
  // Fernweh mist layers (the haze of distance/longing)
  fernwehMist = [];
  for (let i = 0; i < 8; i++) {
    fernwehMist.push({
      x: random(width),
      y: random(height * 0.35, height * 0.65),
      w: random(300, 600),
      h: random(50, 120),
      speed: random(0.1, 0.4),
      alpha: random(20, 50)
    });
  }
  
  // Fernweh memories - ghostly shapes that appear in the distance
  fernwehMemories = [];
  const memoryTypes = ['spire', 'dome', 'tower', 'arch', 'tree'];
  for (let i = 0; i < 6; i++) {
    fernwehMemories.push({
      x: random(width * 0.1, width * 0.9),
      type: memoryTypes[floor(random(memoryTypes.length))],
      size: random(30, 70),
      phase: random(TWO_PI),
      speed: random(0.002, 0.005)
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
  
  // Title audio - set the mood
  updateTitleAudio(currentChapter, elapsed);
  
  textAlign(CENTER, CENTER);
  noStroke();
  
  // Chapter number
  let numAlpha = map(elapsed, 0, 500, 0, 50, true);
  fill(0, 0, 100, numAlpha);
  textSize(18);
  text(`CHAPTER ${chapter.number} OF 3`, width/2, height * 0.22);
  
  // Word (romanized)
  let wordAlpha = map(elapsed, 300, 1000, 0, 100, true);
  fill(chapter.color.h, chapter.color.s * 0.5, 90, wordAlpha);
  textSize(min(width * 0.15, 120));
  text(chapter.word, width/2, height * 0.36);
  
  // Native script (below romanized word)
  let nativeAlpha = map(elapsed, 500, 1100, 0, 70, true);
  fill(chapter.color.h, chapter.color.s * 0.3, 80, nativeAlpha);
  textSize(min(width * 0.06, 50));
  text(chapter.native, width/2, height * 0.36 + 70);
  
  // Pronunciation + origin
  let subAlpha = map(elapsed, 700, 1300, 0, 55, true);
  fill(0, 0, 65, subAlpha);
  textSize(18);
  text(`${chapter.pronunciation}  ·  ${chapter.origin}`, width/2, height * 0.36 + 115);
  
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
  let instrAlpha = map(elapsed, 1800, 2400, 0, 65, true);
  fill(chapter.color.h, 40, 85, instrAlpha);
  textSize(20);
  text(chapter.instruction, width/2, height * 0.82);
  
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
      stopAllAudio(); // Fade out chapter audio
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
  
  // Update audio - wind fades, warmth grows
  updateHyggeAudio(hyggeWarmth);
  
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
  // Deep forest green
  background(135, 45, 8);
  
  // Interaction: spread fingers to let light through (like leaves parting)
  let targetLight = 0.15;
  let doingGesture = false;
  
  if (hands.length > 0) {
    komorebiHandY = lerp(komorebiHandY, hands[0].y / height, 0.08);
    
    // Light responds to open hand (fingers spread = light filtering through)
    if (hands[0].open) {
      targetLight = map(hands[0].y, height, 0, 0.4, 1, true);
      doingGesture = true;
    } else {
      targetLight = 0.2;
    }
  }
  
  // Update gesture timer
  if (doingGesture) {
    if (!gestureActive) {
      gestureActive = true;
      gestureStartTime = millis();
      console.log("KOMOREBI: Gesture started - fingers spread like light through leaves");
    }
  } else {
    if (gestureActive) {
      console.log("KOMOREBI: Gesture stopped");
    }
    gestureActive = false;
  }
  
  komorebiLight = lerp(komorebiLight, targetLight, 0.04);
  
  // Update audio
  updateKomorebiAudio(komorebiLight, komorebiHandY);
  
  // Draw canopy silhouette at top first (darker layer)
  noStroke();
  fill(130, 55, 4);
  for (let i = 0; i < 25; i++) {
    let x = i * width/15 - 80;
    let size = 200 + sin(i * 0.5) * 60;
    ellipse(x, -30, size, size * 0.8);
  }
  
  // Light rays filtering through gaps
  for (let ray of komorebiRays) {
    let brightness = ray.brightness * komorebiLight;
    let sway = sin(frameCount * 0.008 + ray.phase) * 30;
    
    push();
    translate(ray.x + sway, 0);
    
    // Multiple soft layers for god-ray effect
    for (let i = 4; i >= 0; i--) {
      let w = ray.width * (1 + i * 0.5);
      let alpha = brightness * 0.12 / (i + 1);
      
      let grad = drawingContext.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, `hsla(45, 70%, ${95 * komorebiLight}%, ${alpha})`);
      grad.addColorStop(0.3, `hsla(42, 60%, ${85 * komorebiLight}%, ${alpha * 0.8})`);
      grad.addColorStop(1, `hsla(40, 50%, ${60 * komorebiLight}%, 0)`);
      drawingContext.fillStyle = grad;
      
      beginShape();
      vertex(-w * 0.05, 0);
      vertex(w * 0.05, 0);
      vertex(w * 0.8, height);
      vertex(-w * 0.8, height);
      endShape(CLOSE);
    }
    pop();
  }
  
  // Large, prominent leaves floating down
  for (let leaf of komorebiLeaves) {
    // Gentle floating motion
    leaf.y += leaf.fallSpeed * 0.7;
    leaf.x += sin(frameCount * 0.015 + leaf.rotation) * 1.2;
    leaf.rotation += 0.008;
    
    if (leaf.y > height + 100) {
      leaf.y = -100;
      leaf.x = random(width);
      leaf.size = random(40, 90); // Bigger leaves
    }
    
    push();
    translate(leaf.x, leaf.y);
    rotate(leaf.rotation);
    
    // Draw leaf shape (more detailed)
    let lSize = leaf.size * 1.5; // Make leaves bigger
    
    // Leaf catches light when it passes through rays
    let inLight = false;
    for (let ray of komorebiRays) {
      if (abs(leaf.x - ray.x) < ray.width * 0.5) {
        inLight = true;
        break;
      }
    }
    
    // Leaf body - darker when in shadow, golden when in light
    if (inLight && komorebiLight > 0.3) {
      // Backlit leaf - glowing edges
      fill(50, 70, 60, 70);
      ellipse(0, 0, lSize * 0.35, lSize);
      // Glow
      fill(45, 80, 80, 30 * komorebiLight);
      ellipse(0, 0, lSize * 0.5, lSize * 1.2);
    } else {
      // Shadow leaf
      fill(120, 45, 25, 65);
      ellipse(0, 0, lSize * 0.35, lSize);
    }
    
    // Leaf vein
    stroke(100, 30, 20, 40);
    strokeWeight(1);
    line(0, -lSize * 0.4, 0, lSize * 0.4);
    noStroke();
    
    pop();
  }
  
  // Light pool where hand is (catching light)
  if (hands.length > 0 && hands[0].open) {
    let poolSize = 250 * komorebiLight;
    for (let r = poolSize; r > 0; r -= 25) {
      fill(48, 55, 90, map(r, 0, poolSize, 50, 0) * komorebiLight);
      ellipse(hands[0].x, hands[0].y, r * 2, r * 1.3);
    }
    
    // Floating light particles around hand
    for (let i = 0; i < 8; i++) {
      let angle = frameCount * 0.02 + i * PI / 4;
      let dist = 60 + sin(frameCount * 0.05 + i) * 20;
      let px = hands[0].x + cos(angle) * dist;
      let py = hands[0].y + sin(angle) * dist * 0.6;
      let pSize = 4 + sin(frameCount * 0.1 + i) * 2;
      fill(50, 60, 95, 50 * komorebiLight);
      ellipse(px, py, pSize);
    }
  }
  
  // Foreground canopy layer (darker, frames the scene)
  fill(135, 60, 3);
  for (let i = 0; i < 8; i++) {
    let x = i * width/5 - 100;
    ellipse(x, -50, 280, 200);
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
  let cx = width / 2;
  let horizonY = height * 0.42;
  
  // Sky: deep twilight gradient - violet at top fading to warm amber glow at horizon
  for (let y = 0; y < height; y++) {
    let inter = y / height;
    if (y < horizonY) {
      // Upper sky: deep violet to dusky rose
      let skyInter = y / horizonY;
      stroke(lerpColor(
        color(270, 55, 5),      // Deep night violet
        color(280, 35, 18),     // Dusky rose
        skyInter
      ));
    } else {
      // Below horizon: earth tones
      let groundInter = (y - horizonY) / (height - horizonY);
      stroke(lerpColor(
        color(260, 30, 10),
        color(250, 25, 5),
        groundInter
      ));
    }
    line(0, y, width, y);
  }
  noStroke();
  
  // Interaction: reach forward (hand size / z depth)
  let targetSpeed = 0;
  let doingGesture = false;
  
  if (hands.length > 0) {
    targetSpeed = map(hands[0].z, 0, 1, 0, 1, true);
    let yBonus = map(hands[0].y, height, 0, 0, 0.3, true);
    targetSpeed = max(targetSpeed, yBonus);
    
    // GESTURE: reaching toward camera OR hand in upper half
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
    if (gestureActive) console.log("FERNWEH: Gesture stopped");
    gestureActive = false;
  }
  
  fernwehSpeed = lerp(fernwehSpeed, targetSpeed, 0.04);
  fernwehDistance += fernwehSpeed * 5;
  
  // Update audio
  updateFernwehAudio(fernwehSpeed);
  
  // === STARS: gently twinkling, not aggressive ===
  for (let star of fernwehStars) {
    star.twinkle += 0.02;
    let twinkleAlpha = (sin(star.twinkle) * 0.3 + 0.7);
    
    // Slow drift when reaching
    star.z -= fernwehSpeed * star.z * 0.02;
    if (star.z < 0.5) {
      star.z = 15;
      star.x = random(-width, width * 2);
      star.y = random(-height * 0.5, height * 0.4);
    }
    
    let px = cx + (star.x - cx) / star.z;
    let py = (star.y) / star.z;
    let pSize = star.size / star.z;
    
    if (px < -20 || px > width + 20 || py < -20 || py > horizonY + 20) continue;
    
    fill(270, 15, star.brightness * twinkleAlpha, map(star.z, 0.5, 15, 80, 15));
    ellipse(px, py, pSize);
  }
  
  // === HORIZON GLOW: the unreachable "there" ===
  // Warm amber glow at the vanishing point — this is what calls you
  let glowIntensity = 0.25 + fernwehSpeed * 0.75;
  let glowPulse = sin(frameCount * 0.008) * 0.1 + 1;
  
  // Outer glow - soft and wide
  for (let r = 280 * glowIntensity; r > 0; r -= 8) {
    let alpha = map(r, 0, 280 * glowIntensity, 40, 0) * glowIntensity;
    fill(30, 60, 75, alpha * glowPulse);
    ellipse(cx, horizonY, r * 4, r * 1.5);
  }
  
  // Inner glow - brighter, the "promise" of the distant place
  for (let r = 80 * glowIntensity; r > 0; r -= 6) {
    let alpha = map(r, 0, 80 * glowIntensity, 55, 0) * glowIntensity;
    fill(35, 50, 90, alpha * glowPulse);
    ellipse(cx, horizonY - 5, r * 2.5, r);
  }
  
  // === GHOSTLY SILHOUETTES: places you've never been ===
  // They appear faintly in the distance — spires, domes, arches
  for (let mem of fernwehMemories) {
    let phase = sin(frameCount * mem.speed + mem.phase);
    let memAlpha = (0.15 + fernwehSpeed * 0.3) * (phase * 0.3 + 0.7);
    let memY = horizonY - mem.size * 0.3;
    let drift = sin(frameCount * 0.003 + mem.phase) * 15;
    
    fill(30, 30, 60, memAlpha * 100);
    noStroke();
    
    if (mem.type === 'spire') {
      // Church spire / minaret
      triangle(
        mem.x + drift, memY - mem.size,
        mem.x + drift - mem.size * 0.15, memY,
        mem.x + drift + mem.size * 0.15, memY
      );
    } else if (mem.type === 'dome') {
      // Mosque dome / cathedral
      arc(mem.x + drift, memY, mem.size * 0.6, mem.size * 0.5, PI, TWO_PI);
      rect(mem.x + drift - mem.size * 0.25, memY, mem.size * 0.5, mem.size * 0.2);
    } else if (mem.type === 'tower') {
      // Tower
      rect(mem.x + drift - mem.size * 0.08, memY - mem.size * 0.8, mem.size * 0.16, mem.size * 0.8);
    } else if (mem.type === 'arch') {
      // Gateway arch
      arc(mem.x + drift, memY, mem.size * 0.5, mem.size * 0.7, PI, TWO_PI);
    } else {
      // Distant tree
      ellipse(mem.x + drift, memY - mem.size * 0.3, mem.size * 0.4, mem.size * 0.5);
      rect(mem.x + drift - 2, memY - mem.size * 0.1, 4, mem.size * 0.3);
    }
  }
  
  // === MOUNTAIN LAYERS: depth and distance ===
  // Far mountains - barely visible, violet
  fill(270, 35, 14);
  beginShape();
  vertex(0, height);
  for (let x = 0; x <= width; x += 25) {
    vertex(x, horizonY + 20 - noise(x * 0.003 + 100) * 80);
  }
  vertex(width, height);
  endShape(CLOSE);
  
  // Mid mountains
  fill(265, 30, 10);
  beginShape();
  vertex(0, height);
  for (let x = 0; x <= width; x += 20) {
    vertex(x, horizonY + 50 - noise(x * 0.005 + 50) * 70);
  }
  vertex(width, height);
  endShape(CLOSE);
  
  // Near hills - darkest
  fill(260, 25, 7);
  beginShape();
  vertex(0, height);
  for (let x = 0; x <= width; x += 15) {
    vertex(x, horizonY + 80 - noise(x * 0.008) * 50);
  }
  vertex(width, height);
  endShape(CLOSE);
  
  // === MIST: the emotional haze of longing ===
  for (let m of fernwehMist) {
    m.x += m.speed;
    if (m.x > width + m.w) m.x = -m.w;
    
    let mistAlpha = m.alpha * (0.5 + fernwehSpeed * 0.5);
    for (let r = 3; r >= 0; r--) {
      fill(270, 20, 30, mistAlpha / (r + 1));
      ellipse(m.x, m.y, m.w + r * 40, m.h + r * 20);
    }
  }
  
  // === THE ROAD: solitary path to nowhere ===
  // Wider at bottom, vanishing to a point — you're alone on this road
  fill(255, 15, 6);
  beginShape();
  vertex(width * 0.25, height);
  vertex(cx - 1.5, horizonY + 15);
  vertex(cx + 1.5, horizonY + 15);
  vertex(width * 0.75, height);
  endShape(CLOSE);
  
  // Dashed center line — the road goes on
  for (let i = 0; i < 30; i++) {
    let z = ((i * 25 + fernwehDistance * 12) % 500) / 500;
    let y = lerp(horizonY + 15, height, z * z); // quadratic for perspective
    let w = lerp(0.5, 6, z);
    let lineLen = lerp(2, 35, z);
    let lineAlpha = map(z, 0, 1, 10, 55);
    fill(40, 50, 55, lineAlpha);
    rect(cx - w/2, y, w, lineLen);
  }
  
  // === SOLITARY FIGURE silhouette (you, walking) ===
  let figureY = height * 0.72;
  let figureSize = 18;
  let figureAlpha = 40 + fernwehSpeed * 30;
  fill(260, 30, 5, figureAlpha);
  // Head
  ellipse(cx, figureY - figureSize * 1.5, figureSize * 0.5, figureSize * 0.5);
  // Body
  rect(cx - figureSize * 0.15, figureY - figureSize * 1.3, figureSize * 0.3, figureSize);
  // Legs (walking)
  let legSwing = sin(fernwehDistance * 0.3) * 3;
  rect(cx - figureSize * 0.12 + legSwing, figureY - figureSize * 0.3, figureSize * 0.12, figureSize * 0.5);
  rect(cx + figureSize * 0.02 - legSwing, figureY - figureSize * 0.3, figureSize * 0.12, figureSize * 0.5);
  
  // === NARRATIVE TEXT ===
  textAlign(CENTER, CENTER);
  noStroke();
  
  // The ache — poetic text that fades in based on reaching
  if (fernwehSpeed > 0.2) {
    let textAlpha = map(fernwehSpeed, 0.2, 0.8, 0, 65, true);
    fill(0, 0, 100, textAlpha);
    textSize(18);
    textStyle(ITALIC);
    
    // Different messages at different intensities
    if (fernwehSpeed > 0.6) {
      text("you have never been there, but you miss it", cx, height * 0.25);
    } else if (fernwehSpeed > 0.4) {
      text("somewhere, a place is waiting for you", cx, height * 0.25);
    } else {
      text("the distance aches...", cx, height * 0.25);
    }
    textStyle(NORMAL);
  }
  
  // Heavy vignette — the world narrows when you long for somewhere else
  drawVignette(0.55 - fernwehSpeed * 0.15);
}

// === REFLECTION PHASE ===
function drawReflection() {
  let chapter = CHAPTERS[currentChapter];
  let elapsed = millis() - phaseTimer;
  
  background(chapter.color.h, chapter.color.s * 0.15, 5);
  drawTravelingParticles(0.4);
  
  // Reflection audio - gentle resolution
  updateReflectionAudio(currentChapter, elapsed);
  
  textAlign(CENTER, CENTER);
  noStroke();
  
  // "You experienced"
  let labelAlpha = map(elapsed, 0, 600, 0, 50, true);
  fill(0, 0, 60, labelAlpha);
  textSize(16);
  text("YOU EXPERIENCED", width/2, height * 0.28);
  
  // Word
  let wordAlpha = map(elapsed, 300, 900, 0, 100, true);
  fill(chapter.color.h, chapter.color.s * 0.5, 85, wordAlpha);
  textSize(min(width * 0.10, 85));
  text(chapter.word, width/2, height * 0.38);
  
  // Native script
  let nativeAlpha = map(elapsed, 400, 1000, 0, 65, true);
  fill(chapter.color.h, chapter.color.s * 0.3, 75, nativeAlpha);
  textSize(min(width * 0.05, 40));
  text(chapter.native, width/2, height * 0.47);
  
  // Meaning
  let meaningAlpha = map(elapsed, 600, 1200, 0, 80, true);
  fill(0, 0, 90, meaningAlpha);
  textSize(22);
  textStyle(ITALIC);
  text(`"${chapter.meaning}"`, width/2, height * 0.57);
  textStyle(NORMAL);
  
  // "Through speculative storytelling"
  let methodAlpha = map(elapsed, 900, 1500, 0, 50, true);
  fill(0, 0, 60, methodAlpha);
  textSize(14);
  text("through embodied, speculative translation", width/2, height * 0.67);
  
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
  
  // Story-driven transition narratives — SLOW, intentional pacing
  const transitions = [
    { // Hygge → Komorebi: From safety to wonder
      lines: [
        { text: "The fire dims.", time: 0, duration: 3500, size: 36 },
        { text: "Something stirs within you.", time: 3000, duration: 3500, size: 32 },
        { text: "A door opens.", time: 6000, duration: 3000, size: 38 },
        { text: "Outside, the world is waiting.", time: 8500, duration: 3500, size: 30 },
        { text: "You step into the light...", time: 11500, duration: 3500, size: 34 }
      ],
      totalTime: 15000
    },
    { // Komorebi → Fernweh: From wonder to longing
      lines: [
        { text: "The light fades.", time: 0, duration: 3500, size: 36 },
        { text: "But its warmth lingers\nin your chest.", time: 3000, duration: 4000, size: 30 },
        { text: "You look to the horizon.", time: 6500, duration: 3500, size: 34 },
        { text: "There are places\nyou have never been.", time: 9500, duration: 4000, size: 32 },
        { text: "They call to you now...", time: 13000, duration: 3500, size: 36 }
      ],
      totalTime: 16500
    }
  ];
  
  let trans = transitions[currentChapter] || transitions[0];
  let progress = elapsed / trans.totalTime;
  let easeProgress = progress * progress * (3 - 2 * progress);
  
  // Gradual background shift
  let h = lerp(fromChapter.color.h, toChapter.color.h, easeProgress);
  let s = lerp(fromChapter.color.s, toChapter.color.s, easeProgress);
  let b = lerp(5, 4, sin(progress * PI)); // Slightly darker in middle
  background(h, s * 0.1, b);
  
  // Particles fade and shift
  for (let p of travelingParticles) {
    p.hue = lerp(fromChapter.color.h, toChapter.color.h, easeProgress);
  }
  let particleAlpha = 0.2 + sin(progress * PI) * 0.3;
  drawTravelingParticles(particleAlpha);
  
  // Cinematic letterbox
  let barHeight = sin(progress * PI) * 70;
  fill(0, 0, 0, 95);
  noStroke();
  rect(0, 0, width, barHeight);
  rect(0, height - barHeight, width, barHeight);
  
  // Draw narrative lines
  textAlign(CENTER, CENTER);
  noStroke();
  
  for (let line of trans.lines) {
    let lineProgress = (elapsed - line.time) / line.duration;
    if (lineProgress > 0 && lineProgress < 1) {
      // Slow fade in, hold, slow fade out
      let alpha;
      if (lineProgress < 0.25) {
        alpha = map(lineProgress, 0, 0.25, 0, 90); // Fade in
      } else if (lineProgress > 0.75) {
        alpha = map(lineProgress, 0.75, 1, 90, 0); // Fade out
      } else {
        alpha = 90; // Hold
      }
      
      fill(0, 0, 100, alpha);
      textSize(line.size || 32);
      textStyle(ITALIC);
      text(line.text, width/2, height/2);
      textStyle(NORMAL);
    }
  }
  
  // Final preview of next word (last 3 seconds) — slow reveal
  if (elapsed > trans.totalTime - 3000) {
    let revealProgress = map(elapsed, trans.totalTime - 3000, trans.totalTime, 0, 1, true);
    // Ease in
    let easeReveal = revealProgress * revealProgress;
    let alpha = easeReveal * 80;
    
    // Native script first (subtle)
    fill(toChapter.color.h, toChapter.color.s * 0.3, 70, alpha * 0.5);
    textSize(36);
    text(toChapter.native, width/2, height * 0.40);
    
    // Then romanized — large
    fill(toChapter.color.h, toChapter.color.s * 0.5, 85, alpha);
    textSize(min(width * 0.12, 90));
    text(toChapter.word, width/2, height * 0.54);
    
    // Meaning underneath
    if (revealProgress > 0.4) {
      let meaningAlpha = map(revealProgress, 0.4, 1, 0, 60, true);
      fill(0, 0, 80, meaningAlpha);
      textSize(22);
      textStyle(ITALIC);
      text(`"${toChapter.meaning}"`, width/2, height * 0.66);
      textStyle(NORMAL);
    }
  }
  
  // Update transition audio
  updateTransitionAudio(currentChapter, progress);
  
  // Complete transition
  if (elapsed > trans.totalTime) {
    currentChapter++;
    phase = 'title';
    phaseTimer = millis();
    chapterProgress = 0;
    chapterComplete = false;
    setChapterAudio(currentChapter);
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
  
  // Completion audio - gentle resolution of the journey
  updateCompleteAudio(elapsed);
  
  textAlign(CENTER, CENTER);
  noStroke();
  
  // Journey complete
  let titleAlpha = map(elapsed, 0, 800, 0, 100, true);
  fill(0, 0, 100, titleAlpha);
  textSize(28);
  text("JOURNEY COMPLETE", width/2, height * 0.25);
  
  // Three words with native script
  let wordsAlpha = map(elapsed, 500, 1500, 0, 80, true);
  fill(0, 0, 75, wordsAlpha);
  textSize(16);
  text("hygge  ·  木漏れ日  ·  Fernweh", width/2, height * 0.34);
  
  fill(0, 0, 90, wordsAlpha);
  textSize(20);
  text("HYGGE  →  KOMOREBI  →  FERNWEH", width/2, height * 0.40);
  
  // Home to Horizon
  let subAlpha = map(elapsed, 800, 1800, 0, 60, true);
  fill(0, 0, 60, subAlpha);
  textSize(16);
  textStyle(ITALIC);
  text("from home to horizon", width/2, height * 0.48);
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
  
  // Bigger, clearer instruction
  fill(0, 0, 100, 70);
  textAlign(CENTER, BOTTOM);
  textSize(22);
  text(chapter.instruction, width/2, height - 80);
  
  // Subtle hint below
  if (!gestureActive) {
    fill(0, 0, 100, 35);
    textSize(14);
    text("use your hand to interact", width/2, height - 50);
  }
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
