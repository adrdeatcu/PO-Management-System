import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class GeminiService {
  private readonly apiKey = process.env.GEMINI_API_KEY;
  // Using Gemini 2.5 Flash Lite model on v1 API
  private readonly endpoint =
    'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent';

  async summarizeRejections(comments: string[]): Promise<{ summary: string; tips: string }> {
    if (!this.apiKey) {
      throw new InternalServerErrorException('GEMINI_API_KEY is not configured');
    }

    const prompt = [
      'You are helping a user understand why their purchase order was rejected multiple times.',
      'Read the following reviewer comments (from managers, IT, and finance) and then:',
      '1) Write a short plain-language summary (3–5 bullet points) of the main issues.',
      '2) Write 3–5 concrete, actionable tips to improve the purchase order so it can be approved next time.',
      '',
      'Reviewer comments:',
      ...comments.map((c, i) => `${i + 1}. ${c}`),
    ].join('\n');

    try {
      const res = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        // Temporary logging for debugging
        // eslint-disable-next-line no-console
        console.error('Gemini API error:', res.status, errorBody);
        throw new Error(`Gemini API error: ${res.status}`);
      }

      const data = await res.json();

      // Optional: log once to inspect shape
      // eslint-disable-next-line no-console
      console.log('Gemini API response:', JSON.stringify(data, null, 2));

      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ??
        'No summary available.';

      return {
        summary: text,
        tips: '',
      };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Gemini call failed:', err);
      throw new InternalServerErrorException('Failed to summarize feedback with Gemini');
    }
  }
}