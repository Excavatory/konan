const OCHAKOVO_CENTER = [55.6983, 37.4582];
const STORAGE_KEY = 'konan-crown-v3';
const MAX_ARTIFACTS = 8;
const ARTIFACT_SCAN_RADIUS_METERS = 120;
const DISTANCE_TO_COLLECT_METERS = 20;
const AUTO_COLLECT_RADIUS_METERS = 10;
const UPGRADE_COST = 100;
const UPGRADE_DURATION_MS = 10_000;
const MAX_CHAT_MESSAGES = 30;
const REMOTE_SYNC_DEBOUNCE_MS = 1200;
const DEBUG_MODE = new URLSearchParams(window.location.search).get('debug') === '1';

const DISTRICT_BOUNDS = [
    [55.7080, 37.4280], [55.7095, 37.4420], [55.7090, 37.4580],
    [55.7060, 37.4720], [55.7030, 37.4820], [55.6980, 37.4880],
    [55.6920, 37.4860], [55.6880, 37.4780], [55.6860, 37.4620],
    [55.6870, 37.4450], [55.6900, 37.4320], [55.6950, 37.4250],
    [55.7010, 37.4230], [55.7050, 37.4250]
];

const ARTIFACT_TYPES = {
    power: { icon: '🗡️', type: 'Силовой артефакт', bonus: '+20 Атаки', class: 'type-power', color: '#ef4444', resource: 'coins', amount: 25, prestige: 30, progress: 10 },
    build: { icon: '🧱', type: 'Строительный артефакт', bonus: '+15 к Строительству', class: 'type-build', color: '#f59e0b', resource: 'coins', amount: 15, prestige: 20, progress: 8 },
    rare: { icon: '💎', type: 'Редкий артефакт', bonus: '+150 Престижа', class: 'type-rare', color: '#7c3aed', resource: 'crystals', amount: 1, prestige: 150, progress: 35 }
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

const RANKING_BASE = {
    all: [
        { name: 'King', seed: 'King', score: 3500 },
        { name: 'Alex', seed: 'Alex', score: 2100 },
        { name: 'Max', seed: 'Max', score: 1800 },
        { name: 'Дмитрий', seed: 'Dmitry', score: 1650 },
        { name: 'Анна', seed: 'Anna', score: 1500 },
        { name: 'Сергей', seed: 'Sergey', score: 1420 },
        { name: 'Елена', seed: 'Elena', score: 1380 },
        { name: 'Артём', seed: 'Artem', score: 1300 },
        { name: 'Ольга', seed: 'Olga', score: 1280 },
        { name: 'Николай', seed: 'Nikolay', score: 1260 },
        { name: 'Мария', seed: 'Maria', score: 1200 },
        { name: 'Павел', seed: 'Pavel', score: 1150 },
        { name: 'Ирина', seed: 'Irina', score: 1100 },
        { name: 'Владимир', seed: 'Vladimir', score: 1050 },
        { name: 'Татьяна', seed: 'Tatyana', score: 980 },
        { name: 'Алексей', seed: 'Aleksey', score: 920 }
    ],
    week: [
        { name: 'Alex', seed: 'Alex', score: 820 },
        { name: 'Анна', seed: 'Anna2', score: 540 },
        { name: 'Сергей', seed: 'Sergey2', score: 480 },
        { name: 'Дмитрий', seed: 'Dmitry2', score: 420 },
        { name: 'Max', seed: 'Max', score: 380 },
        { name: 'Елена', seed: 'Elena2', score: 350 },
        { name: 'Артём', seed: 'Artem2', score: 310 },
        { name: 'King', seed: 'King2', score: 290 },
        { name: 'Ольга', seed: 'Olga2', score: 260 },
        { name: 'Николай', seed: 'Nikolay2', score: 230 },
        { name: 'Мария', seed: 'Maria2', score: 200 },
        { name: 'Павел', seed: 'Pavel2', score: 170 }
    ],
    today: [
        { name: 'Сергей', seed: 'Sergey', score: 150 },
        { name: 'Елена', seed: 'Elena3', score: 120 },
        { name: 'Alex', seed: 'Alex', score: 100 },
        { name: 'Дмитрий', seed: 'Dmitry3', score: 85 },
        { name: 'Анна', seed: 'Anna3', score: 70 },
        { name: 'Max', seed: 'Max3', score: 55 },
        { name: 'Артём', seed: 'Artem3', score: 40 },
        { name: 'King', seed: 'King3', score: 30 }
    ]
};

const DEFAULT_CHAT_MESSAGES = [
    { name: 'Дмитрий', text: 'Кто-нибудь видел редкий артефакт у прудов?', time: '20:15', own: false },
    { name: 'Анна', text: 'Да, я нашла Корону Очаково!', time: '20:18', own: false },
    { name: 'Сергей', text: 'Круто! Я около МЦД, тут куча строительных.', time: '20:20', own: false },
    { name: 'Елена', text: 'Кто хочет в клан? Набираем людей 💪', time: '20:24', own: false }
];

const AMBIENT_CHAT_POOL = [
    { name: 'Анна', text: 'Сканер снова пищит у парка, проверьте северную часть района.' },
    { name: 'Дмитрий', text: 'После полуночи редкие артефакты появляются чаще.' },
    { name: 'Сергей', text: 'У МЦД сегодня особенно много строительных находок.' },
    { name: 'Елена', text: 'Если включить невидимку, NPC почти не мешают маршруту.' }
];

const BASE_SLOT_LIBRARY = [
    { icon: '🛋️', label: 'Диван' },
    { icon: '📺', label: 'ТВ' },
    { icon: '🪑', label: 'Стол' },
    { icon: '🛏️', label: 'Кровать' },
    { icon: '🪴', label: 'Оранжерея' },
    { icon: '🧰', label: 'Мастерская' }
];

const SoundFX = {
    ctx: null,
    init() {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
            return;
        }

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;

        try {
            this.ctx = new AudioCtx();
        } catch (error) {
            this.ctx = null;
        }
    },
    play(type) {
        this.init();
        if (!this.ctx) return;

        const ctx = this.ctx;
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        switch (type) {
            case 'collect':
                oscillator.frequency.setValueAtTime(600, ctx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.3);
                break;
            case 'spawn':
                oscillator.frequency.setValueAtTime(400, ctx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.2);
                break;
            case 'step':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(200, ctx.currentTime);
                gain.gain.setValueAtTime(0.05, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.08);
                break;
            case 'upgrade':
                oscillator.frequency.setValueAtTime(500, ctx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.3);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.4);
                break;
            case 'tab':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(800, ctx.currentTime);
                gain.gain.setValueAtTime(0.05, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.06);
                break;
            default:
                oscillator.disconnect();
                gain.disconnect();
        }
    }
};

let gameState = loadGameState();
let playerStats = gameState.player.stats;
let playerPos = [...gameState.player.position];
let artifacts = gameState.artifacts.map(hydrateArtifact);
let map;
let playerMarker;
let accuracyCircle;
let artifactMarkers = new Map();
let npcMarkers = [];
let currentOpenArtifact = null;
let currentRankingPeriod = gameState.ui.rankingFilter;
let isStealthMode = Boolean(gameState.settings.stealth);
let geoWatchId = null;
let autoWalkInterval = null;
let npcMoveInterval = null;
let upgradeTicker = null;
let ambientChatInterval = null;
let persistTimer = null;
let remoteSyncTimer = null;
let remoteSyncInFlight = false;
let remoteSyncQueued = false;
let newArtifactPing = false;
let playerZoneStatus = isPointInDistrict(playerPos) ? 'inside' : 'outside';
let authState = {
    ready: false,
    authenticated: false,
    user: null,
    mode: 'register',
    syncStatus: 'local',
    lastSyncedAt: null
};
let dom = {};

