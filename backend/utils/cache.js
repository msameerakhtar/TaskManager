const cache = new Map();

/**
 * Get value from in-memory cache
 * @param {string} key 
 * @returns {any|null}
 */
const get = (key) => {
    const item = cache.get(key);
    if (!item) return null;
    
    // Check expiration
    if (Date.now() > item.expiresAt) {
        cache.delete(key);
        return null;
    }
    return item.value;
};

/**
 * Set value in in-memory cache with Time-To-Live (TTL)
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttlSeconds - Time to live in seconds (default: 5 minutes)
 */
const set = (key, value, ttlSeconds = 300) => {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    cache.set(key, { value, expiresAt });
};

/**
 * Delete key from cache
 * @param {string} key 
 */
const del = (key) => {
    cache.delete(key);
};

/**
 * Clear entire cache
 */
const clear = () => {
    cache.clear();
};

module.exports = { get, set, del, clear };
