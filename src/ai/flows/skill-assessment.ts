// SkillAssessment.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating skill assessment tests using AI.
 *
 * The flow takes a skill as input and generates a test for that skill. It is used to evaluate freelancers applying for the 1% Club.
 *
 * @interface SkillAssessmentInput - Represents the input schema for the skill assessment test generation.
 * @interface SkillAssessmentOutput - Represents the output schema for the skill assessment test generation.
 * @function generateSkillAssessmentTest - The main function to generate the skill assessment test.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SkillAssessmentInputSchema = z.object({
  skill: z.string().describe('The skill for which to generate the assessment test.'),
});
export type SkillAssessmentInput = z.infer<typeof SkillAssessmentInputSchema>;

const SkillAssessmentOutputSchema = z.object({
  test: z.string().describe('The generated skill assessment test.'),
});
export type SkillAssessmentOutput = z.infer<typeof SkillAssessmentOutputSchema>;

export async function generateSkillAssessmentTest(input: SkillAssessmentInput): Promise<SkillAssessmentOutput> {
  return generateSkillAssessmentTestFlow(input);
}

const generateSkillAssessmentTestPrompt = ai.definePrompt({
  name: 'generateSkillAssessmentTestPrompt',
  input: {schema: SkillAssessmentInputSchema},
  output: {schema: SkillAssessmentOutputSchema},
  prompt: `You are an AI expert at creating professional skill assessments.

  Generate a skill assessment test for the following skill: {{skill}}.
  
  The test should be comprehensive and challenging, designed to evaluate the proficiency of freelancers applying for the 1% Club.
  It should include a mix of multiple-choice questions, true/false, and one or two short open-ended questions to test conceptual and practical knowledge.
  
  Return the entire test as a single, well-formatted string.
  `,
});

const generateSkillAssessmentTestFlow = ai.defineFlow(
  {
    name: 'generateSkillAssessmentTestFlow',
    inputSchema: SkillAssessmentInputSchema,
    outputSchema: SkillAssessmentOutputSchema,
  },
  async input => {
    const {output} = await generateSkillAssessmentTestPrompt(input);
    return output!;
  }
);
