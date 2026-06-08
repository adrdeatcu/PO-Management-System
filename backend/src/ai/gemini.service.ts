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
      'You will be given reviewer comments (from managers, IT, and finance).',
      '',
      'Your task:',
      '1) Write a concise, plain-language summary of the main reasons for rejection.',
      '2) Write 3–5 concrete, actionable tips to improve the purchase order so it can be approved next time.',
      '',
      'IMPORTANT OUTPUT FORMAT:',
      'Return your answer as plain text with exactly two labeled sections in this order:',
      '',
      'Summary:',
      '<one or more short lines summarizing the main issues>',
      '',
      'Tips:',
      '<3–5 short bullet points with concrete advice>',
      '',
      'Do not add any other headings.',
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
        // eslint-disable-next-line no-console
        console.error('Gemini API error:', res.status, errorBody);
        throw new Error(`Gemini API error: ${res.status}`);
      }

      const data = await res.json();

      // Optional logging for debugging shape
      // eslint-disable-next-line no-console
      console.log('Gemini API response:', JSON.stringify(data, null, 2));

      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ??
        'No summary available.';

      let summary = text;
      let tips = '';

      const summaryIndex = text.indexOf('Summary:');
      const tipsIndex = text.indexOf('Tips:');

      if (summaryIndex !== -1 && tipsIndex !== -1 && tipsIndex > summaryIndex) {
        const summaryPart = text
          .slice(summaryIndex + 'Summary:'.length, tipsIndex)
          .trim();
        const tipsPart = text
          .slice(tipsIndex + 'Tips:'.length)
          .trim();

        if (summaryPart) summary = summaryPart;
        if (tipsPart) tips = tipsPart;
      }

      return {
        summary,
        tips,
      };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Gemini call failed:', err);
      throw new InternalServerErrorException('Failed to summarize feedback with Gemini');
    }
  }
}