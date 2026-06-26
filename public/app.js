// ============================================================
// PRONOSTICS FIFA 2026 — Application Logic
// Injected by PronosticsApp.tsx via script tag
// ============================================================
(function() {
'use strict';

const FLAG_CODES = {
  'Mexique':'mx','Afrique du Sud':'za','Corée du Sud':'kr','Tchéquie':'cz',
  'Canada':'ca','Bosnie-Herzégovine':'ba','Qatar':'qa','Suisse':'ch',
  'Brésil':'br','Maroc':'ma','Haïti':'ht','Écosse':'gb-sct',
  'États-Unis':'us','Paraguay':'py','Australie':'au','Turquie':'tr',
  'Allemagne':'de','Curaçao':'cw',"Côte d'Ivoire":'ci','Équateur':'ec',
  'Pays-Bas':'nl','Japon':'jp','Suède':'se','Tunisie':'tn',
  'Belgique':'be','Égypte':'eg','Iran':'ir','Nouvelle-Zélande':'nz',
  'Espagne':'es','Cap-Vert':'cv','Arabie Saoudite':'sa','Uruguay':'uy',
  'France':'fr','Sénégal':'sn','Irak':'iq','Norvège':'no',
  'Argentine':'ar','Algérie':'dz','Autriche':'at','Jordanie':'jo',
  'Portugal':'pt','RD Congo':'cd','Ouzbékistan':'uz','Colombie':'co',
  'Angleterre':'gb-eng','Croatie':'hr','Ghana':'gh','Panama':'pa'
};

function flagUrl(teamName) {
  const code = FLAG_CODES[teamName];
  if (!code) return null;
  return 'https://flagcdn.com/24x18/' + code + '.png';
}

function flagHTML(teamName, emoji) {
  const url = flagUrl(teamName);
  if (url) {
    return '<img class="flag-img" src="' + url + '" alt="' + teamName +
      '" onerror="this.style.display=\'none\';this.nextSibling.style.display=\'inline\'"/>' +
      '<span class="flag-text" style="display:none">' + (emoji || '') + '</span>';
  }
  return '<span class="flag-text">' + (emoji || '🏳️') + '</span>';
}

const GROUPS = {
  A:{teams:[{name:'Mexique',flag:''},{name:'Afrique du Sud',flag:''},{name:'Corée du Sud',flag:''},{name:'Tchéquie',flag:''}]},
  B:{teams:[{name:'Canada',flag:''},{name:'Bosnie-Herzégovine',flag:''},{name:'Qatar',flag:''},{name:'Suisse',flag:''}]},
  C:{teams:[{name:'Brésil',flag:''},{name:'Maroc',flag:''},{name:'Haïti',flag:''},{name:'Écosse',flag:''}]},
  D:{teams:[{name:'États-Unis',flag:''},{name:'Paraguay',flag:''},{name:'Australie',flag:''},{name:'Turquie',flag:''}]},
  E:{teams:[{name:'Allemagne',flag:''},{name:'Curaçao',flag:''},{name:"Côte d'Ivoire",flag:''},{name:'Équateur',flag:''}]},
  F:{teams:[{name:'Pays-Bas',flag:''},{name:'Japon',flag:''},{name:'Suède',flag:''},{name:'Tunisie',flag:''}]},
  G:{teams:[{name:'Belgique',flag:''},{name:'Égypte',flag:''},{name:'Iran',flag:''},{name:'Nouvelle-Zélande',flag:''}]},
  H:{teams:[{name:'Espagne',flag:''},{name:'Cap-Vert',flag:''},{name:'Arabie Saoudite',flag:''},{name:'Uruguay',flag:''}]},
  I:{teams:[{name:'France',flag:''},{name:'Sénégal',flag:''},{name:'Irak',flag:''},{name:'Norvège',flag:''}]},
  J:{teams:[{name:'Argentine',flag:''},{name:'Algérie',flag:''},{name:'Autriche',flag:''},{name:'Jordanie',flag:''}]},
  K:{teams:[{name:'Portugal',flag:''},{name:'RD Congo',flag:''},{name:'Ouzbékistan',flag:''},{name:'Colombie',flag:''}]},
  L:{teams:[{name:'Angleterre',flag:''},{name:'Croatie',flag:''},{name:'Ghana',flag:''},{name:'Panama',flag:''}]}
};

function getGroupMatches(g) {
  const base = new Date('2026-06-11');
  const startDays = {A:0,B:0,C:1,D:1,E:2,F:2,G:3,H:3,I:4,J:4,K:5,L:5};
  const s = startDays[g] || 0;
  const d = [s,s,s+4,s+4,s+8,s+8].map(n => {
    const dt = new Date(base); dt.setDate(base.getDate()+n);
    return dt.toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
  });
  return [
    {home:0,away:1,date:d[0]},{home:2,away:3,date:d[1]},
    {home:0,away:2,date:d[2]},{home:1,away:3,date:d[3]},
    {home:0,away:3,date:d[4]},{home:1,away:2,date:d[5]}
  ];
}

// ============================================================
// ÉTAT
// ============================================================
let profiles = {};
let currentProfile = 'real';
let currentGroupTab = 'A';
let currentStandingsGroup = 'A';
let activeTab = 'groups';
let r16ManualMode = false;

function defaultProfile() {
  return {name:'',groupScores:{},koScores:{},topScorer:'',poulesLocked:false,knockoutLocked:false,buteurLocked:false};
}

// ============================================================
// STOCKAGE
// ============================================================
function saveAll() {
  try { localStorage.setItem('wc2026v2_profiles', JSON.stringify(profiles)); } catch(e) {}
  try { localStorage.setItem('wc2026v2_current', currentProfile); } catch(e) {}
  try { localStorage.setItem('wc2026_r16manual', r16ManualMode ? '1' : '0'); } catch(e) {}
}

function loadAll() {
  try { const raw = localStorage.getItem('wc2026v2_profiles'); if (raw) profiles = JSON.parse(raw); } catch(e) { profiles = {}; }
  try { currentProfile = localStorage.getItem('wc2026v2_current') || 'real'; } catch(e) {}
  try { r16ManualMode = localStorage.getItem('wc2026_r16manual') === '1'; } catch(e) {}

  if (!profiles['real']) {
    profiles['real'] = {...defaultProfile(), name:'📋 Résultats Réels'};
  } else {
    profiles['real'].name = '📋 Résultats Réels';
    ['poulesLocked','knockoutLocked','buteurLocked'].forEach(k => {
      if (profiles['real'][k] === undefined) profiles['real'][k] = false;
    });
  }

  const BRACKET_VERSION = 'fifa2026_v2_ij-kl-vs-3rd';
  const bv = localStorage.getItem('wc2026_bracket_version');
  if (!profiles['ia']) {
    profiles['ia'] = {...defaultProfile(), name:'🤖 Résultat IA', ...getAIPredictions()};
  } else {
    profiles['ia'].name = '🤖 Résultat IA';
    ['poulesLocked','knockoutLocked','buteurLocked'].forEach(k => {
      if (profiles['ia'][k] === undefined) profiles['ia'][k] = false;
    });
    if (!profiles['ia'].groupScores || Object.keys(profiles['ia'].groupScores).length === 0) {
      Object.assign(profiles['ia'], getAIPredictions());
    }
    if (bv !== BRACKET_VERSION) {
      const fresh = getAIPredictions();
      profiles['ia'].koScores = fresh.koScores;
    }
  }
  if (bv !== BRACKET_VERSION) localStorage.setItem('wc2026_bracket_version', BRACKET_VERSION);

  Object.keys(profiles).forEach(k => {
    const p = profiles[k];
    if (p.poulesLocked === undefined) p.poulesLocked = false;
    if (p.knockoutLocked === undefined) p.knockoutLocked = false;
    if (p.buteurLocked === undefined) p.buteurLocked = false;
  });

  // Clean ghost TAB winners
  Object.keys(profiles).forEach(pKey => {
    const p = profiles[pKey];
    if (p && p.koScores) {
      Object.keys(p.koScores).forEach(matchId => {
        const sc = p.koScores[matchId];
        if (sc && sc.h !== '' && sc.a !== '' && sc.h !== undefined && sc.a !== undefined) {
          const h = parseInt(sc.h, 10), a = parseInt(sc.a, 10);
          if (h !== a && sc.winner !== null) p.koScores[matchId].winner = null;
        }
      });
    }
  });

  if (!profiles[currentProfile]) currentProfile = 'real';

  // If a logged-in user pseudo is provided, create/select their profile
  const _pseudo = window._APP_PSEUDO || '';
  if (_pseudo && _pseudo !== '' && _pseudo !== 'real' && _pseudo !== 'ia') {
    const existingKey = Object.keys(profiles).find(k =>
      profiles[k].name && profiles[k].name.replace(/^\S+\s/, '') === _pseudo
    );
    if (!existingKey) {
      const newKey = 'p_' + _pseudo.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
      profiles[newKey] = {...defaultProfile(), name:'😎 ' + _pseudo};
      currentProfile = newKey;
    } else {
      currentProfile = existingKey;
    }
    saveAll();
  }
}

// ============================================================
// PRÉDICTIONS IA
// ============================================================
function getAIPredictions() {
  const gs = {};
  const predictions = {
    A:[[2,0],[1,1],[3,0],[1,0],[4,0],[2,0]], B:[[2,1],[0,0],[2,0],[2,0],[3,0],[1,0]],
    C:[[3,0],[1,1],[2,0],[2,0],[4,0],[2,1]], D:[[2,1],[1,1],[2,0],[2,0],[3,0],[1,0]],
    E:[[3,0],[1,1],[2,0],[2,0],[4,1],[2,0]], F:[[2,1],[1,1],[2,0],[2,0],[3,0],[2,1]],
    G:[[2,1],[1,1],[2,0],[2,0],[3,0],[2,0]], H:[[3,0],[1,1],[2,0],[2,0],[3,0],[2,1]],
    I:[[2,1],[1,1],[3,0],[1,0],[4,0],[2,0]], J:[[2,0],[1,1],[2,1],[2,0],[3,0],[2,0]],
    K:[[2,1],[1,1],[2,0],[2,0],[3,0],[1,0]], L:[[2,1],[1,1],[2,0],[2,0],[3,1],[1,0]],
  };
  Object.keys(predictions).forEach(g => {
    gs[g] = {};
    predictions[g].forEach(([h,a],i) => { gs[g][i] = {h,a}; });
  });
  const koScores = {
    r16_0:{h:2,a:1},r16_1:{h:2,a:0},r16_2:{h:2,a:1},r16_3:{h:1,a:0},
    r16_4:{h:2,a:1},r16_5:{h:2,a:0},r16_6:{h:2,a:1},r16_7:{h:1,a:0},
    r16_8:{h:2,a:1},r16_9:{h:2,a:0},r16_10:{h:2,a:1},r16_11:{h:1,a:0},
    r16_12:{h:3,a:1},r16_13:{h:2,a:0},r16_14:{h:2,a:1},r16_15:{h:2,a:0},
    r8_0:{h:2,a:1},r8_1:{h:2,a:0},r8_2:{h:2,a:1},r8_3:{h:1,a:0},
    r8_4:{h:2,a:1},r8_5:{h:2,a:0},r8_6:{h:1,a:0},r8_7:{h:2,a:1},
    r4_0:{h:2,a:1},r4_1:{h:1,a:0},r4_2:{h:2,a:1},r4_3:{h:1,a:0},
    r2_0:{h:2,a:1},r2_1:{h:2,a:0},
    final:{h:2,a:1},third_place:{h:2,a:1},
  };
  return {groupScores:gs, koScores, topScorer:'Kylian Mbappé'};
}

// ============================================================
// UI — PROFILE
// ============================================================
function updateProfileUI() {
  const sel = document.getElementById('profileSelect');
  if (!sel) return;
  sel.innerHTML = '';
  const order = ['real', 'ia', ...Object.keys(profiles).filter(k => k !== 'real' && k !== 'ia')];
  order.forEach(k => {
    if (!profiles[k]) return;
    const opt = document.createElement('option');
    opt.value = k; opt.textContent = profiles[k].name || k;
    if (k === currentProfile) opt.selected = true;
    sel.appendChild(opt);
  });
  const badge = document.getElementById('profileBadge');
  if (badge) badge.textContent = profiles[currentProfile]?.name || '';
  updateNavLockIcons();
}

function updateNavLockIcons() {
  const p = profiles[currentProfile];
  if (!p) return;
  const pL = p.poulesLocked ? ' 🔒' : '';
  const kL = p.knockoutLocked ? ' 🔒' : '';
  const bL = p.buteurLocked ? ' 🔒' : '';
  const allL = p.poulesLocked && p.knockoutLocked && p.buteurLocked;
  const lbL = (currentProfile === 'real' && allL) ? ' 🔒' : '';
  const set = (cls, txt) => { const el = document.querySelector(cls); if (el) el.textContent = txt; };
  set('.nav-text-groups', 'Matchs de Poules' + pL);
  set('.nav-text-standings', 'Classement' + pL);
  set('.nav-text-knockout', 'Phase Finale' + kL);
  set('.nav-text-bracket', 'Arborescence' + kL);
  set('.nav-text-bonus', 'Bonus' + bL);
  set('.nav-text-leaderboard', 'Classement Général' + lbL);
}

let selectedEmoji = '😎';
window.selectEmoji = function(e, btn) {
  selectedEmoji = e;
  document.querySelectorAll('#emojiPicker .emoji-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
};

window.openModal = function() {
  selectedEmoji = '😎';
  document.querySelectorAll('#emojiPicker .emoji-btn').forEach((b,i) => b.classList.toggle('active', i === 0));
  document.getElementById('newProfileName').value = '';
  document.getElementById('modalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('newProfileName').focus(), 100);
};
window.closeModal = function() { document.getElementById('modalOverlay').classList.remove('open'); };
document.getElementById('modalOverlay').addEventListener('click', function(e) { if (e.target === this) window.closeModal(); });

window.createProfile = function() {
  const nameRaw = document.getElementById('newProfileName').value.trim();
  const name = nameRaw || 'Joueur';
  const key = 'p_' + Date.now();
  profiles[key] = {...defaultProfile(), name: selectedEmoji + ' ' + name};
  currentProfile = key; saveAll(); updateProfileUI(); window.closeModal(); renderCurrentTab();
};

window.switchProfile = function(key) { currentProfile = key; saveAll(); updateProfileUI(); renderCurrentTab(); };

window.openDelModal = function() {
  if (currentProfile === 'real' || currentProfile === 'ia') return;
  document.getElementById('modalDelOverlay').classList.add('open');
};
window.closeDelModal = function() { document.getElementById('modalDelOverlay').classList.remove('open'); };
document.getElementById('modalDelOverlay').addEventListener('click', function(e) { if (e.target === this) window.closeDelModal(); });

window.confirmDeleteProfile = function() {
  if (currentProfile === 'real' || currentProfile === 'ia') { window.closeDelModal(); return; }
  delete profiles[currentProfile]; currentProfile = 'real';
  saveAll(); updateProfileUI(); window.closeDelModal(); renderCurrentTab();
};

let _confirmCallback = null, _confirmCallback2 = null;
window.openConfirmModal = function(title, msg, btnLabel, btnColor, cb, btn2Label, btn2Color, cb2) {
  document.getElementById('modalConfirmTitle').textContent = title;
  document.getElementById('modalConfirmMsg').textContent = msg;
  const btn = document.getElementById('modalConfirmBtn');
  btn.textContent = btnLabel; btn.style.background = btnColor || 'var(--gold)';
  btn.style.color = (btnColor && (btnColor.includes('FF4757') || btnColor.includes('red'))) ? '#fff' : '#000';
  _confirmCallback = cb;
  const btn2 = document.getElementById('modalConfirmBtn2');
  if (btn2Label) {
    btn2.textContent = btn2Label; btn2.style.background = btn2Color || '#8B5CF6';
    btn2.style.color = '#fff'; btn2.style.display = '';
    _confirmCallback2 = cb2;
  } else { btn2.style.display = 'none'; _confirmCallback2 = null; }
  document.getElementById('modalConfirmOverlay').classList.add('open');
};
window.closeConfirmModal = function() {
  document.getElementById('modalConfirmOverlay').classList.remove('open');
  _confirmCallback = null; _confirmCallback2 = null;
};
document.getElementById('modalConfirmOverlay').addEventListener('click', function(e) { if (e.target === this) window.closeConfirmModal(); });
document.getElementById('modalConfirmBtn').addEventListener('click', function() { if (_confirmCallback) _confirmCallback(); window.closeConfirmModal(); });
document.getElementById('modalConfirmBtn2').addEventListener('click', function() { if (_confirmCallback2) _confirmCallback2(); window.closeConfirmModal(); });

window.openImportDataModal = function() { document.getElementById('modalImportDataOverlay').classList.add('open'); };
window.closeImportDataModal = function() { document.getElementById('modalImportDataOverlay').classList.remove('open'); };
document.getElementById('modalImportDataOverlay').addEventListener('click', function(e) { if (e.target === this) window.closeImportDataModal(); });

// ============================================================
// SCORES
// ============================================================
function getScore(group, matchIdx) {
  const p = profiles[currentProfile];
  if (!p.groupScores) p.groupScores = {};
  return p.groupScores[group]?.[matchIdx] || {h:'',a:''};
}

window.saveGroupScore = function(group, matchIdx, side, val) {
  const p = profiles[currentProfile];
  if (p.poulesLocked) return;
  if (!p.groupScores) p.groupScores = {};
  if (!p.groupScores[group]) p.groupScores[group] = {};
  if (!p.groupScores[group][matchIdx]) p.groupScores[group][matchIdx] = {h:'',a:''};
  const num = val === '' ? '' : parseInt(val, 10);
  p.groupScores[group][matchIdx][side] = (val === '' || isNaN(num)) ? '' : Math.max(0, num);
  saveAll();
  const _sy = window.scrollY;
  if (activeTab === 'standings') renderStandings(currentStandingsGroup);
  if (activeTab === 'bracket') renderBracket();
  if (activeTab === 'leaderboard') renderLeaderboard();
  updateBonusStats();
  requestAnimationFrame(() => window.scrollTo(0, _sy));
};

function getKOScore(matchId) {
  const p = profiles[currentProfile];
  if (!p.koScores) p.koScores = {};
  return p.koScores[matchId] || {h:'',a:'',winner:null};
}

window.saveKOScore = function(matchId, field, val) {
  const p = profiles[currentProfile];
  if (!p || p.knockoutLocked) return;
  if (!p.koScores) p.koScores = {};
  if (!p.koScores[matchId]) p.koScores[matchId] = {h:'',a:'',winner:null};
  if (field === 'winner') {
    p.koScores[matchId].winner = val;
  } else {
    p.koScores[matchId][field] = val;
    const sc = p.koScores[matchId];
    const h = parseInt(sc.h, 10), a = parseInt(sc.a, 10);
    if (!isNaN(h) && !isNaN(a) && sc.h !== '' && sc.a !== '' && h !== a) p.koScores[matchId].winner = null;
  }
  saveAll();
  const _sy = window.scrollY;
  renderCurrentTab();
  requestAnimationFrame(() => window.scrollTo(0, _sy));
};

window.saveTopScorer = function() {
  const p = profiles[currentProfile];
  if (p.buteurLocked) return;
  p.topScorer = document.getElementById('topScorerInput').value;
  saveAll();
};

// ============================================================
// GÉNÉRATION ALÉATOIRE
// ============================================================
window.generateRandomPredictions = function() {
  const p = profiles[currentProfile];
  if (p.poulesLocked) { alert('Les scores de poules sont verrouillés.'); return; }
  let unfilled = 0;
  Object.keys(GROUPS).forEach(g => {
    getGroupMatches(g).forEach((_, mi) => {
      const sc = p.groupScores?.[g]?.[mi];
      if (!sc || sc.h === '' || sc.a === '') unfilled++;
    });
  });
  const outcomesClose = [[2,1],[1,1],[1,0],[1,2],[0,0],[2,0],[0,1],[3,2],[2,2],[3,3],[2,1]];
  const outcomesMedium = [[2,0],[1,0],[3,0],[2,1],[1,1],[3,1],[0,0],[2,0],[3,2],[4,1]];
  const outcomesWide = [[3,0],[2,0],[4,0],[3,1],[2,0],[1,0],[3,0],[4,1],[5,0],[2,1]];
  function _doGenerate(onlyEmpty) {
    if (!p.groupScores) p.groupScores = {};
    Object.keys(GROUPS).forEach(g => {
      if (!p.groupScores[g]) p.groupScores[g] = {};
      const matchDefs = [{h:0,a:1},{h:2,a:3},{h:0,a:2},{h:1,a:3},{h:0,a:3},{h:1,a:2}];
      matchDefs.forEach((md, mi) => {
        const existing = p.groupScores[g][mi];
        if (onlyEmpty && existing && existing.h !== '' && existing.a !== '') return;
        const diff = Math.abs(md.h - md.a);
        const arr = diff === 1 ? outcomesClose : diff === 2 ? outcomesMedium : outcomesWide;
        const [h, a] = arr[Math.floor(Math.random() * arr.length)];
        p.groupScores[g][mi] = {h, a};
      });
    });
    saveAll(); renderCurrentTab(); updateBonusStats();
    if (activeTab === 'settings') renderSettings();
  }
  window.openConfirmModal('🎲 Générer les scores (Phase de poule)', 'Il reste ' + unfilled + ' match(s) non rempli(s) sur 72.',
    '🔄 Régénérer tout', 'var(--gold)', () => _doGenerate(false),
    '✨ Générer si vide', '#8B5CF6', () => _doGenerate(true));
};

window.generateKOScores = function() {
  const p = profiles[currentProfile];
  if (p.knockoutLocked) { alert('La phase finale est verrouillée.'); return; }
  let unfilled = 0;
  const koIds = [];
  for (let i = 0; i < 16; i++) koIds.push('r16_' + i);
  for (let i = 0; i < 8; i++) koIds.push('r8_' + i);
  for (let i = 0; i < 4; i++) koIds.push('r4_' + i);
  for (let i = 0; i < 2; i++) koIds.push('r2_' + i);
  koIds.push('final', 'third_place');
  koIds.forEach(id => { const sc = p.koScores?.[id]; if (!sc || sc.h === '' || sc.a === '') unfilled++; });
  const koOutcomes = [[2,1],[2,0],[1,0],[3,1],[2,1],[1,0],[3,0],[2,0],[1,0],[2,1],[0,0],[1,1],[3,2],[2,2],[4,1]];
  function _doGenKO(onlyEmpty) {
    if (!p.koScores) p.koScores = {};
    koIds.forEach(id => {
      const existing = p.koScores[id];
      if (onlyEmpty && existing && existing.h !== '' && existing.a !== '') return;
      const [h, a] = koOutcomes[Math.floor(Math.random() * koOutcomes.length)];
      p.koScores[id] = {h, a, winner: h > a ? 'h' : a > h ? 'a' : (Math.random() > 0.5 ? 'h' : 'a')};
    });
    saveAll(); renderCurrentTab(); updateBonusStats();
    if (activeTab === 'settings') renderSettings();
  }
  window.openConfirmModal('🎲 Générer les scores (Phase finale)', 'Il reste ' + unfilled + ' match(s) KO non rempli(s).',
    '🔄 Régénérer tout', 'var(--gold)', () => _doGenKO(false),
    '✨ Générer si vide', '#8B5CF6', () => _doGenKO(true));
};

window.generateTopScorer = function() {
  const p = profiles[currentProfile];
  if (p.buteurLocked) { alert('Le meilleur buteur est verrouillé.'); return; }
  const attackers = ['Kylian Mbappé','Lionel Messi','Erling Haaland','Vinicius Jr','Harry Kane',
    'Lamine Yamal','Mikel Oyarzabal','Jamal Musiala','Jude Bellingham','Kai Havertz',
    'Deniz Undav','Ousmane Dembélé','Folarin Balogun','Jonathan David','Julian Alvarez',
    'Matheus Cunha','Lautaro Martínez','Cristiano Ronaldo','Ayase Ueda','Mohamed Salah','Romelu Lukaku'];
  function _doGenScorer(onlyEmpty) {
    const current = p.topScorer || '';
    if (onlyEmpty && current.trim() !== '') return;
    p.topScorer = attackers[Math.floor(Math.random() * attackers.length)];
    saveAll();
    if (activeTab === 'bonus') renderBonus();
    if (activeTab === 'settings') renderSettings();
  }
  window.openConfirmModal('🎲 Générer le meilleur buteur', 'Pronostic actuel : "' + (p.topScorer || 'aucun') + '".',
    '🔄 Régénérer', 'var(--gold)', () => _doGenScorer(false),
    '✨ Générer si vide', '#8B5CF6', () => _doGenScorer(true));
};

// ============================================================
// VERROUS
// ============================================================
function countMissingGroupMatches() {
  let miss = 0;
  Object.keys(GROUPS).forEach(g => {
    for (let mi = 0; mi < 6; mi++) {
      const sc = profiles[currentProfile].groupScores?.[g]?.[mi];
      if (!sc || sc.h === '' || sc.a === '') miss++;
    }
  });
  return miss;
}

function countMissingKOMatches() {
  const p = profiles[currentProfile];
  const ids = [];
  for (let i = 0; i < 16; i++) ids.push('r16_' + i);
  for (let i = 0; i < 8; i++) ids.push('r8_' + i);
  for (let i = 0; i < 4; i++) ids.push('r4_' + i);
  for (let i = 0; i < 2; i++) ids.push('r2_' + i);
  ids.push('final', 'third_place');
  let miss = 0;
  ids.forEach(id => { const sc = p.koScores?.[id]; if (!sc || sc.h === '' || sc.a === '') miss++; });
  return miss;
}

window.lockPoules = function() {
  const p = profiles[currentProfile]; if (p.poulesLocked) return;
  const m = countMissingGroupMatches();
  if (m > 0) { window.openConfirmModal('🔒 Verrouillage impossible', 'Il manque ' + m + ' match(s).', 'Compris', 'var(--blue)', () => {}); return; }
  window.openConfirmModal('🔒 Verrouiller les scores (Poules)', 'Action irréversible.', 'Verrouiller', 'var(--red)', () => {
    profiles[currentProfile].poulesLocked = true; saveAll(); updateNavLockIcons(); renderCurrentTab();
    if (activeTab === 'settings') renderSettings();
  });
};

window.lockKnockout = function() {
  const p = profiles[currentProfile]; if (p.knockoutLocked) return;
  const m = countMissingKOMatches();
  if (m > 0) { window.openConfirmModal('🔒 Verrouillage impossible', 'Il manque ' + m + ' match(s) KO.', 'Compris', 'var(--blue)', () => {}); return; }
  window.openConfirmModal('🔒 Verrouiller les scores (Phase Finale)', 'Action irréversible.', 'Verrouiller', 'var(--red)', () => {
    profiles[currentProfile].knockoutLocked = true; saveAll(); updateNavLockIcons(); renderCurrentTab();
    if (activeTab === 'settings') renderSettings();
  });
};

window.lockButeur = function() {
  const p = profiles[currentProfile]; if (p.buteurLocked) return;
  const filled = !!(p.topScorer && p.topScorer.trim());
  if (!filled) { window.openConfirmModal('🔒 Verrouillage impossible', 'Aucun nom renseigné.', 'Compris', 'var(--blue)', () => {}); return; }
  window.openConfirmModal('🔒 Verrouiller le Meilleur Buteur', 'Action irréversible.', 'Verrouiller', 'var(--red)', () => {
    profiles[currentProfile].buteurLocked = true; saveAll(); updateNavLockIcons(); renderCurrentTab();
    if (activeTab === 'settings') renderSettings();
  });
};

window.resetProfileScores = function() {
  const p = profiles[currentProfile];
  const willReset = [];
  if (!p.poulesLocked) willReset.push('scores de poule');
  if (!p.knockoutLocked) willReset.push('phase finale');
  if (!p.buteurLocked) willReset.push('meilleur buteur');
  if (willReset.length === 0) { alert('Tout est verrouillé.'); return; }
  window.openConfirmModal('🔄 Réinitialiser les scores', 'Ceci va effacer : ' + willReset.join(', ') + '.', '🔄 Réinitialiser', 'var(--red)', () => {
    if (!p.poulesLocked) p.groupScores = {};
    if (!p.knockoutLocked) p.koScores = {};
    if (!p.buteurLocked) p.topScorer = null;
    saveAll(); renderCurrentTab(); updateBonusStats();
    if (activeTab === 'settings') renderSettings();
  });
};

// ============================================================
// EXPORT / IMPORT
// ============================================================
window.exportJSON = function() {
  const data = {exportVersion:'wc2026v1', profiles, currentProfile};
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = 'pronostics_' + (profiles[currentProfile]?.name || 'export').replace(/[^a-zA-Z0-9]/g, '_') + '_' + Date.now() + '.json';
  a.click(); URL.revokeObjectURL(url);
};

window.exportCompetitionJSON = function() {
  const exportedProfiles = JSON.parse(JSON.stringify(profiles));
  const isFromReal = currentProfile === 'real';
  if (!isFromReal) {
    Object.keys(exportedProfiles).forEach(k => {
      if (k === currentProfile || k === 'real') return;
      exportedProfiles[k].poulesLocked = true; exportedProfiles[k].knockoutLocked = true; exportedProfiles[k].buteurLocked = true;
    });
  }
  const data = {exportVersion:'wc2026v1', exportType:'competition', exportedBy:currentProfile, profiles:exportedProfiles, currentProfile};
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  const safeName = isFromReal ? '' : '_' + (profiles[currentProfile]?.name || currentProfile).replace(/[^a-zA-Z0-9]/g, '_');
  a.download = 'wc2026_competition' + safeName + '_' + Date.now() + '.json';
  a.click(); URL.revokeObjectURL(url);
};

window.exportBracketPDF = function() { window.print(); };

window.handleImportFile = function(evt) {
  const file = evt.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.profiles) { alert('Fichier JSON invalide.'); return; }
      Object.entries(data.profiles).forEach(([k, importedP]) => {
        if (k === 'real' || k === 'ia') return;
        profiles[k] = {...defaultProfile(), ...importedP};
      });
      saveAll(); updateProfileUI(); renderCurrentTab();
      alert('✅ Import réussi !');
    } catch(err) { alert('Erreur: ' + err.message); }
    evt.target.value = '';
  };
  reader.readAsText(file);
};

window.handleImportProfileFile = function(evt) {
  const file = evt.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.exportVersion || !data.profiles) { alert('❌ Fichier non reconnu.'); evt.target.value = ''; return; }
      const candidates = Object.entries(data.profiles).filter(([k]) => k !== 'real' && k !== 'ia');
      if (candidates.length === 0) { alert('❌ Aucun profil personnel.'); evt.target.value = ''; return; }
      let imported = 0;
      const existingNames = new Set(Object.values(profiles).map(p => p.name || '').filter(Boolean));
      candidates.forEach(([k, profData]) => {
        const importedName = profData.name || '';
        if (importedName && existingNames.has(importedName)) return;
        let targetKey = profiles[k] ? k + '_' + Date.now() : k;
        profiles[targetKey] = {...defaultProfile(), ...profData};
        existingNames.add(importedName);
        imported++;
      });
      if (imported > 0) { saveAll(); updateProfileUI(); renderCurrentTab(); }
      alert('✅ ' + imported + ' profil(s) importé(s).');
    } catch(err) { alert('❌ Erreur: ' + err.message); }
    evt.target.value = '';
  };
  reader.readAsText(file);
};

