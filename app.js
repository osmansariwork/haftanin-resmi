// ─── Config ───────────────────────────────────────────────────────────────────
const USERS = {
  'osman1234': 'Osman',
  'fatya1234': 'Fatya'
};

const MAX_DIM     = 1200;
const JPEG_QUALITY = 0.85;

// ─── State ────────────────────────────────────────────────────────────────────
let db;
let currentUser  = null;
let selectedFile = null;
let currentWeekKey = '';

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  if (SUPABASE_URL === 'SUPABASE_URL_BURAYA') {
    document.getElementById('app').innerHTML = `
      <div style="height:100dvh;display:flex;flex-direction:column;align-items:center;
                  justify-content:center;text-align:center;padding:2rem;gap:1rem;">
        <p style="font-size:1.1rem;font-weight:500;">⚙️ Kurulum gerekli</p>
        <p style="font-size:0.9rem;color:#7C7C7C;max-width:320px;">
          <strong>config.js</strong> dosyasına Supabase bilgilerinizi girin.
          Talimatlar için <strong>KURULUM.md</strong> dosyasını okuyun.
        </p>
      </div>`;
    return;
  }

  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  currentWeekKey = getWeekKey();

  const photos  = await fetchPhotos();
  const grouped = groupPhotos(photos);
  const weeks   = buildWeeks(grouped);

  renderApp(weeks);
  bindModal();
}

// ─── Week helpers ─────────────────────────────────────────────────────────────
function getWeekStart(d = new Date()) {
  const date = new Date(d);
  const day  = date.getDay();
  // Days since last Tuesday: Sun=5, Mon=6, Tue=0, Wed=1, Thu=2, Fri=3, Sat=4
  date.setDate(date.getDate() - ((day + 5) % 7));
  date.setHours(0, 0, 0, 0);
  return date;
}

function getWeekKey(d = new Date()) {
  const t = getWeekStart(d);
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
}

function pad(n) { return String(n).padStart(2, '0'); }

function formatDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

function daysUntilNextTuesday() {
  const day = new Date().getDay();
  return day === 2 ? 0 : (2 - day + 7) % 7;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
async function fetchPhotos() {
  const { data, error } = await db
    .from('photos')
    .select('*')
    .order('week_start', { ascending: false });

  if (error) { console.error(error); return []; }
  return data || [];
}

function groupPhotos(photos) {
  const map = {};
  for (const p of photos) {
    if (!map[p.week_start]) map[p.week_start] = { osman: null, fatya: null };
    if (p.user_name === 'Osman') map[p.week_start].osman = p;
    else if (p.user_name === 'Fatya') map[p.week_start].fatya = p;
  }
  return map;
}

function buildWeeks(grouped) {
  if (!grouped[currentWeekKey]) grouped[currentWeekKey] = { osman: null, fatya: null };

  return Object.entries(grouped)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([weekStart, data]) => ({
      weekStart,
      osman:     data.osman,
      fatya:     data.fatya,
      isCurrent: weekStart === currentWeekKey
    }));
}

// ─── Render ───────────────────────────────────────────────────────────────────
function renderApp(weeks) {
  const app = document.getElementById('app');
  app.innerHTML = weeks.map((w, i) => renderWeek(w, i, weeks.length)).join('');

  const btn = document.getElementById('upload-btn');
  if (btn) btn.addEventListener('click', openModal);
}

function renderWeek(week, idx, total) {
  const isLast = idx === total - 1;

  const header = week.isCurrent
    ? `<h1 class="site-title">Haftanın Resmi</h1>
       <p class="week-date">${formatDate(week.weekStart)}</p>`
    : `<p class="week-label">${formatDate(week.weekStart)}</p>`;

  const status = week.isCurrent ? renderStatus(week) : '';

  return `
    <section class="week-section ${week.isCurrent ? '' : 'past-week'}">
      <div class="week-inner">
        <div class="week-header">${header}</div>
        <div class="photos-row">
          ${photoCard(week.osman, 'Osman', week.isCurrent)}
          ${photoCard(week.fatya, 'Fatya', week.isCurrent)}
        </div>
        ${status}
      </div>
      ${isLast ? '' : '<div class="scroll-hint">↓</div>'}
    </section>`;
}

function photoCard(photo, name, isCurrent) {
  const inner = photo
    ? `<div class="photo-wrapper">
         <img src="${photo.image_url}" alt="${name}'ın fotoğrafı" loading="lazy">
       </div>`
    : `<div class="photo-placeholder">
         <p>${isCurrent ? 'Henüz eklenmedi' : 'Eklenmedi'}</p>
       </div>`;

  return `<div class="photo-card">
    <p class="photo-name">${name}</p>
    ${inner}
  </div>`;
}

