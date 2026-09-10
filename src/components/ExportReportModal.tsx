import React, { useState } from 'react';
import {
  StudentProfile,
  WeaknessItem,
  StudyPlanSchedule,
  SubjectType,
  SyllabusChapter,
  DailyMission,
} from '../types';
import {
  Printer,
  Download,
  Copy,
  Check,
  X,
  FileText,
  Calendar,
  AlertTriangle,
  BookOpen,
  Sparkles,
  Sliders,
  Eye,
  Info,
  TrendingUp,
  Award,
  Clock,
  Flame,
  CheckCircle2,
  Layers,
  Zap,
} from 'lucide-react';
import { soundFX } from '../utils/soundOrConfetti';

export type ReportType = 'mastery_progress' | 'comprehensive' | 'schedule' | 'weaknesses';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  schedule: StudyPlanSchedule[];
  weaknesses: WeaknessItem[];
  chapters?: SyllabusChapter[];
  dailyMission?: DailyMission;
  defaultTab?: ReportType;
  initialSubject?: SubjectType | 'all';
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  profile,
  schedule,
  weaknesses,
  chapters = [],
  dailyMission,
  defaultTab = 'mastery_progress',
  initialSubject = 'all',
}) => {
  const [reportType, setReportType] = useState<ReportType>(defaultTab);
  const [selectedSubject, setSelectedSubject] = useState<SubjectType | 'all'>(initialSubject);
  const [includeKPIs, setIncludeKPIs] = useState(true);
  const [includeSubjectMatrix, setIncludeSubjectMatrix] = useState(true);
  const [includeChapterDetails, setIncludeChapterDetails] = useState(true);
  const [includeExamReadiness, setIncludeExamReadiness] = useState(true);
  const [includeWeaknesses, setIncludeWeaknesses] = useState(true);
  const [includeSchedule, setIncludeSchedule] = useState(true);
  const [includeCheckboxes, setIncludeCheckboxes] = useState(true);
  const [includeRemediationTips, setIncludeRemediationTips] = useState(true);
  const [includeNotesSection, setIncludeNotesSection] = useState(true);
  const [includeSignoff, setIncludeSignoff] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Subject filter matching helper
  const isSubjectMatch = (itemSubject: string, filter: SubjectType | 'all'): boolean => {
    if (filter === 'all') return true;
    if (filter === 'Science') {
      return (
        itemSubject === 'Science' ||
        itemSubject === 'Physics' ||
        itemSubject === 'Chemistry' ||
        itemSubject === 'Biology'
      );
    }
    return itemSubject === filter;
  };

  // Filtered datasets based on subject selection
  const filteredSchedule = schedule
    .map((day) => ({
      ...day,
      tasks: day.tasks.filter((t) => isSubjectMatch(t.subject, selectedSubject)),
    }))
    .filter((day) => day.tasks.length > 0);

  const filteredWeaknesses = weaknesses.filter((w) => isSubjectMatch(w.subject, selectedSubject));
  const filteredChapters = chapters.filter((c) => isSubjectMatch(c.subject, selectedSubject));

  const totalScheduledMinutes = filteredSchedule.reduce(
    (sum, day) => sum + day.tasks.reduce((taskSum, t) => taskSum + t.durationMinutes, 0),
    0
  );

  const totalTasksCount = filteredSchedule.reduce((sum, day) => sum + day.tasks.length, 0);

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate subject mastery statistics
  const subjectList: { subject: SubjectType; label: string; defaultMastery: number }[] = [
    { subject: 'Mathematics', label: 'Mathematics', defaultMastery: 74 },
    { subject: 'Physics', label: 'Physics', defaultMastery: 68 },
    { subject: 'Chemistry', label: 'Chemistry', defaultMastery: 81 },
    { subject: 'Biology', label: 'Biology', defaultMastery: 92 },
    { subject: 'Computer Science', label: 'Computer Science', defaultMastery: 88 },
  ];

  const subjectStats = subjectList
    .filter((s) => selectedSubject === 'all' || isSubjectMatch(s.subject, selectedSubject))
    .map((s) => {
      const subjChapters = chapters.filter((c) => isSubjectMatch(c.subject, s.subject));
      const avgMastery =
        subjChapters.length > 0
          ? Math.round(
              subjChapters.reduce((acc, c) => acc + (c.masteryPercentage || 70), 0) /
                subjChapters.length
            )
          : s.defaultMastery;
      const masteredCount = subjChapters.filter(
        (c) => c.mastery === 'mastered' || (c.masteryPercentage && c.masteryPercentage >= 85)
      ).length;
      const avgAccuracy =
        subjChapters.length > 0
          ? Math.round(
              subjChapters.reduce((acc, c) => acc + (c.quizAccuracy || 75), 0) /
                subjChapters.length
            )
          : 76;
      const totalHours = subjChapters.reduce((acc, c) => acc + (c.studyHours || 4.5), 0);
      const weakCount = weaknesses.filter((w) => isSubjectMatch(w.subject, s.subject)).length;

      return {
        ...s,
        mastery: avgMastery,
        totalChapters: subjChapters.length || 6,
        masteredChapters: masteredCount || Math.floor(avgMastery / 18),
        avgAccuracy,
        totalHours: Number(totalHours.toFixed(1)) || 12.5,
        weakCount,
        status:
          avgMastery >= 85 ? 'Mastered' : avgMastery >= 70 ? 'Advancing' : 'Needs Review',
      };
    });

  // Upcoming Exams
  const upcomingExams = [
    {
      id: 'e1',
      title: 'Physics Midterm: Dynamics, Forces & Energy Fields',
      subject: 'Physics' as SubjectType,
      date: 'In 4 Days',
      readiness: 72,
      urgency: 'High',
    },
    {
      id: 'e2',
      title: 'Mathematics Assessment: Differential Calculus & Vectors',
      subject: 'Mathematics' as SubjectType,
      date: 'In 9 Days',
      readiness: 78,
      urgency: 'Medium',
    },
    {
      id: 'e3',
      title: 'Chemistry Lab Practical: Redox Reactions & Stoichiometry',
      subject: 'Chemistry' as SubjectType,
      date: 'In 14 Days',
      readiness: 84,
      urgency: 'Normal',
    },
    {
      id: 'e4',
      title: 'Biology Unit Exam: Cellular Respiration & Genetics',
      subject: 'Biology' as SubjectType,
      date: 'In 18 Days',
      readiness: 94,
      urgency: 'Normal',
    },
  ].filter((e) => selectedSubject === 'all' || isSubjectMatch(e.subject, selectedSubject));

  // Overall calculations
  const overallMasteryValue = profile.overallMastery || 78;
  const totalLoggedHours = Number(
    (
      chapters.reduce((acc, c) => acc + (c.studyHours || 4), 0) +
      profile.todayStudyMinutes / 60
    ).toFixed(1)
  );

  // Generate standalone formatted HTML for printing / saving as PDF / downloading
  const generateReportHtml = (): string => {
    const isMasteryType = reportType === 'mastery_progress';
    const isComprehensive = reportType === 'comprehensive';
    const isScheduleType = reportType === 'schedule';
    const isWeaknessType = reportType === 'weaknesses';

    const title = isMasteryType
      ? "Student Learning Progress & Mastery Report"
      : isComprehensive
      ? "Comprehensive Academic Progress & Mastery Dossier"
      : isScheduleType
      ? "Weekly Study Schedule & Focus Action Plan"
      : "Cognitive Weakness Diagnostic & Misconceptions Audit";

    const subjectScopeText =
      selectedSubject === 'all' ? 'All Academic Subjects (Comprehensive)' : `${selectedSubject} Academic Scope`;

    // 1. Executive Summary HTML
    let executiveKpisHtml = '';
    if ((isMasteryType || isComprehensive) && includeKPIs) {
      const todayGoalPercent = Math.min(
        100,
        Math.round((profile.todayStudyMinutes / profile.todayGoalMinutes) * 100)
      );

      executiveKpisHtml = `
        <div class="section avoid-break">
          <div class="section-header">
            <h2 class="section-title">📊 Executive Learning Performance Summary</h2>
            <span class="badge badge-blue">Official Academic Record</span>
          </div>
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-label">Curriculum Mastery</div>
              <div class="kpi-value text-blue">${overallMasteryValue}%</div>
              <div class="kpi-sub">Overall Academic Proficiency</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Study Streak</div>
              <div class="kpi-value text-amber">${profile.streakDays || 14} Days</div>
              <div class="kpi-sub">Consecutive Active Days</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Today's Study</div>
              <div class="kpi-value text-emerald">${profile.todayStudyMinutes}m / ${profile.todayGoalMinutes}m</div>
              <div class="kpi-sub">${todayGoalPercent}% Daily Goal Met</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Scholar Level</div>
              <div class="kpi-value text-purple">Level ${profile.level || 7}</div>
              <div class="kpi-sub">${profile.xp || 2840} Total XP Earned</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Total Time Invested</div>
              <div class="kpi-value text-slate">${totalLoggedHours || 42.5} hrs</div>
              <div class="kpi-sub">Semester Deep Focus</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Active Weaknesses</div>
              <div class="kpi-value text-rose">${filteredWeaknesses.length} Topics</div>
              <div class="kpi-sub">Flagged for Targeted Revision</div>
            </div>
          </div>
        </div>
      `;
    }

    // 2. Subject Mastery Matrix HTML
    let subjectMatrixHtml = '';
    if ((isMasteryType || isComprehensive) && includeSubjectMatrix) {
      subjectMatrixHtml = `
        <div class="section avoid-break">
          <div class="section-header">
            <h2 class="section-title">🎯 Subject Mastery & Proficiency Matrix</h2>
            <span class="badge badge-blue">${subjectStats.length} Subjects Evaluated</span>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th style="width: 180px;">Mastery Level</th>
                <th style="width: 90px; text-align: center;">Mastery %</th>
                <th style="width: 120px; text-align: center;">Chapters Progress</th>
                <th style="width: 100px; text-align: center;">Quiz Accuracy</th>
                <th style="width: 90px; text-align: center;">Study Hours</th>
                <th style="width: 110px; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${subjectStats
                .map(
                  (s) => `
                <tr>
                  <td><strong>${s.label}</strong></td>
                  <td>
                    <div class="progress-bar-container">
                      <div class="progress-bar-fill ${
                        s.mastery >= 85
                          ? 'fill-emerald'
                          : s.mastery >= 70
                          ? 'fill-blue'
                          : 'fill-rose'
                      }" style="width: ${s.mastery}%;"></div>
                    </div>
                  </td>
                  <td style="text-align: center; font-weight: 800;">${s.mastery}%</td>
                  <td style="text-align: center;">${s.masteredChapters} / ${s.totalChapters} Mastered</td>
                  <td style="text-align: center; font-weight: 600;">${s.avgAccuracy}%</td>
                  <td style="text-align: center;">${s.totalHours} hrs</td>
                  <td style="text-align: center;">
                    <span class="status-tag ${
                      s.status === 'Mastered'
                        ? 'tag-mastered'
                        : s.status === 'Advancing'
                        ? 'tag-advancing'
                        : 'tag-needs-review'
                    }">
                      ${s.status}
                    </span>
                  </td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // 3. Chapter-by-Chapter Syllabus Progress HTML
    let chapterDetailsHtml = '';
    if ((isMasteryType || isComprehensive) && includeChapterDetails && filteredChapters.length > 0) {
      chapterDetailsHtml = `
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">📚 Chapter-by-Chapter Learning Milestones</h2>
            <span class="badge badge-purple">${filteredChapters.length} Syllabus Chapters</span>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 110px;">Subject</th>
                <th>Chapter Title & Focus Concept</th>
                <th style="width: 140px;">Mastery Bar</th>
                <th style="width: 80px; text-align: center;">Mastery %</th>
                <th style="width: 90px; text-align: center;">Study Time</th>
                <th style="width: 90px; text-align: center;">Quiz Score</th>
                <th style="width: 100px; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredChapters
                .map(
                  (c) => `
                <tr style="page-break-inside: avoid;">
                  <td><span class="subject-pill">${c.subject}</span></td>
                  <td>
                    <strong>${c.title}</strong>
                    <div style="font-size: 8pt; color: #64748b; margin-top: 2px;">${c.description || ''}</div>
                  </td>
                  <td>
                    <div class="progress-bar-container">
                      <div class="progress-bar-fill ${
                        (c.masteryPercentage || 70) >= 85
                          ? 'fill-emerald'
                          : (c.masteryPercentage || 70) >= 70
                          ? 'fill-blue'
                          : 'fill-rose'
                      }" style="width: ${c.masteryPercentage || 70}%;"></div>
                    </div>
                  </td>
                  <td style="text-align: center; font-weight: 800;">${c.masteryPercentage || 70}%</td>
                  <td style="text-align: center;">${c.studyHours || 4.5}h / ${c.targetStudyHours || 6.0}h</td>
                  <td style="text-align: center; font-weight: 600;">${c.quizAccuracy || 78}%</td>
                  <td style="text-align: center;">
                    <span class="status-tag ${
                      c.mastery === 'mastered' || (c.masteryPercentage || 0) >= 85
                        ? 'tag-mastered'
                        : c.mastery === 'revision'
                        ? 'tag-advancing'
                        : 'tag-needs-review'
                    }">
                      ${c.mastery === 'mastered' ? 'Mastered' : c.mastery === 'revision' ? 'In Review' : 'Needs Work'}
                    </span>
                  </td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // 4. Upcoming Exams Readiness HTML
    let examsHtml = '';
    if ((isMasteryType || isComprehensive) && includeExamReadiness && upcomingExams.length > 0) {
      examsHtml = `
        <div class="section avoid-break">
          <div class="section-header">
            <h2 class="section-title">⏱️ Upcoming Examination Readiness & Timeline</h2>
            <span class="badge badge-amber">${upcomingExams.length} Exams Approaching</span>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Examination Assessment</th>
                <th style="width: 100px;">Subject</th>
                <th style="width: 100px; text-align: center;">Timeline</th>
                <th style="width: 140px;">Estimated Readiness</th>
                <th style="width: 80px; text-align: center;">Readiness %</th>
                <th style="width: 90px; text-align: center;">Priority</th>
              </tr>
            </thead>
            <tbody>
              ${upcomingExams
                .map(
                  (e) => `
                <tr>
                  <td><strong>${e.title}</strong></td>
                  <td><span class="subject-pill">${e.subject}</span></td>
                  <td style="text-align: center; font-weight: 700; color: #1e293b;">${e.date}</td>
                  <td>
                    <div class="progress-bar-container">
                      <div class="progress-bar-fill ${
                        e.readiness >= 85
                          ? 'fill-emerald'
                          : e.readiness >= 70
                          ? 'fill-blue'
                          : 'fill-rose'
                      }" style="width: ${e.readiness}%;"></div>
                    </div>
                  </td>
                  <td style="text-align: center; font-weight: 800;">${e.readiness}%</td>
                  <td style="text-align: center;">
                    <span class="priority-tag priority-${e.urgency.toLowerCase()}">${e.urgency.toUpperCase()}</span>
                  </td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // 5. Weaknesses & Misconception Audit HTML
    let weaknessesHtml = '';
    if ((isWeaknessType || isComprehensive || isMasteryType) && includeWeaknesses) {
      weaknessesHtml = `
        <div class="section ${isMasteryType || isComprehensive ? '' : ''}">
          <div class="section-header">
            <h2 class="section-title">⚠️ Diagnostic Weakness & Cognitive Misconception Audit</h2>
            <span class="badge badge-rose">${filteredWeaknesses.length} AI Identified Focus Traps</span>
          </div>
          <p class="section-desc">
            Topics identified by diagnostic quizzes as high-risk conceptual vulnerabilities. Use targeted revision and practice the drill exercises offline.
          </p>
          ${
            filteredWeaknesses.length === 0
              ? `<div class="empty-notice success">✨ Excellent! Zero critical cognitive weaknesses detected in ${selectedSubject}. All mastery scores are above 85%.</div>`
              : `<div class="weakness-grid">
                  ${filteredWeaknesses
                    .map(
                      (w, index) => `
                    <div class="weakness-card avoid-break">
                      <div class="weakness-card-top">
                        <div class="weakness-id">#${index + 1} • ${w.subject} Diagnostic</div>
                        <div class="weakness-score">Current Accuracy: <strong>${w.score} / ${w.maxScore} (${Math.round((w.score / w.maxScore) * 100)}%)</strong></div>
                      </div>
                      <div class="weakness-title">${w.chapter} — <span style="color: #475569; font-weight: 600;">${w.subtopic}</span></div>
                      <div class="weakness-label-box">
                        <span class="alert-icon">⚠️</span> <strong>Misconception:</strong> ${w.weaknessLabel}
                      </div>

                      ${
                        includeRemediationTips
                          ? `
                        <div class="root-cause-box">
                          <strong>Root Cause Diagnosis:</strong> ${w.rootCause}
                        </div>
                        ${
                          w.sampleMistake
                            ? `
                          <div class="sample-mistake-box">
                            <strong>Common Examination Trap:</strong> "${w.sampleMistake}"
                          </div>
                        `
                            : ''
                        }
                      `
                          : ''
                      }

                      <div class="weakness-remedy-footer">
                        <div class="remedy-time">
                          ⏱️ Recommended Target Drill: <strong>${w.recommendedPracticeMinutes || 10} minutes</strong>
                        </div>
                        ${
                          includeCheckboxes
                            ? `
                          <div class="offline-checklist">
                            <label><span class="checkbox-box mini"></span> Read notes</label>
                            <label><span class="checkbox-box mini"></span> Solve 3 problems</label>
                            <label><span class="checkbox-box mini"></span> Retest score</label>
                          </div>
                        `
                            : ''
                        }
                      </div>
                    </div>
                  `
                    )
                    .join('')}
                </div>`
          }
        </div>
      `;
    }

    // 6. Schedule HTML
    let scheduleHtml = '';
    if ((isScheduleType || isComprehensive) && includeSchedule) {
      scheduleHtml = `
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">📅 Scheduled Study Sessions & Focus Action Plan</h2>
            <span class="badge badge-blue">${totalTasksCount} Planned Tasks • ${totalScheduledMinutes} Total Minutes</span>
          </div>
          ${
            filteredSchedule.length === 0
              ? `<div class="empty-notice">No study sessions currently scheduled for ${selectedSubject}.</div>`
              : filteredSchedule
                  .map(
                    (day) => `
              <div class="day-card avoid-break">
                <div class="day-header">
                  <span class="day-title">${day.dayTitle}</span>
                  <span class="day-date">${day.date}</span>
                </div>
                <table class="task-table">
                  <thead>
                    <tr>
                      ${includeCheckboxes ? '<th style="width: 40px; text-align: center;">Done</th>' : ''}
                      <th>Study Task / Chapter</th>
                      <th style="width: 110px;">Subject</th>
                      <th style="width: 80px; text-align: right;">Duration</th>
                      <th style="width: 80px; text-align: center;">Priority</th>
                      <th style="width: 90px; text-align: center;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${day.tasks
                      .map(
                        (t) => `
                      <tr>
                        ${
                          includeCheckboxes
                            ? `<td style="text-align: center;"><div class="checkbox-box">${t.completed ? '✓' : ''}</div></td>`
                            : ''
                        }
                        <td>
                          <strong style="color: #0f172a;">${t.title}</strong>
                        </td>
                        <td><span class="subject-pill">${t.subject}</span></td>
                        <td style="text-align: right; font-weight: bold;">${t.durationMinutes} min</td>
                        <td style="text-align: center;">
                          <span class="priority-tag priority-${t.priority.toLowerCase()}">${t.priority.toUpperCase()}</span>
                        </td>
                        <td style="text-align: center;">
                          <span class="status-pill ${t.completed ? 'status-completed' : 'status-pending'}">
                            ${t.completed ? 'Completed' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    `
                      )
                      .join('')}
                  </tbody>
                </table>
              </div>
            `
                  )
                  .join('')}
        </div>
      `;
    }

    // 7. Notes section HTML
    let notesSectionHtml = '';
    if (includeNotesSection) {
      notesSectionHtml = `
        <div class="section notes-section avoid-break">
          <div class="section-header">
            <h2 class="section-title">📝 Handwritten Notes & Offline Study Reflection</h2>
          </div>
          <div class="lined-paper">
            <div class="line"></div>
            <div class="line"></div>
            <div class="line"></div>
            <div class="line"></div>
          </div>
        </div>
      `;
    }

    // 8. Signoff HTML
    let signoffHtml = '';
    if (includeSignoff) {
      signoffHtml = `
        <div class="signoff-section avoid-break">
          <div class="signoff-box">
            <div class="signoff-line">Student Signature: ___________________________________</div>
            <div class="signoff-line">Date Verified: _____________________</div>
          </div>
          <div class="signoff-box">
            <div class="signoff-line">Tutor / Parent Sign-off: ___________________________________</div>
            <div class="signoff-line">Weekly Progress Verified: [ ] Satisfactory   [ ] Action Needed</div>
          </div>
        </div>
      `;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} - ${profile.name} - Nexora Study AI</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 14mm 14mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.45;
      font-size: 9.5pt;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .report-container {
      max-width: 100%;
      margin: 0 auto;
    }
    .brand-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2.5px solid #2563eb;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .brand-left h1 {
      font-size: 16pt;
      font-weight: 800;
      color: #1e3a8a;
      letter-spacing: -0.5px;
      margin-bottom: 2px;
    }
    .brand-left p {
      font-size: 8.5pt;
      color: #475569;
    }
    .brand-right {
      text-align: right;
    }
    .brand-logo-text {
      font-size: 13pt;
      font-weight: 900;
      color: #2563eb;
      letter-spacing: 0.5px;
    }
    .brand-tagline {
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748b;
      margin-top: 1px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 16px;
    }
    .meta-item {
      font-size: 8.5pt;
    }
    .meta-label {
      color: #64748b;
      text-transform: uppercase;
      font-size: 7pt;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .meta-value {
      font-size: 9.5pt;
      font-weight: 800;
      color: #0f172a;
    }
    .section {
      margin-bottom: 18px;
    }
    .avoid-break {
      page-break-inside: avoid;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      border-bottom: 1.5px solid #cbd5e1;
      padding-bottom: 5px;
    }
    .section-title {
      font-size: 11pt;
      font-weight: 800;
      color: #1e293b;
    }
    .section-desc {
      font-size: 8.5pt;
      color: #64748b;
      margin-bottom: 10px;
    }
    .badge {
      font-size: 7.5pt;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-blue {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }
    .badge-purple {
      background: #faf5ff;
      color: #7e22ce;
      border: 1px solid #e9d5ff;
    }
    .badge-amber {
      background: #fffbeb;
      color: #b45309;
      border: 1px solid #fde68a;
    }
    .badge-rose {
      background: #fff1f2;
      color: #be123c;
      border: 1px solid #fecdd3;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
      margin-bottom: 14px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 10px;
      text-align: center;
    }
    .kpi-label {
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .kpi-value {
      font-size: 13pt;
      font-weight: 900;
      line-height: 1.1;
      margin-bottom: 2px;
    }
    .kpi-sub {
      font-size: 6.5pt;
      color: #94a3b8;
      font-weight: 600;
    }
    .text-blue { color: #2563eb; }
    .text-amber { color: #d97706; }
    .text-emerald { color: #059669; }
    .text-purple { color: #7c3aed; }
    .text-slate { color: #334155; }
    .text-rose { color: #e11d48; }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
    }
    .data-table th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 6px 8px;
      border-bottom: 1px solid #cbd5e1;
      text-align: left;
    }
    .data-table td {
      padding: 5.5px 8px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .data-table tr:last-child td {
      border-bottom: none;
    }
    .progress-bar-container {
      width: 100%;
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
      display: block;
    }
    .progress-bar-fill {
      height: 100%;
      border-radius: 4px;
    }
    .fill-emerald { background: #10b981; }
    .fill-blue { background: #3b82f6; }
    .fill-rose { background: #f43f5e; }

    .status-tag {
      display: inline-block;
      font-size: 7pt;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .tag-mastered {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }
    .tag-advancing {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }
    .tag-needs-review {
      background: #fff1f2;
      color: #be123c;
      border: 1px solid #fecdd3;
    }

    .subject-pill {
      display: inline-block;
      font-size: 7pt;
      font-weight: 700;
      padding: 1.5px 5px;
      background: #f1f5f9;
      color: #334155;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }
    .priority-tag {
      font-size: 7pt;
      font-weight: 800;
      padding: 2px 5px;
      border-radius: 4px;
      display: inline-block;
    }
    .priority-high {
      background: #fee2e2;
      color: #b91c1c;
    }
    .priority-medium {
      background: #fef3c7;
      color: #b45309;
    }
    .priority-normal, .priority-low {
      background: #f1f5f9;
      color: #475569;
    }

    .weakness-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .weakness-card {
      border: 1px solid #fecdd3;
      border-left: 4px solid #e11d48;
      background: #ffffff;
      border-radius: 8px;
      padding: 8px 12px;
    }
    .weakness-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 3px;
    }
    .weakness-id {
      font-size: 7.5pt;
      font-weight: 800;
      color: #e11d48;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .weakness-score {
      font-size: 8pt;
      color: #475569;
    }
    .weakness-title {
      font-size: 10pt;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 3px;
    }
    .weakness-label-box {
      font-size: 8pt;
      color: #be123c;
      background: #fff1f2;
      padding: 3px 6px;
      border-radius: 4px;
      margin-bottom: 6px;
      display: inline-block;
    }
    .root-cause-box {
      font-size: 8pt;
      color: #334155;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 5px 8px;
      border-radius: 5px;
      margin-bottom: 5px;
    }
    .sample-mistake-box {
      font-size: 7.5pt;
      color: #64748b;
      background: #fffbeb;
      border: 1px solid #fef3c7;
      padding: 4px 6px;
      border-radius: 4px;
      margin-bottom: 6px;
      font-style: italic;
    }
    .weakness-remedy-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 5px;
      padding-top: 5px;
      border-top: 1px dashed #e2e8f0;
      font-size: 7.5pt;
    }
    .remedy-time {
      color: #0f172a;
    }
    .offline-checklist {
      display: flex;
      gap: 10px;
      font-size: 7.5pt;
      color: #475569;
    }
    .checkbox-box {
      display: inline-block;
      width: 13px;
      height: 13px;
      border: 1.5px solid #64748b;
      border-radius: 3px;
      text-align: center;
      line-height: 11px;
      font-size: 8pt;
      font-weight: 900;
      color: #2563eb;
    }
    .checkbox-box.mini {
      width: 11px;
      height: 11px;
      border: 1px solid #94a3b8;
      margin-right: 3px;
      vertical-align: middle;
    }

    .day-card {
      margin-bottom: 10px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
    }
    .day-header {
      background: #f1f5f9;
      padding: 5px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
    }
    .day-title {
      font-size: 8.5pt;
      font-weight: 800;
      color: #1e293b;
    }
    .day-date {
      font-size: 7.5pt;
      color: #64748b;
      font-weight: 600;
    }
    .task-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
    }
    .task-table th {
      background: #ffffff;
      color: #475569;
      font-weight: 700;
      font-size: 7pt;
      text-transform: uppercase;
      padding: 4px 8px;
      border-bottom: 1px solid #e2e8f0;
      text-align: left;
    }
    .task-table td {
      padding: 4.5px 8px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .task-table tr:last-child td {
      border-bottom: none;
    }

    .lined-paper {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 6px 10px;
      background: #ffffff;
    }
    .line {
      height: 20px;
      border-bottom: 1px dashed #94a3b8;
    }
    .signoff-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 14px;
      padding-top: 10px;
      border-top: 1px solid #cbd5e1;
    }
    .signoff-box {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      padding: 8px 10px;
      border-radius: 6px;
    }
    .signoff-line {
      font-size: 7.5pt;
      color: #334155;
      margin-bottom: 4px;
    }
    .signoff-line:last-child {
      margin-bottom: 0;
    }
    .report-footer {
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 7pt;
      color: #94a3b8;
    }
    .empty-notice {
      padding: 14px;
      text-align: center;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 6px;
      color: #64748b;
      font-size: 8.5pt;
    }
    .empty-notice.success {
      background: #f0fdf4;
      border-color: #bbf7d0;
      color: #166534;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="brand-header">
      <div class="brand-left">
        <h1>${title}</h1>
        <p>Official Academic Assessment • Verified Learning & Mastery Dossier</p>
      </div>
      <div class="brand-right">
        <div class="brand-logo-text">Nexora Study AI</div>
        <div class="brand-tagline">Adaptive Learning Engine</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <div class="meta-label">Student Name</div>
        <div class="meta-value">${profile.name}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Academic Grade</div>
        <div class="meta-value">${profile.grade || 'Grade 11 STEM'}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Subject Scope</div>
        <div class="meta-value">${subjectScopeText}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Generated Date</div>
        <div class="meta-value">${currentDateFormatted}</div>
      </div>
    </div>

    ${executiveKpisHtml}
    ${subjectMatrixHtml}
    ${chapterDetailsHtml}
    ${examsHtml}
    ${weaknessesHtml}
    ${scheduleHtml}
    ${notesSectionHtml}
    ${signoffHtml}

    <div class="report-footer">
      <span>Official Nexora Study AI Learning Record • Verified Offline Study Portfolio</span>
      <span>System ID: ${profile.level || 7}-SCHOLAR • ${currentDateFormatted}</span>
    </div>
  </div>
</body>
</html>`;
  };

  // 1. Direct Print & Save as PDF Trigger
  const handlePrint = () => {
    soundFX.playPop();
    setIsPrinting(true);

    try {
      const htmlContent = generateReportHtml();
      let printIframe = document.getElementById('nexora-print-frame') as HTMLIFrameElement | null;
      if (!printIframe) {
        printIframe = document.createElement('iframe');
        printIframe.id = 'nexora-print-frame';
        printIframe.style.position = 'fixed';
        printIframe.style.right = '0';
        printIframe.style.bottom = '0';
        printIframe.style.width = '0';
        printIframe.style.height = '0';
        printIframe.style.border = '0';
        document.body.appendChild(printIframe);
      }

      const doc = printIframe.contentWindow?.document || printIframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();

        setTimeout(() => {
          setIsPrinting(false);
          try {
            printIframe?.contentWindow?.focus();
            printIframe?.contentWindow?.print();
          } catch (e) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
              printWindow.document.write(htmlContent);
              printWindow.document.close();
              printWindow.focus();
              printWindow.print();
            }
          }
        }, 400);
      }
    } catch (err) {
      console.error('Print trigger error:', err);
      setIsPrinting(false);
    }
  };

  // 2. Download Standalone Offline HTML File
  const handleDownloadHtml = () => {
    soundFX.playSuccess();
    const htmlContent = generateReportHtml();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = profile.name.toLowerCase().replace(/\s+/g, '-');
    link.href = url;
    link.download = `Nexora-${reportType}-report-${safeName}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 3. Copy Printable Text Summary
  const handleCopyText = () => {
    soundFX.playPop();
    let text = `========================================\n`;
    text += `NEXORA STUDY AI ACADEMIC REPORT: ${reportType.toUpperCase()}\n`;
    text += `Student: ${profile.name} (${profile.grade || 'STEM'})\n`;
    text += `Date: ${currentDateFormatted}\n`;
    text += `Scope: ${selectedSubject}\n`;
    text += `Overall Mastery: ${overallMasteryValue}%\n`;
    text += `Study Streak: ${profile.streakDays || 14} days\n`;
    text += `========================================\n\n`;

    if (reportType === 'mastery_progress' || reportType === 'comprehensive') {
      text += `--- 🎯 SUBJECT MASTERY LEVELS ---\n`;
      subjectStats.forEach((s) => {
        text += `• ${s.label}: ${s.mastery}% (${s.status}, ${s.masteredChapters}/${s.totalChapters} chapters, ${s.avgAccuracy}% quiz avg)\n`;
      });
      text += `\n`;
    }

    if (reportType === 'weaknesses' || reportType === 'comprehensive') {
      text += `--- ⚠️ COGNITIVE WEAKNESSES AUDIT ---\n`;
      filteredWeaknesses.forEach((w, i) => {
        text += `\n#${i + 1}. [${w.subject}] ${w.chapter} - ${w.subtopic}\n`;
        text += `   Issue: ${w.weaknessLabel} (Score: ${w.score}/${w.maxScore})\n`;
        text += `   Root Cause: ${w.rootCause}\n`;
        if (w.sampleMistake) text += `   Trap: "${w.sampleMistake}"\n`;
        text += `   Action: [ ] Practice targeted drill (${w.recommendedPracticeMinutes || 10} min)\n`;
      });
      text += `\n`;
    }

    if (reportType === 'schedule' || reportType === 'comprehensive') {
      text += `--- 📅 STUDY SCHEDULE ---\n`;
      filteredSchedule.forEach((day) => {
        text += `\n[${day.dayTitle} - ${day.date}]\n`;
        day.tasks.forEach((t) => {
          text += `  [${t.completed ? 'X' : ' '}] ${t.title} (${t.subject}, ${t.durationMinutes}m, ${t.priority.toUpperCase()})\n`;
        });
      });
      text += `\nTotal: ${totalTasksCount} tasks, ${totalScheduledMinutes} minutes\n\n`;
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div
        id="export-pdf-report-modal"
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Print to PDF — Student Progress & Mastery Report
                </h2>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300/40">
                  Structured PDF Report
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Generate a clean, structured printable report of student progress, subject mastery levels, syllabus chapters, and weakness diagnostics.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Controls & Live Preview */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Top Customizer Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Report Type Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-500" />
                <span>Select Report Content Type</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setReportType('mastery_progress')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                    reportType === 'mastery_progress'
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>Mastery & Progress</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportType('comprehensive')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                    reportType === 'comprehensive'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Full Dossier</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportType('schedule')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                    reportType === 'schedule'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Study Schedule</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportType('weaknesses')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                    reportType === 'weaknesses'
                      ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Weaknesses</span>
                </button>
              </div>
            </div>

            {/* Subject Scope Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                <span>Subject Filter Scope</span>
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value as SubjectType | 'all')}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Academic Subjects (Comprehensive Overview)</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                <option value="Computer Science">Computer Science</option>
              </select>
            </div>
          </div>

          {/* Report Toggles */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
              Included Report Modules:
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label className="inline-flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                <input
                  type="checkbox"
                  checked={includeKPIs}
                  onChange={(e) => setIncludeKPIs(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                />
                <span>Executive Summary & KPIs</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                <input
                  type="checkbox"
                  checked={includeSubjectMatrix}
                  onChange={(e) => setIncludeSubjectMatrix(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                />
                <span>Subject Mastery Matrix</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                <input
                  type="checkbox"
                  checked={includeChapterDetails}
                  onChange={(e) => setIncludeChapterDetails(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                />
                <span>Chapter-by-Chapter Milestones</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                <input
                  type="checkbox"
                  checked={includeExamReadiness}
                  onChange={(e) => setIncludeExamReadiness(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                />
                <span>Exam Timeline & Readiness</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                <input
                  type="checkbox"
                  checked={includeWeaknesses}
                  onChange={(e) => setIncludeWeaknesses(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                />
                <span>Weakness Diagnostic & Traps</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                <input
                  type="checkbox"
                  checked={includeSchedule}
                  onChange={(e) => setIncludeSchedule(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                />
                <span>Study Schedule & Tasks</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                <input
                  type="checkbox"
                  checked={includeNotesSection}
                  onChange={(e) => setIncludeNotesSection(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                />
                <span>Handwritten Notes Lines</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                <input
                  type="checkbox"
                  checked={includeSignoff}
                  onChange={(e) => setIncludeSignoff(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                />
                <span>Parent / Tutor Sign-off Box</span>
              </label>
            </div>
          </div>

          {/* Document Live Preview Container */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                <Eye className="w-4 h-4 text-blue-500" />
                <span>Document Live Preview (Print Layout)</span>
              </div>
              <span className="text-[11px] text-slate-500">
                A4 Standard Margins • High Contrast PDF Print Style
              </span>
            </div>

            <div className="p-6 rounded-2xl bg-white text-slate-900 border border-slate-300 shadow-inner max-h-[360px] overflow-y-auto space-y-4 font-sans select-text">
              {/* Preview Header */}
              <div className="flex justify-between items-start border-b-2 border-blue-600 pb-3">
                <div>
                  <h3 className="text-base font-black text-blue-900">
                    {reportType === 'mastery_progress'
                      ? 'Student Learning Progress & Mastery Report'
                      : reportType === 'comprehensive'
                      ? 'Comprehensive Academic Progress & Mastery Dossier'
                      : reportType === 'schedule'
                      ? 'Weekly Study Schedule & Focus Action Plan'
                      : 'Cognitive Weakness Diagnostic & Misconceptions Audit'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Student: <strong className="text-slate-900">{profile.name}</strong> • {profile.grade || 'STEM'} • Generated on {currentDateFormatted}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-blue-600 tracking-wider">NEXORA STUDY AI</span>
                  <p className="text-[10px] text-slate-400 uppercase">Verified Report</p>
                </div>
              </div>

              {/* Preview KPI Badges */}
              {includeKPIs && (reportType === 'mastery_progress' || reportType === 'comprehensive') && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Curriculum Mastery</span>
                    <p className="font-extrabold text-blue-600 text-sm">{overallMasteryValue}%</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Study Streak</span>
                    <p className="font-extrabold text-amber-600 text-sm">{profile.streakDays || 14} Days 🔥</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Total Study Time</span>
                    <p className="font-extrabold text-emerald-600 text-sm">{totalLoggedHours || 42.5} hrs</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Scholar Level</span>
                    <p className="font-extrabold text-purple-600 text-sm">Level {profile.level || 7} ({profile.xp || 2840} XP)</p>
                  </div>
                </div>
              )}

              {/* Preview Subject Mastery Matrix */}
              {includeSubjectMatrix && (reportType === 'mastery_progress' || reportType === 'comprehensive') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b pb-1">
                    <h4 className="text-xs font-black uppercase text-slate-800">
                      🎯 Subject Mastery Levels
                    </h4>
                    <span className="text-[10px] font-bold text-blue-600">{subjectStats.length} Subjects Evaluated</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {subjectStats.map((s) => (
                      <div key={s.subject} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{s.label}</p>
                          <p className="text-[10px] text-slate-500">{s.masteredChapters}/{s.totalChapters} chapters mastered</p>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-slate-900 text-sm">{s.mastery}%</span>
                          <span className={`block text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            s.status === 'Mastered' ? 'bg-emerald-100 text-emerald-700' : s.status === 'Advancing' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {s.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Upcoming Exams */}
              {includeExamReadiness && (reportType === 'mastery_progress' || reportType === 'comprehensive') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b pb-1">
                    <h4 className="text-xs font-black uppercase text-slate-800">
                      ⏱️ Upcoming Exams & Readiness
                    </h4>
                    <span className="text-[10px] font-bold text-amber-600">{upcomingExams.length} Exams Approaching</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {upcomingExams.slice(0, 2).map((e) => (
                      <div key={e.id} className="p-2 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-800">{e.title}</span>
                          <span className="text-[10px] text-slate-500 block">{e.subject} • {e.date}</span>
                        </div>
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                          {e.readiness}% Ready
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Weaknesses Section */}
              {(reportType === 'weaknesses' || reportType === 'comprehensive' || reportType === 'mastery_progress') && includeWeaknesses && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b pb-1">
                    <h4 className="text-xs font-black uppercase text-slate-800">
                      ⚠️ Diagnostic Weaknesses & Traps
                    </h4>
                    <span className="text-[10px] font-bold text-rose-600">{filteredWeaknesses.length} root causes</span>
                  </div>

                  {filteredWeaknesses.length === 0 ? (
                    <p className="text-xs text-emerald-600 py-1">No active weaknesses found in {selectedSubject}.</p>
                  ) : (
                    filteredWeaknesses.slice(0, 2).map((w, idx) => (
                      <div key={w.id} className="p-2.5 border-l-4 border-rose-500 border border-slate-200 rounded-lg text-xs space-y-1">
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-900">#{idx + 1} {w.chapter} • {w.subtopic}</span>
                          <span className="text-rose-600">Score: {w.score}/{w.maxScore}</span>
                        </div>
                        <p className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[10px] font-medium">
                          Misconception: {w.weaknessLabel}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Preview Notes & Signoff */}
              {includeSignoff && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs grid grid-cols-2 gap-2 text-[10px] text-slate-600">
                  <div>Student Signature: __________________</div>
                  <div>Tutor / Parent Sign-off: __________________</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer / Action Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-blue-500 shrink-0" />
            <span>Click <strong>Print / Save as PDF</strong> to generate the formatted document and save as PDF.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Copy Text Summary */}
            <button
              type="button"
              onClick={handleCopyText}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              title="Copy formatted text summary to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            {/* Download Offline HTML */}
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              title="Download standalone offline HTML file"
            >
              <Download className="w-4 h-4" />
              <span>Download .HTML</span>
            </button>

            {/* Primary Print / Save as PDF Button */}
            <button
              type="button"
              id="confirm-print-pdf-report-btn"
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'Preparing PDF...' : 'Print / Save as PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
