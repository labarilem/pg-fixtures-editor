import { astMapper, InsertStatement, parse, toSql } from "pgsql-ast-parser";

/**
 * Removes a column from PosgreSQL code.
 * @param columnName - The name of the column to remove
 * @param sql - The PosgreSQL code
 * @returns The modified PosgreSQL code
 */
export function removeColumn(columnName: string, sql: string): string {
  // Create AST mapper to handle modifications
  const mapper = astMapper((map) => ({
    // Handle insert statements
    insert: (stmt: InsertStatement) => {
      if (!stmt.columns) return stmt;

      // Find index of column to remove
      const columnIndex = stmt.columns.findIndex(
        (col) => col.name === columnName
      );
      if (columnIndex === -1) return stmt;

      // Remove column from columns array
      const newColumns = [...stmt.columns];
      newColumns.splice(columnIndex, 1);

      // Remove corresponding values from each row
      const newValues =
        stmt.insert.type === "values"
          ? stmt.insert.values.map((row) => {
              const newRow = [...row];
              newRow.splice(columnIndex, 1);
              return newRow;
            })
          : null;

      // TODO: use assignChanged
      const insert = newValues
        ? { ...stmt.insert, values: newValues }
        : stmt.insert;

      return { ...stmt, columns: newColumns, insert };
    },
  }));

  const statements = parse(sql);
  return statements
    .map((stmt) => {
      const mapped = mapper.statement(stmt);
      if (!mapped) throw new Error("Failed to modify AST");
      return toSql.statement(mapped);
    })
    .join("\n");
}