window.handleImportCompetitionFile = function(evt) {
  const file = evt.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.exportVersion || !data.profiles) { alert('❌ Fichier non reconnu.'); evt.target.value = ''; return; }
      const profileCount = Object.keys(data.profiles).length;
      window.openConfirmModal('🏆 Importer une compétition', 'Ceci remplace toutes vos données (' + profileCount + ' profil(s)). Irréversible.', '🏆 Remplacer', 'var(--red)', () => {
        profiles = {};
        Object.entries(data.profiles).forEach(([k, v]) => { profiles[k] = {...defaultProfile(), ...v}; });
        currentProfile = data.currentProfile && profiles[data.currentProfile] ? data.currentProfile : (Object.keys(profiles)[0] || 'real');
        saveAll(); updateProfileUI(); renderCurrentTab();
        setTimeout(() => alert('✅ Compétition importée !'), 100);
      });
    } catch(err) { alert('❌ Erreur: ' + err.message); }
    evt.target.value = '';
  };
  reader.readAsText(file);
};

// ============================================================
// CLASSEMENTS DE GROUPE
// ============================================================
function getAllStandings() {
  const all = {};
  Object.keys(GROUPS).forEach(g => {
    const teams = GROUPS[g].teams.map((t,i) => ({...t,idx:i,mp:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,pts:0}));
    getGroupMatches(g).forEach((m, mi) => {
      const sc = profiles[currentProfile].groupScores?.[g]?.[mi];
      if (!sc || sc.h === '' || sc.a === '' || sc.h === undefined) return;
      const h = parseInt(sc.h,10), a = parseInt(sc.a,10);
      if (isNaN(h) || isNaN(a)) return;
      const th = teams[m.home], ta = teams[m.away];
      th.mp++; ta.mp++; th.gf += h; th.ga += a; ta.gf += a; ta.ga += h;
      th.gd = th.gf - th.ga; ta.gd = ta.gf - ta.ga;
      if (h > a) { th.w++; th.pts += 3; ta.l++; }
      else if (h < a) { ta.w++; ta.pts += 3; th.l++; }
      else { th.d++; ta.d++; th.pts++; ta.pts++; }
    });
    teams.sort((a,b) => b.pts-a.pts || b.gd-a.gd || b.gf-a.gf);
    all[g] = teams;
  });
  return all;
}

