import React, { useState, useEffect } from 'react';
import { BossEntity } from '../types';
import {
  Swords,
  Shield,
  Heart,
  Zap,
  RotateCcw,
  Sparkles,
  Trophy,
  Flame,
  Award,
  AlertTriangle,
  Skull,
  ArrowRight,
} from 'lucide-react';
import { triggerCelebration, soundFX } from '../utils/soundOrConfetti';

interface BossBattlesProps {
  onAddXP: (xp: number) => void;
}

const BOSSES: BossEntity[] = [
  {
    id: 'boss-1',
    name: 'The Vector Void Titan',
    title: 'Warden of Newtonian Mechanics',
    subject: 'Physics',
    maxHp: 2000,
    avatar: '👾',
    element: 'Gravitational Force',
    description: 'An ancient guardian forged from dark matter that punishes conceptual confusion in vectors, friction, and Newton\'s third law.',
    rewardXP: 250,
    badgeTitle: 'Titan Slayer (Physics)',
    questions: [
      {
        id: 'q1',
        question: 'A 1000kg car collides head-on with a 50kg cyclist. Which experiences the greater magnitude of impact force during the collision?',
        options: [
          'The cyclist experiences far greater force because of smaller mass',
          'The car experiences greater force because it has more momentum',
          'Both experience the EXACT same magnitude of force',
          'Neither experiences force until deceleration completes',
        ],
        correctAnswer: 'Both experience the EXACT same magnitude of force',
        explanation: 'Newton\'s Third Law states every action has an equal and opposite reaction force. The forces are identical; the cyclist simply accelerates more due to F=ma.',
        damage: 650,
      },
      {
        id: 'q2',
        question: 'A projectile is launched at 45° in a vacuum. At the very apex (highest point) of its flight, what is its acceleration?',
        options: [
          '0 m/s² because vertical velocity is zero',
          '9.8 m/s² directed downwards toward the Earth',
          '4.9 m/s² at a 45° tangent',
          'Depends on the initial launch velocity',
        ],
        correctAnswer: '9.8 m/s² directed downwards toward the Earth',
        explanation: 'Gravity never turns off! Even though the vertical velocity is instantaneously zero at the peak, gravity continues exerting an acceleration of 9.8 m/s² downward.',
        damage: 700,
      },
      {
        id: 'q3',
        question: 'If you double the voltage across a fixed resistor, what happens to the electrical power dissipated by heat?',
        options: [
          'Power doubles (2x)',
          'Power quadruples (4x)',
          'Power stays the same',
          'Power is halved (1/2)',
        ],
        correctAnswer: 'Power quadruples (4x)',
        explanation: 'Power = V² / R. Since voltage is squared, doubling voltage increases power by 2² = 4 times.',
        damage: 750,
      },
    ],
  },
  {
    id: 'boss-2',
    name: 'The Polynomial Leviathan',
    title: 'Devourer of Algebraic Roots',
    subject: 'Mathematics',
    maxHp: 1800,
    avatar: '🐉',
    element: 'Quadratic Curves',
    description: 'Rules the quadratic depths, attacking whenever negative signs are distributed carelessly.',
    rewardXP: 250,
    badgeTitle: 'Leviathan Conqueror (Math)',
    questions: [
      {
        id: 'q1',
        question: 'Factor the quadratic expression: x² - 7x - 18',
        options: [
          '(x - 9)(x + 2)',
          '(x + 9)(x - 2)',
          '(x - 6)(x - 3)',
          '(x - 18)(x + 1)',
        ],
        correctAnswer: '(x - 9)(x + 2)',
        explanation: 'We need two numbers whose product is -18 and sum is -7. These are -9 and +2. Thus (x - 9)(x + 2).',
        damage: 600,
      },
      {
        id: 'q2',
        question: 'What is the discriminant of 2x² - 4x + 5 = 0, and what does it tell you about the roots?',
        options: [
          'Δ = -24 (two complex/imaginary roots)',
          'Δ = +24 (two distinct real roots)',
          'Δ = 0 (one repeated real root)',
          'Δ = -14 (no solution at all)',
        ],
        correctAnswer: 'Δ = -24 (two complex/imaginary roots)',
        explanation: 'Δ = b² - 4ac = (-4)² - 4(2)(5) = 16 - 40 = -24. Because Δ < 0, there are no real roots, only two complex conjugate roots.',
        damage: 650,
      },
      {
        id: 'q3',
        question: 'If the parabola y = -3(x - 2)² + 8 has a vertex, what are its coordinates and is it a maximum or minimum?',
        options: [
          'Vertex at (2, 8), Maximum value of 8',
          'Vertex at (-2, 8), Minimum value of 8',
          'Vertex at (2, -8), Maximum value of 8',
          'Vertex at (0, 8), Minimum value of 8',
        ],
        correctAnswer: 'Vertex at (2, 8), Maximum value of 8',
        explanation: 'In vertex form y = a(x - h)² + k, the vertex is (h, k) = (2, 8). Since a = -3 is negative, the parabola opens downward, meaning (2, 8) is a global maximum.',
        damage: 650,
      },
    ],
  },
];

