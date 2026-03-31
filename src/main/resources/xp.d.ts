declare namespace XP {
  interface Request {
    method?: string;
    scheme?: string;
    host?: string;
    port?: number;
    path?: string;
    url?: string;
    params?: Record<string, string | undefined>;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
    body?: string;
    contentType?: string;
    branch?: string;
    mode?: string;
    repositoryId?: string;
  }

  interface Response<Body = unknown> {
    status?: number;
    body?: Body;
    contentType?: string;
    headers?: Record<string, string>;
    cookies?: Record<string, { value: string; path?: string; domain?: string; comment?: string; maxAge?: number; secure?: boolean; httpOnly?: boolean; sameSite?: string }>;
    redirect?: string;
    postProcess?: boolean;
    pageContributions?: {
      headBegin?: string | Array<string>;
      headEnd?: string | Array<string>;
      bodyBegin?: string | Array<string>;
      bodyEnd?: string | Array<string>;
    };
    applyFilters?: boolean;
  }
}
