import { MissingAdapterError } from './MissingAdapterError.ts';

export interface SyncAdapter<T> {
    read: () => T | null;
    write: (data: T) => void;
}

export class LowSync<T = any> {
    adapter: SyncAdapter<T>;
    data: T | null = null;

    constructor(adapter: SyncAdapter<T>) {
        if (adapter) {
            this.adapter = adapter;
        } else {
            throw new MissingAdapterError();
        }
    }

    read(): void {
        this.data = this.adapter.read();
    }

    write(): void {
        if (this.data !== null) {
            this.adapter.write(this.data);
        }
    }
}
