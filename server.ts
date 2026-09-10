import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// Lazy initialization of Gemini client
let genAiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!genAiClient) {
    genAiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAiClient;
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), hasGeminiKey: !!process.env.GEMINI_API_KEY });
});

// AI Study Coach endpoint
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, currentSubject, currentTopic, mode } = req.body;
    const client = getGeminiClient();

    let systemInstruction = `You are "NEXORA AI Tutor", an encouraging, brilliant personal learning companion for students.
Your goal is to help students truly master concepts, identify misunderstandings, build confidence, and prepare for exams.
Current Subject context: ${currentSubject || 'General STEM / Academics'}.
Current Topic context: ${currentTopic || 'General Study'}.

Style guidelines:
- Be clear, supportive, and pedagogically sound.
- Use analogies and bullet points where helpful.
- Format equations clearly in LaTeX-style or readable text.
- If asked to explain simply (ELI13), use real-world metaphors a 13-year-old would immediately relate to.
- If asked to quiz, ask 1 sharp conceptual question and wait for the student's answer.
- Always end with a motivating thought or follow-up check question.`;

    if (mode === 'explain_simply') {
      systemInstruction += '\nUser requested "Explain Simply (ELI13)". Focus purely on simple, vivid metaphors and zero unnecessary jargon.';
    } else if (mode === 'give_example') {
      systemInstruction += '\nUser requested "Give an Example". Provide 2 realistic, step-by-step worked practical examples.';
    } else if (mode === 'quiz_me') {
      systemInstruction += '\nUser requested "Quiz Me". Provide 1 high-yield conceptual question with 4 options (A, B, C, D) to test comprehension.';
    } else if (mode === 'explain_mistake') {
      systemInstruction += '\nUser requested "Explain My Mistake". Diagnose the cognitive root cause of common pitfalls in this topic and how to avoid them.';
    } else if (mode === 'go_deeper') {
      systemInstruction += '\nUser requested "Go Deeper". Explain underlying first principles, derivations, and advanced exam edge cases.';
    } else if (mode === 'study_summary_feedback') {
      systemInstruction += '\nUser dictated a verbal study summary. Evaluate their verbal recap: 1) Give an accuracy & retention score (e.g., 92/100), 2) List key strengths they recalled well, 3) Identify any missing nuances or subtle misconceptions, and 4) Provide a 3-bullet high-yield exam checklist.';
    }

    if (!client) {
      // High-quality smart simulation if API key is not configured in preview
      const lastUserMsg = messages && messages.length > 0 ? messages[messages.length - 1].text : 'Hello';
      let mockReply = `Great question about ${currentTopic || currentSubject || 'this topic'}!\n\n`;
      if (mode === 'explain_simply') {
        mockReply += `Imagine this concept like a conveyor belt in a package factory. Every time an input arrives, it gets stamped and redirected based on exact rules. You don't need to memorize arbitrary steps—just track where each piece is flowing!\n\n💡 **Key Takeaway**: Break the problem down into inputs, transformations, and outputs. What part would you like to explore next?`;
      } else if (mode === 'give_example') {
        mockReply += `Here is a concrete worked example:\n\n**Problem**: A system starts with an initial state $S_0$ and doubles every 3 time steps.\n1. At step 3: $2 \\times S_0$\n2. At step 6: $4 \\times S_0$\n\nNotice how the growth curve is exponential rather than linear! Would you like to try one with varying rates?`;
      } else if (mode === 'study_summary_feedback') {
        mockReply = `🎙️ **Verbal Study Summary Evaluation** for *${currentTopic || currentSubject || 'Study Topic'}*\n\n🎯 **Conceptual Retention Score**: 92 / 100 (Excellent Recall!)\n\n✅ **Key Concepts Captured Accurately:**\n• Correctly stated the primary governing relationship and fundamental definitions.\n• Articulated cause-and-effect mechanisms smoothly without hesitation.\n\n🔍 **Missing Nuance / Refinement:**\n• Make sure to specify the boundary conditions (e.g. constant temperature, isolated system, or positive real numbers).\n• Remember that in multi-step problems, dimensional analysis should be performed at each stage.\n\n📋 **3-Bullet Exam Mastery Checklist:**\n1. State assumptions before applying main formulas.\n2. Watch out for unit conversions.\n3. Verify the limiting behavior when variables approach zero or infinity.\n\nWould you like me to generate 2 practice questions to lock this in?`;
      } else {
        mockReply += `Here is the essential intuition:\n1. **Core Concept**: Always establish reference coordinates and identify known quantities before applying equations.\n2. **Common Trap**: Watch out for sign conventions and unit conversions (like grams to kilograms or minutes to seconds).\n3. **Pro-Tip**: Test boundary conditions (e.g. what happens when $x = 0$ or $t \\rightarrow \\infty$?).\n\nHow can I help you take this one step further?`;
      }
      return res.json({ reply: mockReply });
    }

    // Format conversation history for Gemini
    const contents: Array<{ role?: string; parts: Array<{ text: string }> }> = [];
    if (messages && Array.isArray(messages)) {
      for (const msg of messages) {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        });
      }
    }

    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents.length > 0 ? contents : [{ role: 'user', parts: [{ text: 'Hello! How can you help me study today?' }] }],
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || 'I am ready to help you learn! What topic shall we tackle?';
    return res.json({ reply });
  } catch (error) {
    console.error('Error in /api/gemini/chat:', error);
    return res.status(500).json({ error: 'Failed to generate tutor response', details: String(error) });
  }
});

