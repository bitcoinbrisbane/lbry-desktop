import { SORT_COMMENTS_BEST, SORT_COMMENTS_CONTROVERSIAL, SORT_COMMENTS_NEW } from "constants/comment";
import { buildValidSticker, getCommentsListTitle, parseSticker, sortComments } from "../../util/comments";

const comment = (id: string, extra: Record<string, any> = {}) => ({
  comment_id: id,
  channel_id: "chan-" + id,
  ...extra,
});
const reactions = (like: number, dislike: number) => ({ like, dislike });
const sorted = (sort: string, comments: any[], reactionsById: Record<string, any> = {}, mine: string[] = []) =>
  sortComments({ comments, reactionsById, sort, isMyComment: (channelId) => mine.includes(channelId) }).map(
    (c: any) => c.comment_id
  );

describe("sortComments", () => {
  it("returns an empty list for no comments, and does not change the original", () => {
    expect(
      sortComments({ comments: null, reactionsById: {}, sort: SORT_COMMENTS_BEST, isMyComment: () => false })
    ).toEqual([]);
    const original = [comment("a"), comment("b", { is_pinned: true })];
    sorted(SORT_COMMENTS_BEST, original);
    expect(original.map((c) => c.comment_id)).toEqual(["a", "b"]);
  });

  it("keeps the order for NEW, except a pinned comment goes first", () => {
    expect(sorted(SORT_COMMENTS_NEW, [comment("a"), comment("b"), comment("c")])).toEqual(["a", "b", "c"]);
    expect(sorted(SORT_COMMENTS_NEW, [comment("a"), comment("b"), comment("c", { is_pinned: true })])).toEqual([
      "c",
      "a",
      "b",
    ]);
  });

  it("puts my own comments first for BEST and CONTROVERSIAL", () => {
    const comments = [comment("a"), comment("b"), comment("c")];
    const byId = { a: reactions(5, 0), b: reactions(1, 0), c: reactions(9, 0) };
    expect(sorted(SORT_COMMENTS_BEST, comments, byId, ["chan-b"])[0]).toBe("b");
    expect(sorted(SORT_COMMENTS_CONTROVERSIAL, comments, byId, ["chan-b"])[0]).toBe("b");
  });

  it("ranks BEST by the lower bound of the likes ratio, so more evidence wins", () => {
    const comments = [comment("few"), comment("many"), comment("disliked")];
    const byId = { few: reactions(1, 0), many: reactions(50, 1), disliked: reactions(2, 10) };
    expect(sorted(SORT_COMMENTS_BEST, comments, byId)).toEqual(["many", "few", "disliked"]);
  });

  it("puts comments without likes after those with likes for BEST", () => {
    const comments = [comment("none"), comment("liked")];
    expect(sorted(SORT_COMMENTS_BEST, comments, { liked: reactions(3, 0) })).toEqual(["liked", "none"]);
  });

  it("ranks CONTROVERSIAL by volume and balance, and puts untouched comments last", () => {
    const comments = [comment("none"), comment("one-sided"), comment("split")];
    const byId = { "one-sided": reactions(20, 0), split: reactions(10, 10) };
    expect(sorted(SORT_COMMENTS_CONTROVERSIAL, comments, byId)).toEqual(["split", "one-sided", "none"]);
  });
});

describe("stickers", () => {
  it("wraps a sticker name in the marker", () => {
    expect(buildValidSticker(":CAT:")).toBe("<stkr>:CAT:<stkr>");
  });

  it("parses a comment that is exactly one known sticker", () => {
    expect(parseSticker(buildValidSticker(":CAT:"))).toBeTruthy();
    expect(parseSticker("hello " + buildValidSticker(":CAT:"))).toBeFalsy();
    expect(parseSticker(buildValidSticker(":NOT_A_STICKER:"))).toBeFalsy();
    expect(parseSticker("plain text")).toBeFalsy();
  });
});

describe("getCommentsListTitle", () => {
  it("reads naturally for none, one and many", () => {
    expect(getCommentsListTitle(0)).toBe("Leave a comment");
    expect(getCommentsListTitle(1)).toBe("1 comment");
    expect(getCommentsListTitle(12)).toBe("12 comments");
  });
});
