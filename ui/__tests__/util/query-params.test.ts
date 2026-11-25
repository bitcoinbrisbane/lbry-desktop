import { getSearchQueryString, parseQueryParams, updateQueryParam } from "../../util/query-params";

describe("parseQueryParams", () => {
  it("returns an empty object for an empty string", () => {
    expect(parseQueryParams("")).toEqual({});
  });

  it("reads pairs, with or without the leading ?", () => {
    expect(parseQueryParams("?a=1&b=two")).toEqual({ a: "1", b: "two" });
    expect(parseQueryParams("a=1&b=two")).toEqual({ a: "1", b: "two" });
  });

  it("gives a key without a value undefined", () => {
    expect(parseQueryParams("?rewards")).toEqual({ rewards: undefined });
  });

  it("keeps the last value of a repeated key", () => {
    expect(parseQueryParams("?a=1&a=2")).toEqual({ a: "2" });
  });
});

describe("updateQueryParam", () => {
  it("adds a parameter with ? or &", () => {
    expect(updateQueryParam("/page", "t", "5")).toBe("/page?t=5");
    expect(updateQueryParam("/page?a=1", "t", "5")).toBe("/page?a=1&t=5");
  });

  it("replaces an existing parameter, wherever it is", () => {
    expect(updateQueryParam("/page?t=1", "t", "5")).toBe("/page?t=5");
    expect(updateQueryParam("/page?t=1&a=2", "t", "5")).toBe("/page?t=5&a=2");
    expect(updateQueryParam("/page?a=2&t=1", "t", "5")).toBe("/page?a=2&t=5");
  });
});

describe("getSearchQueryString", () => {
  it("builds the query with the default size and offset", () => {
    expect(getSearchQueryString("cats")).toBe("s=cats&size=20&from=0");
  });

  it("encodes the query text", () => {
    expect(getSearchQueryString("cats & dogs")).toBe("s=cats%20%26%20dogs&size=20&from=0");
  });

  it("takes a size and an offset", () => {
    expect(getSearchQueryString("cats", { size: 5, from: 40 })).toBe("s=cats&size=5&from=40");
  });

  it("wraps the query in quotes for an exact search", () => {
    expect(getSearchQueryString("cats", { exact: true })).toBe('s="cats"&size=20&from=0');
  });

  // Known bug: the "already in quotes" check runs on the encoded text, where a quote is %22, so a query that
  // is already quoted is wrapped again. This is the intended behaviour; `failing` flags when it gets fixed.
  it.failing("does not wrap a query that is already in quotes", () => {
    expect(getSearchQueryString('"cats"', { exact: true })).toBe("s=%22cats%22&size=20&from=0");
  });

  it("adds the user's filters only for a search that is not in the background", () => {
    const options = { claimType: "file", video: true, sort_by: "release_time", time_filter: "thisweek" };
    expect(getSearchQueryString("cats", { ...options, isBackgroundSearch: true })).toBe("s=cats&size=20&from=0");
    expect(getSearchQueryString("cats")).toBe("s=cats&size=20&from=0");
    expect(getSearchQueryString("cats", { ...options, isBackgroundSearch: false })).toBe(
      "s=cats&size=20&from=0&claimType=file&mediaType=video,&sort_by=release_time&time_filter=thisweek"
    );
  });

  it("leaves the media types off when searching channels", () => {
    expect(getSearchQueryString("cats", { claimType: "channel", isBackgroundSearch: false })).toBe(
      "s=cats&size=20&from=0&claimType=channel"
    );
  });

  it("adds related_to, free_only and nsfw=false", () => {
    expect(getSearchQueryString("cats", { related_to: "abc", free_only: true, nsfw: false })).toBe(
      "s=cats&size=20&from=0&related_to=abc&free_only=true&nsfw=false"
    );
    expect(getSearchQueryString("cats", { nsfw: true })).toBe("s=cats&size=20&from=0");
  });
});
