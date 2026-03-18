declare module "/lib/http-client" {
  interface HttpRequestParams {
    url: string;
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
    params?: Record<string, string>;
    headers?: Record<string, string>;
    body?: string;
    contentType?: string;
    connectionTimeout?: number;
    readTimeout?: number;
    followRedirects?: boolean;
    proxy?: {
      host: string;
      port: number;
      user?: string;
      password?: string;
    };
    auth?: {
      user: string;
      password: string;
    };
    multipart?: Array<{
      name: string;
      value?: string;
      fileName?: string;
      contentType?: string;
      stream?: unknown;
    }>;
    certificates?: unknown;
  }

  interface HttpResponse {
    status: number;
    message?: string;
    body?: string;
    contentType?: string;
    headers?: Record<string, string>;
  }

  function request(params: HttpRequestParams): HttpResponse;
}
