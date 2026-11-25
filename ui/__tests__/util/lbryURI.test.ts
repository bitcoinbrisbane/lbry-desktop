import {
  buildURI,
  convertToShareLink,
  isNameValid,
  isURIClaimable,
  isURIEqual,
  isURIValid,
  normalizeURI,
  parseURI,
  splitBySeparator,
} from "../../util/lbryURI";

const ID = "0123456789abcdef0123456789abcdef01234567"; // a full 40 character claim id

describe("parseURI", () => {
  it("reads a plain stream name", () => {
    const parts = parseURI("lbry://video");
    expect(parts.streamName).toBe("video");
    expect(parts.isChannel).toBe(false);
    expect(parts.path).toBe("video");
    expect(parts.channelName).toBeUndefined();
    expect(parts.streamClaimId).toBeUndefined();
  });

  it("works without the protocol unless it is required", () => {
    expect(parseURI("video").streamName).toBe("video");
    expect(() => parseURI("video", true)).toThrow("protocol prefix");
    expect(parseURI("lbry://video", true).streamName).toBe("video");
  });

  it("reads a channel, which keeps its name without the @", () => {
    const parts = parseURI("lbry://@creator");
    expect(parts.isChannel).toBe(true);
    expect(parts.channelName).toBe("creator");
    expect(parts.streamName).toBeUndefined();
  });

  it("reads a claim id after # or :, short or full", () => {
    expect(parseURI("lbry://video#abc").streamClaimId).toBe("abc");
    expect(parseURI("lbry://video:abc").streamClaimId).toBe("abc");
    expect(parseURI(`lbry://video#${ID}`).streamClaimId).toBe(ID);
  });

  it("reads a stream inside a channel, each with its own claim id", () => {
    const parts = parseURI("lbry://@creator#a1/video#b2");
    expect(parts.isChannel).toBe(false);
    expect(parts.channelName).toBe("creator");
    expect(parts.channelClaimId).toBe("a1");
    expect(parts.streamName).toBe("video");
    expect(parts.streamClaimId).toBe("b2");
    expect(parts.path).toBe("@creator#a1/video#b2");
  });

  it("reads the start time from ?t= and keeps the query string", () => {
    const parts = parseURI("lbry://video#abc?t=90");
    expect(parts.startTime).toBe(90);
    expect(parts.streamClaimId).toBe("abc");
    expect((parts as any).queryString).toBe("?t=90");
  });

  it("keeps the deprecated fields that older code still reads", () => {
    const parts = parseURI("lbry://@creator#a1/video#b2");
    expect(parts.claimName).toBe("@creator");
    expect(parts.claimId).toBe("a1");
    expect(parts.contentName).toBe("video");
  });

  it("rejects an empty name, a lone @ and spaces", () => {
    expect(() => parseURI("lbry://")).toThrow("does not include name");
    expect(() => parseURI("")).toThrow("does not include name");
    expect(() => parseURI("lbry://@")).toThrow("No channel name after @");
    expect(() => parseURI("lbry://my video")).toThrow("can not include a space");
  });

  it("rejects a separator with nothing after it", () => {
    expect(() => parseURI("lbry://video#")).toThrow("No modifier provided after separator #");
    expect(() => parseURI("lbry://video$")).toThrow("No modifier provided after separator $");
    expect(() => parseURI("lbry://@creator#a1/video:")).toThrow("No modifier provided after separator :");
  });

  // Known bug: parseURIModifier tests `separator === ":" || "#"`, which is always true, so a $ modifier is read
  // as a claim id and the bid position is never set. These expectations are the correct behaviour; `failing`
  // makes the suite complain as soon as the bug is fixed, so the marker gets removed.
  it.failing("reads a $ modifier as a bid position", () => {
    expect(parseURI("lbry://video$2").primaryBidPosition).toBe(2);
  });

  it("currently reads a $ modifier as a claim id (see the failing test above)", () => {
    expect(parseURI("lbry://video$2").streamClaimId).toBe("2");
  });

  it("rejects a claim id that is not lowercase hex or is too long", () => {
    expect(() => parseURI("lbry://video#xyz")).toThrow("Invalid claim ID");
    expect(() => parseURI("lbry://video#ABC")).toThrow("Invalid claim ID");
    expect(() => parseURI(`lbry://video#${ID}0`)).toThrow("Invalid claim ID");
  });
});

