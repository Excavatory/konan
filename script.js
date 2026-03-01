// ====== App State & Config ======
const OCHAKOVO_CENTER = [55.6983, 37.4582];
let map;
let playerMarker;
let playerPos = [...OCHAKOVO_CENTER];
let artifacts = [];
let artifactMarkers = {};
let isStealthMode = false;
let autoWalkInterval = null;
let npcMarkers = [];

const DISTRICT_BOUNDS = [
    [55.7080, 37.4280], [55.7095, 37.4420], [55.7090, 37.4580],
    [55.7060, 37.4720], [55.7030, 37.4820], [55.6980, 37.4880],
    [55.6920, 37.4860], [55.6880, 37.4780], [55.6860, 37.4620],
    [55.6870, 37.4450], [55.6900, 37.4320], [55.6950, 37.4250],
    [55.7010, 37.4230], [55.7050, 37.4250]
];

const playerStats = { steps: 2347, coins: 580, crystals: 12, prestige: 1240, collected: 87, inventory: { power: 5, build: 12, rare: 2 } };

const ARTIFACT_TYPES = {
    power: { icon: '🗡️', type: 'Силовой артефакт', bonus: '+20 Атаки', class: 'type-power', color: '#ef4444', resource: 'coins', amount: 25 },
    build: { icon: '🧱', type: 'Строительный артефакт', bonus: '+15 к Строительству', class: 'type-build', color: '#f59e0b', resource: 'coins', amount: 15 },
    rare: { icon: '💎', type: 'Редкий артефакт', bonus: '+150 Престижа', class: 'type-rare', color: '#7c3aed', resource: 'crystals', amount: 1 }
};
const ARTIFACT_NAMES = {
    power: ['Очаковский клинок', 'Щит Матвеевского', 'Кулак Дорохова', 'Меч проспекта'],
    build: ['Советский кирпич', 'Панельный блок', 'Труба Очаковки', 'Плитка двора'],
    rare: ['Матвеевский кристалл', 'Ключ от МКАД', 'Печать старосты', 'Корона Очаково']
};
const NPC_PLAYERS = [
    { name: 'Дмитрий', emoji: '🧑', offset: [0.002, 0.001] },
    { name: 'Анна', emoji: '👩', offset: [-0.001, 0.003] },
    { name: 'Сергей', emoji: '👨', offset: [0.003, -0.002] },
    { name: 'Елена', emoji: '👩‍🦰', offset: [-0.002, -0.001] },
    { name: 'Артём', emoji: '🧔', offset: [0.001, -0.003] }
];
const RANKING_DATA = {
    all: {
        podium: [{ name: 'King', seed: 'King', score: 3500 }, { name: 'Alex', seed: 'Alex', score: 2100 }, { name: 'Max', seed: 'Max', score: 1800 }],
        list: [
            { name: 'Дмитрий', score: 1650 }, { name: 'Анна', score: 1500 }, { name: 'Сергей', score: 1420 }, { name: 'Елена', score: 1380 },
            { name: 'Артём', score: 1300 }, { name: 'Ольга', score: 1280 }, { name: 'Николай', score: 1260 }, { name: 'Игрок1', score: 1240, isPlayer: true },
            { name: 'Мария', score: 1200 }, { name: 'Павел', score: 1150 }, { name: 'Ирина', score: 1100 }, { name: 'Владимир', score: 1050 },
            { name: 'Татьяна', score: 980 }, { name: 'Алексей', score: 920 }, { name: 'Катерина', score: 870 }, { name: 'Роман', score: 800 }, { name: 'Юля', score: 750 }
        ]
    },
    week: {
        podium: [{ name: 'Alex', seed: 'Alex', score: 820 }, { name: 'Игрок1', seed: 'King', score: 680 }, { name: 'Анна', seed: 'Anna2', score: 540 }],
        list: [{ name: 'Сергей', score: 480 }, { name: 'Дмитрий', score: 420 }, { name: 'Max', score: 380 }, { name: 'Елена', score: 350 },
        { name: 'Артём', score: 310 }, { name: 'King', score: 290 }, { name: 'Ольга', score: 260 }, { name: 'Николай', score: 230 }, { name: 'Мария', score: 200 }, { name: 'Павел', score: 170 }]
    },
    today: {
        podium: [{ name: 'Игрок1', seed: 'King', score: 180 }, { name: 'Сергей', seed: 'Sergey', score: 150 }, { name: 'Елена', seed: 'Elena2', score: 120 }],
        list: [{ name: 'Alex', score: 100 }, { name: 'Дмитрий', score: 85 }, { name: 'Анна', score: 70 }, { name: 'Max', score: 55 }, { name: 'Артём', score: 40 }, { name: 'King', score: 30 }]
    }
};

