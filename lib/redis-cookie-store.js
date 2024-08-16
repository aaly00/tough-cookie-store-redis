"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCookieStore = void 0;
const tough_cookie_1 = require("tough-cookie");
const lodash_1 = require("lodash");
class RedisCookieStore extends tough_cookie_1.Store {
    id;
    client;
    idx;
    constructor(redisClient, id) {
        super();
        const self = this;
        self.idx = {};
        self.id = id || "default";
        self.client = redisClient;
        self.synchronous = false;
        if (!redisClient.isReady) {
            redisClient
                .on("error", (err) => console.log("Redis Client Error", err))
                .connect()
                .catch((err) => {
                console.log("Redis Connect Error", err);
                process.exit(1);
            });
        }
    }
    getKeyName(domain, path) {
        const self = this;
        if (path) {
            return `cookie-store:${self.id}:cookie:${domain}:${path}`;
        }
        return `cookie-store:${self.id}:cookie:${domain}`;
    }
    async findCookie(domain, path, key, cb) {
        const self = this;
        const { client } = self;
        const keyName = self.getKeyName(domain, path);
        try {
            const str = await client?.hGet(keyName, key);
            if (str) {
                cb(null, tough_cookie_1.Cookie.fromJSON(str));
            }
            else {
                cb(null, null);
            }
        }
        catch (e) {
            cb(e instanceof Error ? e : new Error(String(e)), null);
        }
    }
    async findCookies(domain, path, allowSpecialUseDomain, cb) {
        const self = this;
        const cookies = [];
        const { client } = self;
        if (!client) {
            return cb(null, []);
        }
        if (typeof allowSpecialUseDomain === "function") {
            cb = allowSpecialUseDomain;
            allowSpecialUseDomain = true;
        }
        if (!domain) {
            return cb(null, []);
        }
        const domains = (0, tough_cookie_1.permuteDomain)(domain, allowSpecialUseDomain) || [domain];
        const paths = (0, tough_cookie_1.permutePath)(path) || [path];
        const patterns = domains
            .map((domain) => paths.map((path) => `${this.getKeyName(domain)}:${path}`))
            .flat();
        try {
            await Promise.all(patterns.map((pattern) => this._scan(pattern, async (keys) => {
                const dataArr = await Promise.all(keys.map((key) => client.hGetAll(key)));
                dataArr.forEach((it) => {
                    Object.values(it).forEach((it) => {
                        const cookie = tough_cookie_1.Cookie.fromJSON(it);
                        if (cookie) {
                            cookies.push(cookie);
                        }
                    });
                });
            })));
            cb(null, (0, lodash_1.sortBy)(cookies, (it) => it.creationIndex));
            return;
        }
        catch (e) {
            cb(e instanceof Error ? e : new Error(String(e)), []);
        }
    }
    async putCookie(cookie, cb) {
        const self = this;
        const { client } = self;
        const { key: cookieName, domain, path } = cookie;
        if (!domain || !path) {
            throw new Error("Domain and path must be specified.");
        }
        const keyName = self.getKeyName(domain, path);
        const cookieString = JSON.stringify(cookie.toJSON());
        try {
            if (!client)
                throw new Error("Redis client is not initialized.");
            await client.hSet(keyName, cookieName, cookieString);
            cb(null);
        }
        catch (e) {
            cb(e instanceof Error ? e : new Error(String(e)));
        }
    }
    updateCookie(oldCookie, newCookie, cb) {
        const self = this;
        // updateCookie() may avoid updating cookies that are identical.  For example,
        // lastAccessed may not be important to some stores and an equality
        // comparison could exclude that field.
        return self.putCookie(newCookie, cb);
    }
    async removeCookie(domain, path, key, cb) {
        const self = this;
        const { client } = self;
        const keyName = self.getKeyName(domain, path);
        try {
            if (!client)
                throw new Error("Redis client is not initialized.");
            await client.hDel(keyName, key);
            cb(null);
        }
        catch (e) {
            cb(e instanceof Error ? e : new Error(String(e)));
        }
    }
    removeAllCookies(cb) {
        return this.removeCookies("*", "*", cb);
    }
    async removeCookies(domain, path, cb) {
        const self = this;
        const { client } = self;
        if (path && path !== "*") {
            const keyName = self.getKeyName(domain, path);
            try {
                if (!client)
                    throw new Error("Redis client is not initialized.");
                await client.del(keyName);
                cb(null);
            }
            catch (e) {
                cb(e instanceof Error ? e : new Error(String(e)));
            }
            return;
        }
        try {
            const keyName = `${self.getKeyName(domain)}:*`;
            await this._scan(keyName, async (keys) => {
                if (!client)
                    throw new Error("Redis client is not initialized.");
                await client.del(keys);
            });
            cb(null);
        }
        catch (e) {
            cb(e instanceof Error ? e : new Error(String(e)));
        }
    }
    async getAllCookies(cb) {
        const client = this.client;
        const cookies = [];
        const pattern = this.getKeyName("*");
        await this._scan(pattern, async (keys) => {
            if (!client)
                throw new Error("Redis client is not initialized.");
            const dataArr = await Promise.all(keys.map((key) => client.hGetAll(key)));
            dataArr.forEach((it) => {
                Object.values(it).forEach((it) => {
                    const cookie = tough_cookie_1.Cookie.fromJSON(it);
                    if (cookie) {
                        cookies.push(cookie);
                    }
                });
            });
        });
        cb(null, (0, lodash_1.sortBy)(cookies, (it) => it.creationIndex));
    }
    async _scan(pattern, cb) {
        const client = this.client;
        if (client) {
            const time = Date.now();
            let cursor = 0, flag = true, count = 1;
            while (flag) {
                try {
                    const { cursor: next, keys } = await client.scan(cursor, {
                        MATCH: pattern,
                        COUNT: 100,
                    });
                    cursor = next;
                    if (cursor === 0) {
                        flag = false;
                    }
                    if (Array.isArray(keys) && keys.length) {
                        count = count + keys.length;
                        await cb(keys);
                    }
                    if (Date.now() - time >= 10 * 1000) {
                        flag = false;
                    }
                }
                catch (e) {
                    flag = false;
                    console.log(e);
                }
            }
        }
    }
}
exports.RedisCookieStore = RedisCookieStore;
//# sourceMappingURL=redis-cookie-store.js.map