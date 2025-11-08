interface EnvConfig {
  googleApiKey: string;
  maxUploadSize: number;
  nodeEnv: 'development' | 'production';
}

function validateEnv(): EnvConfig {
  const requiredEnvVars = ['GOOGLE_API_KEY', 'MAX_UPLOAD_SIZE', 'NODE_ENV'] as const;
  const missingVars = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return {
    googleApiKey: process.env.GOOGLE_API_KEY!,
    maxUploadSize: parseInt(process.env.MAX_UPLOAD_SIZE || '100', 10),
    nodeEnv: (process.env.NODE_ENV || 'development') as 'development' | 'production'
  };
}

// This will throw immediately if env vars are missing
const config = validateEnv();

export default config;