// ====== Sound ======
const SoundFX = {
    ctx: null,
    init() { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
    play(type) {
        if (!this.ctx) this.init();
        const c = this.ctx, o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        switch (type) {
            case 'collect': o.frequency.setValueAtTime(600, c.currentTime); o.frequency.exponentialRampToValueAtTime(1200, c.currentTime + 0.1); g.gain.setValueAtTime(0.15, c.currentTime); g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.3); o.start(c.currentTime); o.stop(c.currentTime + 0.3); break;
            case 'spawn': o.frequency.setValueAtTime(400, c.currentTime); o.frequency.exponentialRampToValueAtTime(600, c.currentTime + 0.15); g.gain.setValueAtTime(0.1, c.currentTime); g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.2); o.start(c.currentTime); o.stop(c.currentTime + 0.2); break;
            case 'step': o.type = 'triangle'; o.frequency.setValueAtTime(200, c.currentTime); g.gain.setValueAtTime(0.05, c.currentTime); g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.08); o.start(c.currentTime); o.stop(c.currentTime + 0.08); break;
            case 'upgrade': o.frequency.setValueAtTime(500, c.currentTime); o.frequency.exponentialRampToValueAtTime(1500, c.currentTime + 0.3); g.gain.setValueAtTime(0.15, c.currentTime); g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.4); o.start(c.currentTime); o.stop(c.currentTime + 0.4); break;
            case 'tab': o.type = 'sine'; o.frequency.setValueAtTime(800, c.currentTime); g.gain.setValueAtTime(0.05, c.currentTime); g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.06); o.start(c.currentTime); o.stop(c.currentTime + 0.06); break;
        }
    }
};

// ====== DOM ======
const tabs = document.querySelectorAll('.tab');
const screens = document.querySelectorAll('.screen');
const artifactSheet = document.getElementById('artifact-sheet');
const sheetOverlay = document.getElementById('sheet-overlay');

// ====== Init ======
function initApp() {
    initSplash();
    initMap();
    initNavigation();
    initSimulation();
    initBottomSheet();
    initStealth();
    initRankingFilters();
    renderRanking('all');
    initUpgradeModal();
    initChat();
    document.addEventListener('click', () => SoundFX.init(), { once: true });
}

// ====== Navigation ======
function initNavigation() {
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const tid = tab.dataset.target;
            screens.forEach(s => { s.classList.remove('active'); if (s.id === tid) s.classList.add('active'); });
            SoundFX.play('tab');
            if (tid === 'screen-map' && map) setTimeout(() => map.invalidateSize(), 150);
            if (tid === 'screen-profile') updateProfileStats();
        });
    });
}

