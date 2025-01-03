declare namespace NodeJS {
  interface ProcessEnv {
    HOST: string;
    PORT: string;
    DB_URL: string;
    CORS: string;
  }
}
