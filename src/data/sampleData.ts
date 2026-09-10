import { StudentProfile, DailyMission, WeaknessItem, SyllabusChapter, Flashcard, StudyPlanDay, SnapStudyResult, StudyPlanSchedule } from '../types';

export const initialStudentProfile: StudentProfile = {
  name: 'Alex Vance',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  grade: 'Grade 11 (Advanced STEM)',
  level: 7,
  xp: 2840,
  xpToNextLevel: 3500,
  streakDays: 14,
  todayStudyMinutes: 45,
  todayGoalMinutes: 60,
  overallMastery: 78,
  badges: [
    { id: '1', title: '14-Day Streak', description: 'Maintained consecutive daily study streak for 2 full weeks', icon: '🔥', rarity: 'rare', unlockedAt: 'Today' },
    { id: '2', title: 'Weakness Slayer', description: 'Eliminated 5 high-priority cognitive weaknesses through targeted drills', icon: '⚔️', rarity: 'epic', unlockedAt: '2 days ago' },
    { id: '3', title: 'Snap Scholar', description: 'Scanned and synthesized 10 textbook pages with SnapStudy OCR', icon: '📸', rarity: 'rare', unlockedAt: '3 days ago' },
    { id: '4', title: 'Century Club', description: 'Completed over 100 adaptive quiz questions with >85% accuracy', icon: '🎯', rarity: 'epic', unlockedAt: 'Last week' },
    { id: '5', title: 'Night Owl', description: 'Finished a 25-minute deep focus revision after 9:00 PM', icon: '🦉', rarity: 'common', unlockedAt: 'Last week' },
  ],
  subscription: {
    status: 'free_trial',
    planName: 'Pro Free Trial',
    trialDaysLeft: 4,
    trialTotalDays: 7,
    trialEndDate: 'In 4 days',
    priceStartingFrom: 99,
    currency: '$',
    isUpgraded: false,
    features: [
      'Unlimited 24/7 AI Tutor explanations & step-by-step math solver',
      'SnapStudy photo scanning with instant cheat sheets',
      'Adaptive AI Mock Exam Generator with root-cause analysis',
      'Spaced repetition memory algorithms & retention prediction',
      'Study Circles collaborative focus hall & global tournaments',
    ],
  },
};

export const initialDailyMission: DailyMission = {
  id: 'mission-today',
  title: "Today's Adaptive Mastery Mission",
  date: 'Today',
  xpReward: 150,
  completed: false,
  tasks: [
    { id: 't1', title: 'Algebra: Sign Distribution Drill', type: 'practice', durationMinutes: 15, completed: true, subject: 'Mathematics' },
    { id: 't2', title: 'Physics: Newton’s 2nd Law Flashcards', type: 'flashcards', durationMinutes: 5, completed: false, subject: 'Physics' },
    { id: 't3', title: 'Chemistry: Redox Reactions Quick Quiz (10 Qs)', type: 'quiz', durationMinutes: 10, completed: false, subject: 'Chemistry' },
  ],
};