// ====== Leaflet Map with Real Geolocation ======
function initMap() {
    map = L.map('map', { zoomControl: false, attributionControl: false }).setView(OCHAKOVO_CENTER, 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19, subdomains: 'abcd'
    }).addTo(map);

    // District boundary
    L.polygon(DISTRICT_BOUNDS, { color: '#f5c842', weight: 2, opacity: 0.6, fillColor: '#f5c842', fillOpacity: 0.04, dashArray: '8, 6' }).addTo(map);

    // Player marker
    playerMarker = L.marker(playerPos, {
        icon: L.divIcon({ className: 'custom-icon', html: '<div class="player-marker">🏃‍♂️</div>', iconSize: [32, 32], iconAnchor: [16, 32] }),
        zIndexOffset: 1000
    }).addTo(map);

    // GPS accuracy circle
    let accuracyCircle = null;

    // Real geolocation
    if ('geolocation' in navigator) {
        navigator.geolocation.watchPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                const acc = pos.coords.accuracy;

                // Calculate steps from distance moved
                const moved = L.latLng(playerPos).distanceTo(L.latLng([lat, lng]));
                if (moved > 2) { // Only count if moved > 2 meters
                    playerStats.steps += Math.round(moved * 1.3); // ~1.3 steps per meter
                    playerStats.coins += Math.floor(Math.random() * 2);
                    updateHUD();
                }

                playerPos[0] = lat;
                playerPos[1] = lng;
                playerMarker.setLatLng(playerPos);
                map.panTo(playerPos, { animate: true });

                // Show accuracy circle
                if (accuracyCircle) map.removeLayer(accuracyCircle);
                accuracyCircle = L.circle(playerPos, {
                    radius: acc,
                    color: '#7c3aed',
                    fillColor: '#7c3aed',
                    fillOpacity: 0.08,
                    weight: 1,
                    opacity: 0.3
                }).addTo(map);

                checkDistanceToArtifacts();

                // Spawn artifact near player occasionally
                if (Math.random() < 0.05) spawnArtifact();
            },
            (err) => {
                console.log('GPS недоступен, используем симуляцию:', err.message);
                showToast('📍 GPS недоступен — используйте кнопки');
            },
            { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
        );
    }

    spawnNPCs();
    spawnArtifact(); spawnArtifact(); spawnArtifact();
}

// ====== NPCs ======
function spawnNPCs() {
    NPC_PLAYERS.forEach(npc => {
        const pos = [OCHAKOVO_CENTER[0] + npc.offset[0], OCHAKOVO_CENTER[1] + npc.offset[1]];
        const m = L.marker(pos, {
            icon: L.divIcon({ className: 'custom-icon', html: `<div class="npc-marker" title="${npc.name}">${npc.emoji}</div>`, iconSize: [28, 28], iconAnchor: [14, 28] })
        }).addTo(map);
        npcMarkers.push({ marker: m, pos: [...pos], npc });
    });
    setInterval(moveNPCs, 3000);
}
function moveNPCs() {
    if (isStealthMode) return;
    npcMarkers.forEach(n => { n.pos[0] += (Math.random() - 0.5) * 0.0005; n.pos[1] += (Math.random() - 0.5) * 0.0005; n.marker.setLatLng(n.pos); });
}