function getBest3rds(allStandings) {
  const thirds = Object.entries(allStandings).map(([g,teams]) => {
    const t = teams[2]; return t ? {...t, group:g} : null;
  }).filter(Boolean);
  thirds.sort((a,b) => b.pts-a.pts || b.gd-a.gd || b.gf-a.gf);
  return thirds.slice(0, 8);
}

function getQualifiedTeams(profileKey) {
  const pk = profileKey || currentProfile;
  const savedProfile = currentProfile;
  currentProfile = pk;
  const allS = getAllStandings();
  const qualified = {};
  Object.keys(GROUPS).forEach(g => {
    const t = allS[g];
    qualified['1'+g] = {...t[0], slot:'1'+g};
    qualified['2'+g] = {...t[1], slot:'2'+g};
    if (t[2]) qualified['3'+g] = {...t[2], slot:'3'+g};
  });
  const best3 = getBest3rds(allS);
  best3.forEach((t,i) => { qualified['3best'+(i+1)] = {...t, slot:'3best'+(i+1)}; });
  currentProfile = savedProfile;
  return qualified;
}

// ============================================================
// MODE MANUEL 1/16
// ============================================================
window.toggleR16Mode = function() {
  r16ManualMode = !r16ManualMode; saveAll(); renderCurrentTab();
  if (activeTab === 'settings') renderSettings();
};