export const sampleWeaknesses: WeaknessItem[] = [
  {
    id: 'w-1',
    subject: 'Mathematics',
    chapter: 'Quadratic Equations',
    subtopic: 'Factoring Negative Coefficients',
    score: 4,
    maxScore: 10,
    weaknessLabel: 'Sign inversion when expanding -(ax + b)',
    rootCause: 'Consistently forgetting to distribute the minus sign to the second term inside parentheses during polynomial factorization.',
    confidence: 'Critical',
    recommendedPracticeMinutes: 12,
    mistakeFrequency: 4,
    sampleMistake: 'Wrote: -(3x - 5) = -3x - 5 instead of -3x + 5',
    practiceQuestions: [
      {
        id: 'wq-1',
        question: 'Expand and simplify completely: -4(2x - 7) + 3(x + 2)',
        type: 'mcq',
        options: ['-5x + 34', '-5x - 22', '-8x + 28', '-5x + 28'],
        correctAnswer: '-5x + 34',
        explanation: 'Distribute the -4: (-4 * 2x) + (-4 * -7) = -8x + 28. Then add 3(x + 2) = 3x + 6. Combining like terms: -8x + 3x + 28 + 6 = -5x + 34.',
        hint: 'Remember a negative multiplied by a negative produces a positive (+28).',
      },
      {
        id: 'wq-2',
        question: 'Solve for x: -(x - 6) = 2x + 9',
        type: 'mcq',
        options: ['x = -1', 'x = 1', 'x = -5', 'x = 3'],
        correctAnswer: 'x = -1',
        explanation: 'Expand the left side: -x + 6 = 2x + 9. Subtract 2x: -3x + 6 = 9. Subtract 6: -3x = 3. Divide by -3: x = -1.',
        hint: 'Distribute the negative sign to both x and -6 first to get -x + 6.',
      },
      {
        id: 'wq-3',
        question: 'True or False: The factored form of -2x² + 8x is -2x(x + 4).',
        type: 'true_false',
        options: ['True', 'False'],
        correctAnswer: 'False',
        explanation: 'Factoring out -2x gives -2x(x - 4) because (-2x) * (-4) = +8x. The original sign inside must be negative.',
        hint: 'Check what happens if you expand -2x(x + 4): it would yield -2x² - 8x.',
      },
    ],
  },
  {
    id: 'w-2',
    subject: 'Physics',
    chapter: 'Laws of Motion',
    subtopic: 'Inclined Plane Normal Force',
    score: 5,
    maxScore: 10,
    weaknessLabel: 'Confusing mg sin(θ) with mg cos(θ)',
    rootCause: 'Misidentifying which gravitational component acts perpendicular to the inclined surface versus parallel down the slope.',
    confidence: 'Low',
    recommendedPracticeMinutes: 15,
    mistakeFrequency: 3,
    sampleMistake: 'Assumed Normal Force N = mg sin(θ) instead of mg cos(θ)',
    practiceQuestions: [
      {
        id: 'wq-4',
        question: 'A 5 kg block sits on a frictionless ramp inclined at 30° to the horizontal. What is the component of gravity accelerating the block down the ramp? (Take g = 9.8 m/s²)',
        type: 'mcq',
        options: ['24.5 N', '42.4 N', '49.0 N', '12.25 N'],
        correctAnswer: '24.5 N',
        explanation: 'The component parallel to the ramp is mg sin(θ) = 5 * 9.8 * sin(30°) = 49 * 0.5 = 24.5 N.',
        hint: 'Parallel force down the slope uses sin(θ).',
      },
      {
        id: 'wq-5',
        question: 'What is the magnitude of the normal force exerted by the ramp on the 5 kg block at 30° inclination?',
        type: 'mcq',
        options: ['42.4 N', '24.5 N', '49.0 N', '35.0 N'],
        correctAnswer: '42.4 N',
        explanation: 'The normal force balances the perpendicular component: N = mg cos(θ) = 5 * 9.8 * cos(30°) = 49 * 0.866 = 42.4 N.',
        hint: 'Perpendicular component balancing the surface contact is mg cos(θ).',
      },
    ],
  },
  {
    id: 'w-3',
    subject: 'Chemistry',
    chapter: 'Stoichiometry & Mole Concept',
    subtopic: 'Limiting Reagent Identification',
    score: 6,
    maxScore: 10,
    weaknessLabel: 'Neglecting stoichiometric mole ratios',
    rootCause: 'Comparing initial masses directly instead of converting to moles and dividing by respective stoichiometric coefficients.',
    confidence: 'Medium',
    recommendedPracticeMinutes: 10,
    mistakeFrequency: 2,
    sampleMistake: 'Picked the reactant with fewer grams instead of calculating mole quotients.',
    practiceQuestions: [
      {
        id: 'wq-6',
        question: 'In the reaction 2H₂ + O₂ → 2H₂O, you have 4 moles of H₂ and 3 moles of O₂. Which is the limiting reactant?',
        type: 'mcq',
        options: ['H₂', 'O₂', 'Both are equal', 'H₂O'],
        correctAnswer: 'H₂',
        explanation: 'Mole ratios needed: 4 moles H₂ require 4 / 2 = 2 moles of O₂. Since we have 3 moles of O₂, O₂ is in excess and H₂ is completely consumed first (limiting).',
        hint: 'Divide the available moles by each coefficient: H₂ is 4/2 = 2; O₂ is 3/1 = 3. The smaller quotient is limiting.',
      },
    ],
  },
  {
    id: 'w-4',
    subject: 'Biology',
    chapter: 'Cellular Respiration',
    subtopic: 'Oxidative Phosphorylation & Chemiosmosis',
    score: 7,
    maxScore: 10,
    weaknessLabel: 'Proton gradient orientation across mitochondrial membrane',
    rootCause: 'Confusing proton accumulation in the intermembrane space versus the mitochondrial matrix during electron transport.',
    confidence: 'Low',
    recommendedPracticeMinutes: 10,
    mistakeFrequency: 2,
    sampleMistake: 'Stated protons are pumped into the matrix instead of into the intermembrane space',
    practiceQuestions: [
      {
        id: 'wq-7',
        question: 'During oxidative phosphorylation, complexes I, III, and IV pump protons (H⁺) from where to where?',
        type: 'mcq',
        options: [
          'From the mitochondrial matrix into the intermembrane space',
          'From the intermembrane space into the matrix',
          'From the cytoplasm into the outer mitochondrial membrane',
          'From the thylakoid lumen into the stroma',
        ],
        correctAnswer: 'From the mitochondrial matrix into the intermembrane space',
        explanation: 'The electron transport chain pumps protons from the matrix across the inner membrane into the intermembrane space, creating the proton-motive force.',
        hint: 'Protons accumulate in the narrow intermembrane space, creating a steep pH and electrical gradient.',
      },
    ],
  },
];

