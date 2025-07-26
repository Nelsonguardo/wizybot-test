import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { searchProductsCSV } from './utils/csv.helper';
import * as dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  baseURL: process.env.DEEPSEEK_API_URL || '',
  apiKey: process.env.DEEPSEEK_API_KEY || '',
});

@Injectable()
export class ChatService {
  async processUserQuery(query: string): Promise<any> {
    // primera llamada al modelo
    const firstResponse = await this.callDeepSeek(query);

    // si el modelo decidió usar una función:
    if (firstResponse.function_call) {
      const functionName = firstResponse.function_call.name;
      const args = JSON.parse(firstResponse.function_call.arguments);
      let toolResult: any = {};

      if (functionName === 'searchProducts') {
        toolResult = await searchProductsCSV(args.query);
      } else if (functionName === 'convertCurrencies') {
        const fakeRate = this.getFakeRate(args.from, args.to);
        const converted = args.amount * fakeRate;
        toolResult = {
          amount: converted,
          currency: args.to,
          note: 'Simulated conversion with DeepSeek only',
        };
      }

      // segunda llamada al modelo con los resultados de la función
      const secondResponse = await this.callDeepSeek(query, functionName, toolResult);
      return { response: secondResponse.content };
    } else {
      // si no pidió usar función, devolvemos la respuesta
      return { response: firstResponse.content };
    }
  }

  private async callDeepSeek(
    userQuery: string,
    functionName?: string,
    toolResult?: any,
  ): Promise<any> {
    const messages: any[] = [
      {
        role: 'system',
        content: `You are a product assistant. Always use one of the provided functions to answer questions.
If the user asks about products, use searchProducts to look into the CSV product list.
Never use your internal knowledge. Always rely on the CSV product list to answer.`,
      },
      { role: 'user', content: userQuery },
    ];

    if (functionName && toolResult) {
      messages.push({
        role: 'function',
        name: functionName,
        content: JSON.stringify(toolResult),
      });
    }

    const functions = [
      {
        name: 'searchProducts',
        description: 'Search for products in the CSV file',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string' },
          },
          required: ['query'],
        },
      },
      {
        name: 'convertCurrencies',
        description: 'Convert amount from one currency to another (simulated)',
        parameters: {
          type: 'object',
          properties: {
            amount: { type: 'number' },
            from: { type: 'string' },
            to: { type: 'string' },
          },
          required: ['amount', 'from', 'to'],
        },
      },
    ];

    const payload = {
      model: process.env.DEEPSEEK_API_MODEL || '',
      messages,
      functions,
      function_call: 'auto' as const,
    };

    const result = await openai.chat.completions.create(payload);
    return result.choices[0].message;
  }

  // tasa de conversión simulada
  private getFakeRate(from: string, to: string): number {
    const rates: Record<string, number> = {
      USD: 1,
      EUR: 0.9,
      CAD: 1.3,
      COP: 4100,
    };
    const fromRate = rates[from.toUpperCase()] || 1;
    const toRate = rates[to.toUpperCase()] || 1;
    const usdValue = 1 / fromRate;
    return usdValue * toRate;
  }
}
