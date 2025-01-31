import DateTime, { friendlyDateTime } from "./datetime";
import Duration, { friendlyDuration } from "./duration";
import Settings from "./settings";
import { InvalidArgumentError, InvalidIntervalError } from "./errors";
import Invalid from "./impl/invalid";
import { Config } from "./types/interval";
import { DateTimeLike, DateTimeWithZoneOptions } from "./types/datetime";
import { DurationLike, DurationOptions, DurationUnit } from "./types/duration";
import { ToTechTimeOptions } from "./types/common";

const INVALID = "Invalid Interval";

// checks if the start is equal to or before the end
function validateStartEnd(start: DateTime | null, end: DateTime | null) {
  if (!start || !start.isValid) {
    return Interval.invalid("missing or invalid start");
  } else if (!end || !end.isValid) {
    return Interval.invalid("missing or invalid end");
  } else if (end < start) {
    return Interval.invalid(
      "end before start",
      `The end of an interval must be after its start, but you had start=${start.toISO()} and end=${end.toISO()}`
    );
  } else {
    return null;
  }
}

/**
 * An Interval object represents a half-open interval of time, where each endpoint is a {@link DateTime}. Conceptually, it's a container for those two endpoints, accompanied by methods for creating, parsing, interrogating, comparing, transforming, and formatting them.
 *
 * Here is a brief overview of the most commonly used methods and getters in Interval:
 *
 * * **Creation** To create an Interval, use {@link Interval.fromDateTimes}, {@link Interval.after}, {@link Interval.before}, or {@link Interval.fromISO}.
 * * **Accessors** Use {@link Interval#start} and {@link Interval#end} to get the start and end.
 * * **Interrogation** To analyze the Interval, use {@link Interval#count}, {@link Interval#length}, {@link Interval#hasSame}, {@link Interval#contains}, {@link Interval#isAfter}, or {@link Interval#isBefore}.
 * * **Transformation** To create other Intervals out of this one, use {@link Interval#set}, {@link Interval#splitAt}, {@link Interval#splitBy}, {@link Interval#divideEqually}, {@link Interval#merge}, {@link Interval#xor}, {@link Interval#union}, {@link Interval#intersection}, or {@link Interval#difference}.
 * * **Comparison** To compare this Interval to another one, use {@link Interval#equals}, {@link Interval#overlaps}, {@link Interval#abutsStart}, {@link Interval#abutsEnd}, {@link Interval#engulfs}
 * * **Output** To convert the Interval into other representations, see {@link Interval#toString}, {@link Interval#toISO}, {@link Interval#toISODate}, {@link Interval#toISOTime}, {@link Interval#toFormat}, and {@link Interval#toDuration}.
 */
export default class Interval {
  private readonly s: DateTime | null;
  private readonly e: DateTime | null;
  private readonly invalid: Invalid | null;
  private readonly isLuxonInterval: true;
  /**
   * @private
   */
  constructor(config: Config) {
    /**
     * @access private
     */
    this.s = config.start || null;
    /**
     * @access private
     */
    this.e = config.end || null;
    /**
     * @access private
     */
    this.invalid = config.invalid || null;
    /**
     * @access private
     */
    this.isLuxonInterval = true;
  }

  /**
   * Create an invalid Interval.
   * @param {string} reason - simple string of why this Interval is invalid. Should not contain parameters or anything else data-dependent
   * @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
   * @return {Interval}
   */
  static invalid(reason: Invalid | string, explanation: string | null = null): Interval {
    if (!reason) {
      throw new InvalidArgumentError("need to specify a reason the Interval is invalid");
    }

    const invalid = reason instanceof Invalid ? reason : new Invalid(reason, explanation);

    if (Settings.throwOnInvalid) {
      throw new InvalidIntervalError(invalid);
    } else {
      return new Interval({ invalid });
    }
  }

  /**
   * Create an Interval from a start DateTime and an end DateTime. Inclusive of the start but not the end.
   * @param {DateTime|Date|Object} start
   * @param {DateTime|Date|Object} end
   * @return {Interval}
   */
  static fromDateTimes(start: DateTimeLike, end: DateTimeLike): Interval {
    const builtStart = friendlyDateTime(start),
      builtEnd = friendlyDateTime(end);

    const validateError = validateStartEnd(builtStart, builtEnd);

    if (validateError == null) {
      return new Interval({
        start: builtStart,
        end: builtEnd,
      });
    } else {
      return validateError;
    }
  }

