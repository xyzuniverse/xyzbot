import { TextFileSync } from './TextFileSync.ts';
import type { SyncAdapter } from '../LowSync.ts';

export class JSONFileSync<T> implements SyncAdapter<T> {
    adapter: TextFileSync;

    constructor(filename: string) {
        this.adapter = new TextFileSync(filename);
    }

    read(): T | null {
        const data = this.adapter.read();
        if (data === null) {
            return null;
        } else {
            return JSON.parse(data);
        }
    }

    write(obj: T): void {
        this.adapter.write(JSON.stringify(obj, null, 2));
    }
}
