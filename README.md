<h1 align='center'>Humble Data – a data wrangler for humble-sized data sets</h1>
<p>
  <img alt='Version' src='https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000' />
  <a href='#' target='_blank'>
    <img alt='License: ISC' src='https://img.shields.io/badge/License-ISC-yellof.svg' />
  </a>
</p>


## Goal

Humble Data strives to be an in-memory data wrangler with a small and intuitive API. It's useful if you have a small to medium (thousands or tens of thousands) records returned from a database, and you'd like to massage and wrangle and hustle with the data in memory. 

## Concepts

You use Humble Data to build a `Frame` object from any data source of tidy data; typically from a CSV file or a database query result. The `Frame` object can then be manipulated and queried further using aggregate, selection, sorting, and filtering operations. Aggregate functions return one value. All other operations return a new `Frame` object. This allows operations to be chained.

> Humble Data works best with _tidy_ data sets. Tidy data is data that is arranged such that each row represents one sample, and each column represents one variable. In Humble Data, we call a column a `field`. 

## Install

    npm install humbledata

### Building the Frame object
The `Frame` object, once built, is immutable. You build a `Frame` object with a `Builder`. 

```typescript
// build by adding one object at a time
const frame = new Builder()
  .addRow({ name: 'foo', size: 10 })
  .addRow({ name: 'bar', size: 30 })
  .build()  

// ...or build from a given array of objects
const data = [
    { name: 'alice', age: 20, height: 170 },
    { name: 'bob', age: 30, height: 180 },
    { name: 'charlie', age: 40, height: 175 }    
]
const frame = new Builder(data).build()

// ...or build from a CSV file
const frame = await new AsyncBuilder().csv('data.csv', 'utf-8', ',')
```

### Aggregate functions
Aggregate functions return a single value calculated from applying an aggregate function to all rows that have a value for the given field.

```typescript
const sum = f.sum('age') // sum = 90
const max = f.max('height') // max = 180
const avg = f.avg('age') // avg = 30
const median = f.median('height') // median = 175
```

### Filtering
The `where` function is used to filter out rows based on a condition. The `where` function returns a new `Frame` object. 

```typescript
f.where('age', '>=', 30).print()

```

### Grouping
The `group` function combines grouping and aggregation. It groups data by given field, and then it applies an aggregate function to every item in each group. The resulting `Frame` has one `Row` per group. 

```typescript
const gameData = [
    { player: 'eva', points: 80 },
    { player: 'eva', points: 10 },
    { player: 'eva', points: 50 },
    { player: 'bob', points: 90 },
    { player: 'joe', points: 20 },
] 
new Builder(gameData)
            .build()
            .print('Player stats')
            .group('player', 'sum', 'points')
            .print('Total points per player')
     
Player stats
┌─────────┬────────┬────────┐
│ (index) │ player │ points │
├─────────┼────────┼────────┤
│    0    │ 'eva'  │   80   │
│    1    │ 'eva'  │   10   │
│    2    │ 'eva'  │   50   │
│    3    │ 'bob'  │   90   │
│    4    │ 'joe'  │   20   │
└─────────┴────────┴────────┘

Total points per player
┌─────────┬────────┬────────────┐
│ (index) │ player │ sum_points │
├─────────┼────────┼────────────┤
│    0    │ 'eva'  │    140     │
│    1    │ 'bob'  │     90     │
│    2    │ 'joe'  │     20     │
└─────────┴────────┴────────────┘
```

### Splitting
The `split` function splits one `Frame` into several, by grouping on a given field.

```typescript
const f = new Builder().addRows(peopleData).build().print()        
┌─────────┬───────────┬─────┬─────┬────────┐
│ (index) │   name    │ age │ sex │ height │
├─────────┼───────────┼─────┼─────┼────────┤
│    0    │  'alice'  │ 20  │ 'f' │  170   │
│    1    │ 'charlie' │ 40  │ 'm' │  175   │
│    2    │   'per'   │  2  │ 'm' │   95   │
│    3    │  'lise'   │  3  │ 'f' │  125   │
│    4    │ 'august'  │ 48  │ 'm' │  180   │
└─────────┴───────────┴─────┴─────┴────────┘

const res = f.split('sex')
res.map(r => r.print())
┌─────────┬─────────┬─────┬─────┬────────┐
│ (index) │  name   │ age │ sex │ height │
├─────────┼─────────┼─────┼─────┼────────┤
│    0    │ 'alice' │ 20  │ 'f' │  170   │
│    1    │ 'lise'  │  3  │ 'f' │  125   │
└─────────┴─────────┴─────┴─────┴────────┘
┌─────────┬───────────┬─────┬─────┬────────┐
│ (index) │   name    │ age │ sex │ height │
├─────────┼───────────┼─────┼─────┼────────┤
│    0    │ 'charlie' │ 40  │ 'm' │  175   │
│    1    │   'per'   │  2  │ 'm' │   95   │
│    2    │ 'august'  │ 48  │ 'm' │  180   │
└─────────┴───────────┴─────┴─────┴────────┘
```
## Running tests

`npm run test`

## Author

August Flatby

* Github: [@augustzf](https://github.com/augustzf)

## Show your support

Give this project a ⭐️ if you like this kind of stuff!
