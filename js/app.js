/* ========================================================
   🌸 MADINA UCHUN SAYT LOGIKASI
   (Yuqori tezlikda, 0% CPU sarfi bilan optimallashtirilgan)
======================================================== */

const CONFIG = {
  herName: "Madina",
  botToken: "8750745719:AAEktVxwqSnbEE7xfm50j1d_8SPO0xyVfrA",
  chatId: "", // Bo'sh bo'lsa, Telegram botingizga /start bosganingizda avtomatik aniqlanadi
};

const HER_NAME = CONFIG.herName;
const $ = (id) => document.getElementById(id);

/* ========================================================
   1. AUDIOMENEDJER (WebAudio)
======================================================== */
let actx = null;
function getAudioContext() {
  if (!actx) {
    actx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (actx.state === 'suspended') {
    actx.resume();
  }
  return actx;
}

// Pufakcha ovozi
function playPopSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const baseFreq = 440 + Math.random() * 260;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.6, now + 0.06);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  } catch (e) {}
}

// Urish ovozi
function playPunchSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  } catch (e) {}
}

// Iliq akkord (Hug / Sovg'a)
function playWarmChord() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const freqs = [329.63, 392.00, 523.25, 659.25];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;

      const start = now + i * 0.04;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.09, start + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 1.0);
    });
  } catch (e) {}
}

// Yomg'ir ovozi
let rainNode = null, rainGain = null, rainActive = false;
function toggleRain() {
  const btn = $('rainBtn');
  const ctx = getAudioContext();

  if (rainActive) {
    if (rainGain) {
      rainGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      setTimeout(() => {
        try { rainNode.disconnect(); } catch (e) {}
        rainNode = null;
      }, 350);
    }
    rainActive = false;
    btn.classList.remove('active');
    btn.textContent = "🌧️ Yomg'ir";
    return;
  }

  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
    b6 = white * 0.115926;
  }

  rainNode = ctx.createBufferSource();
  rainNode.buffer = noiseBuffer;
  rainNode.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 850;

  rainGain = ctx.createGain();
  rainGain.gain.setValueAtTime(0.01, ctx.currentTime);
  rainGain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.6);

  rainNode.connect(filter);
  filter.connect(rainGain);
  rainGain.connect(ctx.destination);
  rainNode.start();

  rainActive = true;
  btn.classList.add('active');
  btn.textContent = "🌧️ Yomg'ir (Yoniq)";
}
$('rainBtn').addEventListener('click', toggleRain);

// Lofi Ohang
let musicActive = false, musicTimer = null;
const lofiChords = [
  [261.63, 329.63, 392.00, 493.88], // Cmaj7
  [220.00, 261.63, 329.63, 392.00], // Am7
  [349.23, 440.00, 523.25, 659.25], // Fmaj7
  [196.00, 246.94, 293.66, 392.00], // G
];
let chordIndex = 0;

function playLofiChord() {
  if (!musicActive) return;
  try {
    const ctx = getAudioContext();
    const chord = lofiChords[chordIndex % lofiChords.length];
    chordIndex++;
    const now = ctx.currentTime;

    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.value = freq;

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(550, now);
      filter.frequency.linearRampToValueAtTime(1000, now + 1.0);
      filter.frequency.linearRampToValueAtTime(450, now + 3.2);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.035, now + 0.5);
      gain.gain.linearRampToValueAtTime(0.025, now + 2.0);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.03);
      osc.stop(now + 3.5);
    });
  } catch (e) {}
}

function toggleMusic() {
  const btn = $('musicBtn');
  getAudioContext();

  if (musicActive) {
    musicActive = false;
    clearInterval(musicTimer);
    musicTimer = null;
    btn.classList.remove('active');
    btn.textContent = '🎵 Musiqa';
    return;
  }

  musicActive = true;
  btn.classList.add('active');
  btn.textContent = '🎵 Musiqa (Yoniq)';
  playLofiChord();
  musicTimer = setInterval(playLofiChord, 3600);
}
$('musicBtn').addEventListener('click', toggleMusic);