function createDefaultState() {
    const now = new Date().toISOString();
    return {
        meta: {
            schemaVersion: 2,
            updatedAt: now,
            lastSyncedAt: null,
            userId: null
        },
        player: {
            name: 'Игрок1',
            avatarSeed: 'King',
            level: 12,
            levelProgress: 80,
            position: [...OCHAKOVO_CENTER],
            stats: {
                steps: 2347,
                coins: 580,
                crystals: 12,
                prestige: 1240,
                collected: 87,
                inventory: { power: 5, build: 12, rare: 2 }
            }
        },
        base: {
            level: 3,
            progress: 60,
            resources: { brick: 24, wood: 10, gears: 6 },
            slots: BASE_SLOT_LIBRARY.map((slot, index) => (index < 3 ? { ...slot } : null)),
            upgrade: { endAt: null, startedAt: null }
        },
        settings: {
            stealth: false,
            onboardingCompleted: false,
            movementMode: 'pending'
        },
        ui: {
            activeScreen: 'screen-map',
            rankingFilter: 'all',
            chatOpen: false
        },
        artifacts: createInitialArtifacts(),
        messages: DEFAULT_CHAT_MESSAGES.map(item => ({ ...item }))
    };
}

function loadGameState() {
    return hydrateGameState(safeParseJSON(localStorage.getItem(STORAGE_KEY)));
}

function hydrateGameState(raw) {
    const defaults = createDefaultState();
    if (!raw) return defaults;

    const merged = {
        meta: {
            ...defaults.meta,
            ...(raw.meta || {})
        },
        player: {
            ...defaults.player,
            ...raw.player,
            stats: {
                ...defaults.player.stats,
                ...(raw.player?.stats || {}),
                inventory: {
                    ...defaults.player.stats.inventory,
                    ...(raw.player?.stats?.inventory || {})
                }
            },
            position: normalizePosition(raw.player?.position, defaults.player.position)
        },
        base: {
            ...defaults.base,
            ...raw.base,
            resources: {
                ...defaults.base.resources,
                ...(raw.base?.resources || {})
            },
            slots: normalizeBaseSlots(raw.base?.slots, defaults.base.slots),
            upgrade: {
                ...defaults.base.upgrade,
                ...(raw.base?.upgrade || {})
            }
        },
        settings: {
            ...defaults.settings,
            ...(raw.settings || {})
        },
        ui: {
            ...defaults.ui,
            ...(raw.ui || {})
        },
        artifacts: normalizeArtifacts(raw.artifacts, defaults.artifacts),
        messages: normalizeMessages(raw.messages, defaults.messages)
    };

    return merged;
}

function commitGameState(nextState) {
    gameState = hydrateGameState(nextState);
    playerStats = gameState.player.stats;
    playerPos = [...gameState.player.position];
    artifacts = gameState.artifacts.map(hydrateArtifact);
    currentRankingPeriod = gameState.ui.rankingFilter;
    isStealthMode = Boolean(gameState.settings.stealth);
    playerZoneStatus = isPointInDistrict(playerPos) ? 'inside' : 'outside';
}

function safeParseJSON(value) {
    if (!value) return null;
    try {
        return JSON.parse(value);
    } catch (error) {
        return null;
    }
}

