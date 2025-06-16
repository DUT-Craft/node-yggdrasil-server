import * as crypto from "crypto";
import Koa from "koa";
import Router from "@koa/router";
import { v4 as uuidv4 } from "uuid";

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
    errorHandler?: (err: Error, ctx: Koa.Context) => void;
}

export class YggdrasilProvider {
    public app: Koa;

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
            try {
                await next();
            } catch (err) {

            }
        });

        const router = new Router();
        // 扩展 API
        router.get("/", async (ctx) => {});
        // 用户部分
        router.post("/authserver/authenticate", async (ctx) => {});
        router.post("/authserver/refresh", async (ctx) => {});
        router.post("/authserver/validate", async (ctx) => {});
        router.post("/authserver/invalidate", async (ctx) => {});
        router.post("/authserver/signout", async (ctx) => {});
        // 会话部分
        router.post("/sessionserver/session/minecraft/join", async (ctx) => {});
        router.get("/sessionserver/session/minecraft/hasJoined", async (ctx) => {});
        // 角色部分
        router.get("/sessionserver/session/minecraft/profile/:uuid", async (ctx) => {});
        router.post("/api/profiles/minecraft", async (ctx) => {});
        // 材质上传
        router.put("/api/user/profile/:uuid/:textureType", async (ctx) => {});
        router.del("/api/user/profile/:uuid/:textureType", async (ctx) => {});
        this.app.use(router.routes());
        this.app.use(router.allowedMethods());
    }
}
