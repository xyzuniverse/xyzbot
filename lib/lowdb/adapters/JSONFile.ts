import { TextFile } from './TextFile.ts';
import type { Adapter } from '../Low.ts';

export class JSONFile<T> implements Adapter<T> {
    adapter: TextFile;

    constructor(filename: string) {
        this.adapter = new TextFile(filename);
    }

    async read(): Promise<T | null> {
        const data = await this.adapter.read();
        if (data === null) {
            return null;
        } else {
            return JSON.parse(data);
        }
    }

    async write(obj: T): Promise<void> {
        return this.adapter.write(JSON.stringify(obj, null, 2));
    }
}
