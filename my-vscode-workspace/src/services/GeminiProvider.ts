import { GoogleGenerativeAI } from '@google/generative-ai';
import { promises as fs } from 'fs';
import type { AIProvider, AnalysisResult } from './AIProvider';
import config from './config';
import { MockAIProvider } from './MockAIProvider';

export class GeminiProvider implements AIProvider {
  private genAI: GoogleGenerativeAI;
  private systemPrompt: string;
  private modelName?: string; // discovered working model name
  private useMock: boolean = false;
  private mock?: MockAIProvider;

  // Candidate model names to try until one works with generateContent
  private candidateModels = [
    'gemini-pro-vision',
    'models/gemini-pro-vision',
    'models/gemini-1.0',
    'models/gemini-1.5',
    'models/gemini-vision-1',
    'models/vision-1',
    'vision-1'
  ];

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.googleApiKey as string);

    this.systemPrompt = `You are an expert gameplay analysis AI. Analyze the gameplay footage frames and provide detailed, actionable feedback.

For each significant moment you identify:
1. Describe what's happening (be specific)
2. Explain why it's important
3. Suggest concrete improvements
4. Rate your confidence in the analysis (0-1)

Keep feedback:
- Constructive and specific
- Focused on improvement opportunities
- Grounded in visual evidence
- Actionable and practical

Format your response as a JSON object with:
{
  "observations": [
    {
      "timestamp": number,
      "observation": string,
      "suggestion": string,
      "confidence": number
    }
  ],
  "summary": string,
  "overallSuggestions": string[]
}`;
  }

  // Try candidate models until one accepts a small test prompt with generateContent.
  private async detectWorkingModel(): Promise<void> {
    for (const candidate of this.candidateModels) {
      try {
        const model = this.genAI.getGenerativeModel({ model: candidate } as any);
        // send a tiny test prompt to validate the model supports generateContent
        const testParts = [{ text: 'Ping: respond with OK' }];
        const result = await model.generateContent(testParts as any);
        // Await response.text() to ensure it didn't 404
        const resp = await result.response;
        const txt = await resp.text();
        if (txt) {
          this.modelName = candidate;
          console.log('GeminiProvider: using model', candidate);
          return;
        }
      } catch (err: any) {
        // 404 or unsupported method will be caught here. Try next candidate.
        console.debug('Model candidate failed:', candidate, err?.message || err);
        continue;
      }
    }

    // If none worked, fall back to mock provider so the pipeline remains functional.
    console.warn('No working Gemini model found; falling back to MockAIProvider');
    this.useMock = true;
    this.mock = new MockAIProvider();
  }

  async analyzeGameplay(frames: string[], metadata: any): Promise<AnalysisResult> {
    if (this.useMock && this.mock) {
      return this.mock.analyzeGameplay(frames, metadata);
    }

    if (!this.modelName && !this.useMock) {
      await this.detectWorkingModel();
      if (this.useMock && this.mock) {
        return this.mock.analyzeGameplay(frames, metadata);
      }
    }

    // Convert frames to base64 for sending to Gemini and keep source path
    const frameData = await Promise.all(
      frames.map(async (frame) => {
        const buffer = await fs.readFile(frame);
        const base64 = buffer.toString('base64');
        const mimeType = 'image/jpeg';
        return {
          inlineData: {
            data: base64,
            mimeType
          },
          source: frame
        };
      })
    );

    // Sort frames by timestamp from filename (frame-X.jpg)
    frameData.sort((a, b) => {
      const getTimestamp = (item: any) => {
        const match = item.source.match(/frame-(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };
      return getTimestamp(a) - getTimestamp(b);
    });

    // Analyze in batches to stay within context limits
    const batchSize = 4; // Gemini has smaller context than Claude
    const observations: AnalysisResult['observations'] = [];

    for (let i = 0; i < frameData.length; i += batchSize) {
      const batch = frameData.slice(i, i + batchSize);

      const model = this.genAI.getGenerativeModel({ model: this.modelName } as any);

      const parts = [
        { text: this.systemPrompt + '\n\nAnalyze these gameplay frames and provide feedback in JSON format:' },
        ...batch.map((item: any) => ({ inlineData: item.inlineData }))
      ];

      try {
  const result = await model.generateContent(parts as any);
  const response = await result.response;
  const text = response.text();

        // Extract JSON from response (handle potential text wrapping)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.warn('No JSON found in response:', text);
          continue;
        }

        const analysis = JSON.parse(jsonMatch[0]);
        if (Array.isArray(analysis.observations)) {
          observations.push(...analysis.observations.map((obs: any, idx: number) => ({
            ...obs,
            evidence: {
              frameUrl: batch[idx]?.source || frames[i],
              timeIndex: parseInt((batch[idx]?.source || frames[i]).match(/frame-(\d+)/)?.[1] || '0')
            }
          })));
        }
      } catch (error) {
        console.error('Error analyzing batch:', error);
        continue;
      }
    }

    // Get overall summary (send first and last frame for context)
    const summaryParts = [
      { text: `Based on the previous analysis of ${frames.length} gameplay frames, provide:
1. A concise summary of the player's gameplay style and key patterns
2. 3-5 high-impact suggestions for improvement
Format as JSON with 'summary' and 'overallSuggestions' fields.` },
      frameData[0].inlineData,
      frameData[frameData.length - 1].inlineData
    ];

    try {
  const model = this.genAI.getGenerativeModel({ model: this.modelName } as any);
  const result = await model.generateContent(summaryParts as any);
  const response = await result.response;
  const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in summary response');
      }

      const summary = JSON.parse(jsonMatch[0]);

      return {
        observations,
        summary: summary.summary,
        overallSuggestions: summary.overallSuggestions
      };
    } catch (error) {
      console.error('Error getting summary:', error);
      return {
        observations,
        summary: 'Error generating summary',
        overallSuggestions: ['Could not generate overall suggestions']
      };
    }
  }
}