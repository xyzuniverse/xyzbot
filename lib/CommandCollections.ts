export default class Collection<K, V> extends Map<K, V> {
    constructor(entries?: readonly (readonly [K, V])[] | null) {
        super(entries);
    }

    find(func: (val: V, key: K, collection: this) => boolean): V | undefined {
        for (const [key, val] of this) {
            if (func(val, key, this)) return val;
        }
        return undefined;
    }

    filter(func: (val: V, key: K, collection: this) => boolean): Collection<K, V> {
        const results = new Collection<K, V>();
        for (const [key, val] of this) {
            if (func(val, key, this)) results.set(key, val);
        }
        return results;
    }

    map<T>(func: (val: V, key: K, collection: this) => T): T[] {
        const results: T[] = [];
        for (const [key, val] of this) {
            results.push(func(val, key, this));
        }
        return results;
    }

    some(func: (val: V, key: K, collection: this) => boolean): boolean {
        for (const [key, val] of this) {
            if (func(val, key, this)) return true;
        }
        return false;
    }

    every(func: (val: V, key: K, collection: this) => boolean): boolean {
        for (const [key, val] of this) {
            if (!func(val, key, this)) return false;
        }
        return true;
    }

    reduce<T>(func: (accumulator: T, val: V, key: K, collection: this) => T, initialValue: T): T {
        let accumulator = initialValue;
        for (const [key, val] of this) {
            accumulator = func(accumulator, val, key, this);
        }
        return accumulator;
    }

    first(): V | undefined {
        return this.values().next().value;
    }

    last(): V | undefined {
        return Array.from(this.values()).pop();
    }

    random(): V | undefined {
        if (this.size === 0) return undefined;
        const arr = Array.from(this.values());
        return arr[Math.floor(Math.random() * arr.length)];
    }

    keyArray(): K[] {
        return Array.from(this.keys());
    }

    valueArray(): V[] {
        return Array.from(this.values());
    }
}
