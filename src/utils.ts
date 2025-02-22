import { IAstMapper, IAstToSql, parse, toSql } from "pgsql-ast-parser";

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

const formatIdent = (name: string) => {
  if (/^[a-z][a-z0-9_]*$/.test(name)) return name;
  // only add quotes if name has some upper case chars
  return `"${name}"`;
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
    if (stmt.insert.type === "values") {
      const columns = stmt.columns
        ? ` (${stmt.columns.map((c) => formatIdent(c.name)).join(", ")})`
        : "";
      const values = stmt.insert.values
        .map((row) => `  (${row.map((v) => toSql.expr(v)).join(", ")})`)
        .join(",\n");
      const table = toSql.tableRef(stmt.into);
      return `INSERT INTO ${table}${columns} VALUES\n${values}`;
    }

    // Handle other insert types (like INSERT ... SELECT)
    return toSql.insert(stmt);
  },
};

export function transformSql(mapper: IAstMapper, sql: string): string {
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
