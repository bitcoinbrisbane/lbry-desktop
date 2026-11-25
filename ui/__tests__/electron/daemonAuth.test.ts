import {
  basicAuthHeader,
  daemonCredentials,
  daemonEnvironment,
  resetDaemonCredentials,
  shouldAuthenticate,
} from "../../../electron/daemonAuth";

beforeEach(() => resetDaemonCredentials());

describe("daemonCredentials", () => {
  it("makes a random password that stays the same for the whole run", () => {
    const first = daemonCredentials({});
    expect(first.username).toBe("lbry");
    expect(first.password).toMatch(/^[0-9a-f]{48}$/);
    expect(daemonCredentials({})).toBe(first);
  });

  it("makes a new password for each run", () => {
    const first = daemonCredentials({}).password;
    resetDaemonCredentials();
    expect(daemonCredentials({}).password).not.toBe(first);
  });

  it("uses ADMIN_USERNAME and ADMIN_PASSWORD when both are set, for a daemon that is already running", () => {
    expect(daemonCredentials({ ADMIN_USERNAME: "admin", ADMIN_PASSWORD: "secret" })).toEqual({
      username: "admin",
      password: "secret",
    });
  });

  it("ignores one of them on its own", () => {
    expect(daemonCredentials({ ADMIN_USERNAME: "admin" }).username).toBe("lbry");
    resetDaemonCredentials();
    expect(daemonCredentials({ ADMIN_PASSWORD: "secret" }).username).toBe("lbry");
  });
});

describe("basicAuthHeader", () => {
  it("is HTTP basic authentication", () => {
    expect(basicAuthHeader({ username: "admin", password: "s3cret" })).toBe("Basic YWRtaW46czNjcmV0");
  });
});

describe("daemonEnvironment", () => {
  it("adds the credentials to the app's environment, replacing any already there", () => {
    const env = daemonEnvironment({ username: "lbry", password: "pw" }, { PATH: "/bin", ADMIN_PASSWORD: "old" });
    expect(env).toEqual({ PATH: "/bin", ADMIN_USERNAME: "lbry", ADMIN_PASSWORD: "pw" });
  });
});

describe("shouldAuthenticate", () => {
  const request = (overrides: Record<string, unknown> = {}) => ({
    url: "http://localhost:5279/?m=status",
    method: "POST",
    webContentsId: 7,
    frame: { parent: null },
    requestHeaders: { "Content-Type": "application/json-rpc" },
    ...overrides,
  });
  const daemon = "http://localhost:5279";

  it("authenticates the app's own call to the daemon", () => {
    expect(shouldAuthenticate(request(), daemon, 7)).toBe(true);
  });

  it("does not authenticate anything else", () => {
    const refused: Record<string, ReturnType<typeof request>> = {
      "another method": request({ method: "GET" }),
      "another content type": request({ requestHeaders: { "Content-Type": "text/plain" } }),
      "another window": request({ webContentsId: 8 }),
      "a request without a window": request({ webContentsId: undefined }),
      "a subframe": request({ frame: { parent: {} } }),
      "no frame": request({ frame: null }),
      "another host": request({ url: "http://evil.example:5279/" }),
      "another port": request({ url: "http://localhost:5280/" }),
      "another scheme": request({ url: "https://localhost:5279/" }),
      "a url that is not one": request({ url: "not a url" }),
    };
    for (const [name, details] of Object.entries(refused)) {
      expect([name, shouldAuthenticate(details, daemon, 7)]).toEqual([name, false]);
    }
  });

  it("does not authenticate when the window is not known yet", () => {
    expect(shouldAuthenticate(request(), daemon, undefined)).toBe(false);
  });

  it("follows the daemon connection string", () => {
    expect(shouldAuthenticate(request({ url: "http://127.0.0.1:6000/" }), "http://127.0.0.1:6000", 7)).toBe(true);
    expect(shouldAuthenticate(request(), "http://127.0.0.1:6000", 7)).toBe(false);
  });
});
