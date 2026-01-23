import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import { interviews } from "@/utils/schema";
import { generateCompletion } from "@/lib/groq";
import { getQuestionGeneratorPrompt } from "@/utils/prompts";
import { CreateInterviewRequest } from "@/types";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateInterviewRequest = await request.json();
    const { role, experienceLevel, interviewType } = body;

    // Validate input
    if (!role || !experienceLevel || !interviewType) {
      return NextResponse.json(
        { error: "Missing required fields: role, experienceLevel, interviewType" },
        { status: 400 }
      );
    }

    // Generate questions using AI
    const prompt = getQuestionGeneratorPrompt({
      role,
      experience: experienceLevel,
      interviewType,
    });

    let questionsJson: string;
    try {
      questionsJson = await generateCompletion([
        { role: "system", content: "You are an expert technical interviewer. Always respond with valid JSON only." },
        { role: "user", content: prompt },
      ]);
    } catch (aiError) {
      console.error("AI generation error:", aiError);
      // Fallback to default questions if AI fails
      questionsJson = JSON.stringify({
        questions: [
          { id: 1, text: `Tell me about yourself and your experience with ${role} development.`, difficulty: "easy", topic: "introduction", expectedTime: 60 },
          { id: 2, text: `What are the key skills required for a ${role} role?`, difficulty: "medium", topic: "technical", expectedTime: 120 },
          { id: 3, text: `Describe a challenging project you worked on and how you overcame obstacles.`, difficulty: "medium", topic: "experience", expectedTime: 120 },
          { id: 4, text: `How do you stay updated with the latest technologies in your field?`, difficulty: "medium", topic: "learning", expectedTime: 90 },
          { id: 5, text: `Where do you see yourself in 5 years?`, difficulty: "easy", topic: "career", expectedTime: 60 },
        ],
      });
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

    // Create interview in database
    const mockId = uuidv4();

    await db.insert(interviews).values({
      mockId,
      userId: user.id,
      role,
      experienceLevel,
      interviewType,
      status: "pending",
      questionsJson: JSON.stringify(parsedQuestions),
    });

    return NextResponse.json({
      success: true,
      interviewId: mockId,
      questions: parsedQuestions.questions,
    });
  } catch (error) {
    console.error("Create interview error:", error);
    return NextResponse.json(
      { error: "Failed to create interview" },
      { status: 500 }
    );
  }
}
