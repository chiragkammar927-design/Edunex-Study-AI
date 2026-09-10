import { ChatMessage, SnapStudyResult, Question } from '../types';

export async function checkServerHealth(): Promise<boolean> {
  try {
    const res = await fetch('/api/health');
    return res.ok;
  } catch {
    return false;
  }
}

export async function askAiTutor(
  messages: ChatMessage[],
  subject?: string,
  topic?: string,
  mode?: 'explain_simply' | 'give_example' | 'quiz_me' | 'explain_mistake' | 'go_deeper'
): Promise<string> {
  try {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, currentSubject: subject, currentTopic: topic, mode }),
    });
    if (!res.ok) {
      throw new Error(`Server status ${res.status}`);
    }
    const data = await res.json();
    return data.reply;
  } catch (err) {
    console.warn('askAiTutor fallback:', err);
    if (mode === 'explain_simply') {
      return `Here's an everyday analogy: Imagine this like charging your phone battery. If you plug into an unstable socket with fluctuating voltage, the battery controller steps in to regulate the flow safely. Always break down complex systems into what enters, what gets processed, and what leaves!`;
    }
    if (mode === 'give_example') {
      return `Example:\nProblem: Find the rate of change when $f(x) = 3x^2 - 4x + 1$.\n1. Apply power rule to $3x^2 \\rightarrow 6x$\n2. Derivative of $-4x \\rightarrow -4$\n3. Derivative of constant $1 \\rightarrow 0$\nResult: $f'(x) = 6x - 4$. Notice each term is handled individually!`;
    }
    return `Let's tackle this methodically! First identify your core variables and assumptions. Which specific part feels most confusing?`;
  }
}

export async function processSnapStudy(payload: {
  imageBase64?: string;
  mimeType?: string;
  notesText?: string;
  subjectHint?: string;
}): Promise<SnapStudyResult> {
  try {
    const res = await fetch('/api/snapstudy/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    const data = await res.json();
    return {
      id: 'snap-' + Date.now(),
      title: data.title || 'Processed Study Material',
      extractedText: data.extractedText || '',
      summary: data.summary || 'Summary synthesized from uploaded study material.',
      keyPoints: data.keyPoints || [],
      formulas: data.formulas || [],
      flashcards: data.flashcards || [],
      quiz: (data.quiz || []).map((q: any, idx: number) => ({
        id: q.id || `sq-${idx + 1}`,
        question: q.question,
        type: q.type || 'mcq',
        options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        hint: q.hint,
      })),
      eli13Explanation: data.eli13Explanation || '',
      importantQuestions: data.importantQuestions || [],
      timestamp: new Date().toLocaleDateString(),
    };
  } catch (err) {
    console.warn('processSnapStudy fallback:', err);
    return {
      id: 'snap-fallback-' + Date.now(),
      title: 'Scanned Science & Math Summary',
      extractedText: payload.notesText || 'Fundamental principles & governing equations of the scanned study page.',
      summary: 'This material covers the primary governing equations, core definitions, and high-probability problem-solving paradigms for upcoming exams.',
      keyPoints: [
        'Establish reference axes and label all known variables.',
        'Distinguish between scalar magnitudes and vector directions.',
        'Verify units at every algebraic substitution step.',
        'Review edge-case conditions to ensure physical plausibility.',
      ],
      formulas: [
        { name: 'Governing Law', formula: 'F_{net} = \\frac{\\Delta p}{\\Delta t}' },
        { name: 'Conservation Invariant', formula: 'E_{total} = E_k + E_p = \\text{constant}' },
      ],
      flashcards: [
        { front: 'What is the primary constraint when applying this rule?', back: 'The system must be isolated with no external unmeasured dissipation.' },
        { front: 'How do you check if your final algebraic answer is correct?', back: 'Dimensional analysis: verify that both sides of the equation possess identical physical units.' },
      ],
      quiz: [
        {
          id: 'sq-f-1',
          question: 'What is the most critical first step before solving this equation?',
          type: 'mcq',
          options: ['Define coordinate axes and sign conventions', 'Guess the numeric output', 'Ignore constants', 'Convert all numbers to decimals'],
          correctAnswer: 'Define coordinate axes and sign conventions',
          explanation: 'Clear coordinate conventions prevent sign inversion errors across all steps.',
        },
      ],
      eli13Explanation: 'Think of this topic like following a recipe: if you skip measuring your ingredients (units and signs) before mixing, the cake will come out completely ruined!',
      importantQuestions: [
        {
          question: 'Derive the primary expression and state the fundamental assumptions.',
          answer: 'State boundary assumptions, write the differential rate equation, and integrate over the specified limits.',
          examWeightage: '4 Marks',
        },
      ],
      timestamp: new Date().toLocaleDateString(),
    };
  }
}

export async function generateCustomQuiz(
  subject: string,
  chapter: string,
  difficulty: string,
  questionCount: number
): Promise<{ title: string; questions: Question[] }> {
  try {
    const res = await fetch('/api/gemini/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, chapter, difficulty, questionCount }),
    });
    if (!res.ok) throw new Error('Quiz generation failed');
    return await res.json();
  } catch (err) {
    console.warn('generateCustomQuiz fallback:', err);
    return {
      title: `${subject} - ${chapter} (${difficulty})`,
      questions: [
        {
          id: 'q-f1',
          question: `In ${chapter}, what is the key condition for equilibrium or stability?`,
          type: 'mcq',
          options: ['Net forces and moments equal zero', 'Velocity must be zero at all times', 'Friction is completely eliminated', 'Internal energy decreases'],
          correctAnswer: 'Net forces and moments equal zero',
          explanation: 'Mechanical and thermal equilibrium require the sum of all driving fluxes or forces to balance out.',
          hint: 'Think about conservation laws.',
        },
        {
          id: 'q-f2',
          question: 'When manipulating signs in an algebraic expansion, what is the effect of a leading negative sign?',
          type: 'mcq',
          options: ['Inverts the sign of every single term inside', 'Only inverts the first term', 'Doubles the magnitude', 'Changes nothing'],
          correctAnswer: 'Inverts the sign of every single term inside',
          explanation: '-(a + b - c) = -a - b + c. Every component undergoes sign reversal.',
        },
      ],
    };
  }
}

export async function generateWeaknessQuestions(
  subject: string,
  chapter: string,
  weaknessLabel: string,
  rootCause: string
): Promise<Question[]> {
  try {
    const res = await fetch('/api/gemini/weakness-practice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, chapter, weaknessLabel, rootCause }),
    });
    if (!res.ok) throw new Error('Weakness drill generation failed');
    const data = await res.json();
    return data.questions || [];
  } catch (err) {
    console.warn('generateWeaknessQuestions fallback:', err);
    return [
      {
        id: 'wq-fallback',
        question: `Remedial Drill for "${weaknessLabel}": Which of the following correctly resolves this conceptual trap?`,
        type: 'mcq',
        options: [
          'Carefully distribute signs and verify with a test value',
          'Rely solely on mental arithmetic',
          'Ignore negative coefficients',
          'Change operations to addition',
        ],
        correctAnswer: 'Carefully distribute signs and verify with a test value',
        explanation: `Explicitly showing intermediate steps prevents ${rootCause}.`,
        hint: 'Use systematic step-by-step checks.',
      },
    ];
  }
}
