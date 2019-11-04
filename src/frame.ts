import { Builder } from "./builder"

/**
 * Aggregate functions
 */

export type AggregateFn = "sum" | "max" | "min" | "avg" | "median" | "count" | "distinct"
export type Operation = "<" | "<=" | "==" | "!=" | ">=" | ">"
export type SortOrder = "asc" | "desc"
export type Row = { [key: string]: any }

export class Frame {
    private data: Row[]

    constructor(builder: Builder) {
        this.data = builder.data
    }

    get rows() {
        return this.data.length
    }

    public print(header?: string) {
        if (header) {
            console.log(header)
        }
        console.table(this.data)
        return this
    }

    public count(field: string) {
        let num = 0
        for (const d of this.data) {
            if (d[field] !== undefined) {
                num++
            }
        }
        return num
    }

    public sum(field: string) {
        let sum = 0
        this._nums(field, val => (sum += val))
        return sum
    }

    public max(field: string): number | undefined {
        let max: number | undefined = undefined
        this._nums(field, val => {
            if (!max) {
                max = val
            } else {
                max = val > max ? val : max
            }
        })
        return max
    }

    public min(field: string): number | undefined {
        let min: number | undefined = undefined
        this._nums(field, val => {
            if (!min) {
                min = val
            } else {
                min = val < min ? val : min
            }
        })
        return min
    }

    // average / mean
    public avg(field: string): number | undefined {
        let sum = 0
        let count = 0
        this._nums(field, val => {
            sum += val
            count++
        })
        return sum / count
    }

    public median(field: string): number | undefined {
        const w = this.sort(field)
        if (w.rows === 0) {
            return undefined
        }
        if (w.rows % 2 === 1) {
            // odd number of rows, just take the middle
            return w._get((w.rows - 1) / 2)[field]
        }
        return (w._get(w.rows / 2)[field] + w._get(w.rows / 2 - 1)[field]) / 2
    }

    // sort, and leave out rows with no matching field
    public sort(field: string, order: SortOrder = "asc") {
        const w = this.select(field)
        const direction = order === "asc" ? -1 : 1
        const sorted = w.data.sort((a: any, b: any) => {
            const af = a[field]
            const bf = b[field]
            if (!af) {
                return direction
            }
            if (!bf) {
                return -direction
            }
            if (af < bf) {
                return direction
            }
            if (af > bf) {
                return -direction
            }
            return 0
        })
        return new Builder().addRows(sorted).build()
    }

    private _get(index: number): Row {
        return this.data[index]
    }

    /**
     * Returns first Row that has a matching field.
     * @param field Name of the field to match.
     */
    // public first(field: string): Row | undefined {
    //     for (const row of this.data) {
    //         const val = row[field]
    //         if (val) {
    //             return row
    //         }
    //     }
    //     return undefined
    // }

    /**
     * Returns number of distinct (unique) values for a given field.
     * @param field Name of the field to match.
     */
    public distinct(field: string): number {
        return this.distinctValues(field).length
    }

    /**
     * Returns all distinct values for a given field.
     * @param field Name of the field to match.
     */
    public distinctValues(field: string): any[] {
        const res = new Set<any>()
        for (const row of this.data) {
            const val = row[field]
            if (val !== undefined) {
                res.add(row[field])
            }
        }
        return Array.from(res)
    }

    /**
     * Groups data by given field, then applies aggregate function to every item in
     * each group. The resulting Frame includes the groupByField and a new field
     * named <fn_aggregateByField>.
     *
     * For example, given the following Frame:
     * f = [
     *  { player: "bob", game: 1, points: 90 },
     *  { player: "bob", game: 2, points: 50 },
     *  { player: "eva", game: 1, points: 100 }
     * ]
     *
     * Then f.group("name", "sum", "points") will return this Frame:
     * [
     *  { player: "bob", sum_points: 140 },
     *  { player: "eva", sum_points: 100 }
     * ]
     * @param groupByField Name of the field to group by.
     * @param fn Aggreate function name
     * @param aggregateByField Name of field that aggregate functon will be applied to.
     */
    public group(
        groupByField: string,
        fn: AggregateFn,
        aggregateByField: string
    ): Frame {
        const builder = new Builder()
        const vals = this.distinctValues(groupByField)
        const resultField = `${fn}_${aggregateByField}`
        for (const val of vals) {
            const frame = this.where(groupByField, "==", val)
            const res = (frame as any)[fn](aggregateByField)
            builder.addRow({ [groupByField]: val, [resultField]: res })
        }
        return builder.build()
    }

    public where(field: string, op: Operation, rhs: any): Frame {
        const evalFn = this._evalFn(op)
        const builder = new Builder()

        for (const row of this.data) {
            const lhs = row[field]
            if (!lhs) {
                continue
            }
            if (evalFn(lhs, rhs)) {
                builder.addRow(row)
            }
        }
        return builder.build()
    }

    /**
     * Returns array of new Frames; one per group.
     * @param field Name of the field to split frame by.
     */
    public split(field: string): Frame[] {
        const vals = this.distinctValues(field)
        const res = vals.map(val => this.where(field, "==", val))
        return res
    }

    public select(field: string): Frame {
        return new Builder().addRows(this.data.filter(row => !!row[field])).build()
    }

    /**
     * Returns the one and only matching value for a given field.
     * Prerequisite: the frame must have exactly one row, typically
     * as a result of a combination of distinct() and where().
     *
     * Example:
     * const evaPoints = frame
     *      .group('player', 'sum', 'points')
     *      .where('player', '==', 'eva')
     *      .value('sum_points')
     *
     * @param field
     */
    public value(field: string): any | undefined {
        if (this.data.length !== 1) {
            return undefined
        }
        return this.data[0][field]
    }

    public head(rows = 5): Frame {
        return this._slice(0, Math.min(rows, this.rows))
    }

    public tail(rows = 5): Frame {
        return this._slice(-Math.min(rows, this.rows))
    }

    public _slice(start: number, end?: number): Frame {
        return new Builder().addRows(this.data.slice(start, end)).build()
    }

    // returns evaluation function given an Operation
    private _evalFn(op: Operation): (lsh: any, rhs: any) => boolean {
        switch (op) {
            case "<":
                return (lhs: any, rhs: any) => lhs < rhs
            case ">":
                return (lhs: any, rhs: any) => lhs > rhs
            case "<=":
                return (lhs: any, rhs: any) => lhs <= rhs
            case ">=":
                return (lhs: any, rhs: any) => lhs >= rhs
            case "==":
                return (lhs: any, rhs: any) => lhs === rhs
            case "!=":
                return (lhs: any, rhs: any) => lhs !== rhs
        }
    }

    // evaluate function for all rows with a given (numeric) field
    private _nums(field: string, fn: (val: number) => void) {
        for (const d of this.data) {
            const val = d[field]
            if (val && typeof val === "number") {
                fn(val)
            }
        }
    }

    private _iterate(field: string, fn: (row: any) => void) {
        for (const row of this.data) {
            fn(row)
        }
    }

    // TODO: fix
    private _eval(field: string, op: (match: Row) => void) {
        for (const row of this.data) {
            const match = row[field]
            if (match) {
                op(row)
            }
        }
    }
}
