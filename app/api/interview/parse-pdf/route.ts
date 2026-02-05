import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { extractTextFromPdf } from "@/lib/pdf-parser";
import { generateCompletion } from "@/lib/groq";
import { getQuestionClassifierPrompt } from "@/utils/prompts";
import { Question } from "@/types";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit
const ALLOWED_MIME_TYPES = ["application/pdf"];

// Role detection based on question topics/keywords
function detectRoleFromQuestions(questions: Question[]): string {
  const topicCounts: Record<string, number> = {};

  // Count topic occurrences
  questions.forEach((q) => {
    const topic = q.topic.toLowerCase();
    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
  });

  // Role keyword mappings
  const roleKeywords: Record<string, string[]> = {
    frontend: ["react", "vue", "angular", "javascript", "typescript", "html", "css", "dom", "ui", "frontend", "next.js", "tailwind"],
    backend: ["python", "django", "flask", "node.js", "express", "api", "database", "sql", "backend", "server", "rest"],
    fullstack: ["fullstack", "full-stack", "mern", "mean"],
    data: ["data", "pandas", "numpy", "machine-learning", "ml", "ai", "statistics", "analysis", "visualization"],
    devops: ["docker", "kubernetes", "ci/cd", "jenkins", "aws", "azure", "devops", "deployment", "infrastructure"],
    mobile: ["react-native", "flutter", "ios", "android", "mobile", "swift", "kotlin"],
    hr: ["behavioral", "leadership", "communication", "teamwork", "conflict"],
  };

  // Score each role based on topic matches
  const roleScores: Record<string, number> = {
    frontend: 0,
    backend: 0,
    fullstack: 0,
    data: 0,
    devops: 0,
    mobile: 0,
    hr: 0,
  };

  Object.keys(topicCounts).forEach((topic) => {
    const count = topicCounts[topic];
    Object.entries(roleKeywords).forEach(([role, keywords]) => {
      if (keywords.some((kw) => topic.includes(kw))) {
        roleScores[role] += count;
      }
    });
  });

  // Find role with highest score
  let maxScore = 0;
  let detectedRole = "backend"; // Default fallback

  Object.entries(roleScores).forEach(([role, score]) => {
    if (score > maxScore) {
      maxScore = score;
      detectedRole = role;
    }
  });

  return detectedRole;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse FormData and validate file
    const formData = await request.formData();
    const file = formData.get("pdf") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No PDF file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF files are allowed." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // 3. Convert to buffer and extract text
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText: string;
    try {
      extractedText = await extractTextFromPdf(buffer);
    } catch {
      return NextResponse.json(
        { error: "Failed to read PDF. The file may be corrupted." },
        { status: 400 }
      );
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from PDF. The file may be scanned or image-based.",
        },
        { status: 400 }
      );
    }

    // 4. Use AI to parse and classify questions
    const prompt = getQuestionClassifierPrompt(extractedText);

    let classifiedJson: string;
    try {
      classifiedJson = await generateCompletion([
        {
          role: "system",
          content:
            "You are an expert at parsing interview questions from text. Always respond with valid JSON only.",
        },
        { role: "user", content: prompt },
      ]);
    } catch (aiError) {
      console.error("AI classification error:", aiError);
      return NextResponse.json(
        { error: "Failed to classify questions. Please try again." },
        { status: 500 }
      );
    }

    // 5. Parse and validate AI response
    let parsedResponse: { questions: Array<{ text: string; difficulty: string; topic: string; expectedTime: number; keywords?: string[] }>; parsingNotes?: string };
    try {
      parsedResponse = JSON.parse(classifiedJson);
      if (
        !parsedResponse.questions ||
        !Array.isArray(parsedResponse.questions)
      ) {
        throw new Error("Invalid response format");
      }
    } catch {
      console.error("JSON parse error");
      return NextResponse.json(
        {
          error: "Failed to parse questions. The PDF format may not be supported.",
        },
        { status: 500 }
      );
    }

    // 6. Validate each question has required fields
    const validatedQuestions: Question[] = parsedResponse.questions
      .filter(
        (q: { text?: string }) => q.text && q.text.trim().length > 10
      )
      .map((q: { text: string; difficulty: string; topic: string; expectedTime: number; keywords?: string[] }, index: number) => ({
        id: index + 1,
        text: q.text.trim(),
        difficulty: (["easy", "medium", "hard"].includes(q.difficulty)
          ? q.difficulty
          : "medium") as "easy" | "medium" | "hard",
        topic: q.topic || "general",
        expectedTime: [60, 90, 120].includes(q.expectedTime)
          ? q.expectedTime
          : 90,
        keywords: Array.isArray(q.keywords) && q.keywords.length > 0
          ? q.keywords.map(k => k.toLowerCase().trim())
          : undefined,
      }));

    if (validatedQuestions.length === 0) {
      return NextResponse.json(
        { error: "No valid questions could be extracted from the PDF." },
        { status: 400 }
      );
    }

    // 7. Auto-detect suggested role based on topics
    const suggestedRole = detectRoleFromQuestions(validatedQuestions);

    return NextResponse.json({
      success: true,
      questions: validatedQuestions,
      totalExtracted: validatedQuestions.length,
      suggestedRole: suggestedRole,
    });
  } catch (error) {
    console.error("PDF parse error:", error);
    return NextResponse.json(
      { error: "Failed to process PDF" },
      { status: 500 }
    );
  }
}