function renderAnnexCInfo() {
  const cont = document.getElementById('annexCInfo');
  if (!cont) return;
  cont.innerHTML = '';
}

function renderR16ManualSelectors() {
  const cont = document.getElementById('manualR16Content');
  if (!cont) return;
  if (!r16ManualMode) { cont.innerHTML = ''; return; }
  cont.innerHTML = '<div style="font-size:.8rem;color:var(--text2);margin-bottom:12px">Mode Manuel activé — Choisissez librement les oppositions du 1/16 de finale.</div>';
}

// ============================================================
// R32 PAIRS
// ============================================================
function computeR32Pairs(qualified) {
  function q(slot) { return qualified[slot] || {name:slot, flag:'❓'}; }
  return [
    {h:q('1I'), a:q('3best1')}, {h:q('1A'), a:q('2B')}, {h:q('1B'), a:q('2A')},
    {h:q('1J'), a:q('3best2')}, {h:q('1D'), a:q('2C')}, {h:q('1K'), a:q('3best3')},
    {h:q('1L'), a:q('3best4')}, {h:q('1G'), a:q('2H')}, {h:q('1E'), a:q('2F')},
    {h:q('1F'), a:q('2E')},    {h:q('1A'), a:q('3best5')}, {h:q('1B'), a:q('3best6')},
    {h:q('1H'), a:q('3best7')}, {h:q('1C'), a:q('2D')}, {h:q('1D'), a:q('3best8')},
    {h:q('1E'), a:q('3best1')}
  ];
}

function buildKOTree(profileKey) {
  const pk = profileKey || currentProfile;
  const qualified = getQualifiedTeams(pk);
  const p = profiles[pk];

  function scoreOf(matchId) { return p?.koScores?.[matchId] || {h:'',a:'',winner:null}; }
  function getWinner(matchId, teamH, teamA) {
    const sc = scoreOf(matchId);
    const h = parseInt(sc.h,10), a = parseInt(sc.a,10);
    if (isNaN(h) || isNaN(a) || sc.h === '' || sc.a === '') return null;
    if (h > a) return teamH; if (h < a) return teamA;
    if (sc.winner === 'h') return teamH; if (sc.winner === 'a') return teamA;
    return null;
  }

  const rounds = {};
  const r16MatchPairs = computeR32Pairs(qualified);
  rounds.r16 = r16MatchPairs.map((pair, i) => {
    const id = 'r16_' + i;
    return {id, teamH:pair.h, teamA:pair.a, sc:scoreOf(id), winner:getWinner(id, pair.h, pair.a)};
  });

  const r16pairs_ko = [[0,1],[2,3],[4,5],[6,7],[8,9],[10,11],[12,13],[14,15]];
  rounds.r8 = r16pairs_ko.map(([hIdx,aIdx], i) => {
    const id = 'r8_' + i;
    const teamH = rounds.r16[hIdx]?.winner || {name:'V M'+(73+hIdx), flag:'❓'};
    const teamA = rounds.r16[aIdx]?.winner || {name:'V M'+(73+aIdx), flag:'❓'};
    return {id, teamH, teamA, sc:scoreOf(id), winner:getWinner(id, teamH, teamA)};
  });

  const qf_pairs = [[0,1],[2,3],[4,5],[6,7]];
  rounds.r4 = qf_pairs.map(([hIdx,aIdx], i) => {
    const id = 'r4_' + i;
    const teamH = rounds.r8[hIdx]?.winner || {name:'V 1/8-'+(hIdx+1), flag:'❓'};
    const teamA = rounds.r8[aIdx]?.winner || {name:'V 1/8-'+(aIdx+1), flag:'❓'};
    return {id, teamH, teamA, sc:scoreOf(id), winner:getWinner(id, teamH, teamA)};
  });

  rounds.r2 = Array.from({length:2}, (_, i) => {
    const id = 'r2_' + i;
    const teamH = rounds.r4[i*2]?.winner || {name:'V QF'+(i*2+1), flag:'❓'};
    const teamA = rounds.r4[i*2+1]?.winner || {name:'V QF'+(i*2+2), flag:'❓'};
    return {id, teamH, teamA, sc:scoreOf(id), winner:getWinner(id, teamH, teamA)};
  });

  const fid = 'final';
  const fH = rounds.r2[0]?.winner || {name:'Finaliste 1', flag:'❓'};
  const fA = rounds.r2[1]?.winner || {name:'Finaliste 2', flag:'❓'};
  const fSc = scoreOf(fid);
  rounds.final = [{id:fid, teamH:fH, teamA:fA, sc:fSc, winner:getWinner(fid, fH, fA)}];

  function getLoser(match, idx) {
    if (!match || !match.winner) return {name:'Perdant SF'+(idx+1), flag:'❓'};
    return match.winner.name === match.teamH.name ? match.teamA : match.teamH;
  }
  const tpH = getLoser(rounds.r2[0], 0), tpA = getLoser(rounds.r2[1], 1);
  const tpSc = scoreOf('third_place');
  rounds.third_place = [{id:'third_place', teamH:tpH, teamA:tpA, sc:tpSc, winner:getWinner('third_place', tpH, tpA)}];

  return rounds;
}