// SnapStudy: Process image or notes with Gemini Vision / OCR
app.post('/api/snapstudy/process', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', notesText, mode = 'all', subjectHint } = req.body;
    const client = getGeminiClient();

    const promptText = `You are NEXORA's advanced SnapStudy OCR & Knowledge Synthesizer.
Analyze the provided study document/image/handwritten notes carefully.
Subject context: ${subjectHint || 'Academic STEM/General'}.

Extract, transcribe, and structure the content into JSON according to this exact JSON schema:
{
  "title": "A concise, descriptive title for this note",
  "extractedText": "Clean OCR transcription of the core text from the notes/image",
  "summary": "Clear, high-yield academic summary in 2-3 paragraphs",
  "keyPoints": ["Bullet point 1", "Bullet point 2", "Bullet point 3", "Bullet point 4", "Bullet point 5"],
  "formulas": [
    {"name": "Formula Name", "formula": "LaTeX formula or equation notation"}
  ],
  "flashcards": [
    {"front": "High-yield testable question or concept prompt", "back": "Comprehensive answer with key rationale"}
  ],
  "quiz": [
    {
      "id": "q1",
      "question": "Clear multiple-choice question testing understanding of this note",
      "type": "mcq",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Why this answer is correct based on the notes",
      "hint": "Helpful conceptual clue"
    }
  ],
  "eli13Explanation": "Vivid, intuitive 'Explain Like I'm 13' analogy explaining the heart of this note without jargon.",
  "importantQuestions": [
    {
      "question": "Expected high-probability exam question",
      "answer": "Model answer points",
      "examWeightage": "5 Marks / Long Answer"
    }
  ]
}

Return ONLY valid JSON. Provide at least 4 flashcards, 3 quiz questions, and 3 key formulas (if applicable).`;

    if (!client) {
      // Realistic simulation for SnapStudy when offline or in preview without key
      const mockResult = {
        title: notesText ? 'Synthesized Study Notes' : 'Faraday’s Law & Electromagnetic Induction (Scanned Note)',
        extractedText: notesText || `Magnetic Flux: Φ = B · A · cos(θ). Unit: Weber (Wb).\nFaraday's Law of Induction: Induced electromotive force ε = -N * (dΦ / dt).\nLenz's Law: The direction of the induced current opposes the change in magnetic flux that produced it.\nMotional EMF: ε = B · L · v for a conductor sliding in magnetic field B.`,
        summary: `This note presents the core mechanics of electromagnetic induction established by Michael Faraday and Heinrich Lenz. When a conductor experiences a changing magnetic flux, an electromotive force (voltage) is generated. The rate of change of magnetic flux governs the magnitude of voltage, while Lenz's conservation of energy rule dictates that induced currents resist the external physical change that created them.`,
        keyPoints: [
          'Magnetic flux measures total magnetic field lines passing through a specified area: Φ = B A cos(θ).',
          'Faraday’s Law specifies that emf magnitude is directly proportional to rate of change of magnetic flux: ε = -N (dΦ/dt).',
          'Lenz’s law explains the negative sign: nature opposes changes in magnetic flux to uphold energy conservation.',
          'Motional EMF arises when a conductor moves through a perpendicular magnetic field: ε = B L v.',
          'Common pitfall: The angle θ must be measured relative to the normal vector of the surface, not the surface plane.',
        ],
        formulas: [
          { name: 'Magnetic Flux', formula: '\\Phi = B \\cdot A \\cdot \\cos(\\theta)' },
          { name: 'Faraday’s Law', formula: '\\varepsilon = -N \\frac{d\\Phi}{dt}' },
          { name: 'Motional EMF', formula: '\\varepsilon = B \\cdot L \\cdot v' },
        ],
        flashcards: [
          {
            front: 'What does the negative sign signify in Faraday’s Law ε = -N (dΦ / dt)?',
            back: 'It reflects Lenz’s Law, which states that the induced current generates a magnetic field that opposes the original change in magnetic flux.',
          },
          {
            front: 'What is the SI unit of magnetic flux (Φ)?',
            back: 'The Weber (Wb), which is equivalent to Tesla-meters squared (T·m²).',
          },
          {
            front: 'Under what condition is motional EMF maximized for a rod of length L moving at speed v in field B?',
            back: 'When the rod’s length, its velocity vector, and the magnetic field vector are mutually perpendicular to one another.',
          },
          {
            front: 'How can you induce an EMF without moving a loop of wire?',
            back: 'By varying the strength of the external magnetic field over time, or by rotating the loop to change the effective angle θ.',
          },
        ],
        quiz: [
          {
            id: 'sq-1',
            question: 'If the magnetic flux through a 100-turn coil changes from 0.05 Wb to 0.01 Wb in 0.2 seconds, what is the magnitude of the induced EMF?',
            type: 'mcq',
            options: ['20 V', '2 V', '200 V', '0.2 V'],
            correctAnswer: '20 V',
            explanation: 'ΔΦ = 0.01 - 0.05 = -0.04 Wb. Emf = -N (ΔΦ / Δt) = -100 * (-0.04 / 0.2) = -100 * (-0.2) = +20 V.',
            hint: 'Divide the change in flux by time, then multiply by the number of turns.',
          },
          {
            id: 'sq-2',
            question: 'According to Lenz’s Law, if a bar magnet’s North pole is pushed towards a stationary conductive copper ring, what pole is induced on the near face of the ring?',
            type: 'mcq',
            options: ['North Pole (repelling)', 'South Pole (attracting)', 'No pole', 'Both simultaneously'],
            correctAnswer: 'North Pole (repelling)',
            explanation: 'Lenz’s law dictates that the ring must oppose the increasing North flux approaching it, so it produces a North pole face to repel the magnet.',
            hint: 'The induced field always opposes the incoming flux increase.',
          },
          {
            id: 'sq-3',
            question: 'True or False: If a closed loop rotates in a uniform magnetic field at constant angular velocity, the induced EMF is constant.',
            type: 'true_false',
            options: ['True', 'False'],
            correctAnswer: 'False',
            explanation: 'As the loop rotates, Φ(t) = B A cos(ωt). The derivative dΦ/dt = -B A ω sin(ωt), which generates an alternating (sinusoidal) AC EMF, not a constant DC voltage.',
            hint: 'Consider the time derivative of cos(ωt).',
          },
        ],
        eli13Explanation: `Think of magnetic flux like the wind blowing through an open window. If someone suddenly slams the window shut or a massive gust blows in, Lenz's law is like a stubborn doorstop that pushes back with equal stubbornness to keep things just the way they were! The faster the change happens, the harder it pushes back.`,
        importantQuestions: [
          {
            question: 'State Faraday’s Law of Electromagnetic Induction and derive the expression for motional EMF in a sliding rod.',
            answer: 'Define Faraday’s law with equation ε = -dΦ/dt. Set up rod of length L moving with speed v across distance dx in time dt. Area swept dA = L dx. Flux dΦ = B dA = B L v dt. Hence ε = dΦ/dt = B L v.',
            examWeightage: '5 Marks (Board / Exam Essential)',
          },
        ],
      };
      return res.json(mockResult);
    }

    let contentsPayload: any;
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
      contentsPayload = {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          { text: promptText },
        ],
      };
    } else {
      contentsPayload = {
        parts: [
          { text: `Student's Handwritten Notes / Text:\n${notesText}\n\n${promptText}` },
        ],
      };
    }

    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contentsPayload,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    const parsed = JSON.parse(responseText);
    return res.json(parsed);
  } catch (error) {
    console.error('Error in /api/snapstudy/process:', error);
    return res.status(500).json({ error: 'SnapStudy processing failed', details: String(error) });
  }
});

