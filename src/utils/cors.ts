export const getCorsCheckFn = (allowedOrigins: string) => {
  const ALLOWED_ORIGINS = allowedOrigins.split(" ");
  const ALLOW_ALL_ORIGINS =
    ALLOWED_ORIGINS.length === 1 && ALLOWED_ORIGINS[0] === "*";
  return (
    origin: string | undefined,
    cb: (error: Error | null, respOrigin: boolean | string) => void,
  ) => {
    if (ALLOW_ALL_ORIGINS) return cb(null, "*");
    if (
      !origin ||
      ALLOWED_ORIGINS.includes(origin) ||
      new URL(origin).hostname === "localhost"
    )
      return cb(null, true);
    cb(Object.assign(new Error("Forbidden"), { statusCode: 403 }), false);
  };
};
