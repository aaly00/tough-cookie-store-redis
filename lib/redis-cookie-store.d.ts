import { Store, Cookie } from "tough-cookie";
interface MinimalRedisClient {
    isReady: boolean;
    on(event: string, listener: (err: Error) => void): this;
    connect(): Promise<MinimalRedisClient>;
    hGet(key: string, field: string): Promise<string | undefined | null>;
    hSet(key: string, field: string, value: string): Promise<number>;
    hDel(key: string, field: string): Promise<number>;
    hGetAll(key: string): Promise<Record<string, string>>;
    del(key: string | string[]): Promise<number>;
    scan(cursor: number, options: {
        MATCH: string;
        COUNT: number;
    }): Promise<{
        cursor: number;
        keys: string[];
    }>;
}
export declare class RedisCookieStore extends Store {
    id: string | undefined;
    client: MinimalRedisClient;
    idx: Record<string, any> | undefined;
    constructor(redisClient: MinimalRedisClient, id?: string);
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
export {};
