import SparkMD5 from "spark-md5";
import ftWebsocket from "futu-api/main.js";
import type {
  PortfolioCashInfo,
  PortfolioEquityPoint,
  PortfolioOverview,
  PortfolioPosition,
  PortfolioSnapshot,
} from "./types";

interface FutuConfig {
  host: string;
  port: number;
  ssl: boolean;
  key?: string;
  tradeEnv: number;
  tradeCategory: number;
  tradePwd?: string;
  accountId?: string;
  markets: number[];
  connectTimeoutMs: number;
}

type ProtoLike = Record<string, unknown>;

const EQUITY_HISTORY_STORAGE_KEY = "financehub:futu:equity-history";

const TRD_ENV_MAP: Record<string, number> = {
  SIMULATE: 0,
  REAL: 1,
};

const TRD_CATEGORY_MAP: Record<string, number> = {
  SECURITY: 1,
  FUTURE: 2,
};

const TRD_MARKET_MAP: Record<string, number> = {
  HK: 1,
  US: 2,
  CN: 3,
  HKCC: 4,
  FUTURES: 5,
  SG: 6,
  JP: 15,
  AU: 8,
  MY: 111,
  CA: 112,
};

const SEC_MARKET_MAP: Record<number, string> = {
  1: "HK",
  2: "US",
  31: "CN-SH",
  32: "CN-SZ",
  41: "SG",
  51: "JP",
  61: "AU",
  71: "MY",
  81: "CA",
  91: "FX",
};

const CURRENCY_CODE_MAP: Record<number, string> = {
  0: "UNKNOWN",
  1: "HKD",
  2: "USD",
  3: "CNH",
  4: "JPY",
  5: "SGD",
  6: "AUD",
  7: "CAD",
  8: "MYR",
};

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return ["1", "true", "yes", "on"].includes(value.toLowerCase());
  }
  return false;
}

function parseMarkets(raw: unknown): number[] {
  if (typeof raw !== "string" || !raw.trim()) {
    return [];
  }
  const codes = raw
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);
  const resolved = codes
    .map((code) => TRD_MARKET_MAP[code])
    .filter((value): value is number => value !== undefined);
  return resolved;
}

function resolveEnvValue<T extends Record<string, number>>(
  mapping: T,
  value: unknown,
  fallbackKey: keyof T
): number {
  if (typeof value === "string" && value.trim()) {
    const resolved = mapping[value.trim().toUpperCase() as keyof T];
    if (resolved !== undefined) {
      return resolved;
    }
  }
  return mapping[fallbackKey];
}

function loadConfig(): FutuConfig {
  const env = import.meta.env;
  const connectTimeoutMs = 15000;
  return {
    host: String(env.VITE_FUTU_OPEND_HOST || "127.0.0.1"),
    port: Number(env.VITE_FUTU_OPEND_PORT || 33333),
    ssl: toBoolean(env.VITE_FUTU_OPEND_SSL),
    key: env.VITE_FUTU_OPEND_KEY ? String(env.VITE_FUTU_OPEND_KEY) : undefined,
    tradeEnv: resolveEnvValue(TRD_ENV_MAP, env.VITE_FUTU_TRADE_ENV, "REAL"),
    tradeCategory: resolveEnvValue(
      TRD_CATEGORY_MAP,
      env.VITE_FUTU_TRADE_CATEGORY,
      "SECURITY"
    ),
    tradePwd: env.VITE_FUTU_TRADE_PWD
      ? String(env.VITE_FUTU_TRADE_PWD)
      : undefined,
    accountId: env.VITE_FUTU_ACCOUNT_ID
      ? String(env.VITE_FUTU_ACCOUNT_ID).trim()
      : undefined,
    markets: parseMarkets(env.VITE_FUTU_MARKETS),
    connectTimeoutMs,
  };
}

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function toNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined) {
    return fallback;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  if (typeof value === "object" && value !== null) {
    const candidate = value as {
      toNumber?: () => number;
      toString?: () => string;
    };
    if (typeof candidate.toNumber === "function") {
      const parsed = candidate.toNumber();
      return Number.isFinite(parsed) ? parsed : fallback;
    }
    if (typeof candidate.toString === "function") {
      const str = candidate.toString();
      if (str) {
        const parsed = Number(str);
        return Number.isFinite(parsed) ? parsed : fallback;
      }
    }
  }
  return fallback;
}

function toIdString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return value.toString();
  }
  if (typeof value === "object" && value !== null) {
    const candidate = value as { toString?: () => string };
    if (typeof candidate.toString === "function") {
      const result = candidate.toString();
      if (typeof result === "string" && result.length > 0) {
        return result;
      }
    }
  }
  return String(value);
}

