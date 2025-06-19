import { YggdrasilProvider, User, Profile, ProfileProperty, unsignedUUIDFromBytes } from "../src/index";
import packageJson from "../package.json";

const cache = new Map<string, any>();

const database: {
    [key: string]: User & {
        password: string;
        profiles: Profile[];
    }
} = {
    "GameGuard_": {
        password: "miaomiaomiao", // Example password, **should be hashed** in production
        id: unsignedUUIDFromBytes("OfflinePlayer:" + "GameGuard_"),
        properties: [{
            name: "preferredLanguage",
            value: "zh_cn"
        }],
        profiles: [{
            id: unsignedUUIDFromBytes("OfflinePlayer:" + "GameGuard_"),
            name: "GameGuard_",
            properties: [{
                name: "textures",
                value: {
                    timestamp: Date.now(),
                    profileId: unsignedUUIDFromBytes("OfflinePlayer:" + "GameGuard_"),
                    profileName: "GameGuard_",
                    textures: {
                        SKIN: {
                            url: "http://textures.minecraft.net/texture/836ea8d634ef057fa7aff07cbfa9404dbf76e40b5dde8519d58f76b3fef9e8d1"
                        }
                    }
                }
            } as ProfileProperty]
        }]
    }
};

console.debug(JSON.stringify(database, null, 2));

const yggdrasil = new YggdrasilProvider({
    metadata: {
        serverName: "DUT-Craft Skin Server",
        implementationName: packageJson.name,
        implementationVersion: packageJson.version,
        links: {
            homepage: packageJson.homepage,
            register: packageJson.homepage,
        },
        "features.non_email_login": true
    },
    skinDomains: [
        "skin.prinzeugen.net"
    ],
    signaturePublickey: "-----BEGIN PUBLIC KEY-----\n\
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAphFumj3ONU55fGQrAKOD\n\
3t/pKoUB6RAAaK6EX8qa7bc3NmOTe6OSEFKgRS3saBk1RbsE+eZ09+YYaFz3srOU\n\
T6z8JHsvs03ZZuDUIFfcOlMzJCYxK6DaRSs+9uZGLyucn9f82pb7fwArW0xvP5rp\n\
jjcYqlwkjTKnLwRe12m3ArsiFzvzMbBzG0KIzqXuG6+p0nvwjnxjFw87TnVxRp1R\n\
WikLYR4HQ8VpiMsVc7l0yKuULl08O/gJaQ+kiFTeLCVTobrmpNczF3k9qrgVKaZs\n\
q6wotFO+WqL29HoOkriRjDjuOjGVTlZga6mfrW46bDrJ/CyniTjnEqTBZAs/c+nH\n\
RmaVn2Diqmy3b5U4W1EmHH8LhifLycPiCSYfbpHGZ8kqaZyx0X6PzAQX7VLugTSi\n\
p/1jLGZ8yoCF/ucnO4PM06jDJFAxnWJyvPOqM/DXYsIfD43OOHPLtrxjWM0eES0c\n\
SMe92F1e58eS4s6pg4Ebi/kSlinV/zmD4dT3RntRWPU8EJ8YrsMP20jS3PZ3bdBv\n\
jQ9sIw027DpSbqVGPMDdEkYd7EfaPyDIJTJbsEZ1y/KCmaxPxCteJJDyA4klwoeo\n\
KrHcgbmUfCj7TvsC2/bw8ZbSSRAro5IsQNP23YrLG37SyBp48f4DXLBALQg/PH9g\n\
t+zYx46l/HfYaPySUBhqu00CAwEAAQ==\n\
-----END PUBLIC KEY-----",
    signaturePrivatekey:  "-----BEGIN RSA PRIVATE KEY-----\n\
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\n\
-----END RSA PRIVATE KEY-----",
    cacheStore: {
        async has(key) {
            return cache.has(key);
        },
        async get(key) {
            return cache.get(key);
        },
        async set(key, value) {
            cache.set(key, value);
        },
        async del(key) {
            cache.delete(key);
        },
        async clear() {
            cache.clear();
        }
    },
    dataStore: {
        async findUser(username, password) {
            let user = database[username];
            if (!user || user.password !== password) {
                return null;
            }
            return {
                id: user.id,
                properties: user.properties
            };
        },
        async getUser(username) {
            let user = database[username];
            if (!user) {
                return null;
            }
            return {
                id: user.id,
                properties: user.properties
            };
        },
        async getCurrentProfile(username) {
            let user = database[username];
            if (!user) {
                return null;
            }
            return user.profiles?.[0] || null;
        },
        async setCurrentProfile(username, profile) {
            return true;
        },
        async getProfiles(username) {
            let user = database[username];
            if (!user) {
                return [];
            }
            return user.profiles;
        },
        async getProfileByUUID(uuid) {
            for (let user of Object.values(database)) {
                let profile = user.profiles?.find(p => p.id === uuid);
                if (profile) {
                    return profile as Profile;
                }
            }
            return null;
        },
        async getProfileByName(name) {
            for (let user of Object.values(database)) {
                let profile = user.profiles?.find(p => p.name === name);
                if (profile) {
                    return profile as Profile;
                }
            }
            return null;
        }
    }
});

yggdrasil.app.listen(20000, () => {
    console.log("Yggdrasil server is running on port 20000");
});
