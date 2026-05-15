/* ===================================================
   TypeFlux — Typing Speed Test  |  script.js
   =================================================== */

'use strict';

// ─── Text passages ────────────────────────────────────────────────────────────
const PASSAGES = [
  `The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump. The five boxing wizards jump quickly.`,
  `Bright stars illuminate the vast expanse of the night sky, each one a sun burning billions of miles away. Scientists study these celestial bodies to understand the origins of our universe and the possibility of life beyond Earth.`,
  `Technology has reshaped every corner of modern life. From the smartphones in our pockets to the satellites orbiting overhead, digital innovation accelerates at a pace that challenges our ability to adapt and understand its long-term consequences.`,
  `A good book can transport you to another world entirely. The best authors craft sentences that feel inevitable — as though no other arrangement of words could possibly convey the same meaning with such precision and beauty.`,
  `Mountains rise in silence over valleys carved by ancient glaciers. The wind carries the scent of pine and cold stone. Wildlife thrives in these remote places, undisturbed by the noise of modern civilization.`,
  `Cooking is both a science and an art. Understanding the chemistry behind caramelization, emulsification, and the Maillard reaction allows chefs to create dishes that are not only delicious but also consistent and repeatable across countless servings.`,
  `Music speaks where words fail. A melody can capture grief, joy, longing, or triumph in ways that bypass rational thought entirely. Great composers understand this intuitively and build entire emotional journeys from nothing but organized sound.`,
  `The history of human exploration is one of extraordinary courage. Sailors crossed unknown oceans with only stars as guides. Astronauts ventured beyond the atmosphere into the silence of space. Each step outward expanded what was possible for all of humanity.`,
  `Software engineering is the discipline of translating complex human needs into precise instructions a machine can execute. It demands both analytical rigor and creative problem-solving, making it one of the most intellectually rewarding careers of the modern era.`,
  `The ocean covers more than seventy percent of Earth's surface, yet we have mapped less of it than we have of the Moon. Its depths hide species never seen by human eyes, geological formations of enormous scale, and secrets stretching back millions of years.`
];

// ─── DOM references ───────────────────────────────────────────────────────────
const startScreen   = document.getElementById('startScreen');
const testScreen    = document.getElementById('testScreen');
const startBtn      = document.getElementById('startBtn');
const restartBtn    = document.getElementById('restartBtn');
const tryAgainBtn   = document.getElementById('tryAgainBtn');
const newTestBtn    = document.getElementById('newTestBtn');
const timeBtns      = document.querySelectorAll('.time-btn');
const typingInput   = document.getElementById('typingInput');
const textBox       = document.getElementById('textBox');
const timerDisplay  = document.getElementById('timerDisplay');
const timerBar      = document.getElementById('timerBar');
const wpmDisplay    = document.getElementById('wpmDisplay');
const accDisplay    = document.getElementById('accDisplay');
const correctDisplay= document.getElementById('correctDisplay');
const errorsDisplay = document.getElementById('errorsDisplay');
const headerStats   = document.getElementById('headerStats');
const liveWpm       = document.getElementById('liveWpm');
const liveAcc       = document.getElementById('liveAcc');
const resultsModal  = document.getElementById('resultsModal');
const finalWpm      = document.getElementById('finalWpm');
const finalAcc      = document.getElementById('finalAcc');
const finalCorrect  = document.getElementById('finalCorrect');
const finalErrors   = document.getElementById('finalErrors');
const finalWords    = document.getElementById('finalWords');
const finalTime     = document.getElementById('finalTime');
const ratingBadge   = document.getElementById('ratingBadge');
const ratingText    = document.getElementById('ratingText');
const modalSubtitle = document.getElementById('modalSubtitle');

// ─── State ────────────────────────────────────────────────────────────────────
let selectedTime   = 60;   // seconds
let timeLeft       = 60;
let totalTime      = 60;
let timerInterval  = null;
let started        = false;
let currentPassage = '';
let charSpans      = [];
let currentIndex   = 0;
let correctChars   = 0;
let incorrectChars = 0;
let startTimestamp = null;