  /**
   * Create an Interval from a start DateTime and a Duration to extend to.
   * @param {DateTime|Date|Object} start
   * @param {Duration|Object|number} duration - the length of the Interval.
   * @return {Interval}
   */
  static after(start: DateTimeLike, duration: DurationLike): Interval {
    const dur = friendlyDuration(duration),
      dt = friendlyDateTime(start);
    return Interval.fromDateTimes(dt, dt.plus(dur));
  }

  /**
   * Create an Interval from an end DateTime and a Duration to extend backwards to.
   * @param {DateTime|Date|Object} end
   * @param {Duration|Object|number} duration - the length of the Interval.
   * @return {Interval}
   */
  static before(end: DateTimeLike, duration: DurationLike): Interval {
    const dur = friendlyDuration(duration),
      dt = friendlyDateTime(end);
    return Interval.fromDateTimes(dt.minus(dur), dt);
  }

  /**
   * Create an Interval from an ISO 8601 string.
   * Accepts `<start>/<end>`, `<start>/<duration>`, and `<duration>/<end>` formats.
   * @param {string} text - the ISO string to parse
   * @param {Object} [opts] - options to pass {@link DateTime.fromISO} and optionally {@link Duration.fromISO}
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @return {Interval}
   */
  static fromISO(text: string, opts?: DateTimeWithZoneOptions): Interval {
    const [s, e] = (text || "").split("/", 2);
    if (s && e) {
      let start, startIsValid;
      try {
        start = DateTime.fromISO(s, opts);
        startIsValid = start.isValid;
      } catch (e) {
        startIsValid = false;
      }

      let end, endIsValid;
      try {
        end = DateTime.fromISO(e, opts);
        endIsValid = end.isValid;
      } catch (e) {
        endIsValid = false;
      }

      if (start && startIsValid && end && endIsValid) {
        return Interval.fromDateTimes(start, end);
      }

      if (start && startIsValid) {
        const dur = Duration.fromISO(e, opts);
        if (dur.isValid) {
          return Interval.after(start, dur);
        }
      } else if (end && endIsValid) {
        const dur = Duration.fromISO(s, opts);
        if (dur.isValid) {
          return Interval.before(end, dur);
        }
      }
    }
    return Interval.invalid("unparsable", `the input "${text}" can't be parsed as ISO 8601`);
  }

  /**
   * Check if an object is an Interval. Works across context boundaries
   * @param {object} o
   * @return {boolean}
   */
  // eslint-disable-next-line @typescript-eslint/ban-types
  static isInterval(o: object): o is Interval {
    return (o && (o as Interval).isLuxonInterval) || false;
  }

  /**
   * Returns the start of the Interval
   * @type {DateTime}
   */
  get start(): DateTime | null {
    return this.isValid ? this.s : null;
  }

  /**
   * Returns the end of the Interval
   * @type {DateTime}
   */
  get end(): DateTime | null {
    return this.isValid ? this.e : null;
  }

  /**
   * Returns whether this Interval's end is at least its start, meaning that the Interval isn't 'backwards'.
   * @type {boolean}
   */
  get isValid(): boolean {
    return this.invalidReason === null;
  }

  /**
   * Returns an error code if this Interval is invalid, or null if the Interval is valid
   * @type {string}
   */
  get invalidReason(): string | null {
    return this.invalid ? this.invalid.reason : null;
  }

  /**
   * Returns an explanation of why this Interval became invalid, or null if the Interval is valid
   * @type {string}
   */
  get invalidExplanation(): string | null {
    return this.invalid ? this.invalid.explanation : null;
  }

  /**
   * Returns the length of the Interval in the specified unit.
   * @param {string} unit - the unit (such as 'hours' or 'days') to return the length in.
   * @return {number}
   */
  length(unit: DurationUnit = "milliseconds"): number {
    const duration = this.toDuration(unit);
    return this.isValid && duration ? duration.get(unit) : NaN;
  }

  /**
   * Returns the count of minutes, hours, days, months, or years included in the Interval, even in part.
   * Unlike {@link Interval#length} this counts sections of the calendar, not periods of time, e.g. specifying 'day'
   * asks 'what dates are included in this interval?', not 'how many days long is this interval?'
   * @param {string} [unit='milliseconds'] - the unit of time to count.
   * @return {number}
   */
  count(unit: DurationUnit = "milliseconds"): number {
    if (!this.isValid) return NaN;
    const start = (this.start as DateTime).startOf(unit),
      end = (this.end as DateTime).startOf(unit);
    return Math.floor(end.diff(start, unit).get(unit)) + 1;
  }

