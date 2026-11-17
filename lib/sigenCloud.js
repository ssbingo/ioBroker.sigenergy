'use strict';

/**
 * Sigenergy cloud client for SigenMicro micro-inverters.
 *
 * SigenMicro devices talk to the Sigenergy cloud via WLAN only and are not part of the
 * Sigenergy Modbus protocol, so their live values can only be read from the cloud.
 *
 * Two interfaces are supported:
 *  - 'openapi': the official Sigen OpenAPI (developer.sigencloud.com), "Northbound" account
 *    login with the mySigen credentials. Read-only, no onboard needed. Device realtime data is
 *    rate-limited by Sigenergy to about once per 5 minutes.
 *  - 'app': the undocumented mySigen app interface (pcs/realtime). Faster, but may change or be
 *    blocked by Sigenergy at any time.
 *
 * Only GET requests are sent after the login; nothing on the system is changed.
 */

const { createCipheriv, createHash } = require('node:crypto');

const REGIONS = {
    eu: 'https://api-eu.sigencloud.com',
    apac: 'https://api-apac.sigencloud.com',
    aus: 'https://api-aus.sigencloud.com',
    us: 'https://api-us.sigencloud.com',
    cn: 'https://api-cn.sigencloud.com',
};

/**
 * @typedef {Record<string, unknown>} CloudObject  an untyped JSON object from the cloud
 * @typedef {{code?: number, msg?: string, data?: unknown, error_description?: string}} CloudResponse
 */

/** Raw values Sigenergy uses for "not available" (0xFFFF / 0xFFFFFFFF with scaling). */
const NOT_AVAILABLE = new Set([65535, 6553.5, 655.35, 4294967295, 429496729.5, 42949672.95]);

/** Error from the cloud client. */
class CloudError extends Error {
    /**
     * @param {string} message - Error message
     * @param {object} [opts] - Details
     * @param {number|string} [opts.code] - Cloud response code
     * @param {boolean} [opts.fatal] - True if retrying cannot help (e.g. wrong credentials)
     * @param {boolean} [opts.rateLimited] - True if the cloud rejected the call due to rate limits
     * @param {boolean} [opts.auth] - True if the access token was rejected
     */
    constructor(message, opts = {}) {
        super(message);
        this.name = 'CloudError';
        this.code = opts.code;
        this.fatal = !!opts.fatal;
        this.rateLimited = !!opts.rateLimited;
        this.auth = !!opts.auth;
    }
}

/**
 * Convert a cloud value (number or numeric string) to a number; null for missing or
 * "not available" placeholder values.
 *
 * @param {unknown} v - Raw value
 * @returns {number|null} number or null
 */
function toNumber(v) {
    if (v === null || v === undefined || v === '') {
        return null;
    }
    const n = typeof v === 'number' ? v : parseFloat(String(v).trim());
    if (!Number.isFinite(n) || NOT_AVAILABLE.has(n)) {
        return null;
    }
    return n;
}

/**
 * Parse a value that the OpenAPI may deliver as a JSON string.
 *
 * @param {unknown} v - Raw value
 * @returns {unknown} parsed value
 */
function parseMaybeJson(v) {
    if (typeof v !== 'string') {
        return v;
    }
    try {
        return JSON.parse(v);
    } catch {
        return v;
    }
}

/**
 * Parse a value that may be a JSON string into an object (empty object otherwise).
 *
 * @param {unknown} v - Raw value
 * @returns {CloudObject} object
 */
function asObject(v) {
    const o = parseMaybeJson(v);
    return o && typeof o === 'object' && !Array.isArray(o) ? /** @type {CloudObject} */ (o) : {};
}

/**
 * Parse a value that may be a JSON array (of JSON strings) into a list of objects.
 *
 * @param {unknown} v - Raw value
 * @returns {CloudObject[]} objects
 */
function asObjectList(v) {
    const a = parseMaybeJson(v);
    return Array.isArray(a) ? a.map(asObject) : [];
}

/**
 * Round to 3 decimals (kW precision of the cloud).
 *
 * @param {number} n - value
 * @returns {number} rounded value
 */
function round3(n) {
    return Math.round(n * 1000) / 1000;
}

/**
 * Build the PV input list with the power per input (kW).
 *
 * @param {Array<{voltage: unknown, current: unknown}>} inputs - raw inputs
 * @returns {Array<{voltage: number|null, current: number|null, power: number|null}>} PV inputs
 */
