/** 无符号 UUID: 指去掉所有 - 字符后的 UUID 字符串 */
export type UnsignedUUID = string;

/** 用户属性 */
export interface UserProperty {
    /** 属性名称 */
    name: "preferredLanguage" | string;
    /** 属性值 */
    value: string;
}

/** 用户信息 */
export interface User {
    /** 用户 ID */
    id: UnsignedUUID;
    /** 用户的属性 */
    properties: UserProperty[];
}

/** 角色属性 */
export interface ProfileProperty {
    /** 属性名称 */
    name: "textures" | "uploadableTextures";
    /** 属性值 */
    value: Object | string;
    /** 属性值的数字签名（仅在特定情况下需要包含） */
    signature?: string;
}

/** 角色信息 */
export interface Profile {
    /** 角色 UUID（无符号） */
    id: UnsignedUUID;
    /** 角色名称 */
    name: string;
    /** 角色的属性（仅在特定情况下需要包含） */
    properties?: ProfileProperty[];
}

/** 材质元数据 */
export interface TextureMetadata {
    /** 材质模型，可选值为 default（正常手臂宽度（4px）的皮肤） 或 slim（细手臂（3px）的皮肤） */
    model?: "default" | "slim";
    /** 其他自定义元数据 */
    [key: string]: any;
}

/** 材质信息 */
export interface Texture {
    /** 材质的 URL */
    url: string;
    /** 材质的元数据，若没有则不必包含 */
    metadata?: TextureMetadata;
}

/** 材质信息属性 */
export interface Textures {
    /** 该属性值被生成时的时间戳（unix 时间戳，单位为 ms） */
    timestamp: number;
    /** 角色 UUID（无符号） */
    profileId: UnsignedUUID;
    /** 角色名称 */
    profileName: string;
    /** 角色的材质 */
    textures: {
        [K in "SKIN" | "CAPE"]?: Texture;
    };
}

/** 令牌 */
export type Token = string;

/** 登录请求 */
export interface AuthenticateRequest {
    /** 邮箱（或其他凭证，如角色名称） */
    username: string;
    /** 密码 */
    password: string;
    /** 由客户端指定的令牌的 clientToken（可选） */
    clientToken?: Token;
    /** 是否在响应中包含用户信息，默认 false */
    requestUser: boolean;
    /** 代理信息 */
    agent: {
        name: "Minecraft";
        version: 1;
    };
}

/** 登录响应 */
export interface AuthenticateResponse {
    /** 令牌的 accessToken */
    accessToken: Token;
    /** 令牌的 clientToken */
    clientToken: Token;
    /** 用户可用角色列表 */
    availableProfiles: Profile[];
    /** 绑定的角色，若为空，则不需要包含 */
    selectedProfile?: Profile;
    /** 用户信息（仅当请求中 requestUser 为 true 时包含） */
    user?: User;
}

/** 刷新请求 */
export interface RefreshRequest {
    /** 令牌的 accessToken */
    accessToken: Token;
    /** 令牌的 clientToken（可选） */
    clientToken?: Token;
    /** 是否在响应中包含用户信息，默认 false */
    requestUser: boolean;
    /** 要选择的角色（可选） */
    selectedProfile?: Profile;
}

/** 刷新响应 */
export interface RefreshResponse {
    /** 新令牌的 accessToken */
    accessToken: Token;
    /** 新令牌的 clientToken */
    clientToken: Token;
    /** 新令牌绑定的角色，若为空，则不需要包含 */
    selectedProfile?: Profile;
    /** 用户信息（仅当请求中 requestUser 为 true 时包含） */
    user?: User;
}

/** 验证令牌请求 */
export interface ValidateRequest {
    /** 令牌的 accessToken */
    accessToken: Token;
    /** 令牌的 clientToken（可选） */
    clientToken?: Token;
}

/** 吊销令牌请求 */
export interface InvalidateRequest {
    /** 令牌的 accessToken */
    accessToken: Token;
    /** 令牌的 clientToken（可选） */
    clientToken?: Token;
}