  /**
   * Returns whether this Interval's start and end are both in the same unit of time
   * @param {string} unit - the unit of time to check sameness on
   * @return {boolean}
   */
  hasSame(unit: DurationUnit): boolean {
    return this.isValid
      ? this.isEmpty() || (this.e as DateTime).minus(1).hasSame(this.s as DateTime, unit)
      : false;
  }

  /**
   * Return whether this Interval has the same start and end DateTimes.
   * @return {boolean}
   */
  isEmpty(): boolean {
    return this.isValid ? (this.s as DateTime).valueOf() === (this.e as DateTime).valueOf() : false;
  }

  /**
   * Return whether this Interval's start is after the specified DateTime.
   * @param {DateTime} dateTime
   * @return {boolean}
   */
  isAfter(dateTime: DateTime): boolean {
    if (!this.isValid) return false;
    return (this.s as DateTime) > dateTime;
  }

  /**
   * Return whether this Interval's end is before the specified DateTime.
   * @param {DateTime} dateTime
   * @return {boolean}
   */
  isBefore(dateTime: DateTime): boolean {
    if (!this.isValid) return false;
    return (this.e as DateTime) <= dateTime;
  }

  /**
   * Return whether this Interval contains the specified DateTime.
   * @param {DateTime} dateTime
   * @return {boolean}
   */
  contains(dateTime: DateTime): boolean {
    if (!this.isValid) return false;
    return (this.s as DateTime) <= dateTime && (this.e as DateTime) > dateTime;
  }

  /**
   * "Sets" the start and/or end dates. Returns a newly-constructed Interval.
   * @param {Object} values - the values to set
   * @param {DateTime} values.start - the starting DateTime
   * @param {DateTime} values.end - the ending DateTime
   * @return {Interval}
   */
  set({ start, end }: { start?: DateTime; end?: DateTime } = {}): Interval {
    if (!this.isValid) return this;
    return Interval.fromDateTimes(start || (this.s as DateTime), end || (this.e as DateTime));
  }

  /**
   * Split this Interval at each of the specified DateTimes
   * @param {...DateTime} dateTimes - the unit of time to count.
   * @return {Array}
   */
  splitAt(...dateTimes: DateTime[]): Interval[] {
    if (!this.isValid) return [];
    const sorted = dateTimes
        .map(friendlyDateTime)
        .filter((d) => this.contains(d))
        .sort(),
      results = [];
    let s = this.s as DateTime,
      i = 0;

    while (s < (this.e as DateTime)) {
      const added = sorted[i] || this.e,
        next = +added > +(this.e as DateTime) ? (this.e as DateTime) : added;
      results.push(Interval.fromDateTimes(s, next));
      s = next;
      i += 1;
    }

    return results;
  }

  /**
   * Split this Interval into smaller Intervals, each of the specified length.
   * Left over time is grouped into a smaller interval
   * @param {Duration|Object|number} duration - The length of each resulting interval.
   * @return {Array}
   */
  splitBy(duration: DurationLike): Interval[] {
    const dur = friendlyDuration(duration);

    if (!this.isValid || !dur.isValid || dur.as("milliseconds") === 0) {
      return [];
    }

    let s = this.s as DateTime,
      idx = 1,
      next;

    const results = [];
    while (s < (this.e as DateTime)) {
      const added = (this.s as DateTime).plus(dur.mapUnits((x) => x * idx));
      next = +added > +(this.e as DateTime) ? (this.e as DateTime) : added;
      results.push(Interval.fromDateTimes(s, next));
      s = next;
      idx += 1;
    }

    return results;
  }

  /**
   * Split this Interval into the specified number of smaller intervals.
   * @param {number} numberOfParts - The number of Intervals to divide the Interval into.
   * @return {Array}
   */
  divideEqually(numberOfParts: number): Interval[] {
    if (!this.isValid) return [];
    return this.splitBy(this.length() / numberOfParts).slice(0, numberOfParts);
  }