/* ========================================================
   2. YENGIL KANVAS EFFEKTI (Faqat bosganda ishlaydi, 0% CPU)
======================================================== */
const fx = $('fxCanvas'), fctx = fx.getContext('2d');
function resizeCanvas() {
  fx.width = window.innerWidth;
  fx.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let burstParticles = [];
let isAnimatingFx = false;

function burst(x, y, count = 16) {
  const colors = ['#f472b6', '#fb7185', '#a78bfa', '#fbbf24', '#34d399'];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2.5 + Math.random() * 5.5;
    burstParticles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      r: 3 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1.0,
      decay: 0.025 + Math.random() * 0.02,
    });
  }

  if (!isAnimatingFx) {
    isAnimatingFx = true;
    requestAnimationFrame(renderFx);
  }
}

function renderFx() {
  fctx.clearRect(0, 0, fx.width, fx.height);
  burstParticles = burstParticles.filter(p => p.life > 0);

  for (const p of burstParticles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.12;
    p.life -= p.decay;

    fctx.save();
    fctx.beginPath();
    fctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    fctx.fillStyle = p.color;
    fctx.globalAlpha = Math.max(0, p.life);
    fctx.fill();
    fctx.restore();
  }

  if (burstParticles.length > 0) {
    requestAnimationFrame(renderFx);
  } else {
    isAnimatingFx = false;
    fctx.clearRect(0, 0, fx.width, fx.height);
  }
}

/* ========================================================
   3. VIRTUAL QUCHOQLASH (HUG)
======================================================== */
const hugBtn = $('hugBtn');
const hugMessage = $('hugMessage');

hugBtn.addEventListener('click', () => {
  const rect = hugBtn.getBoundingClientRect();
  burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 20);
  playWarmChord();

  hugMessage.classList.remove('hidden');
  hugMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

/* ========================================================
   4. ANTISTRESS POP-IT (PUFAKCHALAR)
======================================================== */
const TOTAL_BUBBLES = 24;
const grid = $('bubblesGrid');
const stressFill = $('stressFill');
const stressPercent = $('stressPercent');
const bubbleToast = $('bubbleToast');
let poppedCount = 0;

const cheerMessages = [
  "Madina, stress -10% ketdi 🫧",
  "Asablaring tinchlansin 🌿",
  "Yomon fikrlar haydaldi ✨",
  "Charchoq yo'qolmoqda 💨",
  "Madina, sen kuchlisan 💪",
  "Hamma narsa o'tib ketadi 🌸",
  "O'zingni majburlama, dam ol ☕",
  "Hozir bittagina tabassum qil 😊",
  "Madina, sen juda yoqimtoylisan 🥺",
  "Hech narsa sening tinchligingcha emas 🤍",
  "Men doim sen tomonimdaman 🤝",
  "Hammasi yaxshi bo'ladi, Madina! ✨",
];

function createBubbles() {
  grid.innerHTML = '';
  poppedCount = 0;
  updateStressProgress();
  bubbleToast.textContent = "Pufakchalarni bosing...";

  for (let i = 0; i < TOTAL_BUBBLES; i++) {
    const b = document.createElement('button');
    b.className = 'bubble';
    b.setAttribute('aria-label', 'Pufakcha');

    b.addEventListener('click', () => {
      if (b.classList.contains('popped')) return;
      b.classList.add('popped');
      poppedCount++;
      playPopSound();

      const r = b.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, 6);

      const msg = cheerMessages[Math.floor(Math.random() * cheerMessages.length)];
      bubbleToast.textContent = msg;

      updateStressProgress();

      if (poppedCount === TOTAL_BUBBLES) {
        bubbleToast.textContent = "🎉 Madina, stress 0% ga tushdi! Butunlay yengillik! 🌸";
        playWarmChord();
        burst(window.innerWidth / 2, r.top, 25);
      }
    });
    grid.appendChild(b);
  }
}

function updateStressProgress() {
  const left = Math.max(0, 100 - Math.round((poppedCount / TOTAL_BUBBLES) * 100));
  stressPercent.textContent = `${left}%`;
  stressFill.style.width = `${left}%`;
}

