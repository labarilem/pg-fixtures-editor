import {
  astMapper,
  IAstToSql,
  InsertStatement,
  parse,
  toSql,
} from "pgsql-ast-parser";

const getEndingCharsToPreserve = (sql: string) => {
  const toPreserve = ["\n", " ", "\t", ";"];
  let i = sql.length - 1;
  let endingChars = "";
  while (toPreserve.includes(sql[i])) {
    endingChars = sql[i] + endingChars;
    i--;
  }
  return endingChars;
};

const humanReadableFormatter: IAstToSql = {
  ...toSql,
  statement: (stmt) => {
    // Delegate to our custom insert handler for insert statements
    if (stmt.type === "insert") {
      return humanReadableFormatter.insert(stmt);
    }
    // For other statement types, use the default handler
    return toSql.statement(stmt);
  },
  insert: (stmt) => {
    const columns = stmt.columns
      ? `(${stmt.columns.map((c) => c.name).join(", ")})`
      : "";

    if (stmt.insert.type === "values") {
      const values = stmt.insert.values
        .map((row) => `  (${row.map((v) => toSql.expr(v)).join(", ")})`)
        .join(",\n");

      const table = toSql.tableRef(stmt.into);
      return `INSERT INTO ${table} ${columns} VALUES\n${values}`;
    }

    // Handle other insert types (like INSERT ... SELECT)
    return toSql.insert(stmt);
  },
};

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
  const endingChars = getEndingCharsToPreserve(sql);
  return (
    statements
      .map((stmt) => {
        const mapped = mapper.statement(stmt);
        if (!mapped) throw new Error("Failed to modify AST");
        return humanReadableFormatter.statement(mapped);
      })
      .join("\n") + endingChars
  );
}
