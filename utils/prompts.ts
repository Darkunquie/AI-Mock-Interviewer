// AI Prompts for Interview System

export interface QuestionGeneratorInput {
  role: string;
  experience: string;
  interviewType: string;
  questionCount: number;
  techStack?: string[];
  mode?: string;
  topics?: string[];
  targetCompany?: string;
  techDeepDive?: {
    technology: string;
    subtopics: string[];
    targetCompany?: string;
  };
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

  // Company-specific question patterns database
  const getCompanyQuestionPatterns = (techStack: string[]): string => {
    const patterns: Record<string, string> = {
      "React": `FAANG companies ask about: React hooks lifecycle, custom hooks, performance optimization (useMemo, useCallback), virtual DOM, reconciliation, state management patterns (Context vs Redux), server-side rendering (Next.js), error boundaries, code splitting.`,
      "Next.js": `Companies ask about: App Router vs Pages Router, Server Components vs Client Components, data fetching patterns (SSR, SSG, ISR), caching strategies, API routes, middleware, deployment on Vercel/AWS.`,
      "Node.js": `Companies ask about: Event loop, streams, clustering, process management, memory leaks, asynchronous patterns (callbacks, promises, async/await), Express.js middleware, error handling, microservices.`,
      "Python": `Companies ask about: GIL (Global Interpreter Lock), decorators, generators, list comprehensions, Django/Flask frameworks, FastAPI, async/await, type hints, pandas for data processing.`,
      "TypeScript": `Companies ask about: Type inference, generics, utility types, strict mode, type guards, interface vs type, any vs unknown, declaration files, type narrowing.`,
      "System Design": `FAANG asks about: Scalability, load balancing, caching (Redis, CDN), database sharding, CAP theorem, microservices, message queues (Kafka, RabbitMQ), rate limiting, API design.`,
      "AWS": `Companies ask about: EC2, S3, Lambda, RDS, DynamoDB, CloudFront, IAM, VPC, auto-scaling, serverless architecture, cost optimization.`,
      "Docker": `Companies ask about: Dockerfile optimization, multi-stage builds, docker-compose, container orchestration (Kubernetes), volumes, networks, security best practices.`,
      "PostgreSQL": `Companies ask about: ACID properties, indexes (B-tree, hash), query optimization, EXPLAIN plans, transactions, normalization, partitioning, replication.`,
      "MongoDB": `Companies ask about: Document model, indexing strategies, aggregation pipeline, sharding, replication, schema design, performance optimization.`,
      "GraphQL": `Companies ask about: Resolvers, schemas, N+1 problem, batching/caching (DataLoader), subscriptions, Apollo vs Relay, REST vs GraphQL trade-offs.`,
      "Redux": `Companies ask about: Actions, reducers, middleware (thunk, saga), selectors, normalization, Redux Toolkit, performance optimization, when not to use Redux.`,
      "Vue.js": `Companies ask about: Composition API vs Options API, reactivity system, lifecycle hooks, Vuex/Pinia, routing, SSR with Nuxt, component communication.`,
      "Angular": `Companies ask about: Dependency injection, RxJS observables, change detection, modules, directives, services, routing, forms (template-driven vs reactive).`,
      "Spring Boot": `Companies ask about: Dependency injection, AOP, Spring Data JPA, REST controllers, security (JWT, OAuth), testing, microservices with Spring Cloud.`,
      "Java": `Companies ask about: OOP principles, collections framework, multithreading, JVM internals, garbage collection, design patterns, streams API, exception handling.`,
      "Go": `Companies ask about: Goroutines, channels, interfaces, error handling, context package, concurrency patterns, memory management, standard library.`,
      "Kubernetes": `Companies ask about: Pods, services, deployments, ingress, config maps, secrets, persistent volumes, helm charts, scaling strategies.`,
      "React Native": `Companies ask about: Native modules, navigation (React Navigation), performance optimization, bridge communication, platform-specific code, state management, offline support.`,
      "Flutter": `Companies ask about: Widgets, state management (Provider, Riverpod, BLoC), navigation, platform channels, performance, build modes, deployment.`,
    };

    return techStack
      .map(tech => patterns[tech])
      .filter(Boolean)
      .join(" ");
  };

  const companyPatterns = input.techStack && input.techStack.length > 0
    ? getCompanyQuestionPatterns(input.techStack)
    : "";

