const { GoogleGenerativeAI } = require('@google/generative-ai');

async function main() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error('Missing GOOGLE_API_KEY in environment');
    process.exit(2);
  }

  const client = new GoogleGenerativeAI(apiKey);
  try {
    const res = await client.listModels();
    console.log('Raw listModels response:');
    console.log(JSON.stringify(res, null, 2));

    if (Array.isArray(res?.models)) {
      console.log('\nModels:');
      res.models.forEach((m) => console.log('-', m.name || m.model || JSON.stringify(m)));
    }
  } catch (err) {
    console.error('Error listing models:', err);
    process.exit(1);
  }
}

main();
