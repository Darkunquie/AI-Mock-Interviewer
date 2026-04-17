// Interview creation helpers — extracted from route handlers so controllers
// stay thin (<30 lines). Both functions throw InvalidAiOutputError on bad
// AI JSON; callers map to Errors.aiInvalidOutput().

import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import { interviews } from "@/utils/schema";
import { DURATION_CONFIG } from "@/types";
import type { InterviewDuration, Question } from "@/types";
import type { CreateInterviewInput } from "@/lib/validations";
import { generateQuestions } from "./generator";
import { parseStringArray } from "./validator";
import type { InterviewRow } from "./validator";

export interface InterviewCreationResult {
  interviewId: string;
  questions: Question[];
}

export async function createInterview(
  userId: number,
  input: CreateInterviewInput,
): Promise<InterviewCreationResult> {
  const dur = (DURATION_CONFIG[input.duration as InterviewDuration]
    ? input.duration
    : "15") as InterviewDuration;
  const questionCount = DURATION_CONFIG[dur].questionCount;
  const mode = input.mode;

  let questions: Question[];
  if (input.customQuestions && input.customQuestions.length > 0) {
    questions = input.customQuestions as Question[];
  } else {
    const result = await generateQuestions({
      role: input.role,
      experience: input.experienceLevel,
      interviewType: input.interviewType,
      questionCount,
      techStack: input.techStack?.length ? input.techStack : undefined,
      mode,
      topics: input.topics?.length ? input.topics : undefined,
      techDeepDive: input.techDeepDive,
    });
    questions = result.questions;
  }

  const mockId = uuidv4();
  await db.insert(interviews).values({
    mockId,
    userId,
    role: input.role,
    experienceLevel: input.experienceLevel,
    interviewType: input.interviewType,
    duration: dur,
    mode,
    techStack: input.techStack?.length ? input.techStack : null,
    topics: input.topics?.length ? input.topics : null,
    status: "pending",
    questionsJson: { questions },
  });

  return { interviewId: mockId, questions };
}

export async function retakeInterview(
  userId: number,
  original: InterviewRow,
): Promise<InterviewCreationResult> {
  const dur = (DURATION_CONFIG[(original.duration || "15") as InterviewDuration]
    ? original.duration
    : "15") as InterviewDuration;
  const mode = (original.mode ?? "interview") as "interview" | "practice";
  const techStack = parseStringArray(original.techStack);
  const topics = parseStringArray(original.topics);
  const result = await generateQuestions({
    role: original.role,
    experience: original.experienceLevel,
    interviewType: original.interviewType,
    questionCount,
    techStack: techStack.length ? techStack : undefined,
    mode,
    topics: topics.length ? topics : undefined,
    techDeepDive: original.techDeepDive,
  });
    topics: topics.length ? topics : undefined,
  });

  const mockId = uuidv4();
  await db.insert(interviews).values({
    mockId,
    userId,
    role: original.role,
    experienceLevel: original.experienceLevel,
    interviewType: original.interviewType,
    duration: dur,
    mode,
    techStack: techStack.length ? techStack : null,
    topics: topics.length ? topics : null,
    status: "pending",
    questionsJson: { questions: result.questions },
  });

  return { interviewId: mockId, questions: result.questions };
}