function normalizePosition(value, fallback) {
    if (!Array.isArray(value) || value.length !== 2) return [...fallback];
    const lat = Number(value[0]);
    const lng = Number(value[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [...fallback];
    return [lat, lng];
}

function normalizeBaseSlots(value, fallback) {
    if (!Array.isArray(value)) return fallback.map(slot => (slot ? { ...slot } : null));
    const normalized = value.slice(0, BASE_SLOT_LIBRARY.length).map(slot => {
        if (!slot || typeof slot !== 'object') return null;
        return {
            icon: typeof slot.icon === 'string' ? slot.icon : '✨',
            label: typeof slot.label === 'string' ? slot.label : 'Модуль'
        };
    });

    while (normalized.length < BASE_SLOT_LIBRARY.length) normalized.push(null);
    return normalized;
}

function normalizeArtifacts(value, fallback) {
    if (!Array.isArray(value)) return fallback.map(item => ({ ...item, coords: [...item.coords] }));
    return value
        .slice(0, MAX_ARTIFACTS)
        .map(item => {
            if (!item || typeof item !== 'object') return null;
            if (!ARTIFACT_TYPES[item.typeKey]) return null;
            return {
                id: typeof item.id === 'string' ? item.id : createArtifactId(),
                typeKey: item.typeKey,
                name: typeof item.name === 'string' ? item.name : pickArtifactName(item.typeKey),
                coords: normalizePosition(item.coords, OCHAKOVO_CENTER),
                createdAt: Number.isFinite(item.createdAt) ? item.createdAt : Date.now()
            };
        })
        .filter(Boolean);
}

function normalizeMessages(value, fallback) {
    const source = Array.isArray(value) && value.length ? value : fallback;
    return source.slice(-MAX_CHAT_MESSAGES).map(item => ({
        name: typeof item.name === 'string' ? item.name.slice(0, 24) : 'Игрок',
        text: typeof item.text === 'string' ? item.text.slice(0, 160) : '',
        time: typeof item.time === 'string' ? item.time : formatTime(new Date()),
        own: Boolean(item.own)
    }));
}

function createInitialArtifacts() {
    return Array.from({ length: 3 }, () => createArtifactRecord(OCHAKOVO_CENTER));
}

function createArtifactRecord(anchor = OCHAKOVO_CENTER, typeKey) {
    const chosenType = typeKey || pickRandomTypeKey();
    return {
        id: createArtifactId(),
        typeKey: chosenType,
        name: pickArtifactName(chosenType),
        coords: createRandomSpawnPoint(anchor),
        createdAt: Date.now()
    };
}

function hydrateArtifact(record) {
    const typeData = ARTIFACT_TYPES[record.typeKey];
    return {
        ...record,
        coords: normalizePosition(record.coords, OCHAKOVO_CENTER),
        typeData: {
            ...typeData,
            name: record.name || pickArtifactName(record.typeKey)
        }
    };
}

function dehydrateArtifact(artifact) {
    return {
        id: artifact.id,
        typeKey: artifact.typeKey,
        name: artifact.typeData?.name || artifact.name || pickArtifactName(artifact.typeKey),
        coords: [...artifact.coords],
        createdAt: artifact.createdAt
    };
}

function createArtifactId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `artifact-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function pickArtifactName(typeKey) {
    const pool = ARTIFACT_NAMES[typeKey] || ['Неизвестный артефакт'];
    return pool[Math.floor(Math.random() * pool.length)];
}

function pickRandomTypeKey() {
    const types = Object.keys(ARTIFACT_TYPES);
    return types[Math.floor(Math.random() * types.length)];
}

function createRandomSpawnPoint(anchor = OCHAKOVO_CENTER) {
    const base = isPointInDistrict(anchor) ? anchor : OCHAKOVO_CENTER;

    for (let index = 0; index < 40; index += 1) {
        const candidate = [
            base[0] + (Math.random() - 0.5) * 0.004,
            base[1] + (Math.random() - 0.5) * 0.004
        ];
        if (isPointInDistrict(candidate)) return candidate;
    }

    for (let index = 0; index < 40; index += 1) {
        const candidate = [
            OCHAKOVO_CENTER[0] + (Math.random() - 0.5) * 0.01,
            OCHAKOVO_CENTER[1] + (Math.random() - 0.5) * 0.01
        ];
        if (isPointInDistrict(candidate)) return candidate;
    }

    return [...OCHAKOVO_CENTER];
}

function isPointInDistrict(coords) {
    const x = coords[1];
    const y = coords[0];
    let inside = false;

    for (let index = 0, previous = DISTRICT_BOUNDS.length - 1; index < DISTRICT_BOUNDS.length; previous = index, index += 1) {
        const xi = DISTRICT_BOUNDS[index][1];
        const yi = DISTRICT_BOUNDS[index][0];
        const xj = DISTRICT_BOUNDS[previous][1];
        const yj = DISTRICT_BOUNDS[previous][0];
        const intersects = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-9) + xi);
        if (intersects) inside = !inside;
    }

    return inside;
}

function cacheDom() {
    dom = {
        tabs: Array.from(document.querySelectorAll('.tab')),
        screens: Array.from(document.querySelectorAll('.screen')),
        sheetOverlay: document.getElementById('sheet-overlay'),
        artifactSheet: document.getElementById('artifact-sheet'),
        artifactIcon: document.getElementById('artifact-icon'),
        artifactTitle: document.getElementById('artifact-title'),
        artifactType: document.getElementById('artifact-type'),
        artifactBonus: document.getElementById('artifact-bonus'),
        artifactDistanceValue: document.getElementById('artifact-distance-value'),
        collectBtn: document.getElementById('btn-collect'),
        scannerBtn: document.getElementById('btn-scanner'),
        eventBtn: document.getElementById('btn-event'),
        mapStatus: document.getElementById('map-status'),
        mapRoot: document.getElementById('map'),
        mapFallback: document.getElementById('map-fallback'),
        hudSteps: document.querySelector('.pill.steps'),
        hudCoins: document.querySelector('.pill.coins'),
        hudCrystals: document.querySelector('.pill.crystals'),
        hudPrestige: document.querySelector('.prestige'),
        hudDock: document.querySelector('.hud-bottom-dock'),
        topAvatar: document.getElementById('top-avatar'),
        topPlayerName: document.getElementById('top-player-name'),
        topLevelBadge: document.getElementById('top-level-badge'),
        profileAvatar: document.getElementById('profile-avatar'),
        profileName: document.getElementById('profile-name'),
        profileLevelLabel: document.getElementById('profile-level-label'),
        profileLevelProgress: document.getElementById('profile-level-progress'),
        profileStatValues: Array.from(document.querySelectorAll('.stat-value')),
        inventory: document.querySelector('.inventory-scroll'),
        stealthBtn: document.querySelector('.btn-stealth'),
        stealthToggle: document.querySelector('.setting-item input[type="checkbox"]'),
        rankingFilters: Array.from(document.querySelectorAll('.filter')),
        podiumItems: Array.from(document.querySelectorAll('.podium-item')),
        rankingList: document.querySelector('.ranking-list'),
        baseBadge: document.getElementById('base-level-badge'),
        baseProgress: document.getElementById('base-progress-fill'),
        baseView: document.getElementById('base-view'),
        baseResources: document.getElementById('base-resources'),
        upgradeModal: document.getElementById('upgrade-modal'),
        upgradeOverlay: document.getElementById('upgrade-overlay'),
        upgradeTimer: document.getElementById('upgrade-timer'),
        upgradeProgress: document.getElementById('upgrade-progress-fill'),
        upgradeStartBtn: document.getElementById('btn-start-upgrade'),
        upgradeCloseBtn: document.getElementById('btn-close-upgrade'),
        baseUpgradeBtn: document.getElementById('btn-open-upgrade'),
        chatToggle: document.getElementById('chat-toggle'),
        chatPanel: document.getElementById('chat-panel'),
        chatClose: document.getElementById('chat-close'),
        chatMessages: document.getElementById('chat-messages'),
        chatInput: document.getElementById('chat-input'),
        chatSend: document.getElementById('chat-send'),
        splash: document.getElementById('screen-splash'),
        onboarding: document.getElementById('screen-onboarding'),
        onboardingSlides: Array.from(document.querySelectorAll('.onboarding-slide')),
        onboardingDots: Array.from(document.querySelectorAll('.dot')),
        onboardingBtn: document.querySelector('.btn-onboarding-next'),
        devControls: document.querySelector('.dev-controls'),
        devStepBtn: document.getElementById('dev-sim-step'),
        devSpawnBtn: document.getElementById('dev-spawn-art'),
        devAutoBtn: document.getElementById('dev-auto-walk'),
        accountTitle: document.getElementById('account-title'),
        accountDesc: document.getElementById('account-desc'),
        accountMeta: document.getElementById('account-meta'),
        openRegisterBtn: document.getElementById('btn-open-register'),
        openLoginBtn: document.getElementById('btn-open-login'),
        logoutBtn: document.getElementById('btn-logout'),
        authModal: document.getElementById('auth-modal'),
        authOverlay: document.getElementById('auth-overlay'),
        authClose: document.getElementById('auth-close'),
        authHeading: document.getElementById('auth-heading'),
        authHint: document.getElementById('auth-hint'),
        authForm: document.getElementById('auth-form'),
        authNameField: document.getElementById('auth-name-field'),
        authName: document.getElementById('auth-name'),
        authEmail: document.getElementById('auth-email'),
        authPassword: document.getElementById('auth-password'),
        authError: document.getElementById('auth-error'),
        authSubmit: document.getElementById('auth-submit'),
        authModeButtons: Array.from(document.querySelectorAll('[data-auth-mode]')),
        editProfileBtn: document.getElementById('btn-edit-profile'),
        settingsBtn: document.getElementById('btn-settings'),
        particles: document.getElementById('particles-container')
    };
}

async function initApp() {
    cacheDom();
    prepareShell();
    await restoreSession();
    initNavigation();
    initBottomSheet();
    initRankingFilters();
    initProfileControls();
    initUpgradeModal();
    initChat();
    initAuthUI();
    initStealth();
    initUtilityButtons();
    initMap();
    if (DEBUG_MODE) initSimulation();
    applyStateToUI();
    initSplash();
    ensureUpgradeTicker();
    startAmbientChat();
    registerServiceWorker();
    bindLifecycleEvents();

    document.addEventListener('pointerdown', () => SoundFX.init(), { once: true });
}

function prepareShell() {
    if (dom.devControls) dom.devControls.hidden = !DEBUG_MODE;
}

async function restoreSession() {
    try {
        const data = await apiRequest('/api/auth/me', { suppressErrors: true });
        if (data?.authenticated && data?.user && data?.state) {
            authState.ready = true;
            authState.authenticated = true;
            authState.user = data.user;
            authState.syncStatus = 'synced';
            authState.lastSyncedAt = data.state.meta?.lastSyncedAt || null;
            commitGameState(data.state);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
            return;
        }
    } catch (error) {
        console.info('Сессия не восстановлена:', error.message);
    }

    authState.ready = true;
    authState.authenticated = false;
    authState.user = null;
    authState.syncStatus = 'local';
}

function initAuthUI() {
    dom.openRegisterBtn.addEventListener('click', () => openAuthModal('register'));
    dom.openLoginBtn.addEventListener('click', () => openAuthModal('login'));
    dom.logoutBtn.addEventListener('click', logoutUser);
    dom.authClose.addEventListener('click', closeAuthModal);
    dom.authOverlay.addEventListener('click', closeAuthModal);
    dom.authForm.addEventListener('submit', submitAuthForm);
    dom.authModeButtons.forEach(button => {
        button.addEventListener('click', () => setAuthMode(button.dataset.authMode));
    });

    renderAuthUI();
}

function renderAuthUI() {
    if (!dom.accountTitle) return;

    if (authState.authenticated && authState.user) {
        dom.accountTitle.textContent = authState.user.name;
        dom.accountDesc.textContent = authState.user.email;
        dom.accountMeta.textContent = getSyncMetaLabel();
        dom.openRegisterBtn.hidden = true;
        dom.openLoginBtn.hidden = true;
        dom.logoutBtn.hidden = false;
    } else {
        dom.accountTitle.textContent = 'Гостевой режим';
        dom.accountDesc.textContent = 'Создай аккаунт, чтобы прогресс и инвентарь восстанавливались на любом устройстве.';
        dom.accountMeta.textContent = authState.syncStatus === 'error'
            ? 'Сервер временно недоступен. Игра продолжает сохраняться локально.'
            : 'Пока прогресс хранится только на этом устройстве.';
        dom.openRegisterBtn.hidden = false;
        dom.openLoginBtn.hidden = false;
        dom.logoutBtn.hidden = true;
    }

    setAuthMode(authState.mode, false);
}

function getSyncMetaLabel() {
    if (authState.syncStatus === 'syncing') return 'Сохраняем прогресс на сервер…';
    if (authState.syncStatus === 'pending') return 'Есть локальные изменения. Готовим синхронизацию…';
    if (authState.syncStatus === 'error') return 'Не удалось синхронизировать последнее изменение. Локальная копия сохранена.';
    if (authState.lastSyncedAt) {
        return `Синхронизировано: ${new Date(authState.lastSyncedAt).toLocaleString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit'
        })}`;
    }
    return 'Аккаунт подключён.';
}

function setAuthMode(mode, clearError = true) {
    authState.mode = mode === 'login' ? 'login' : 'register';
    const isRegister = authState.mode === 'register';

    dom.authModeButtons.forEach(button => button.classList.toggle('active', button.dataset.authMode === authState.mode));
    dom.authNameField.hidden = !isRegister;
    dom.authHeading.textContent = isRegister ? 'Создать аккаунт' : 'Войти в аккаунт';
    dom.authSubmit.textContent = isRegister ? 'Создать аккаунт' : 'Войти';
    dom.authHint.textContent = isRegister
        ? 'Текущий локальный прогресс будет привязан к аккаунту и начнёт синхронизироваться с сервером.'
        : 'Если на этом устройстве уже есть локальный прогресс, мы аккуратно подтянем его в аккаунт при входе.';

    if (clearError) setAuthError('');
}

function openAuthModal(mode) {
    setAuthMode(mode);
    dom.authName.value = gameState.player.name || '';
    dom.authEmail.value = authState.user?.email || '';
    dom.authPassword.value = '';
    dom.authModal.classList.add('open');
    dom.authOverlay.classList.add('active');
}

function closeAuthModal() {
    dom.authModal.classList.remove('open');
    dom.authOverlay.classList.remove('active');
    setAuthError('');
    dom.authPassword.value = '';
}

function setAuthError(message) {
    if (!message) {
        dom.authError.hidden = true;
        dom.authError.textContent = '';
        return;
    }

    dom.authError.hidden = false;
    dom.authError.textContent = message;
}

async function submitAuthForm(event) {
    event.preventDefault();
    setAuthError('');

    const isRegister = authState.mode === 'register';
    const email = dom.authEmail.value.trim();
    const password = dom.authPassword.value;
    const name = dom.authName.value.trim() || gameState.player.name;

    if (isRegister && name.length < 2) {
        setAuthError('Имя игрока должно содержать минимум 2 символа.');
        return;
    }

    dom.authSubmit.disabled = true;

    try {
        const payload = isRegister
            ? { email, password, name, state: cloneGameStateForNetwork() }
            : { email, password, localState: cloneGameStateForNetwork() };
        const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
        const data = await apiRequest(endpoint, { method: 'POST', body: payload });
        handleAuthSuccess(data);
        closeAuthModal();
        showToast(isRegister ? '🔐 Аккаунт создан и прогресс привязан.' : '🔐 Вход выполнен.');
    } catch (error) {
        setAuthError(error.message || 'Не удалось выполнить запрос.');
    } finally {
        dom.authSubmit.disabled = false;
    }
}

function handleAuthSuccess(data) {
    authState.ready = true;
    authState.authenticated = true;
    authState.user = data.user;
    authState.syncStatus = 'synced';
    authState.lastSyncedAt = data.state?.meta?.lastSyncedAt || new Date().toISOString();
    commitGameState(data.state);
    refreshMapState();
    applyStateToUI();
    persistGameState({ skipRemoteSync: true });
}

async function logoutUser() {
    try {
        await apiRequest('/api/auth/logout', { method: 'POST', suppressErrors: true });
    } catch (error) {
        console.info('Logout fallback:', error.message);
    }

    authState.authenticated = false;
    authState.user = null;
    authState.syncStatus = 'local';
    authState.lastSyncedAt = null;
    renderAuthUI();
    persistGameState({ skipRemoteSync: true });
    showToast('👋 Аккаунт отключён. Игра продолжает сохраняться локально.');
}

function refreshMapState() {
    if (!map) return;

    if (playerMarker) playerMarker.setLatLng(playerPos);
    clearArtifactMarkers();
    renderArtifactsOnMap();
    map.panTo(playerPos, { animate: false });
    updateMapStatus();
}

function clearArtifactMarkers() {
    artifactMarkers.forEach(marker => {
        if (map) map.removeLayer(marker);
    });
    artifactMarkers.clear();
}

async function apiRequest(pathname, options = {}) {
    const response = await fetch(pathname, {
        method: options.method || 'GET',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
        },
        body: options.body ? JSON.stringify(options.body) : undefined
    });

    let data = null;
    try {
        data = await response.json();
    } catch (error) {
        data = null;
    }

    if (!response.ok) {
        const message = data?.error || 'Запрос завершился ошибкой.';
        if (!options.suppressErrors) throw new Error(message);
        throw new Error(message);
    }

    return data;
}

function bindLifecycleEvents() {
    window.addEventListener('beforeunload', persistGameState);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            persistGameState();
        } else if (map) {
            setTimeout(() => map.invalidateSize(), 100);
        }
    });

    window.addEventListener('online', () => showToast('🌐 Соединение восстановлено'));
    window.addEventListener('offline', () => showToast('📴 Вы офлайн. Последний прогресс сохранён'));
}

function initNavigation() {
    dom.tabs.forEach(tab => {
        tab.addEventListener('click', () => setActiveScreen(tab.dataset.target, true));
    });
}

function setActiveScreen(screenId, withSound, shouldPersist = true) {
    dom.tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.target === screenId));
    dom.screens.forEach(screen => screen.classList.toggle('active', screen.id === screenId));

    gameState.ui.activeScreen = screenId;
    if (screenId !== 'screen-map') dom.chatPanel.classList.remove('open');
    dom.chatToggle.hidden = screenId !== 'screen-map';

    if (screenId === 'screen-map' && map) setTimeout(() => map.invalidateSize(), 150);
    if (screenId === 'screen-profile') updateProfileStats();
    if (withSound) SoundFX.play('tab');

    if (shouldPersist) schedulePersist();
}

function initMap() {
    if (typeof window.L === 'undefined') {
        dom.mapFallback.hidden = false;
        setMapStatus('Карта не загрузилась. Проверьте подключение к сети.', 'warning');
        return;
    }

    map = L.map('map', { zoomControl: false, attributionControl: false }).setView(playerPos, 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
    }).addTo(map);

    L.polygon(DISTRICT_BOUNDS, {
        color: '#f5c842',
        weight: 2,
        opacity: 0.6,
        fillColor: '#f5c842',
        fillOpacity: 0.04,
        dashArray: '8, 6'
    }).addTo(map);

    playerMarker = L.marker(playerPos, {
        icon: L.divIcon({
            className: 'custom-icon',
            html: '<div class="player-marker">🏃‍♂️</div>',
            iconSize: [32, 32],
            iconAnchor: [16, 32]
        }),
        zIndexOffset: 1000
    }).addTo(map);

    renderArtifactsOnMap();
    spawnNPCs();
    map.on('click', handleMapClick);
    initGeolocation();
}

function initGeolocation() {
    if (!navigator.geolocation) {
        gameState.settings.movementMode = 'simulation';
        updateMapStatus();
        showToast('📍 Браузер без GPS. Включён демо-режим.');
        schedulePersist();
        return;
    }

    geoWatchId = navigator.geolocation.watchPosition(
        position => {
            const coords = [position.coords.latitude, position.coords.longitude];
            setMovementMode('live');
            updatePlayerPosition(coords, {
                animate: true,
                awardMovement: true,
                accuracy: position.coords.accuracy
            });
        },
        error => {
            console.info('GPS недоступен, включаем демо-режим:', error.message);
            setMovementMode('simulation');
            showToast('📍 GPS недоступен. Тап по карте перемещает героя.');
        },
        {
            enableHighAccuracy: true,
            maximumAge: 3000,
            timeout: 10000
        }
    );
}

function handleMapClick(event) {
    const movementMode = gameState.settings.movementMode;
    if (movementMode !== 'simulation' && !DEBUG_MODE) return;

    const nextPos = [event.latlng.lat, event.latlng.lng];
    if (!isPointInDistrict(nextPos)) {
        showToast('🧭 Герой держится в границах района.');
        return;
    }

    updatePlayerPosition(nextPos, {
        animate: true,
        awardMovement: true,
        playStepSound: true
    });
}

function updatePlayerPosition(nextPos, options = {}) {
    const previousPos = [...playerPos];
    const distance = map ? L.latLng(previousPos).distanceTo(L.latLng(nextPos)) : 0;

    playerPos = [...nextPos];
    gameState.player.position = [...nextPos];
    playerZoneStatus = isPointInDistrict(nextPos) ? 'inside' : 'outside';

    if (playerMarker) playerMarker.setLatLng(playerPos);
    if (map && options.animate && gameState.ui.activeScreen === 'screen-map') {
        map.panTo(playerPos, { animate: true });
    }

    if (options.accuracy && map) {
        if (accuracyCircle) map.removeLayer(accuracyCircle);
        accuracyCircle = L.circle(playerPos, {
            radius: options.accuracy,
            color: '#7c3aed',
            fillColor: '#7c3aed',
            fillOpacity: 0.08,
            weight: 1,
            opacity: 0.3
        }).addTo(map);
    }

    if (options.awardMovement && playerZoneStatus === 'inside' && distance > 2) {
        playerStats.steps += Math.round(distance * 1.3);
        playerStats.coins += Math.max(1, Math.floor(distance / 20));
        if (options.playStepSound) SoundFX.play('step');
        updateHUD();
    }

    if (playerZoneStatus === 'inside' && Math.random() < 0.08 && artifacts.length < MAX_ARTIFACTS) {
        spawnArtifact({ announce: false });
    }

    checkDistanceToArtifacts();
    updateMapStatus();
    schedulePersist();
}

function setMovementMode(mode) {
    gameState.settings.movementMode = mode;
    updateMapStatus();
    schedulePersist();
}

function updateMapStatus() {
    if (!dom.mapStatus) return;

    let text = '';
    let tone = 'neutral';

    if (playerZoneStatus === 'outside') {
        text = 'Вы вне района. Артефакты активны только в Очаково-Матвеевском.';
        tone = 'warning';
    } else if (gameState.settings.movementMode === 'simulation') {
        text = 'Демо-режим: тап по карте перемещает героя.';
        tone = 'info';
    }

    dom.mapStatus.hidden = !text;
    dom.mapStatus.dataset.tone = tone;
    dom.mapStatus.textContent = text;
}

function renderArtifactsOnMap() {
    artifacts.forEach(artifact => createArtifactMarker(artifact));
    updateEventButtonState();
}

function createArtifactMarker(artifact) {
    if (!map || artifactMarkers.has(artifact.id)) return;

    const marker = L.marker(artifact.coords, {
        icon: L.divIcon({
            className: 'custom-icon',
            html: `<div class="artifact-marker ${artifact.typeData.class}">${artifact.typeData.icon}</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 28]
        })
    }).addTo(map);

    marker.on('click', () => openArtifactSheet(artifact));
    artifactMarkers.set(artifact.id, marker);
}