function buildPvInputs(inputs) {
    return inputs.map(i => {
        const voltage = toNumber(i.voltage);
        const current = toNumber(i.current);
        const power = voltage !== null && current !== null ? round3((voltage * current) / 1000) : null;
        return { voltage, current, power };
    });
}

/**
 * @typedef {object} MicroRealtime
 * @property {boolean} online - true if the micro-inverter reported live values
 * @property {number|null} activePower - AC active power (kW)
 * @property {number|null} reactivePower - reactive power (kvar)
 * @property {number|null} pvPower - PV (DC) power (kW)
 * @property {Array<{voltage: number|null, current: number|null, power: number|null}>} pv - PV inputs
 * @property {number|null} gridVoltage - grid voltage (V)
 * @property {number|null} gridCurrent - grid current (A)
 * @property {number|null} gridFrequency - grid frequency (Hz)
 * @property {number|null} powerFactor - power factor
 * @property {number|null} temperature - internal temperature (°C)
 * @property {number|null} insulationResistance - insulation resistance to ground (MΩ)
 * @property {number|null} dailyYield - PV yield today (kWh)
 * @property {number|null} totalYield - PV yield total (kWh)
 */

/**
 * Normalize an OpenAPI realtimeInfo response.
 *
 * @param {CloudObject} rt - realTimeInfo object
 * @returns {MicroRealtime} normalized values
 */
function normalizeOpenApi(rt) {
    const pv = [];
    for (let i = 1; i <= 4; i++) {
        if (rt[`pV${i}Voltage`] !== undefined || rt[`pV${i}Current`] !== undefined) {
            pv.push({ voltage: rt[`pV${i}Voltage`], current: rt[`pV${i}Current`] });
        }
    }
    const activePower = toNumber(rt.activePower ?? rt.pcsActivePower);
    const gridVoltage = toNumber(rt.aPhaseVoltage);
    return {
        online: activePower !== null || gridVoltage !== null,
        activePower,
        reactivePower: toNumber(rt.reactivePower ?? rt.pcsReactivePower),
        pvPower: toNumber(rt.pvTotalPower ?? rt.pVPower),
        pv: buildPvInputs(pv),
        gridVoltage,
        gridCurrent: toNumber(rt.aPhaseCurrent),
        gridFrequency: toNumber(rt.gridFrequency),
        powerFactor: toNumber(rt.powerFactor),
        temperature: toNumber(rt.internalTemperature),
        insulationResistance: toNumber(rt.insulationResistance),
        dailyYield: toNumber(rt.pvEnergyDaily),
        totalYield: toNumber(rt.pvEnergyTotal),
    };
}

/**
 * Normalize a mySigen app pcs/realtime response.
 *
 * @param {CloudObject} d - response data
 * @returns {MicroRealtime} normalized values
 */
function normalizeApp(d) {
    const list = asObjectList(d.pvInfoList);
    const activePower = toNumber(d.activePower);
    const gridVoltage = toNumber(d.phaseVoltageA);
    return {
        online: activePower !== null || gridVoltage !== null,
        activePower,
        reactivePower: toNumber(d.reactivePower),
        pvPower: toNumber(d.pvTotalPower),
        pv: buildPvInputs(list.map(p => ({ voltage: p.voltage, current: p.current }))),
        gridVoltage,
        gridCurrent: toNumber(d.phaseCurrentA),
        gridFrequency: toNumber(d.gridFrequency),
        powerFactor: toNumber(d.powerFactor),
        temperature: toNumber(d.internalTemperature),
        insulationResistance: toNumber(d.insulationImpedanceToGround ?? d.impedanceToGround),
        dailyYield: toNumber(d.todayPv),
        totalYield: null,
    };
}

/**
 * OpenAPI device list entry → is it a SigenMicro micro-inverter?
 * SigenMicro serials carry an "M" after the 3-digit prefix (e.g. 110M...); as a fallback a
 * small inverter (≤ 2 kW) that cannot absorb power is treated as a micro-inverter as well.
 *
 * @param {CloudObject} d - device entry
 * @returns {boolean} true for a SigenMicro
 */
function isOpenApiMicro(d) {
    if (!d || String(d.deviceType).toLowerCase() !== 'inverter') {
        return false;
    }
    if (/^\d{3}M/i.test(String(d.serialNumber || ''))) {
        return true;
    }
    const attr = asObject(d.attrMap);
    const rated = toNumber(attr.ratedActivePower);
    return rated !== null && rated <= 2 && toNumber(attr.maxAbsorbedPower) === 0;
}

