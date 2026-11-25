import {
  formatFileSystemPath,
  formatInAppUrl,
  formatLbryUrlForWeb,
  formatWebUrlIntoLbryUrl,
  generateEncodedLbryURL,
  generateInitialUrl,
  generateLbryContentUrl,
  generateLbryWebUrl,
  generateListSearchUrlParams,
  generateRssUrl,
  generateShareUrl,
} from "../../util/url";

describe("formatLbryUrlForWeb", () => {
  it("turns lbry:// into a path and # into :", () => {
    expect(formatLbryUrlForWeb("lbry://@creator#a1/video#b2")).toBe("/@creator:a1/video:b2");
  });

  it("sends an internal page link to /$/", () => {
    expect(formatLbryUrlForWeb("lbry://?rewards")).toBe("/$/rewards");
  });
});

describe("generateLbryWebUrl", () => {
  it("replaces every # with :", () => {
    expect(generateLbryWebUrl("@creator#a1/video#b2")).toBe("@creator:a1/video:b2");
  });
});

describe("formatFileSystemPath", () => {
  it("returns nothing for an empty path", () => {
    expect(formatFileSystemPath(null)).toBeUndefined();
    expect(formatFileSystemPath("")).toBeUndefined();
  });

  it("makes a file:// url with slashes and escapes ? and #", () => {
    expect(formatFileSystemPath("/home/me/a b.mp4")).toBe("file:///home/me/a%20b.mp4");
    expect(formatFileSystemPath("C:\\Users\\me\\v.mp4")).toBe("file:///C:/Users/me/v.mp4");
    expect(formatFileSystemPath("/tmp/a#1?.mp4")).toBe("file:///tmp/a%231%3F.mp4");
  });
});

describe("formatInAppUrl", () => {
  it("turns a known app page into /$/page and keeps its query", () => {
    expect(formatInAppUrl("?rewards")).toBe("/$/rewards");
    expect(formatInAppUrl("?settings&tab=x")).toBe("/$/settings?tab=x");
  });

  it("leaves a claim url or an unknown page alone", () => {
    expect(formatInAppUrl("@creator/video")).toBe("@creator/video");
    expect(formatInAppUrl("?nosuchpage")).toBe("?nosuchpage");
  });
});

describe("formatWebUrlIntoLbryUrl", () => {
  it("builds lbry://?page from the path", () => {
    expect(formatWebUrlIntoLbryUrl("/$/rewards", "")).toBe("lbry://?rewards");
    expect(formatWebUrlIntoLbryUrl("/", "")).toBe("lbry://?discover");
  });

  it("moves the search into the link", () => {
    expect(formatWebUrlIntoLbryUrl("/$/search", "?q=cats")).toBe("lbry://?search&q=cats");
  });
});

describe("generateInitialUrl", () => {
  it("is / without a hash and keeps a leading slash", () => {
    expect(generateInitialUrl("")).toBe("/");
    expect(generateInitialUrl("#/$/rewards")).toBe("/$/rewards");
    expect(generateInitialUrl("#rewards")).toBe("/rewards");
  });
});

describe("generateLbryContentUrl", () => {
  it("prefers the canonical url and drops the protocol", () => {
    expect(generateLbryContentUrl("lbry://@c#1/v#2", "lbry://v#2")).toBe("@c#1/v#2");
    expect(generateLbryContentUrl(null, "lbry://v#2")).toBe("v#2");
  });
});

describe("generateShareUrl", () => {
  const domain = "https://odysee.test";

  it("builds a web url from a lbry url", () => {
    expect(generateShareUrl(domain, "lbry://@creator#a1/video#b2", null, false, false, 0, null)).toBe(
      "https://odysee.test/@creator:a1/video:b2"
    );
  });

  it("adds the start time with ?t=, only when asked, and keeps 0", () => {
    expect(generateShareUrl(domain, "lbry://video#b2", null, false, true, 90, null)).toBe(
      "https://odysee.test/video:b2?t=90"
    );
    expect(generateShareUrl(domain, "lbry://video#b2", null, false, true, 0, null)).toBe(
      "https://odysee.test/video:b2?t=0"
    );
    expect(generateShareUrl(domain, "lbry://video#b2", null, false, false, 90, null)).toBe(
      "https://odysee.test/video:b2"
    );
  });

  it("adds the referral code only when rewards are approved", () => {
    expect(generateShareUrl(domain, "lbry://video#b2", "ref1", true, false, 0, null)).toBe(
      "https://odysee.test/video:b2?r=ref1"
    );
    expect(generateShareUrl(domain, "lbry://video#b2", "ref1", false, false, 0, null)).toBe(
      "https://odysee.test/video:b2"
    );
  });

  it("adds the list id, then the start time", () => {
    expect(generateShareUrl(domain, "lbry://video#b2", "ref1", true, true, 5, "list9")).toBe(
      "https://odysee.test/video:b2?r=ref1&lid=list9&t=5"
    );
  });

  it("encodes special characters in names", () => {
    expect(generateShareUrl(domain, "lbry://it's(1)#b2", null, false, false, 0, null)).toBe(
      "https://odysee.test/it%27s%281%29:b2"
    );
  });
});

describe("generateEncodedLbryURL", () => {
  it("encodes the whole path and its params", () => {
    expect(generateEncodedLbryURL("https://x.test", "@c:1/v:2", true, 30, "L1")).toBe(
      "https://x.test/%40c%3A1%2Fv%3A2%3Ft%3D30%26lid%3DL1"
    );
  });
});

describe("generateRssUrl", () => {
  it("is empty unless the claim is a channel with a canonical url", () => {
    expect(generateRssUrl("https://x.test", null)).toBe("");
    expect(generateRssUrl("https://x.test", { value_type: "stream", canonical_url: "lbry://a#1" })).toBe("");
    expect(generateRssUrl("https://x.test", { value_type: "channel" })).toBe("");
  });

  it("builds the feed url from the canonical url", () => {
    expect(generateRssUrl("https://x.test", { value_type: "channel", canonical_url: "lbry://@creator#a1" })).toBe(
      "https://x.test/$/rss/@creator:a1"
    );
  });
});

describe("generateListSearchUrlParams", () => {
  it("puts the collection id in the query", () => {
    expect(generateListSearchUrlParams("abc123")).toBe("?lid=abc123");
  });
});