  /**
   * Return whether this Interval overlaps with the specified Interval
   * @param {Interval} other
   * @return {boolean}
   */
  overlaps(other: Interval): boolean {
    if (!this.isValid || !other.isValid) return false;
    return (
      (this.e as DateTime) > (other.s as DateTime) && (this.s as DateTime) < (other.e as DateTime)
    );
  }

  /**
   * Return whether this Interval's end is adjacent to the specified Interval's start.
   * @param {Interval} other
   * @return {boolean}
   */
  abutsStart(other: Interval): boolean {
    if (!this.isValid || !other.isValid) return false;
    return +(this.e as DateTime) === +(other.s as DateTime);
  }

  /**
   * Return whether this Interval's start is adjacent to the specified Interval's end.
   * @param {Interval} other
   * @return {boolean}
   */
  abutsEnd(other: Interval): boolean {
    if (!this.isValid || !other.isValid) return false;
    return +(other.e as DateTime) === +(this.s as DateTime);
  }

  /**
   * Return whether this Interval engulfs the start and end of the specified Interval.
   * @param {Interval} other
   * @return {boolean}
   */
  engulfs(other: Interval): boolean {
    if (!this.isValid || !other.isValid) return false;
    return (
      (this.s as DateTime) <= (other.s as DateTime) && (this.e as DateTime) >= (other.e as DateTime)
    );
  }

  /**
   * Return whether this Interval has the same start and end as the specified Interval.
   * @param {Interval} other
   * @return {boolean}
   */
  equals(other: Interval): boolean {
    if (!this.isValid || !other.isValid) {
      return false;
    }

    return (
      (this.s as DateTime).equals(other.s as DateTime) &&
      (this.e as DateTime).equals(other.e as DateTime)
    );
  }

  /**
   * Return an Interval representing the intersection of this Interval and the specified Interval.
   * Specifically, the resulting Interval has the maximum start time and the minimum end time of the two Intervals.
   * Returns null if the intersection is empty, meaning, the intervals don't intersect.
   * @param {Interval} other
   * @return {Interval}
   */
  intersection(other: Interval): Interval | null {
    if (!this.isValid || !other.isValid) return this;
    const s = ((this.s as DateTime) > (other.s as DateTime) ? this.s : other.s) as DateTime,
      e = ((this.e as DateTime) < (other.e as DateTime) ? this.e : other.e) as DateTime;

    if (s >= e) {
      return null;
    } else {
      return Interval.fromDateTimes(s, e);
    }
  }

  /**
   * Return an Interval representing the union of this Interval and the specified Interval.
   * Specifically, the resulting Interval has the minimum start time and the maximum end time of the two Intervals.
   * @param {Interval} other
   * @return {Interval}
   */
  union(other: Interval): Interval {
    if (!this.isValid || !other.isValid) return this;
    const s = ((this.s as DateTime) < (other.s as DateTime) ? this.s : other.s) as DateTime,
      e = ((this.e as DateTime) > (other.e as DateTime) ? this.e : other.e) as DateTime;
    return Interval.fromDateTimes(s, e);
  }

  /**
   * Merge an array of Intervals into a equivalent minimal set of Intervals.
   * Combines overlapping and adjacent Intervals.
   * @param {Array} intervals
   * @return {Array}
   */
  static merge(intervals: Interval[]): Interval[] {
    const [found, final] = intervals
      .sort((a, b) => {
        if (!a.isValid || !b.isValid) return 0;
        return (a.s as DateTime).valueOf() - (b.s as DateTime).valueOf();
      })
      .reduce<[Interval[], Interval | null]>(
        ([sofar, current], item) => {
          if (!current) {
            return [sofar, item];
          } else if (current.overlaps(item) || current.abutsStart(item)) {
            return [sofar, current.union(item)];
          } else {
            return [sofar.concat([current]), item];
          }
        },
        [[], null]
      );
    if (final) {
      found.push(final);
    }
    return found;
  }

  /**
   * Return an array of Intervals representing the spans of time that only appear in one of the specified Intervals.
   * @param {Array} intervals
   * @return {Array}
   */
  static xor(intervals: Interval[]): Interval[] {
    let start = null,
      currentCount = 0;
    const results = [],
      ends = intervals.map((i) => [
        { time: i.s, type: "s" },
        { time: i.e, type: "e" },
      ]),
      flattened = Array.prototype.concat(...ends),
      arr = flattened.sort((a, b) => a.time - b.time);

    for (const i of arr) {
      currentCount += i.type === "s" ? 1 : -1;

      if (currentCount === 1) {
        start = i.time;
      } else {
        if (start && +start !== +i.time) {
          results.push(Interval.fromDateTimes(start, i.time));
        }

        start = null;
      }
    }

    return Interval.merge(results);
  }

