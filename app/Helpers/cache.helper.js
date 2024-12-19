const Redis = require('ioredis');
const {logToFile} = require("./base.helper");
const redis = new Redis();

class CacheHelper {
    constructor() {}

    // Phương thức lấy dữ liệu từ cache, nếu không có sẽ lấy từ database
    static async getCachedData(key, model, query = {}, ttl = 3600, attributes = null) {
        try {
            const cachedData = await redis.get(key);
            if (cachedData) {
                return JSON.parse(cachedData);
            } else {
                const data = await model.findAll({
                    ...query,
                    attributes: attributes || undefined,
                    raw: true,
                });

                if (data && data.length > 0) {
                    await redis.set(key, JSON.stringify(data), 'EX', ttl);
                }

                return data;
            }
        } catch (error) {
            console.error(`Error with cache for key: ${key}`, error);
            throw error;
        }
    }

    // Phương thức xóa cache
    static async clearCache(key) {
        try {
            await redis.del(key);
        } catch (error) {
            console.error(`Error clearing cache for key: ${key}`, error);
            throw error;
        }
    }
}

module.exports = CacheHelper;