$('resetBubbles').addEventListener('click', () => {
  createBubbles();
});

createBubbles();

/* ========================================================
   5. NAFAS OLISH MASHQI (4-4-4 CALM BREATH)
======================================================== */
const breathCircle = $('breathCircle');
const breathText = $('breathText');
const breathTimer = $('breathTimer');
const startBreathBtn = $('startBreathBtn');

let breathActive = false;
let countdownInterval = null;

function runBreathCycle() {
  if (!breathActive) return;

  // 1. Nafas oling (4s)
  breathCircle.className = 'breath-circle inhale';
  breathText.textContent = 'Nafas oling…';
  startCountdown(4, () => {
    if (!breathActive) return;

    // 2. Ushlab turing (4s)
    breathCircle.className = 'breath-circle hold';
    breathText.textContent = 'Ushlab turing…';
    startCountdown(4, () => {
      if (!breathActive) return;

      // 3. Nafas chiqaring (4s)
      breathCircle.className = 'breath-circle exhale';
      breathText.textContent = 'Nafas chiqaring…';
      startCountdown(4, () => {
        if (!breathActive) return;

        // 4. Pauza (2s)
        breathCircle.className = 'breath-circle';
        breathText.textContent = 'Tinchlaning…';
        startCountdown(2, () => {
          if (breathActive) runBreathCycle();
        });
      });
    });
  });
}

function startCountdown(sec, onDone) {
  let count = sec;
  breathTimer.textContent = count;
  clearInterval(countdownInterval);

  countdownInterval = setInterval(() => {
    count--;
    if (count > 0) {
      breathTimer.textContent = count;
    } else {
      clearInterval(countdownInterval);
      breathTimer.textContent = '';
      if (onDone) onDone();
    }
  }, 1000);
}

startBreathBtn.addEventListener('click', () => {
  if (breathActive) {
    breathActive = false;
    clearInterval(countdownInterval);
    breathCircle.className = 'breath-circle';
    breathText.textContent = 'Tayyormisiz?';
    breathTimer.textContent = '';
    startBreathBtn.textContent = 'Mashqni boshlash 🌸';
  } else {
    breathActive = true;
    startBreathBtn.textContent = "To'xtatish ⏹️";
    runBreathCycle();
  }
});

/* ========================================================
   6. STRESSNI URISH (PUNCH THE STRESS)
======================================================== */
const punchTarget = $('punchTarget');
const punchFace = $('punchFace');
const punchCounter = $('punchCounter');
const punchReaction = $('punchReaction');

let punches = 0;
const faces = ['😤', '😠', '😡', '😵', '😵‍💫', '🥴', '🤕', '🥺', '🥰'];
const punchQuotes = [
  "Ana shunday, Madina! Ichingdagi alamni chiqar! 🥊",
  "Uff ketsin! Madinani asabiylashtirish taqiqlanadi! 💥",
  "Yana bitta! Kim xafa qildi o'zi seni?! 😤",
  "Stress chekinmoqda! Yengil tortyapsanmi? ✨",
  "Boom! Hamma muammolar qochib ketyapti! 💨",
  "Madina, sen yutding! Stress butunlay mag'lub bo'ldi! 🏆",
];

punchTarget.addEventListener('click', () => {
  punches++;
  playPunchSound();

  const r = punchTarget.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, 8);

  punchTarget.classList.add('hit');
  setTimeout(() => punchTarget.classList.remove('hit'), 140);

  punchCounter.innerHTML = `Urishlar soni: <b>${punches}</b> ta`;

  const faceIdx = Math.min(faces.length - 1, Math.floor(punches / 2));
  punchFace.textContent = faces[faceIdx];

  if (punches >= 14) {
    punchFace.textContent = '🥰';
    punchReaction.textContent = "Bo'ldi, hamma yomon kayfiyat yo'qoldi! Endi faqat tabassum va mehr qoldi 💖";
    burst(r.left + r.width / 2, r.top + r.height / 2, 20);
    playWarmChord();
  } else {
    punchReaction.textContent = punchQuotes[punches % punchQuotes.length];
  }
});