function resolveCurrency(raw: unknown): string {
  if (typeof raw === "number") {
    return CURRENCY_CODE_MAP[raw] || "USD";
  }
  if (typeof raw === "string" && raw.trim()) {
    return raw.trim().toUpperCase();
  }
  return "USD";
}

function resolveMarketFromSymbol(symbol: string): string | undefined {
  if (symbol.includes(".")) {
    return symbol.split(".")[0];
  }
  return undefined;
}

function resolveSecMarket(raw: unknown): string {
  if (typeof raw === "number" && raw in SEC_MARKET_MAP) {
    return SEC_MARKET_MAP[raw];
  }
  return "--";
}

function md5Hex(payload: string): string {
  return SparkMD5.hash(payload);
}

class FutuPortfolioService {
  private readonly config: FutuConfig;
  private client: ftWebsocket | null = null;
  private loginPromise: Promise<void> | null = null;
  private connected = false;
  private accountId: string | null = null;
  private accountMarkets: number[] = [];
  private tradeUnlocked = false;

  constructor() {
    this.config = loadConfig();
    if (isBrowser()) {
      window.addEventListener("beforeunload", () => {
        this.disconnect();
      });
    }
  }

  async getSnapshot(): Promise<PortfolioSnapshot> {
    await this.ensureConnection();
    const accountId = await this.ensureAccount();
    await this.ensureTradeUnlocked();

    const [cash, positions] = await Promise.all([
      this.fetchCash(accountId),
      this.fetchPositions(accountId),
    ]);

    const overview = this.buildOverview(accountId, cash, positions);
    const equityCurve = this.updateAndGetEquityCurve(overview);

    return {
      overview,
      positions,
      equity_curve: equityCurve,
    };
  }

  disconnect(): void {
    if (this.client) {
      try {
        this.client.stop();
      } catch (error) {
        console.debug("Failed to stop Futu websocket", error);
      }
    }
    this.client = null;
    this.loginPromise = null;
    this.connected = false;
    this.tradeUnlocked = false;
  }

