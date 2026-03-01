// ====== App State & Config ======
const OCHAKOVO_CENTER = [55.6983, 37.4582];
let ymap = null;
let playerMarkerEl = null;
let playerPos = [...OCHAKOVO_CENTER];
let artifacts = [];
let artifactElements = {};
let isStealthMode = false;
let autoWalkInterval = null;
let npcElements = [];

// District boundary polygon
const DISTRICT_BOUNDS = [
    [55.7080, 37.4280], [55.7095, 37.4420], [55.7090, 37.4580],
    [55.7060, 37.4720], [55.7030, 37.4820], [55.6980, 37.4880],
    [55.6920, 37.4860], [55.6880, 37.4780], [55.6860, 37.4620],
    [55.6870, 37.4450], [55.6900, 37.4320], [55.6950, 37.4250],
    [55.7010, 37.4230], [55.7050, 37.4250]
];

const playerStats = {
    steps: 2347, coins: 580, crystals: 12, prestige: 1240,
    collected: 87, inventory: { power: 5, build: 12, rare: 2 }
};

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
        podium: [
            { name: 'King', seed: 'King', score: 3500 },
            { name: 'Alex', seed: 'Alex', score: 2100 },
            { name: 'Max', seed: 'Max', score: 1800 }
        ],
        list: [
            { name: 'Дмитрий', score: 1650 }, { name: 'Анна', score: 1500 },
            { name: 'Сергей', score: 1420 }, { name: 'Елена', score: 1380 },
            { name: 'Артём', score: 1300 }, { name: 'Ольга', score: 1280 },
            { name: 'Николай', score: 1260 }, { name: 'Игрок1', score: 1240, isPlayer: true },
            { name: 'Мария', score: 1200 }, { name: 'Павел', score: 1150 },
            { name: 'Ирина', score: 1100 }, { name: 'Владимир', score: 1050 },
            { name: 'Татьяна', score: 980 }, { name: 'Алексей', score: 920 },
            { name: 'Катерина', score: 870 }, { name: 'Роман', score: 800 },
            { name: 'Юля', score: 750 }
        ]
    },
    week: {
        podium: [
            { name: 'Alex', seed: 'Alex', score: 820 },
            { name: 'Игрок1', seed: 'King', score: 680 },
            { name: 'Анна', seed: 'Anna2', score: 540 }
        ],
        list: [
            { name: 'Сергей', score: 480 }, { name: 'Дмитрий', score: 420 },
            { name: 'Max', score: 380 }, { name: 'Елена', score: 350 },
            { name: 'Артём', score: 310 }, { name: 'King', score: 290 },
            { name: 'Ольга', score: 260 }, { name: 'Николай', score: 230 },
            { name: 'Мария', score: 200 }, { name: 'Павел', score: 170 }
        ]
    },
    today: {
        podium: [
            { name: 'Игрок1', seed: 'King', score: 180 },
            { name: 'Сергей', seed: 'Sergey', score: 150 },
            { name: 'Елена', seed: 'Elena2', score: 120 }
        ],
        list: [
            { name: 'Alex', score: 100 }, { name: 'Дмитрий', score: 85 },
            { name: 'Анна', score: 70 }, { name: 'Max', score: 55 },
            { name: 'Артём', score: 40 }, { name: 'King', score: 30 }
        ]
    }
};

// ====== Sound Manager ======
const SoundFX = {
    ctx: null,
    init() { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
    play(type) {
        if (!this.ctx) this.init();
        const ctx = this.ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        switch (type) {
            case 'collect':
                osc.frequency.setValueAtTime(600, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
                osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
                break;
            case 'spawn':
                osc.frequency.setValueAtTime(400, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
                break;
            case 'step':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(200, ctx.currentTime);
                gain.gain.setValueAtTime(0.05, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
                osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.08);
                break;
            case 'upgrade':
                osc.frequency.setValueAtTime(500, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.3);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
                osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
                break;
            case 'tab':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                gain.gain.setValueAtTime(0.05, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
                osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.06);
                break;
        }
    }
};

// ====== DOM Elements ======
const tabs = document.querySelectorAll('.tab');
const screens = document.querySelectorAll('.screen');
const artifactSheet = document.getElementById('artifact-sheet');
const sheetOverlay = document.getElementById('sheet-overlay');

// ====== Initialization ======
async function initApp() {
    initSplash();
    await initMap();
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
            const targetId = tab.getAttribute('data-target');
            screens.forEach(s => {
                s.classList.remove('active');
                if (s.id === targetId) s.classList.add('active');
            });
            SoundFX.play('tab');
            if (targetId === 'screen-profile') updateProfileStats();
        });
    });
}