// Dynamic Quiz Generation endpoint
app.post('/api/gemini/quiz', async (req, res) => {
  try {
    const { subject, chapter, difficulty = 'Medium', questionCount = 5 } = req.body;
    const client = getGeminiClient();

    const prompt = `Generate an intelligent academic quiz for:
Subject: ${subject}
Chapter/Topic: ${chapter}
Difficulty: ${difficulty}
Number of questions: ${questionCount}

Return JSON with this schema:
{
  "title": "${subject} - ${chapter} (${difficulty})",
  "questions": [
    {
      "id": "q_1",
      "question": "Question prompt",
      "type": "mcq",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Clear educational explanation of why Option A is correct and why other distractors are wrong",
      "hint": "Subtle clue"
    }
  ]
}
Include conceptual questions that identify whether the student has genuine understanding or misconceptions.`;

    if (!client) {
      return res.json({
        title: `${subject} - ${chapter} (${difficulty})`,
        questions: [
          {
            id: 'q1',
            question: `In ${chapter}, which of the following is the fundamental governing principle?`,
            type: 'mcq',
            options: ['Conservation of energy and equilibrium', 'Random thermal fluctuation', 'Static friction limits', 'Linear proportionality only'],
            correctAnswer: 'Conservation of energy and equilibrium',
            explanation: 'Underlying thermodynamics and dynamics require conservation laws to hold invariant across all interactions.',
            hint: 'Think about physical invariants.',
          },
          {
            id: 'q2',
            question: `What is the most frequent student misconception regarding ${chapter}?`,
            type: 'mcq',
            options: ['Assuming scalar addition when vector components are required', 'Ignoring dimensional consistency', 'Forgetting initial conditions', 'All of the above'],
            correctAnswer: 'All of the above',
            explanation: 'Students frequently neglect directionality, unit scaling, and boundary constraints in real exam problems.',
            hint: 'Consider multiple common problem-solving traps.',
          },
        ],
      });
    }

    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error) {
    console.error('Error generating quiz:', error);
    return res.status(500).json({ error: 'Failed to generate quiz', details: String(error) });
  }
});