// ====== Simulation ======
function initSimulation() {
    document.getElementById('dev-sim-step').addEventListener('click', simulateMovement);
    document.getElementById('dev-spawn-art').addEventListener('click', spawnArtifact);
    document.getElementById('dev-auto-walk').addEventListener('click', toggleAutoWalk);
}
function toggleAutoWalk() {
    const btn = document.getElementById('dev-auto-walk');
    if (autoWalkInterval) { clearInterval(autoWalkInterval); autoWalkInterval = null; btn.textContent = '▶️ Авто'; btn.classList.remove('active-btn'); }
    else { autoWalkInterval = setInterval(simulateMovement, 1500); btn.textContent = '⏸️ Стоп'; btn.classList.add('active-btn'); }
}
function simulateMovement() {
    playerPos[0] += (Math.random() - 0.5) * 0.0008;
    playerPos[1] += (Math.random() - 0.5) * 0.0008;
    playerMarker.setLatLng(playerPos);
    map.panTo(playerPos, { animate: true });
    playerStats.steps += Math.floor(Math.random() * 30) + 10;
    playerStats.coins += Math.floor(Math.random() * 3);
    SoundFX.play('step');
    updateHUD();
    checkDistanceToArtifacts();
    if (Math.random() < 0.15) spawnArtifact();
}
function spawnArtifact() {
    const lat = playerPos[0] + (Math.random() - 0.5) * 0.004, lng = playerPos[1] + (Math.random() - 0.5) * 0.004;
    const types = Object.keys(ARTIFACT_TYPES), typeKey = types[Math.floor(Math.random() * types.length)];
    const typeObj = { ...ARTIFACT_TYPES[typeKey] };
    typeObj.name = ARTIFACT_NAMES[typeKey][Math.floor(Math.random() * ARTIFACT_NAMES[typeKey].length)];
    const id = Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const marker = L.marker([lat, lng], {
        icon: L.divIcon({ className: 'custom-icon', html: `<div class="artifact-marker ${typeObj.class}">${typeObj.icon}</div>`, iconSize: [28, 28], iconAnchor: [14, 28] })
    }).addTo(map);
    marker.on('click', () => openArtifactSheet({ id, coords: [lat, lng], typeData: typeObj, typeKey }));
    artifacts.push({ id, coords: [lat, lng], typeData: typeObj, typeKey });
    artifactMarkers[id] = marker;
    document.getElementById('btn-event').classList.add('blinking');
    setTimeout(() => document.getElementById('btn-event').classList.remove('blinking'), 5000);
    SoundFX.play('spawn');
    if (navigator.vibrate) navigator.vibrate(100);
}
function checkDistanceToArtifacts() {
    artifacts.forEach(a => {
        const d = L.latLng(playerPos).distanceTo(L.latLng(a.coords));
        if (artifactSheet.classList.contains('open') && currentOpenArtifact === a.id) updateDistanceUI(d);
        if (d < 10 && !artifactSheet.classList.contains('open')) { currentOpenArtifact = a.id; doCollect(); showToast(`${a.typeData.icon} ${a.typeData.name} собран!`); }
    });
}

// ====== Bottom Sheet ======
let currentOpenArtifact = null;
function initBottomSheet() {
    sheetOverlay.addEventListener('click', closeArtifactSheet);
    let sy = 0;
    artifactSheet.addEventListener('touchstart', e => { sy = e.touches[0].clientY; });
    artifactSheet.addEventListener('touchmove', e => { const d = e.touches[0].clientY - sy; if (d > 0) artifactSheet.style.transform = `translateY(${d}px)`; });
    artifactSheet.addEventListener('touchend', e => { artifactSheet.style.transform = ''; if (e.changedTouches[0].clientY - sy > 50) closeArtifactSheet(); });
    document.getElementById('btn-collect').addEventListener('click', () => { if (!document.getElementById('btn-collect').classList.contains('disabled')) doCollect(); });
}
function openArtifactSheet(info) {
    currentOpenArtifact = info.id;
    const d = L.latLng(playerPos).distanceTo(L.latLng(info.coords));
    document.getElementById('artifact-icon').textContent = info.typeData.icon;
    document.getElementById('artifact-icon').className = 'artifact-icon-large spin';
    document.getElementById('artifact-title').textContent = info.typeData.name;
    document.getElementById('artifact-type').textContent = info.typeData.type;
    document.getElementById('artifact-type').style.color = info.typeData.color;
    document.getElementById('artifact-bonus').textContent = info.typeData.bonus;
    updateDistanceUI(d);
    artifactSheet.classList.add('open');
    sheetOverlay.classList.add('active');
}
function updateDistanceUI(d) {
    document.getElementById('artifact-distance').innerHTML = `Расстояние: <span>${Math.round(d)} м</span>`;
    const btn = document.getElementById('btn-collect');
    if (d < 20) { btn.classList.remove('disabled'); btn.textContent = 'Подобрать'; }
    else { btn.classList.add('disabled'); btn.textContent = 'Подойдите ближе (< 20м)'; }
}
function closeArtifactSheet() {
    artifactSheet.classList.remove('open'); sheetOverlay.classList.remove('active');
    setTimeout(() => { currentOpenArtifact = null; }, 300);
}
function doCollect() {
    if (!currentOpenArtifact) return;
    const art = artifacts.find(a => a.id === currentOpenArtifact);
    const m = artifactMarkers[currentOpenArtifact];
    if (m) {
        const pt = map.latLngToContainerPoint(m.getLatLng());
        spawnParticles(pt.x, pt.y, art ? art.typeData.color : '#fff');
        map.removeLayer(m); delete artifactMarkers[currentOpenArtifact];
    }
    artifacts = artifacts.filter(a => a.id !== currentOpenArtifact);
    if (art) {
        playerStats[art.typeData.resource] += art.typeData.amount;
        playerStats.prestige += art.typeKey === 'rare' ? 150 : art.typeKey === 'power' ? 30 : 20;
        playerStats.collected += 1;
        playerStats.inventory[art.typeKey] = (playerStats.inventory[art.typeKey] || 0) + 1;
    }
    SoundFX.play('collect'); updateHUD();
    document.querySelector('.hud-bottom-dock').classList.add('flash');
    setTimeout(() => document.querySelector('.hud-bottom-dock').classList.remove('flash'), 500);
    closeArtifactSheet();
}