// ====== Yandex Map ======
async function initMap() {
    await ymaps3.ready;

    const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker, YMapFeature } = ymaps3;

    // Create map with dark scheme
    ymap = new YMap(document.getElementById('map'), {
        location: {
            center: [OCHAKOVO_CENTER[1], OCHAKOVO_CENTER[0]], // Yandex uses [lng, lat]
            zoom: 15
        }
    });

    // Dark scheme layer
    ymap.addChild(new YMapDefaultSchemeLayer({
        theme: 'dark'
    }));
    ymap.addChild(new YMapDefaultFeaturesLayer());

    // District boundary
    const boundaryCoords = DISTRICT_BOUNDS.map(c => [c[1], c[0]]); // convert to [lng, lat]
    boundaryCoords.push(boundaryCoords[0]); // close polygon
    const boundary = new YMapFeature({
        geometry: {
            type: 'Polygon',
            coordinates: [boundaryCoords]
        },
        style: {
            stroke: [{ color: '#f5c84299', width: 2, dash: [8, 6] }],
            fill: '#f5c84210'
        }
    });
    ymap.addChild(boundary);

    // Player marker
    const playerEl = document.createElement('div');
    playerEl.className = 'player-marker';
    playerEl.textContent = '🏃‍♂️';
    playerMarkerEl = new YMapMarker(
        { coordinates: [playerPos[1], playerPos[0]] },
        playerEl
    );
    ymap.addChild(playerMarkerEl);

    // NPC players
    spawnNPCs();

    // Initial artifacts
    spawnArtifact();
    spawnArtifact();
    spawnArtifact();
}

