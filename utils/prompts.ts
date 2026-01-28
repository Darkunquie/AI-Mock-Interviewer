// AI Prompts for Interview System

export interface QuestionGeneratorInput {
  role: string;
  experience: string;
  interviewType: string;
  questionCount: number;
  techStack?: string[];
  mode?: string;
  topics?: string[];
}

export interface AnswerEvaluatorInput {
  question: string;
  answer: string;
  role: string;
  experience: string;
}

export interface SummaryGeneratorInput {
  answers: Array<{
    question: string;
    answer: string;
    technicalScore: number;
    communicationScore: number;
    depthScore: number;
  }>;
  role: string;
}

// Prompt 1: Question Generator
export function getQuestionGeneratorPrompt(input: QuestionGeneratorInput): string {
  const count = input.questionCount;
  const easyCount = Math.max(1, Math.round(count * 0.2));
  const hardCount = Math.max(1, Math.round(count * 0.3));
  const mediumCount = count - easyCount - hardCount;

  // Build example entries for the JSON format
  const examples: string[] = [];
  let id = 1;
  for (let i = 0; i < easyCount; i++, id++) {
    examples.push(`    {"id": ${id}, "text": "question text here", "difficulty": "easy", "topic": "topic name", "expectedTime": 60}`);
  }
  for (let i = 0; i < mediumCount; i++, id++) {
    examples.push(`    {"id": ${id}, "text": "question text here", "difficulty": "medium", "topic": "topic name", "expectedTime": 90}`);
  }
  for (let i = 0; i < hardCount; i++, id++) {
    examples.push(`    {"id": ${id}, "text": "question text here", "difficulty": "hard", "topic": "topic name", "expectedTime": 120}`);
  }

  const isPractice = input.mode === "practice";
  const techStackLine = input.techStack && input.techStack.length > 0
    ? `\n- Tech Stack: ${input.techStack.join(", ")}`
    : "";
  const topicsLine = input.topics && input.topics.length > 0
    ? `\n- Focus Topics: ${input.topics.join(", ")}`
    : "";

  const contextHeader = isPractice
    ? `You are a senior technical mentor conducting a focused practice session.`
    : `You are a senior technical interviewer at a top tech company conducting a ${input.interviewType} interview.`;

  const techStackRule = input.techStack && input.techStack.length > 0
    ? `\n8. Focus questions specifically on these technologies: ${input.techStack.join(", ")}. Ask about real-world usage, best practices, and common patterns for each technology.`
    : "";

  const topicsRule = input.topics && input.topics.length > 0
    ? `\n${input.techStack && input.techStack.length > 0 ? "9" : "8"}. Focus questions specifically on these topics: ${input.topics.join(", ")}. Dive deep into each topic with practical scenarios.`
    : "";

  return `${contextHeader}

Generate exactly ${count} ${isPractice ? "practice" : "interview"} questions for:
- Role: ${input.role}
- Experience Level: ${input.experience} years${isPractice ? "" : `\n- Interview Type: ${input.interviewType}`}${techStackLine}${topicsLine}

Rules:
1. Start with ${easyCount} easy question(s) to warm up, then ${mediumCount} medium difficulty, then ${hardCount} hard questions
2. Be specific to the ${input.role} role (not generic questions)
3. For technical interviews: focus on concepts, problem-solving, and real-world scenarios
4. For HR interviews: focus on behavioral, situational, and cultural fit questions
5. Questions should be clear, concise, and spoken conversationally (this is a voice interview)
6. Each question should take about 1-2 minutes to answer properly
7. Cover diverse topics within the role — avoid repeating the same topic${techStackRule}${topicsRule}

Return ONLY valid JSON in this exact format:
{
  "questions": [
${examples.join(",\n")}
  ]
}`;
}

// Prompt 2: Answer Evaluator
export function getAnswerEvaluatorPrompt(input: AnswerEvaluatorInput): string {
  return `You are an expert interviewer evaluating a candidate's verbal response in a mock interview.

Interview Context:
- Role: ${input.role}
- Experience Level: ${input.experience} years

Question Asked:
"${input.question}"

Candidate's Answer (transcribed from voice):
"${input.answer}"

Evaluate the answer on three dimensions (0-10 scale):

1. Technical Accuracy (0-10):
   - Is the answer factually correct?
   - Are the concepts explained properly?
   - Consider the experience level when scoring

2. Communication (0-10):
   - Was the answer clear and well-structured?
   - Did they explain concepts in an understandable way?
   - Was the response organized logically?

3. Depth (0-10):
   - Did they show deep understanding beyond surface level?
   - Did they provide examples or real-world applications?
   - Did they consider edge cases or alternatives?

Be fair but constructive. Consider their experience level - a fresher won't know as much as a senior developer.

Return ONLY valid JSON in this exact format:
{
  "technicalScore": 7,
  "communicationScore": 8,
  "depthScore": 6,
  "overallScore": 7,
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "idealAnswer": "A comprehensive answer would include... (keep this to 2-3 sentences)",
  "followUpTip": "For your next interview, try to also mention... (1 sentence)",
  "encouragement": "Brief positive note about what they did well (1 sentence)"
}`;
}

// Prompt 3: Interview Summary Generator
export function getSummaryGeneratorPrompt(input: SummaryGeneratorInput): string {
  const answersText = input.answers.map((a, i) =>
    `Question ${i + 1}: "${a.question}"
Answer: "${a.answer}"
Scores - Technical: ${a.technicalScore}/10, Communication: ${a.communicationScore}/10, Depth: ${a.depthScore}/10`
  ).join("\n\n");

  return `You are a career coach analyzing a candidate's mock interview performance.

Role Applied For: ${input.role}

Interview Performance:
${answersText}

Generate a comprehensive interview summary that helps the candidate improve.

Calculate the overall score as a weighted average (Technical: 40%, Communication: 30%, Depth: 30%).

Return ONLY valid JSON in this exact format:
{
  "overallScore": 72,
  "rating": "Good",
  "performanceSummary": "2-3 sentence overview of how they did",
  "strengths": ["top strength 1", "top strength 2", "top strength 3"],
  "weaknesses": ["area to improve 1", "area to improve 2", "area to improve 3"],
  "recommendedTopics": ["topic to study 1", "topic to study 2", "topic to study 3"],
  "actionPlan": "Specific 2-3 sentence advice on what to focus on next",
  "encouragement": "Motivational closing message (1-2 sentences)",
  "readinessLevel": "Not Ready | Almost Ready | Ready | Well Prepared"
}

Rating scale:
- 0-40: Needs Significant Improvement
- 41-60: Needs Improvement
- 61-75: Good
- 76-85: Very Good
- 86-100: Excellent`;
}

// System message for conversational interview style
export const INTERVIEWER_SYSTEM_MESSAGE = `You are a friendly but professional technical interviewer.
You speak in a conversational tone, as this is a voice-based interview.
Keep responses concise since they will be read aloud.
Be encouraging but honest in your feedback.`;