  /**
   * Return an Interval representing the span of time in this Interval that doesn't overlap with any of the specified Intervals.
   * @param {...Interval} intervals
   * @return {Array}
   */
  difference(...intervals: Interval[]): Interval[] {
    return Interval.xor([this as Interval].concat(intervals))
      .map((i) => this.intersection(i))
      .filter((i) => i && !i.isEmpty()) as Interval[];
  }

  /**
   * Returns a string representation of this Interval appropriate for debugging.
   * @return {string}
   */
  toString(): string {
    if (!this.isValid) return INVALID;
    return `[${(this.s as DateTime).toISO()} – ${(this.e as DateTime).toISO()})`;
  }

  /**
   * Returns an ISO 8601-compliant string representation of this Interval.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @param {Object} opts - The same options as {@link DateTime#toISO}
   * @return {string}
   */
  toISO(opts: ToTechTimeOptions = {}): string {
    if (!this.isValid) return INVALID;
    return `${(this.s as DateTime).toISO(opts)}/${(this.e as DateTime).toISO(opts)}`;
  }

  /**
   * Returns an ISO 8601-compliant string representation of date of this Interval.
   * The time components are ignored.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @return {string}
   */
  toISODate(): string {
    if (!this.isValid) return INVALID;
    return `${(this.s as DateTime).toISODate()}/${(this.e as DateTime).toISODate()}`;
  }

  /**
   * Returns an ISO 8601-compliant string representation of time of this Interval.
   * The date components are ignored.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @param {Object} opts - The same options as {@link DateTime.toISO}
   * @return {string}
   */
  toISOTime(opts: ToTechTimeOptions = {}): string {
    if (!this.isValid) return INVALID;
    return `${(this.s as DateTime).toISOTime(opts)}/${(this.e as DateTime).toISOTime(opts)}`;
  }

  /**
   * Returns a string representation of this Interval formatted according to the specified format string.
   * @param {string} dateFormat - the format string. This string formats the start and end time. See {@link DateTime.toFormat} for details.
   * @param {Object} opts - options
   * @param {string} [opts.separator =  ' – '] - a separator to place between the start and end representations
   * @return {string}
   */
  toFormat(dateFormat: string, { separator = " – " }: { separator?: string } = {}): string {
    if (!this.isValid) return INVALID;
    return `${(this.s as DateTime).toFormat(dateFormat)}${separator}${(this.e as DateTime).toFormat(
      dateFormat
    )}`;
  }

  /**
   * Return a Duration representing the time spanned by this interval.
   * @param {string|string[]} [unit=['milliseconds']] - the unit or units (such as 'hours' or 'days') to include in the duration.
   * @param {Object} opts - options that affect the creation of the Duration
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @example Interval.fromDateTimes(dt1, dt2).toDuration().toObject() //=> { milliseconds: 88489257 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration('days').toObject() //=> { days: 1.0241812152777778 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration(['hours', 'minutes']).toObject() //=> { hours: 24, minutes: 34.82095 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration(['hours', 'minutes', 'seconds']).toObject() //=> { hours: 24, minutes: 34, seconds: 49.257 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration('seconds').toObject() //=> { seconds: 88489.257 }
   * @return {Duration}
   */
  toDuration(unit: DurationUnit | DurationUnit[], opts?: DurationOptions): Duration | null {
    if (!this.isValid) {
      return Duration.invalid(this.invalidReason as string);
    }
    return (this.e as DateTime).diff(this.s as DateTime, unit, opts);
  }

  /**
   * Run mapFn on the interval start and end, returning a new Interval from the resulting DateTimes
   * @param {function} mapFn
   * @return {Interval}
   * @example Interval.fromDateTimes(dt1, dt2).mapEndpoints(endpoint => endpoint.toUTC())
   * @example Interval.fromDateTimes(dt1, dt2).mapEndpoints(endpoint => endpoint.plus({ hours: 2 }))
   */
  mapEndpoints(mapFn: (dt: DateTime) => DateTime): Interval {
    if (!this.isValid) return this;
    return Interval.fromDateTimes(mapFn(this.s as DateTime), mapFn(this.e as DateTime));
  }
}
