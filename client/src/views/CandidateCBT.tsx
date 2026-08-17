import React, { useState, useEffect } from 'react';
import { Monitor, Clock, ShieldCheck, Wifi, CheckCircle2, Bookmark, Send, AlertOctagon, Lock, FileText, Download, UserCheck, UserPlus, QrCode } from 'lucide-react';
import { fetchApi } from '../services/api';
import { Question } from '../types';
import { CandidateRegistrationModal } from './CandidateRegistrationModal';

export const CandidateCBT: React.FC = () => {
  const [selectedExamCode, setSelectedExamCode] = useState('EXAM-NEET-2026');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'LOBBY' | 'IN_PROGRESS' | 'SUBMITTED' | 'FROZEN'>('LOBBY');
  const [examTitle, setExamTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(12000); // 3 hrs 20 mins for NEET
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Registration Modal State
  const [showRegModal, setShowRegModal] = useState(false);

  // Admit Card Modal State
  const [showAdmitCard, setShowAdmitCard] = useState(false);
  const [admitCardData, setAdmitCardData] = useState<any>(null);

  // Active Subject Section Tab Filter
  const [activeSubjectFilter, setActiveSubjectFilter] = useState<string>('ALL');

  // Fetch Candidate Admit Card
  const loadAdmitCard = async () => {
    try {
      const data = await fetchApi('/candidate/admit-card/CAND-2026-001');
      setAdmitCardData(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAdmitCard();
  }, []);

  // Initialize Session from Terminal
  const handleStartExam = async () => {
    setErrorMsg('');
    try {
      const sessData = await fetchApi('/cbt/start-session', {
        method: 'POST',
        body: JSON.stringify({
          candidateCode: 'CAND-2026-001',
          examId: selectedExamCode,
          centreId: 'CENTRE-DELHI-01',
          deviceId: 'DEV-DEL-T01',
        }),
      });

      setSessionToken(sessData.sessionToken);

      const jitData = await fetchApi('/jit/request-questions', {
        method: 'POST',
        body: JSON.stringify({
          sessionToken: sessData.sessionToken,
          deviceId: 'DEV-DEL-T01',
        }),
      });

      setQuestions(jitData.questions || []);
      setExamTitle(jitData.examTitle || 'National Examination 2026');
      setSessionStatus('IN_PROGRESS');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to start CBT session');
    }
  };

  // Timer countdown
  useEffect(() => {
    if (sessionStatus !== 'IN_PROGRESS') return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionStatus]);

  // Encrypted Auto-save buffer sync
  const handleSelectOption = async (qId: string, optionIndex: number) => {
    const newAnswers = { ...answers, [qId]: optionIndex };
    setAnswers(newAnswers);

    if (sessionToken) {
      try {
        await fetchApi('/cbt/save-answers', {
          method: 'POST',
          body: JSON.stringify({ sessionToken, answers: newAnswers }),
        });
        setIsOfflineMode(false);
      } catch (err) {
        setIsOfflineMode(true);
      }
    }
  };

  const handleToggleReview = (qId: string) => {
    setMarkedForReview((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  // Final Answer Submission
  const handleFinalSubmit = async () => {
    if (!sessionToken) return;
    if (!window.confirm('Are you sure you want to finalize and submit your examination?')) return;

    setIsSubmitting(true);
    try {
      const data = await fetchApi('/cbt/submit-final', {
        method: 'POST',
        body: JSON.stringify({ sessionToken, answers }),
      });
      setSubmissionResult(data);
      setSessionStatus('SUBMITTED');
    } catch (err: any) {
      alert(err.message || 'Submission error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQ = questions[currentIndex];
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Extract unique subjects for section tabs
  const subjects = Array.from(new Set(questions.map((q) => q.subject)));
  const filteredQuestions = activeSubjectFilter === 'ALL'
    ? questions
    : questions.filter((q) => q.subject === activeSubjectFilter);

  return (
    <div className="p-6 space-y-6">
      {/* Registration Modal */}
      <CandidateRegistrationModal
        isOpen={showRegModal}
        onClose={() => setShowRegModal(false)}
        onSuccess={(admitCard) => {
          setAdmitCardData({ admitCard });
          setShowAdmitCard(true);
        }}
      />

      {/* Session Header / State Indicator */}
      <div className="gov-panel p-6 border border-slate-800 flex items-center justify-between shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-950 border border-blue-500/30 rounded text-blue-400">
            <Monitor className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold font-mono text-slate-100">
                {sessionStatus === 'IN_PROGRESS' ? examTitle : 'Candidate Sandboxed CBT Engine'}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded font-mono badge-active font-semibold">
                NODE: DEV-DEL-T01 (Node 14B)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Candidate: <strong className="text-slate-200">Aarav Sharma (CAND-2026-001)</strong> | Centre: <strong className="text-slate-200">TCS iON Digital Zone Powai, Dwarka, New Delhi</strong>
            </p>
          </div>
        </div>

        {/* Actions & Live Timer */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowRegModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono rounded flex items-center space-x-2 transition-all shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            <span>Apply / Register New Exam</span>
          </button>

          <button
            onClick={() => setShowAdmitCard(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-bold font-mono rounded border border-slate-700 flex items-center space-x-2 transition-all shadow-md"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>View Admit Card</span>
          </button>

          {sessionStatus === 'IN_PROGRESS' && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 px-4 py-2 rounded">
                <Wifi className={`w-4 h-4 ${isOfflineMode ? 'text-amber-400 animate-bounce' : 'text-emerald-400'}`} />
                <span className={`text-xs font-mono font-bold ${isOfflineMode ? 'text-amber-300' : 'text-emerald-300'}`}>
                  {isOfflineMode ? 'OFFLINE BUFFER ACTIVE' : 'ONLINE ENCRYPTED SYNC'}
                </span>
              </div>

              <div className="flex items-center space-x-2 bg-slate-950 border border-amber-500/40 px-5 py-2 rounded font-mono text-amber-300 shadow-lg">
                <Clock className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span className="text-lg font-extrabold tracking-wider">{formatTime(timeLeftSeconds)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LOBBY STATE */}
      {sessionStatus === 'LOBBY' && (
        <div className="glass-panel p-10 rounded-2xl text-center max-w-2xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-100">Ready for Examination</h3>
            <p className="text-sm text-slate-400 mt-2">
              Physical Identity Verification complete. TCS iON Centre Gateway is activated and terminal is sandboxed.
            </p>
          </div>

          {/* Exam Selector */}
          <div className="text-left bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
            <label className="text-slate-400 font-bold">SELECT ACTIVE NATIONAL EXAMINATION</label>
            <select
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 font-bold focus:outline-none focus:border-blue-500"
              value={selectedExamCode}
              onChange={(e) => setSelectedExamCode(e.target.value)}
            >
              <option value="EXAM-NEET-2026">National Eligibility cum Entrance Test (NEET UG 2026) [NTA]</option>
              <option value="EXAM-UPSC-2026">Civil Services Preliminary Examination 2026 (UPSC CSE)</option>
              <option value="EXAM-JEE-2026">Joint Entrance Examination (JEE Main 2026) [NTA]</option>
              <option value="EXAM-SSC-CGL-2026">Staff Selection Commission CGL Tier-1 2026 [SSC]</option>
            </select>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-lg font-mono">
              {errorMsg}
            </div>
          )}

          <button
            onClick={handleStartExam}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-xl shadow-blue-500/20 text-base transition-all transform active:scale-98 flex items-center justify-center space-x-2"
          >
            <Lock className="w-5 h-5" />
            <span>Launch Sandboxed Examination (Request JIT Payload)</span>
          </button>
        </div>
      )}

      {/* IN_PROGRESS CBT STATE */}
      {sessionStatus === 'IN_PROGRESS' && currentQ && (
        <div className="space-y-4">
          {/* Multi-Section Tabs */}
          {subjects.length > 1 && (
            <div className="flex items-center space-x-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800 font-mono text-xs">
              <span className="text-slate-400 font-bold px-2">SECTIONS:</span>
              <button
                onClick={() => setActiveSubjectFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeSubjectFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ALL SECTIONS
              </button>
              {subjects.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setActiveSubjectFilter(sub)}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                    activeSubjectFilter === sub ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Question Panel (3 cols) */}
            <div className="lg:col-span-3 glass-panel p-6 rounded-2xl border border-slate-800 space-y-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 font-mono font-bold rounded-lg">
                      Question {currentIndex + 1} of {questions.length}
                    </span>
                    <span className="text-xs px-2.5 py-1 bg-blue-500/10 text-blue-400 font-mono rounded-lg">
                      {currentQ.subject} • {currentQ.difficulty}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Marks: <span className="text-emerald-400 font-bold">+{currentQ.marks}</span> | Negative: <span className="text-red-400 font-bold">-{currentQ.negativeMarks}</span>
                  </div>
                </div>

                <div className="my-6">
                  <h4 className="text-lg font-semibold text-slate-100 leading-relaxed font-sans">
                    {currentQ.text}
                  </h4>
                </div>

                <div className="space-y-3">
                  {currentQ.options?.map((optText, idx) => {
                    const isSelected = answers[currentQ.id] === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(currentQ.id, idx)}
                        className={`w-full p-4 rounded-xl text-left text-sm font-medium transition-all flex items-center justify-between border ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 text-blue-200 shadow-lg shadow-blue-500/10'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className={`w-7 h-7 rounded-lg font-mono text-xs flex items-center justify-center font-bold ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{optText}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => handleToggleReview(currentQ.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 border transition-all ${
                    markedForReview[currentQ.id]
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                  <span>{markedForReview[currentQ.id] ? 'Marked for Review' : 'Mark for Review'}</span>
                </button>

                <div className="flex items-center space-x-3">
                  <button
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((prev) => prev - 1)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold rounded-xl transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentIndex === questions.length - 1}
                    onClick={() => setCurrentIndex((prev) => prev + 1)}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/20"
                  >
                    Next Question
                  </button>
                </div>
              </div>
            </div>

            {/* Right Question Palette (1 col) */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-200 font-mono tracking-wider">QUESTION PALETTE</h3>

                <div className="grid grid-cols-4 gap-2">
                  {questions.map((q, idx) => {
                    const isAnswered = answers[q.id] !== undefined;
                    const isMarked = markedForReview[q.id];
                    const isCurrent = idx === currentIndex;

                    let colorClass = 'bg-slate-900 text-slate-400 border-slate-800';
                    if (isCurrent) colorClass = 'ring-2 ring-blue-500 bg-blue-600/30 text-white font-extrabold';
                    else if (isAnswered) colorClass = 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40';
                    else if (isMarked) colorClass = 'bg-amber-600/20 text-amber-300 border-amber-500/40';

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIndex(idx)}
                        className={`h-10 rounded-lg font-mono text-xs font-bold border transition-all flex items-center justify-center ${colorClass}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xl shadow-emerald-500/20 text-xs transition-all flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Final Examination Submission</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMITTED STATE */}
      {sessionStatus === 'SUBMITTED' && (
        <div className="glass-panel p-10 rounded-2xl text-center max-w-xl mx-auto space-y-6 border border-emerald-500/40 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-100">Examination Submitted Successfully</h3>
            <p className="text-xs text-slate-400 mt-2">
              Cryptographic answer digest recorded in the national immutable audit ledger.
            </p>
          </div>

          {submissionResult && (
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-left font-mono text-xs space-y-2">
              <div className="text-slate-400">Digest Hash: <span className="text-emerald-400 break-all font-bold">{submissionResult.answerHash}</span></div>
              <div className="text-slate-400">Submission ID: <span className="text-slate-200">{submissionResult.submissionId}</span></div>
            </div>
          )}
        </div>
      )}

      {/* CANDIDATE ADMIT CARD MODAL */}
      {showAdmitCard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-8 rounded-2xl border border-blue-500/40 max-w-xl w-full space-y-6 shadow-2xl bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-bold text-slate-100 font-sans">OFFICIAL CANDIDATE ADMIT CARD</h3>
              </div>
              <button
                onClick={() => setShowAdmitCard(false)}
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {admitCardData ? (
              <div className="space-y-4 text-xs font-mono">
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-slate-400">Candidate Name</div>
                    <div className="text-sm font-bold text-slate-100 font-sans mt-0.5">{admitCardData.fullName}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Official Roll Number</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">{admitCardData.rollNumber}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Category</div>
                    <div className="text-slate-200 mt-0.5">{admitCardData.category}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Assigned Seat Node</div>
                    <div className="text-amber-400 font-bold mt-0.5">{admitCardData.assignedSeatNode}</div>
                  </div>
                </div>

                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-slate-400 font-bold">Allocated Examination Centre</div>
                  <div className="text-sm font-bold text-slate-100 font-sans">{admitCardData.allocatedCentre?.name}</div>
                  <div className="text-slate-400 font-sans">{admitCardData.allocatedCentre?.address}</div>
                </div>

                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-[10px] text-blue-300">
                  Digitally Signed Checksum: {admitCardData.admitCardSignedChecksum}
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-xs font-mono">Loading admit card parameters...</div>
            )}

            <button
              onClick={() => setShowAdmitCard(false)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors"
            >
              Close Admit Card
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
