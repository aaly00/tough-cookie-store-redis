import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, test } from '@jest/globals';
import { createClient, RedisClientType } from 'redis';
import { Cookie, CookieJar } from 'tough-cookie';
import { RedisCookieStore } from '../src';

describe('get set cookies jar', () => {
    let redisClient: RedisClientType;
    let store: RedisCookieStore;
    let jar: CookieJar;

    async function prepare() {
        const randomCookies = new Array(Math.floor(Math.random() * 8 + 2))
            .fill(null)
            .map((value, index, array) => {
                return new Cookie({
                    key: `test-key-${index}`,
                    value: `test-value-${index}-${Math.random()}`,
                    path: '/',
                    httpOnly: true,
                });
            });
        await redisClient.flushDb();
        await Promise.all(randomCookies.map(it => jar.setCookie(it, 'https://www.google.com')));
        return randomCookies;
    }

    beforeAll(async () => {
        redisClient = createClient({
            url: process.env.REDIS_URL,
        });
        await redisClient.connect();
        await redisClient.flushDb();
        store = new RedisCookieStore(redisClient);
        jar = new CookieJar(store);
    });
    test('should get 1 cookies from jar', async () => {
        const cookie = new Cookie({
            key: 'test-key',
            value: 'test-value',
            path: '/',
            httpOnly: true,
        });
        await jar.setCookie(
            cookie,
            'https://www.google.com',
        );
        const res = await jar.getCookies('https://www.google.com');
        expect(Array.isArray(res)).toBe(true);
        expect(res.length).toBe(1);
        expect(res[0].toString()).toBe(cookie.toString());
    }, 10_000);
    test('should get 10 cookies from jar', async () => {
        const randomCookies = await prepare();
        const cookies1 = await jar.getCookies('https://www.google.com');
        expect(Array.isArray(cookies1)).toBeTruthy();
        expect(cookies1.length).toBe(randomCookies.length);
        expect(
            cookies1.every((it) => {
                return !!randomCookies.find(random => it.toString() === random.toString());
            }),
        ).toBeTruthy();
    }, 10_000);
    test('should del all cookies from jar', async () => {
        const randomCookies = await prepare();
        await jar.removeAllCookies();
        await store.getAllCookies((err, res) => {
            expect(Array.isArray(res)).toBe(true);
            expect(res.length).toBe(0);
        });
    }, 10_000);
    afterAll(async () => {
        if (redisClient) {
            await redisClient.disconnect();
        }
    });
});