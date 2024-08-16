# Redis Cookie Store

a Redis store for tough-cookie module.
See [tough-cookie documentation](https://github.com/goinstant/tough-cookie#constructionstore--new-memorycookiestore-rejectpublicsuffixes)
for more info.

This package is forked from <https://github.com/benkroeger/redis-cookie-store> and provides various improvements.

## Installation

```sh
npm install --save @aaly00/tough-cookie-store-redis
```

## Options

* `client` An existing redis client object you normally get from `redis.createClient()`
* `id` **optional** ID for each redis store so that we can use multiple stores with the same redis database [
  *default:* 'default']

## Usage

```ts
import { createClient } from 'redis';
import { CookieJar } from 'tough-cookie';
import { RedisCookieStore } from "@amraly/tough-cookie-store-redis"

const client = createClient();

const defaultCookieJar = new CookieJar(new RedisCookieStore(client));

const customCookieJar = new CookieJar(new RedisCookieStore(client, 'my-cookie-store'));
```

## License

MIT