function renderStatus(week) {
  const days      = daysUntilNextTuesday();
  const isTuesday = days === 0;
  const bothDone  = week.osman && week.fatya;

  const countdownText = isTuesday
    ? null
    : days === 1
      ? 'Yeni resim günü yarın başlıyor'
      : `Yeni resim günü ${days} gün sonra başlıyor`;

  let html = '<div class="week-status">';

  if (isTuesday) html += `<p class="status-tuesday">Bugün resim günü!</p>`;

  if (bothDone) {
    html += `<p class="status-done">Bu haftanın resimleri tamamlandı ✓</p>`;
  } else {
    html += `<p class="status-info">Bu haftanın resmini ekleyebilirsiniz</p>
             <button class="btn-upload" id="upload-btn">Resim Ekle</button>`;
  }

  if (countdownText) html += `<p class="status-next">${countdownText}</p>`;

  html += '</div>';
  return html;
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function bindModal() {
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target.id === 'modal-overlay') closeModal();
  });

  document.getElementById('password-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('password-confirm').click();
  });

  document.getElementById('password-confirm').addEventListener('click', onPasswordConfirm);

  document.getElementById('file-input').addEventListener('change', onFileChange);

  document.getElementById('upload-confirm').addEventListener('click', onUploadConfirm);
}

function openModal() {
  currentUser  = null;
  selectedFile = null;

  document.getElementById('password-input').value = '';
  document.getElementById('password-error').classList.add('hidden');

  resetFileStep();
  showStep('step-password');
  document.getElementById('modal-overlay').classList.remove('hidden');

  setTimeout(() => document.getElementById('password-input').focus(), 80);
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

function showStep(id) {
  ['step-password', 'step-file', 'step-loading', 'step-success'].forEach(s => {
    document.getElementById(s).classList.toggle('hidden', s !== id);
  });
}

async function onPasswordConfirm() {
  const val  = document.getElementById('password-input').value.trim();
  const user = USERS[val];

  if (!user) {
    document.getElementById('password-error').classList.remove('hidden');
    document.getElementById('password-input').focus();
    return;
  }

  document.getElementById('password-error').classList.add('hidden');
  currentUser = user;

  // Daha önce bu hafta yükledi mi?
  const { data } = await db
    .from('photos')
    .select('id')
    .eq('week_start', currentWeekKey)
    .eq('user_name', currentUser)
    .maybeSingle();

  showStep('step-file');
  document.getElementById('upload-user-label').textContent =
    `${currentUser} olarak ekliyorsunuz`;

  const fileErr = document.getElementById('file-error');
  if (data) {
    fileErr.textContent = 'Bu hafta zaten bir resim eklediniz.';
    fileErr.classList.remove('hidden');
    document.getElementById('upload-confirm').disabled = true;
  } else {
    fileErr.classList.add('hidden');
    document.getElementById('upload-confirm').disabled = true;
  }
}

function onFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  selectedFile = file;

  const reader = new FileReader();
  reader.onload = ev => {
    const prev = document.getElementById('preview-img');
    prev.src = ev.target.result;
    prev.classList.remove('hidden');
    document.getElementById('file-placeholder').style.visibility = 'hidden';
  };
  reader.readAsDataURL(file);

  document.getElementById('upload-confirm').disabled = false;
}

async function onUploadConfirm() {
  if (!selectedFile || !currentUser) return;

  showStep('step-loading');

  try {
    await doUpload(selectedFile, currentUser, currentWeekKey);
    showStep('step-success');
    setTimeout(async () => {
      closeModal();
      const photos  = await fetchPhotos();
      const grouped = groupPhotos(photos);
      const weeks   = buildWeeks(grouped);
      renderApp(weeks);
      // upload-btn listener is set in renderApp
    }, 1600);
  } catch (err) {
    console.error('Yükleme hatası:', err);
    showStep('step-file');
    const fileErr = document.getElementById('file-error');
    fileErr.textContent = 'Bir hata oluştu, tekrar deneyin.';
    fileErr.classList.remove('hidden');
  }
}

function resetFileStep() {
  document.getElementById('file-input').value = '';
  document.getElementById('preview-img').classList.add('hidden');
  document.getElementById('file-placeholder').style.visibility = '';
  document.getElementById('file-error').classList.add('hidden');
  document.getElementById('upload-confirm').disabled = true;
  selectedFile = null;
}

// ─── Upload ───────────────────────────────────────────────────────────────────
async function compress(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let { width: w, height: h } = img;
        if (w > MAX_DIM || h > MAX_DIM) {
          if (w >= h) { h = Math.round(h * MAX_DIM / w); w = MAX_DIM; }
          else        { w = Math.round(w * MAX_DIM / h); h = MAX_DIM; }
        }
        const canvas = document.createElement('canvas');
        canvas.width  = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function doUpload(file, userName, weekStart) {
  const blob     = await compress(file);
  const fileName = `${weekStart}/${userName.toLowerCase()}_${Date.now()}.jpg`;

  const { error: storErr } = await db.storage
    .from('photos')
    .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });
  if (storErr) throw storErr;

  const { data: { publicUrl } } = db.storage
    .from('photos')
    .getPublicUrl(fileName);

  const { error: dbErr } = await db
    .from('photos')
    .insert({ week_start: weekStart, user_name: userName, image_url: publicUrl });
  if (dbErr) throw dbErr;
}

// ─── Start ────────────────────────────────────────────────────────────────────
init();
