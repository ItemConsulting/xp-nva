export type FreeMarkerParams = {
  resultCount: number;
  institution: string | undefined;
  importUrl: string;
  isRunning: boolean;
  progress:
    | {
        current: number;
        total: number;
        pct: number;
        info: string | undefined;
      }
    | undefined;
  inlineStyle: string;
};
