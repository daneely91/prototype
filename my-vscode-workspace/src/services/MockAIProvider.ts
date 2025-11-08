import type { AIProvider, AnalysisResult } from './AIProvider';

export class MockAIProvider implements AIProvider {
  async analyzeGameplay(frames: string[], metadata: any): Promise<AnalysisResult> {
    // Simulate analysis time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock observations based on frame timestamps
    const observations = frames.map((frame, index) => {
      const timestamp = this.getTimestampFromFramePath(frame);
      return {
        timestamp,
        observation: this.getMockObservation(index),
        evidence: {
          frameUrl: frame,
          timeIndex: timestamp
        },
        suggestion: this.getMockSuggestion(index),
        confidence: 0.8 + (Math.random() * 0.2) // Random between 0.8 and 1.0
      };
    });

    return {
      observations,
      summary: "Player shows good mechanical skills but could improve positioning and resource management. " +
               "Several key moments demonstrate both strong aim and tactical decision-making, though some " +
               "opportunities for map control were missed.",
      overallSuggestions: [
        "Focus on maintaining better map awareness and positioning",
        "Practice utility usage in key chokepoints",
        "Consider developing set plays for common situations",
        "Work on economy management and buy strategy"
      ]
    };
  }

  private getTimestampFromFramePath(framePath: string): number {
    const match = framePath.match(/frame-(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  private getMockObservation(index: number): string {
    const observations = [
      "Player demonstrates excellent crosshair placement while holding this angle",
      "Good use of utility to clear common camping positions",
      "Aggressive peek without teammate support could be risky",
      "Smart rotation timing after getting early information",
      "Resource management could be improved - holding too many unused utilities",
      "Strong mechanical aim during this engagement",
      "Positioned well to trade teammate's death",
      "Missed opportunity to gather information safely"
    ];
    return observations[index % observations.length];
  }

  private getMockSuggestion(index: number): string {
    const suggestions = [
      "Consider jiggle peeking this angle to bait out enemy utility",
      "Use smokes to isolate angles when entering the site",
      "Communicate rotation plans earlier to allow teammate setup",
      "Save utility for late-round executes",
      "Pre-aim common angles while clearing site",
      "Work with teammates to create crossfires",
      "Practice flash timings for common entry points",
      "Develop default strategies for early round control"
    ];
    return suggestions[index % suggestions.length];
  }
}