// Helper: get distance between two [lat,lng] points in meters
function getDistanceMeters(pos1, pos2) {
    const R = 6371000;
    const dLat = (pos2[0] - pos1[0]) * Math.PI / 180;
    const dLng = (pos2[1] - pos1[1]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(pos1[0] * Math.PI / 180) * Math.cos(pos2[0] * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ====== NPC Players ======
function spawnNPCs() {
    if (!ymaps3) return;
    const { YMapMarker } = ymaps3;

    NPC_PLAYERS.forEach(npc => {
        const pos = [OCHAKOVO_CENTER[0] + npc.offset[0], OCHAKOVO_CENTER[1] + npc.offset[1]];
        const el = document.createElement('div');
        el.className = 'npc-marker';
        el.title = npc.name;
        el.textContent = npc.emoji;

        const marker = new YMapMarker(
            { coordinates: [pos[1], pos[0]] },
            el
        );
        ymap.addChild(marker);
        npcElements.push({ marker, el, pos: [...pos], npc });
    });

    setInterval(moveNPCs, 3000);
}

function moveNPCs() {
    if (isStealthMode) return;
    npcElements.forEach(item => {
        item.pos[0] += (Math.random() - 0.5) * 0.0005;
        item.pos[1] += (Math.random() - 0.5) * 0.0005;
        item.marker.update({ coordinates: [item.pos[1], item.pos[0]] });
    });
}

// ====== Mechanics / Simulation ======
function initSimulation() {
    document.getElementById('dev-sim-step').addEventListener('click', simulateMovement);
    document.getElementById('dev-spawn-art').addEventListener('click', spawnArtifact);
    document.getElementById('dev-auto-walk').addEventListener('click', toggleAutoWalk);
}

function toggleAutoWalk() {
    const btn = document.getElementById('dev-auto-walk');
    if (autoWalkInterval) {
        clearInterval(autoWalkInterval);
        autoWalkInterval = null;
        btn.textContent = '▶️ Авто';
        btn.classList.remove('active-btn');
    } else {
        autoWalkInterval = setInterval(simulateMovement, 1500);
        btn.textContent = '⏸️ Стоп';
        btn.classList.add('active-btn');
    }
}

function simulateMovement() {
    playerPos[0] += (Math.random() - 0.5) * 0.0008;
    playerPos[1] += (Math.random() - 0.5) * 0.0008;

    playerMarkerEl.update({ coordinates: [playerPos[1], playerPos[0]] });
    ymap.setLocation({ center: [playerPos[1], playerPos[0]], duration: 300 });

    playerStats.steps += Math.floor(Math.random() * 30) + 10;
    playerStats.coins += Math.floor(Math.random() * 3);
    SoundFX.play('step');
    updateHUD();
    checkDistanceToArtifacts();

    if (Math.random() < 0.15) spawnArtifact();
}

function spawnArtifact() {
    if (!ymaps3 || !ymap) return;
    const { YMapMarker } = ymaps3;

    const lat = playerPos[0] + (Math.random() - 0.5) * 0.004;
    const lng = playerPos[1] + (Math.random() - 0.5) * 0.004;

    const types = Object.keys(ARTIFACT_TYPES);
    const typeKey = types[Math.floor(Math.random() * types.length)];
    const typeObj = { ...ARTIFACT_TYPES[typeKey] };
    const names = ARTIFACT_NAMES[typeKey];
    typeObj.name = names[Math.floor(Math.random() * names.length)];

    const id = Date.now() + '_' + Math.random().toString(36).substr(2, 5);

    const el = document.createElement('div');
    el.className = `artifact-marker ${typeObj.class}`;
    el.textContent = typeObj.icon;
    el.addEventListener('click', () => {
        openArtifactSheet({ id, coords: [lat, lng], typeData: typeObj, typeKey });
    });

    const marker = new YMapMarker(
        { coordinates: [lng, lat] },
        el
    );
    ymap.addChild(marker);

    artifacts.push({ id, coords: [lat, lng], typeData: typeObj, typeKey });
    artifactElements[id] = { marker, el };

    const eventBtn = document.getElementById('btn-event');
    eventBtn.classList.add('blinking');
    setTimeout(() => eventBtn.classList.remove('blinking'), 5000);

    SoundFX.play('spawn');
    if (navigator.vibrate) navigator.vibrate(100);
}

function checkDistanceToArtifacts() {
    artifacts.forEach(art => {
        const distance = getDistanceMeters(playerPos, art.coords);
        if (artifactSheet.classList.contains('open') && currentOpenArtifact === art.id) {
            updateDistanceUI(distance);
        }
        if (distance < 10 && !artifactSheet.classList.contains('open')) {
            autoCollect(art);
        }
    });
}

function autoCollect(art) {
    currentOpenArtifact = art.id;
    doCollect();
    showToast(`${art.typeData.icon} ${art.typeData.name} собран!`);
}

// ====== Bottom Sheet ======
let currentOpenArtifact = null;

function initBottomSheet() {
    sheetOverlay.addEventListener('click', closeArtifactSheet);
    let startY = 0;
    artifactSheet.addEventListener('touchstart', e => { startY = e.touches[0].clientY; });
    artifactSheet.addEventListener('touchmove', e => {
        const d = e.touches[0].clientY - startY;
        if (d > 0) artifactSheet.style.transform = `translateY(${d}px)`;
    });
    artifactSheet.addEventListener('touchend', e => {
        artifactSheet.style.transform = '';
        if (e.changedTouches[0].clientY - startY > 50) closeArtifactSheet();
    });
    document.getElementById('btn-collect').addEventListener('click', () => {
        if (!document.getElementById('btn-collect').classList.contains('disabled')) doCollect();
    });
}

function openArtifactSheet(info) {
    currentOpenArtifact = info.id;
    const distance = getDistanceMeters(playerPos, info.coords);
    document.getElementById('artifact-icon').textContent = info.typeData.icon;
    document.getElementById('artifact-icon').className = 'artifact-icon-large spin';
    document.getElementById('artifact-title').textContent = info.typeData.name;
    document.getElementById('artifact-type').textContent = info.typeData.type;
    document.getElementById('artifact-type').style.color = info.typeData.color;
    document.getElementById('artifact-bonus').textContent = info.typeData.bonus;
    updateDistanceUI(distance);
    artifactSheet.classList.add('open');
    sheetOverlay.classList.add('active');
}

function updateDistanceUI(distance) {
    const distEl = document.getElementById('artifact-distance');
    const btn = document.getElementById('btn-collect');
    distEl.innerHTML = `Расстояние: <span>${Math.round(distance)} м</span>`;
    if (distance < 20) {
        btn.classList.remove('disabled');
        btn.textContent = 'Подобрать';
    } else {
        btn.classList.add('disabled');
        btn.textContent = 'Подойдите ближе (< 20м)';
    }
}

function closeArtifactSheet() {
    artifactSheet.classList.remove('open');
    sheetOverlay.classList.remove('active');
    setTimeout(() => { currentOpenArtifact = null; }, 300);
}

function doCollect() {
    if (!currentOpenArtifact) return;
    const artData = artifacts.find(a => a.id === currentOpenArtifact);

    const artEl = artifactElements[currentOpenArtifact];
    if (artEl) {
        // Particle effect from the marker element position
        const rect = artEl.el.getBoundingClientRect();
        spawnParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, artData ? artData.typeData.color : '#fff');
        ymap.removeChild(artEl.marker);
        delete artifactElements[currentOpenArtifact];
    }

    artifacts = artifacts.filter(a => a.id !== currentOpenArtifact);

    if (artData) {
        playerStats[artData.typeData.resource] += artData.typeData.amount;
        const prestigeGain = artData.typeKey === 'rare' ? 150 : artData.typeKey === 'power' ? 30 : 20;
        playerStats.prestige += prestigeGain;
        playerStats.collected += 1;
        playerStats.inventory[artData.typeKey] = (playerStats.inventory[artData.typeKey] || 0) + 1;
    }

    SoundFX.play('collect');
    updateHUD();
    const dock = document.querySelector('.hud-bottom-dock');
    dock.classList.add('flash');
    setTimeout(() => dock.classList.remove('flash'), 500);
    closeArtifactSheet();
}

// ====== Particles ======
function spawnParticles(x, y, color) {
    const container = document.getElementById('particles-container');
    if (!container) return;
    for (let i = 0; i < 12; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        p.style.background = color;
        const angle = (Math.PI * 2 * i) / 12;
        const dist = 40 + Math.random() * 60;
        p.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
        p.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
        container.appendChild(p);
        setTimeout(() => p.remove(), 700);
    }
}

// ====== Toast ======
function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// ====== HUD Update ======
function updateHUD() {
    document.querySelector('.pill.steps').textContent = `🦶 ${playerStats.steps.toLocaleString('ru')}`;
    document.querySelector('.pill.coins').textContent = `🪙 ${playerStats.coins}`;
    document.querySelector('.pill.crystals').textContent = `💎 ${playerStats.crystals}`;
    document.querySelector('.prestige').textContent = `⭐ ${playerStats.prestige.toLocaleString('ru')}`;
}

// ====== Profile Stats ======
function updateProfileStats() {
    const vals = document.querySelectorAll('.stat-value');
    if (vals.length >= 4) {
        vals[0].textContent = playerStats.steps.toLocaleString('ru');
        vals[1].textContent = playerStats.prestige.toLocaleString('ru');
        vals[2].textContent = playerStats.collected;
        vals[3].textContent = `#${computePlayerRank()}`;
    }
    const invScroll = document.querySelector('.inventory-scroll');
    if (invScroll) {
        invScroll.innerHTML = `
            <div class="inv-item"><span class="inv-emoji">🗡️</span> <span>x${playerStats.inventory.power}</span></div>
            <div class="inv-item"><span class="inv-emoji">🧱</span> <span>x${playerStats.inventory.build}</span></div>
            <div class="inv-item"><span class="inv-emoji">💎</span> <span>x${playerStats.inventory.rare}</span></div>
            <div class="inv-item"><span class="inv-emoji">🪙</span> <span>${playerStats.coins}</span></div>
        `;
    }
}

function computePlayerRank() {
    const allScores = RANKING_DATA.all.podium.map(p => p.score)
        .concat(RANKING_DATA.all.list.map(p => p.score));
    return allScores.filter(s => s > playerStats.prestige).length + 1;
}

// ====== Stealth ======
function initStealth() {
    const btn = document.querySelector('.btn-stealth');
    btn.addEventListener('click', () => {
        isStealthMode = !isStealthMode;
        btn.textContent = isStealthMode ? '🙈' : '👁';
        btn.classList.toggle('stealth-active', isStealthMode);
        npcElements.forEach(item => {
            item.el.style.opacity = isStealthMode ? '0.2' : '0.7';
        });
        const profileToggle = document.querySelector('.setting-item input[type="checkbox"]');
        if (profileToggle) profileToggle.checked = isStealthMode;
    });
    const profileToggle = document.querySelector('.setting-item input[type="checkbox"]');
    if (profileToggle) {
        profileToggle.addEventListener('change', e => {
            isStealthMode = e.target.checked;
            const btn2 = document.querySelector('.btn-stealth');
            btn2.textContent = isStealthMode ? '🙈' : '👁';
            btn2.classList.toggle('stealth-active', isStealthMode);
        });
    }
}

// ====== Ranking Filters ======
function initRankingFilters() {
    const filters = document.querySelectorAll('.filter');
    const keys = ['all', 'week', 'today'];
    filters.forEach((btn, i) => {
        btn.addEventListener('click', () => {
            filters.forEach(f => f.classList.remove('active'));
            btn.classList.add('active');
            renderRanking(keys[i]);
            SoundFX.play('tab');
        });
    });
}

function renderRanking(period) {
    const data = RANKING_DATA[period];
    const podiumItems = document.querySelectorAll('.podium-item');
    const podiumOrder = [1, 0, 2];
    podiumItems.forEach((item, idx) => {
        const p = data.podium[podiumOrder[idx]];
        if (p) {
            item.querySelector('.avatar').src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.seed}`;
            item.querySelector('.name').textContent = p.name;
            item.querySelector('.score').textContent = `⭐ ${p.score.toLocaleString('ru')}`;
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
    const list = document.querySelector('.ranking-list');
    if (!list || !data.list) return;
    list.innerHTML = data.list.map((p, i) => {
        const cls = p.isPlayer ? 'is-player' : '';
        return `<div class="rank-row ${cls}">
            <span class="rank-place">${i + 4}</span>
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}" class="rank-avatar" alt="">
            <span class="rank-name">${p.name}</span>
            <span class="rank-score">⭐ ${p.score.toLocaleString('ru')}</span>
        </div>`;
    }).join('');
}

// ====== Upgrade Modal ======
function initUpgradeModal() {
    const btn = document.querySelector('#screen-base .btn-primary');
    if (btn) btn.addEventListener('click', showUpgradeModal);
}

function showUpgradeModal() {
    const modal = document.getElementById('upgrade-modal');
    if (!modal) return;
    modal.classList.add('open');
    document.getElementById('upgrade-overlay').classList.add('active');

    let seconds = 10;
    const timerEl = document.getElementById('upgrade-timer');
    const progressEl = document.getElementById('upgrade-progress-fill');
    const btnStart = document.getElementById('btn-start-upgrade');
    const btnClose = document.getElementById('btn-close-upgrade');

    timerEl.textContent = `${seconds} сек`;
    progressEl.style.width = '0%';
    btnStart.disabled = false;
    btnStart.textContent = 'Начать улучшение (🪙 100)';

    btnStart.onclick = () => {
        if (playerStats.coins < 100) { btnStart.textContent = 'Не хватает монет!'; return; }
        playerStats.coins -= 100;
        updateHUD();
        btnStart.disabled = true;
        btnStart.textContent = 'Улучшение...';
        SoundFX.play('upgrade');
        const interval = setInterval(() => {
            seconds--;
            timerEl.textContent = `${seconds} сек`;
            progressEl.style.width = `${((10 - seconds) / 10) * 100}%`;
            if (seconds <= 0) {
                clearInterval(interval);
                timerEl.textContent = 'Готово! ✅';
                btnStart.textContent = 'Улучшено!';
                const baseLvl = document.querySelector('#screen-base .badge');
                const lv = parseInt(baseLvl.textContent.replace('Ур. ', '')) || 3;
                baseLvl.textContent = `Ур. ${lv + 1}`;
                playerStats.prestige += 50;
                updateHUD();
                showToast('🏠 Квартира улучшена! +50 престижа');
            }
        }, 1000);
    };
    const closeModal = () => {
        modal.classList.remove('open');
        document.getElementById('upgrade-overlay').classList.remove('active');
    };
    btnClose.onclick = closeModal;
    document.getElementById('upgrade-overlay').onclick = closeModal;
}

// ====== Chat ======
function initChat() {
    const chatToggle = document.getElementById('chat-toggle');
    const chatPanel = document.getElementById('chat-panel');
    const chatClose = document.getElementById('chat-close');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    if (!chatToggle) return;

    chatToggle.addEventListener('click', () => chatPanel.classList.toggle('open'));
    chatClose.addEventListener('click', () => chatPanel.classList.remove('open'));

    [
        { name: 'Дмитрий', text: 'Кто-нибудь видел редкий артефакт у прудов?', time: '20:15' },
        { name: 'Анна', text: 'Да, я нашла Корону Очаково!', time: '20:18' },
        { name: 'Сергей', text: 'Круто! Я около МЦД, тут куча строительных', time: '20:20' },
        { name: 'Елена', text: 'Кто хочет в клан? Набираем людей 💪', time: '20:24' },
    ].forEach(m => addChatMessage(m.name, m.text, m.time, false));

    const sendMsg = () => {
        const text = chatInput.value.trim();
        if (!text) return;
        const now = new Date();
        addChatMessage('Игрок1', text, `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`, true);
        chatInput.value = '';
        document.getElementById('chat-messages').scrollTop = 99999;
    };
    chatSend.addEventListener('click', sendMsg);
    chatInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendMsg(); });
}

function addChatMessage(name, text, time, isOwn) {
    const el = document.getElementById('chat-messages');
    if (!el) return;
    const div = document.createElement('div');
    div.className = `chat-msg ${isOwn ? 'own' : ''}`;
    div.innerHTML = `<div class="chat-msg-header"><span class="chat-name">${name}</span><span class="chat-time">${time}</span></div><div class="chat-text">${text}</div>`;
    el.appendChild(div);
}

// ====== Splash & Onboarding ======
function initSplash() {
    const splash = document.getElementById('screen-splash');
    if (!splash) return;
    const bar = splash.querySelector('.splash-progress-fill');
    if (bar) setTimeout(() => bar.style.width = '100%', 100);
    setTimeout(() => {
        splash.classList.add('fade-out');
        setTimeout(() => { splash.style.display = 'none'; showOnboarding(); }, 500);
    }, 2500);
}

function showOnboarding() {
    const ob = document.getElementById('screen-onboarding');
    if (!ob) return;
    ob.style.display = 'flex';
    let cur = 0;
    const slides = ob.querySelectorAll('.onboarding-slide');
    const dots = ob.querySelectorAll('.dot');
    const btn = ob.querySelector('.btn-onboarding-next');
    const show = idx => {
        slides.forEach((s, i) => s.classList.toggle('active', i === idx));
        dots.forEach((d, i) => d.classList.toggle('active', i === idx));
        btn.textContent = idx === slides.length - 1 ? 'Начать' : 'Далее';
    };
    show(0);
    btn.addEventListener('click', () => {
        cur++;
        if (cur >= slides.length) {
            ob.classList.add('fade-out');
            setTimeout(() => { ob.style.display = 'none'; }, 500);
        } else show(cur);
    });
}

// Start
document.addEventListener('DOMContentLoaded', initApp);
