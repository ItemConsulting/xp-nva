declare global {
  namespace XP {
    type Request = import("@enonic-types/core").Request;
    type Response<
      T extends Partial<import("@enonic-types/core").ResponseInterface> = Record<string, never>,
    > = import("@enonic-types/core").Response<T>;
  }
}

export {};
