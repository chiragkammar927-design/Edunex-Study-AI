import React, { useState, useEffect } from 'react';
import {
  initialStudentProfile,
  initialDailyMission,
  initialWeaknesses,
  initialChapters,
  initialFlashcards,
  initialSchedule,
  initialSnapStudyDrafts,
} from './data/sampleData';
import {
  StudentProfile,
  DailyMission,
  WeaknessItem,
  SyllabusChapter,
  Flashcard,
  StudyPlanSchedule,
  SubjectType,
  QuizResult,
  StudyCircle,
  LearningChallenge,
  SnapStudyDraft,
} from './types';
import { initialStudyCircles, initialLearningChallenges } from './data/sampleCirclesData';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AiStudyCoach } from './components/AiStudyCoach';
import { WeaknessDetector } from './components/WeaknessDetector';
import { SnapStudy } from './components/SnapStudy';
import { AiLearn } from './components/AiLearn';
import { QuizGenerator } from './components/QuizGenerator';
import { MemoryRevision } from './components/MemoryRevision';
import { StudyPlanner } from './components/StudyPlanner';
import { StudyCircles } from './components/StudyCircles';
import { AiVideoStudio } from './components/AiVideoStudio';
import { LearningMap } from './components/LearningMap';
import { LearningPathways } from './components/LearningPathways';
import { Analytics } from './components/Analytics';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';
import { UpgradeModal } from './components/UpgradeModal';
import { TeachMeBack } from './components/TeachMeBack';
import { VirtualLab } from './components/VirtualLab';
import { BossBattles } from './components/BossBattles';
import { QuickNoteFAB } from './components/QuickNoteFAB';
import { QuickNoteModal } from './components/QuickNoteModal';
import { AuthModal } from './components/AuthModal';
import { triggerCelebration, soundFX } from './utils/soundOrConfetti';
import { User } from 'firebase/auth';
import {
  testFirestoreConnection,
  signInWithGoogle,
  signOutUser,
  subscribeAuthState,
  syncUserProfileToFirestore,
  subscribeUserProfile,
  syncWeaknessesToFirestore,
  subscribeWeaknesses,
  syncFlashcardsToFirestore,
  subscribeFlashcards,
  saveSnapNoteToFirestore,
  subscribeSnapNotes,
} from './services/firebase';

