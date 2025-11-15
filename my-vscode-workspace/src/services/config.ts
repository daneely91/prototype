interface EnvConfig {
  googleApiKey: string;
  maxUploadSize: number;
  nodeEnv: 'development' | 'production';
}

function validateEnv(): EnvConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'production';
  
  // In development, use placeholder/mock values if env vars are missing
  // In production, require all env vars to be set
  const isDev = nodeEnv === 'development';
  
  const googleApiKey = process.env.GOOGLE_API_KEY || (isDev ? 'mock-key-for-dev' : '');
  const maxUploadSize = parseInt(process.env.MAX_UPLOAD_SIZE || '100', 10);
  
  if (!isDev && !process.env.GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY is required in production');
  }

  return {
    googleApiKey,
    maxUploadSize,
    nodeEnv
  };
}

const config = validateEnv();

export default config;