export type SubjectType = 'Mathematics' | 'Physics' | 'Chemistry' | 'Biology' | 'Science' | 'Computer Science' | 'History' | 'English';

export type MasteryStatus = 'mastered' | 'revision' | 'revision_needed' | 'weak' | 'not_started';

export interface UserSubscription {
  status: 'free_trial' | 'pro';
  planName: string;
  trialDaysLeft: number;
  trialTotalDays: number;
  trialEndDate: string;
  priceStartingFrom: number; // 99
  currency: string;
  isUpgraded: boolean;
  features: string[];
  phoneNumber?: string; // Upgrade contact and verification phone number
}

export interface StudentProfile {
  name: string;
  avatar: string;
  grade: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  streakDays: number;
  todayStudyMinutes: number;
  todayGoalMinutes: number;
  overallMastery: number; // 0 - 100
  badges: Badge[];
  subscription?: UserSubscription;
  phoneNumber?: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface DailyMission {
  id: string;
  title: string;
  date: string;
  xpReward: number;
  completed: boolean;
  tasks: {
    id: string;
    title: string;
    type: 'practice' | 'flashcards' | 'quiz' | 'reading';
    durationMinutes: number;
    completed: boolean;
    subject: SubjectType;
  }[];
}

export interface WeaknessItem {
  id: string;
  subject: SubjectType;
  chapter: string;
  subtopic: string;
  score: number;
  maxScore: number;
  weaknessLabel: string;
  rootCause: string;
  confidence: 'Low' | 'Medium' | 'Critical';
  recommendedPracticeMinutes: number;
  mistakeFrequency?: number;
  sampleMistake?: string;
  practiceQuestions?: Question[];
}

export interface Question {
  id: string;
  question: string;
  type: 'mcq' | 'true_false' | 'fill_blank' | 'short_answer';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  hint?: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface QuizSession {
  id: string;
  title: string;
  subject: SubjectType;
  chapter: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Exam Drill';
  questions: Question[];
  timeLimitMinutes?: number;
}

export interface QuizResult {
  quizId: string;
  title: string;
  subject: SubjectType;
  totalQuestions: number;
  correctCount: number;
  percentage: number;
  timeSpentSeconds: number;
  weakTopicsIdentified: string[];
  mistakeAnalysis: {
    question: string;
    yourAnswer: string;
    correctAnswer: string;
    whyWrong: string;
    conceptToReview: string;
  }[];
  xpEarned: number;
}

export interface Flashcard {
  id: string;
  subject: SubjectType;
  chapter: string;
  front: string;
  back: string;
  keyPoints?: string[];
  intervalDays: number;
  repetitions: number;
  easeFactor: number;
  nextReviewDate: string; // YYYY-MM-DD
  status: 'revise_today' | 'coming_up' | 'mastered' | 'learning' | 'review';
}

export interface StudyPlanSchedule {
  id: string;
  dayTitle: string;
  date: string;
  targetMinutes: number;
  tasks: {
    id: string;
    title: string;
    subject: SubjectType;
    durationMinutes: number;
    completed: boolean;
    priority: 'high' | 'medium' | 'low';
  }[];
}

export interface StudyPlanDay {
  date: string;
  dayName: string;
  isToday?: boolean;
  totalTargetMinutes: number;
  tasks: StudyPlanTask[];
}

export interface StudyPlanTask {
  id: string;
  timeSlot: string;
  subject: SubjectType;
  chapter: string;
  taskType: 'Learn New' | 'Revision' | 'Quiz' | 'Flashcards' | 'Weakness Drill';
  durationMinutes: number;
  completed: boolean;
  priority: 'High' | 'Medium' | 'Normal';
}

export interface SyllabusChapter {
  id: string;
  subject: SubjectType;
  title: string;
  description: string;
  mastery: MasteryStatus;
  masteryPercentage: number;
  studyHours?: number;
  targetStudyHours?: number;
  quizAccuracy?: number;
  simpleExplanation: string;
  eli13Explanation: string;
  quickRevisionPoints: string[];
  importantFormulas: { name: string; formula: string; explanation: string }[];
  workedExamples: { problem: string; solution: string; steps: string[] }[];
  keyTakeaways: string[];
}

export interface SnapStudyResult {
  id: string;
  title: string;
  extractedText: string;
  summary: string;
  keyPoints: string[];
  formulas: { name: string; formula: string }[];
  flashcards: { front: string; back: string }[];
  quiz: Question[];
  eli13Explanation: string;
  importantQuestions: { question: string; answer: string; examWeightage: string }[];
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  subjectContext?: SubjectType;
  suggestedPrompts?: string[];
  isThinking?: boolean;
}

export interface StudyCircle {
  id: string;
  name: string;
  subject: SubjectType;
  description: string;
  membersCount: number;
  activeNowCount: number;
  streakDays: number;
  weeklyTargetHours: number;
  tags: string[];
  joined: boolean;
  avatarIcon: string;
  hostName: string;
  activeLiveRoom?: boolean;
  recentMessages?: { id: string; sender: string; text: string; time: string; avatar: string }[];
}

export interface LearningChallenge {
  id: string;
  title: string;
  subject: SubjectType;
  description: string;
  rewardXP: number;
  badgeReward: string;
  badgeIcon: string;
  daysRemaining: number;
  participantsCount: number;
  targetCount: number;
  currentCount: number;
  unit: string;
  joined: boolean;
  completed: boolean;
  leaderboard: {
    rank: number;
    name: string;
    avatar: string;
    points: number;
    streak: number;
    isUser?: boolean;
  }[];
}

export interface TeachMeBackEvaluation {
  topic: string;
  subject: SubjectType;
  understandingScore: number; // 0 - 100
  understoodPoints: string[];
  missingDetails: string[];
  misunderstandings: string[];
  coachSummary: string;
  analogyOrFix: string;
  xpEarned: number;
}

export interface BossEntity {
  id: string;
  name: string;
  title: string;
  subject: SubjectType;
  maxHp: number;
  avatar: string;
  element: string;
  description: string;
  rewardXP: number;
  badgeTitle: string;
  questions: {
    id: string;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    damage: number;
  }[];
}

export interface EmergencyRevisionPlan {
  subject: SubjectType;
  hoursRemaining: number;
  targetGrade: string;
  coreFormulas: { name: string; formula: string; whyEssential: string }[];
  guaranteedQuestions: string[];
  skipTopics: string[];
  scheduleBlocks: { time: string; activity: string; focus: string }[];
}

export interface AppNotification {
  id: string;
  type: 'study_block' | 'flashcard_due' | 'streak_warning' | 'achievement';
  title: string;
  message: string;
  timestamp: string; // ISO string
  read: boolean;
  actionType?: 'open_planner' | 'open_memory' | 'quick_micro_recall';
  meta?: {
    subject?: SubjectType;
    taskTitle?: string;
    cardId?: string;
    cardsCount?: number;
    durationMinutes?: number;
    dueCardFront?: string;
    dueCardBack?: string;
    dueCardChapter?: string;
  };
}

export interface NotificationSettings {
  browserPushEnabled: boolean;
  studyBlockAlerts: boolean;
  studyBlockLeadMinutes: number; // 0 (exact time), 5, 10
  flashcardDueAlerts: boolean;
  soundEnabled: boolean;
  alertSound: 'zen-bell' | 'marimba' | 'harp' | 'tibetan-bowl' | 'friendly-chime';
  microRecallPrompt: boolean;
  binauralFocusPrompt: boolean;
}

export interface PathwayNode {
  id: string;
  title: string;
  subject: SubjectType;
  chapterTitle?: string;
  tier: 1 | 2 | 3 | 4; // 1: Foundation, 2: Core, 3: Advanced, 4: Mastery
  masteryPercentage: number;
  status: 'mastered' | 'in_progress' | 'weak' | 'ready' | 'locked';
  prerequisites: string[]; // IDs of required nodes
  estimatedMinutes: number;
  examWeight: 'High' | 'Medium' | 'Foundational';
  description: string;
  keyConcepts: string[];
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface PathwayLink {
  source: string | PathwayNode;
  target: string | PathwayNode;
  type: 'prerequisite' | 'recommended' | 'interdisciplinary';
  description?: string;
}

export interface SnapStudyDraft {
  id: string;
  title: string;
  subject: SubjectType;
  content: string;
  createdAt: string; // ISO String or readable date
  updatedAt?: string;
  tags?: string[];
  priority?: 'high' | 'medium' | 'normal';
}

export interface GroupStudyParticipant {
  id: string;
  name: string;
  avatar: string;
  role: 'host' | 'co-host' | 'attendee';
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  handRaised: boolean;
  speaking: boolean;
  statusActivity: string;
  joinedAt: string;
  studyMinutes: number;
  isUser?: boolean;
}

export interface GroupStudyChatMessage {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  time: string;
  isUser?: boolean;
  isAiCoach?: boolean;
  messageType?: 'text' | 'question' | 'formula' | 'poll' | 'system';
  pollData?: {
    id: string;
    question: string;
    options: { id: number; text: string; votes: number }[];
    totalVotes: number;
    userVote?: number;
  };
  reactionCount?: { emoji: string; count: number }[];
}

export interface GroupStudyRoomData {
  id: string;
  circleId?: string;
  title: string;
  subject: SubjectType;
  topic: string;
  hostName: string;
  roomCode: string;
  activeLiveCount: number;
  isLocked?: boolean;
  targetGoalMinutes: number;
  participants: GroupStudyParticipant[];
  messages: GroupStudyChatMessage[];
  sharedNotes?: string;
  currentSlideIndex?: number;
}

export interface AttendanceRecord {
  id: string;
  roomTitle: string;
  subject: SubjectType;
  date: string;
  durationMinutes: number;
  xpEarned: number;
  verified: boolean;
}

export type VideoVisualStyle = 'chalkboard' | 'modern_infographic' | 'simulation_lab' | 'avatar_professor' | 'dark_neon';
export type VideoVoiceTone = 'energetic_mentor' | 'calm_professor' | 'eli13_simple' | 'exam_drill_coach';

export interface VideoStudyNote {
  id: string;
  timestampSec: number;
  timestampFormatted: string;
  text: string;
  tag: 'important' | 'question' | 'formula' | 'summary';
  createdAt: string;
}

export interface AiVideoScene {
  id: string;
  sceneNumber: number;
  timestampSec: number;
  durationSec: number;
  title: string;
  narration: string;
  visualLayout: 'split_screen' | 'chalkboard' | 'diagram_focus' | 'step_by_step' | 'formula_derivation' | 'comparison' | 'interactive_simulation';
  visualData: {
    mainHeading: string;
    subheading?: string;
    bulletPoints: string[];
    formulaLatex?: string[];
    diagramType?: 'physics_motion' | 'chemical_reaction' | 'math_curve' | 'biology_cell' | 'flowchart' | 'timeline' | 'code_snippet' | 'geometry';
    diagramConfig?: {
      curveType?: string;
      physicsPreset?: 'projectile' | 'pendulum' | 'rocket' | 'spring';
      chemPreset?: 'combustion' | 'acid_base' | 'catalyst';
      bioPreset?: 'dna_helix' | 'mitosis' | 'cell_membrane';
      steps?: string[];
    };
    highlightCallout?: string;
    avatarExpression?: 'explaining' | 'excited' | 'thinking' | 'pointing' | 'caution';
  };
  checkpointQuiz?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface AiVideoLesson {
  id: string;
  title: string;
  subject: SubjectType;
  topic: string;
  difficulty: 'Beginner / Middle' | 'High School / AP' | 'College / Advanced' | 'ELI13 Intuition';
  targetAudience: string;
  durationMinutes: number;
  thumbnailIcon: string;
  category: string;
  visualStyle: VideoVisualStyle;
  voiceTone: VideoVoiceTone;
  scenes: AiVideoScene[];
  keyTakeaways: string[];
  flashcards: { front: string; back: string }[];
  examTip: string;
  createdDate: string;
  viewsCount: number;
  likesCount: number;
  isSaved?: boolean;
  isCustomGenerated?: boolean;
}


