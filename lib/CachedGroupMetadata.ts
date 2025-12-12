import type { WASocket, GroupMetadata } from 'baileys';

class GroupMetadataCache {
    private cache: Map<string, { metadata: GroupMetadata; expiresAt: number }>;
    private expirationTime: number;

    constructor(expirationTime = 300000) {
        // Default: 5 minutes
        this.cache = new Map();
        this.expirationTime = expirationTime;
    }
    set(jid: string, metadata: GroupMetadata) {
        const expiresAt = Date.now() + this.expirationTime;
        this.cache.set(jid, { metadata, expiresAt });
    }
    get(jid: string): GroupMetadata | null {
        const data = this.cache.get(jid);
        if (data && data.expiresAt > Date.now()) {
            return data.metadata;
        }
        this.cache.delete(jid);
        return null;
    }
    has(jid: string): boolean {
        const data = this.cache.get(jid);
        return !!(data && data.expiresAt > Date.now());
    }
    clear() {
        this.cache.clear();
    }
}

export const getGroupMetadata = async (jid: string, sock: WASocket): Promise<GroupMetadata | null> => {
    const groupMetadataCache = new GroupMetadataCache();
    if (groupMetadataCache.has(jid)) {
        return groupMetadataCache.get(jid);
    }
    try {
        const metadata = await sock.groupMetadata(jid);
        groupMetadataCache.set(jid, metadata);
        return metadata;
    } catch (err) {
        console.error(`Failed to fetch metadata for group ${jid}:`, err);
        return null;
    }
};