function spawnArtifact(options = {}) {
    if (!map) return null;
    if (artifacts.length >= MAX_ARTIFACTS) removeOldestArtifact();

    const anchor = options.anchor || playerPos;
    const record = createArtifactRecord(anchor, options.typeKey);
    const artifact = hydrateArtifact(record);

    artifacts.push(artifact);
    createArtifactMarker(artifact);

    if (options.announce !== false) {
        newArtifactPing = true;
        SoundFX.play('spawn');
        if (navigator.vibrate) navigator.vibrate(100);
    }

    updateEventButtonState();
    schedulePersist();
    if (options.openSheet) focusArtifact(artifact, true);
    return artifact;
}

function removeOldestArtifact() {
    if (!artifacts.length) return;
    const oldest = [...artifacts].sort((left, right) => left.createdAt - right.createdAt)[0];
    removeArtifact(oldest.id);
}

function removeArtifact(artifactId) {
    const marker = artifactMarkers.get(artifactId);
    if (marker && map) map.removeLayer(marker);
    artifactMarkers.delete(artifactId);
    artifacts = artifacts.filter(artifact => artifact.id !== artifactId);
    updateEventButtonState();
    schedulePersist();
}

function getNearestArtifact() {
    if (!artifacts.length || !map) return null;

    let nearest = null;

    artifacts.forEach(artifact => {
        const distance = L.latLng(playerPos).distanceTo(L.latLng(artifact.coords));
        if (!nearest || distance < nearest.distance) nearest = { artifact, distance };
    });

    return nearest;
}

