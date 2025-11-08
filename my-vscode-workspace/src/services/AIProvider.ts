import { Anthropic } from '@anthropic-ai/sdk';
import path from 'path';
import { promises as fs } from 'fs';

export interface AnalysisResult {
  observations: Array<{
    timestamp: number;
    observation: string;
    evidence?: {
      frameUrl: string;
      timeIndex: number;
    };
    suggestion: string;
    confidence: number;
  }>;
  summary: string;
  overallSuggestions: string[];
}

export interface AIProvider {
  analyzeGameplay(frames: string[], metadata: any): Promise<AnalysisResult>;
}

export class ClaudeProvider implements AIProvider {
  private client: Anthropic;
  private systemPrompt: string;

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    this.systemPrompt = `You are an expert gameplay analysis AI. Your task is to analyze gameplay footage frames and provide detailed, actionable feedback.

For each significant moment you identify:
1. Describe what's happening (be specific)
2. Explain why it's important
3. Suggest concrete improvements
4. Rate your confidence in the analysis (0-1)

Format your analysis as structured data with:
- timestamp: when the event occurs
- observation: what you see happening
- suggestion: specific, actionable advice
- confidence: your confidence score (0-1)

Keep feedback:
- Constructive and specific
- Focused on improvement opportunities
- Grounded in visual evidence
- Actionable and practical

Provide both specific feedback for key moments and overall strategic advice.`;
  }

  async analyzeGameplay(frames: string[], metadata: any): Promise<AnalysisResult> {
    // Convert frames to base64 for sending to Claude
    const frameData = await Promise.all(
      frames.map(async (frame) => {
        const buffer = await fs.readFile(frame);
        const base64 = buffer.toString('base64');
        const timestamp = this.getTimestampFromFramePath(frame);
        return {
          base64,
          timestamp,
          path: frame
        };
      })
    );

    // Sort frames by timestamp
    frameData.sort((a, b) => a.timestamp - b.timestamp);

    // Analyze in batches to stay within context limits
    const batchSize = 5;
    const observations: AnalysisResult['observations'] = [];
    
    for (let i = 0; i < frameData.length; i += batchSize) {
      const batch = frameData.slice(i, i + batchSize);
      
      const response = await this.client.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: this.systemPrompt },
            { type: 'text', text: 'Analyze these gameplay frames and provide feedback:' },
            ...batch.map(frame => ({
              type: 'image' as const,
              source: {
                type: 'base64' as const,
                media_type: 'image/jpeg' as const,
                data: frame.base64
              }
            })) as {
              type: 'image';
              source: {
                type: 'base64';
                media_type: 'image/jpeg';
                data: string;
              };
            }[]
          ]
        }]
      });

      if (response.content[0].type !== 'text') {
        throw new Error('Expected text response from Claude');
      }

      try {
        const analysis = JSON.parse(response.content[0].text);
        if (Array.isArray(analysis.observations)) {
          observations.push(...analysis.observations.map((obs: {
            timestamp: number;
            observation: string;
            suggestion: string;
            confidence: number;
          }) => ({
            ...obs,
            evidence: {
              frameUrl: batch[0].path,
              timeIndex: batch[0].timestamp
            }
          })));
        }
      } catch (error) {
        console.error('Error parsing Claude response:', error);
        continue;
      }
    }

    // Get overall summary and suggestions
    const summaryResponse = await this.client.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: `Based on the previous analysis of ${frames.length} gameplay frames, provide:
1. A concise summary of the player's gameplay style and key patterns
2. 3-5 high-impact suggestions for improvement
Format as JSON with 'summary' and 'overallSuggestions' fields.` }
        ]
      }]
    });

    if (summaryResponse.content[0].type !== 'text') {
      throw new Error('Expected text response from Claude');
    }

    const summary = JSON.parse(summaryResponse.content[0].text);

    return {
      observations: observations,
      summary: summary.summary,
      overallSuggestions: summary.overallSuggestions
    };
  }

  private getTimestampFromFramePath(framePath: string): number {
    const filename = path.basename(framePath);
    const match = filename.match(/frame-(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }
}