// ─── Init ─────────────────────────────────────────────────────────────────────
spawnParticles();

// ─── Time button selection ────────────────────────────────────────────────────
timeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    timeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedTime = parseInt(btn.dataset.time, 10);
  });
});

// ─── Start test ───────────────────────────────────────────────────────────────
startBtn.addEventListener('click', beginTest);
restartBtn.addEventListener('click', () => {
  resetTest();
  beginTest();
});
tryAgainBtn.addEventListener('click', () => {
  resultsModal.classList.add('hidden');
  resetTest();
  beginTest();
});
newTestBtn.addEventListener('click', () => {
  resultsModal.classList.add('hidden');
  resetTest();
  goToStart();
});

function goToStart() {
  testScreen.classList.add('hidden');
  startScreen.classList.remove('hidden');
  startScreen.style.animation = 'none';
  requestAnimationFrame(() => {
    startScreen.style.animation = '';
  });
  headerStats.style.display = 'none';
}

function beginTest() {
  totalTime  = selectedTime;
  timeLeft   = selectedTime;
  started    = false;
  currentIndex   = 0;
  correctChars   = 0;
  incorrectChars = 0;
  startTimestamp = null;

  // Pick a random passage
  currentPassage = PASSAGES[Math.floor(Math.random() * PASSAGES.length)];
  renderPassage(currentPassage);
  updateTimerDisplay();
  timerBar.style.width = '100%';
  timerBar.classList.remove('urgent');
  timerDisplay.classList.remove('urgent');
  updateStats();

  startScreen.classList.add('hidden');
  testScreen.classList.remove('hidden');
  testScreen.style.animation = 'none';
  requestAnimationFrame(() => { testScreen.style.animation = ''; });

  headerStats.style.display = 'flex';
  typingInput.value = '';
  typingInput.focus();
}

// ─── Render passage as character spans ───────────────────────────────────────
function renderPassage(text) {
  textBox.innerHTML = '';
  charSpans = [];
  text.split('').forEach((ch, i) => {
    const span = document.createElement('span');
    span.classList.add('char');
    // Render spaces visibly
    span.textContent = ch === ' ' ? '\u00A0' : ch;
    span.dataset.char = ch;
    if (i === 0) span.classList.add('current');
    charSpans.push(span);
    textBox.appendChild(span);
  });
}

// ─── Typing input handler ─────────────────────────────────────────────────────
typingInput.addEventListener('input', handleInput);
typingInput.addEventListener('keydown', (e) => {
  // Prevent tab from defocusing
  if (e.key === 'Tab') e.preventDefault();
});

function handleInput() {
  const typed = typingInput.value;

  // Start timer on first keystroke
  if (!started && typed.length > 0) {
    started = true;
    startTimestamp = Date.now();
    startTimer();
  }

  // Figure out what changed
  const newLen = typed.length;

  // Rebuild from scratch each time (simple & reliable)
  correctChars   = 0;
  incorrectChars = 0;

  charSpans.forEach((span, i) => {
    span.classList.remove('correct', 'incorrect', 'current');
    if (i < newLen) {
      const typedChar = typed[i];
      const expectedChar = span.dataset.char;
      if (typedChar === expectedChar) {
        span.classList.add('correct');
        correctChars++;
      } else {
        span.classList.add('incorrect');
        incorrectChars++;
      }
    } else if (i === newLen) {
      span.classList.add('current');
    }
  });

  currentIndex = newLen;
  updateStats();
  scrollToCurrentChar();

  // Auto-advance when passage is fully typed
  if (newLen >= charSpans.length) {
    endTest();
  }
}

