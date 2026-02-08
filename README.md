# AI Mock Interview Platform

An AI-powered interview preparation platform that helps candidates practice technical interviews, study with flashcards, and track their progress across 100+ technology courses.

## Features

### Interview Practice
- **AI-Powered Interviews**: Real-time AI interviewer with voice interaction
- **Role-Based Practice**: 50+ interview roles (Frontend, Backend, DevOps, Data Science, etc.)
- **Tech Deep Dive**: Deep-dive sessions on specific technologies
- **Company-Targeted Prep**: Customize preparation for target companies
- **Speech-to-Text**: Groq Whisper integration for accurate voice transcription
- **Text-to-Speech**: Natural voice feedback from AI interviewer

### Flash Cards
- **AI-Generated Cards**: Dynamic flashcard generation for any topic
- **Progress Tracking**: Track correct, incorrect, and skipped cards
- **Session Results**: Detailed accuracy reports after each session

### Learning Paths
- **Structured Curriculum**: Phase-based learning for each role
- **Progress Tracking**: Visual progress indicators
- **Topic Status**: Track completed, in-progress, and pending topics

### Analytics Dashboard
- **Interview History**: Review past interview sessions
- **Performance Metrics**: Track improvement over time
- **Detailed Feedback**: AI-generated feedback and scores

## Tech Stack

- **Framework**: Next.js 16.1.4 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Custom auth with JWT
- **AI/LLM**: Groq API (Llama models)
- **Speech**: Groq Whisper (STT), Web Speech API (TTS)
- **Icons**: React Icons, Lucide React

## Course Categories

| Category | Courses |
|----------|---------|
| Programming & CS | Python, Java, JavaScript, TypeScript, C++, Go, Rust |
| Frontend | React, Angular, Vue.js, Next.js, HTML/CSS |
| Backend | Node.js, Django, Spring Boot, FastAPI, .NET |
| Cloud & DevOps | AWS, Azure, GCP, Docker, Kubernetes, Terraform |
| Data & AI | Machine Learning, Deep Learning, NLP, Data Engineering |
| Mobile | React Native, Flutter, Swift, Kotlin, Android |
| Database | SQL, PostgreSQL, MongoDB, Redis, Elasticsearch |
| Microsoft | Azure, .NET, SQL Server, Power BI, Dynamics 365 |
| Oracle | Oracle DB, PL/SQL, Oracle Fusion, OCI |
| Emerging Tech | Blockchain, Web3, IoT, Quantum Computing, AR/VR |
| Digital Marketing | SEO, SEM/PPC, Social Media, Content Marketing |
| UI/UX | Figma, Adobe XD, Wireframing, Prototyping |
| Networking | CCNA, VMware, Network Security, Linux Admin |
| Testing | Selenium, Cypress, API Testing |
| Enterprise | SAP, Salesforce, ServiceNow, Guidewire |

## Installation

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Groq API key

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-mock-interview.git
cd ai-mock-interview
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Configure environment variables:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ai_mock_interview

# Authentication
JWT_SECRET=your-jwt-secret
NEXTAUTH_SECRET=your-nextauth-secret

# Groq API
GROQ_API_KEY=your-groq-api-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. Run database migrations:
```bash
npm run db:push
```

6. Start development server:
```bash
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio |

## Project Structure

```
ai-mock-interview/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── interview/     # Interview management
│   │   └── flash-cards/   # Flashcard generation
│   ├── dashboard/         # Dashboard pages
│   │   ├── practice/      # Practice sessions
│   │   ├── flash-cards/   # Flashcard study
│   │   ├── analytics/     # Performance analytics
│   │   └── history/       # Interview history
│   └── interview/         # Live interview page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── TechIcon.tsx      # Technology icons
├── data/                  # Static data
│   └── techStackTopics.ts # Course definitions
├── hooks/                 # Custom React hooks
│   └── useTextToSpeech.ts # TTS hook
├── lib/                   # Utilities
│   ├── db/               # Database config
│   └── validations/      # Zod schemas
├── types/                 # TypeScript types
└── drizzle/              # Database migrations
```

## Deployment

### Vercel (Recommended)
```bash
vercel deploy
```

### VPS/Self-Hosted
```bash
# Build
npm run build

# Start with PM2
pm2 start npm --name "ai-mock-interview" -- start

# Or use the ecosystem file
pm2 start ecosystem.config.js
```

### Environment Variables for Production
Ensure all environment variables are set in your hosting platform.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | User registration |
| `/api/auth/login` | POST | User login |
| `/api/auth/me` | GET | Get current user |
| `/api/interview/create` | POST | Create interview session |
| `/api/interview/history` | GET | Get interview history |
| `/api/interview/analytics` | GET | Get performance analytics |
| `/api/flash-cards/generate` | POST | Generate flashcards |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Groq](https://groq.com/) - AI inference
- [Drizzle ORM](https://orm.drizzle.team/) - Database ORM
