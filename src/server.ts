import * as crypto from "crypto";
import Koa from "koa";
import koaBody from "koa-body";
import Router from "@koa/router";
import { v4 as uuidv4 } from "uuid";

import {
    UnsignedUUID,
    User,
    Profile,
    Texture,
    APIMetadata,
    Token,
    AuthenticateResponse,
    AuthenticateRequest,
    RefreshRequest,
    RefreshResponse,
    ValidateRequest,
    InvalidateRequest,
    SignoutRequest,
    JoinServerRequest,
    HasJoinedServerQuery
} from "./types";
import { YggdrasilError, InvalidTokenError, AuthenticationError, WrongProfileError } from "./errors";

export interface CacheStore {
    has(key: string): Promise<boolean>;
    get(key: string): Promise<any>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    clear(): Promise<void>;
}

export interface DataStore {
    findUser(username: string, password: string): Promise<User | null>;
    getUser(username: string): Promise<User | null>;
    getCurrentProfile(username: string): Promise<Profile | null>;
    setCurrentProfile(username: string, profile: Profile): Promise<boolean>;
    getProfiles(username: string): Promise<Profile[]>;
    getProfileByUUID(uuid: UnsignedUUID): Promise<Profile | null>;
    getProfileByName(name: string): Promise<Profile | null>;
}

/** Yggdrasil 服务器配置 */
export interface YggdrasilConfig {
    /** 服务器元数据 */
    metadata?: APIMetadata;
    /** 材质域名白名单 */
    skinDomains?: string[];
    /** 用于验证数字签名的公钥（PEM 格式） */
    signaturePublickey: string;
    /** 用于数字签名的私钥 */
    signaturePrivatekey: string;
    /** cache 操作 */
    cacheStore: CacheStore;
    /** 用户相关操作 */
    dataStore: DataStore;
    /** 令牌过期时间（毫秒），默认 15 天 */
    tokenExpiration?: number;
    /** 会话过期时间（毫秒），默认 30 秒 */
    sessionExpiration?: number;
    /** 错误处理 */
    errorHandler?: (err: YggdrasilError, ctx: Koa.Context) => void;
}

export const ALI = "X-Authlib-Injector-API-Location";

export class YggdrasilProvider {
    public readonly app: Koa;
    private readonly privateKey: crypto.KeyObject;

