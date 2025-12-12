import fs from 'fs';
import { Writer } from 'steno';
import type { Adapter } from '../Low.ts';

export class TextFile implements Adapter<string> {
    filename: string;
    writer: Writer;

    constructor(filename: string) {
        this.filename = filename;
        this.writer = new Writer(filename);
    }

    async read(): Promise<string | null> {
        let data;
        try {
            data = await fs.promises.readFile(this.filename, 'utf-8');
        } catch (e: any) {
            if (e.code === 'ENOENT') {
                return null;
            }
            throw e;
        }
        return data;
    }

    async write(str: string): Promise<void> {
        return this.writer.write(str);
    }
}