  private async ensureConnection(): Promise<void> {
    if (this.connected && this.client) {
      return;
    }

    if (!this.client) {
      this.client = new ftWebsocket();
    }

    if (!this.loginPromise) {
      this.loginPromise = new Promise<void>((resolve, reject) => {
        const client = this.client!;
        const timer = setTimeout(() => {
          client.stop();
          this.client = null;
          this.connected = false;
          this.loginPromise = null;
          reject(new Error("连接 Futu OpenD 超时"));
        }, this.config.connectTimeoutMs);

        client.onlogin = (ret: boolean, msg: unknown) => {
          clearTimeout(timer);
          client.onlogin = null;
          this.loginPromise = null;
          if (ret) {
            this.connected = true;
            resolve();
          } else {
            this.connected = false;
            this.client = null;
            const detail =
              typeof msg === "string" && msg ? msg : "OpenD 登录失败";
            reject(new Error(detail));
          }
        };

        try {
          client.start(
            this.config.host,
            this.config.port,
            this.config.ssl,
            this.config.key || ""
          );
        } catch (error) {
          clearTimeout(timer);
          this.loginPromise = null;
          this.connected = false;
          this.client = null;
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      });
    }

    await this.loginPromise;
  }

  private async ensureAccount(): Promise<string> {
    if (this.accountId) {
      return this.accountId;
    }

    const response = await this.send(() =>
      this.client!.GetAccList({
        c2s: {
          userID: 0,
          trdCategory: this.config.tradeCategory,
          needGeneralSecAccount: true,
        },
      })
    );

    const accList = (response as ProtoLike)?.s2c?.accList;
    if (!Array.isArray(accList) || !accList.length) {
      throw new Error("未获取到可用的交易账户");
    }

    const desiredId = this.config.accountId;
    const tradeEnv = this.config.tradeEnv;
    let selected: ProtoLike | undefined;

    if (desiredId) {
      selected = accList.find((item) => toIdString(item.accID) === desiredId);
    }

    if (!selected) {
      selected = accList.find((item) => toNumber(item.trdEnv) === tradeEnv);
    }

    if (!selected) {
      selected = accList[0];
    }

    const accId = toIdString(selected.accID);
    if (!accId) {
      throw new Error("交易账户信息缺少 accID");
    }

    this.accountId = accId;

    const markets = Array.isArray(selected.trdMarketAuthList)
      ? (selected.trdMarketAuthList as unknown[])
          .map((item) => toNumber(item))
          .filter((value) => value > 0)
      : [];

    this.accountMarkets = markets;

    return this.accountId;
  }

  private async ensureTradeUnlocked(): Promise<void> {
    if (!this.config.tradePwd || this.tradeUnlocked) {
      return;
    }

    const pwdMD5 = md5Hex(this.config.tradePwd).toLowerCase();
    await this.send(() =>
      this.client!.UnlockTrade({
        c2s: {
          unlock: true,
          pwdMD5,
          securityFirm: 1,
        },
      })
    );
    this.tradeUnlocked = true;
  }

  private async fetchPositions(
    accountId: string
  ): Promise<PortfolioPosition[]> {
    const positions: PortfolioPosition[] = [];
    const markets = this.resolveTargetMarkets();

    for (const market of markets) {
      try {
        const response = await this.send(() =>
          this.client!.GetPositionList({
            c2s: {
              header: {
                trdEnv: this.config.tradeEnv,
                accID: accountId,
                trdMarket: market,
              },
              refreshCache: true,
            },
          })
        );
        const rawList = (response as ProtoLike)?.s2c?.positionList;
        if (Array.isArray(rawList)) {
          rawList.forEach((raw) => {
            positions.push(this.normalizePosition(raw as ProtoLike));
          });
        }
      } catch (error) {
        console.warn(`获取市场 ${market} 持仓失败`, error);
      }
    }

    positions.sort((a, b) => b.market_value - a.market_value);
    return positions;
  }

  private async fetchCash(accountId: string): Promise<PortfolioCashInfo> {
    const markets = this.resolveTargetMarkets();
    const firstMarket =
      markets[0] ?? this.accountMarkets[0] ?? this.config.markets[0] ?? 1;

    try {
      const response = await this.send(() =>
        this.client!.GetFunds({
          c2s: {
            header: {
              trdEnv: this.config.tradeEnv,
              accID: accountId,
              trdMarket: firstMarket,
            },
            refreshCache: true,
          },
        })
      );
      const funds = (response as ProtoLike)?.s2c?.funds;
      if (funds) {
        return this.normalizeFunds(funds as ProtoLike);
      }
    } catch (error) {
      console.warn("获取账户资金信息失败", error);
    }

    return {
      currency: "USD",
      total_assets: 0,
      available_cash: 0,
      buying_power: 0,
    };
  }

  private buildOverview(
    accountId: string,
    cash: PortfolioCashInfo,
    positions: PortfolioPosition[]
  ): PortfolioOverview {
    const totalMarketValue = positions.reduce(
      (sum, item) => sum + item.market_value,
      0
    );
    const totalCostValue = positions.reduce(
      (sum, item) => sum + item.cost_price * item.quantity,
      0
    );
    const totalPnl = positions.reduce((sum, item) => sum + item.pnl, 0);
    const todayPnl = positions.reduce((sum, item) => sum + item.today_pnl, 0);

    const totalPnlRatio = totalCostValue
      ? (totalPnl / totalCostValue) * 100
      : 0;
    const todayPnlRatio = totalCostValue
      ? (todayPnl / totalCostValue) * 100
      : 0;

    const updateTime = new Date().toISOString();

    return {
      account_id: accountId,
      source: "futu",
      total_market_value: totalMarketValue,
      total_cost_value: totalCostValue,
      total_pnl: totalPnl,
      total_pnl_ratio: totalPnlRatio,
      today_pnl: todayPnl,
      today_pnl_ratio: todayPnlRatio,
      update_time: updateTime,
      cash,
    };
  }

  private normalizePosition(raw: ProtoLike): PortfolioPosition {
    const symbol =
      typeof raw.code === "string"
        ? raw.code
        : typeof raw.symbol === "string"
        ? raw.symbol
        : "--";
    const market =
      resolveMarketFromSymbol(symbol) ??
      resolveSecMarket(toNumber(raw.secMarket));

    const quantity = toNumber(raw.qty ?? raw.quantity);
    const costPrice = toNumber(
      raw.costPrice ?? raw.dilutedCostPrice ?? raw.averageCostPrice
    );
    const lastPrice = toNumber(raw.price ?? raw.nominalPrice ?? raw.lastPrice);
    const marketValue = toNumber(
      raw.val ?? raw.marketVal ?? raw.marketValue ?? quantity * lastPrice
    );
    const pnl = toNumber(raw.plVal ?? raw.unrealizedPL);
    const pnlRatio = toNumber(raw.plRatio ?? raw.pnlRatio);
    const todayPnl = toNumber(raw.tdPlVal ?? raw.todayPl ?? raw.todayPlVal);
    const todayPnlRatio = toNumber(raw.tdPlRatio ?? raw.todayPlRatio);
    const currency = resolveCurrency(raw.currency);
    const lotSizeRaw = raw.lotSize ?? raw.qtyLotSize ?? raw.qtyStep;
    const lotSize = lotSizeRaw !== undefined ? toNumber(lotSizeRaw) : null;

    return {
      symbol,
      name:
        typeof raw.name === "string"
          ? raw.name
          : typeof raw.stockName === "string"
          ? raw.stockName
          : "--",
      market,
      quantity,
      cost_price: costPrice,
      last_price: lastPrice,
      market_value: marketValue,
      pnl,
      pnl_ratio: pnlRatio,
      today_pnl: todayPnl,
      today_pnl_ratio: todayPnlRatio,
      currency,
      lot_size: lotSize,
    };
  }

  private normalizeFunds(raw: ProtoLike): PortfolioCashInfo {
    const currency = resolveCurrency(raw.currency);
    const totalAssets = toNumber(raw.totalAssets ?? raw.totalAsset);
    const availableCash = toNumber(
      raw.availableFunds ?? raw.cash ?? raw.availableCash
    );
    const buyingPower = toNumber(
      raw.power ?? raw.netCashPower ?? availableCash
    );

    return {
      currency,
      total_assets: totalAssets,
      available_cash: availableCash,
      buying_power: buyingPower,
    };
  }

  private computeEquity(overview: PortfolioOverview): number {
    const cashAssets = overview.cash.total_assets;
    if (cashAssets && cashAssets > 0) {
      return cashAssets;
    }
    return overview.total_market_value + overview.cash.available_cash;
  }

  private loadEquityHistory(): PortfolioEquityPoint[] {
    if (!isBrowser()) {
      return [];
    }
    try {
      const raw = window.localStorage.getItem(EQUITY_HISTORY_STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => ({
            timestamp:
              typeof item.timestamp === "string"
                ? item.timestamp
                : new Date().toISOString(),
            equity: toNumber(item.equity),
            pnl: toNumber(item.pnl),
          }))
          .filter((item) => !Number.isNaN(item.equity));
      }
    } catch (error) {
      console.debug("解析本地权益历史失败", error);
    }
    return [];
  }

