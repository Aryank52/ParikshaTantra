import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  Monitor,
  Award,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Building,
  UserCheck,
  Bell,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ViewType } from '../components/Sidebar';

interface CandidateDashboardProps {
  onNavigate: (view: ViewType) => void;
}

export const CandidateDashboard: React.FC<CandidateDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  // Mock next upcoming exam data for candidate
  const nextExam = {
    title: 'UPSC Civil Services Preliminary Examination 2026',
    code: 'UPSC-CSE-2026',
    date: 'Sunday, 24 May 2026',
    shift: 'Shift 1 (General Studies I)',
    reportingTime: '08:30 AM IST',
    gateClosingTime: '09:15 AM IST',
    examTime: '09:30 AM – 11:30 AM IST',
    centreName: 'Kendriya Vidyalaya No. 1, Sector 8, R.K. Puram',
    centreCity: 'New Delhi, Delhi NCR',
    centreCode: 'DEL-001',
    terminalNode: 'Terminal Node 14B',
    status: 'ADMIT_CARD_READY',
    applicationNo: 'APP-2026-987412',
    rollNo: '2601984210',
  };

  return (
    <div className="p-6 space-y-6 font-sans text-slate-100 max-w-7xl mx-auto">
      {/* Welcome & Portal Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-blue-900/50 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-lg font-mono">
            {user?.fullName ? user.fullName.charAt(0) : 'S'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white tracking-wide">
                Welcome, {user?.fullName || 'Candidate'}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded font-mono font-semibold bg-blue-950 border border-blue-500/40 text-blue-300">
                STUDENT PORTAL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Candidate Roll No: <span className="font-mono text-slate-200">{nextExam.rollNo}</span> • Application No: <span className="font-mono text-slate-200">{nextExam.applicationNo}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('DEVICE_CHECK')}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs px-3.5 py-2 rounded-lg font-medium transition-all"
          >
            <Monitor className="w-4 h-4 text-amber-400" />
            <span>Run Device Check</span>
          </button>

          <button
            onClick={() => onNavigate('CBT_PORTAL')}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs px-4 py-2 rounded-lg font-semibold shadow-md transition-all"
          >
            <span>Enter CBT Lobby</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TOP FOCUS: NEXT EXAM CARD */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-blue-500/40 rounded-xl p-6 shadow-2xl space-y-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>UPCOMING EXAM</span>
            </span>
            <span className="text-xs font-mono text-slate-400">Exam Code: {nextExam.code}</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-mono">Admit Card:</span>
            <span className="text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-emerald-900/60 text-emerald-300 border border-emerald-500/40">
              AVAILABLE FOR DOWNLOAD
            </span>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">
            {nextExam.title}
          </h2>
          <p className="text-xs text-slate-400 mt-1">Union Public Service Commission (UPSC) • National CBT & OMR Examination</p>
        </div>

        {/* Next Exam Key Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-lg flex items-start space-x-3">
            <Calendar className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-[11px] font-mono uppercase text-slate-400">Date & Shift</div>
              <div className="text-xs font-bold text-slate-100 mt-0.5">{nextExam.date}</div>
              <div className="text-[11px] text-blue-400 font-medium">{nextExam.shift}</div>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-lg flex items-start space-x-3">
            <Clock className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-[11px] font-mono uppercase text-slate-400">Reporting & Timing</div>
              <div className="text-xs font-bold text-amber-300 mt-0.5">Report: {nextExam.reportingTime}</div>
              <div className="text-[11px] text-slate-400">Gate Closes: {nextExam.gateClosingTime}</div>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-lg flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-[11px] font-mono uppercase text-slate-400">Exam Centre</div>
              <div className="text-xs font-bold text-slate-100 mt-0.5">{nextExam.centreName}</div>
              <div className="text-[11px] text-slate-400">{nextExam.centreCity}</div>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-lg flex items-start space-x-3">
            <UserCheck className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-[11px] font-mono uppercase text-slate-400">Seat Node Allocation</div>
              <div className="text-xs font-bold text-indigo-300 mt-0.5">{nextExam.terminalNode}</div>
              <div className="text-[11px] text-slate-400">Centre Code: {nextExam.centreCode}</div>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons for Next Exam */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => onNavigate('EXAM_CATALOG')}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2.5 rounded-lg font-bold transition-all shadow-md"
          >
            <FileText className="w-4 h-4" />
            <span>Download Admit Card (PDF)</span>
          </button>

          <button
            onClick={() => onNavigate('DEVICE_CHECK')}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2.5 rounded-lg font-semibold border border-slate-700 transition-all"
          >
            <Monitor className="w-4 h-4 text-emerald-400" />
            <span>Pre-Exam System Check</span>
          </button>

          <button
            onClick={() => onNavigate('CBT_PORTAL')}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2.5 rounded-lg font-semibold border border-slate-700 transition-all"
          >
            <Building className="w-4 h-4 text-indigo-400" />
            <span>View Centre Map & Instructions</span>
          </button>
        </div>
      </div>

      {/* CANDIDATE STATUS SNAPSHOT GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: My Applications */}
        <div
          onClick={() => onNavigate('EXAM_CATALOG')}
          className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 p-4 rounded-xl cursor-pointer transition-all hover:bg-slate-850 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-blue-950 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
              1 APPROVED
            </span>
          </div>
          <div className="mt-3">
            <div className="text-sm font-bold text-slate-100">My Applications</div>
            <p className="text-xs text-slate-400 mt-0.5">Track eligibility, fee payments & submitted forms</p>
          </div>
        </div>

        {/* Card 2: Admit Cards */}
        <div
          onClick={() => onNavigate('EXAM_CATALOG')}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-xl cursor-pointer transition-all hover:bg-slate-850 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
              READY
            </span>
          </div>
          <div className="mt-3">
            <div className="text-sm font-bold text-slate-100">Admit Cards</div>
            <p className="text-xs text-slate-400 mt-0.5">Download signed admit cards & seat node slips</p>
          </div>
        </div>

        {/* Card 3: Results & Scorecards */}
        <div
          onClick={() => onNavigate('CERTIFICATE_VERIFY')}
          className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-4 rounded-xl cursor-pointer transition-all hover:bg-slate-850 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              VERIFIABLE
            </span>
          </div>
          <div className="mt-3">
            <div className="text-sm font-bold text-slate-100">Results & Certificates</div>
            <p className="text-xs text-slate-400 mt-0.5">View percentile scores & QR digital certificates</p>
          </div>
        </div>

        {/* Card 4: System Pre-Check */}
        <div
          onClick={() => onNavigate('DEVICE_CHECK')}
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-4 rounded-xl cursor-pointer transition-all hover:bg-slate-850 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-amber-950 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Monitor className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
              PASS
            </span>
          </div>
          <div className="mt-3">
            <div className="text-sm font-bold text-slate-100">Device Hardware Check</div>
            <p className="text-xs text-slate-400 mt-0.5">Verify camera, microphone, display & bandwidth</p>
          </div>
        </div>
      </div>

      {/* ANNOUNCEMENTS & EXAM CALENDAR SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Official Candidate Announcements (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <h3 className="font-mono text-sm font-bold text-slate-100">OFFICIAL CANDIDATE ANNOUNCEMENTS</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">UPDATED REAL-TIME</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-lg space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-400">UPSC Civil Services Prelims 2026 Admit Cards Issued</span>
                <span className="text-[10px] font-mono text-slate-400">19 Aug 2026</span>
              </div>
              <p className="text-slate-300">
                All eligible candidates can now download their QR-verifiable admit card. Reporting time at test centre starts strictly at 08:30 AM IST.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-lg space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400">Mandatory Biometric & Pre-Exam Device Check Guidelines</span>
                <span className="text-[10px] font-mono text-slate-400">18 Aug 2026</span>
              </div>
              <p className="text-slate-300">
                Candidates taking remote/centre CBT sessions are advised to run the 5-point hardware diagnostic test 24 hours prior to the examination.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-lg space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400">NTA NEET-UG 2026 Result Key Verification Window</span>
                <span className="text-[10px] font-mono text-slate-400">15 Aug 2026</span>
              </div>
              <p className="text-slate-300">
                Answer key challenge window is open for NTA candidates. All challenge submissions are logged on the tamper-evident audit ledger.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Exam Calendar (1 Col) */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <h3 className="font-mono text-sm font-bold text-slate-100">NATIONAL EXAM CALENDAR</h3>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3 rounded-lg">
              <div>
                <div className="font-bold text-slate-200">UPSC CSE Prelims</div>
                <div className="text-[10px] text-slate-400">24 May 2026</div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/30">
                CONFIRMED
              </span>
            </div>

            <div className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3 rounded-lg">
              <div>
                <div className="font-bold text-slate-200">NTA NEET-UG</div>
                <div className="text-[10px] text-slate-400">07 June 2026</div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                UPCOMING
              </span>
            </div>

            <div className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3 rounded-lg">
              <div>
                <div className="font-bold text-slate-200">SSC CGL Tier-I</div>
                <div className="text-[10px] text-slate-400">14 July 2026</div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                APPLY NOW
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('EXAM_CATALOG')}
            className="w-full text-center text-xs font-mono text-blue-400 hover:text-blue-300 border border-blue-500/30 bg-blue-950/40 hover:bg-blue-900/50 py-2 rounded-lg transition-colors"
          >
            Explore Full Exam Catalog →
          </button>
        </div>
      </div>
    </div>
  );
};
