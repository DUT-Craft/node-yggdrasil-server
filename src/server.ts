import * as crypto from "crypto";
import Koa from "koa";
import Router from "@koa/router";
import { v4 as uuidv4, stringify } from "uuid";

import {
    UnsignedUUID,
    User,
    Profile,
    Token,
    APIMetadata
} from "./types";
import { YggdrasilError } from "./errors";

export interface CacheStore {
    get(key: string): Promise<any>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    clear(): Promise<void>;
}

export interface DataStore {

}

/** Yggdrasil 服务器配置 */
export interface YggdrasilConfig {
    /** 服务器元数据 */
    metadata?: APIMetadata;
    /** 材质域名白名单 */
    skinDomains?: string[];
    /** cache 操作 */
    cacheStore?: CacheStore;
    /** 用户相关操作 */
    dataStore?: DataStore;
    /** 令牌过期时间（毫秒），默认 15 天 */
    tokenExpiration?: number;
    /** 会话过期时间（毫秒），默认 30 秒 */
    sessionExpiration?: number;
    /** 错误处理 */
    errorHandler?: (err: YggdrasilError, ctx: Koa.Context) => void;
}

function unsignedUUIDFromBytes(input: crypto.BinaryLike): UnsignedUUID {
    let md5Bytes = crypto.createHash('md5').update(input).digest();
    md5Bytes[6]  &= 0x0f;  /* clear version        */
    md5Bytes[6]  |= 0x30;  /* set to version 3     */
    md5Bytes[8]  &= 0x3f;  /* clear variant        */
    md5Bytes[8]  |= 0x80;  /* set to IETF variant  */
    return stringify(md5Bytes);
}

export class YggdrasilProvider {
    public readonly app: Koa;

    constructor(public config: YggdrasilConfig = {}) {
        this.config = {
            metadata: {},
            skinDomains: [],
            tokenExpiration: 15 * 24 * 60 * 60 * 1000,
            sessionExpiration: 30 * 1000,
            ...config
        };

        this.app = new Koa();
        this.app.context.yggdrasil = this;
        this.app.use(async (ctx, next) => {
            const onerror = (err: YggdrasilError, ctx: Koa.Context) => {
                if (this.config.errorHandler) {
                    this.config.errorHandler(err, ctx);
                    return;
                }
                ctx.status = err.status ?? 500;
                ctx.body = {
                    error: err.name,
                    errorMessage: err.message,
                    ...(err.cause && { cause: err.cause })
                };
            };

            try {
                ctx.type = "application/json";
                await next();
                if (ctx.status === 404) {
                    ctx.throw(ctx.status);
                }
            } catch (err: any) {
                if (!(err instanceof YggdrasilError)) {
                    err = new YggdrasilError(err.status ?? 500);
                }
                onerror(err, ctx);
            }
        });

        const router = new Router();
        // 扩展 API
        router.get("/", async (ctx) => {
            ctx.body = this.config.metadata;
        });
        // 用户部分
        router.post("/authserver/authenticate", async (ctx) => {
            ctx.throw(501);
        });
        router.post("/authserver/refresh", async (ctx) => {
            ctx.throw(501);
        });
        router.post("/authserver/validate", async (ctx) => {
            ctx.throw(501);
        });
        router.post("/authserver/invalidate", async (ctx) => {
            ctx.throw(501);
        });
        router.post("/authserver/signout", async (ctx) => {
            ctx.throw(501);
        });
        // 会话部分
        router.post("/sessionserver/session/minecraft/join", async (ctx) => {
            ctx.throw(501);
        });
        router.get("/sessionserver/session/minecraft/hasJoined", async (ctx) => {
            ctx.throw(501);
        });
        // 角色部分
        router.get("/sessionserver/session/minecraft/profile/:uuid", async (ctx) => {
            ctx.throw(501);
        });
        router.post("/api/profiles/minecraft", async (ctx) => {
            ctx.throw(501);
        });
        // 材质上传
        router.put("/api/user/profile/:uuid/:textureType", async (ctx) => {
            ctx.throw(501);
        });
        router.del("/api/user/profile/:uuid/:textureType", async (ctx) => {
            ctx.throw(501);
        });
        this.app.use(router.routes());
        this.app.use(router.allowedMethods({ throw: true }));
    }
}