// ============================================================
// SYSTÈME DE POINTS
// ============================================================
function computeTotalGoals(pk) {
  const p = profiles[pk];
  let total = 0;
  Object.keys(GROUPS).forEach(g => {
    getGroupMatches(g).forEach((_, mi) => {
      const sc = p?.groupScores?.[g]?.[mi];
      if (sc && sc.h !== '' && sc.a !== '' && sc.h !== undefined) total += parseInt(sc.h||0,10) + parseInt(sc.a||0,10);
    });
  });
  ['r16','r8','r4','r2','final','third_place'].forEach(round => {
    const n = {r16:16,r8:8,r4:4,r2:2,final:1,third_place:1}[round];
    for (let i = 0; i < n; i++) {
      const id = (round === 'final' || round === 'third_place') ? round : round + '_' + i;
      const sc = p?.koScores?.[id];
      if (sc && sc.h !== '' && sc.a !== '' && sc.h !== undefined) total += parseInt(sc.h||0,10) + parseInt(sc.a||0,10);
    }
  });
  return total;
}

function computePoints(profileKey) {
  const REF_KEY = 'real';
  if (profileKey === REF_KEY) return {total:0, breakdown:{group:0,ko:0,bonus:0,goals:0}};
  const ref = profiles[REF_KEY], p = profiles[profileKey];
  if (!ref || !p) return {total:0, breakdown:{group:0,ko:0,bonus:0,goals:0}};
  let pts = 0;
  const bd = {group:0, ko:0, bonus:0, goals:0};

  Object.keys(GROUPS).forEach(g => {
    getGroupMatches(g).forEach((_, mi) => {
      const rsc = ref.groupScores?.[g]?.[mi], psc = p.groupScores?.[g]?.[mi];
      if (!rsc || rsc.h === '' || rsc.a === '' || rsc.h === undefined) return;
      if (!psc || psc.h === '' || psc.a === '' || psc.h === undefined) return;
      const rh = parseInt(rsc.h,10), ra = parseInt(rsc.a,10), ph = parseInt(psc.h,10), pa = parseInt(psc.a,10);
      if (isNaN(rh)||isNaN(ra)||isNaN(ph)||isNaN(pa)) return;
      const rRes = rh>ra?'h':rh<ra?'a':'d', pRes = ph>pa?'h':ph<pa?'a':'d';
      if (rRes === pRes) { pts+=1; bd.group+=1; if (rh===ph && ra===pa) { pts+=2; bd.group+=2; } }
    });
  });

  const refRounds = buildKOTree(REF_KEY), pRounds = buildKOTree(profileKey);
  const koRoundPts = {r16:1,r8:2,r4:4,r2:8,third_place:8,final:12};
  function isRealTeam(name) {
    if (!name) return false;
    return !name.startsWith('V ') && !name.startsWith('Finalist') && !name.startsWith('1') &&
           !name.startsWith('2') && !name.startsWith('3best') && !name.startsWith('Perdant') &&
           !/^\d/.test(name) && name !== '❓' && !name.includes('?');
  }

  Object.entries(koRoundPts).forEach(([round, rPts]) => {
    const refMatches = refRounds[round] || [], pMatches = pRounds[round] || [];
    const realTeamsAtRound = new Set();
    refMatches.forEach(rm => {
      if (isRealTeam(rm.teamH?.name)) realTeamsAtRound.add(rm.teamH.name);
      if (isRealTeam(rm.teamA?.name)) realTeamsAtRound.add(rm.teamA.name);
    });
    if (realTeamsAtRound.size === 0) return;
    const usedMatchIndexes = new Set(), rewardedTeamsX2 = new Set();
    pMatches.forEach((pm, pIdx) => {
      const pId = (round === 'final' || round === 'third_place') ? round : round + '_' + pIdx;
      const pTH = pm.teamH?.name, pTA = pm.teamA?.name;
      if (!isRealTeam(pTH) || !isRealTeam(pTA)) return;
      const pSc = p.koScores?.[pId];
      if (!pSc || pSc.h === '' || pSc.a === '' || pSc.h === undefined) return;
      const ph = parseInt(pSc.h,10), pa = parseInt(pSc.a,10);
      if (isNaN(ph) || isNaN(pa)) return;
      const matchRefIndex = refMatches.findIndex((rm, rIdx) => {
        if (usedMatchIndexes.has(rIdx)) return false;
        const rId = (round === 'final' || round === 'third_place') ? round : round + '_' + rIdx;
        const rSc = ref.koScores?.[rId];
        if (!rSc || rSc.h === '' || rSc.a === '' || rSc.h === undefined) return false;
        const rh = parseInt(rSc.h,10), ra = parseInt(rSc.a,10);
        if (isNaN(rh) || isNaN(ra)) return false;
        const rTH = rm.teamH?.name, rTA = rm.teamA?.name;
        if (pTH === rTH && pTA === rTA) return ph === rh && pa === ra;
        if (pTH === rTA && pTA === rTH) return ph === ra && pa === rh;
        return false;
      });
      if (matchRefIndex !== -1) {
        usedMatchIndexes.add(matchRefIndex);
        const pointsAffiche = (rPts + rPts) * 2;
        pts += pointsAffiche; bd.ko += pointsAffiche;
        rewardedTeamsX2.add(pTH); rewardedTeamsX2.add(pTA);
      }
    });
    pMatches.forEach(pm => {
      const pTH = pm.teamH?.name, pTA = pm.teamA?.name;
      if (isRealTeam(pTH) && realTeamsAtRound.has(pTH) && !rewardedTeamsX2.has(pTH)) { pts += rPts; bd.ko += rPts; rewardedTeamsX2.add(pTH); }
      if (isRealTeam(pTA) && realTeamsAtRound.has(pTA) && !rewardedTeamsX2.has(pTA)) { pts += rPts; bd.ko += rPts; rewardedTeamsX2.add(pTA); }
    });
  });

  const refChamp = refRounds.final?.[0]?.winner?.name, pChamp = pRounds.final?.[0]?.winner?.name;
  if (refChamp && pChamp && refChamp === pChamp) { pts += 30; bd.bonus += 30; }
  const refScorer = (ref.topScorer || '').toLowerCase().trim(), pScorer = (p.topScorer || '').toLowerCase().trim();
  if (refScorer && pScorer && refScorer === pScorer) { pts += 10; bd.bonus += 10; }
  bd.goals = computeTotalGoals(profileKey);
  return {total:pts, breakdown:bd};
}

// ============================================================
// RENDU
// ============================================================
function renderGroupTabs(containerId, onClick, active) {
  const c = document.getElementById(containerId);
  if (!c) return;
  c.innerHTML = '';
  Object.keys(GROUPS).forEach(g => {
    const btn = document.createElement('button');
    btn.className = 'group-tab' + (g === active ? ' active' : '');
    btn.textContent = 'Groupe ' + g;
    btn.onclick = () => onClick(g);
    c.appendChild(btn);
  });
}

function renderGroupMatches(group) {
  currentGroupTab = group;
  renderGroupTabs('groupTabs', g => renderGroupMatches(g), group);
  const title = document.getElementById('groupMatchesTitle');
  if (title) title.textContent = '🏟️ Groupe ' + group;
  const container = document.getElementById('groupMatchesList');
  if (!container) return;
  const teams = GROUPS[group].teams;
  const matches = getGroupMatches(group);
  container.innerHTML = '';
  const p = profiles[currentProfile];
  const isLocked = p.poulesLocked;
  matches.forEach((m, mi) => {
    const sc = getScore(group, mi);
    const hF = sc.h !== '' && sc.h !== undefined;
    const aF = sc.a !== '' && sc.a !== undefined;
    const row = document.createElement('div');
    row.className = 'match-row';
    row.innerHTML =
      '<div class="match-team">' + flagHTML(teams[m.home].name, teams[m.home].flag) +
      '<span class="team-name">' + teams[m.home].name + '</span></div>' +
      '<div style="display:flex;flex-direction:column;align-items:center;gap:4px">' +
        '<div class="score-input-group">' +
          '<input class="score-input' + (hF ? ' filled' : '') + '" type="number" min="0" value="' + (hF ? sc.h : '') + '" placeholder="–" ' + (isLocked ? 'disabled' : '') +
          ' oninput="saveGroupScore(\'' + group + '\',' + mi + ',\'h\',this.value);this.classList.toggle(\'filled\',this.value!==\'\')" />' +
          '<span class="score-sep">:</span>' +
          '<input class="score-input' + (aF ? ' filled' : '') + '" type="number" min="0" value="' + (aF ? sc.a : '') + '" placeholder="–" ' + (isLocked ? 'disabled' : '') +
          ' oninput="saveGroupScore(\'' + group + '\',' + mi + ',\'a\',this.value);this.classList.toggle(\'filled\',this.value!==\'\')" />' +
        '</div>' +
      '</div>' +
      '<div class="match-team right"><span class="team-name">' + teams[m.away].name + '</span>' + flagHTML(teams[m.away].name, teams[m.away].flag) + '</div>';
    container.appendChild(row);
  });
}

