/* global test expect */
import { Info } from "../../src/luxon";

import * as Helpers from "../helpers";

test("Info.features shows this environment supports all the features", () => {
  expect(Info.features().relative).toBe(true);
});

Helpers.withoutRTF("Info.features shows no support", () => {
  expect(Info.features().relative).toBe(false);
});