/**
 * @typedef {object} MicroDevice
 * @property {string} sn - inverter serial number
 * @property {string} name - display name (empty if unknown)
 * @property {number|null} ratedPower - rated active power (kW)
 * @property {string} firmware - firmware version (empty if unknown)
 * @property {string|number} systemId - OpenAPI systemId or app stationId
 */

/** Sigenergy cloud client. */
class SigenCloudClient {
    /**
     * @param {object} opts - Options
     * @param {'openapi'|'app'} opts.mode - Cloud interface
     * @param {string} opts.region - eu | apac | aus | us | cn
     * @param {string} opts.user - mySigen account
     * @param {string} opts.password - mySigen password
     * @param {(msg: string) => void} [opts.debug] - Debug logger
     * @param {typeof fetch} [opts.fetchImpl] - fetch implementation (tests)
     * @param {number} [opts.timeoutMs] - Request timeout
     * @param {(ms: number) => Promise<void>} [opts.sleep] - Sleep implementation
     */
    constructor(opts) {
        this.mode = opts.mode === 'app' ? 'app' : 'openapi';
        this.base = REGIONS[opts.region] || REGIONS.eu;
        this.user = opts.user;
        this.password = opts.password;
        this.debug = opts.debug || (() => {});
        this.fetch = opts.fetchImpl || globalThis.fetch;
        this.timeoutMs = opts.timeoutMs || 20000;
        this.sleep = opts.sleep || (ms => new Promise(r => setTimeout(r, ms)));
        this.token = null;
        this.tokenExpiresAt = 0;
        /** password variant the OpenAPI accepted last ('encrypted' | 'plain') */
        this._pwVariant = null;
    }

    /**
     * Encrypt the password like the mySigen app does (AES-128-CBC, base64).
     *
     * @param {string} plain - password
     * @returns {string} encrypted password
     */
    static encryptPassword(plain) {
        const k = Buffer.from('sigensigensigenp', 'utf-8');
        const c = createCipheriv('aes-128-cbc', k, k);
        return Buffer.concat([c.update(plain, 'utf-8'), c.final()]).toString('base64');
    }

    /**
     * Low-level HTTP request returning the parsed JSON body.
     *
     * @param {string} path - URL path
     * @param {object} [opts] - Options
     * @param {string} [opts.method] - HTTP method
     * @param {Record<string, string|number>} [opts.query] - Query parameters
     * @param {object} [opts.json] - JSON body
     * @param {URLSearchParams} [opts.form] - Form body
     * @param {Record<string, string>} [opts.headers] - Extra headers
     * @returns {Promise<{status: number, body: CloudResponse|null}>} HTTP status and JSON body
     */
    async _http(path, opts = {}) {
        const url = new URL(this.base + path);
        for (const [k, v] of Object.entries(opts.query || {})) {
            url.searchParams.set(k, String(v));
        }
        /** @type {Record<string, string>} */
        const headers = { Accept: 'application/json', ...(opts.headers || {}) };
        let body;
        if (opts.json) {
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify(opts.json);
        } else if (opts.form) {
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
            body = opts.form;
        }
        let resp;
        try {
            resp = await this.fetch(url, {
                method: opts.method || 'GET',
                headers,
                body,
                signal: AbortSignal.timeout(this.timeoutMs),
            });
        } catch (err) {
            throw new CloudError(`Cloud request ${path} failed: ${err.message}`);
        }
        const json = await resp.json().catch(() => null);
        return {
            status: resp.status,
            body: json && typeof json === 'object' ? /** @type {CloudResponse} */ (json) : null,
        };
    }

    /** @returns {boolean} true if a usable access token exists */
    hasValidToken() {
        return !!this.token && Date.now() < this.tokenExpiresAt - 60000;
    }

    /** Drop the access token so the next call logs in again. */
    invalidateToken() {
        this.token = null;
        this.tokenExpiresAt = 0;
    }

    /** Log in if there is no valid token. */
    async ensureLogin() {
        if (!this.hasValidToken()) {
            await this.login();
        }
    }

    /** Log in with the mySigen account. */
    async login() {
        this.invalidateToken();
        if (this.mode === 'app') {
            await this._loginApp();
        } else {
            await this._loginOpenApi();
        }
    }

