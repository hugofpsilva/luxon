/* global test expect */
import { Interval } from "../../src/luxon";
import { atHour } from "../helpers";

const todayFrom = (h1: number, h2: number) => Interval.fromDateTimes(atHour(h1), atHour(h2)),
  invalid = Interval.invalid("because");

test("Interval.start gets the start", () => {
  expect(todayFrom(3, 5).start?.hour).toBe(3);
});

test("Interval.start returns null for invalid intervals", () => {
  expect(invalid.start).toBe(null);
});

test("Interval.end gets the end", () => {
  expect(todayFrom(3, 5).end?.hour).toBe(5);
});

test("Interval.end returns null for invalid intervals", () => {
  expect(invalid.end).toBe(null);
});
