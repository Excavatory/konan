const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { URL } = require('node:url');
const { DatabaseSync } = require('node:sqlite');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DB_PATH = path.join(DATA_DIR, 'konan.db');
const SESSION_COOKIE = 'konan_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const BODY_LIMIT_BYTES = 512 * 1024;

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        avatar_seed TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS progress (
        user_id INTEGER PRIMARY KEY,
        state_json TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
`);

const statements = {
    createUser: db.prepare(`
        INSERT INTO users (email, display_name, avatar_seed, password_salt, password_hash, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `),
    findUserByEmail: db.prepare(`
        SELECT id, email, display_name, avatar_seed, password_salt, password_hash, created_at, updated_at
        FROM users
        WHERE email = ?
    `),
    findUserById: db.prepare(`
        SELECT id, email, display_name, avatar_seed, created_at, updated_at
        FROM users
        WHERE id = ?
    `),
    updateUserProfile: db.prepare(`
        UPDATE users
        SET display_name = ?, avatar_seed = ?, updated_at = ?
        WHERE id = ?
    `),
    insertSession: db.prepare(`
        INSERT INTO sessions (user_id, token_hash, created_at, expires_at)
        VALUES (?, ?, ?, ?)
    `),
    findSession: db.prepare(`
        SELECT s.id, s.user_id, s.expires_at, u.email, u.display_name, u.avatar_seed, u.created_at, u.updated_at
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ?
    `),
    deleteSessionByHash: db.prepare(`DELETE FROM sessions WHERE token_hash = ?`),
    deleteExpiredSessions: db.prepare(`DELETE FROM sessions WHERE expires_at <= ?`),
    getProgress: db.prepare(`SELECT state_json, updated_at FROM progress WHERE user_id = ?`),
    upsertProgress: db.prepare(`
        INSERT INTO progress (user_id, state_json, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET state_json = excluded.state_json, updated_at = excluded.updated_at
    `)
};

const rateLimitBuckets = new Map();
const mimeTypes = new Map([
    ['.html', 'text/html; charset=utf-8'],
    ['.js', 'application/javascript; charset=utf-8'],
    ['.css', 'text/css; charset=utf-8'],
    ['.svg', 'image/svg+xml'],
    ['.json', 'application/json; charset=utf-8'],
    ['.webmanifest', 'application/manifest+json; charset=utf-8'],
    ['.png', 'image/png'],
    ['.jpg', 'image/jpeg'],
    ['.jpeg', 'image/jpeg'],
    ['.ico', 'image/x-icon']
]);

cleanupExpiredSessions();
setInterval(cleanupExpiredSessions, 60 * 60 * 1000).unref();

const server = http.createServer(async (request, response) => {
    try {
        const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

        if (url.pathname.startsWith('/api/')) {
            await handleApi(request, response, url);
            return;
        }

        if (request.method !== 'GET' && request.method !== 'HEAD') {
            sendError(response, 405, 'Method not allowed');
            return;
        }

        await serveStatic(response, url.pathname, request.method === 'HEAD');
    } catch (error) {
        console.error(error);
        sendError(response, error.statusCode || 500, error.statusCode ? error.message : 'Internal server error');
    }
});

server.listen(PORT, HOST, () => {
    console.log(`Konan server listening on http://${HOST === '0.0.0.0' ? '127.0.0.1' : HOST}:${PORT}`);
});

async function handleApi(request, response, url) {
    const ip = getClientIp(request);

    if (request.method === 'GET' && url.pathname === '/api/health') {
        sendJson(response, 200, { ok: true });
        return;
    }

    if (request.method === 'GET' && url.pathname === '/api/auth/me') {
        const session = getSessionFromRequest(request);
        if (!session) {
            sendJson(response, 200, { authenticated: false, user: null, state: null });
            return;
        }

        sendJson(response, 200, {
            authenticated: true,
            user: serializeUser(session),
            state: getStoredState(session.user_id, session)
        });
        return;
    }

    if (request.method === 'POST' && url.pathname === '/api/auth/register') {
        enforceRateLimit(ip, 'register', 10, 15 * 60 * 1000);
        const body = await readJsonBody(request);
        const email = normalizeEmail(body.email);
        const password = typeof body.password === 'string' ? body.password : '';
        const displayName = normalizeDisplayName(body.name);

        if (!looksLikeEmail(email)) throw httpError(400, 'Введите корректный email.');
        if (password.length < 8) throw httpError(400, 'Пароль должен быть не короче 8 символов.');
        if (!displayName) throw httpError(400, 'Укажите имя игрока.');
        if (statements.findUserByEmail.get(email)) throw httpError(409, 'Этот email уже зарегистрирован.');

        const now = isoNow();
        const passwordSalt = crypto.randomBytes(16).toString('hex');
        const passwordHash = hashPassword(password, passwordSalt);
        const avatarSeed = displayName;

        const result = statements.createUser.run(
            email,
            displayName,
            avatarSeed,
            passwordSalt,
            passwordHash,
            now,
            now
        );

        const user = statements.findUserById.get(result.lastInsertRowid);
        const state = normalizeGameState(body.state, user);
        saveProgress(user.id, state);

        const cookieValue = createSession(user.id);
        setSessionCookie(response, cookieValue);

        sendJson(response, 201, {
            authenticated: true,
            user: serializeUser(user),
            state
        });
        return;
    }

    if (request.method === 'POST' && url.pathname === '/api/auth/login') {
        enforceRateLimit(ip, 'login', 15, 15 * 60 * 1000);
        const body = await readJsonBody(request);
        const email = normalizeEmail(body.email);
        const password = typeof body.password === 'string' ? body.password : '';
        const user = statements.findUserByEmail.get(email);

        if (!user || !verifyPassword(password, user.password_salt, user.password_hash)) {
            throw httpError(401, 'Неверный email или пароль.');
        }

        const mergedState = mergeGameStates(
            getStoredState(user.id, user),
            body.localState,
            user
        );
        saveProgress(user.id, mergedState);

        const cookieValue = createSession(user.id);
        setSessionCookie(response, cookieValue);

        sendJson(response, 200, {
            authenticated: true,
            user: serializeUser(user),
            state: mergedState
        });
        return;
    }

    if (request.method === 'POST' && url.pathname === '/api/auth/logout') {
        const token = readSessionToken(request);
        if (token) statements.deleteSessionByHash.run(hashToken(token));
        clearSessionCookie(response);
        sendJson(response, 200, { ok: true });
        return;
    }

    const session = getSessionFromRequest(request);

    if (request.method === 'GET' && url.pathname === '/api/progress') {
        requireAuth(session);
        sendJson(response, 200, {
            ok: true,
            state: getStoredState(session.user_id, session)
        });
        return;
    }

    if (request.method === 'PUT' && url.pathname === '/api/progress') {
        requireAuth(session);
        const body = await readJsonBody(request);
        const state = normalizeGameState(body.state, session);
        saveProgress(session.user_id, state);
        sendJson(response, 200, { ok: true, state });
        return;
    }

    if (request.method === 'PATCH' && url.pathname === '/api/profile') {
        requireAuth(session);
        const body = await readJsonBody(request);
        const displayName = normalizeDisplayName(body.name);
        if (!displayName) throw httpError(400, 'Имя должно содержать от 2 до 16 символов.');

        statements.updateUserProfile.run(displayName, displayName, isoNow(), session.user_id);
        const user = statements.findUserById.get(session.user_id);
        const state = normalizeGameState(getStoredState(user.id, user), user);
        saveProgress(user.id, state);
        sendJson(response, 200, {
            ok: true,
            user: serializeUser(user),
            state
        });
        return;
    }

    sendError(response, 404, 'Not found');
}

async function serveStatic(response, pathname, headOnly) {
    const relativePath = pathname === '/' ? '/index.html' : pathname;
    const cleanPath = path.normalize(relativePath).replace(/^(\.\.[/\\])+/, '');
    const filePath = path.join(ROOT_DIR, cleanPath);

    if (!filePath.startsWith(ROOT_DIR)) {
        sendError(response, 403, 'Forbidden');
        return;
    }

    let stat;
    try {
        stat = await fsp.stat(filePath);
    } catch {
        sendError(response, 404, 'Not found');
        return;
    }

    if (!stat.isFile()) {
        sendError(response, 404, 'Not found');
        return;
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes.get(ext) || 'application/octet-stream';

    response.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stat.size,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
        'Referrer-Policy': 'same-origin',
        'X-Content-Type-Options': 'nosniff'
    });

    if (headOnly) {
        response.end();
        return;
    }

    fs.createReadStream(filePath).pipe(response);
}

