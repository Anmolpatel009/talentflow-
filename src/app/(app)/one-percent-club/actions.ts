"use server";

import { generateSkillAssessmentTest } from "@/ai/flows/skill-assessment";
import { z } from "zod";

const skillSchema = z.object({
  skill: z.string().min(2, "Please enter a skill.").max(50, "Skill name is too long."),
});

type State = {
  message?: string | null;
  test?: string | null;
  error?: boolean;
};

export async function createAssessment(prevState: State, formData: FormData): Promise<State> {
  const validatedFields = skillSchema.safeParse({
    skill: formData.get("skill"),
  });

  if (!validatedFields.success) {
    return {
      message: validatedFields.error.flatten().fieldErrors.skill?.join(", "),
      error: true,
    };
  }
  
  try {
    const result = await generateSkillAssessmentTest({ skill: validatedFields.data.skill });
    return {
        message: "Assessment generated successfully!",
        test: result.test,
        error: false,
    };
  } catch(e) {
    console.error(e);
    return {
        message: "Failed to generate assessment. Please try again later.",
        error: true,
    }
  }
}