/** 登出请求 */
export interface SignoutRequest {
    /** 邮箱 */
    username: string;
    /** 密码 */
    password: string;
}

/** 客户端进入服务器请求 */
export interface JoinServerRequest {
    /** 令牌的 accessToken */
    accessToken: Token;
    /** 该令牌绑定的角色的 UUID（无符号） */
    selectedProfile: UnsignedUUID;
    /** 服务端发送给客户端的 serverId */
    serverId: string;
}

/** 服务端验证客户端请求 */
export interface HasJoinedServerQuery {
    /** 角色的名称 */
    username: string;
    /** 服务端发送给客户端的 serverId */
    serverId: string;
    /** Minecraft 服务端获取到的客户端 IP，仅当 prevent-proxy-connections 选项开启时包含 */
    ip?: string;
}

/** 服务端验证客户端响应 */
export type HasJoinedServerResponse = Profile & {
    /** 必须包含角色属性及数字签名 */
    properties: UserProperty[];
};

/** 查询角色属性请求参数 */
export interface GetProfileQuery {
    /** 角色的 UUID（无符号） */
    uuid: UnsignedUUID;
    /** 是否在响应中不包含数字签名，默认为 true */
    unsigned?: boolean;
}

/** 查询角色属性响应 */
export type GetProfileResponse = Profile & {
    /** 包含角色属性，若 unsigned 为 false，还需要包含数字签名 */
    properties: ProfileProperty[];
};

/** 按名称批量查询角色请求 */
export type GetProfilesRequest = string[];

/** 按名称批量查询角色响应 */
export type GetProfilesResponse = Profile[];

/** 上传材质请求参数 */
export interface UploadTextureParams {
    /** 角色的 UUID（无符号） */
    uuid: UnsignedUUID;
    /** 材质类型，可以为 skin（皮肤）或 cape（披风） */
    textureType: "skin" | "cape";
}

/** 上传材质表单数据 */
export interface UploadTextureFormData {
    /** （仅用于皮肤）皮肤的材质模型，可以为 slim（细胳膊皮肤）或空字符串（普通皮肤） */
    model?: "" | "slim";
    /** 材质图像，Content-Type 须为 image/png */
    file: File | Buffer;
}

/** 功能选项，带有 (advanced) 标注的字段为高级选项，通常情况下不需要设置 */
export interface FeatureOptions {
    /** 指示验证服务器是否支持使用邮箱之外的凭证登录（如角色名登录），默认为 false */
    "feature.non_email_login"?: boolean;
    /** (advanced) 指示验证服务器是否支持旧式皮肤 API，默认为 false */
    "feature.legacy_skin_api"?: boolean;
    /** (advanced) 是否禁用 authlib-injector 的 Mojang 命名空间（@mojang 后缀）功能，默认为 false */
    "feature.no_mojang_namespace"?: boolean;
    /** (advanced) 是否开启 Minecraft 的 anti-features，默认为 false */
    "feature.enable_mojang_anti_features"?: boolean;
    /** (advanced) 指示验证服务器是否支持 Minecraft 的消息签名密钥对功能，默认为 false */
    "feature.enable_profile_key"?: boolean;
    /** (advanced) 指示 authlib-injector 是否启用用户名验证功能，默认为 false */
    "feature.username_check"?: boolean;
}

/** API 元数据 */
export type APIMetadata = {
    /** 服务器名称 */
    serverName?: string;
    /** 服务端实现的名称 */
    implementationName?: string;
    /** 服务端实现的版本 */
    implementationVersion?: string;
    /** 服务器网址 */
    links?: {
        /** 验证服务器首页地址 */
        homepage?: string;
        /** 注册页面地址 */
        register?: string;
    };
    /** 其他自定义元数据 */
    [key: string]: any;
} & FeatureOptions;

/** API 元数据获取响应 */
export interface GetAPIMetadataResponse {
    /** 服务端的元数据，内容任意 */
    meta: APIMetadata;
    /** 材质域名白名单 */
    skinDomains: string[];
    /** 用于验证数字签名的公钥（PEM 格式） */
    signaturePublickey: string;
}