function readJsonBody(request) {
    return new Promise((resolve, reject) => {
        let size = 0;
        let raw = '';

        request.on('data', chunk => {
            size += chunk.length;
            if (size > BODY_LIMIT_BYTES) {
                reject(httpError(413, 'Payload too large'));
                request.destroy();
                return;
            }
            raw += chunk.toString('utf8');
        });

        request.on('end', () => {
            if (!raw) {
                resolve({});
                return;
            }

            try {
                resolve(JSON.parse(raw));
            } catch {
                reject(httpError(400, 'Некорректный JSON.'));
            }
        });

        request.on('error', reject);
    });
}

function createSession(userId) {
    const token = crypto.randomBytes(32).toString('base64url');
    statements.insertSession.run(
        userId,
        hashToken(token),
        isoNow(),
        new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString()
    );
    return token;
}

function getSessionFromRequest(request) {
    const token = readSessionToken(request);
    if (!token) return null;

    const session = statements.findSession.get(hashToken(token));
    if (!session) return null;

    if (Date.parse(session.expires_at) <= Date.now()) {
        statements.deleteSessionByHash.run(hashToken(token));
        return null;
    }

    return session;
}

function readSessionToken(request) {
    const cookies = parseCookies(request.headers.cookie || '');
    return cookies[SESSION_COOKIE] || null;
}