function focusArtifact(artifact, shouldOpen) {
    if (!artifact || !map) return;
    map.panTo(artifact.coords, { animate: true });
    if (shouldOpen) openArtifactSheet(artifact);
}

function initBottomSheet() {
    if (!dom.sheetOverlay || !dom.artifactSheet || !dom.collectBtn) return;

    dom.sheetOverlay.addEventListener('click', closeArtifactSheet);
    dom.collectBtn.addEventListener('click', () => {
        if (!dom.collectBtn.classList.contains('disabled')) doCollect();
    });

    let startY = 0;

    dom.artifactSheet.addEventListener('touchstart', event => {
        startY = event.touches[0].clientY;
    });

    dom.artifactSheet.addEventListener('touchmove', event => {
        const delta = event.touches[0].clientY - startY;
        if (delta > 0) dom.artifactSheet.style.transform = `translateY(${delta}px)`;
    });

    dom.artifactSheet.addEventListener('touchend', event => {
        dom.artifactSheet.style.transform = '';
        if (event.changedTouches[0].clientY - startY > 50) closeArtifactSheet();
    });
}

function openArtifactSheet(artifact) {
    currentOpenArtifact = artifact.id;
    dom.artifactIcon.textContent = artifact.typeData.icon;
    dom.artifactIcon.className = 'artifact-icon-large spin';
    dom.artifactTitle.textContent = artifact.typeData.name;
    dom.artifactType.textContent = artifact.typeData.type;
    dom.artifactType.style.color = artifact.typeData.color;
    dom.artifactBonus.textContent = artifact.typeData.bonus;
    updateDistanceUI(distanceToArtifact(artifact));
    dom.artifactSheet.classList.add('open');
    dom.sheetOverlay.classList.add('active');
    newArtifactPing = false;
    updateEventButtonState();
}

function updateDistanceUI(distance) {
    dom.artifactDistanceValue.textContent = `${Math.round(distance)} м`;

    if (distance < DISTANCE_TO_COLLECT_METERS) {
        dom.collectBtn.classList.remove('disabled');
        dom.collectBtn.textContent = 'Подобрать';
    } else {
        dom.collectBtn.classList.add('disabled');
        dom.collectBtn.textContent = 'Подойдите ближе (< 20 м)';
    }
}

function closeArtifactSheet() {
    dom.artifactSheet.classList.remove('open');
    dom.sheetOverlay.classList.remove('active');
    dom.artifactSheet.style.transform = '';
    setTimeout(() => {
        currentOpenArtifact = null;
    }, 250);
}

function distanceToArtifact(artifact) {
    if (!map) return 0;
    return L.latLng(playerPos).distanceTo(L.latLng(artifact.coords));
}

function checkDistanceToArtifacts() {
    for (const artifact of [...artifacts]) {
        const distance = distanceToArtifact(artifact);

        if (currentOpenArtifact === artifact.id && dom.artifactSheet.classList.contains('open')) {
            updateDistanceUI(distance);
        }

        if (distance < AUTO_COLLECT_RADIUS_METERS && !dom.artifactSheet.classList.contains('open')) {
            currentOpenArtifact = artifact.id;
            doCollect();
            showToast(`${artifact.typeData.icon} ${artifact.typeData.name} собран!`);
            break;
        }
    }
}