function renderStandings(group) {
  currentStandingsGroup = group;
  renderGroupTabs('standingsGroupTabs', g => renderStandings(g), group);
  const allS = getAllStandings();
  const best3Groups = getBest3rds(allS).map(t => t.group);
  const stats = allS[group];
  const cont = document.getElementById('standingsContent');
  if (!cont) return;
  let html = '<table class="standings-table"><thead><tr><th></th><th>Équipe</th><th>MJ</th><th>G</th><th>N</th><th>P</th><th>BP</th><th>BC</th><th>DB</th><th>Pts</th></tr></thead><tbody>';
  stats.forEach((t, i) => {
    const isQ3 = i === 2 && best3Groups.includes(group);
    const posClass = i===0?'q1':i===1?'q2':isQ3?'q3':'out';
    const posLabel = i===0?'1':i===1?'2':i===2?(isQ3?'3*':'3'):'4';
    html += '<tr><td><div class="pos-badge ' + posClass + '">' + posLabel + '</div></td>' +
      '<td><div class="team-cell">' + flagHTML(t.name, t.flag) + ' ' + t.name + '</div></td>' +
      '<td>' + t.mp + '</td><td>' + t.w + '</td><td>' + t.d + '</td><td>' + t.l + '</td>' +
      '<td>' + t.gf + '</td><td>' + t.ga + '</td><td>' + (t.gd>0?'+':'') + t.gd + '</td>' +
      '<td><strong>' + t.pts + '</strong></td></tr>';
  });
  html += '</tbody></table><div style="margin-top:12px;font-size:.75rem;color:var(--text3)">' +
    '<span class="tag tag-green">■</span> 1er &nbsp;<span class="tag tag-blue">■</span> 2ème &nbsp;' +
    '<span class="tag tag-gold">■ *</span> Meilleur 3ème &nbsp;<span class="tag tag-red">■</span> Éliminé</div>';
  cont.innerHTML = html;
}

function renderKnockout() {
  renderAnnexCInfo();
  renderR16ManualSelectors();
  const rounds = buildKOTree();
  const cont = document.getElementById('knockoutContent');
  if (!cont) return;
  cont.innerHTML = '';
  const p = profiles[currentProfile];
  const isLocked = p.knockoutLocked;
  const defs = [
    {key:'r16',label:'1/16 de Finale',pts:'+1 pt/équipe'},
    {key:'r8',label:'1/8 de Finale',pts:'+2 pts/équipe'},
    {key:'r4',label:'Quarts de Finale',pts:'+4 pts/équipe'},
    {key:'r2',label:'Demi-Finales',pts:'+8 pts/équipe'},
    {key:'third_place',label:'🥉 Petite Finale (3e place)',pts:'+8 pts/équipe'},
    {key:'final',label:'🏆 Finale',pts:'+12 pts/équipe'}
  ];
  defs.forEach(({key, label, pts}) => {
    const matches = rounds[key];
    if (!matches) return;
    const header = document.createElement('div');
    header.className = 'ko-round-header';
    header.innerHTML = '<div class="ko-divider"></div><h3>' + label + '</h3><span class="tag tag-gold">' + pts + '</span><div class="ko-divider"></div>';
    cont.appendChild(header);
    const grid = document.createElement('div');
    grid.className = 'ko-matches-grid';
    matches.forEach(m => {
      const hS = m.sc.h !== '' && m.sc.h !== undefined ? m.sc.h : '';
      const aS = m.sc.a !== '' && m.sc.a !== undefined ? m.sc.a : '';
      const isDraw = hS !== '' && aS !== '' && parseInt(hS,10) === parseInt(aS,10);
      const card = document.createElement('div');
      card.className = 'ko-match-card';
      card.innerHTML =
        '<div class="ko-teams">' +
          '<div class="ko-team">' + flagHTML(m.teamH.name, m.teamH.flag) +
            '<span style="max-width:100px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + m.teamH.name + '</span></div>' +
          '<div class="ko-score-grp">' +
            '<input class="score-input' + (hS!==''?' filled':'') + '" style="width:40px;height:40px" type="number" min="0" value="' + hS + '" placeholder="–" ' + (isLocked?'disabled':'') +
            ' oninput="saveKOScore(\'' + m.id + '\',\'h\',this.value)" />' +
            '<span class="score-sep">–</span>' +
            '<input class="score-input' + (aS!==''?' filled':'') + '" style="width:40px;height:40px" type="number" min="0" value="' + aS + '" placeholder="–" ' + (isLocked?'disabled':'') +
            ' oninput="saveKOScore(\'' + m.id + '\',\'a\',this.value)" />' +
          '</div>' +
          '<div class="ko-team right"><span style="max-width:100px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:right">' + m.teamA.name + '</span>' +
            flagHTML(m.teamA.name, m.teamA.flag) + '</div>' +
        '</div>' +
        (isDraw ?
          '<div class="ko-winner-row"><span>Vainqueur TAB :</span><div style="display:flex;gap:6px">' +
            '<button class="btn-winner' + (m.sc.winner==='h'?' selected-left':'') + '" ' + (isLocked?'disabled':'') +
            ' onclick="saveKOScore(\'' + m.id + '\',\'winner\',\'h\')">' + m.teamH.name + '</button>' +
            '<button class="btn-winner' + (m.sc.winner==='a'?' selected-right':'') + '" ' + (isLocked?'disabled':'') +
            ' onclick="saveKOScore(\'' + m.id + '\',\'winner\',\'a\')">' + m.teamA.name + '</button>' +
          '</div></div>' : '') +
        (m.winner ? '<div style="font-size:.75rem;color:var(--green);margin-top:2px">✅ ' + m.winner.name + ' se qualifie</div>' : '');
      grid.appendChild(card);
    });
    cont.appendChild(grid);
  });
}