export const BossBattles: React.FC<BossBattlesProps> = ({ onAddXP }) => {
  const [selectedBossIdx, setSelectedBossIdx] = useState<number>(0);
  const boss = BOSSES[selectedBossIdx];

  // Battle State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [bossHp, setBossHp] = useState(boss.maxHp);
  const [playerHp, setPlayerHp] = useState(100);
  const [comboStreak, setComboStreak] = useState(0);
  const [battleStatus, setBattleStatus] = useState<'intro' | 'fighting' | 'won' | 'lost'>('intro');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);

  const startBattle = () => {
    setBossHp(boss.maxHp);
    setPlayerHp(100);
    setComboStreak(0);
    setCurrentQuestionIdx(0);
    setFeedback(null);
    setSelectedOption(null);
    setBattleStatus('fighting');
    soundFX.playPop();
  };

  const handleSelectAnswer = (option: string) => {
    if (selectedOption !== null) return; // prevent multiple clicks
    setSelectedOption(option);

    const question = boss.questions[currentQuestionIdx];
    const isCorrect = option === question.correctAnswer;

    if (isCorrect) {
      soundFX.playSuccess();
      const newCombo = comboStreak + 1;
      setComboStreak(newCombo);
      const critMultiplier = newCombo >= 2 ? 1.5 : 1.0;
      const totalDamage = Math.round(question.damage * critMultiplier);

      const newBossHp = Math.max(0, bossHp - totalDamage);
      setBossHp(newBossHp);

      setFeedback({
        isCorrect: true,
        text: `CRITICAL HIT! You dealt ${totalDamage} DMG${newCombo >= 2 ? ' (Combo x' + critMultiplier + ')' : ''}! ${question.explanation}`,
      });

      if (newBossHp <= 0) {
        setTimeout(() => {
          setBattleStatus('won');
          onAddXP(boss.rewardXP);
          triggerCelebration();
        }, 1200);
      }
    } else {
      soundFX.playPop();
      setComboStreak(0);
      const newPlayerHp = Math.max(0, playerHp - 35);
      setPlayerHp(newPlayerHp);

      setFeedback({
        isCorrect: false,
        text: `BOSS RETALIATION! The boss absorbed your attack and dealt 35 damage! Correct answer: ${question.correctAnswer}. ${question.explanation}`,
      });

      if (newPlayerHp <= 0) {
        setTimeout(() => {
          setBattleStatus('lost');
        }, 1200);
      }
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIdx + 1 < boss.questions.length) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setSelectedOption(null);
      setFeedback(null);
    } else if (bossHp > 0) {
      // Loop or finish
      setCurrentQuestionIdx(0);
      setSelectedOption(null);
      setFeedback(null);
    }
  };

  const currentQ = boss.questions[currentQuestionIdx];
  const bossHpPercent = Math.max(0, Math.round((bossHp / boss.maxHp) * 100));

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-700 via-purple-700 to-indigo-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-rose-200">
              <Swords className="w-3.5 h-3.5 text-amber-300" />
              <span>High-Stakes Chapter Boss Battles</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Knowledge Boss Battles 👾
            </h1>
            <p className="text-xs sm:text-sm text-rose-100 leading-relaxed">
              Test your mastery under pressure! Answer difficult conceptual questions to drain the Boss's HP. Earn rare slayer badges and massive XP loot.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl">
              ⚔️
            </div>
            <div>
              <p className="text-[10px] font-bold text-rose-200 uppercase">Victory Reward</p>
              <p className="text-sm font-black text-white">+{boss.rewardXP} XP & Rare Badge</p>
            </div>
          </div>
        </div>
      </div>

      {/* Boss Selector (when in intro) */}
      {battleStatus === 'intro' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BOSSES.map((b, idx) => (
              <div
                key={b.id}
                onClick={() => {
                  setSelectedBossIdx(idx);
                  soundFX.playPop();
                }}
                className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                  selectedBossIdx === idx
                    ? 'bg-gradient-to-br from-purple-50/80 to-rose-50/60 dark:from-purple-950/40 dark:to-rose-950/30 border-2 border-purple-500 shadow-md ring-2 ring-purple-400/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950/80 flex items-center justify-center text-3xl shadow-inner">
                      {b.avatar}
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {b.subject}
                      </span>
                      <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
                        {b.name}
                      </h3>
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-bold">
                        {b.title}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/50 px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-900">
                    {b.maxHp} HP
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {b.description}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-slate-500">Reward: +{b.rewardXP} XP</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    Select Boss <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-4">
            <button
              onClick={startBattle}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-black text-base shadow-xl transition active:scale-95 inline-flex items-center gap-2.5 cursor-pointer"
            >
              <Swords className="w-5 h-5" />
              <span>Enter Battle Arena vs {boss.name}</span>
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE BATTLE ARENA */}
      {battleStatus === 'fighting' && (
        <div className="space-y-6">
          {/* Combat HUD (Boss HP vs Player HP) */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl text-white space-y-4">
            {/* Boss Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{boss.avatar}</span>
                  <div>
                    <span className="text-slate-100 font-black">{boss.name}</span>
                    <span className="text-[10px] text-purple-400 ml-2">[{boss.element}]</span>
                  </div>
                </div>
                <span className="font-mono text-rose-400 font-black">
                  {bossHp} / {boss.maxHp} HP ({bossHpPercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden border border-slate-700 p-0.5">
                <div
                  className="bg-gradient-to-r from-rose-600 to-red-500 h-full rounded-full transition-all duration-500 shadow-md"
                  style={{ width: `${bossHpPercent}%` }}
                />
              </div>
            </div>

            {/* Divider with Combo Multiplier */}
            <div className="flex items-center justify-between py-1 text-xs border-y border-slate-800">
              <div className="flex items-center gap-1.5 font-bold">
                <Flame className={`w-4 h-4 ${comboStreak >= 2 ? 'text-amber-400 animate-bounce' : 'text-slate-500'}`} />
                <span>Combo Streak: </span>
                <span className={`font-black ${comboStreak >= 2 ? 'text-amber-400' : 'text-slate-300'}`}>
                  {comboStreak}x {comboStreak >= 2 ? '(Critical 1.5x Dmg Active!)' : ''}
                </span>
              </div>
              <span className="text-slate-400 font-mono">
                Phase Question {currentQuestionIdx + 1} of {boss.questions.length}
              </span>
            </div>

            {/* Player HP Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-1.5 text-cyan-300">
                  <Shield className="w-4 h-4" />
                  <span>Student Shield & Health</span>
                </div>
                <span className="font-mono text-cyan-400 font-black">{playerHp} / 100 HP</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700 p-0.5">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${playerHp}%` }}
                />
              </div>
            </div>
          </div>

          {/* Question Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <div>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                Strike Question #{currentQuestionIdx + 1}
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1 leading-relaxed">
                {currentQ.question}
              </h3>
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              {currentQ.options.map((opt, i) => {
                const isChosen = selectedOption === opt;
                const isCorrect = opt === currentQ.correctAnswer;
                let btnStyle = 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100';

                if (selectedOption !== null) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold';
                  } else if (isChosen) {
                    btnStyle = 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-300 font-bold';
                  }
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleSelectAnswer(opt)}
                    disabled={selectedOption !== null}
                    className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm transition cursor-pointer flex items-center justify-between gap-3 ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 shrink-0 font-bold">
                      {String.fromCharCode(65 + i)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Feedback & Next Button */}
            {feedback && (
              <div
                className={`p-4 rounded-2xl border space-y-3 animate-fadeIn ${
                  feedback.isCorrect
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200'
                }`}
              >
                <p className="text-xs sm:text-sm leading-relaxed font-medium">
                  {feedback.text}
                </p>

                {bossHp > 0 && playerHp > 0 && (
                  <button
                    onClick={nextQuestion}
                    className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>Next Attack Phase</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VICTORY SCREEN */}
      {battleStatus === 'won' && (
        <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-700 text-white shadow-2xl text-center space-y-5 animate-fadeIn">
          <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md mx-auto flex items-center justify-center text-4xl shadow-inner">
            🏆
          </div>
          <div className="space-y-1">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-200">
              Boss Vanquished
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Victory! You Defeated {boss.name}!
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-md mx-auto">
              Your conceptual mastery conquered the boss challenge. You earned massive XP loot and the exclusive title badge!
            </p>
          </div>

          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/20">
            <Award className="w-5 h-5 text-amber-300" />
            <div className="text-left">
              <p className="text-[10px] text-emerald-200 font-bold uppercase">Badge Unlocked</p>
              <p className="text-xs font-black text-white">{boss.badgeTitle} (+{boss.rewardXP} XP)</p>
            </div>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => setBattleStatus('intro')}
              className="px-6 py-2.5 rounded-xl bg-white text-emerald-900 font-black text-xs shadow-md transition active:scale-95 cursor-pointer"
            >
              Choose Another Boss
            </button>
          </div>
        </div>
      )}

      {/* DEFEAT SCREEN */}
      {battleStatus === 'lost' && (
        <div className="p-8 rounded-3xl bg-gradient-to-br from-rose-900 via-slate-900 to-black text-white shadow-2xl text-center space-y-5 animate-fadeIn">
          <div className="w-20 h-20 rounded-3xl bg-rose-500/20 mx-auto flex items-center justify-center text-4xl">
            💀
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Shield Depleted!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
              The {boss.name} overwhelmed your defenses with conceptual traps. Review the chapter formulas in AI Learn and try again!
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={startBattle}
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Boss Battle</span>
            </button>
            <button
              onClick={() => setBattleStatus('intro')}
              className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer"
            >
              Select Different Boss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