    constructor(public config: YggdrasilConfig) {
        this.config = {
            metadata: {},
            skinDomains: [],
            tokenExpiration: 15 * 24 * 60 * 60 * 1000,
            sessionExpiration: 30 * 1000,
            ...config
        };
        this.privateKey = crypto.createPrivateKey({
            key: this.config.signaturePrivatekey,
            format: "pem",
            type: "pkcs1"
        });

        this.app = new Koa();
        this.app.use(async (ctx, next) => {
            const onerror = (err: YggdrasilError, ctx: Koa.Context) => {
                if (this.config.errorHandler) {
                    this.config.errorHandler(err, ctx);
                    return;
                }
                ctx.status = err.status;
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
        this.app.use(koaBody());

        const router = new Router();
        // 扩展 API
        router.get("/", async (ctx) => {
            ctx.body = {
                meta: this.config.metadata,
                skinDomains: this.config.skinDomains,
                signaturePublickey: this.config.signaturePublickey
            };
        });
        // 用户部分
        router.post("/authserver/authenticate", async (ctx) => {
            let data: AuthenticateRequest = ctx.request.body;

            let user = await this.config.dataStore.findUser(data.username, data.password);
            if (!user) {
                throw new AuthenticationError();
            }
            let profiles = await this.config.dataStore.getProfiles(data.username);
            let current = await this.config.dataStore.getCurrentProfile(data.username);

            let accessToken = uuidv4() as Token;
            await this.config.cacheStore.set(`mc:${accessToken}`, data.username, this.config.tokenExpiration);

            let result: AuthenticateResponse = {
                accessToken: accessToken,
                clientToken: data.clientToken ?? uuidv4() as Token,
                availableProfiles: profiles,
            };
            if (current) {
                result.selectedProfile = current;
            }
            if (data.requestUser) {
                result.user = user;
            }
            ctx.body = result;
        });
        router.post("/authserver/refresh", async (ctx) => {
            let data: RefreshRequest = ctx.request.body;

            let username = await this.config.cacheStore.get(`mc:${data.accessToken}`);
            if (!username) {
                throw new InvalidTokenError();
            }

            let profiles = await this.config.dataStore.getProfiles(username);
            let current = await this.config.dataStore.getCurrentProfile(username);
            if (data.selectedProfile) {
                let newProfile = profiles.find(p => p.id === data.selectedProfile!.id);
                if (!newProfile) {
                    throw new WrongProfileError();
                }
                current = newProfile;
                this.config.dataStore.setCurrentProfile(username, current);
            }
            if (!current) {
                throw new WrongProfileError();
            }

            await this.config.cacheStore.del(`mc:${data.accessToken}`);
            let accessToken = uuidv4() as Token;
            await this.config.cacheStore.set(`mc:${accessToken}`, username, this.config.tokenExpiration);

            let result: RefreshResponse = {
                accessToken: accessToken,
                clientToken: data.clientToken ?? uuidv4() as Token,
                selectedProfile: current
            };
            if (data.requestUser) {
                result.user = await this.config.dataStore.getUser(username) ?? undefined;
            }
            ctx.body = result;
        });
        router.post("/authserver/validate", async (ctx) => {
            let data: ValidateRequest = ctx.request.body;

            if (!await this.config.cacheStore.has(`mc:${data.accessToken}`)) {
                throw new InvalidTokenError();
            }

            ctx.status = 204;
        });
        router.post("/authserver/invalidate", async (ctx) => {
            let data: InvalidateRequest = ctx.request.body;

            await this.config.cacheStore.del(`mc:${data.accessToken}`);

            ctx.status = 204;
        });
        router.post("/authserver/signout", async (ctx) => {
            let data: SignoutRequest = ctx.request.body;

            let user = await this.config.dataStore.findUser(data.username, data.password);
            if (!user) {
                throw new AuthenticationError();
            }

            ctx.status = 204;
        });
        // 会话部分
        router.post("/sessionserver/session/minecraft/join", async (ctx) => {
            let data: JoinServerRequest = ctx.request.body;

            if (!await this.config.cacheStore.has(`mc:${data.accessToken}`)) {
                throw new InvalidTokenError();
            }

            await this.config.cacheStore.set(`mcsession:${data.serverId}`, data.accessToken, this.config.sessionExpiration);

            ctx.status = 204;
        });
        router.get("/sessionserver/session/minecraft/hasJoined", async (ctx) => {
            let data: HasJoinedServerQuery = ctx.query as any;

            let accessToken = await this.config.cacheStore.get(`mcsession:${data.serverId}`);
            if (!accessToken) {
                ctx.status = 204;
                return;
            }

            let username = await this.config.cacheStore.get(`mc:${accessToken}`);
            if (!username) {
                ctx.status = 204;
                return;
            }
            
            let profiles = await this.config.dataStore.getProfiles(username);
            let profile = profiles.find(p => p.name === data.username);
            if (!profile) {
                ctx.status = 204;
                return;
            }

            profile.properties?.forEach(prop => {
                if (typeof prop.value !== "string") {
                    prop.value = Buffer.from(JSON.stringify(prop.value)).toString("base64");
                }
                prop.signature = crypto.sign("sha1", Buffer.from(prop.value as string), this.privateKey).toString("base64");
            });
            ctx.body = profile;
        });
        // 角色部分
        router.get("/sessionserver/session/minecraft/profile/:uuid", async (ctx) => {
            let uuid = ctx.params.uuid as UnsignedUUID;
            let unsigned = ctx.query.unsigned ? Boolean(ctx.query.unsigned) : true;

            let profile = await this.config.dataStore.getProfileByUUID(uuid);
            if (!profile) {
                ctx.throw(404);
                return;
            }

            profile.properties?.forEach(prop => {
                if (typeof prop.value !== "string") {
                    prop.value = Buffer.from(JSON.stringify(prop.value)).toString("base64");
                }
                if (!unsigned) {
                    prop.signature = crypto.sign("sha1", Buffer.from(prop.value as string), this.privateKey).toString("base64");
                }
            });
            ctx.body = profile;
        });
        router.post("/api/profiles/minecraft", async (ctx) => {
            let data: Array<string> = ctx.request.body;

            ctx.body = await Promise.all(
                data.slice(0, Math.min(data.length, 64))
                    .map(async (name) => {
                        let profile = await this.config.dataStore.getProfileByName(name);
                        if (!profile) {
                            return null;
                        }
                        profile.properties?.forEach(prop => {
                            if (typeof prop.value !== "string") {
                                prop.value = Buffer.from(JSON.stringify(prop.value)).toString("base64");
                            }
                        });
                        return profile;
                    })
            ).then(profiles => profiles.filter(p => p !== null));
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