function renderBracket() {
  const rounds = buildKOTree();
  const cont = document.getElementById('bracketViz');
  if (!cont) return;
  cont.innerHTML = '';
  const H = 600, CW = 154, CONN = 30, FINAL_W = 168, CH = 52, HDR = 32;
  const r16 = rounds.r16, r8 = rounds.r8, r4 = rounds.r4, r2 = rounds.r2;
  const leftCols = [
    {key:'r32',label:'1/16',color:'#4A9EFF',n:8,items:[r16[1],r16[4],r16[0],r16[2],r16[10],r16[11],r16[8],r16[9]]},
    {key:'r16',label:'1/8',color:'#00D4AA',n:4,items:[r8[0],r8[1],r8[4],r8[5]]},
    {key:'qf',label:'QF',color:'#f7850a',n:2,items:[r4[0],r4[1]]},
    {key:'sf',label:'SF',color:'#C77DFF',n:1,items:[r2[0]]}
  ];
  const rightCols = [
    {key:'sf',label:'SF',color:'#C77DFF',n:1,items:[r2[1]]},
    {key:'qf',label:'QF',color:'#f7850a',n:2,items:[r4[2],r4[3]]},
    {key:'r16',label:'1/8',color:'#00D4AA',n:4,items:[r8[2],r8[3],r8[6],r8[7]]},
    {key:'r32',label:'1/16',color:'#4A9EFF',n:8,items:[r16[3],r16[5],r16[6],r16[7],r16[13],r16[15],r16[12],r16[14]]}
  ];
  function cy(i, n) { return ((2*i+1) / (2*n)) * H; }
  function matchCard(m) {
    if (!m) m = {};
    const sc = m.sc || {};
    const hS = (sc.h !== '' && sc.h !== undefined) ? sc.h : '';
    const aS = (sc.a !== '' && sc.a !== undefined) ? sc.a : '';
    const hW = m.winner && m.winner.name === m.teamH?.name;
    const aW = m.winner && m.winner.name === m.teamA?.name;
    const div = document.createElement('div');
    div.className = 'bk-match'; div.style.height = CH + 'px';
    function row(team, score, isW) {
      const r = document.createElement('div');
      r.className = 'bk-team' + (isW ? ' bk-win' : '');
      r.style.height = (CH/2) + 'px';
      r.innerHTML = flagHTML(team?.name||'?', team?.flag||'') +
        '<span class="bk-team-name">' + (team?.name||'?') + '</span>' +
        '<span class="bk-sc">' + score + '</span>';
      return r;
    }
    div.appendChild(row(m.teamH, hS, hW));
    div.appendChild(row(m.teamA, aS, aW));
    return div;
  }
  function buildCol(col) {
    const wrap = document.createElement('div');
    wrap.className = 'bk-col'; wrap.style.width = CW + 'px';
    const hdr = document.createElement('div'); hdr.className = 'bk-hdr';
    hdr.style.cssText = 'color:'+col.color+';background:'+col.color+'14;border:1px solid '+col.color+'44;';
    hdr.textContent = col.label; wrap.appendChild(hdr);
    const slots = document.createElement('div'); slots.className = 'bk-slots'; slots.style.height = H + 'px';
    col.items.forEach(m => slots.appendChild(matchCard(m)));
    wrap.appendChild(slots); return wrap;
  }
  function buildConnector(fromN, toN, color, side) {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', CONN); svg.setAttribute('height', H+HDR);
    svg.style.cssText = 'display:block;flex-shrink:0;';
    for (let p = 0; p < toN; p++) {
      const topI = p*2, botI = p*2+1;
      const y0 = cy(topI, fromN), y1 = cy(botI, fromN), yMid = cy(p, toN);
      const xA = side === 'left' ? 0 : CONN, xB = side === 'left' ? CONN : 0, xM = CONN/2;
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', ['M',xA,y0,'H',xM,'V',y1,'M',xA,y1,'H',xM,'M',xM,yMid,'H',xB].join(' '));
      path.setAttribute('fill', 'none'); path.setAttribute('stroke', color+'55');
      path.setAttribute('stroke-width', '1.5'); path.setAttribute('stroke-linecap', 'round');
      svg.appendChild(path);
    }
    return svg;
  }
  const scroll = document.createElement('div'); scroll.className = 'bracket-scroll';
  const main = document.createElement('div'); main.className = 'bracket-main';
  scroll.appendChild(main); cont.appendChild(scroll);
  leftCols.forEach((col, ci) => {
    main.appendChild(buildCol(col));
    if (ci < leftCols.length-1) {
      const svg = buildConnector(col.n, leftCols[ci+1].n, col.color, 'left');
      const wrap = document.createElement('div'); wrap.style.cssText = 'display:flex;flex-direction:column;';
      const sp = document.createElement('div'); sp.style.height = HDR+'px'; wrap.appendChild(sp);
      const sw = document.createElement('div'); sw.style.height = H+'px'; sw.appendChild(svg); wrap.appendChild(sw);
      main.appendChild(wrap);
    }
  });
  // Center connector left -> final
  {
    const svg = buildConnector(1, 1, '#C77DFF', 'left');
    svg.innerHTML = '';
    const svgNS = 'http://www.w3.org/2000/svg';
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', 'M0,' + cy(0,1) + ' H' + CONN);
    path.setAttribute('fill', 'none'); path.setAttribute('stroke', '#C77DFF55'); path.setAttribute('stroke-width', '1.5');
    svg.appendChild(path);
    const wrap = document.createElement('div'); wrap.style.cssText = 'display:flex;flex-direction:column;';
    const sp = document.createElement('div'); sp.style.height = HDR+'px'; wrap.appendChild(sp);
    const sw = document.createElement('div'); sw.style.height = H+'px'; sw.appendChild(svg); wrap.appendChild(sw);
    main.appendChild(wrap);
  }
  // Final column
  {
    const fm = rounds.final[0] || {};
    const colWrap = document.createElement('div'); colWrap.className = 'bk-col'; colWrap.style.width = FINAL_W+'px';
    const hdr = document.createElement('div'); hdr.className = 'bk-final-hdr'; hdr.style.width = '100%'; hdr.textContent = '🥇🥉 FINALES';
    colWrap.appendChild(hdr);
    const slots = document.createElement('div'); slots.className = 'bk-slots'; slots.style.height = H+'px';
    const card = matchCard(fm); card.style.width = FINAL_W+'px'; card.style.border = '1px solid rgba(240,180,41,.4)';
    slots.appendChild(card); colWrap.appendChild(slots);
    const tp = rounds.third_place?.[0];
    if (tp) {
      const tpCard = matchCard(tp);
      tpCard.style.position = 'absolute'; tpCard.style.left = '0'; tpCard.style.width = FINAL_W+'px';
      tpCard.style.top = (HDR + Math.round(H/2) + 45) + 'px'; tpCard.style.border = '1px solid rgba(255,71,87,.35)';
      colWrap.style.position = 'relative'; colWrap.appendChild(tpCard);
    }
    main.appendChild(colWrap);
  }
  // Center connector final -> right
  {
    const svg = buildConnector(1, 1, '#C77DFF', 'right');
    svg.innerHTML = '';
    const svgNS = 'http://www.w3.org/2000/svg';
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', 'M'+CONN+','+cy(0,1)+' H0');
    path.setAttribute('fill', 'none'); path.setAttribute('stroke', '#C77DFF55'); path.setAttribute('stroke-width', '1.5');
    svg.appendChild(path);
    const wrap = document.createElement('div'); wrap.style.cssText = 'display:flex;flex-direction:column;';
    const sp = document.createElement('div'); sp.style.height = HDR+'px'; wrap.appendChild(sp);
    const sw = document.createElement('div'); sw.style.height = H+'px'; sw.appendChild(svg); wrap.appendChild(sw);
    main.appendChild(wrap);
  }
  rightCols.forEach((col, ci) => {
    main.appendChild(buildCol(col));
    if (ci < rightCols.length-1) {
      const fromN = rightCols[ci+1].n, toN = col.n;
      const svg = buildConnector(fromN, toN, rightCols[ci+1].color, 'right');
      const wrap = document.createElement('div'); wrap.style.cssText = 'display:flex;flex-direction:column;';
      const sp = document.createElement('div'); sp.style.height = HDR+'px'; wrap.appendChild(sp);
      const sw = document.createElement('div'); sw.style.height = H+'px'; sw.appendChild(svg); wrap.appendChild(sw);
      main.appendChild(wrap);
    }
  });
}

function renderBonus() {
  const p = profiles[currentProfile]; const isLocked = p.buteurLocked;
  const banner = document.getElementById('buteurLockBanner');
  if (banner) banner.innerHTML = isLocked ? '<div class="lock-banner">🔒 Sélection verrouillée — Le meilleur buteur ne peut plus être modifié.</div>' : '';
  const input = document.getElementById('topScorerInput');
  if (input) { input.value = p?.topScorer || ''; input.disabled = isLocked; }
  updateBonusStats();
}

function updateBonusStats() {
  const p = profiles[currentProfile];
  let totalGoals = 0, totalMatches = 0;
  Object.keys(GROUPS).forEach(g => {
    getGroupMatches(g).forEach((_, mi) => {
      const sc = p?.groupScores?.[g]?.[mi];
      if (sc && sc.h !== '' && sc.a !== '' && sc.h !== undefined) { totalGoals += parseInt(sc.h,10)+parseInt(sc.a,10); totalMatches++; }
    });
  });
  ['r16','r8','r4','r2','final','third_place'].forEach(round => {
    const n = {r16:16,r8:8,r4:4,r2:2,final:1,third_place:1}[round];
    for (let i = 0; i < n; i++) {
      const id = (round==='final'||round==='third_place') ? round : round+'_'+i;
      const sc = p?.koScores?.[id];
      if (sc && sc.h !== '' && sc.a !== '' && sc.h !== undefined) { totalGoals += parseInt(sc.h||0,10)+parseInt(sc.a||0,10); totalMatches++; }
    }
  });
  const rounds = buildKOTree(); const champion = rounds.final?.[0]?.winner;
  const bs = document.getElementById('bonusStats');
  if (!bs) return;
  bs.innerHTML =
    '<div class="stat-card"><div class="stat-value">' + totalGoals + '</div><div class="stat-label">Buts pronostiqués</div></div>' +
    '<div class="stat-card"><div class="stat-value">' + totalMatches + '</div><div class="stat-label">Matchs remplis</div></div>' +
    '<div class="stat-card"><div class="stat-value" style="font-size:1.1rem">' + (champion ? champion.name : '—') + '</div><div class="stat-label">Champion pronostiqué</div></div>' +
    '<div class="stat-card"><div class="stat-value" style="font-size:1rem">' + (p?.topScorer || '—') + '</div><div class="stat-label">Meilleur buteur prévu</div></div>';
}

function renderLeaderboard() {
  const cont = document.getElementById('leaderboardContent');
  if (!cont) return;
  const scores = Object.entries(profiles).filter(([k]) => k !== 'real').map(([k, v]) => {
    const r = computePoints(k);
    return {key:k, name:v.name, ...r};
  }).sort((a, b) => b.total - a.total);
  if (scores.length === 0) {
    cont.innerHTML = '<div class="empty-state"><div class="big">🏆</div>Créez des profils pour voir le classement</div>';
    return;
  }
  cont.innerHTML = scores.map((s, i) => {
    const rankClass = i===0?'r1':i===1?'r2':i===2?'r3':'';
    const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':'';
    return '<div class="lb-row">' +
      '<div class="lb-rank ' + rankClass + '">' + (medal || i+1) + '</div>' +
      '<div class="lb-name">' + s.name + '</div>' +
      '<div class="lb-breakdown">' +
        '<div>Groupes : <strong>' + s.breakdown.group + '</strong> pts</div>' +
        '<div>Phase finale : <strong>' + s.breakdown.ko + '</strong> pts</div>' +
        '<div>Bonus : <strong>' + s.breakdown.bonus + '</strong> pts</div>' +
      '</div>' +
      '<div class="lb-pts">' + s.total + '<span>pts</span></div>' +
    '</div>';
  }).join('');
}

