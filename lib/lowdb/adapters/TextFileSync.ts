import fs from 'fs';
import path from 'path';
import type { SyncAdapter } from '../LowSync.ts';

export class TextFileSync implements SyncAdapter<string> {
    filename: string;
    tempFilename: string;

    constructor(filename: string) {
        this.filename = filename;
        this.tempFilename = path.join(path.dirname(filename), `.${path.basename(filename)}.tmp`);
    }

    read(): string | null {
        let data;
        try {
            data = fs.readFileSync(this.filename, 'utf-8');
        } catch (e: any) {
            if (e.code === 'ENOENT') {
                return null;
            }
            throw e;
        }
        return data;
    }

    write(str: string): void {
        fs.writeFileSync(this.tempFilename, str);
        fs.renameSync(this.tempFilename, this.filename);
    }
}
