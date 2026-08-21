import React, { useState, useEffect } from 'react';
import { UserPlus, X, CheckCircle2, AlertCircle, Award, Search, ArrowRight, ArrowLeft, Shield } from 'lucide-react';
import { ExamCatalogEntry } from '../types';
import { fetchApi } from '../services/api';

interface CandidateRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (admitCard: any) => void;
}

export const CandidateRegistrationModal: React.FC<CandidateRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<number>(1);
  const [exams, setExams] = useState<ExamCatalogEntry[]>([]);

  // Form Fields
  const [fullName, setFullName] = useState<string>('Aarav Sharma');
  const [email, setEmail] = useState<string>('aarav.sharma@nta.ac.in');
  const [category, setCategory] = useState<string>('GENERAL');
  const [dob, setDob] = useState<string>('2004-05-15');
  const [age, setAge] = useState<number>(21);
  const [qualification, setQualification] = useState<string>('Class 12 Senior Secondary (PCB)');
  const [selectedExamCode, setSelectedExamCode] = useState<string>('CAT-NEET-2026');
  const [preferredCity1, setPreferredCity1] = useState<string>('Delhi NCR');
  const [preferredCity2, setPreferredCity2] = useState<string>('Jaipur');

  // Eligibility Evaluation State
  const [eligibilityResult, setEligibilityResult] = useState<any>(null);
  const [checkingEligibility, setCheckingEligibility] = useState<boolean>(false);

  // Submission State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchExams();
    }
  }, [isOpen]);

  const fetchExams = async () => {
    try {
      const data = await fetchApi('/catalog/exams');
      if (data.success) {
        setExams(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch catalog:', err);
    }
  };

  if (!isOpen) return null;

  const evaluateEligibility = async () => {
    try {
      setCheckingEligibility(true);
      setError(null);

      const data = await fetchApi('/registration/eligibility-check', {
        method: 'POST',
        body: JSON.stringify({
          examCatalogCode: selectedExamCode,
          age,
          qualification
        })
      });
      if (data.success) {
        setEligibilityResult(data);
        setStep(3);
      } else {
        setError(data.error || 'Eligibility check failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleSubmitApplication = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const data = await fetchApi('/registration/apply', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          email,
          category,
          dob,
          qualification,
          examCatalogCode: selectedExamCode,
          preferredCity1,
          preferredCity2
        })
      });
      if (data.success && data.admitCard) {
        onSuccess(data.admitCard);
        onClose();
      } else {
        setError(data.error || 'Application submission failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="gov-panel w-full max-w-2xl bg-slate-900 border-slate-700 shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-blue-950 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-mono text-white">Candidate Registration & Eligibility Portal</h2>
              <p className="text-xs text-slate-400">National Centralized Candidate Application System</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-3 gap-2 font-mono text-xs text-center">
          <div className={`p-2 rounded border ${step === 1 ? 'bg-blue-950 text-blue-300 border-blue-500/50 font-bold' : 'bg-slate-950 text-slate-500 border-slate-800'}`}>
            1. Personal & Qualifications
          </div>
          <div className={`p-2 rounded border ${step === 2 ? 'bg-blue-950 text-blue-300 border-blue-500/50 font-bold' : 'bg-slate-950 text-slate-500 border-slate-800'}`}>
            2. Exam & Eligibility
          </div>
          <div className={`p-2 rounded border ${step === 3 ? 'bg-blue-950 text-blue-300 border-blue-500/50 font-bold' : 'bg-slate-950 text-slate-500 border-slate-800'}`}>
            3. Review & Admit Card
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-950/50 border border-red-500/50 text-red-200 text-xs rounded font-mono flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Personal Details */}
        {step === 1 && (
          <div className="space-y-4 text-xs font-mono">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="GENERAL">GENERAL</option>
                  <option value="OBC">OBC (Non-Creamy Layer)</option>
                  <option value="SC">SC (Scheduled Caste)</option>
                  <option value="ST">ST (Scheduled Tribe)</option>
                  <option value="EWS">EWS (Economically Weaker Section)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Candidate Age (Years)</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Highest Educational Qualification</label>
              <input
                type="text"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded flex items-center space-x-2"
              >
                <span>Next: Select Exam</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Exam & Eligibility */}
        {step === 2 && (
          <div className="space-y-4 text-xs font-mono">
            <div>
              <label className="text-slate-400 block mb-1">Select Target Examination</label>
              <select
                value={selectedExamCode}
                onChange={(e) => setSelectedExamCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded focus:outline-none focus:border-blue-500"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.catalogCode}>
                    [{ex.authorityCode}] {ex.title} (Fee: ₹{ex.feeAmount})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 block mb-1">Preferred Exam City Choice 1</label>
                <input
                  type="text"
                  value={preferredCity1}
                  onChange={(e) => setPreferredCity1(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Preferred Exam City Choice 2</label>
                <input
                  type="text"
                  value={preferredCity2}
                  onChange={(e) => setPreferredCity2(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                onClick={evaluateEligibility}
                disabled={checkingEligibility}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded flex items-center space-x-2"
              >
                <span>{checkingEligibility ? 'Evaluating Rules...' : 'Evaluate Eligibility'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Review & Submit */}
        {step === 3 && eligibilityResult && (
          <div className="space-y-4 text-xs font-mono">
            <div className={`p-4 rounded border ${eligibilityResult.isEligible ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' : 'bg-red-950/40 border-red-500/50 text-red-300'}`}>
              <div className="flex items-center space-x-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>ELIGIBILITY STATUS: {eligibilityResult.isEligible ? 'CONFIRMED ELIGIBLE' : 'NOT ELIGIBLE'}</span>
              </div>
              <ul className="mt-2 space-y-1 text-[11px] list-disc list-inside">
                {eligibilityResult.reasons.map((r: string, idx: number) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2">
              <div className="font-bold text-slate-200">Application Summary</div>
              <div className="grid grid-cols-2 gap-2 text-slate-400">
                <div>Candidate: <span className="text-slate-200">{fullName}</span></div>
                <div>Category: <span className="text-slate-200">{category}</span></div>
                <div>Exam: <span className="text-slate-200">{selectedExamCode}</span></div>
                <div>Allocated City: <span className="text-slate-200">{preferredCity1}</span></div>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                onClick={handleSubmitApplication}
                disabled={submitting}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded flex items-center space-x-2"
              >
                <Award className="w-4 h-4 text-amber-300" />
                <span>{submitting ? 'Submitting Application...' : 'Submit & Generate Admit Card'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
