declare module "futu-api/main.js" {
  export interface FtCmdMeta {
    cmd: number;
    name: string;
    description: string;
  }

  export const ftCmdID: Record<string, FtCmdMeta>;

  export default class FutuWebsocket {
    onlogin: ((ret: boolean, msg: unknown) => void) | null;
    onPush: ((cmd: number, payload: unknown) => void) | null;

    start(ip: string, port: number, ssl: boolean, key?: string): void;
    stop(): void;

    GetAccList(payload: unknown): Promise<unknown>;
    UnlockTrade(payload: unknown): Promise<unknown>;
    GetPositionList(payload: unknown): Promise<unknown>;
    GetFunds(payload: unknown): Promise<unknown>;
  }
}