  const techStackRule = input.techStack && input.techStack.length > 0
    ? `\n8. Focus questions specifically on these technologies: ${input.techStack.join(", ")}. Ask about real-world usage, best practices, and common patterns for each technology.

   REAL COMPANY INTERVIEW PATTERNS:
   ${companyPatterns}

   Generate questions that actual companies (Google, Meta, Amazon, Microsoft, Netflix, Uber, Airbnb) ask about these technologies. Focus on:
   - Real-world scenarios they would encounter in production
   - Common gotchas and edge cases
   - Performance optimization and best practices
   - Architecture decisions and trade-offs
   - Questions that separate good candidates from great ones`
    : "";

  const topicsRule = input.topics && input.topics.length > 0
    ? `\n${input.techStack && input.techStack.length > 0 ? "9" : "8"}. Focus questions specifically on these topics: ${input.topics.join(", ")}. Dive deep into each topic with practical scenarios.`
    : "";

  // Tech Deep Dive specific question patterns
  const getTechDeepDivePatterns = (tech: string, company?: string): string => {
    const techPatterns: Record<string, Record<string, string>> = {
      "Python": {
        "Google": "Focus on algorithm implementation in Python, performance optimization, understanding of GIL implications, and large-scale data processing. Ask about generators, decorators, and memory-efficient coding.",
        "Meta": "Emphasize async programming patterns, API development with FastAPI, data pipeline design, and handling billions of records with Python.",
        "Amazon": "Focus on OOP design patterns, exception handling, microservices with Python, and AWS SDK integration (boto3).",
        "Microsoft": "Ask about type hints, static analysis, Azure Functions with Python, and enterprise Python best practices.",
        "Netflix": "Emphasize async I/O, performance profiling, recommendation systems, and data processing at scale.",
        "default": "Cover core Python concepts, OOP, functional programming, async patterns, testing, and real-world application design."
      },
      "Java": {
        "Google": "Deep dive into JVM internals, garbage collection, concurrency patterns, and performance tuning. Focus on algorithm complexity.",
        "Amazon": "Emphasize Spring Boot, microservices architecture, DynamoDB integration, and design patterns.",
        "Microsoft": "Ask about Azure integration, enterprise patterns, and comparison with .NET ecosystem.",
        "Netflix": "Focus on reactive programming (RxJava), resilience patterns, and high-throughput systems.",
        "default": "Cover JVM architecture, collections, multithreading, Spring ecosystem, and enterprise development patterns."
      },
      "React": {
        "Meta": "Deep understanding of React internals, Fiber reconciler, concurrent features, and performance optimization at scale.",
        "Google": "Focus on state management, component design patterns, and integration with large-scale applications.",
        "Netflix": "Emphasize performance optimization, SSR with Next.js, and handling streaming UI updates.",
        "Airbnb": "Ask about component libraries, design systems, accessibility, and user experience patterns.",
        "default": "Cover hooks, state management, performance optimization, testing, and modern React patterns."
      },
      "Node.js": {
        "Netflix": "Focus on streaming, high-throughput APIs, and event-driven architecture.",
        "Uber": "Emphasize real-time systems, low-latency APIs, and microservices communication.",
        "PayPal": "Ask about payment processing, security best practices, and transaction handling.",
        "default": "Cover event loop, streams, clustering, async patterns, Express.js, and production-ready applications."
      },
      "AWS": {
        "Amazon": "Deep dive into service architecture, Well-Architected Framework, cost optimization, and service selection decisions.",
        "Netflix": "Focus on auto-scaling, CDN strategies, and handling millions of concurrent users.",
        "Airbnb": "Emphasize multi-region deployment, disaster recovery, and cost management.",
        "default": "Cover core services (EC2, S3, Lambda, RDS), security (IAM, VPC), and serverless architecture."
      },
      "System Design": {
        "Google": "Focus on distributed systems, consistency models, and scalability to billions of users.",
        "Meta": "Emphasize social graph systems, news feed design, and real-time messaging.",
        "Amazon": "Ask about e-commerce systems, inventory management, and recommendation engines.",
        "Uber": "Focus on real-time location tracking, matching algorithms, and surge pricing systems.",
        "Netflix": "Emphasize video streaming architecture, CDN design, and content recommendation.",
        "default": "Cover scalability, load balancing, caching, databases, microservices, and common system design patterns."
      },
      "DSA": {
        "Google": "Emphasis on optimal solutions, time/space complexity analysis, and elegant algorithm design.",
        "Meta": "Focus on graph problems, dynamic programming, and practical application scenarios.",
        "Amazon": "Ask about real-world problem-solving and trade-off discussions.",
        "default": "Cover arrays, trees, graphs, dynamic programming, sorting, searching, and complexity analysis."
      }
    };

    const techConfig = techPatterns[tech] || techPatterns["default"] || {};
    if (company && techConfig[company]) {
      return techConfig[company];
    }
    return techConfig["default"] || `Focus on core ${tech} concepts, best practices, and real-world application scenarios.`;
  };