    /** Official OpenAPI account login ("Northbound" scenario, no onboard). */
    async _loginOpenApi() {
        // The OpenAPI has accepted both the app-encrypted and the plain password in tests.
        // At most two attempts per login: five wrong passwords within 60 minutes lock the
        // account for 3 minutes (code 11002).
        const variants = this._pwVariant
            ? [this._pwVariant]
            : /** @type {Array<'encrypted'|'plain'>} */ (['encrypted', 'plain']);
        for (const [i, variant] of variants.entries()) {
            if (i > 0) {
                await this.sleep(2000); // avoid code 2028 "login attempted too frequently"
            }
            const password = variant === 'encrypted' ? SigenCloudClient.encryptPassword(this.password) : this.password;
            const { status, body } = await this._http('/openapi/auth/login/password', {
                method: 'POST',
                json: { username: this.user, password },
            });
            const code = body && body.code;
            this.debug(`[cloud] OpenAPI login (${variant}): HTTP ${status} code=${code}`);
            if (code === 0) {
                const data = asObject(body.data);
                if (data.accessToken) {
                    this.token = String(data.accessToken);
                    this.tokenExpiresAt = Date.now() + (Number(data.expiresIn) || 3600) * 1000;
                    this._pwVariant = variant;
                    return;
                }
                throw new CloudError('OpenAPI login returned no access token', { code });
            }
            if (code === 11003) {
                continue; // authentication failed — try the other password variant once
            }
            if (code === 11002) {
                throw new CloudError('mySigen account temporarily locked (too many failed logins)', { code });
            }
            throw new CloudError(`OpenAPI login failed (HTTP ${status}, code ${code}): ${(body && body.msg) || ''}`, {
                code,
            });
        }
        throw new CloudError('OpenAPI login failed: wrong mySigen user name or password', {
            code: 11003,
            fatal: true,
        });
    }

    /** mySigen app login (OAuth password grant, app-encrypted password). */
    async _loginApp() {
        const { status, body } = await this._http('/auth/oauth/token', {
            method: 'POST',
            headers: { Authorization: `Basic ${Buffer.from('sigen:sigen').toString('base64')}` },
            form: new URLSearchParams({
                username: this.user,
                password: SigenCloudClient.encryptPassword(this.password),
                grant_type: 'password',
            }),
        });
        const code = body && body.code;
        this.debug(`[cloud] app login: HTTP ${status} code=${code}`);
        const data = asObject(body && body.data);
        if (status === 200 && data.access_token) {
            this.token = String(data.access_token);
            this.tokenExpiresAt = Date.now() + (Number(data.expires_in) || 3600) * 1000;
            return;
        }
        const msg = (body && (body.msg || body.error_description)) || '';
        const badCredentials = status === 400 || status === 401 || code === 11003 || /password|credential/i.test(msg);
        throw new CloudError(`mySigen login failed (HTTP ${status}, code ${code}): ${msg}`, {
            code,
            fatal: badCredentials,
        });
    }

    /**
     * Authenticated GET returning the response data (code 0) or throwing a CloudError.
     *
     * @param {string} path - URL path
     * @param {Record<string, string|number>} [query] - Query parameters
     * @param {boolean} [retried] - internal: true on the retry after a re-login
     * @returns {Promise<unknown>} response data
     */
    async _get(path, query, retried = false) {
        await this.ensureLogin();
        const headers = { Authorization: `Bearer ${this.token}` };
        const { status, body } = await this._http(path, { query, headers });
        const code = body && body.code;
        if (status === 401 || code === 401 || (typeof code === 'number' && code >= 11000 && code < 12000)) {
            this.invalidateToken();
            if (!retried) {
                this.debug(`[cloud] access token rejected (HTTP ${status}, code ${code}) — logging in again`);
                return this._get(path, query, true);
            }
            throw new CloudError(`Access token rejected (HTTP ${status}, code ${code})`, { code, auth: true });
        }
        if (code === 1201 || code === 2028 || status === 429) {
            throw new CloudError(`Rate limit (code ${code}): ${(body && body.msg) || ''}`, {
                code,
                rateLimited: true,
            });
        }
        if (status !== 200 || !body || code !== 0) {
            throw new CloudError(`${path}: HTTP ${status}, code ${code} ${(body && body.msg) || ''}`.trim(), {
                code,
            });
        }
        return parseMaybeJson(body.data);
    }

    /**
     * Find all SigenMicro micro-inverters of the account.
     *
     * @returns {Promise<MicroDevice[]>} micro-inverters
     */
    async discover() {
        return this.mode === 'app' ? this._discoverApp() : this._discoverOpenApi();
    }