  private updateAndGetEquityCurve(
    overview: PortfolioOverview
  ): PortfolioEquityPoint[] {
    if (!isBrowser()) {
      return [];
    }

    const history = this.loadEquityHistory();
    const now = new Date(overview.update_time);
    const equity = this.computeEquity(overview);
    const pnl = overview.total_pnl;

    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const filtered = history.filter((item) => {
      const timestamp = new Date(item.timestamp).getTime();
      return Number.isFinite(timestamp) && timestamp >= cutoff;
    });

    const entry: PortfolioEquityPoint = {
      timestamp: now.toISOString(),
      equity,
      pnl,
    };

    filtered.push(entry);
    filtered.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const deduped: PortfolioEquityPoint[] = [];
    for (const item of filtered) {
      const iso = new Date(item.timestamp).toISOString();
      const last = deduped[deduped.length - 1];
      if (last && last.timestamp === iso) {
        deduped[deduped.length - 1] = { ...item, timestamp: iso };
      } else {
        deduped.push({ ...item, timestamp: iso });
      }
    }

    try {
      window.localStorage.setItem(
        EQUITY_HISTORY_STORAGE_KEY,
        JSON.stringify(deduped)
      );
    } catch (error) {
      console.debug("保存权益历史失败", error);
    }

    return deduped;
  }

  private resolveTargetMarkets(): number[] {
    if (this.config.markets.length && this.accountMarkets.length) {
      const intersection = this.accountMarkets.filter((market) =>
        this.config.markets.includes(market)
      );
      if (intersection.length) {
        return intersection;
      }
    }

    if (this.accountMarkets.length) {
      return this.accountMarkets;
    }

    if (this.config.markets.length) {
      return this.config.markets;
    }

    return [TRD_MARKET_MAP.US];
  }

  private async send<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.client) {
      throw new Error("Futu 客户端未初始化");
    }
    try {
      return await operation();
    } catch (error) {
      const detail = this.extractErrorMessage(error);
      throw new Error(detail);
    }
  }

  private extractErrorMessage(error: unknown): string {
    if (!error) {
      return "调用 Futu 接口失败";
    }
    if (error instanceof Error && error.message) {
      return error.message;
    }
    const asObj = error as ProtoLike;
    if (asObj.retMsg && typeof asObj.retMsg === "string") {
      return asObj.retMsg;
    }
    if (asObj.errmsg && typeof asObj.errmsg === "string") {
      return asObj.errmsg;
    }
    return String(error);
  }
}

const futuPortfolioService = new FutuPortfolioService();

export default futuPortfolioService;
