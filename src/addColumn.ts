import {
  astMapper,
  ExprValueKeyword,
  InsertStatement,
  ValueKeyword,
} from "pgsql-ast-parser";
import { transformSql } from "./utils";

/**
 * Adds a column to PostgreSQL code with a specified value.
 * @param columnName - The name of the column to add
 * @param columnValue - The value to set for the new column (can be a literal or reference).
 * Note that this will be emitted "as is", so you need to include proper quoting and escaping if needed.
 * Example: to insert a SQL string, you need to pass "'your string'" as columnValue.
 * @param sql - The PostgreSQL code
 * @returns The modified PostgreSQL code
 */
export function addColumn(
  columnName: string,
  columnValue: string,
  sql: string
): string {
  if (!columnName) throw new Error("Invalid columnName");
  if (!columnValue) throw new Error("Invalid columnValue");
  if (!sql) throw new Error("Invalid sql");

  const mapper = astMapper((map) => ({
    insert: (stmt: InsertStatement): InsertStatement => {
      // Do not add the new column if columns are not specified in the INSERT
      const newColumns = stmt.columns
        ? [...stmt.columns, { name: columnName }]
        : stmt.columns;

      // Add value to each row if this is a VALUES clause
      if (stmt.insert.type === "values") {
        const newValues = stmt.insert.values.map((row) => [
          ...row,
          // HACK: forcing the value as keyword types because these are emitted "as is"
          // so the caller of this function can use their own quoting and/or escaping
          {
            type: "keyword",
            keyword: columnValue as unknown as ValueKeyword,
          } as const satisfies ExprValueKeyword,
        ]);

        return {
          ...stmt,
          columns: newColumns,
          insert: {
            ...stmt.insert,
            values: newValues,
          },
        };
      }

      // For other insert types (like SELECT), do nothing at the moment
      return stmt;
    },
  }));

  return transformSql(mapper, sql);
}
