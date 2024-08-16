import { Store, Cookie } from 'tough-cookie';
import type { RedisClientType } from 'redis';
export declare class RedisCookieStore extends Store {
    id: string | undefined;
    client: RedisClientType | undefined;
    idx: Record<string, any> | undefined;
    constructor(redisClient: RedisClientType, id?: string);
    getKeyName(domain: string, path?: string): string;
    findCookie(domain: string, path: string, key: string, cb: (err: Error | null, cookie: Cookie | null) => void): Promise<void>;
    findCookies(domain: string, path: string, allowSpecialUseDomain: boolean, cb: (err: Error | null, cookie: Cookie[]) => void): Promise<void>;
    putCookie(cookie: Cookie, cb: (err: Error | null) => void): Promise<void>;
    updateCookie(oldCookie: Cookie, newCookie: Cookie, cb: (err: Error | null) => void): Promise<void>;
    removeCookie(domain: string, path: string, key: string, cb: (err: Error | null) => void): Promise<void>;
    removeAllCookies(cb: (err: Error | null) => void): Promise<void>;
    removeCookies(domain: string, path: string, cb: (err: Error | null) => void): Promise<void>;
    getAllCookies(cb: (err: Error | null, cookie: Cookie[]) => void): Promise<void>;
    _scan(pattern: string, cb: (keys: string[]) => Promise<void>): Promise<void>;
}
