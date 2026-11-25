import { hmsToSeconds, secondsToHms } from "../../util/time";

describe("secondsToHms", () => {
  it("leaves the hours off under an hour, and keeps two digits", () => {
    expect(secondsToHms(5)).toBe("00:05");
    expect(secondsToHms(65)).toBe("01:05");
    expect(secondsToHms(3599)).toBe("59:59");
  });

  it("adds the hours from an hour on", () => {
    expect(secondsToHms(3600)).toBe("01:00:00");
    expect(secondsToHms(3661)).toBe("01:01:01");
    expect(secondsToHms(36000)).toBe("10:00:00");
    expect(secondsToHms(100 * 3600)).toBe("100:00:00");
  });

  it("drops the fraction and shows zero as 00:00", () => {
    expect(secondsToHms(59.9)).toBe("00:59");
    expect(secondsToHms(0)).toBe("00:00");
  });
});

describe("hmsToSeconds", () => {
  it("reads seconds, minutes and hours", () => {
    expect(hmsToSeconds("45")).toBe(45);
    expect(hmsToSeconds("1:05")).toBe(65);
    expect(hmsToSeconds("01:01:01")).toBe(3661);
  });

  it("treats a part that is not a number as zero", () => {
    expect(hmsToSeconds("")).toBe(0);
    expect(hmsToSeconds("a:30")).toBe(30);
  });

  it("round-trips with secondsToHms", () => {
    for (const seconds of [0, 1, 59, 60, 3599, 3600, 86399]) {
      expect(hmsToSeconds(secondsToHms(seconds))).toBe(seconds);
    }
  });
});