function doCollect() {
    if (!currentOpenArtifact) return;

    const artifact = artifacts.find(item => item.id === currentOpenArtifact);
    if (!artifact) return;

    const marker = artifactMarkers.get(currentOpenArtifact);
    if (marker && map) {
        const point = map.latLngToContainerPoint(marker.getLatLng());
        spawnParticles(point.x, point.y, artifact.typeData.color);
    }

    removeArtifact(currentOpenArtifact);
    currentOpenArtifact = null;
    closeArtifactSheet();

    playerStats[artifact.typeData.resource] += artifact.typeData.amount;
    playerStats.prestige += artifact.typeData.prestige;
    playerStats.collected += 1;
    playerStats.inventory[artifact.typeKey] = (playerStats.inventory[artifact.typeKey] || 0) + 1;
    awardLevelProgress(artifact.typeData.progress);

    SoundFX.play('collect');
    flashHud();
    updateHUD();
    updateProfileStats();
    renderRanking(currentRankingPeriod);
    schedulePersist();
}

function awardLevelProgress(amount) {
    gameState.player.levelProgress += amount;

    while (gameState.player.levelProgress >= 100) {
        gameState.player.levelProgress -= 100;
        gameState.player.level += 1;
        showToast(`⬆️ Новый уровень: ${gameState.player.level}`);
    }
}

function spawnParticles(x, y, color) {
    if (!dom.particles) return;

    for (let index = 0; index < 12; index += 1) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.background = color;

        const angle = (Math.PI * 2 * index) / 12;
        const distance = 40 + Math.random() * 60;
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);

        dom.particles.appendChild(particle);
        setTimeout(() => particle.remove(), 700);
    }
}

function flashHud() {
    if (!dom.hudDock) return;
    dom.hudDock.classList.add('flash');
    setTimeout(() => dom.hudDock.classList.remove('flash'), 500);
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2200);
}

function updateHUD() {
    dom.hudSteps.textContent = `🦶 ${playerStats.steps.toLocaleString('ru')}`;
    dom.hudCoins.textContent = `🪙 ${playerStats.coins}`;
    dom.hudCrystals.textContent = `💎 ${playerStats.crystals}`;
    dom.hudPrestige.textContent = `⭐ ${playerStats.prestige.toLocaleString('ru')}`;
    dom.topPlayerName.textContent = gameState.player.name;
    dom.topAvatar.src = buildAvatarUrl(gameState.player.avatarSeed);
    dom.profileAvatar.src = buildAvatarUrl(gameState.player.avatarSeed);
    dom.topLevelBadge.textContent = gameState.player.level;
    dom.profileName.textContent = gameState.player.name;
    dom.profileLevelLabel.textContent = `Ур. ${gameState.player.level}`;
    dom.profileLevelProgress.style.width = `${gameState.player.levelProgress}%`;
}

function updateProfileStats() {
    updateHUD();

    if (dom.profileStatValues.length >= 4) {
        dom.profileStatValues[0].textContent = playerStats.steps.toLocaleString('ru');
        dom.profileStatValues[1].textContent = playerStats.prestige.toLocaleString('ru');
        dom.profileStatValues[2].textContent = playerStats.collected;
        dom.profileStatValues[3].textContent = `#${computePlayerRank()}`;
    }

    dom.inventory.innerHTML = [
        { icon: '🗡️', value: `x${playerStats.inventory.power}` },
        { icon: '🧱', value: `x${playerStats.inventory.build}` },
        { icon: '💎', value: `x${playerStats.inventory.rare}` },
        { icon: '🪙', value: `${playerStats.coins}` }
    ].map(item => `<div class="inv-item">${item.icon} <span>${item.value}</span></div>`).join('');
}

