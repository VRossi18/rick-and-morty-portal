import type OpenAI from 'openai';

export async function runLlmWithTools(options: {
   client: OpenAI;
   model: string;
   messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
   tools: OpenAI.Chat.Completions.ChatCompletionTool[];
   executeTool: (name: string, args: string) => Promise<unknown>;
   maxSteps?: number;
   temperature?: number;
   maxTokens?: number;
}): Promise<string> {
   const maxSteps = options.maxSteps ?? 5;
   const messages = [...options.messages];

   for (let step = 0; step < maxSteps; step += 1) {
      const completion = await options.client.chat.completions.create({
         model: options.model,
         temperature: options.temperature,
         max_tokens: options.maxTokens,
         messages,
         tools: options.tools,
         tool_choice: 'auto',
      });

      const choice = completion.choices[0]?.message;
      if (!choice) {
         throw new Error('LLM_EMPTY_RESPONSE');
      }

      const toolCalls = choice.tool_calls;
      if (!toolCalls || toolCalls.length === 0) {
         const text = choice.content?.trim();
         if (!text) {
            throw new Error('LLM_EMPTY_RESPONSE');
         }
         return text;
      }

      messages.push({
         role: 'assistant',
         content: choice.content ?? null,
         tool_calls: toolCalls,
      });

      for (const toolCall of toolCalls) {
         if (toolCall.type !== 'function') {
            continue;
         }

         const result = await options.executeTool(
            toolCall.function.name,
            toolCall.function.arguments,
         );

         messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
         });
      }
   }

   throw new Error('TOOL_LOOP_EXCEEDED');
}
