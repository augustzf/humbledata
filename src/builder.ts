import { Row, Frame } from "./frame"

export class Builder {
    // tslint:disable-next-line: variable-name
    private _data: Row[]

    constructor(data?: Row[]) {
        this._data = data || []
    }

    public addRow(row: Row) {
        this._data.push(row)
        return this
    }

    public addRows(rows: Row[]) {
        this._data = rows
        return this
    }

    get data(): Row[] {
        return this._data
    }

    public build() {
        return new Frame(this)
    }
}