function buildAvatarUrl(seed) {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

function initStealth() {
    dom.stealthBtn.addEventListener('click', () => {
        isStealthMode = !isStealthMode;
        applyStealthState(true);
    });

    dom.stealthToggle.addEventListener('change', event => {
        isStealthMode = event.target.checked;
        applyStealthState(true);
    });

    applyStealthState(false);
}

function applyStealthState(shouldPersist) {
    gameState.settings.stealth = isStealthMode;
    dom.stealthBtn.textContent = isStealthMode ? '🙈' : '👁';
    dom.stealthBtn.classList.toggle('stealth-active', isStealthMode);
    dom.stealthToggle.checked = isStealthMode;

    npcMarkers.forEach(npc => npc.marker.setOpacity(isStealthMode ? 0.2 : 1));
    if (shouldPersist) schedulePersist();
}

function spawnNPCs() {
    if (!map) return;

    NPC_PLAYERS.forEach(npc => {
        const position = [OCHAKOVO_CENTER[0] + npc.offset[0], OCHAKOVO_CENTER[1] + npc.offset[1]];
        const marker = L.marker(position, {
            icon: L.divIcon({
                className: 'custom-icon',
                html: `<div class="npc-marker" title="${npc.name}">${npc.emoji}</div>`,
                iconSize: [28, 28],
                iconAnchor: [14, 28]
            })
        }).addTo(map);

        npcMarkers.push({ marker, position });
    });

    npcMoveInterval = window.setInterval(moveNPCs, 3000);
}

function moveNPCs() {
    if (isStealthMode) return;

    npcMarkers.forEach(npc => {
        const candidate = [
            npc.position[0] + (Math.random() - 0.5) * 0.0005,
            npc.position[1] + (Math.random() - 0.5) * 0.0005
        ];
        if (!isPointInDistrict(candidate)) return;
        npc.position = candidate;
        npc.marker.setLatLng(candidate);
    });
}

function initSimulation() {
    dom.devStepBtn.addEventListener('click', simulateMovement);
    dom.devSpawnBtn.addEventListener('click', () => spawnArtifact());
    dom.devAutoBtn.addEventListener('click', toggleAutoWalk);
}

function toggleAutoWalk() {
    if (autoWalkInterval) {
        clearInterval(autoWalkInterval);
        autoWalkInterval = null;
        dom.devAutoBtn.textContent = '▶️ Авто';
        dom.devAutoBtn.classList.remove('active-btn');
        return;
    }

    autoWalkInterval = window.setInterval(simulateMovement, 1500);
    dom.devAutoBtn.textContent = '⏸️ Стоп';
    dom.devAutoBtn.classList.add('active-btn');
}

function simulateMovement() {
    const nextPos = createRandomSpawnPoint(playerPos);
    updatePlayerPosition(nextPos, {
        animate: true,
        awardMovement: true,
        playStepSound: true
    });
}

function initUtilityButtons() {
    dom.scannerBtn.addEventListener('click', handleScanner);
    dom.eventBtn.addEventListener('click', handleEventButton);
}

function handleScanner() {
    const nearest = getNearestArtifact();

    if (nearest && nearest.distance <= ARTIFACT_SCAN_RADIUS_METERS) {
        focusArtifact(nearest.artifact, true);
        showToast(`📡 ${nearest.artifact.typeData.name}: ${Math.round(nearest.distance)} м`);
        return;
    }

    if (playerZoneStatus !== 'inside' && gameState.settings.movementMode !== 'simulation') {
        showToast('📡 Вне района сигнал слишком слабый.');
        return;
    }

    const artifact = spawnArtifact({ openSheet: true });
    if (artifact) showToast('📡 Сканер нашёл новый след.');
}

function handleEventButton() {
    const nearest = getNearestArtifact();

    if (nearest) {
        focusArtifact(nearest.artifact, true);
        return;
    }

    if (playerZoneStatus === 'inside' || gameState.settings.movementMode === 'simulation') {
        const artifact = spawnArtifact({ openSheet: true });
        if (artifact) showToast('⚡ Событие появилось на карте.');
    }
}

function updateEventButtonState() {
    if (!dom.eventBtn) return;

    const hasArtifacts = artifacts.length > 0;
    dom.eventBtn.classList.toggle('visible', hasArtifacts);
    dom.eventBtn.classList.toggle('blinking', hasArtifacts && newArtifactPing);
}

function initRankingFilters() {
    const keys = ['all', 'week', 'today'];
    dom.rankingFilters.forEach((button, index) => {
        button.addEventListener('click', () => {
            currentRankingPeriod = keys[index];
            gameState.ui.rankingFilter = currentRankingPeriod;
            renderRanking(currentRankingPeriod);
            SoundFX.play('tab');
            schedulePersist();
        });
    });
}

function buildRanking(period) {
    const base = (RANKING_BASE[period] || []).map(item => ({ ...item }));
    const playerEntry = {
        name: gameState.player.name,
        seed: gameState.player.avatarSeed,
        score: getPlayerScore(period),
        isPlayer: true
    };

    const filtered = base.filter(item => item.name !== 'Игрок1' && item.name !== gameState.player.name);
    filtered.push(playerEntry);
    filtered.sort((left, right) => right.score - left.score);
    return filtered;
}

function getPlayerScore(period) {
    if (period === 'today') return Math.round(playerStats.prestige * 0.09 + playerStats.collected * 0.5 + playerStats.inventory.rare * 10);
    if (period === 'week') return Math.round(playerStats.prestige * 0.36 + playerStats.collected * 1.4);
    return playerStats.prestige;
}

function computePlayerRank() {
    const ranking = buildRanking('all');
    const index = ranking.findIndex(item => item.isPlayer);
    return index >= 0 ? index + 1 : ranking.length + 1;
}

function renderRanking(period) {
    currentRankingPeriod = period;
    gameState.ui.rankingFilter = period;

    dom.rankingFilters.forEach((button, index) => {
        button.classList.toggle('active', ['all', 'week', 'today'][index] === period);
    });

    const ranking = buildRanking(period);
    const podium = [ranking[1], ranking[0], ranking[2]];

    dom.podiumItems.forEach((item, index) => {
        const entry = podium[index];
        if (!entry) {
            item.style.display = 'none';
            return;
        }

        item.style.display = '';
        item.querySelector('.avatar').src = buildAvatarUrl(entry.seed || entry.name);
        item.querySelector('.name').textContent = entry.name;
        item.querySelector('.score').textContent = `⭐ ${entry.score.toLocaleString('ru')}`;
    });

    dom.rankingList.innerHTML = ranking
        .slice(3, 13)
        .map((entry, index) => `
            <div class="rank-row ${entry.isPlayer ? 'is-player' : ''}">
                <span class="rank-place">${index + 4}</span>
                <img src="${buildAvatarUrl(entry.seed || entry.name)}" class="rank-avatar" alt="">
                <span class="rank-name">${entry.name}</span>
                <span class="rank-score">⭐ ${entry.score.toLocaleString('ru')}</span>
            </div>
        `)
        .join('');
}

function initUpgradeModal() {
    dom.baseUpgradeBtn.addEventListener('click', showUpgradeModal);
    dom.upgradeCloseBtn.addEventListener('click', closeUpgradeModal);
    dom.upgradeOverlay.addEventListener('click', closeUpgradeModal);
    dom.upgradeStartBtn.addEventListener('click', startUpgrade);
}

function showUpgradeModal() {
    dom.upgradeModal.classList.add('open');
    dom.upgradeOverlay.classList.add('active');
    renderUpgradeModal();
}

function closeUpgradeModal() {
    dom.upgradeModal.classList.remove('open');
    dom.upgradeOverlay.classList.remove('active');
}

function startUpgrade() {
    if (gameState.base.upgrade.endAt) return;

    if (playerStats.coins < UPGRADE_COST) {
        dom.upgradeStartBtn.textContent = 'Не хватает монет';
        return;
    }

    playerStats.coins -= UPGRADE_COST;
    gameState.base.upgrade.startedAt = Date.now();
    gameState.base.upgrade.endAt = Date.now() + UPGRADE_DURATION_MS;
    updateHUD();
    renderUpgradeModal();
    ensureUpgradeTicker();
    SoundFX.play('upgrade');
    schedulePersist();
}

function ensureUpgradeTicker() {
    if (upgradeTicker) {
        clearInterval(upgradeTicker);
        upgradeTicker = null;
    }

    if (!gameState.base.upgrade.endAt) return;

    upgradeTicker = window.setInterval(() => {
        const remaining = gameState.base.upgrade.endAt - Date.now();
        if (remaining <= 0) {
            completeUpgrade();
            return;
        }

        if (dom.upgradeModal.classList.contains('open')) renderUpgradeModal();
    }, 250);
}

function renderUpgradeModal() {
    const remaining = Math.max(0, (gameState.base.upgrade.endAt || 0) - Date.now());
    const isActive = remaining > 0;

    if (!isActive) {
        dom.upgradeTimer.textContent = '10 сек';
        dom.upgradeProgress.style.width = '0%';
        dom.upgradeStartBtn.disabled = false;
        dom.upgradeStartBtn.textContent = `Начать улучшение (🪙 ${UPGRADE_COST})`;
        return;
    }

    const elapsed = UPGRADE_DURATION_MS - remaining;
    const seconds = Math.ceil(remaining / 1000);
    dom.upgradeTimer.textContent = `${seconds} сек`;
    dom.upgradeProgress.style.width = `${Math.min(100, (elapsed / UPGRADE_DURATION_MS) * 100)}%`;
    dom.upgradeStartBtn.disabled = true;
    dom.upgradeStartBtn.textContent = 'Улучшение...';
}

function completeUpgrade() {
    if (upgradeTicker) {
        clearInterval(upgradeTicker);
        upgradeTicker = null;
    }

    gameState.base.upgrade.startedAt = null;
    gameState.base.upgrade.endAt = null;
    gameState.base.level += 1;
    gameState.base.progress = Math.min(100, gameState.base.progress + 12);
    unlockNextBaseSlot();
    playerStats.prestige += 50;
    awardLevelProgress(18);
    updateHUD();
    renderBaseUI();
    renderRanking(currentRankingPeriod);
    renderUpgradeModal();
    showToast('🏠 Квартира улучшена! +50 престижа');
    schedulePersist();
}

function unlockNextBaseSlot() {
    const slotIndex = gameState.base.slots.findIndex(slot => !slot);
    if (slotIndex === -1) return;
    gameState.base.slots[slotIndex] = { ...BASE_SLOT_LIBRARY[slotIndex] };
}

function renderBaseUI() {
    dom.baseBadge.textContent = `Ур. ${gameState.base.level}`;
    dom.baseProgress.style.width = `${gameState.base.progress}%`;

    dom.baseView.innerHTML = gameState.base.slots.map(slot => {
        if (!slot) return '<div class="slot empty"><span>+</span></div>';
        return `<div class="slot filled"><span class="slot-icon">${slot.icon}</span><span class="slot-label">${slot.label}</span></div>`;
    }).join('');

    dom.baseResources.innerHTML = [
        { icon: '🧱', value: gameState.base.resources.brick },
        { icon: '🪵', value: gameState.base.resources.wood },
        { icon: '⚙️', value: gameState.base.resources.gears }
    ].map(item => `<div class="res-item">${item.icon} ${item.value}</div>`).join('');
}

function initChat() {
    dom.chatToggle.addEventListener('click', () => {
        dom.chatPanel.classList.toggle('open');
        gameState.ui.chatOpen = dom.chatPanel.classList.contains('open');
        schedulePersist();
    });

    dom.chatClose.addEventListener('click', () => {
        dom.chatPanel.classList.remove('open');
        gameState.ui.chatOpen = false;
        schedulePersist();
    });

    dom.chatSend.addEventListener('click', sendChatMessage);
    dom.chatInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') sendChatMessage();
    });

    renderChat();
}

function renderChat() {
    dom.chatMessages.innerHTML = '';
    gameState.messages.forEach(message => appendChatMessage(message, false));
    dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
}