export default function App() {
  // Firebase Authentication & Cloud State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Application State
  const [profile, setProfile] = useState<StudentProfile>(() => {
    const saved = localStorage.getItem('nexora_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.subscription) {
          parsed.subscription = initialStudentProfile.subscription;
        }
        return parsed;
      } catch {
        return initialStudentProfile;
      }
    }
    return initialStudentProfile;
  });

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const [dailyMission, setDailyMission] = useState<DailyMission>(() => {
    const saved = localStorage.getItem('nexora_mission');
    return saved ? JSON.parse(saved) : initialDailyMission;
  });

  const [weaknesses, setWeaknesses] = useState<WeaknessItem[]>(() => {
    const saved = localStorage.getItem('nexora_weaknesses');
    return saved ? JSON.parse(saved) : initialWeaknesses;
  });

  const [chapters, setChapters] = useState<SyllabusChapter[]>(() => {
    const saved = localStorage.getItem('nexora_chapters');
    return saved ? JSON.parse(saved) : initialChapters;
  });

  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => {
    const saved = localStorage.getItem('nexora_flashcards');
    return saved ? JSON.parse(saved) : initialFlashcards;
  });

  const [schedule, setSchedule] = useState<StudyPlanSchedule[]>(() => {
    const saved = localStorage.getItem('nexora_schedule');
    return saved ? JSON.parse(saved) : initialSchedule;
  });

  const [studyCircles, setStudyCircles] = useState<StudyCircle[]>(() => {
    const saved = localStorage.getItem('novastudy_circles');
    return saved ? JSON.parse(saved) : initialStudyCircles;
  });

  const [learningChallenges, setLearningChallenges] = useState<LearningChallenge[]>(() => {
    const saved = localStorage.getItem('novastudy_challenges');
    return saved ? JSON.parse(saved) : initialLearningChallenges;
  });

  const [snapStudyDrafts, setSnapStudyDrafts] = useState<SnapStudyDraft[]>(() => {
    const saved = localStorage.getItem('nexora_snapstudy_drafts');
    return saved ? JSON.parse(saved) : initialSnapStudyDrafts;
  });

  const [isQuickNoteModalOpen, setIsQuickNoteModalOpen] = useState(false);
  const [activeDraftToLoad, setActiveDraftToLoad] = useState<SnapStudyDraft | null>(null);

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [appName, setAppName] = useState<string>(() => {
    const saved = localStorage.getItem('app_name');
    if (
      !saved ||
      saved.toLowerCase().includes('edunex') ||
      saved.toLowerCase().includes('novastudy') ||
      saved === 'NovaStudy AI' ||
      saved === 'EduNex' ||
      saved === 'EduNex AI' ||
      saved === 'EduNex study ai'
    ) {
      localStorage.setItem('app_name', 'NEXORA STUDY AI');
      return 'NEXORA STUDY AI';
    }
    return saved;
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('nexora_theme');
    return saved ? saved === 'dark' : true;
  });

  // Cross-component contextual parameters
  const [coachContext, setCoachContext] = useState<{ subject: SubjectType; topic: string }>({
    subject: 'Mathematics',
    topic: 'Quadratic Equations',
  });
  const [quizContext, setQuizContext] = useState<{ subject: SubjectType; chapter: string }>({
    subject: 'Mathematics',
    chapter: 'Quadratic Equations',
  });
  const [learnSubject, setLearnSubject] = useState<SubjectType>('Mathematics');
  const [learnChapterTitle, setLearnChapterTitle] = useState<string>('');
  const [memorySubject, setMemorySubject] = useState<string>('all');
  const [activeDrillId, setActiveDrillId] = useState<string | null>(null);

  // Synchronized Dashboard Subject filter state
  const [dashboardSubject, setDashboardSubject] = useState<SubjectType | 'all'>(() => {
    const saved = localStorage.getItem('novastudy_dashboard_subject');
    return (saved as SubjectType | 'all') || 'all';
  });

  const handleSelectDashboardSubject = (subj: SubjectType | 'all') => {
    setDashboardSubject(subj);
    localStorage.setItem('novastudy_dashboard_subject', subj);
  };

  // Sync document title and local storage with appName
  useEffect(() => {
    if (appName.toLowerCase().includes('edunex')) {
      setAppName('NEXORA STUDY AI');
      localStorage.setItem('app_name', 'NEXORA STUDY AI');
      document.title = 'NEXORA STUDY AI – Your Personal Learning Companion';
      return;
    }
    document.title = `${appName} – Your Personal Learning Companion`;
    localStorage.setItem('app_name', appName);
  }, [appName]);

  // Sync Dark Mode class with HTML root
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('nexora_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('nexora_theme', 'light');
    }
  }, [isDarkMode]);

  // Firebase Initialization & Real-time Cloud Synchronization
  useEffect(() => {
    // 1. Connectivity test on startup
    testFirestoreConnection().catch((err) =>
      console.warn('[Firebase] Initial connection check:', err)
    );

    // 2. Auth state subscription
    const unsubscribeAuth = subscribeAuthState((user) => {
      setCurrentUser(user);
      if (user) {
        console.log('[Firebase] Active session for user:', user.uid);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // When user signs in, attach real-time snapshot listeners for profile, weaknesses, flashcards, and notes
  useEffect(() => {
    if (!currentUser) return;

    // A. Subscribe to UserProfile in Firestore
    const unsubProfile = subscribeUserProfile(currentUser.uid, (cloudProfile) => {
      if (cloudProfile) {
        setProfile((prev) => ({
          ...prev,
          name: cloudProfile.name || prev.name,
          email: cloudProfile.email || prev.email,
          avatar: cloudProfile.avatar || prev.avatar,
          level: cloudProfile.level ?? prev.level,
          xp: cloudProfile.xp ?? prev.xp,
          streakDays: cloudProfile.streakDays ?? prev.streakDays,
          todayStudyMinutes: cloudProfile.todayStudyMinutes ?? prev.todayStudyMinutes,
          todayGoalMinutes: cloudProfile.todayGoalMinutes ?? prev.todayGoalMinutes,
          xpToNextLevel: cloudProfile.xpToNextLevel ?? prev.xpToNextLevel,
          grade: cloudProfile.grade || prev.grade,
        }));
      } else {
        // First time cloud sync for this user: populate firestore with current profile
        syncUserProfileToFirestore(currentUser.uid, profile).catch((err) =>
          console.error('[Firebase] Initial profile upload failed:', err)
        );
      }
    });

    // B. Subscribe to Weaknesses
    const unsubWeaknesses = subscribeWeaknesses(currentUser.uid, (cloudWeaknesses) => {
      if (cloudWeaknesses && cloudWeaknesses.length > 0) {
        setWeaknesses(cloudWeaknesses);
      }
    });

    // C. Subscribe to Flashcards
    const unsubFlashcards = subscribeFlashcards(currentUser.uid, (cloudFlashcards) => {
      if (cloudFlashcards && cloudFlashcards.length > 0) {
        setFlashcards(cloudFlashcards);
      }
    });

    // D. Subscribe to SnapNotes
    const unsubNotes = subscribeSnapNotes(currentUser.uid, (cloudNotes) => {
      if (cloudNotes && cloudNotes.length > 0) {
        setSnapStudyDrafts((prev) => {
          // Merge avoiding duplicates
          const ids = new Set(cloudNotes.map((n) => n.id));
          return [...cloudNotes, ...prev.filter((d) => !ids.has(d.id))];
        });
      }
    });

    return () => {
      unsubProfile();
      unsubWeaknesses();
      unsubFlashcards();
      unsubNotes();
    };
  }, [currentUser]);

  // Handle Manual Full Cloud Sync
  const handleManualCloudSync = async () => {
    if (!currentUser) {
      soundFX.playPop();
      await handleSignIn();
      return;
    }
    setIsCloudSyncing(true);
    try {
      await Promise.all([
        syncUserProfileToFirestore(currentUser.uid, profile),
        syncWeaknessesToFirestore(currentUser.uid, weaknesses),
        syncFlashcardsToFirestore(currentUser.uid, flashcards),
      ]);
      soundFX.playSuccess();
      triggerCelebration();
    } catch (err) {
      console.error('[Firebase] Manual sync error:', err);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleSignIn = async () => {
    try {
      const user = await signInWithGoogle();
      if (user) {
        setCurrentUser(user);
        soundFX.playSuccess();
      }
    } catch (err) {
      console.error('[Firebase] Google sign in failed:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setCurrentUser(null);
      soundFX.playPop();
    } catch (err) {
      console.error('[Firebase] Sign out failed:', err);
    }
  };

  // Persist State to local storage
  useEffect(() => {
    localStorage.setItem('nexora_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('nexora_mission', JSON.stringify(dailyMission));
  }, [dailyMission]);

  useEffect(() => {
    localStorage.setItem('nexora_weaknesses', JSON.stringify(weaknesses));
  }, [weaknesses]);

  useEffect(() => {
    localStorage.setItem('nexora_flashcards', JSON.stringify(flashcards));
  }, [flashcards]);

  useEffect(() => {
    localStorage.setItem('nexora_schedule', JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem('novastudy_circles', JSON.stringify(studyCircles));
  }, [studyCircles]);

  useEffect(() => {
    localStorage.setItem('novastudy_challenges', JSON.stringify(learningChallenges));
  }, [learningChallenges]);

  useEffect(() => {
    localStorage.setItem('nexora_snapstudy_drafts', JSON.stringify(snapStudyDrafts));
  }, [snapStudyDrafts]);

  const handleSaveDraft = (draft: SnapStudyDraft, openInSnapStudy: boolean = false) => {
    setSnapStudyDrafts((prev) => [draft, ...prev.filter((d) => d.id !== draft.id)]);
    if (currentUser) {
      saveSnapNoteToFirestore(currentUser.uid, draft).catch((err) =>
        console.error('[Firebase] Save note failed:', err)
      );
    }
    if (openInSnapStudy) {
      setActiveDraftToLoad(draft);
      setCurrentTab('snapstudy');
    }
  };

  const handleDeleteDraft = (draftId: string) => {
    setSnapStudyDrafts((prev) => prev.filter((d) => d.id !== draftId));
  };

  // Handler: Add XP and manage level up
  const handleAddXP = (amount: number) => {
    setProfile((prev) => {
      const newXp = prev.xp + amount;
      let newLevel = prev.level;
      let newGoal = prev.xpToNextLevel;

      if (newXp >= prev.xpToNextLevel) {
        newLevel += 1;
        newGoal = prev.xpToNextLevel + 1000;
        triggerCelebration();
        soundFX.playSuccess();
      }

      const updated = {
        ...prev,
        xp: newXp,
        level: newLevel,
        xpToNextLevel: newGoal,
      };

      if (currentUser) {
        syncUserProfileToFirestore(currentUser.uid, updated).catch((err) =>
          console.error('[Firebase] Sync XP failed:', err)
        );
      }

      return updated;
    });
  };

  // Handler: Add Study Minutes and trigger celebration when daily goal is reached
  const handleAddStudyMinutes = (minutes: number) => {
    setProfile((prev) => {
      const wasCompleted = prev.todayStudyMinutes >= prev.todayGoalMinutes;
      const newMinutes = prev.todayStudyMinutes + minutes;
      const isNowCompleted = newMinutes >= prev.todayGoalMinutes;

      let newStreak = prev.streakDays;
      if (!wasCompleted && isNowCompleted) {
        newStreak = prev.streakDays + 1;
        triggerCelebration();
        soundFX.playSuccess();
      }

      const updated = {
        ...prev,
        todayStudyMinutes: newMinutes,
        streakDays: newStreak,
      };

      if (currentUser) {
        syncUserProfileToFirestore(currentUser.uid, updated).catch((err) =>
          console.error('[Firebase] Sync minutes failed:', err)
        );
      }

      return updated;
    });
  };

  // Handler: Update Daily Goal Target Minutes
  const handleUpdateGoalMinutes = (newGoal: number) => {
    setProfile((prev) => {
      const updated = {
        ...prev,
        todayGoalMinutes: newGoal,
      };
      if (currentUser) {
        syncUserProfileToFirestore(currentUser.uid, updated).catch((err) =>
          console.error('[Firebase] Sync goal failed:', err)
        );
      }
      return updated;
    });
  };

  // Handler: Daily Mission Tasks
  const handleToggleMissionTask = (taskId: string) => {
    setDailyMission((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ),
    }));
  };

  const handleClaimMissionReward = () => {
    if (dailyMission.completed) return;
    handleAddXP(dailyMission.xpReward);
    setDailyMission((prev) => ({ ...prev, completed: true }));
  };

  // Handler: Weakness Resolved
  const handleResolveWeakness = (weaknessId: string) => {
    setWeaknesses((prev) => {
      const remaining = prev.filter((w) => w.id !== weaknessId);
      if (currentUser) {
        syncWeaknessesToFirestore(currentUser.uid, remaining).catch((err) =>
          console.error('[Firebase] Sync weaknesses failed:', err)
        );
      }
      return remaining;
    });
    setProfile((prev) => ({
      ...prev,
      overallMastery: Math.min(100, prev.overallMastery + 3),
    }));
  };

  // Handler: Schedule Task Toggle
  const handleToggleScheduleTask = (scheduleId: string, taskId: string) => {
    setSchedule((prev) =>
      prev.map((day) => {
        if (day.id !== scheduleId) return day;
        return {
          ...day,
          tasks: day.tasks.map((t) =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
          ),
        };
      })
    );
  };

  // Handler: Auto Rebalance
  const handleAutoRebalance = () => {
    setSchedule((prev) =>
      prev.map((day) => ({
        ...day,
        tasks: day.tasks.map((t) => ({ ...t, priority: 'medium' })),
      }))
    );
  };

  // Handler: Add Flashcards from SnapStudy or Custom
  const handleAddFlashcards = (
    newCards: { front: string; back: string; subject: SubjectType; chapter: string }[]
  ) => {
    const formatted: Flashcard[] = newCards.map((c, i) => ({
      id: `fc-snap-${Date.now()}-${i}`,
      front: c.front,
      back: c.back,
      subject: c.subject,
      chapter: c.chapter,
      nextReviewDate: 'Today',
      intervalDays: 1,
      repetitions: 0,
      easeFactor: 2.5,
      status: 'learning',
    }));

    setFlashcards((prev) => {
      const updated = [...formatted, ...prev];
      if (currentUser) {
        syncFlashcardsToFirestore(currentUser.uid, updated).catch((err) =>
          console.error('[Firebase] Sync flashcards failed:', err)
        );
      }
      return updated;
    });
  };

  // Handler: Flashcard Review Rating (Spaced Repetition algorithm)
  const handleReviewFlashcard = (cardId: string, rating: 'again' | 'hard' | 'good' | 'easy') => {
    setFlashcards((prev) => {
      const updated = prev.map((card) => {
        if (card.id !== cardId) return card;
        let newInterval = 1;
        let newStatus: Flashcard['status'] = card.status;

        if (rating === 'again') {
          newInterval = 1;
          newStatus = 'learning';
        } else if (rating === 'hard') {
          newInterval = Math.max(1, Math.round(card.intervalDays * 1.2));
        } else if (rating === 'good') {
          newInterval = Math.round(card.intervalDays * 2.5);
          if (newInterval >= 14) newStatus = 'review';
        } else if (rating === 'easy') {
          newInterval = Math.round(card.intervalDays * 3.5);
          if (newInterval >= 21) newStatus = 'mastered';
        }

        return {
          ...card,
          intervalDays: newInterval,
          nextReviewDate: `In ${newInterval}d`,
          repetitions: card.repetitions + 1,
          status: newStatus,
        };
      });

      if (currentUser) {
        syncFlashcardsToFirestore(currentUser.uid, updated).catch((err) =>
          console.error('[Firebase] Sync flashcards on review failed:', err)
        );
      }
      return updated;
    });
  };

  // Handler: Record Quiz Results into Weakness Detector & Profile
  const handleRecordQuizResult = (result: QuizResult) => {
    if (result.mistakeAnalysis.length > 0) {
      const topMistake = result.mistakeAnalysis[0];
      const newWeakness: WeaknessItem = {
        id: `weak-${Date.now()}`,
        subject: result.subject,
        chapter: topMistake.conceptToReview,
        subtopic: 'Quiz Misconception',
        weaknessLabel: `Review ${topMistake.conceptToReview}`,
        score: result.correctCount,
        maxScore: result.totalQuestions,
        confidence: result.percentage < 50 ? 'Critical' : 'Low',
        recommendedPracticeMinutes: 10,
        rootCause: topMistake.whyWrong,
        sampleMistake: `Chose: ${topMistake.yourAnswer} instead of ${topMistake.correctAnswer}`,
        practiceQuestions: [],
      };

      setWeaknesses((prev) => [newWeakness, ...prev]);
    }
  };

  // Quick navigation helpers
  const handleOpenCoachWithTopic = (subject: SubjectType, topic: string) => {
    setCoachContext({ subject, topic });
    setCurrentTab('coach');
  };

  const handleOpenQuizWithTopic = (subject: SubjectType, chapter: string) => {
    setQuizContext({ subject, chapter });
    setCurrentTab('quiz');
  };

  const handleOpenWeaknessDrill = (weaknessId: string) => {
    setActiveDrillId(weaknessId);
    setCurrentTab('weakness');
  };

  const handleOpenLesson = (subject: SubjectType, chapterTitle: string) => {
    setLearnSubject(subject);
    setLearnChapterTitle(chapterTitle);
    setCurrentTab('learn');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenFlashcardDeck = (subject: SubjectType, chapterTitle: string) => {
    setMemorySubject(subject);
    setCurrentTab('memory');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Study Circles & Challenges handlers
  const handleToggleJoinCircle = (circleId: string) => {
    setStudyCircles((prev) =>
      prev.map((c) => {
        if (c.id === circleId) {
          const nextJoined = !c.joined;
          return {
            ...c,
            joined: nextJoined,
            membersCount: nextJoined ? c.membersCount + 1 : Math.max(1, c.membersCount - 1),
          };
        }
        return c;
      })
    );
  };

  const handleJoinChallenge = (challengeId: string) => {
    setLearningChallenges((prev) =>
      prev.map((ch) => {
        if (ch.id === challengeId) {
          return {
            ...ch,
            joined: true,
            participantsCount: ch.participantsCount + 1,
          };
        }
        return ch;
      })
    );
  };

  const handleLogChallengeProgress = (challengeId: string) => {
    setLearningChallenges((prev) =>
      prev.map((ch) => {
        if (ch.id === challengeId) {
          const nextCount = Math.min(ch.targetCount, ch.currentCount + (ch.unit === 'Questions' ? 5 : 1));
          const isNowCompleted = nextCount >= ch.targetCount;
          // Update user's points on the leaderboard
          const updatedLeaderboard = ch.leaderboard.map((entry) => {
            if (entry.isUser) {
              return {
                ...entry,
                points: entry.points + 50,
                streak: entry.streak + 1,
              };
            }
            return entry;
          });

          // Sort leaderboard by points descending and reassign rank
          updatedLeaderboard.sort((a, b) => b.points - a.points);
          const reRanked = updatedLeaderboard.map((item, idx) => ({ ...item, rank: idx + 1 }));

          return {
            ...ch,
            currentCount: nextCount,
            completed: isNowCompleted,
            leaderboard: reRanked,
          };
        }
        return ch;
      })
    );
  };

  const handleCreateCircle = (
    newCircle: Omit<StudyCircle, 'id' | 'membersCount' | 'activeNowCount' | 'streakDays' | 'joined'>
  ) => {
    const created: StudyCircle = {
      ...newCircle,
      id: `circle-${Date.now()}`,
      membersCount: 1,
      activeNowCount: 1,
      streakDays: 1,
      joined: true,
    };
    setStudyCircles((prev) => [created, ...prev]);
  };

  const handleUpgradeSuccess = (planName: string, pricePaid: number) => {
    setProfile((prev) => {
      const updated: StudentProfile = {
        ...prev,
        subscription: {
          ...(prev.subscription || initialStudentProfile.subscription!),
          status: 'pro',
          planName,
          isUpgraded: true,
          priceStartingFrom: pricePaid,
          trialEndDate: 'Active Lifetime / Auto-Renewing',
        },
        badges: [
          {
            id: `pro-badge-${Date.now()}`,
            title: 'Pro Scholar VIP',
            description: `Unlocked full AI superpower subscription starting from $${pricePaid}`,
            icon: '👑',
            rarity: 'legendary',
            unlockedAt: 'Today',
          },
          ...prev.badges,
        ],
      };
      return updated;
    });
  };

  const dueCardsCount = flashcards.filter(
    (c) => c.nextReviewDate <= 'Today' || c.nextReviewDate === 'Immediate'
  ).length;

  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation Bar */}
      <Navbar
        profile={profile}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onToggleMobileNav={() => setMobileNavOpen(!mobileNavOpen)}
        onOpenProfile={() => setCurrentTab('profile')}
        onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
        appName={appName}
        onRenameApp={(name) => setAppName(name)}
        currentUser={currentUser}
        onSignIn={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        isCloudSynced={!!currentUser}
      />

      {/* Main Content Viewport with Sticky Sidebar */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-2 sm:px-4 md:px-6">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
          weaknessCount={weaknesses.length}
          dueCardsCount={dueCardsCount}
          appName={appName}
          profile={profile}
          onAddStudyMinutes={handleAddStudyMinutes}
          onUpdateGoalMinutes={handleUpdateGoalMinutes}
        />

        {/* View Router Canvas */}
        <main className="flex-1 min-w-0 py-4 sm:py-6 md:pl-6">
          {currentTab === 'dashboard' && (
            <Dashboard
              profile={profile}
              dailyMission={dailyMission}
              weaknesses={weaknesses}
              chapters={chapters}
              flashcards={flashcards}
              schedule={schedule}
              selectedSubject={dashboardSubject}
              onSelectSubject={handleSelectDashboardSubject}
              onNavigate={(tab) => setCurrentTab(tab)}
              onToggleMissionTask={handleToggleMissionTask}
              onClaimMissionReward={handleClaimMissionReward}
              onOpenWeaknessDrill={handleOpenWeaknessDrill}
              onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
              onAddStudyMinutes={handleAddStudyMinutes}
              onOpenLesson={handleOpenLesson}
              onOpenFlashcardDeck={handleOpenFlashcardDeck}
              onToggleScheduleTask={handleToggleScheduleTask}
              onAddXP={handleAddXP}
            />
          )}

          {currentTab === 'coach' && (
            <AiStudyCoach
              initialSubject={coachContext.subject}
              initialTopic={coachContext.topic}
              onNavigateToPractice={() => setCurrentTab('quiz')}
            />
          )}

          {currentTab === 'aivideo' && (
            <AiVideoStudio
              profile={profile}
              onAddXP={handleAddXP}
              onSaveToFlashcards={handleAddFlashcards}
              onAddStudyMinutes={handleAddStudyMinutes}
            />
          )}

          {currentTab === 'weakness' && (
            <WeaknessDetector
              weaknesses={weaknesses}
              onResolveWeakness={handleResolveWeakness}
              onAddXP={handleAddXP}
              activeDrillId={activeDrillId}
            />
          )}

          {currentTab === 'teachme' && (
            <TeachMeBack
              onAddXP={handleAddXP}
              onNavigateToLearn={() => setCurrentTab('learn')}
            />
          )}

          {currentTab === 'battles' && (
            <BossBattles
              onAddXP={handleAddXP}
              onNavigateToLearn={() => setCurrentTab('learn')}
            />
          )}

          {currentTab === 'virtuallab' && (
            <VirtualLab
              onAddXP={handleAddXP}
            />
          )}

          {currentTab === 'snapstudy' && (
            <SnapStudy
              onAddFlashcards={handleAddFlashcards}
              onAddXP={handleAddXP}
              drafts={snapStudyDrafts}
              onDeleteDraft={handleDeleteDraft}
              onOpenQuickNoteModal={() => setIsQuickNoteModalOpen(true)}
              activeDraftToLoad={activeDraftToLoad}
            />
          )}

          {currentTab === 'learn' && (
            <AiLearn
              chapters={chapters}
              onOpenCoachWithTopic={handleOpenCoachWithTopic}
              onOpenQuizWithTopic={handleOpenQuizWithTopic}
              initialSubject={learnSubject}
              initialChapterTitle={learnChapterTitle}
            />
          )}

          {currentTab === 'quiz' && (
            <QuizGenerator
              presetSubject={quizContext.subject}
              presetChapter={quizContext.chapter}
              onAddXP={handleAddXP}
              onRecordQuizResult={handleRecordQuizResult}
            />
          )}

          {currentTab === 'memory' && (
            <MemoryRevision
              cards={flashcards}
              onReviewCard={handleReviewFlashcard}
              onAddCustomCard={(c) => handleAddFlashcards([c])}
              onAddXP={handleAddXP}
              initialSubject={memorySubject}
            />
          )}

          {currentTab === 'planner' && (
            <StudyPlanner
              schedule={schedule}
              onToggleScheduleTask={handleToggleScheduleTask}
              onAutoRebalance={handleAutoRebalance}
              onAddXP={handleAddXP}
            />
          )}

          {currentTab === 'circles' && (
            <StudyCircles
              profile={profile}
              circles={studyCircles}
              challenges={learningChallenges}
              onToggleJoinCircle={handleToggleJoinCircle}
              onJoinChallenge={handleJoinChallenge}
              onLogChallengeProgress={handleLogChallengeProgress}
              onCreateCircle={handleCreateCircle}
              onAddXP={handleAddXP}
              onRecordAttendance={(_title, _sub, duration, xp) => {
                handleAddStudyMinutes(duration);
              }}
            />
          )}

          {currentTab === 'map' && (
            <LearningMap
              chapters={chapters}
              onOpenCoachWithTopic={handleOpenCoachWithTopic}
              onOpenQuizWithTopic={handleOpenQuizWithTopic}
              onAddXP={handleAddXP}
            />
          )}

          {currentTab === 'pathways' && (
            <LearningPathways
              onOpenCoachWithTopic={handleOpenCoachWithTopic}
              onOpenQuizWithTopic={handleOpenQuizWithTopic}
              onOpenLesson={(sub, topic) => {
                setLearnSubject(sub);
                setLearnChapterTitle(topic);
                setCurrentTab('learn');
              }}
              onAddXP={handleAddXP}
            />
          )}

          {currentTab === 'analytics' && (
            <Analytics
              profile={profile}
              weaknesses={weaknesses}
              chapters={chapters}
              selectedSubject={dashboardSubject}
              onSelectSubject={handleSelectDashboardSubject}
              flashcards={flashcards}
              schedule={schedule}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'profile' && (
            <ProfileView
              profile={profile}
              onAddXP={handleAddXP}
              onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
              onAddStudyMinutes={handleAddStudyMinutes}
              currentUser={currentUser}
              onSignInWithGoogle={() => setIsAuthModalOpen(true)}
              onSignOut={handleSignOut}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              isDarkMode={isDarkMode}
              onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
              dailyGoal={profile.todayGoalMinutes}
              onChangeDailyGoal={(mins) =>
                setProfile((prev) => ({ ...prev, todayGoalMinutes: mins }))
              }
              appName={appName}
              onChangeAppName={(name) => setAppName(name)}
              subscription={profile.subscription}
              onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
              currentUser={currentUser}
              onSignInWithGoogle={() => setIsAuthModalOpen(true)}
              onSignOut={handleSignOut}
              onSyncCloud={handleManualCloudSync}
              isSyncing={isCloudSyncing}
              onResetData={() => {
                localStorage.clear();
                window.location.reload();
              }}
            />
          )}
        </main>
      </div>

      {/* Auth / Google Account Connect Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onSignInWithGoogle={handleSignIn}
        onSignOut={handleSignOut}
        appName={appName}
      />

      {/* Upgrade & Free Trial Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        profile={profile}
        onUpgradeSuccess={handleUpgradeSuccess}
      />

      {/* Floating Action Button (FAB) for Quick Fast Notes */}
      <QuickNoteFAB
        onClick={() => setIsQuickNoteModalOpen(true)}
        draftsCount={snapStudyDrafts.length}
      />

      {/* Fast Note Modal */}
      <QuickNoteModal
        isOpen={isQuickNoteModalOpen}
        onClose={() => setIsQuickNoteModalOpen(false)}
        onSaveDraft={handleSaveDraft}
        onAddXP={handleAddXP}
        initialSubject={learnSubject || 'Physics'}
      />
    </div>
  );
}
