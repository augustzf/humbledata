import * as parse from 'csv-parse'
import * as fs from 'fs'
import { Builder } from './builder'
import { Frame } from './frame'

export class AsyncBuilder extends Builder {
    public async csv(path: string, encoding = 'utf8', delimiter = ','): Promise<Frame> {
        return new Promise((resolve, reject) => {
            const parser = parse({
                delimiter: delimiter,
                columns: true,
                skip_empty_lines: true
            })
            fs.createReadStream(path, encoding)
                .on('error', (err) => {
                    reject(err)
                })
                .pipe(parser)
                .on('data', row => {
                    this.addRow(row)
                })
                .on('end', () => {
                    resolve(this.build())
                })
        })
    }
}