export const sampleChapters: SyllabusChapter[] = [
  {
    id: 'math-quad',
    subject: 'Mathematics',
    title: 'Quadratic Equations & Functions',
    description: 'Parabolas, factoring, quadratic formula, vertex form, and discriminant analysis.',
    mastery: 'weak',
    masteryPercentage: 54,
    studyHours: 5.5,
    targetStudyHours: 8.0,
    quizAccuracy: 62,
    simpleExplanation: 'A quadratic equation contains a variable raised to the second power (x²). Geometrically, it produces a U-shaped curved graph called a parabola. Solving it reveals where the curve cuts the x-axis (roots or zeros).',
    eli13Explanation: 'Imagine throwing a basketball into a hoop. The path the ball takes rising and falling is an arc shaped like an upside-down U. Quadratic equations are simply the mathematical recipes that calculate the exact height, peak, and landing point of that curved arc.',
    quickRevisionPoints: [
      'Standard Form: ax² + bx + c = 0 (where a ≠ 0)',
      'Discriminant: Δ = b² - 4ac determines number and nature of roots (Δ > 0: 2 real roots, Δ = 0: 1 real root, Δ < 0: 2 complex roots)',
      'Quadratic Formula: x = (-b ± √(b² - 4ac)) / (2a)',
      'Vertex coordinates: h = -b / (2a), k = f(h)',
    ],
    importantFormulas: [
      { name: 'Quadratic Formula', formula: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', explanation: 'Solves any quadratic polynomial regardless of factorability.' },
      { name: 'Discriminant', formula: '\\Delta = b^2 - 4ac', explanation: 'Tells you if roots are real, equal, or imaginary.' },
      { name: 'Vertex Coordinates', formula: '(h, k) = \\left(-\\frac{b}{2a}, c - \\frac{b^2}{4a}\\right)', explanation: 'Finds the maximum or minimum turning point.' },
    ],
    workedExamples: [
      {
        problem: 'Solve 2x² - 4x - 6 = 0 using the quadratic formula.',
        solution: 'x = 3 and x = -1',
        steps: [
          'Identify coefficients: a = 2, b = -4, c = -6',
          'Calculate discriminant: Δ = (-4)² - 4(2)(-6) = 16 + 48 = 64',
          'Take square root: √64 = 8',
          'Apply formula: x = (-(-4) ± 8) / (2 * 2) = (4 ± 8) / 4',
          'Root 1: (4 + 8) / 4 = 12 / 4 = 3',
          'Root 2: (4 - 8) / 4 = -4 / 4 = -1',
        ],
      },
    ],
    keyTakeaways: ['Always watch your negative signs in -b and b²', 'Check discriminant before doing long arithmetic', 'Graph opens upward if a > 0, downward if a < 0'],
  },
  {
    id: 'math-calc',
    subject: 'Mathematics',
    title: 'Differential Calculus & Derivatives',
    description: 'Limits, product and quotient rules, chain rule, and optimization tangents.',
    mastery: 'mastered',
    masteryPercentage: 86,
    studyHours: 5.8,
    targetStudyHours: 7.0,
    quizAccuracy: 88,
    simpleExplanation: 'Calculus analyzes rates of change. A derivative reveals the exact instantaneous speed or slope of a curve at any specific point.',
    eli13Explanation: 'Looking at your car speedometer shows exactly how fast you are moving at this split-second, not your average speed over the whole road trip. Derivatives are mathematical speedometers.',
    quickRevisionPoints: [
      'Power Rule: d/dx[xⁿ] = n·xⁿ⁻¹',
      'Product Rule: (uv)′ = u′v + uv′',
      'Chain Rule: d/dx[f(g(x))] = f′(g(x))·g′(x)',
      'Critical points occur where f′(x) = 0 or undefined',
    ],
    importantFormulas: [
      { name: 'Power Rule', formula: '\\frac{d}{dx}(x^n) = n x^{n-1}', explanation: 'Fundamental rule for polynomial terms.' },
      { name: 'Chain Rule', formula: '\\frac{d}{dx}(f(g(x))) = f\'(g(x)) g\'(x)', explanation: 'Differentiates composite nested functions.' },
    ],
    workedExamples: [
      {
        problem: 'Find the derivative of f(x) = (3x² - 1)⁴.',
        solution: 'f′(x) = 24x(3x² - 1)³',
        steps: [
          'Identify outer function u⁴ and inner function u = 3x² - 1',
          'Outer derivative: 4u³ = 4(3x² - 1)³',
          'Inner derivative: d/dx(3x² - 1) = 6x',
          'Multiply together: 4(3x² - 1)³ · 6x = 24x(3x² - 1)³',
        ],
      },
    ],
    keyTakeaways: ['Always remember the inner derivative when using the chain rule', 'Derivatives yield the instantaneous gradient', 'Second derivative tests concavity and inflection points'],
  },
  {
    id: 'math-vec',
    subject: 'Mathematics',
    title: 'Vectors & 3D Analytical Geometry',
    description: 'Dot products, cross products, projections, planes, and direction cosines.',
    mastery: 'revision',
    masteryPercentage: 76,
    studyHours: 3.2,
    targetStudyHours: 5.0,
    quizAccuracy: 74,
    simpleExplanation: 'Vectors have both magnitude and direction. 3D geometry extends coordinate algebra into spatial three-dimensional space.',
    eli13Explanation: 'Giving someone walking directions requires distance AND direction: "Walk 500 meters North-East". That instruction is a vector.',
    quickRevisionPoints: [
      'Dot Product: a · b = |a||b| cos(θ) = a₁b₁ + a₂b₂ + a₃b₃ (scalar output)',
      'Orthogonal condition: a · b = 0 when vectors are perpendicular',
      'Cross Product: a × b yields a vector perpendicular to both a and b',
    ],
    importantFormulas: [
      { name: 'Dot Product', formula: '\\vec{a} \\cdot \\vec{b} = |\\vec{a}||\\vec{b}|\\cos\\theta', explanation: 'Computes projection and angle between vectors.' },
      { name: 'Cross Product Magnitude', formula: '|\\vec{a} \\times \\vec{b}| = |\\vec{a}||\\vec{b}|\\sin\\theta', explanation: 'Yields area of parallelogram spanned by vectors.' },
    ],
    workedExamples: [
      {
        problem: 'Determine whether a = (2, 3, -1) and b = (-3, 2, 0) are perpendicular.',
        solution: 'Yes, dot product is zero.',
        steps: [
          'Compute a · b = (2)(-3) + (3)(2) + (-1)(0)',
          'a · b = -6 + 6 + 0 = 0',
          'Since a · b = 0, the vectors are perpendicular (orthogonal).',
        ],
      },
    ],
    keyTakeaways: ['Dot product produces a number; cross product produces a vector', 'Two vectors are perpendicular if dot product is 0'],
  },
  {
    id: 'phys-newton',
    subject: 'Physics',
    title: 'Newton’s Laws of Motion & Dynamics',
    description: 'Inertia, F=ma, action-reaction pairs, free body diagrams, and friction.',
    mastery: 'revision',
    masteryPercentage: 72,
    studyHours: 7.2,
    targetStudyHours: 10.0,
    quizAccuracy: 68,
    simpleExplanation: 'Isaac Newton codified how forces cause objects to accelerate. Objects keep doing what they are doing unless a net external force acts (1st law). The net force equals mass times acceleration (2nd law). Every action has an equal and opposite reaction (3rd law).',
    eli13Explanation: 'Think of pushing a heavy shopping cart. If it’s empty, a light push makes it zoom. If it’s loaded with 50 cans of soda, you need to shove with all your muscle to get the same speed. That is F = ma: force, mass, and how fast you change speed!',
    quickRevisionPoints: [
      '1st Law (Inertia): An object at rest stays at rest, moving stays in motion unless net force acts.',
      '2nd Law: ΣF = m * a (vector equation: resolve x and y components separately).',
      '3rd Law: Forces always occur in matched interaction pairs acting on DIFFERENT bodies.',
      'Static friction ≤ μ_s * N; Kinetic friction = μ_k * N.',
    ],
    importantFormulas: [
      { name: 'Newton’s 2nd Law', formula: '\\Sigma \\vec{F} = m \\vec{a}', explanation: 'Net force vector equals mass times acceleration vector.' },
      { name: 'Weight / Gravity', formula: 'W = m \\cdot g', explanation: 'Gravitational force acting straight down towards Earth’s center.' },
      { name: 'Frictional Force', formula: 'f_k = \\mu_k \\cdot N', explanation: 'Opposes relative sliding motion along contact surfaces.' },
    ],
    workedExamples: [
      {
        problem: 'A 10 kg sled is pulled with a horizontal force of 50 N. Kinetic friction coefficient μ_k = 0.2. What is its acceleration? (g = 9.8 m/s²)',
        solution: 'a = 3.04 m/s²',
        steps: [
          'Calculate normal force: N = mg = 10 * 9.8 = 98 N',
          'Calculate friction: f_k = 0.2 * 98 = 19.6 N',
          'Net horizontal force: ΣF_x = 50 - 19.6 = 30.4 N',
          'Compute acceleration: a = ΣF_x / m = 30.4 / 10 = 3.04 m/s²',
        ],
      },
    ],
    keyTakeaways: ['Always draw a Free Body Diagram first', 'Normal force does not always equal mg (e.g. on inclines)', 'Action-reaction forces never cancel because they act on separate objects'],
  },
  {
    id: 'phys-elec',
    subject: 'Physics',
    title: 'Electric Charges, Fields & Capacitance',
    description: 'Coulomb’s law, electric potential, Gauss’s law, capacitors, and energy density.',
    mastery: 'revision',
    masteryPercentage: 64,
    studyHours: 4.8,
    targetStudyHours: 7.0,
    quizAccuracy: 66,
    simpleExplanation: 'Charged particles exert electrostatic forces across space via electric fields. Capacitors store electrostatic potential energy in electric fields.',
    eli13Explanation: 'Rubbing a balloon on your hair pulls electrons, giving it a charge that makes your hair stand up. That invisible pull in the air between the balloon and your hair is the electric field!',
    quickRevisionPoints: [
      'Coulomb’s Law: F = k·|q₁q₂| / r²',
      'Electric Field: E = F / q = k·q / r²',
      'Capacitance: C = Q / V = ε₀·A / d',
      'Energy stored in capacitor: U = ½CV² = ½QV',
    ],
    importantFormulas: [
      { name: 'Coulomb’s Law', formula: 'F = \\frac{k |q_1 q_2|}{r^2}', explanation: 'Force between point charges.' },
      { name: 'Capacitor Energy', formula: 'U = \\frac{1}{2} C V^2', explanation: 'Stored electrostatic energy.' },
    ],
    workedExamples: [
      {
        problem: 'Calculate the charge on a 10 μF capacitor connected to a 12 V battery.',
        solution: 'Q = 120 μC',
        steps: [
          'Use formula Q = C · V',
          'Q = (10 × 10⁻⁶ F) · 12 V = 1.2 × 10⁻⁴ C = 120 μC',
        ],
      },
    ],
    keyTakeaways: ['Electric field points away from positive charges and toward negative charges', 'Capacitors block steady DC current once charged'],
  },
  {
    id: 'chem-stoich',
    subject: 'Chemistry',
    title: 'Chemical Stoichiometry & Gas Laws',
    description: 'Mole calculations, empirical formulas, limiting reagents, and PV = nRT.',
    mastery: 'revision',
    masteryPercentage: 78,
    studyHours: 6.5,
    targetStudyHours: 8.0,
    quizAccuracy: 80,
    simpleExplanation: 'Stoichiometry is the recipe book of chemistry. It relates masses, volumes, and mole counts of reactants and products based on balanced chemical reactions.',
    eli13Explanation: 'Imagine baking chocolate chip cookies. If a recipe needs 2 cups of flour and 1 egg to make 12 cookies, having 10 eggs and only 2 cups of flour means you can still only make 12 cookies! The flour is your limiting reagent.',
    quickRevisionPoints: [
      '1 mole = 6.022 × 10²³ particles (Avogadro’s Number)',
      'Moles = Mass (g) / Molar Mass (g/mol)',
      'Ideal Gas Law: PV = nRT (R = 0.0821 L·atm/(mol·K) or 8.314 J/(mol·K))',
      'Percent Yield = (Actual Yield / Theoretical Yield) × 100%',
    ],
    importantFormulas: [
      { name: 'Mole Equation', formula: 'n = \\frac{m}{M}', explanation: 'Moles = mass in grams divided by molar mass.' },
      { name: 'Ideal Gas Equation', formula: 'PV = nRT', explanation: 'Pressure × Volume = Moles × Constant × Temperature in Kelvin.' },
      { name: 'Concentration (Molarity)', formula: 'M = \\frac{n}{V_{liters}}', explanation: 'Moles of solute per liter of total solution.' },
    ],
    workedExamples: [
      {
        problem: 'How many grams of CO₂ are produced when 16g of methane (CH₄) is completely combusted? (CH₄ + 2O₂ → CO₂ + 2H₂O)',
        solution: '44 grams CO₂',
        steps: [
          'Molar mass of CH₄ = 12 + 4(1) = 16 g/mol',
          'Moles of CH₄ = 16g / 16 g/mol = 1.0 mol',
          'Mole ratio: 1 mol CH₄ produces 1 mol CO₂',
          'Molar mass of CO₂ = 12 + 2(16) = 44 g/mol',
          'Mass of CO₂ = 1.0 mol * 44 g/mol = 44 grams',
        ],
      },
    ],
    keyTakeaways: ['Always balance the chemical equation first', 'Temperature must always be in Kelvin (K = °C + 273.15)', 'Divide moles by stoichiometric coefficient to find limiting reactant'],
  },
  {
    id: 'chem-bond',
    subject: 'Chemistry',
    title: 'Chemical Bonding & Molecular Shapes',
    description: 'VSEPR theory, hybridization, covalent polarity, and intermolecular forces.',
    mastery: 'mastered',
    masteryPercentage: 86,
    studyHours: 4.0,
    targetStudyHours: 5.0,
    quizAccuracy: 85,
    simpleExplanation: 'Atoms bond to achieve stable valence electron configurations. VSEPR theory predicts 3D geometric shapes by minimizing electron pair repulsions.',
    eli13Explanation: 'Think of tying balloons together at their knots. They naturally push away from each other and point in opposite directions to have maximum space. Electron pairs around an atom do the exact same thing!',
    quickRevisionPoints: [
      'Ionic: Electron transfer between metals & non-metals (ΔEN > 2.0)',
      'Covalent: Electron sharing between non-metals',
      'VSEPR Shapes: Linear (180°), Trigonal Planar (120°), Tetrahedral (109.5°), Bent (104.5° for H₂O)',
      'Hybridization: sp (linear), sp² (trigonal planar), sp³ (tetrahedral)',
    ],
    importantFormulas: [
      { name: 'Formal Charge', formula: '\\text{FC} = V - N - \\frac{B}{2}', explanation: 'Valence minus non-bonding minus half bonding electrons.' },
    ],
    workedExamples: [
      {
        problem: 'Predict the molecular geometry of methane (CH₄).',
        solution: 'Tetrahedral, 109.5° bond angles.',
        steps: [
          'Carbon has 4 valence electrons, forms 4 single bonds with H',
          'Steric number = 4 bonding pairs + 0 lone pairs = 4',
          'VSEPR shape for steric number 4 with no lone pairs is Tetrahedral.',
        ],
      },
    ],
    keyTakeaways: ['Lone pairs exert stronger repulsion than bonding pairs, narrowing bond angles', 'Electronegativity differences create polar dipole moments'],
  },
  {
    id: 'bio-cell',
    subject: 'Biology',
    title: 'Cellular Respiration & Bioenergetics',
    description: 'Glycolysis, Krebs cycle, electron transport chain, and ATP synthesis.',
    mastery: 'mastered',
    masteryPercentage: 92,
    studyHours: 5.0,
    targetStudyHours: 6.0,
    quizAccuracy: 92,
    simpleExplanation: 'Cellular respiration is the biochemical engine by which living cells convert glucose and oxygen into usable chemical energy currency (ATP), releasing carbon dioxide and water as byproducts.',
    eli13Explanation: 'Your body needs electricity to run, just like a smartphone. When you eat an apple, your cells don’t directly run on apple chunks—they break down the sugar in tiny cellular powerplants (mitochondria) to charge up millions of tiny chemical batteries called ATP.',
    quickRevisionPoints: [
      'Glycolysis occurs in cytoplasm; does NOT require O₂; nets 2 ATP + 2 NADH.',
      'Krebs (Citric Acid) Cycle occurs in mitochondrial matrix; produces CO₂, NADH, FADH₂, and ATP.',
      'Electron Transport Chain (ETC) on inner mitochondrial membrane uses oxygen as final electron acceptor; produces ~28-32 ATP.',
      'Fermentation occurs anaerobically (lactic acid in humans, ethanol in yeast).',
    ],
    importantFormulas: [
      { name: 'Overall Equation', formula: 'C_6H_{12}O_6 + 6O_2 \\rightarrow 6CO_2 + 6H_2O + 30-32\\text{ ATP}', explanation: 'Aerobic oxidation of glucose.' },
    ],
    workedExamples: [
      {
        problem: 'Why does cyanide poison kill aerobic organisms within minutes?',
        solution: 'It blocks Cytochrome c oxidase in Complex IV of the ETC.',
        steps: [
          'Cyanide binds irreversibly to Fe³⁺ in cytochrome c oxidase (Complex IV)',
          'Electrons can no longer transfer to Oxygen',
          'Proton gradient collapses across the inner mitochondrial membrane',
          'ATP Synthase stops producing ATP; brain and heart cells deplete energy rapidly',
        ],
      },
    ],
    keyTakeaways: ['Oxygen is the final electron acceptor', 'Most ATP is generated by oxidative phosphorylation (ETC), not glycolysis', 'Mitochondrial cristae maximize surface area for ATP synthase enzymes'],
  },
  {
    id: 'bio-genetics',
    subject: 'Biology',
    title: 'Genetics, DNA & Mendelian Inheritance',
    description: 'Alleles, Punnett squares, transcription, translation, and genetic mutations.',
    mastery: 'mastered',
    masteryPercentage: 90,
    studyHours: 3.0,
    targetStudyHours: 4.0,
    quizAccuracy: 90,
    simpleExplanation: 'Genetics examines how biological traits pass from parents to offspring through DNA instructions packaged in chromosomes.',
    eli13Explanation: 'DNA is like a giant library of master instruction manuals inside every cell. Genes are individual recipes in that book that dictate your eye color, height, and hair type.',
    quickRevisionPoints: [
      'Law of Segregation: Two alleles for each gene separate during gamete formation.',
      'Law of Independent Assortment: Genes on different chromosomes sort independently.',
      'Central Dogma: DNA → (Transcription) → mRNA → (Translation) → Protein.',
      'Base pairing: A pairs with T (or U in RNA), C pairs with G.',
    ],
    importantFormulas: [
      { name: 'Hardy-Weinberg Equation', formula: 'p^2 + 2pq + q^2 = 1', explanation: 'Predicts genotype frequencies under genetic equilibrium.' },
    ],
    workedExamples: [
      {
        problem: 'Cross a heterozygous brown-eyed parent (Bb) with a blue-eyed parent (bb). What is the probability of a blue-eyed child?',
        solution: '50% (probability = 0.5)',
        steps: [
          'Alleles from parent 1: B and b; Parent 2: b and b',
          'Punnett square offspring: Bb (50%), bb (50%)',
          'Blue eyes requires homozygous recessive (bb), so probability is 2/4 = 50%.',
        ],
      },
    ],
    keyTakeaways: ['Genotype is the genetic makeup; Phenotype is the physical expression', 'Dominant alleles mask recessive alleles in heterozygotes'],
  },
  {
    id: 'cs-algo',
    subject: 'Computer Science',
    title: 'Data Structures & Algorithmic Complexity',
    description: 'Big-O notation, arrays, hash maps, binary trees, recursion, and sorting.',
    mastery: 'mastered',
    masteryPercentage: 88,
    studyHours: 5.0,
    targetStudyHours: 6.0,
    quizAccuracy: 88,
    simpleExplanation: 'Algorithms are step-by-step procedures for solving computational problems. Data structures organize and store data for efficient access and modification.',
    eli13Explanation: 'Imagine looking up a phone number in an alphabetized phone book versus a random pile of sticky notes. A sorted book is a data structure that lets you find names in seconds instead of hours!',
    quickRevisionPoints: [
      'Time Complexity hierarchy: O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ)',
      'Hash Table: O(1) average lookup and insertion time',
      'Binary Search: O(log n) search on pre-sorted arrays',
      'Stack: LIFO (Last In First Out); Queue: FIFO (First In First Out)',
    ],
    importantFormulas: [
      { name: 'Binary Search Steps', formula: 'k = \\lceil \\log_2(n) \\rceil', explanation: 'Maximum comparisons needed to search n elements.' },
    ],
    workedExamples: [
      {
        problem: 'What is the time complexity of searching for a value in an unsorted array of size N?',
        solution: 'O(N) linear time',
        steps: [
          'In an unsorted array, the target element could be anywhere',
          'In the worst-case scenario, you must inspect every element up to N',
          'Therefore, time complexity is O(N).',
        ],
      },
    ],
    keyTakeaways: ['Prefer hash maps for fast O(1) key lookups', 'Binary search requires the data to be sorted first'],
  },
];

export const sampleFlashcards: Flashcard[] = [
  {
    id: 'fc-1',
    subject: 'Mathematics',
    chapter: 'Quadratic Equations',
    front: 'What does the Discriminant (b² - 4ac) indicate when it is strictly negative (< 0)?',
    back: 'It indicates that the quadratic equation has NO real roots. Instead, it has two conjugate complex/imaginary roots, and its parabola does not touch or intersect the x-axis.',
    keyPoints: ['No real solutions', 'Two complex roots', 'Graph floats completely above or below x-axis'],
    intervalDays: 1,
    repetitions: 1,
    easeFactor: 2.1,
    nextReviewDate: '2026-09-04',
    status: 'revise_today',
  },
  {
    id: 'fc-2',
    subject: 'Physics',
    chapter: 'Laws of Motion',
    front: 'Why is static friction almost always greater than kinetic friction for the same two contact surfaces?',
    back: 'At rest, microscopic surface irregularities (asperities) settle into one another, forming temporary cold-welds and interlocking molecular bonds. Once sliding begins, asperities skip over each other without fully locking in.',
    keyPoints: ['μ_s > μ_k', 'Microscopic cold welding at rest', 'Roughness interlocking requires extra force to break initially'],
    intervalDays: 1,
    repetitions: 2,
    easeFactor: 2.3,
    nextReviewDate: '2026-09-04',
    status: 'revise_today',
  },
  {
    id: 'fc-3',
    subject: 'Chemistry',
    chapter: 'Stoichiometry',
    front: 'How do you mathematically determine the limiting reactant between two reagents?',
    back: 'Convert the given mass of each reactant to moles, then divide each mole count by its respective stoichiometric coefficient from the balanced equation. The reactant with the smallest quotient is the limiting reagent.',
    keyPoints: ['Moles / Stoichiometric Coefficient', 'Smallest quotient is limiting', 'Determines maximum theoretical yield'],
    intervalDays: 2,
    repetitions: 3,
    easeFactor: 2.4,
    nextReviewDate: '2026-09-06',
    status: 'coming_up',
  },
  {
    id: 'fc-4',
    subject: 'Biology',
    chapter: 'Cellular Respiration',
    front: 'What is the exact role of Molecular Oxygen (O₂) in the Electron Transport Chain?',
    back: 'Oxygen serves as the terminal (final) electron acceptor. It pulls electrons through the chain due to its high electronegativity and binds with protons (H⁺) to form water (H₂O).',
    keyPoints: ['Final electron acceptor', 'Maintains electron flow', 'Combines with H+ to form H2O'],
    intervalDays: 7,
    repetitions: 5,
    easeFactor: 2.6,
    nextReviewDate: '2026-09-11',
    status: 'mastered',
  },
];

export const sampleStudyPlan: StudyPlanDay[] = [
  {
    date: '2026-09-05',
    dayName: 'Friday (Today)',
    isToday: true,
    totalTargetMinutes: 60,
    tasks: [
      { id: 'p-1', timeSlot: '04:30 PM - 05:00 PM', subject: 'Mathematics', chapter: 'Quadratic Equations', taskType: 'Weakness Drill', durationMinutes: 30, completed: true, priority: 'High' },
      { id: 'p-2', timeSlot: '05:15 PM - 05:35 PM', subject: 'Physics', chapter: 'Newton’s Laws of Motion', taskType: 'Flashcards', durationMinutes: 20, completed: false, priority: 'High' },
      { id: 'p-3', timeSlot: '07:00 PM - 07:15 PM', subject: 'Chemistry', chapter: 'Stoichiometry', taskType: 'Quiz', durationMinutes: 10, completed: false, priority: 'Normal' },
    ],
  },
  {
    date: '2026-09-06',
    dayName: 'Saturday',
    totalTargetMinutes: 90,
    tasks: [
      { id: 'p-4', timeSlot: '10:00 AM - 10:45 AM', subject: 'Physics', chapter: 'Inclined Plane & Friction', taskType: 'Learn New', durationMinutes: 45, completed: false, priority: 'High' },
      { id: 'p-5', timeSlot: '11:00 AM - 11:30 AM', subject: 'Mathematics', chapter: 'Vertex Form & Graphing', taskType: 'Revision', durationMinutes: 30, completed: false, priority: 'Medium' },
      { id: 'p-6', timeSlot: '04:00 PM - 04:15 PM', subject: 'Biology', chapter: 'ATP Synthase Complex', taskType: 'Flashcards', durationMinutes: 15, completed: false, priority: 'Normal' },
    ],
  },
  {
    date: '2026-09-07',
    dayName: 'Sunday',
    totalTargetMinutes: 75,
    tasks: [
      { id: 'p-7', timeSlot: '02:00 PM - 02:45 PM', subject: 'Chemistry', chapter: 'Ideal Gas Law & Partial Pressure', taskType: 'Learn New', durationMinutes: 45, completed: false, priority: 'Medium' },
      { id: 'p-8', timeSlot: '03:00 PM - 03:30 PM', subject: 'Mathematics', chapter: 'Exam Drill: Full Mock Quiz', taskType: 'Quiz', durationMinutes: 30, completed: false, priority: 'High' },
    ],
  },
];

export const sampleSnapNotesPresets: { id: string; title: string; subject: string; previewText: string; imageUrl: string }[] = [
  {
    id: 'preset-phys',
    title: 'Faraday’s Law of Electromagnetic Induction (Handwritten Lecture Note)',
    subject: 'Physics',
    imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80',
    previewText: `Class Lecture Notes: Electromagnetic Induction & Lenz's Law
- Magnetic Flux: Φ = B * A * cos(θ). Unit: Weber (Wb).
- Faraday's Law: Induced electromotive force (emf) ε = -N * (dΦ / dt).
- Lenz's Law: The minus sign means induced current creates a magnetic field OPPOSING the change in magnetic flux that caused it.
- Motional emf in a straight conductor moving with velocity v through uniform field B: ε = B * L * v.
Exam Warning: Always check if the angle θ is between the magnetic field and the surface NORMAL, not the surface plane!`,
  },
  {
    id: 'preset-bio',
    title: 'Photosynthesis Light vs Dark Reactions (Textbook Diagram & Summary)',
    subject: 'Biology',
    imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=600&auto=format&fit=crop&q=80',
    previewText: `Chapter 8: Photosynthesis Overview
Equation: 6CO2 + 6H2O + Light Energy -> C6H12O6 + 6O2
Phase 1: Light-Dependent Reactions (Thylakoid Membrane)
- Chlorophyll in Photosystem II absorbs photons, photolysis splits water: 2H2O -> 4H+ + 4e- + O2.
- Electron transport chain creates proton gradient; ATP Synthase produces ATP.
- NADP+ is reduced to NADPH in Photosystem I.
Phase 2: Light-Independent / Calvin Cycle (Stroma)
- Enzyme RuBisCO fixes atmospheric CO2 onto RuBP.
- Requires ATP and NADPH from light reactions to synthesize G3P (precursor to glucose).`,
  },
  {
    id: 'preset-math',
    title: 'Calculus: Fundamental Theorem & Integration by Parts',
    subject: 'Mathematics',
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
    previewText: `Calculus II Study Guide: Integration by Parts
Formula: ∫ u dv = u * v - ∫ v du
Heuristic for selecting 'u' (LIATE rule):
L - Logarithmic functions (ln x)
I - Inverse trigonometric functions (arctan x)
A - Algebraic / polynomial functions (x^2, 3x)
T - Trigonometric functions (sin x, cos x)
E - Exponential functions (e^x)
Example Problem: Evaluate ∫ x * e^(2x) dx.
Let u = x -> du = dx.
Let dv = e^(2x) dx -> v = 1/2 * e^(2x).
Result: (1/2) * x * e^(2x) - ∫ (1/2) * e^(2x) dx = (1/2) * x * e^(2x) - (1/4) * e^(2x) + C.`,
  },
];

export const initialWeaknesses = sampleWeaknesses;
export const initialChapters = sampleChapters;
export const initialFlashcards = sampleFlashcards;

export const initialSchedule: StudyPlanSchedule[] = [
  {
    id: 'sch-1',
    dayTitle: 'Friday (Today)',
    date: 'Today',
    targetMinutes: 60,
    tasks: [
      { id: 'st-1', title: 'Quadratic Equations: Sign Expansion Drill', subject: 'Mathematics' as const, durationMinutes: 20, completed: true, priority: 'high' as const },
      { id: 'st-2', title: 'Newton’s 2nd Law & Incline Free Body Diagrams', subject: 'Physics' as const, durationMinutes: 25, completed: false, priority: 'high' as const },
      { id: 'st-3', title: 'Stoichiometry Limiting Reagent Flashcard Review', subject: 'Chemistry' as const, durationMinutes: 15, completed: false, priority: 'medium' as const },
    ],
  },
  {
    id: 'sch-2',
    dayTitle: 'Saturday',
    date: 'Tomorrow',
    targetMinutes: 90,
    tasks: [
      { id: 'st-4', title: 'Cellular Respiration & Krebs Cycle Speed Run', subject: 'Biology' as const, durationMinutes: 30, completed: false, priority: 'high' as const },
      { id: 'st-5', title: 'Calculus: Integration by Parts Practice', subject: 'Mathematics' as const, durationMinutes: 45, completed: false, priority: 'medium' as const },
      { id: 'st-6', title: 'Weakness Detector: Review Negative Distribution', subject: 'Mathematics' as const, durationMinutes: 15, completed: false, priority: 'high' as const },
    ],
  },
  {
    id: 'sch-3',
    dayTitle: 'Sunday',
    date: 'In 2 days',
    targetMinutes: 75,
    tasks: [
      { id: 'st-7', title: 'Physics Midterm Timed Diagnostic Mock Exam', subject: 'Physics' as const, durationMinutes: 45, completed: false, priority: 'high' as const },
      { id: 'st-8', title: 'Flashcards: Weekly Spaced Repetition Bucket', subject: 'Chemistry' as const, durationMinutes: 30, completed: false, priority: 'medium' as const },
    ],
  },
];

export const initialSnapStudyDrafts = [
  {
    id: 'draft-1',
    title: 'Kepler’s 3rd Law & Orbital Periods',
    subject: 'Physics' as const,
    content: 'Kepler’s Third Law: The square of the orbital period T is directly proportional to the cube of the semi-major axis r.\nFormula: T² = (4π² / GM) · r³\n• G = 6.674 × 10⁻¹¹ N·m²/kg²\n• M = Mass of central orbiting body\n• Geosynchronous orbit: Period T = 24 hours (86,400 s) at altitude ~35,786 km above equator.',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    tags: ['Fast Note', 'Exam Prep'],
    priority: 'high' as const,
  },
  {
    id: 'draft-2',
    title: 'Mitochondrial Chemiosmosis & ATP Yield',
    subject: 'Biology' as const,
    content: 'Summary: Protons (H+) are pumped into the intermembrane space via Complexes I, III, and IV of the Electron Transport Chain (ETC), generating a steep proton-motive electrochemical gradient.\n• Protons flow back into mitochondrial matrix through ATP Synthase (F₀-F₁ rotor complex).\n• Drives phosphorylation of ADP + Pi → ATP.\n• Cyanide blocks Complex IV (Cytochrome c oxidase), halting ATP synthesis entirely.',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    tags: ['Fast Note', 'Bio Mechanism'],
    priority: 'medium' as const,
  },
];