// ====== Particles ======
function spawnParticles(x, y, color) {
    const c = document.getElementById('particles-container'); if (!c) return;
    for (let i = 0; i < 12; i++) {
        const p = document.createElement('div'); p.className = 'particle';
        p.style.left = x + 'px'; p.style.top = y + 'px'; p.style.background = color;
        const a = (Math.PI * 2 * i) / 12, d = 40 + Math.random() * 60;
        p.style.setProperty('--tx', Math.cos(a) * d + 'px'); p.style.setProperty('--ty', Math.sin(a) * d + 'px');
        c.appendChild(p); setTimeout(() => p.remove(), 700);
    }
}

// ====== Toast ======
function showToast(msg) {
    const t = document.createElement('div'); t.className = 'toast-notification'; t.textContent = msg;
    document.body.appendChild(t); requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2000);
}

// ====== HUD ======
function updateHUD() {
    document.querySelector('.pill.steps').textContent = `🦶 ${playerStats.steps.toLocaleString('ru')}`;
    document.querySelector('.pill.coins').textContent = `🪙 ${playerStats.coins}`;
    document.querySelector('.pill.crystals').textContent = `💎 ${playerStats.crystals}`;
    document.querySelector('.prestige').textContent = `⭐ ${playerStats.prestige.toLocaleString('ru')}`;
}

// ====== Profile ======
function updateProfileStats() {
    const v = document.querySelectorAll('.stat-value');
    if (v.length >= 4) { v[0].textContent = playerStats.steps.toLocaleString('ru'); v[1].textContent = playerStats.prestige.toLocaleString('ru'); v[2].textContent = playerStats.collected; v[3].textContent = `#${computePlayerRank()}`; }
    const inv = document.querySelector('.inventory-scroll');
    if (inv) inv.innerHTML = `<div class="inv-item">🗡️ <span>x${playerStats.inventory.power}</span></div><div class="inv-item">🧱 <span>x${playerStats.inventory.build}</span></div><div class="inv-item">💎 <span>x${playerStats.inventory.rare}</span></div><div class="inv-item">🪙 <span>${playerStats.coins}</span></div>`;
}
function computePlayerRank() {
    const all = RANKING_DATA.all.podium.map(p => p.score).concat(RANKING_DATA.all.list.map(p => p.score));
    return all.filter(s => s > playerStats.prestige).length + 1;
}