  // Company-specific interview patterns
  const getCompanyInterviewStyle = (company?: string): string => {
    if (!company || company === "none") return "";

    const companyPatterns: Record<string, string> = {
      google: `
Google Interview Style:
- Focus on data structures & algorithms (60% of questions)
- System design for senior roles
- Behavioral questions using "Googleyness & Leadership"
- Questions about scalability and optimization
- Common topics: Graph algorithms, dynamic programming, distributed systems
- Example: "Design YouTube's video recommendation system" or "Find the Kth largest element in an unsorted array"`,

      meta: `
Meta (Facebook) Interview Style:
- Strong emphasis on product sense for product roles
- System design with focus on social networks
- Behavioral questions about "Move Fast" culture
- Questions about A/B testing, metrics, and user engagement
- Common topics: Graph traversal, messaging systems, news feed ranking
- Example: "Design Instagram's feed" or "How would you detect fake accounts?"`,

      amazon: `
Amazon Interview Style:
- Heavy focus on Leadership Principles (14 principles)
- STAR method for behavioral questions
- System design with focus on e-commerce and logistics
- Questions about ownership and customer obsession
- Common topics: OOP design, AWS services, microservices
- Example: "Design Amazon's product recommendation engine" or "Tell me about a time you disagreed with your manager"`,

      microsoft: `
Microsoft Interview Style:
- Balanced technical + behavioral assessment
- Questions about Azure and cloud architecture
- Object-oriented design patterns
- Collaborative problem-solving
- Common topics: Trees, recursion, system design, API design
- Example: "Design Outlook's calendar feature" or "Implement an LRU cache"`,

      apple: `
Apple Interview Style:
- Deep technical knowledge in chosen domain
- Questions about performance and user experience
- Hardware/software integration for some roles
- Attention to detail and craftsmanship
- Common topics: Memory management, iOS/macOS specifics, optimization
- Example: "Optimize battery usage for background tasks" or "Design a camera app"`,

      netflix: `
Netflix Interview Style:
- Strong emphasis on culture fit ("Freedom and Responsibility")
- System design for streaming and content delivery
- Questions about A/B testing and data-driven decisions
- Microservices architecture
- Common topics: Video streaming, CDN, recommendation algorithms
- Example: "Design a video streaming service" or "How would you reduce buffering?"`,

      uber: `
Uber Interview Style:
- Real-time systems and location-based services
- Questions about maps, routing, and geospatial data
- System design for high-availability services
- Scalability and low-latency requirements
- Common topics: Graph algorithms (shortest path), distributed systems, real-time tracking
- Example: "Design Uber's ride matching system" or "Calculate ETA for a trip"`,

      airbnb: `
Airbnb Interview Style:
- Strong cultural fit assessment ("Belong Anywhere")
- Product sense and user empathy
- Cross-functional collaboration
- System design for marketplace platforms
- Common topics: Search and ranking, trust & safety, payments
- Example: "Design Airbnb's search feature" or "How would you handle booking conflicts?"`,

      stripe: `
Stripe Interview Style:
- Deep focus on API design and developer experience
- Payment systems and financial infrastructure
- Questions about reliability and fault tolerance
- Security and compliance
- Common topics: Distributed transactions, idempotency, webhooks
- Example: "Design a payment processing system" or "Ensure exactly-once payment processing"`,

      twitter: `
Twitter/X Interview Style:
- Real-time data processing at scale
- System design for social media features
- Questions about feed ranking and content moderation
- High-throughput, low-latency systems
- Common topics: Timeline generation, trending topics, rate limiting
- Example: "Design Twitter's trending topics" or "Scale the home timeline to 500M users"`,
    };

    return companyPatterns[company] || "";
  };

  const companyStyleGuide = getCompanyInterviewStyle(input.targetCompany);
  const companyRule = companyStyleGuide
    ? `\n\nCOMPANY-SPECIFIC INTERVIEW STYLE:${companyStyleGuide}

Generate questions that match this company's interview pattern and difficulty level. Include their specific topics and question styles.`
    : "";

