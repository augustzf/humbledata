import { expect } from 'chai'
import { Builder, AsyncBuilder } from '../src/index'
const path = require('path');

const peopleData = [
    { name: 'alice', age: 20, sex: 'f', height: 170 },
    { name: 'charlie', age: 40, sex: 'm', height: 175 },
    { name: 'per', age: 2, sex: 'm', height: 95 },
    { name: 'lise', age: 3, sex: 'f', height: 125 },
    { name: 'august', age: 48, sex: 'm', height: 180 },
]

const gameData = [
    { player: 'eva', game: 'peanut hunt', points: 80 },
    { player: 'eva', game: 'peanut hunt', points: 10 },
    { player: 'eva', game: 'balloon bust', points: 50 },
    { player: 'bob', game: 'peanut hunt', points: 90 },
    { player: 'joe', game: 'balloon bust', points: 20 },
    { player: 'charles', game: 'peanut hunt', points: 0 },
]

describe('Builder', () => {
    it('should build from object array', () => {
        const f = new Builder(peopleData).build()
        expect(f.rows).to.equal(5)
    })

    it('should build from rows', () => {
        const f = new Builder()
            .addRow({ name: 'foo', 'size': 10 })
            .addRow({ name: 'bar', 'size': 30 })
            .build()
        expect(f.rows).to.equal(2)
    })

    it('should build from csv file', async () => {
        const file = path.join(__dirname, './deniro.csv')
        const f = await new AsyncBuilder().csv(file)
        expect(f.rows).to.equal(87)
    })
})

describe('Sorting', () => {
    it('should sort on a field', () => {
        const f = new Builder(peopleData)
            .build()

        const youngest = f
            .sort('age', 'desc')
            .tail(1)
        expect(youngest.value('age')).to.equal(2)

        const tallest = f
            .sort('height')
            .tail(1)
        expect(tallest.value('height')).to.equal(180)
    })
})

describe('Aggregate functions', () => {
    it('should sum a field', () => {
        const f = new Builder(peopleData).build()
        const sum = f.sum('age')
        expect(sum).to.equal(113)
    })
    it('should find max for a field', () => {
        const f = new Builder(peopleData).build()
        const sum = f.max('age')
        expect(sum).to.equal(48)
    })
    it('should find min for a field', () => {
        const f = new Builder(peopleData).build()
        const sum = f.min('height')
        expect(sum).to.equal(95)
    })
    it('should find average for a field', () => {
        const f = new Builder(peopleData).build()
        const avg = f.avg('age')
        expect(avg).to.be.within(22.6, 22.7)
    })
    it('should find median for a field', () => {
        const f = new Builder(peopleData).build()
        const avg = f.median('height')
        expect(avg).to.equal(170)
    })
    it('should return undefined for aggregation function on unmatched field', () => {
        const f = new Builder(peopleData).build()
        const sum = f.max('trumpets')
        expect(sum).to.equal(undefined)
    })
})

describe('Filter functions', () => {
    it('should filter on >=', () => {
        const f = new Builder(peopleData).build()
        const old = f.where('age', '>=', 30)
        expect(old.rows).to.equal(2)
        const min = old.min('height')
        expect(min).to.equal(175)
    })

    it('should filter on !=', () => {
        const f = new Builder(peopleData).build()
        const old = f.where('age', '!=', 3)
        expect(old.rows).to.equal(4)
    })

    it('should filter on ==', () => {
        const f = new Builder(peopleData).build()
        const oldest = f.where('age', '==', 48)
        expect(oldest.value('name')).to.equal('august')
    })
})

describe('Grouping functions', () => {
    it('should apply aggregate function to grouped entries', () => {
        const frame = new Builder(gameData).build()
        const points = frame
            .group('player', 'sum', 'points')

        /*        
        points.print()
        ┌─────────┬───────────┬────────────┐
        │ (index) │  player   │ sum_points │
        ├─────────┼───────────┼────────────┤
        │    0    │   "eva"   │    140     │
        │    1    │   "bob"   │     90     │
        │    2    │   "joe"   │     20     │
        │    3    │ "charles" │     0      │
        └─────────┴───────────┴────────────┘
        */

        const evaPoints = points
            .where('player', '==', 'eva')
            .value('sum_points')
        expect(evaPoints).equals(140)

        const charlesPoints = points
            .where('player', '==', 'charles')
            .value('sum_points')
        expect(charlesPoints).equals(0)

        const players = frame
            .group('game', 'distinct', 'player')

        /*
        players.print()
        ┌─────────┬────────────────┬─────────────────┐
        │ (index) │      game      │ distinct_player │
        ├─────────┼────────────────┼─────────────────┤
        │    0    │ "peanut hunt"  │        3        │
        │    1    │ "balloon bust" │        2        │
        └─────────┴────────────────┴─────────────────┘ 
        */
        const ballonBustPlayers = players
            .where('game', '==', 'balloon bust')
            .value('distinct_player')
        expect(ballonBustPlayers).equals(2)
    })
})

describe('Uniqueness functions', () => {
    it('should find all unique values for a given field', () => {
        const f = new Builder(gameData).build()
        const u = f.distinctValues('player')
        expect(u.length).to.equal(4)
        expect(u).to.include('eva')
        expect(u).to.include('bob')
        expect(u).to.include('joe')
        expect(u).to.include('charles')
    })
})

describe('Resilience', () => {
    it('all functions should work for empty data set', () => {
        const f = new Builder().build()
        f.distinctValues('foo')
        f.avg('foo')
        f.sum('foo')
        f.min('foo')
        f.max('foo')
        f.median('foo')
        f.count('foo')
        f.distinct('foo')
        f.group('foo', 'avg', 'bar')
        f.head()
        f.tail()
        f.sort('foo')
        f.value('bar')
        f.where('foo', '!=', 'bar')
    })
})

describe('Splitting', () => {
    it('should split into frames based on groups', () => {
        const f = new Builder().addRows(peopleData).build()
        const res = f.split('sex')
        expect(res.length).to.equal(2)
    })
})