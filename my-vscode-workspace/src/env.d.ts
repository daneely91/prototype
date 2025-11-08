declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ANTHROPIC_API_KEY: string;
      GOOGLE_API_KEY: string;
      NODE_ENV: 'development' | 'production';
      MAX_UPLOAD_SIZE: string; // in MB
    }
  }
}