  // Tech Deep Dive mode - technology-focused questions
  if (input.techDeepDive) {
    const { technology, subtopics, targetCompany } = input.techDeepDive;
    const techPattern = getTechDeepDivePatterns(technology, targetCompany);
    const companyStyle = targetCompany ? getCompanyInterviewStyle(targetCompany.toLowerCase()) : "";

    return `You are a senior technical expert conducting an in-depth interview focused specifically on ${technology}.

Generate exactly ${count} interview questions for:
- Technology: ${technology}
- Subtopics to cover: ${subtopics.join(", ")}
- Candidate Experience: ${input.experience} years
${targetCompany ? `- Target Company: ${targetCompany}` : ""}

TECHNOLOGY FOCUS GUIDE:
${techPattern}
${companyStyle ? `\nCOMPANY-SPECIFIC STYLE:${companyStyle}` : ""}

CRITICAL RULES - MUST FOLLOW:
1. Generate ${easyCount} easy question(s), ${mediumCount} medium, and ${hardCount} hard questions
2. Questions MUST be specifically about ${technology} - not generic programming questions
3. **IMPORTANT: Generate questions ONLY about these EXACT subtopics: ${subtopics.join(", ")}**
4. **DO NOT ask questions about ANY topics outside the above list**
5. **Every single question MUST directly relate to one of the selected subtopics**
6. If only one subtopic is selected, ALL questions must be about that single subtopic
7. Ask about real-world scenarios, best practices, and production challenges for these specific subtopics ONLY
8. Include questions that top tech companies actually ask about these specific areas
9. For hard questions: ask about internals, edge cases, optimization within these subtopics ONLY
10. Each question should feel like it comes from a senior engineer focused on these specific topics
${targetCompany ? `11. Style questions to match ${targetCompany}'s interview patterns` : ""}

Question Types (all must be about the selected subtopics: ${subtopics.join(", ")}):
- Conceptual: "Explain how X works..." (where X is from selected subtopics)
- Practical: "How would you implement X..." (where X is from selected subtopics)
- Debugging: "What could cause X issue..." (where X is from selected subtopics)
- Design: "How would you architect X..." (where X is from selected subtopics)
- Best Practices: "What are the best practices for X..." (where X is from selected subtopics)

REMEMBER: If the subtopic is "${subtopics[0]}", ALL questions must be about "${subtopics[0]}" specifically.

Return ONLY valid JSON in this exact format:
{
  "questions": [
${examples.join(",\n")}
  ]
}`;
  }

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
7. Cover diverse topics within the role — avoid repeating the same topic${techStackRule}${topicsRule}${companyRule}

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

// Prompt 4: PDF Question Classifier
export function getQuestionClassifierPrompt(rawText: string): string {
  // Truncate if too long to fit in context
  const maxLength = 8000;
  const truncatedText =
    rawText.length > maxLength
      ? rawText.substring(0, maxLength) + "...[truncated]"
      : rawText;

  return `You are an expert at parsing interview questions from text documents.

Given the following text extracted from a PDF document, identify and extract all interview questions.

TEXT FROM PDF:
"""
${truncatedText}
"""

INSTRUCTIONS:
1. Identify each distinct interview question in the text
2. Questions may be:
   - Numbered (1., 2., 3. or 1), 2), 3))
   - Bulleted (-, *, bullet points)
   - Plain text separated by line breaks
   - Part of a sentence that ends with a question mark
3. For each question, determine:
   - difficulty: "easy" (factual, recall-based), "medium" (requires explanation), or "hard" (requires deep analysis, system design, or complex problem-solving)
   - topic: A short category (e.g., "algorithms", "system-design", "behavioral", "databases", "react", "python", etc.)
   - expectedTime: 60 (easy questions), 90 (medium questions), or 120 (hard questions) seconds
   - keywords: IMPORTANT - Extract keywords in this order of priority:
     a) If the PDF contains "Keywords:", "Key terms:", "Answer key:", or similar sections near the question, extract those exact keywords
     b) If the PDF contains an "Answer:" section after the question, extract 3-7 main concepts from that answer
     c) Otherwise, generate 3-7 key concepts/terms that should appear in a good answer based on the question itself

4. EXTRACT BUT DON'T INCLUDE IN QUESTION TEXT:
   - Keywords/Key terms listed near questions (use for the keywords array)
   - Answers provided after questions (extract keywords from them)
   - Expected concepts or topics to cover (use for keywords array)

5. IGNORE:
   - Headers, footers, page numbers
   - Instructions or metadata
   - Empty or incomplete questions
   - Text that is clearly not a question

6. Clean up each question:
   - Remove numbering/bullets from the beginning
   - Fix any OCR errors if obvious
   - Ensure the question makes sense as a standalone item
   - Do NOT include answer text or keywords in the question text itself

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "text": "The full question text here",
      "difficulty": "easy",
      "topic": "topic-name",
      "expectedTime": 60,
      "keywords": ["keyword1", "keyword2", "keyword3"]
    }
  ],
  "parsingNotes": "Any issues or notes about the extraction process"
}

If no valid questions can be found, return:
{
  "questions": [],
  "parsingNotes": "Reason why no questions were found"
}`;
}
