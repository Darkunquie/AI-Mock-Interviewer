import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { interviews } from "@/utils/schema";
import { generateCompletion } from "@/lib/groq";
import { getQuestionGeneratorPrompt } from "@/utils/prompts";
import { DURATION_CONFIG, InterviewDuration } from "@/types";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { interviewId } = await request.json();

    if (!interviewId) {
      return NextResponse.json(
        { error: "Missing interviewId" },
        { status: 400 }
      );
    }

    // Fetch the original interview
    const original = await db
      .select()
      .from(interviews)
      .where(eq(interviews.mockId, interviewId))
      .limit(1);

    if (!original.length) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    const originalInterview = original[0];

    // Verify user owns this interview
    if (originalInterview.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Use the same parameters from the original interview
    const role = originalInterview.role;
    const experienceLevel = originalInterview.experienceLevel;
    const interviewType = originalInterview.interviewType;
    const duration = (originalInterview.duration || "15") as InterviewDuration;
    const mode = originalInterview.mode || "interview";
    const techStack: string[] = originalInterview.techStack
      ? JSON.parse(originalInterview.techStack)
      : [];
    const topics: string[] = originalInterview.topics
      ? JSON.parse(originalInterview.topics)
      : [];

    const questionCount = DURATION_CONFIG[duration]?.questionCount || 10;

    // Generate fresh questions using AI
    const prompt = getQuestionGeneratorPrompt({
      role,
      experience: experienceLevel,
      interviewType,
      questionCount,
      techStack: techStack.length > 0 ? techStack : undefined,
      mode,
      topics: topics.length > 0 ? topics : undefined,
    });

    let questionsJson: string;
    try {
      questionsJson = await generateCompletion([
        { role: "system", content: "You are an expert technical interviewer. Always respond with valid JSON only." },
        { role: "user", content: prompt },
      ]);
    } catch (aiError) {
      console.error("AI generation error on retake:", aiError);
      const fallbackBase = [
        { text: `Tell me about yourself and your experience with ${role} development.`, difficulty: "easy", topic: "introduction", expectedTime: 60 },
        { text: `What are the key skills required for a ${role} role?`, difficulty: "medium", topic: "technical", expectedTime: 90 },
        { text: `Describe a challenging project you worked on and how you overcame obstacles.`, difficulty: "medium", topic: "experience", expectedTime: 90 },
        { text: `How do you stay updated with the latest technologies in your field?`, difficulty: "medium", topic: "learning", expectedTime: 90 },
        { text: `Where do you see yourself in 5 years?`, difficulty: "easy", topic: "career", expectedTime: 60 },
        { text: `What is your approach to debugging complex issues?`, difficulty: "medium", topic: "problem-solving", expectedTime: 90 },
        { text: `Explain a concept in ${role} that you find particularly interesting.`, difficulty: "medium", topic: "technical", expectedTime: 90 },
        { text: `How do you handle tight deadlines and pressure?`, difficulty: "medium", topic: "soft-skills", expectedTime: 90 },
        { text: `What tools and technologies are you most proficient in?`, difficulty: "easy", topic: "technical", expectedTime: 60 },
        { text: `Describe your ideal work environment and team culture.`, difficulty: "easy", topic: "culture", expectedTime: 60 },
      ];
      const fallbackQuestions = fallbackBase.slice(0, questionCount).map((q, i) => ({ ...q, id: i + 1 }));
      questionsJson = JSON.stringify({ questions: fallbackQuestions });
    }

    // Parse and validate questions
    let parsedQuestions;
    try {
      parsedQuestions = JSON.parse(questionsJson);
      if (!parsedQuestions.questions || !Array.isArray(parsedQuestions.questions)) {
        throw new Error("Invalid questions format");
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json(
        { error: "Failed to generate valid questions" },
        { status: 500 }
      );
    }

    // Create new interview with same parameters
    const mockId = uuidv4();

    await db.insert(interviews).values({
      mockId,
      userId: user.id,
      role,
      experienceLevel,
      interviewType,
      duration,
      mode,
      techStack: techStack.length > 0 ? JSON.stringify(techStack) : null,
      topics: topics.length > 0 ? JSON.stringify(topics) : null,
      status: "pending",
      questionsJson: JSON.stringify(parsedQuestions),
    });

    return NextResponse.json({
      success: true,
      interviewId: mockId,
      questions: parsedQuestions.questions,
    });
  } catch (error) {
    console.error("Retake interview error:", error);
    return NextResponse.json(
      { error: "Failed to create retake interview" },
      { status: 500 }
    );
  }
}