/* ========================================================
   7. G'AMXO'RLIK KAFESI (CARE CAFE)
======================================================== */
const careMenu = {
  boba: {
    emoji: '🧋',
    msg: "Madina, muzdek va shirin Boba tayyor! Bir qultum ich va xotirjam bo'l 🧋🤍",
  },
  cocoa: {
    emoji: '☕',
    msg: "Madina uchun marshmallowsli issiq kakao! Qalbingni isitsin ☕✨",
  },
  cake: {
    emoji: '🍰',
    msg: "Madina, shirin qulupnayli desert! Hayoting ham doim shunday shirin bo'lsin 🍰🍓",
  },
  choco: {
    emoji: '🍫',
    msg: "Endorfin va baxt gormoni! Butun shokolad faqat seniki, Madina 🍫💖",
  },
  bear: {
    emoji: '🧸',
    msg: "Katta yumshoq ayiqcha! Seni hech kimga xafa qildirib qo'ymaydi 🧸🫂",
  },
};

const careBtns = document.querySelectorAll('.care-btn');
const carePlate = $('carePlate');
const careServing = $('careServing');
const careMsg = $('careMsg');

careBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const itemKey = btn.getAttribute('data-item');
    const item = careMenu[itemKey];
    if (!item) return;

    playWarmChord();
    const r = btn.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 10);

    careServing.textContent = item.emoji;
    careMsg.textContent = item.msg;
    carePlate.classList.remove('hidden');
    carePlate.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
});

/* ========================================================
   8. ICHINGDAGI GAPLAR (VENT SECTION -> TELEGRAM BOT)
======================================================== */
const ventInput = $('ventInput');
const ventSendBtn = $('ventSendBtn');
const ventBtnText = $('ventBtnText');
const ventForm = $('ventForm');
const ventSuccess = $('ventSuccess');
const ventChips = document.querySelectorAll('.vent-chip');

// Chiplarni bosganda textarea ga qo'shish
ventChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const text = chip.getAttribute('data-text');
    chip.classList.toggle('selected');
    if (chip.classList.contains('selected')) {
      if (ventInput.value.trim() === '') {
        ventInput.value = text;
      } else {
        ventInput.value += ' ' + text;
      }
    }
    ventInput.focus();
  });
});

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function sendToTelegram(messageText) {
  let targetChatId = CONFIG.chatId;

  // Agar chatId ko'rsatilmagan bo'lsa, localStorage dan olamiz yoki getUpdates dan qidiramiz
  if (!targetChatId) {
    targetChatId = localStorage.getItem('tg_chat_id');
  }

  if (!targetChatId) {
    try {
      const upRes = await fetch(`https://api.telegram.org/bot${CONFIG.botToken}/getUpdates`);
      const upData = await upRes.json();
      if (upData.ok && upData.result && upData.result.length > 0) {
        for (let i = upData.result.length - 1; i >= 0; i--) {
          const item = upData.result[i];
          const chat = item.message?.chat || item.channel_post?.chat || item.my_chat_member?.chat;
          if (chat && chat.id) {
            targetChatId = chat.id;
            localStorage.setItem('tg_chat_id', targetChatId);
            break;
          }
        }
      }
    } catch (err) {
      console.warn('Telegram updates olishda xatolik:', err);
    }
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) + ', ' +
                  now.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long' });

  const textToSend = 
    `💌 <b>Madinadan yangi xabar keldi!</b>\n\n` +
    `💭 <b>Nima bo'ldi:</b>\n<i>"${escapeHtml(messageText)}"</i>\n\n` +
    `⏰ <i>Vaqt:</i> ${timeStr}\n` +
    `🤍 <i>Iltimos, unga mehr bilan yozing va qo'llab-quvvatlang!</i>`;

  // Xabarni mahalliy xotirada ham saqlab qo'yamiz (hech qachon yo'qolmasligi uchun)
  try {
    const saved = JSON.parse(localStorage.getItem('madina_messages') || '[]');
    saved.push({ text: messageText, time: timeStr });
    localStorage.setItem('madina_messages', JSON.stringify(saved));
  } catch (e) {}

  if (targetChatId) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${CONFIG.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: textToSend,
          parse_mode: 'HTML'
        })
      });
      return await res.json();
    } catch (err) {
      console.error('Telegramga yuborishda xatolik:', err);
    }
  } else {
    console.warn("DIQQAT: Bot chat_id topilmadi. Telegram botingizga /start bosing yoki CONFIG.chatId ga IDingizni yozing.");
  }
  return { ok: true };
}

