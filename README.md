# pg-fixtures-editor

Library with some utilities to edit SQL fixtures for Postgres databases.

It uses [pgsql-ast-parser](https://github.com/oguimbal/pgsql-ast-parser) to parse and emit SQL code.

## Rationale

Have you ever had to edit a SQL fixture after a DB schema migration? If you have, you know it's a real pain. This library aims to make this process easier.

## Features

The API of this library exposes these functions:

- `removeColumn`: removes a column from `INSERT` statements.

## Installation

```bash
npm install pg-fixtures-editor
```

## Usage

```ts
import { removeColumn } from "pg-fixtures-editor";

const sql = `
    INSERT INTO users (id, name, email) VALUES
    (1, 'John', 'john@example.com'),
    (2, 'Jane', 'jane@example.com')
`;
const newSql = removeColumn("email", sql);
```

## Quirks

While this project aims for a very specific and limited feature set, it's in early development stage and its API might break.

Some quirks:

- At the moment, comments are not preserved.
- Spacing and formatting is not always preserved.
- The output SQL aims to be human readable when possible (e.g. multi-line `INSERT` statements).

Hopefully those quirks shouldn't matter too much when editing SQL fixtures.

## Development

Build the project:

```bash
npm run build
```

Run tests:

```bash
npm test
```

Publish a new version:

```bash
npm run pub
```