    /**
     * OpenAPI: all systems of the account and their SigenMicro inverters.
     *
     * @returns {Promise<MicroDevice[]>} micro-inverters
     */
    async _discoverOpenApi() {
        const systems = asObjectList(await this._get('/openapi/system'));
        /** @type {MicroDevice[]} */
        const out = [];
        for (const sys of systems) {
            if (!sys.systemId) {
                continue;
            }
            const systemId = String(sys.systemId);
            const devices = asObjectList(await this._get(`/openapi/system/${encodeURIComponent(systemId)}/devices`));
            for (const d of devices) {
                if (!isOpenApiMicro(d)) {
                    continue;
                }
                const attr = asObject(d.attrMap);
                out.push({
                    sn: String(d.serialNumber),
                    name: '',
                    ratedPower: toNumber(attr.ratedActivePower),
                    firmware: String(d.firmwareVersion || ''),
                    systemId,
                });
            }
        }
        return out;
    }

    /**
     * App: the station of the account and its SigenMicro inverters (from the topology).
     *
     * @returns {Promise<MicroDevice[]>} micro-inverters
     */
    async _discoverApp() {
        const home = asObject(await this._get('/device/owner/station/home'));
        const stationId = /** @type {string|number|undefined} */ (home.stationId);
        if (!stationId) {
            return [];
        }
        const topo = asObject(await this._get('/device/devicetreepanel/topology', { stationId }));
        /** @type {Array<{node: CloudObject, parent: CloudObject|null}>} */
        const nodes = [];
        /**
         * @param {unknown} list - node list
         * @param {CloudObject|null} parent - parent node
         */
        const walk = (list, parent) => {
            for (const n of asObjectList(list)) {
                nodes.push({ node: n, parent });
                walk(n.nodeList, n);
            }
        };
        walk(topo.nodeList, null);
        // A SigenMicro is an "Aio" node (deviceType 2, sceneMode 55, category D-MIC-*) with an
        // "Inverter" child (deviceType 3) that carries microInverterShowType. Realtime data is
        // only available for the inverter child.
        /** @param {CloudObject|null} p - parent node */
        const isMicroParent = p =>
            !!p && (Number(p.sceneMode) === 55 || String(p.deviceCategoryId || '').startsWith('D-MIC'));
        return nodes
            .filter(
                ({ node, parent }) =>
                    Number(node.deviceType) === 3 &&
                    ((node.microInverterShowType !== null && node.microInverterShowType !== undefined) ||
                        isMicroParent(parent)),
            )
            .map(({ node, parent }) => ({
                sn: String(node.snCode),
                name: String((parent && parent.deviceName) || node.deviceName || ''),
                ratedPower: toNumber(node.ratedActivePower),
                firmware: '',
                systemId: stationId,
            }));
    }

    /**
     * Read the live values of one micro-inverter.
     *
     * @param {MicroDevice} dev - micro-inverter
     * @returns {Promise<MicroRealtime>} normalized live values
     */
    async readRealtime(dev) {
        if (this.mode === 'app') {
            const data = await this._get('/device/web/manage/device/pcs/realtime', {
                snCode: dev.sn,
                stationId: dev.systemId,
                deviceType: 3,
            });
            return normalizeApp(asObject(data));
        }
        const data = await this._get(
            `/openapi/systems/${encodeURIComponent(dev.systemId)}/devices/${encodeURIComponent(dev.sn)}/realtimeInfo`,
        );
        return normalizeOpenApi(asObject(asObject(data).realTimeInfo));
    }
}

/**
 * Fingerprint of the cloud settings a login test succeeded with. Only this hash is stored (in
 * `cloudVerified`), so the adapter can tell whether the settings changed since the test.
 *
 * @param {string} namespace - adapter instance, e.g. 'sigenergy.0'
 * @param {string} mode - 'openapi' | 'app'
 * @param {string} region - cloud region
 * @param {string} user - mySigen account
 * @param {string} password - mySigen password
 * @returns {string} hex fingerprint
 */
function settingsFingerprint(namespace, mode, region, user, password) {
    return createHash('sha256')
        .update(JSON.stringify([namespace, mode, region, user, password]))
        .digest('hex');
}

module.exports = {
    SigenCloudClient,
    settingsFingerprint,
    CloudError,
    REGIONS,
    toNumber,
    normalizeOpenApi,
    normalizeApp,
    isOpenApiMicro,
};