function sendChatMessage() {
    const value = dom.chatInput.value.trim().replace(/\s+/g, ' ');
    if (!value) return;

    const message = {
        name: gameState.player.name,
        text: value.slice(0, 140),
        time: formatTime(new Date()),
        own: true
    };

    gameState.messages.push(message);
    gameState.messages = gameState.messages.slice(-MAX_CHAT_MESSAGES);
    appendChatMessage(message, true);
    dom.chatInput.value = '';
    dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
    schedulePersist();
}

function appendChatMessage(message, shouldAnimateScroll) {
    const wrapper = document.createElement('div');
    wrapper.className = `chat-msg ${message.own ? 'own' : ''}`;

    const header = document.createElement('div');
    header.className = 'chat-msg-header';

    const name = document.createElement('span');
    name.className = 'chat-name';
    name.textContent = message.name;

    const time = document.createElement('span');
    time.className = 'chat-time';
    time.textContent = message.time;

    const text = document.createElement('div');
    text.className = 'chat-text';
    text.textContent = message.text;

    header.appendChild(name);
    header.appendChild(time);
    wrapper.appendChild(header);
    wrapper.appendChild(text);
    dom.chatMessages.appendChild(wrapper);

    if (shouldAnimateScroll) dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
}

function startAmbientChat() {
    ambientChatInterval = window.setInterval(() => {
        if (document.hidden) return;
        if (Math.random() < 0.65) return;

        const entry = AMBIENT_CHAT_POOL[Math.floor(Math.random() * AMBIENT_CHAT_POOL.length)];
        const message = {
            name: entry.name,
            text: entry.text,
            time: formatTime(new Date()),
            own: false
        };

        gameState.messages.push(message);
        gameState.messages = gameState.messages.slice(-MAX_CHAT_MESSAGES);
        appendChatMessage(message, false);
        schedulePersist();
    }, 25_000);
}

function formatTime(date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function initProfileControls() {
    dom.editProfileBtn.addEventListener('click', renamePlayer);
    dom.settingsBtn.addEventListener('click', handleSettingsAction);
}

async function renamePlayer() {
    const value = window.prompt('Как подписать игрока в районе?', gameState.player.name);
    if (!value) return;

    const nextName = value.trim().replace(/\s+/g, ' ').slice(0, 16);
    if (!nextName) return;

    if (authState.authenticated) {
        try {
            const data = await apiRequest('/api/profile', {
                method: 'PATCH',
                body: { name: nextName }
            });
            authState.user = data.user;
            authState.lastSyncedAt = data.state?.meta?.lastSyncedAt || new Date().toISOString();
            authState.syncStatus = 'synced';
            commitGameState(data.state);
            refreshMapState();
            applyStateToUI();
            showToast('✏️ Имя аккаунта обновлено');
            return;
        } catch (error) {
            showToast(error.message || 'Не удалось обновить имя аккаунта');
            return;
        }
    }

    gameState.player.name = nextName;
    gameState.player.avatarSeed = nextName;
    updateHUD();
    updateProfileStats();
    renderRanking(currentRankingPeriod);
    showToast('✏️ Имя игрока обновлено');
    schedulePersist();
}

function handleSettingsAction() {
    const shouldReset = window.confirm(
        'Прогресс уже сохраняется автоматически на этом устройстве.\n\nСбросить локальный прогресс и начать заново?'
    );

    if (!shouldReset) {
        showToast('💾 Прогресс сохраняется автоматически.');
        return;
    }

    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
}

function initSplash() {
    if (!dom.splash) return;

    const bar = dom.splash.querySelector('.splash-progress-fill');
    if (bar) setTimeout(() => { bar.style.width = '100%'; }, 100);

    setTimeout(() => {
        dom.splash.classList.add('fade-out');
        setTimeout(() => {
            dom.splash.style.display = 'none';
            if (!gameState.settings.onboardingCompleted) showOnboarding();
        }, 500);
    }, 2000);
}

function showOnboarding() {
    if (!dom.onboarding) return;

    let currentSlide = 0;
    dom.onboarding.style.display = 'flex';

    const renderSlide = () => {
        dom.onboardingSlides.forEach((slide, index) => slide.classList.toggle('active', index === currentSlide));
        dom.onboardingDots.forEach((dot, index) => dot.classList.toggle('active', index === currentSlide));
        dom.onboardingBtn.textContent = currentSlide === dom.onboardingSlides.length - 1 ? 'Начать' : 'Далее';
    };

    dom.onboardingBtn.onclick = () => {
        currentSlide += 1;
        if (currentSlide >= dom.onboardingSlides.length) {
            gameState.settings.onboardingCompleted = true;
            schedulePersist();
            dom.onboarding.classList.add('fade-out');
            setTimeout(() => {
                dom.onboarding.style.display = 'none';
                dom.onboarding.classList.remove('fade-out');
                if (map) setTimeout(() => map.invalidateSize(), 100);
            }, 500);
            return;
        }
        renderSlide();
    };

    renderSlide();
}

function applyStateToUI() {
    renderBaseUI();
    updateHUD();
    updateProfileStats();
    renderRanking(currentRankingPeriod);
    renderChat();
    updateEventButtonState();
    applyStealthState(false);
    updateMapStatus();
    renderAuthUI();
    setActiveScreen(gameState.ui.activeScreen, false, false);

    if (gameState.ui.chatOpen && gameState.ui.activeScreen === 'screen-map') {
        dom.chatPanel.classList.add('open');
    }
}

function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    const isSecureContext = window.location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (!isSecureContext) return;

    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
}

function schedulePersist() {
    clearTimeout(persistTimer);
    persistTimer = setTimeout(persistGameState, 120);
}

function cloneGameStateForNetwork() {
    persistGameState({ skipRemoteSync: true });
    return typeof structuredClone === 'function'
        ? structuredClone(gameState)
        : JSON.parse(JSON.stringify(gameState));
}

function persistGameState(options = {}) {
    gameState.player.position = [...playerPos];
    gameState.player.stats = {
        ...playerStats,
        inventory: { ...playerStats.inventory }
    };
    gameState.meta.updatedAt = new Date().toISOString();
    gameState.meta.userId = authState.user?.id || null;
    gameState.meta.lastSyncedAt = authState.lastSyncedAt || null;
    gameState.settings.stealth = isStealthMode;
    gameState.ui.rankingFilter = currentRankingPeriod;
    gameState.ui.chatOpen = dom.chatPanel?.classList.contains('open') || false;
    gameState.artifacts = artifacts.map(dehydrateArtifact);
    gameState.messages = gameState.messages.slice(-MAX_CHAT_MESSAGES);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));

    if (authState.authenticated && !options.skipRemoteSync) scheduleRemoteSync();
}

function scheduleRemoteSync() {
    if (!authState.authenticated) return;

    authState.syncStatus = remoteSyncInFlight ? 'syncing' : 'pending';
    renderAuthUI();
    remoteSyncQueued = true;
    clearTimeout(remoteSyncTimer);
    remoteSyncTimer = setTimeout(() => {
        syncProgressToServer();
    }, REMOTE_SYNC_DEBOUNCE_MS);
}

async function syncProgressToServer() {
    if (!authState.authenticated) return;
    if (remoteSyncInFlight) {
        remoteSyncQueued = true;
        return;
    }

    remoteSyncInFlight = true;
    remoteSyncQueued = false;
    authState.syncStatus = 'syncing';
    renderAuthUI();

    try {
        const data = await apiRequest('/api/progress', {
            method: 'PUT',
            body: { state: cloneGameStateForNetwork() },
            suppressErrors: true
        });
        if (data?.state) {
            authState.lastSyncedAt = data.state.meta?.lastSyncedAt || new Date().toISOString();
            authState.syncStatus = 'synced';
            commitGameState(data.state);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
        }
    } catch (error) {
        authState.syncStatus = 'error';
        console.info('Sync failed:', error.message);
    } finally {
        remoteSyncInFlight = false;
        renderAuthUI();
        if (remoteSyncQueued) scheduleRemoteSync();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initApp().catch(error => {
        console.error(error);
        showToast('Сервис аккаунтов не инициализировался полностью.');
    });
});