let _settingsEmoji = '😎';
window.settingsSelectEmoji = function(e, btn) {
  _settingsEmoji = e;
  const cont = document.getElementById('settingsContent');
  if (cont) cont.querySelectorAll('#settingsEmojiPicker .emoji-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  applyProfileNameChange();
};

window.applyProfileNameChange = function() {
  if (currentProfile === 'real' || currentProfile === 'ia') return;
  const nameInput = document.getElementById('settingsProfileName');
  if (!nameInput) return;
  const rawName = nameInput.value.trim() || 'Joueur';
  profiles[currentProfile].name = _settingsEmoji + ' ' + rawName;
  saveAll();
  const badge = document.getElementById('profileBadge');
  if (badge) badge.textContent = profiles[currentProfile].name;
  const sel = document.getElementById('profileSelect');
  for (let i = 0; i < sel.options.length; i++) {
    if (sel.options[i].value === currentProfile) { sel.options[i].textContent = profiles[currentProfile].name; break; }
  }
};

function renderSettings() {
  const cont = document.getElementById('settingsContent');
  if (!cont) return;
  const p = profiles[currentProfile];
  const isReal = currentProfile === 'real', isIA = currentProfile === 'ia';
  const isSystem = isReal || isIA;
  const profileName = p ? p.name : '';
  const nameNoEmoji = profileName.replace(/^\S+\s/, '');
  const poulesLocked = p ? !!p.poulesLocked : false;
  const knockoutLocked = p ? !!p.knockoutLocked : false;
  const buteurLocked = p ? !!p.buteurLocked : false;
  let missingPoules = 0;
  if (p && !poulesLocked) {
    Object.keys(GROUPS).forEach(g => {
      for (let mi = 0; mi < 6; mi++) { const sc = p.groupScores?.[g]?.[mi]; if (!sc || sc.h === '' || sc.a === '') missingPoules++; }
    });
  }
  let missingKO = 0;
  if (p && !knockoutLocked) {
    const _koIds = [];
    for (let i = 0; i < 16; i++) _koIds.push('r16_'+i);
    for (let i = 0; i < 8; i++) _koIds.push('r8_'+i);
    for (let i = 0; i < 4; i++) _koIds.push('r4_'+i);
    for (let i = 0; i < 2; i++) _koIds.push('r2_'+i);
    _koIds.push('final','third_place');
    _koIds.forEach(id => { const sc = p.koScores?.[id]; if (!sc || sc.h === '' || sc.a === '') missingKO++; });
  }
  const buteurFilled = !!(p && p.topScorer && p.topScorer.trim());
  const manualOn = r16ManualMode;
  let html = '';
  html += '<div class="settings-section"><div class="settings-section-title">👤 Gestion du Profil</div>';
  if (isSystem) {
    html += '<p style="font-size:.82rem;color:var(--text3);padding:8px 0">Profil système — non modifiable.</p>';
  } else {
    html += '<div class="settings-field-label">Emoji</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px" id="settingsEmojiPicker">' +
      ['😎','🥷','👤','🕵️','🧑‍🚀','👹','🦊','🦄','🐉','🚀'].map(e =>
        '<button type="button" class="emoji-btn" onclick="settingsSelectEmoji(\'' + e + '\',this)">' + e + '</button>'
      ).join('') + '</div>' +
      '<div class="settings-field-label">Nom du profil</div>' +
      '<input type="text" class="settings-input" id="settingsProfileName" value="' + nameNoEmoji + '" maxlength="30" placeholder="Nom..." oninput="applyProfileNameChange()" />';
  }
  html += '</div>';
  html += '<div class="settings-section"><div class="settings-section-title">⚙️ Configuration</div>' +
    '<div class="toggle-row"><div class="toggle-slider ' + (manualOn?'on':'') + '" onclick="toggleR16Mode()" id="settingsManualToggle"></div>' +
    '<div class="toggle-label">Mode Manuel 1/16 — <strong>' + (manualOn?'Activé':'Désactivé') + '</strong></div></div>' +
    '<p style="font-size:.76rem;color:var(--text3);margin-top:4px">Permet de choisir librement les confrontations du 1/16 de finale.</p></div>';
  html += '<div class="settings-section"><div class="settings-section-title">📤 Import / Export</div>' +
    '<div style="display:flex;flex-wrap:wrap;gap:10px">' +
    '<button class="btn-set btn-set-neutral" onclick="exportJSON()">📥 Exporter JSON (Profil)</button>' +
    '<button class="btn-set btn-set-neutral" onclick="exportCompetitionJSON()">🏆 Exporter JSON (Compétition)</button>' +
    '<button class="btn-set btn-set-neutral" onclick="exportBracketPDF()">🖨️ PDF (Arborescence)</button>' +
    '</div></div>';
  html += '<div class="settings-section"><div class="settings-section-title">🎲 Gestion des Matchs</div>';
  html += '<div style="margin-bottom:16px"><div style="font-size:.8rem;font-weight:600;color:var(--text2);margin-bottom:10px;text-transform:uppercase">Phase de Groupes</div><div class="sym-grid">' +
    '<div class="sym-card"><div class="sym-card-title">Simulation</div>' +
    '<button class="btn-set btn-set-sim" ' + ((isReal||poulesLocked)?'disabled':'') + ' onclick="generateRandomPredictions()">🎲 Générer (Poules)</button></div>' +
    '<div class="sym-card"><div class="sym-card-title">Verrouillage</div>' +
    '<button class="btn-set btn-set-lock ' + (poulesLocked?'is-locked':'') + '" ' + ((poulesLocked||missingPoules>0)?'disabled':'') + ' onclick="lockPoules()">' +
    (poulesLocked ? '🔒 Verrouillé' : missingPoules>0 ? '🔒 Verrouiller — '+missingPoules+' manquant(s)' : '🔒 Verrouiller (Poules)') +
    '</button></div></div></div>';
  html += '<div style="margin-bottom:16px"><div style="font-size:.8rem;font-weight:600;color:var(--text2);margin-bottom:10px;text-transform:uppercase">Phase Finale</div><div class="sym-grid">' +
    '<div class="sym-card"><div class="sym-card-title">Simulation</div>' +
    '<button class="btn-set btn-set-sim" ' + ((isReal||knockoutLocked)?'disabled':'') + ' onclick="generateKOScores()">🎲 Générer (Phase finale)</button></div>' +
    '<div class="sym-card"><div class="sym-card-title">Verrouillage</div>' +
    '<button class="btn-set btn-set-lock ' + (knockoutLocked?'is-locked':'') + '" ' + ((knockoutLocked||missingKO>0)?'disabled':'') + ' onclick="lockKnockout()">' +
    (knockoutLocked ? '🔒 Verrouillé' : missingKO>0 ? '🔒 Verrouiller — '+missingKO+' manquant(s)' : '🔒 Verrouiller (Phase Finale)') +
    '</button></div></div></div>';
  html += '<div><div style="font-size:.8rem;font-weight:600;color:var(--text2);margin-bottom:10px;text-transform:uppercase">Meilleur Buteur</div><div class="sym-grid">' +
    '<div class="sym-card"><div class="sym-card-title">Simulation</div>' +
    '<button class="btn-set btn-set-sim" ' + ((isReal||buteurLocked)?'disabled':'') + ' onclick="generateTopScorer()">🎲 Générer buteur</button></div>' +
    '<div class="sym-card"><div class="sym-card-title">Verrouillage</div>' +
    '<button class="btn-set btn-set-lock ' + (buteurLocked?'is-locked':'') + '" ' + ((buteurLocked||!buteurFilled)?'disabled':'') + ' onclick="lockButeur()">' +
    (buteurLocked ? '🔒 Verrouillé' : !buteurFilled ? '🔒 Verrouiller — aucun nom' : '🔒 Verrouiller (Buteur)') +
    '</button></div></div></div>';
  html += '</div>';
  html += '<div class="settings-section"><div class="settings-section-title">⚠️ Administration</div>';
  if (isSystem) {
    html += '<p style="font-size:.82rem;color:var(--text3)">Les profils système ne peuvent pas être supprimés.</p>';
  } else {
    html += '<p style="font-size:.82rem;color:var(--text2);margin-bottom:12px">Réinitialise les scores non verrouillés.</p>' +
      '<button class="btn-set btn-set-sim" style="margin-bottom:10px" onclick="resetProfileScores()">🔄 Réinitialiser scores</button>' +
      '<p style="font-size:.82rem;color:var(--text2);margin-bottom:12px;margin-top:4px">Supprime définitivement ce profil.</p>' +
      '<button class="btn-set btn-set-danger" onclick="openDelModal()">🗑️ Supprimer ce profil</button>';
  }
  html += '</div>';
  cont.innerHTML = html;
  if (!isSystem) {
    const emojiMatch = profileName.match(/^(\S+)\s/);
    const currentEmoji = emojiMatch ? emojiMatch[1] : '😎';
    _settingsEmoji = currentEmoji;
    cont.querySelectorAll('#settingsEmojiPicker .emoji-btn').forEach(b => {
      if (b.textContent.trim() === currentEmoji) b.classList.add('active');
    });
  }
}

// ============================================================
// ROUTING
// ============================================================
const tabTitles = {
  groups:'🏟️ Phase de Groupes', standings:'📊 Classements de Poule',
  knockout:'⚡ Phase Finale', bracket:'🗂️ Arborescence',
  bonus:'🌟 Bonus', leaderboard:'🏆 Classement Général', settings:'⚙️ Paramètres'
};

window.showTab = function(tab) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pane = document.getElementById('tab-'+tab);
  if (pane) pane.classList.add('active');
  const navItem = document.querySelector('.nav-item[data-tab="'+tab+'"]');
  if (navItem) navItem.classList.add('active');
  const title = document.getElementById('topbarTitle');
  if (title) title.textContent = tabTitles[tab] || tab;
  activeTab = tab;
  renderCurrentTab();
  if (window.innerWidth < 800) {
    const sb = document.getElementById('sidebar');
    if (sb) sb.classList.remove('open');
  }
};

function renderCurrentTab() {
  switch (activeTab) {
    case 'groups': renderGroupMatches(currentGroupTab); break;
    case 'standings': renderStandings(currentStandingsGroup); break;
    case 'knockout': renderKnockout(); break;
    case 'bracket': renderBracket(); break;
    case 'bonus': renderBonus(); break;
    case 'leaderboard': renderLeaderboard(); break;
    case 'settings': renderSettings(); break;
  }
  const label = document.getElementById('r16ModeLabel');
  if (label) label.textContent = r16ManualMode ? 'Manuel (choix libre des 1/16)' : 'Automatique (FIFA 2026)';
}

window.toggleSidebar = function() {
  const sb = document.getElementById('sidebar');
  if (sb) sb.classList.toggle('open');
};

// ============================================================
// INIT
// ============================================================
loadAll();
updateProfileUI();
renderGroupTabs('groupTabs', g => renderGroupMatches(g), 'A');
renderGroupMatches('A');
renderGroupTabs('standingsGroupTabs', g => renderStandings(g), 'A');
const topbarInfo = document.getElementById('topbarInfo');
if (topbarInfo) topbarInfo.textContent = '🌍 48 équipes • 12 groupes';

})();
