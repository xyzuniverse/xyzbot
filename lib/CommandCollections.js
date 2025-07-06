class Collection extends Map {
  constructor(entries) {
    super(entries);
  }

  find(func) {
    for (const [key, val] of this) {
      if (func(val, key, this)) return val;
    }
    return undefined;
  }

  filter(func) {
    const results = new Collection();
    for (const [key, val] of this) {
      if (func(val, key, this)) results.set(key, val);
    }
    return results;
  }

  map(func) {
    const results = [];
    for (const [key, val] of this) {
      results.push(func(val, key, this));
    }
    return results;
  }

  some(func) {
    for (const [key, val] of this) {
      if (func(val, key, this)) return true;
    }
    return false;
  }

  every(func) {
    for (const [key, val] of this) {
      if (!func(val, key, this)) return false;
    }
    return true;
  }

  reduce(func, initialValue) {
    let accumulator = initialValue;
    for (const [key, val] of this) {
      accumulator = func(accumulator, val, key, this);
    }
    return accumulator;
  }

  first() {
    return this.values().next().value;
  }

  last() {
    return Array.from(this.values()).pop();
  }

  random() {
    if (this.size === 0) return undefined;
    const arr = Array.from(this.values());
    return arr[Math.floor(Math.random() * arr.length)];
  }

  keyArray() {
    return Array.from(this.keys());
  }

  valueArray() {
    return Array.from(this.values());
  }
}

module.exports = Collection;
