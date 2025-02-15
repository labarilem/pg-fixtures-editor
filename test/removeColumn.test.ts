import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { removeColumn } from "../src/removeColumn";
import { assertInputToOutput } from "./utils";

describe("removeColumn", () => {
  describe("from INSERTs", () => {
    test("removes a simple column from single row insert", () => {
      assertInputToOutput(
        `INSERT INTO "userAccounts" (id, name, email) VALUES (1, 'John', 'john@example.com')`,
        "email",
        `INSERT INTO "userAccounts" (id, name) VALUES\n  ((1), ('John'))`
      );
    });

    test("removes a column from multi-row insert", () => {
      assertInputToOutput(
        `INSERT INTO "userAccounts" (id, name, email) VALUES (1, 'John', 'john@example.com'), (2, 'Jane', 'jane@example.com')`,
        "email",
        `INSERT INTO "userAccounts" (id, name) VALUES\n  ((1), ('John')),\n  ((2), ('Jane'))`
      );
    });

    test("handles column with type cast", () => {
      assertInputToOutput(
        `INSERT INTO users (id, name, email) VALUES
        (1, 'John', 'john@example.com'::"custom_email"),
        (2, 'Jane', 'jane@example.com'::"custom_email")`,
        "email",
        `INSERT INTO users (id, name) VALUES\n  ((1), ('John')),\n  ((2), ('Jane'))`
      );
    });

    test("handles column with expressions", () => {
      assertInputToOutput(
        `INSERT INTO products (id, name, price, total) VALUES
        (1, 'Widget', 10.00, price * 1.2),
        (2, 'Gadget', 20.00, price * 1.2)`,
        "total",
        `INSERT INTO products (id, name, price) VALUES\n  ((1), ('Widget'), (10.)),\n  ((2), ('Gadget'), (20.))`
      );
    });

    test("returns unchanged SQL when column not found", () => {
      assertInputToOutput(
        `INSERT INTO users (id, name) VALUES (1, 'John')`,
        "email",
        `INSERT INTO users (id, name) VALUES\n  ((1), ('John'))`
      );
    });

    test("handles quoted identifiers", () => {
      assertInputToOutput(
        `INSERT INTO "user_data" ("userId", "fullName", "emailAddress") VALUES (1, 'John Doe', 'john@example.com')`,
        "emailAddress",
        `INSERT INTO user_data (userId, fullName) VALUES\n  ((1), ('John Doe'))`
      );  
    });

    test("throws error on invalid SQL", () => {
      const invalidSql = `INSERT INTO users (id, name VALUES (1, 'John')`; // Missing closing parenthesis
      assert.throws(() => removeColumn("name", invalidSql));
    });

    test("handles NULL values", () => {
      assertInputToOutput(
        `INSERT INTO users (id, name, email) VALUES (1, NULL, 'john@example.com')`,
        "name",
        `INSERT INTO users (id, email) VALUES\n  ((1), ('john@example.com'))`
      );
    });

    test("handles string values containing special characters", () => {
      assertInputToOutput(
        `INSERT INTO users (id, name, email) VALUES
        (1, 'O''Connor', 'oconnor@example.com'),
        (2, 'Smith; DROP TABLE users;', 'smith@example.com')`,
        "email",
        `INSERT INTO users (id, name) VALUES\n  ((1), ('O''Connor')),\n  ((2), ('Smith; DROP TABLE users;'))`
      );
    });
  });
});