// Dynamic Weakness Practice Question Generator
app.post('/api/gemini/weakness-practice', async (req, res) => {
  try {
    const { subject, chapter, weaknessLabel, rootCause } = req.body;
    const client = getGeminiClient();

    const prompt = `A student has a diagnosed cognitive weakness in ${subject} -> ${chapter}:
Weakness: "${weaknessLabel}"
Root Cause: "${rootCause}"

Generate 3 targeted, progressive practice questions specifically engineered to test and fix this exact misconception.
Question 1 should be a guided foundational diagnostic.
Question 2 should test sign/concept trap avoidance.
Question 3 should be a confident exam-style verification.

Return JSON schema:
{
  "questions": [
    {
      "id": "wp_1",
      "question": "Question text",
      "type": "mcq",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Detailed step-by-step resolution showing how to avoid the root cause trap",
      "hint": "Targeted hint addressing the root cause"
    }
  ]
}`;

    if (!client) {
      return res.json({
        questions: [
          {
            id: 'wp_fallback_1',
            question: `Diagnostic Drill for ${weaknessLabel}: Which step correctly prevents the error "${rootCause}"?`,
            type: 'mcq',
            options: [
              'Explicitly parenthesize expressions before distributing minus signs or coefficients',
              'Skip writing steps and compute mentally to avoid confusion',
              'Invert all operators before resolving variables',
              'Set all constants to zero before solving',
            ],
            correctAnswer: 'Explicitly parenthesize expressions before distributing minus signs or coefficients',
            explanation: 'Writing intermediate parentheses ensures every inner term receives the proper sign transformation.',
            hint: 'Focus on clear mechanical scaffolding.',
          },
        ],
      });
    }

    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error) {
    console.error('Error generating weakness questions:', error);
    return res.status(500).json({ error: 'Failed to generate weakness drill', details: String(error) });
  }
});

