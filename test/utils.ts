import assert from "node:assert/strict";
import { removeColumn } from "../src/removeColumn";

export const assertInputToOutput = (
  input: string,
  columnName: string,
  output: string
) => {
  const result = removeColumn(columnName, input);
  assert.equal(result, output);
};
