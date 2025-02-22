import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { addColumn } from "../src/addColumn";
import { assertAddColumn } from "./utils";

describe("addColumn", () => {
  describe("to INSERTs", () => {
    test("adds a simple boolean column to single row insert", () => {
      assertAddColumn(
        `INSERT INTO "userAccounts" (id, name) VALUES (1, 'John')`,
        "active",
        "true",
        `INSERT INTO "userAccounts" (id, name, active) VALUES\n  ((1), ('John'), (true ))`
      );
    });

    test("adds a column to multi-row insert with single quotes enclosed value", () => {
      assertAddColumn(
        `INSERT INTO "userAccounts" (id, name) VALUES (1, 'John'), (2, 'Jane')`,
        "status",
        "'pending'",
        `INSERT INTO "userAccounts" (id, name, status) VALUES\n  ((1), ('John'), ('pending' )),\n  ((2), ('Jane'), ('pending' ))`
      );
    });

    test("adds a column to multi-row insert with double quotes enclosed value", () => {
      assertAddColumn(
        `INSERT INTO "userAccounts" (id, name) VALUES (1, 'John'), (2, 'Jane')`,
        "status",
        '"oldStatus"',
        `INSERT INTO "userAccounts" (id, name, status) VALUES\n  ((1), ('John'), ("oldStatus" )),\n  ((2), ('Jane'), ("oldStatus" ))`
      );
    });

    test("adds column to insert with type cast values", () => {
      assertAddColumn(
        `INSERT INTO users (id, name) VALUES (1, 'John'::"user_name"), (2, 'Jane'::"user_name")`,
        "created_at",
        "NOW()",
        `INSERT INTO users (id, name, created_at) VALUES\n  ((1), (('John')::"user_name" ), (NOW() )),\n  ((2), (('Jane')::"user_name" ), (NOW() ))`
      );
    });

    test("adds column to insert with expressions", () => {
      assertAddColumn(
        `INSERT INTO products (id, price) VALUES (1, 10.00), (2, 20.00)`,
        "total",
        "price * 1.2",
        `INSERT INTO products (id, price, total) VALUES\n  ((1), (10.), (price * 1.2 )),\n  ((2), (20.), (price * 1.2 ))`
      );
    });

    test("adds only value and not column too to empty columns list", () => {
      assertAddColumn(
        `INSERT INTO users VALUES (1, 'John')`,
        "active",
        "true",
        `INSERT INTO users VALUES\n  ((1), ('John'), (true ))`
      );
    });

    test("handles quoted identifiers", () => {
      assertAddColumn(
        `INSERT INTO "userData" ("userId", "fullName") VALUES (1, 'John Doe')`,
        "isVerified",
        "false",
        `INSERT INTO "userData" ("userId", "fullName", "isVerified") VALUES\n  ((1), ('John Doe'), (false ))`
      );
    });

    test("throws error on invalid SQL", () => {
      const invalidSql = `INSERT INTO users (id, name VALUES (1, 'John')`; // Missing closing parenthesis
      assert.throws(() => addColumn("active", "true", invalidSql));
    });

    test("handles NULL value insertion", () => {
      assertAddColumn(
        `INSERT INTO users (id) VALUES (1)`,
        "name",
        "NULL",
        `INSERT INTO users (id, name) VALUES\n  ((1), (NULL ))`
      );
    });

    test("preserves end of input formatting", () => {
      assertAddColumn(
        `INSERT INTO "userAccounts" (id) VALUES (1);\n  `,
        "email",
        "'test@example.com'",
        `INSERT INTO "userAccounts" (id, email) VALUES\n  ((1), ('test@example.com' ));\n  `
      );
    });
  });
});