ventSendBtn.addEventListener('click', async () => {
  const text = ventInput.value.trim();
  if (!text) {
    ventInput.placeholder = "Madina, avval biror narsa yozing… 🌸";
    ventInput.focus();
    return;
  }

  ventSendBtn.disabled = true;
  ventBtnText.textContent = "Yuborilmoqda… ✨";

  try {
    await sendToTelegram(text);
  } catch (e) {}

  playWarmChord();
  const r = ventSendBtn.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, 20);

  ventForm.classList.add('hidden');
  ventSuccess.classList.remove('hidden');
  ventSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

/* ========================================================
   9. TABASSUM GENERATORI (QUOTES)
======================================================== */
const quotes = [
  "Madina, sen xafa bo'lib tursang ham dunyodagi eng yoqimtoy insonsan. Lekin tabassum qilsang — butun dunyo yorishib ketadi 🌸",
  "Madina, agar bugun seni kimdir asabiylashtirgan bo'lsa, ayt — borib 'tarbiyaviy soat' o'tib kelaman 🥊😄",
  "Hatto yomg'ir ostidagi Batman ham seni ko'rib 'Madina, iltimos jilmay' deb so'ragan bo'lardi 🦇☔😄",
  "Madina, hamma narsani mukammal qilishga majbur emassan. Sen shunchaki borliging bilan ajoyibsan ✨",
  "Muammolar — bular bulutlar. Sen esa — quyoshsan, Madina. Bulutlar o'tadi, quyosh qoladi ☀️",
  "Madina, bugun o'zingga yaxshi munosabatda bo'l: shirinlik ye, sevimli narsang bilan mashg'ul bo'l, dam ol 🍵",
  "Sen xafa bo'lsang, mening ham kunim qorong'u bo'lib qoladi. Yuzingda tabassum ko'rishni xohlayman, Madina 🤍",
  "Madina, sen juda kuchlisan. Bugungi asabiylik ham o'tib ketadi, xuddi oldingilari kabi 💪",
  "Eslatma: Men doim sen tomondaman, Madina. Kim haqligidan qat'i nazar, men seni qo'llayman 🤝💖",
  "Keling, hozir hamma yomon fikrlarni derazadan uloqtirib yuboramiz! 🪟💨",
  "Madina, sening kulging — har qanday muammodan ustun 🎶✨",
  "Hech narsani o'ylama. Chuqur nafas ol. Men borman va doim yoningdaman, Madina 🤍",
];

let quoteIdx = 0;
const quoteText = $('quoteText');
const nextQuoteBtn = $('nextQuoteBtn');

nextQuoteBtn.addEventListener('click', () => {
  quoteIdx = (quoteIdx + 1) % quotes.length;
  quoteText.style.opacity = '0';

  playPopSound();
  const r = nextQuoteBtn.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, 8);

  setTimeout(() => {
    quoteText.textContent = `"${quotes[quoteIdx]}"`;
    quoteText.style.opacity = '1';
  }, 180);
});

/* ========================================================
   9. MAKTUB VA TABASSUM
======================================================== */
const smileYesBtn = $('smileYesBtn');
const smileFeedback = $('smileFeedback');

smileYesBtn.addEventListener('click', () => {
  playWarmChord();
  const r = smileYesBtn.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, 20);

  smileYesBtn.style.display = 'none';
  smileFeedback.classList.remove('hidden');
});
