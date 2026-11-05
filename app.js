import { base32Decode, totp, counterAt, STEP_SECONDS } from './totp.js';

// v0.1: ערכי דוגמה בלבד, לא תלמיד אמיתי ולא סוד אמיתי.
// ב-v0.2 הערכים האלה יגיעו מתהליך ההפעלה וישמרו בטלפון.
const DEMO = {
  name: 'ישראל ישראלי',
  id: 'A7F3K9Q2',
  secret: 'JBSWY3DPEHPK3PXP',
};

const STEP_MS = STEP_SECONDS * 1000;
const ORBIT_MS = 2000;
const WARN_SECONDS = 5;

const el = {
  name: document.getElementById('name'),
  card: document.getElementById('card'),
  qr: document.getElementById('qr'),
  digits: document.getElementById('digits'),
  progress: document.getElementById('ring-progress'),
  orbit: document.getElementById('orbit'),
  secs: document.getElementById('ring-secs'),
  clock: document.getElementById('clock'),
  version: document.getElementById('version'),
  offline: document.getElementById('offline'),
};

const key = base32Decode(DEMO.secret);
const RING_LEN = 2 * Math.PI * Number(el.progress.getAttribute('r'));
el.progress.style.strokeDasharray = String(RING_LEN);

let currentCounter = -1;
let currentPayload = '';

el.name.textContent = DEMO.name;
el.version.textContent = self.APP_VERSION || '';

// תוכן הברקוד: מזהה אקראי + קוד. אותיות גדולות, ספרות ונקודה בלבד,
// כדי להשתמש במצב Alphanumeric של QR ולקבל ברקוד קטן עם ריבועים גדולים.
function buildPayload(code) {
  return `${DEMO.id}.${code}`;
}

function drawQR(text) {
  const qr = qrcode(0, 'M');
  qr.addData(text, 'Alphanumeric');
  qr.make();

  const n = qr.getModuleCount();
  const quiet = 4;
  const total = n + quiet * 2;
  const cssSize = el.qr.clientWidth || 300;
  const dpr = window.devicePixelRatio || 1;
  const px = Math.max(1, Math.floor((cssSize * dpr) / total));
  const size = px * total;

  el.qr.width = size;
  el.qr.height = size;
  const ctx = el.qr.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#000000';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.isDark(r, c)) ctx.fillRect((c + quiet) * px, (r + quiet) * px, px, px);
    }
  }
}

function pad2(v) {
  return String(v).padStart(2, '0');
}

function refreshCode(now) {
  const counter = counterAt(now);
  if (counter === currentCounter) return;
  const firstDraw = currentCounter === -1;
  currentCounter = counter;
  const code = totp(key, now);
  currentPayload = buildPayload(code);
  drawQR(currentPayload);
  el.digits.textContent = `${code.slice(0, 3)} ${code.slice(3)}`;
  if (!firstDraw) {
    el.card.classList.remove('fresh');
    void el.card.offsetWidth;
    el.card.classList.add('fresh');
  }
}

function tick() {
  const now = Date.now();
  refreshCode(now);

  const elapsed = now % STEP_MS;
  const remaining = STEP_MS - elapsed;
  el.progress.style.strokeDashoffset = String((elapsed / STEP_MS) * RING_LEN);
  el.secs.textContent = String(Math.ceil(remaining / 1000));
  el.card.parentElement.classList.toggle('warn', remaining <= WARN_SECONDS * 1000);

  const angle = ((now % ORBIT_MS) / ORBIT_MS) * 360;
  el.orbit.setAttribute('transform', `rotate(${angle} 50 50)`);

  const d = new Date(now);
  el.clock.textContent = `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;

  requestAnimationFrame(tick);
}

window.addEventListener('resize', () => {
  if (currentPayload) drawQR(currentPayload);
});

// השארת המסך דולק כל עוד הברקוד מוצג (אם הדפדפן תומך).
let wakeLock = null;
async function keepAwake() {
  try {
    if ('wakeLock' in navigator && document.visibilityState === 'visible' && !wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    }
  } catch {
    wakeLock = null;
  }
}
document.addEventListener('visibilitychange', keepAwake);

// Service worker: נדרש להתקנה ולעבודה בלי אינטרנט. עובד רק ב-HTTPS או localhost.
async function registerSW() {
  if (!('serviceWorker' in navigator)) {
    el.offline.textContent = 'בלי רשת: לא זמין (נדרש HTTPS)';
    return;
  }
  try {
    await navigator.serviceWorker.register('./sw.js');
    await navigator.serviceWorker.ready;
    el.offline.textContent = 'עובד גם בלי רשת';
  } catch {
    el.offline.textContent = 'בלי רשת: שגיאה ברישום';
  }
}

requestAnimationFrame(tick);
keepAwake();
registerSW();