function parseCookies(header) {
    return header.split(';').reduce((acc, part) => {
        const [key, ...rest] = part.trim().split('=');
        if (!key) return acc;
        acc[key] = decodeURIComponent(rest.join('='));
        return acc;
    }, {});
}

function setSessionCookie(response, value) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    response.setHeader(
        'Set-Cookie',
        `${SESSION_COOKIE}=${encodeURIComponent(value)}; HttpOnly; Path=/; Max-Age=${SESSION_TTL_SECONDS}; SameSite=Lax${secure}`
    );
}

function clearSessionCookie(response) {
    response.setHeader(
        'Set-Cookie',
        `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`
    );
}

function hashPassword(password, salt) {
    return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password, salt, expectedHash) {
    const actual = Buffer.from(hashPassword(password, salt), 'hex');
    const expected = Buffer.from(expectedHash, 'hex');
    if (actual.length !== expected.length) return false;
    return crypto.timingSafeEqual(actual, expected);
}

function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

function cleanupExpiredSessions() {
    statements.deleteExpiredSessions.run(isoNow());
}

function normalizeEmail(value) {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function looksLikeEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeDisplayName(value) {
    if (typeof value !== 'string') return '';
    const cleaned = value.trim().replace(/\s+/g, ' ').slice(0, 16);
    return cleaned.length >= 2 ? cleaned : '';
}

function serializeUser(user) {
    return {
        id: Number(user.id),
        email: user.email,
        name: user.display_name,
        avatarSeed: user.avatar_seed,
        createdAt: user.created_at,
        updatedAt: user.updated_at
    };
}

function getStoredState(userId, user) {
    const row = statements.getProgress.get(userId);
    if (!row) return normalizeGameState(null, user);

    try {
        return normalizeGameState(JSON.parse(row.state_json), user);
    } catch {
        return normalizeGameState(null, user);
    }
}

function saveProgress(userId, state) {
    statements.upsertProgress.run(userId, JSON.stringify(state), isoNow());
}

function mergeGameStates(serverState, localState, user) {
    const server = normalizeGameState(serverState, user);
    if (!localState || typeof localState !== 'object') return server;

    const local = normalizeGameState(localState, user);
    const merged = structuredClone(server);

    merged.player.level = Math.max(server.player.level, local.player.level);
    merged.player.levelProgress = Math.max(server.player.levelProgress, local.player.levelProgress);
    merged.player.stats.steps = Math.max(server.player.stats.steps, local.player.stats.steps);
    merged.player.stats.coins = Math.max(server.player.stats.coins, local.player.stats.coins);
    merged.player.stats.crystals = Math.max(server.player.stats.crystals, local.player.stats.crystals);
    merged.player.stats.prestige = Math.max(server.player.stats.prestige, local.player.stats.prestige);
    merged.player.stats.collected = Math.max(server.player.stats.collected, local.player.stats.collected);
    merged.player.stats.inventory.power = Math.max(server.player.stats.inventory.power, local.player.stats.inventory.power);
    merged.player.stats.inventory.build = Math.max(server.player.stats.inventory.build, local.player.stats.inventory.build);
    merged.player.stats.inventory.rare = Math.max(server.player.stats.inventory.rare, local.player.stats.inventory.rare);
    merged.base.level = Math.max(server.base.level, local.base.level);
    merged.base.progress = Math.max(server.base.progress, local.base.progress);
    merged.base.resources.brick = Math.max(server.base.resources.brick, local.base.resources.brick);
    merged.base.resources.wood = Math.max(server.base.resources.wood, local.base.resources.wood);
    merged.base.resources.gears = Math.max(server.base.resources.gears, local.base.resources.gears);
    merged.base.slots = countFilledSlots(local.base.slots) > countFilledSlots(server.base.slots) ? local.base.slots : server.base.slots;
    merged.settings.onboardingCompleted = server.settings.onboardingCompleted || local.settings.onboardingCompleted;
    merged.settings.stealth = local.settings.stealth;
    merged.ui = local.ui;
    merged.player.position = local.player.position;
    merged.artifacts = isStateNewer(local, server) ? local.artifacts : server.artifacts;
    merged.messages = mergeMessages(server.messages, local.messages);
    merged.meta.updatedAt = isoNow();
    merged.meta.lastSyncedAt = isoNow();
    merged.player.name = user.display_name;
    merged.player.avatarSeed = user.avatar_seed;
    return normalizeGameState(merged, user);
}

function mergeMessages(serverMessages, localMessages) {
    const seen = new Set();
    const merged = [...serverMessages, ...localMessages].filter(item => {
        const key = `${item.name}|${item.time}|${item.text}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    return merged.slice(-30);
}

function countFilledSlots(slots) {
    return Array.isArray(slots) ? slots.filter(Boolean).length : 0;
}

function isStateNewer(left, right) {
    return Date.parse(left.meta.updatedAt || 0) > Date.parse(right.meta.updatedAt || 0);
}

function normalizeGameState(candidate, user) {
    const identity = user ? serializeUser(user) : {
        id: null,
        email: null,
        name: 'Игрок1',
        avatarSeed: 'King'
    };
    const defaults = createDefaultGameState(identity);
    const source = candidate && typeof candidate === 'object' ? candidate : {};
    const normalized = {
        meta: {
            schemaVersion: 2,
            updatedAt: sanitizeDate(source.meta?.updatedAt) || isoNow(),
            lastSyncedAt: isoNow(),
            userId: identity.id
        },
        player: {
            name: identity.name,
            avatarSeed: identity.avatarSeed,
            level: clampNumber(source.player?.level, 1, 999, defaults.player.level),
            levelProgress: clampNumber(source.player?.levelProgress, 0, 99, defaults.player.levelProgress),
            position: normalizePosition(source.player?.position, defaults.player.position),
            stats: {
                steps: clampNumber(source.player?.stats?.steps, 0, 99999999, defaults.player.stats.steps),
                coins: clampNumber(source.player?.stats?.coins, 0, 99999999, defaults.player.stats.coins),
                crystals: clampNumber(source.player?.stats?.crystals, 0, 999999, defaults.player.stats.crystals),
                prestige: clampNumber(source.player?.stats?.prestige, 0, 99999999, defaults.player.stats.prestige),
                collected: clampNumber(source.player?.stats?.collected, 0, 999999, defaults.player.stats.collected),
                inventory: {
                    power: clampNumber(source.player?.stats?.inventory?.power, 0, 999999, defaults.player.stats.inventory.power),
                    build: clampNumber(source.player?.stats?.inventory?.build, 0, 999999, defaults.player.stats.inventory.build),
                    rare: clampNumber(source.player?.stats?.inventory?.rare, 0, 999999, defaults.player.stats.inventory.rare)
                }
            }
        },
        base: {
            level: clampNumber(source.base?.level, 1, 99, defaults.base.level),
            progress: clampNumber(source.base?.progress, 0, 100, defaults.base.progress),
            resources: {
                brick: clampNumber(source.base?.resources?.brick, 0, 999999, defaults.base.resources.brick),
                wood: clampNumber(source.base?.resources?.wood, 0, 999999, defaults.base.resources.wood),
                gears: clampNumber(source.base?.resources?.gears, 0, 999999, defaults.base.resources.gears)
            },
            slots: normalizeSlots(source.base?.slots, defaults.base.slots),
            upgrade: {
                endAt: sanitizeDate(source.base?.upgrade?.endAt),
                startedAt: sanitizeDate(source.base?.upgrade?.startedAt)
            }
        },
        settings: {
            stealth: Boolean(source.settings?.stealth),
            onboardingCompleted: Boolean(source.settings?.onboardingCompleted),
            movementMode: ['pending', 'live', 'simulation'].includes(source.settings?.movementMode)
                ? source.settings.movementMode
                : defaults.settings.movementMode
        },
        ui: {
            activeScreen: ['screen-map', 'screen-base', 'screen-ranking', 'screen-profile'].includes(source.ui?.activeScreen)
                ? source.ui.activeScreen
                : defaults.ui.activeScreen,
            rankingFilter: ['all', 'week', 'today'].includes(source.ui?.rankingFilter)
                ? source.ui.rankingFilter
                : defaults.ui.rankingFilter,
            chatOpen: Boolean(source.ui?.chatOpen)
        },
        artifacts: normalizeArtifacts(source.artifacts, defaults.artifacts),
        messages: normalizeMessages(source.messages, defaults.messages)
    };

    return normalized;
}

function createDefaultGameState(identity) {
    const now = isoNow();
    return {
        meta: {
            schemaVersion: 2,
            updatedAt: now,
            lastSyncedAt: now,
            userId: identity.id
        },
        player: {
            name: identity.name,
            avatarSeed: identity.avatarSeed,
            level: 12,
            levelProgress: 80,
            position: [55.6983, 37.4582],
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
            slots: [
                { icon: '🛋️', label: 'Диван' },
                { icon: '📺', label: 'ТВ' },
                { icon: '🪑', label: 'Стол' },
                null,
                null,
                null
            ],
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
        artifacts: [],
        messages: [
            { name: 'Дмитрий', text: 'Кто-нибудь видел редкий артефакт у прудов?', time: '20:15', own: false },
            { name: 'Анна', text: 'Да, я нашла Корону Очаково!', time: '20:18', own: false },
            { name: 'Сергей', text: 'Круто! Я около МЦД, тут куча строительных.', time: '20:20', own: false },
            { name: 'Елена', text: 'Кто хочет в клан? Набираем людей 💪', time: '20:24', own: false }
        ]
    };
}

function normalizeArtifacts(source, fallback) {
    if (!Array.isArray(source)) return fallback;
    return source.slice(0, 8).map(item => ({
        id: typeof item?.id === 'string' ? item.id : `artifact-${crypto.randomUUID()}`,
        typeKey: ['power', 'build', 'rare'].includes(item?.typeKey) ? item.typeKey : 'power',
        name: typeof item?.name === 'string' ? item.name.slice(0, 48) : 'Артефакт',
        coords: normalizePosition(item?.coords, [55.6983, 37.4582]),
        createdAt: Number.isFinite(item?.createdAt) ? item.createdAt : Date.now()
    }));
}

function normalizeMessages(source, fallback) {
    const base = Array.isArray(source) ? source : fallback;
    return base.slice(-30).map(item => ({
        name: typeof item?.name === 'string' ? item.name.slice(0, 24) : 'Игрок',
        text: typeof item?.text === 'string' ? item.text.slice(0, 160) : '',
        time: typeof item?.time === 'string' ? item.time.slice(0, 8) : '00:00',
        own: Boolean(item?.own)
    }));
}

function normalizeSlots(source, fallback) {
    if (!Array.isArray(source)) return fallback;
    return source.slice(0, 6).map(item => {
        if (!item || typeof item !== 'object') return null;
        return {
            icon: typeof item.icon === 'string' ? item.icon.slice(0, 4) : '✨',
            label: typeof item.label === 'string' ? item.label.slice(0, 24) : 'Модуль'
        };
    }).concat(Array.from({ length: Math.max(0, 6 - source.length) }, () => null));
}

function normalizePosition(source, fallback) {
    if (!Array.isArray(source) || source.length !== 2) return [...fallback];
    const lat = Number(source[0]);
    const lng = Number(source[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [...fallback];
    return [lat, lng];
}

function clampNumber(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(min, Math.min(max, Math.round(number)));
}

function sanitizeDate(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
}

function getClientIp(request) {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded) return forwarded.split(',')[0].trim();
    return request.socket.remoteAddress || 'local';
}

function enforceRateLimit(ip, scope, limit, windowMs) {
    const key = `${ip}:${scope}`;
    const now = Date.now();
    const timestamps = (rateLimitBuckets.get(key) || []).filter(value => now - value < windowMs);
    if (timestamps.length >= limit) throw httpError(429, 'Слишком много попыток. Попробуйте позже.');
    timestamps.push(now);
    rateLimitBuckets.set(key, timestamps);
}

function requireAuth(session) {
    if (!session) throw httpError(401, 'Нужен вход в аккаунт.');
}

function sendJson(response, statusCode, payload) {
    const body = JSON.stringify(payload);
    response.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'same-origin',
        'X-Content-Type-Options': 'nosniff'
    });
    response.end(body);
}

function sendError(response, statusCode, message) {
    sendJson(response, statusCode, { error: message });
}

function httpError(statusCode, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function isoNow() {
    return new Date().toISOString();
}

process.on('uncaughtException', error => {
    console.error(error);
});

process.on('unhandledRejection', error => {
    console.error(error);
});
