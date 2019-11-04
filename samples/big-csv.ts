import { Frame, Builder } from '../src'
import * as fs from 'fs'

const csv = fs.readFileSync(`${__dirname}/sample.csv`, 'utf8');

const w = new Builder()
    // .csv(csv)
    .build()

w.print()