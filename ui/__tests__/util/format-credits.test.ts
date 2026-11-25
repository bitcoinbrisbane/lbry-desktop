import { creditsToString, formatCredits, formatFullPrice } from "../../util/format-credits";

describe("formatCredits", () => {
  it("shows zero and non-numbers as 0", () => {
    expect(formatCredits(0, 2)).toBe("0");
    expect(formatCredits("abc", 2)).toBe("0");
    expect(formatCredits(NaN, 2)).toBe("0");
  });

  it("uses the precision for the fraction digits", () => {
    expect(formatCredits(1.5, 2)).toBe("1.50");
    expect(formatCredits("1234.5", 1)).toBe("1,234.5");
  });

  it("keeps the precision between 1 and 20", () => {
    expect(formatCredits(1, 0)).toBe("1.0");
    expect(formatCredits(1, 99).split(".")[1]).toHaveLength(20);
  });

  it("can use the short form with a suffix", () => {
    expect(formatCredits(1500, 1, true)).toBe("1.5K");
  });
});

describe("formatFullPrice", () => {
  it("keeps whole numbers", () => {
    expect(formatFullPrice(5)).toBe(5);
    expect(formatFullPrice("12")).toBe(12);
  });

  it("keeps the first non-zero decimal plus the precision after it", () => {
    expect(formatFullPrice(0.0012345)).toBe(0.001);
    expect(formatFullPrice(0.0012345, 2)).toBe(0.0012);
    expect(formatFullPrice(1.5)).toBe(1.5);
  });
});

describe("creditsToString", () => {
  it("always has eight decimals", () => {
    expect(creditsToString(1)).toBe("1.00000000");
    expect(creditsToString("0.5")).toBe("0.50000000");
    expect(creditsToString(0.123456789)).toBe("0.12345679");
  });
});
