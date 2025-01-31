/* global test expect */

import { DateTime } from "../../src/luxon";

//------
// min
//-------
test("DateTime.min returns the only dateTime if solo", () => {
  const m = DateTime.min(DateTime.fromJSDate(new Date(1982, 5, 25)));
  if (!m) fail("DateTime.min returned undefined");
  expect(m).toBeTruthy();
  expect(m.valueOf()).toBe(DateTime.fromJSDate(new Date(1982, 5, 25)).valueOf());
});

test("DateTime.min returns the min dateTime", () => {
  const m = DateTime.min(
    DateTime.fromJSDate(new Date(1982, 4, 25)),
    DateTime.fromJSDate(new Date(1982, 3, 25)),
    DateTime.fromJSDate(new Date(1982, 3, 26))
  );
  if (!m) fail("DateTime.min returned undefined");
  expect(m.valueOf()).toBe(DateTime.fromJSDate(new Date(1982, 3, 25)).valueOf());
});

test("DateTime.min returns undefined if no argument", () => {
  const m = DateTime.min();
  expect(m).toBeUndefined();
});

test("DateTime.min is stable", () => {
  const m = DateTime.min(
    DateTime.fromJSDate(new Date(1982, 4, 25)),
    DateTime.fromJSDate(new Date(1982, 3, 25)).reconfigure({ locale: "en-GB" }),
    DateTime.fromJSDate(new Date(1982, 3, 25)).reconfigure({ locale: "en-US" })
  );
  if (!m) fail("DateTime.min returned undefined");
  expect(m.locale).toBe("en-GB");
});

test("DateTime.min throws if you don't pass it DateTimes", () => {
  const dt = DateTime.fromJSDate(new Date(1982, 2, 25));
  const notADt = "flob";

  // @ts-expect-error test
  expect(() => DateTime.min(dt, notADt)).toThrow();
  // @ts-expect-error test
  expect(() => DateTime.min(notADt)).toThrow();
  // @ts-expect-error test
  expect(() => DateTime.min(notADt, notADt)).toThrow();
});

//------
// max
//-------
test("DateTime.max returns the only dateTime if solo", () => {
  const m = DateTime.max(DateTime.fromJSDate(new Date(1982, 5, 25)));
  if (!m) fail("DateTime.max returned undefined");
  expect(m).toBeTruthy();
  expect(m.valueOf()).toBe(DateTime.fromJSDate(new Date(1982, 5, 25)).valueOf());
});

test("DateTime.max returns the max dateTime", () => {
  const m = DateTime.max(
    DateTime.fromJSDate(new Date(1982, 5, 25)),
    DateTime.fromJSDate(new Date(1982, 3, 25)),
    DateTime.fromJSDate(new Date(1982, 3, 26))
  );
  if (!m) fail("DateTime.max returned undefined");
  expect(m.valueOf()).toBe(DateTime.fromJSDate(new Date(1982, 5, 25)).valueOf());
});

test("DateTime.max returns undefined if no argument", () => {
  const m = DateTime.max();
  expect(m).toBeUndefined();
});

test("DateTime.max is stable", () => {
  const m = DateTime.max(
    DateTime.fromJSDate(new Date(1982, 2, 25)),
    DateTime.fromJSDate(new Date(1982, 3, 25)).reconfigure({ locale: "en-GB" }),
    DateTime.fromJSDate(new Date(1982, 3, 25)).reconfigure({ locale: "en-US" })
  );
  if (!m) fail("DateTime.max returned undefined");
  expect(m.locale).toBe("en-GB");
});

test("DateTime.max throws if you don't pass it DateTimes", () => {
  const dt = DateTime.fromJSDate(new Date(1982, 2, 25));
  const notADt = "flob";

  // @ts-expect-error test
  expect(() => DateTime.max(dt, notADt)).toThrow();
  // @ts-expect-error test
  expect(() => DateTime.max(notADt)).toThrow();
  // @ts-expect-error test
  expect(() => DateTime.max(notADt, notADt)).toThrow();
});