// AI Video Lesson Generator for Students endpoint
app.post('/api/gemini/generate-video-lesson', async (req, res) => {
  try {
    const {
      topic,
      subject = 'Mathematics',
      difficulty = 'High School / AP',
      visualStyle = 'modern_infographic',
      voiceTone = 'energetic_mentor',
      durationMinutes = 3,
      sourceNotes = '',
    } = req.body;

    const client = getGeminiClient();

    const systemPrompt = `You are NEXORA AI Video Director & Master Educator.
Generate a structured, engaging, multi-scene educational animated video lesson script for students.
Topic: "${topic}"
Subject: ${subject}
Difficulty / Level: ${difficulty}
Visual Style: ${visualStyle}
Voice Tone: ${voiceTone}
Estimated Duration: ${durationMinutes} minutes
Optional Source Notes / Context: ${sourceNotes || 'None provided'}

Generate a comprehensive JSON object adhering strictly to this schema:
{
  "title": "Clear, compelling video title (e.g., 'Visual Proof: Why Quadratic Formula Works')",
  "subject": "${subject}",
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "targetAudience": "Target student level (e.g. AP Physics, High School Algebra, College Bio)",
  "durationMinutes": ${durationMinutes},
  "thumbnailIcon": "Emoji icon matching subject",
  "category": "Curriculum category (e.g. Mechanics, Calculus, Cell Biology)",
  "visualStyle": "${visualStyle}",
  "voiceTone": "${voiceTone}",
  "examTip": "A high-yield test strategy or common pitfall to avoid for exams",
  "keyTakeaways": [
    "Takeaway 1: core intuition",
    "Takeaway 2: key formula or rule",
    "Takeaway 3: practical application"
  ],
  "flashcards": [
    {"front": "High-yield concept question", "back": "Clear concise answer"},
    {"front": "Key formula / definition", "back": "Detailed definition with context"},
    {"front": "Common exam trap question", "back": "Explanation of correct approach"}
  ],
  "scenes": [
    {
      "id": "scene-1",
      "sceneNumber": 1,
      "timestampSec": 0,
      "durationSec": 40,
      "title": "Scene 1: Introduction & Intuitive Hook",
      "narration": "Vivid, friendly, spoken voiceover script that speaks directly to the student explaining the core idea clearly.",
      "visualLayout": "chalkboard",
      "visualData": {
        "mainHeading": "Concept Introduction",
        "subheading": "The Core Question / Motivation",
        "bulletPoints": [
          "Clear point 1",
          "Clear point 2",
          "Clear point 3"
        ],
        "formulaLatex": ["Key equation in standard notation if applicable"],
        "diagramType": "math_curve",
        "diagramConfig": {"curveType": "parabola_roots"},
        "highlightCallout": "Memorable insight or intuition",
        "avatarExpression": "explaining"
      }
    },
    {
      "id": "scene-2",
      "sceneNumber": 2,
      "timestampSec": 40,
      "durationSec": 50,
      "title": "Scene 2: Core Mechanism & Step-by-Step Breakdown",
      "narration": "Engaging step-by-step breakdown with analogies and worked examples.",
      "visualLayout": "step_by_step",
      "visualData": {
        "mainHeading": "Step-by-Step Resolution",
        "subheading": "Working Through the Core Principles",
        "bulletPoints": [
          "Step 1: Foundational setup",
          "Step 2: Key transformation or mechanism",
          "Step 3: Derivation or synthesis"
        ],
        "formulaLatex": ["Detailed formula step"],
        "diagramType": "flowchart",
        "highlightCallout": "Watch out for common pitfalls here!",
        "avatarExpression": "excited"
      },
      "checkpointQuiz": {
        "question": "A sharp conceptual question testing what was just taught in this scene",
        "options": ["Option A (Correct)", "Option B", "Option C", "Option D"],
        "correctIndex": 0,
        "explanation": "Clear explanation of why this answer is correct"
      }
    },
    {
      "id": "scene-3",
      "sceneNumber": 3,
      "timestampSec": 90,
      "durationSec": 40,
      "title": "Scene 3: Real-World Applications & Exam Mastery",
      "narration": "Connecting the theory to practical real-world applications and exam tips.",
      "visualLayout": "split_screen",
      "visualData": {
        "mainHeading": "Practical Impact & Exam Takeaways",
        "subheading": "Locking in Long-Term Mastery",
        "bulletPoints": [
          "Real-world application 1",
          "Real-world application 2",
          "Exam checklist summary"
        ],
        "highlightCallout": "Key test day memory anchor!",
        "avatarExpression": "pointing"
      }
    }
  ]
}

Ensure diagramType is one of: 'physics_motion', 'chemical_reaction', 'math_curve', 'biology_cell', 'flowchart', 'timeline', 'code_snippet', 'geometry'.
Ensure visualLayout is one of: 'split_screen', 'chalkboard', 'diagram_focus', 'step_by_step', 'formula_derivation', 'interactive_simulation'.
Ensure avatarExpression is one of: 'explaining', 'excited', 'thinking', 'pointing', 'caution'.
Return ONLY valid JSON.`;

    if (!client) {
      // High-quality smart simulation for fallback
      const generatedId = `video-custom-${Date.now()}`;
      const mockVideo = {
        id: generatedId,
        title: `Visual Mastery: ${topic || 'Key Concepts'} Explained Simply`,
        subject: subject,
        topic: topic || 'Core Topic Overview',
        difficulty: difficulty,
        targetAudience: `${difficulty} students preparing for exams`,
        durationMinutes: durationMinutes || 3,
        thumbnailIcon: subject === 'Mathematics' ? '📐' : subject === 'Physics' ? '⚡' : subject === 'Chemistry' ? '🧪' : subject === 'Biology' ? '🧬' : '💡',
        category: `${subject} Core Curriculum`,
        visualStyle: visualStyle,
        voiceTone: voiceTone,
        viewsCount: 1,
        likesCount: 1,
        createdDate: 'Just now',
        isSaved: true,
        isCustomGenerated: true,
        examTip: `For ${topic || 'this topic'}, always verify boundary conditions, dimensional units, and initial assumptions before solving.`,
        keyTakeaways: [
          `Fundamental rule: Break ${topic || 'the problem'} down into known inputs and governing relationships.`,
          `Avoid common pitfalls by explicitly checking negative signs and conversion factors.`,
          `Anchor understanding with visual diagrams and physical intuition rather than rote memorization.`,
        ],
        flashcards: [
          {
            front: `What is the core intuition behind ${topic || 'this concept'}?`,
            back: `It represents the fundamental transformation where inputs interact under invariant conservation or mathematical rules.`,
          },
          {
            front: `What is the most common student error in ${topic || 'this area'}?`,
            back: `Failing to account for sign conventions and skipping intermediate algebraic parenthesization.`,
          },
        ],
        scenes: [
          {
            id: 'scene-c1',
            sceneNumber: 1,
            timestampSec: 0,
            durationSec: 40,
            title: `Introduction: Why ${topic || 'This Concept'} Matters`,
            narration: `Welcome! Today we are demystifying ${topic || 'this topic'}. Rather than memorizing endless rules, let us understand the underlying intuition and why this is one of the most powerful concepts in ${subject}.`,
            visualLayout: 'chalkboard',
            visualData: {
              mainHeading: `Intuition Behind ${topic || 'Concept'}`,
              subheading: 'Establishing First Principles',
              bulletPoints: [
                `Define the primary governing equation or definition`,
                `Identify the dependent and independent variables`,
                `Connect theory to an intuitive physical metaphor`,
              ],
              formulaLatex: [`\\text{Core Law: } f(x) = \\sum_{i=1}^n w_i x_i + b`],
              diagramType: subject === 'Mathematics' ? 'math_curve' : subject === 'Physics' ? 'physics_motion' : subject === 'Chemistry' ? 'chemical_reaction' : 'flowchart',
              highlightCallout: 'Mastering the first principles unlocks effortless exam performance!',
              avatarExpression: 'explaining',
            },
          },
          {
            id: 'scene-c2',
            sceneNumber: 2,
            timestampSec: 40,
            durationSec: 50,
            title: `Step-by-Step Deep Dive & Worked Example`,
            narration: `Now let us walk through the exact mechanics step-by-step. Notice how each step logically follows from the previous one. If you keep your variables organized, solving complex problems becomes second nature.`,
            visualLayout: 'step_by_step',
            visualData: {
              mainHeading: 'Step-by-Step Mechanism',
              subheading: 'From Problem Statement to Solution',
              bulletPoints: [
                '1. Identify given parameters and constraints',
                '2. Apply the primary transformation formula',
                '3. Isolate the target variable and simplify',
              ],
              formulaLatex: [`\\Delta E = \\int_{t_1}^{t_2} P(t) \\, dt`],
              diagramType: 'flowchart',
              highlightCallout: 'Pay special attention to intermediate sign changes and unit conversions!',
              avatarExpression: 'excited',
            },
            checkpointQuiz: {
              question: `When applying the governing principles of ${topic || 'this topic'}, what is the critical first step?`,
              options: [
                'Clearly specify reference axes, given knowns, and governing constraints',
                'Immediately guess a numerical value',
                'Ignore all boundary conditions',
                'Substitute numbers before writing the formula',
              ],
              correctIndex: 0,
              explanation:
                'Establishing coordinates, known quantities, and algebraic formulas before substituting numbers prevents 90% of exam calculation errors.',
            },
          },
          {
            id: 'scene-c3',
            sceneNumber: 3,
            timestampSec: 90,
            durationSec: 40,
            title: `Real-World Applications & High-Yield Exam Checklist`,
            narration: `To wrap up, remember that this concept directly enables modern technologies and frequently appears as a high-weightage question on exams. Review the key takeaways below and test yourself with the interactive flashcards!`,
            visualLayout: 'split_screen',
            visualData: {
              mainHeading: 'Real-World Systems & Exam Strategy',
              subheading: 'High-Yield Review Checklist',
              bulletPoints: [
                'Direct applications in engineering and natural systems',
                'Common multi-part question format on standardized tests',
                'Review formulas and practice with 2-3 sample problems',
              ],
              highlightCallout: 'Add this video to your revision queue for active recall spaced repetition!',
              avatarExpression: 'pointing',
            },
          },
        ],
      };
      return res.json(mockVideo);
    }

    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (!parsed.id) {
      parsed.id = `video-${Date.now()}`;
    }
    parsed.isCustomGenerated = true;
    return res.json(parsed);
  } catch (error) {
    console.error('Error generating AI video lesson:', error);
    return res.status(500).json({ error: 'Failed to generate AI video lesson', details: String(error) });
  }
});

// Vite middleware or static serving
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NEXORA STUDY AI server running on port ${PORT}`);
  });
}

start();
