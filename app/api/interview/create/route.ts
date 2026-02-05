import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import { interviews } from "@/utils/schema";
import { generateCompletion } from "@/lib/groq";
import { getQuestionGeneratorPrompt } from "@/utils/prompts";
import { CreateInterviewRequest, DURATION_CONFIG, Question } from "@/types";
import { getCurrentUser } from "@/lib/auth";

interface TechDeepDiveConfig {
  technology: string;
  subtopics: string[];
  targetCompany?: string;
}

interface ExtendedCreateInterviewRequest extends CreateInterviewRequest {
  customQuestions?: Question[];
  techDeepDive?: TechDeepDiveConfig;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ExtendedCreateInterviewRequest = await request.json();
    const { role, experienceLevel, interviewType, duration, techStack, mode, topics, customQuestions, techDeepDive } = body;

    // Validate input
    if (!role || !experienceLevel || !interviewType) {
      return NextResponse.json(
        { error: "Missing required fields: role, experienceLevel, interviewType" },
        { status: 400 }
      );
    }

    const interviewDuration = duration && DURATION_CONFIG[duration] ? duration : "15";
    const questionCount = DURATION_CONFIG[interviewDuration].questionCount;
    const interviewMode = mode || "interview";

    let parsedQuestions: { questions: Question[] };

    // Check if custom questions are provided (from PDF upload)
    if (customQuestions && Array.isArray(customQuestions) && customQuestions.length > 0) {
      // Use custom questions directly
      parsedQuestions = { questions: customQuestions };
    } else {
      // Generate questions using AI
      const prompt = getQuestionGeneratorPrompt({
        role,
        experience: experienceLevel,
        interviewType,
        questionCount,
        techStack: techStack && techStack.length > 0 ? techStack : undefined,
        mode: interviewMode,
        topics: topics && topics.length > 0 ? topics : undefined,
        techDeepDive: techDeepDive || undefined,
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
          { text: `How do you prioritize tasks when working on multiple projects?`, difficulty: "medium", topic: "management", expectedTime: 90 },
          { text: `Tell me about a time you had to learn a new technology quickly.`, difficulty: "medium", topic: "adaptability", expectedTime: 90 },
          { text: `What is your approach to code reviews and collaboration?`, difficulty: "medium", topic: "teamwork", expectedTime: 90 },
          { text: `Describe a situation where you disagreed with a team member. How did you resolve it?`, difficulty: "hard", topic: "conflict-resolution", expectedTime: 120 },
          { text: `What architectural decisions have you made and what was the outcome?`, difficulty: "hard", topic: "architecture", expectedTime: 120 },
          { text: `How do you ensure the quality and reliability of your code?`, difficulty: "medium", topic: "quality", expectedTime: 90 },
          { text: `What is the most complex system you have designed or contributed to?`, difficulty: "hard", topic: "system-design", expectedTime: 120 },
          { text: `How do you approach performance optimization?`, difficulty: "hard", topic: "performance", expectedTime: 120 },
          { text: `What motivates you to keep growing in your career?`, difficulty: "easy", topic: "motivation", expectedTime: 60 },
          { text: `If you could improve one thing about your current skill set, what would it be?`, difficulty: "medium", topic: "self-awareness", expectedTime: 90 },
        ];
        const fallbackQuestions = fallbackBase.slice(0, questionCount).map((q, i) => ({ ...q, id: i + 1 }));
        questionsJson = JSON.stringify({ questions: fallbackQuestions });
      }

      // Parse and validate questions
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
    }

    // Create interview in database
    const mockId = uuidv4();

    await db.insert(interviews).values({
      mockId,
      userId: user.id,
      role,
      experienceLevel,
      interviewType,
      duration: interviewDuration,
      mode: interviewMode,
      techStack: techStack && techStack.length > 0 ? JSON.stringify(techStack) : null,
      topics: topics && topics.length > 0 ? JSON.stringify(topics) : null,
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