function scrollToCurrentChar() {
  if (currentIndex < charSpans.length) {
    charSpans[currentIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

// ─── Timer ────────────────────────────────────────────────────────────────────
function startTimer() {
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    updateTimerBar();

    if (timeLeft <= 10) {
      timerDisplay.classList.add('urgent');
      timerBar.classList.add('urgent');
    }

    if (timeLeft <= 0) {
      endTest();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  timerDisplay.textContent = m > 0
    ? `${m}:${String(s).padStart(2, '0')}`
    : String(timeLeft);
}

function updateTimerBar() {
  const pct = (timeLeft / totalTime) * 100;
  timerBar.style.width = `${pct}%`;
}

// ─── Stats calculation ────────────────────────────────────────────────────────
function calcWpm() {
  if (!startTimestamp) return 0;
  const elapsedMinutes = (Date.now() - startTimestamp) / 60000;
  if (elapsedMinutes === 0) return 0;
  // Standard WPM: every 5 chars = 1 word
  const wpm = Math.round(correctChars / 5 / elapsedMinutes);
  return Math.max(0, wpm);
}

function calcAccuracy() {
  const total = correctChars + incorrectChars;
  if (total === 0) return 100;
  return Math.round((correctChars / total) * 100);
}

function updateStats() {
  const wpm = calcWpm();
  const acc = calcAccuracy();
  wpmDisplay.textContent     = wpm;
  accDisplay.textContent     = `${acc}%`;
  correctDisplay.textContent = correctChars;
  errorsDisplay.textContent  = incorrectChars;
  liveWpm.textContent        = wpm;
  liveAcc.textContent        = `${acc}%`;
}

// ─── End test ─────────────────────────────────────────────────────────────────
function endTest() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  const wpm     = calcWpm();
  const acc     = calcAccuracy();
  const words   = Math.floor(correctChars / 5);
  const elapsed = startTimestamp ? Math.round((Date.now() - startTimestamp) / 1000) : 0;

  showResults(wpm, acc, correctChars, incorrectChars, words, elapsed);
}

function showResults(wpm, acc, correct, errors, words, elapsed) {
  finalWpm.textContent     = wpm;
  finalAcc.textContent     = `${acc}%`;
  finalCorrect.textContent = correct;
  finalErrors.textContent  = errors;
  finalWords.textContent   = words;
  finalTime.textContent    = elapsed >= 60
    ? `${Math.floor(elapsed/60)}m ${elapsed%60}s`
    : `${elapsed}s`;

  // Subtitle
  const duration = totalTime >= 300 ? '5 min' : totalTime >= 120 ? '2 min' : '1 min';
  modalSubtitle.textContent = `${duration} test — your results`;

  // Rating
  let rating, cls;
  if (wpm >= 100) { rating = '🔥 Legendary! Top 1% typist!';   cls = 'legendary'; }
  else if (wpm >= 80) { rating = '⚡ Expert! Extremely fast!'; cls = 'expert'; }
  else if (wpm >= 60) { rating = '🚀 Advanced! Above average!'; cls = 'advanced'; }
  else if (wpm >= 40) { rating = '💪 Intermediate — keep it up!'; cls = 'intermediate'; }
  else               { rating = '🌱 Beginner — practice makes perfect!'; cls = 'beginner'; }

  ratingBadge.className = `rating-badge ${cls}`;
  ratingText.textContent = rating;

  resultsModal.classList.remove('hidden');
}

// ─── Reset ────────────────────────────────────────────────────────────────────
function resetTest() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  started        = false;
  currentIndex   = 0;
  correctChars   = 0;
  incorrectChars = 0;
  startTimestamp = null;
  timeLeft       = selectedTime;
  typingInput.value = '';
  timerDisplay.classList.remove('urgent');
  timerBar.classList.remove('urgent');
}

// ─── Background particles ─────────────────────────────────────────────────────
function spawnParticles() {
  const container = document.getElementById('bgParticles');
  const colors = ['#7c5cfc', '#a78bfa', '#60a5fa', '#34d399'];
  const count = 22;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    const size = Math.random() * 4 + 2;
    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}%;
      bottom: -${size}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration: ${Math.random() * 18 + 12}s;
      animation-delay: ${Math.random() * 10}s;
      filter: blur(${Math.random() > 0.5 ? 1 : 0}px);
    `;
    container.appendChild(p);
  }
}
