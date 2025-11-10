'use server';

/**
 * @fileOverview A flow that uses a tool to check if a task is present in the user's calendar history
 *  and suggests auto-completion, asking for confirmation if necessary.
 *
 * - smartTaskCompletion - A function that suggests completing a task automatically.
 * - SmartTaskCompletionInput - The input type for the smartTaskCompletion function.
 * - SmartTaskCompletionOutput - The return type for the smartTaskCompletion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartTaskCompletionInputSchema = z.object({
  taskDetails: z.string().describe('The details of the task to be completed.'),
  calendarHistory: z
    .string()
    .describe(
      'The user calendar history. Should be a text containing a list of events.'
    ),
});
export type SmartTaskCompletionInput = z.infer<typeof SmartTaskCompletionInputSchema>;

const SmartTaskCompletionOutputSchema = z.object({
  shouldCompleteTask: z
    .boolean()
    .describe(
      'Whether the task should be automatically completed based on calendar history analysis.'
    ),
  confirmationRequired: z
    .boolean()
    .describe(
      'Whether user confirmation is required before completing the task due to ambiguity.'
    ),
  reasoning: z
    .string()
    .describe('Explanation of why the task completion was suggested.'),
});
export type SmartTaskCompletionOutput = z.infer<typeof SmartTaskCompletionOutputSchema>;

export async function smartTaskCompletion(input: SmartTaskCompletionInput): Promise<SmartTaskCompletionOutput> {
  return smartTaskCompletionFlow(input);
}

const smartTaskCompletionPrompt = ai.definePrompt({
  name: 'smartTaskCompletionPrompt',
  input: {schema: SmartTaskCompletionInputSchema},
  output: {schema: SmartTaskCompletionOutputSchema},
  prompt: `You are a smart assistant helping users manage their to-do list.

You are given the following task details: {{{taskDetails}}}
And the user's calendar history: {{{calendarHistory}}}

Analyze the calendar history to see if there's any event matching the task details.

Based on the analysis, determine whether the task should be automatically completed.
If there's a clear match in the calendar history, suggest completing the task without confirmation.
If there's ambiguity or uncertainty, require user confirmation.
If there is no match, you should not complete the task.

Explain your reasoning for the suggestion.
`,
});

const smartTaskCompletionFlow = ai.defineFlow(
  {
    name: 'smartTaskCompletionFlow',
    inputSchema: SmartTaskCompletionInputSchema,
    outputSchema: SmartTaskCompletionOutputSchema,
  },
  async input => {
    const {output} = await smartTaskCompletionPrompt(input);
    return output!;
  }
);
