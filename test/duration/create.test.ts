/* global test expect */

import { Duration } from "../../src/luxon";

//------
// .fromObject()
//-------
test("Duration.fromObject sets all the values", () => {
  const dur = Duration.fromObject({
    years: 1,
    months: 2,
    days: 3,
    hours: 4,
    minutes: 5,
    seconds: 6,
    milliseconds: 7,
  });
  expect(dur.years).toBe(1);
  expect(dur.months).toBe(2);
  expect(dur.days).toBe(3);
  expect(dur.hours).toBe(4);
  expect(dur.minutes).toBe(5);
  expect(dur.seconds).toBe(6);
  expect(dur.milliseconds).toBe(7);
});

test("Duration.fromObject sets all the values from the object having string type values", () => {
  const dur = Duration.fromObject({
    // @ts-expect-error test
    years: "1",
    // @ts-expect-error test
    months: "2",
    // @ts-expect-error test
    days: "3",
    // @ts-expect-error test
    hours: "4",
    // @ts-expect-error test
    minutes: "5",
    // @ts-expect-error test
    seconds: "6",
    // @ts-expect-error test
    milliseconds: "7",
  });
  expect(dur.years).toBe(1);
  expect(dur.months).toBe(2);
  expect(dur.days).toBe(3);
  expect(dur.hours).toBe(4);
  expect(dur.minutes).toBe(5);
  expect(dur.seconds).toBe(6);
  expect(dur.milliseconds).toBe(7);
});

test("Duration.fromObject accepts a conversionAccuracy", () => {
  const dur = Duration.fromObject({ days: 1 }, { conversionAccuracy: "longterm" });
  expect(dur.conversionAccuracy).toBe("longterm");
});

test("Duration.fromObject throws if the argument is not an object", () => {
  // @ts-expect-error test
  expect(() => Duration.fromObject()).toThrow();
  // @ts-expect-error test
  expect(() => Duration.fromObject(null)).toThrow();
  // @ts-expect-error test
  expect(() => Duration.fromObject("foo")).toThrow();
});

test("Duration.fromObject({}) constructs zero duration", () => {
  const dur = Duration.fromObject({});
  expect(dur.years).toBe(0);
  expect(dur.months).toBe(0);
  expect(dur.days).toBe(0);
  expect(dur.hours).toBe(0);
  expect(dur.minutes).toBe(0);
  expect(dur.seconds).toBe(0);
  expect(dur.milliseconds).toBe(0);
});

test("Duration.fromObject throws if the initial object has invalid keys", () => {
  // @ts-expect-error test
  expect(() => Duration.fromObject({ foo: 0 })).toThrow();
  // @ts-expect-error test
  expect(() => Duration.fromObject({ years: 1, foo: 0 })).toThrow();
});

test("Duration.fromObject throws if the initial object has invalid values", () => {
  // @ts-expect-error test
  expect(() => Duration.fromObject({ years: {} })).toThrow();
  // @ts-expect-error test
  expect(() => Duration.fromObject({ months: "some" })).toThrow();
  expect(() => Duration.fromObject({ days: NaN })).toThrow();
  // @ts-expect-error test
  expect(() => Duration.fromObject({ hours: true })).toThrow();
  // @ts-expect-error test
  expect(() => Duration.fromObject({ minutes: false })).toThrow();
  // @ts-expect-error test
  expect(() => Duration.fromObject({ seconds: "" })).toThrow();
});

test("Duration.fromObject is valid if providing options only", () => {
  const dur = Duration.fromObject({}, { conversionAccuracy: "longterm" });
  expect(dur.years).toBe(0);
  expect(dur.months).toBe(0);
  expect(dur.days).toBe(0);
  expect(dur.hours).toBe(0);
  expect(dur.minutes).toBe(0);
  expect(dur.seconds).toBe(0);
  expect(dur.milliseconds).toBe(0);
  expect(dur.isValid).toBe(true);
});
