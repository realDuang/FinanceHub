const env: Record<string, string> = Object.create(null);

for (const [key, value] of Object.entries(import.meta.env ?? {})) {
  if (typeof value === "string") {
    env[key] = value;
  }
}

if (!env.NODE_ENV && typeof import.meta.env.MODE === "string") {
  env.NODE_ENV = import.meta.env.MODE;
}

const hrtime = (previousTime?: [number, number]): [number, number] => {
  const now = performance.now() * 1e-3;
  let seconds = Math.floor(now);
  let nanoseconds = Math.floor((now - seconds) * 1e9);

  if (previousTime) {
    seconds -= previousTime[0];
    nanoseconds -= previousTime[1];
    if (nanoseconds < 0) {
      nanoseconds += 1e9;
      seconds -= 1;
    }
  }

  return [seconds, nanoseconds];
};

const processPolyfill = {
  env,
  version: "",
  versions: {} as Record<string, string>,
  browser: true,
  pid: 0,
  platform: "browser",
  arch: "browser",
  release: {},
  cwd: () => "/",
  chdir: () => {
    throw new Error("process.chdir is not supported in the browser");
  },
  nextTick: (callback: (...args: unknown[]) => void, ...args: unknown[]) => {
    queueMicrotask(() => {
      callback(...args);
    });
  },
  hrtime,
  uptime: () => performance.now() / 1000,
  stdout: {
    writable: false,
    write: () => true,
  },
  stderr: {
    writable: false,
    write: () => true,
  },
  stdin: {
    readable: false,
    on: () => undefined,
    once: () => undefined,
    removeListener: () => undefined,
  },
  exit: () => undefined,
  on: () => undefined,
  addListener: () => undefined,
  off: () => undefined,
  removeListener: () => undefined,
  emit: () => false,
  listeners: () => [] as Array<(...args: unknown[]) => void>,
  binding: () => {
    throw new Error("process.binding is not supported in the browser");
  },
  features: {},
  noDeprecation: false,
  traceDeprecation: false,
  throwDeprecation: false,
} as const;

if (typeof globalThis.process === "undefined") {
  // @ts-expect-error injecting process for browser runtime
  globalThis.process = processPolyfill;
}

export type BrowserProcess = typeof processPolyfill;

declare global {
  // eslint-disable-next-line no-var
  var process: BrowserProcess;
}

export default processPolyfill;
