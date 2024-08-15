import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import { createClient, RedisClientType } from "redis";
import { Cookie } from "tough-cookie";
import { RedisCookieStore } from "../src";
import { StartedTestContainer, GenericContainer } from "testcontainers";

const randomId = () => Math.random().toString(36).substring(7);
const getRandomCookieStore = (redisClient: RedisClientType) =>
  new RedisCookieStore(redisClient, randomId());

describe("get set cookies in store", () => {
  let redisClient: RedisClientType;
  let redisContainer: StartedTestContainer;

  async function prepare(store: RedisCookieStore) {
    const randomCookies = new Array(Math.floor(Math.random() * 8 + 2))
      .fill(null)
      .map((value, index, array) => {
        return new Cookie({
          key: `test-key-${index}`,
          value: `test-value-${index}-${Math.random()}`,
          path: "/",
          httpOnly: true,
          domain: "https://www.google.com",
        });
      });
    await redisClient.flushDb();
    await Promise.all(randomCookies.map((it) => store.putCookie(it, () => {})));
    return randomCookies;
  }

  beforeAll(async () => {
    redisContainer = await new GenericContainer("redis")
      .withExposedPorts(6379)
      .start();

    const redisHost = redisContainer.getHost();
    const redisPort = redisContainer.getMappedPort(6379);
    redisClient = createClient({
      url: `redis://${redisHost}:${redisPort}`,
    });
    await redisClient.connect();
    await redisClient.flushDb();
  });
  test("should get 0 cookies from store", async () => {
    const store = getRandomCookieStore(redisClient);
    await store.getAllCookies((err, res) => {
      expect(Array.isArray(res)).toBe(true);
      expect(res.length).toBe(0);
    });
  });
  test("should get 1 cookies from store", async () => {
    const store = getRandomCookieStore(redisClient);
    const cookie = new Cookie({
      key: "test-key",
      value: "test-value",
      path: "/",
      httpOnly: true,
      domain: "https://www.google.com",
    });
    await store.putCookie(cookie, () => {});
    await ((err, res) => {
      expect(Array.isArray(res)).toBe(true);
      expect(res.length).toBe(1);
      expect(res[0].toString()).toBe(cookie.toString());
    });
  }, 10_000);
  test("should get 10 cookies from store", async () => {
    const store = getRandomCookieStore(redisClient);
    const randomCookies = await prepare(store);
    const cookies1 = await new Promise<Cookie[]>((resolve) => {
      store.findCookies("https://www.google.com", "", true, (err, cookie) => {
        resolve(cookie);
      });
    });
    expect(Array.isArray(cookies1)).toBeTruthy();
    expect(cookies1.length).toBe(randomCookies.length);
    expect(
      cookies1.every((it) => {
        return !!randomCookies.find(
          (random) => it.toString() === random.toString()
        );
      })
    ).toBeTruthy();
  }, 10_000);
  test("should del all cookies from store", async () => {
    const store = getRandomCookieStore(redisClient);
    const randomCookies = await prepare(store);
    await store.removeAllCookies(() => {});
    await store.getAllCookies((err, res) => {
      expect(Array.isArray(res)).toBe(true);
      expect(res.length).toBe(0);
    });
  }, 10_000);
  afterAll(async () => {
    if (redisClient) {
      await redisClient.disconnect();
    }
    if (redisContainer) {
      await redisContainer.stop();
    }
  });
});