describe("buildURI", () => {
  it("builds a stream, a channel and a stream in a channel", () => {
    expect(buildURI({ streamName: "video" })).toBe("lbry://video");
    expect(buildURI({ channelName: "creator" })).toBe("lbry://@creator");
    expect(buildURI({ channelName: "@creator" })).toBe("lbry://@creator");
    expect(buildURI({ channelName: "creator", streamName: "video" })).toBe("lbry://@creator/video");
  });

  it("puts the claim ids behind #", () => {
    expect(buildURI({ streamName: "video", streamClaimId: "b2" })).toBe("lbry://video#b2");
    expect(buildURI({ channelName: "creator", channelClaimId: "a1", streamName: "video", streamClaimId: "b2" })).toBe(
      "lbry://@creator#a1/video#b2"
    );
  });

  it("can leave the protocol off or use another one", () => {
    expect(buildURI({ streamName: "video" }, false)).toBe("video");
    expect(buildURI({ streamName: "video" }, true, "https://open.lbry.com/")).toBe("https://open.lbry.com/video");
  });

  it("adds the start time", () => {
    expect(buildURI({ streamName: "video", startTime: 30 })).toBe("lbry://video?t=30");
  });

  it("round-trips what parseURI reads", () => {
    for (const uri of [
      "lbry://video",
      "lbry://video#abc",
      "lbry://@creator",
      "lbry://@creator#a1",
      "lbry://@creator#a1/video#b2",
      "lbry://@creator/video",
      "lbry://video#abc?t=12",
    ]) {
      expect(normalizeURI(uri)).toBe(uri);
    }
  });
});

describe("normalizeURI", () => {
  it("adds the protocol and writes a : claim id as #", () => {
    expect(normalizeURI("video")).toBe("lbry://video");
    expect(normalizeURI("lbry://video:abc")).toBe("lbry://video#abc");
    expect(normalizeURI("@creator:a1/video:b2")).toBe("lbry://@creator#a1/video#b2");
  });

  it("throws for a url that cannot be parsed", () => {
    expect(() => normalizeURI("lbry://")).toThrow();
  });
});

describe("isURIValid", () => {
  it("accepts good urls and rejects bad ones without throwing", () => {
    expect(isURIValid("lbry://video")).toBe(true);
    expect(isURIValid("lbry://@creator#a1/video#b2")).toBe(true);
    expect(isURIValid("lbry://")).toBe(false);
    expect(isURIValid("lbry://video#xyz")).toBe(false);
    expect(isURIValid("lbry://my video")).toBe(false);
  });
});

describe("isNameValid", () => {
  it("allows ordinary names, including unicode and dashes", () => {
    expect(isNameValid("my-video_1")).toBe(true);
    expect(isNameValid("vidéo")).toBe(true);
  });

  it("rejects characters that are part of the url syntax", () => {
    for (const bad of ["a b", "a#b", "a:b", "a/b", "a?b", "a@b", "a$b", "a=b", "a&b", "a%b", 'a"b', "a<b"]) {
      expect(isNameValid(bad)).toBe(false);
    }
  });
});

describe("isURIClaimable", () => {
  it("is true only for a new stream name without a claim id or channel", () => {
    expect(isURIClaimable("lbry://video")).toBe(true);
    expect(isURIClaimable("lbry://video#abc")).toBeFalsy();
    expect(isURIClaimable("lbry://@creator")).toBeFalsy();
    expect(isURIClaimable("lbry://")).toBe(false);
  });
});

describe("convertToShareLink", () => {
  it("builds the open.lbry.com link and drops the start time", () => {
    expect(convertToShareLink("lbry://@creator#a1/video#b2")).toBe("https://open.lbry.com/@creator#a1/video#b2");
    expect(convertToShareLink("lbry://video#abc?t=5")).toBe("https://open.lbry.com/video#abc");
  });
});

describe("splitBySeparator", () => {
  it("splits a lbry:// url after the protocol", () => {
    expect(splitBySeparator("lbry://video#abc")).toEqual(["video", "abc"]);
    expect(splitBySeparator("lbry://video")).toEqual(["video"]);
  });
});

describe("isURIEqual", () => {
  it("compares streams by claim id and channels by channel claim id", () => {
    expect(isURIEqual("lbry://video#abc", "lbry://video:abc")).toBe(true);
    expect(isURIEqual("lbry://video#abc", "lbry://video#def")).toBe(false);
    expect(isURIEqual("lbry://@creator#a1", "lbry://@creator#a1")).toBe(true);
    expect(isURIEqual("lbry://@creator#a1", "lbry://@creator#a2")).toBeUndefined();
  });
});
