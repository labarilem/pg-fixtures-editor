import assert from "node:assert/strict";
import { removeColumn } from "../src/removeColumn";
import { addColumn } from "../src/addColumn";

export const assertRemoveColumn = (
  input: string,
  columnName: string,
  output: string
) => {
  const result = removeColumn(columnName, input);
  assert.equal(result, output);
};

export const assertAddColumn = (
  input: string,
  columnName: string,
  columnValue: string,
  output: string
) => {
  const result = addColumn(columnName, columnValue, input);
  assert.equal(result, output);
};
