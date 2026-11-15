import crypto from "crypto";

// The Go daemon makes every client authenticate with HTTP basic auth (the admin credentials in its ADMIN_USERNAME
// and ADMIN_PASSWORD environment variables). The Python lbrynet ignores both the variables and the header, so
// the app can always do this.
//
// The app generates a password for each run, gives it to the daemon it starts, and adds the header to its own
// requests in the main process. The renderer never sees it, so nothing it loads can read it.

export type DaemonCredentials = { username: string; password: string };

type Env = Record<string, string | undefined>;

let cached: DaemonCredentials | null = null;

// ADMIN_USERNAME and ADMIN_PASSWORD from the environment when both are set, which is how to use a daemon that
// is already running with its own credentials; a new random password otherwise. The same for the whole run.
export function daemonCredentials(env: Env = process.env): DaemonCredentials {
  if (!cached) {
    const username = env.ADMIN_USERNAME;
    const password = env.ADMIN_PASSWORD;
    cached = username && password ? { username, password } : { username: "lbry", password: crypto.randomBytes(24).toString("hex") };
  }
  return cached;
}

export function resetDaemonCredentials(): void {
  cached = null;
}

export function basicAuthHeader({ username, password }: DaemonCredentials): string {
  return "Basic " + Buffer.from(`${username}:${password}`).toString("base64");
}

// The environment to start the daemon with: the app's own, with the credentials set.
export function daemonEnvironment(credentials: DaemonCredentials, env: Env = process.env): Env {
  return { ...env, ADMIN_USERNAME: credentials.username, ADMIN_PASSWORD: credentials.password };
}

type RequestDetails = {
  url: string;
  method: string;
  webContentsId?: number;
  frame?: { parent: unknown } | null;
  requestHeaders: Record<string, string>;
};

// Whether the daemon's credentials may be added to a request: only the app's own JSON-RPC calls to the daemon,
// from the top frame of the app's window. Any other page could send the same content type to the daemon's port.
export function shouldAuthenticate(details: RequestDetails, daemonUrl: string, appWebContentsId: number | undefined): boolean {
  if (details.method !== "POST" || details.requestHeaders["Content-Type"] !== "application/json-rpc") return false;
  if (appWebContentsId === undefined || details.webContentsId !== appWebContentsId) return false;
  if (!details.frame || details.frame.parent !== null) return false;
  try {
    const target = new URL(details.url);
    const daemon = new URL(daemonUrl);
    return target.protocol === daemon.protocol && target.host === daemon.host;
  } catch {
    return false;
  }
}