// ====== Stealth ======
function initStealth() {
    const btn = document.querySelector('.btn-stealth');
    btn.addEventListener('click', () => {
        isStealthMode = !isStealthMode;
        btn.textContent = isStealthMode ? '🙈' : '👁';
        btn.classList.toggle('stealth-active', isStealthMode);
        npcMarkers.forEach(n => n.marker.setOpacity(isStealthMode ? 0.2 : 1));
        const pt = document.querySelector('.setting-item input[type="checkbox"]');
        if (pt) pt.checked = isStealthMode;
    });
    const pt = document.querySelector('.setting-item input[type="checkbox"]');
    if (pt) pt.addEventListener('change', e => {
        isStealthMode = e.target.checked;
        document.querySelector('.btn-stealth').textContent = isStealthMode ? '🙈' : '👁';
        document.querySelector('.btn-stealth').classList.toggle('stealth-active', isStealthMode);
    });
}

// ====== Ranking ======
function initRankingFilters() {
    const f = document.querySelectorAll('.filter'), keys = ['all', 'week', 'today'];
    f.forEach((btn, i) => btn.addEventListener('click', () => { f.forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderRanking(keys[i]); SoundFX.play('tab'); }));
}
function renderRanking(period) {
    const data = RANKING_DATA[period];
    const pi = document.querySelectorAll('.podium-item'), po = [1, 0, 2];
    pi.forEach((item, idx) => {
        const p = data.podium[po[idx]];
        if (p) { item.querySelector('.avatar').src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.seed}`; item.querySelector('.name').textContent = p.name; item.querySelector('.score').textContent = `⭐ ${p.score.toLocaleString('ru')}`; item.style.display = ''; }
        else item.style.display = 'none';
    });
    const list = document.querySelector('.ranking-list');
    if (!list || !data.list) return;
    list.innerHTML = data.list.map((p, i) => `<div class="rank-row ${p.isPlayer ? 'is-player' : ''}"><span class="rank-place">${i + 4}</span><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}" class="rank-avatar" alt=""><span class="rank-name">${p.name}</span><span class="rank-score">⭐ ${p.score.toLocaleString('ru')}</span></div>`).join('');
}

// ====== Upgrade ======
let isUpgradeOpen = false;
let upgradeInterval = null;

function closeUpgradeModal(e) {
    if (e) e.preventDefault();
    const modal = document.getElementById('upgrade-modal');
    const overlay = document.getElementById('upgrade-overlay');
    if (modal) modal.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    if (upgradeInterval) { clearInterval(upgradeInterval); upgradeInterval = null; }
    isUpgradeOpen = false;
}

function showUpgradeModal() {
    if (isUpgradeOpen) return;
    const modal = document.getElementById('upgrade-modal'); if (!modal) return;
    isUpgradeOpen = true;
    modal.classList.add('open');
    document.getElementById('upgrade-overlay').classList.add('active');
    let sec = 10;
    const timer = document.getElementById('upgrade-timer');
    const prog = document.getElementById('upgrade-progress-fill');
    const btnS = document.getElementById('btn-start-upgrade');
    timer.textContent = `${sec} сек`;
    prog.style.width = '0%';
    btnS.disabled = false;
    btnS.textContent = 'Начать улучшение (🪙 100)';
    btnS.onclick = () => {
        if (playerStats.coins < 100) { btnS.textContent = 'Не хватает монет!'; return; }
        playerStats.coins -= 100; updateHUD();
        btnS.disabled = true; btnS.textContent = 'Улучшение...';
        SoundFX.play('upgrade');
        if (upgradeInterval) clearInterval(upgradeInterval);
        upgradeInterval = setInterval(() => {
            sec--;
            timer.textContent = `${sec} сек`;
            prog.style.width = `${((10 - sec) / 10) * 100}%`;
            if (sec <= 0) {
                clearInterval(upgradeInterval); upgradeInterval = null;
                timer.textContent = 'Готово! ✅'; btnS.textContent = 'Улучшено!';
                const bl = document.querySelector('#screen-base .badge');
                const lv = parseInt(bl.textContent.replace('Ур. ', '')) || 3;
                bl.textContent = `Ур. ${lv + 1}`;
                playerStats.prestige += 50; updateHUD();
                showToast('🏠 Квартира улучшена! +50 престижа');
            }
        }, 1000);
    };
}

function initUpgradeModal() {
    const btn = document.querySelector('#screen-base .btn-primary');
    if (btn) btn.addEventListener('click', showUpgradeModal);

    const btnClose = document.getElementById('btn-close-upgrade');
    const overlay = document.getElementById('upgrade-overlay');

    // Both click AND touchend for mobile Safari
    [btnClose, overlay].forEach(el => {
        if (!el) return;
        el.style.cursor = 'pointer'; // ensures mobile treats it as clickable
        el.addEventListener('click', closeUpgradeModal);
        el.addEventListener('touchend', (e) => {
            e.preventDefault(); // prevent ghost click
            closeUpgradeModal();
        });
    });
}

// ====== Chat ======
function initChat() {
    const toggle = document.getElementById('chat-toggle'), panel = document.getElementById('chat-panel');
    if (!toggle) return;
    toggle.addEventListener('click', () => panel.classList.toggle('open'));
    document.getElementById('chat-close').addEventListener('click', () => panel.classList.remove('open'));
    [{ name: 'Дмитрий', text: 'Кто-нибудь видел редкий артефакт у прудов?', time: '20:15' }, { name: 'Анна', text: 'Да, я нашла Корону Очаково!', time: '20:18' }, { name: 'Сергей', text: 'Круто! Я около МЦД, тут куча строительных', time: '20:20' }, { name: 'Елена', text: 'Кто хочет в клан? Набираем людей 💪', time: '20:24' }].forEach(m => addChatMsg(m.name, m.text, m.time, false));
    const send = () => { const t = document.getElementById('chat-input').value.trim(); if (!t) return; const n = new Date(); addChatMsg('Игрок1', t, `${n.getHours()}:${String(n.getMinutes()).padStart(2, '0')}`, true); document.getElementById('chat-input').value = ''; document.getElementById('chat-messages').scrollTop = 99999; };
    document.getElementById('chat-send').addEventListener('click', send);
    document.getElementById('chat-input').addEventListener('keypress', e => { if (e.key === 'Enter') send(); });
}
function addChatMsg(name, text, time, own) {
    const el = document.getElementById('chat-messages'); if (!el) return;
    const d = document.createElement('div'); d.className = `chat-msg ${own ? 'own' : ''}`;
    d.innerHTML = `<div class="chat-msg-header"><span class="chat-name">${name}</span><span class="chat-time">${time}</span></div><div class="chat-text">${text}</div>`;
    el.appendChild(d);
}

// ====== Splash & Onboarding ======
function initSplash() {
    const s = document.getElementById('screen-splash'); if (!s) return;
    const bar = s.querySelector('.splash-progress-fill');
    if (bar) setTimeout(() => bar.style.width = '100%', 100);
    setTimeout(() => { s.classList.add('fade-out'); setTimeout(() => { s.style.display = 'none'; showOnboarding(); }, 500); }, 2500);
}
function showOnboarding() {
    const ob = document.getElementById('screen-onboarding'); if (!ob) return;
    ob.style.display = 'flex';
    let cur = 0;
    const slides = ob.querySelectorAll('.onboarding-slide'), dots = ob.querySelectorAll('.dot'), btn = ob.querySelector('.btn-onboarding-next');
    const show = i => { slides.forEach((s, j) => s.classList.toggle('active', j === i)); dots.forEach((d, j) => d.classList.toggle('active', j === i)); btn.textContent = i === slides.length - 1 ? 'Начать' : 'Далее'; };
    show(0);
    btn.addEventListener('click', () => { cur++; if (cur >= slides.length) { ob.classList.add('fade-out'); setTimeout(() => { ob.style.display = 'none'; }, 500); } else show(cur); });
}

document.addEventListener('DOMContentLoaded', initApp);
