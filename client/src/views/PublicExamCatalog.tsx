import React, { useState, useEffect } from 'react';
import { Search, BookOpen, ExternalLink, Calendar, MapPin, Award, CheckCircle2, Info } from 'lucide-react';
import { ExamCatalogEntry, StateMaster } from '../types';

export const PublicExamCatalog: React.FC = () => {
  const [exams, setExams] = useState<ExamCatalogEntry[]>([]);
  const [states, setStates] = useState<StateMaster[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchCatalog();
    fetchStates();
  }, [selectedCategory, selectedLevel, selectedState]);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (selectedLevel !== 'ALL') params.append('level', selectedLevel);
      if (selectedState !== 'ALL') params.append('state', selectedState);

      const res = await fetch(`http://localhost:5000/api/catalog/exams?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setExams(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch exam catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStates = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/catalog/states');
      const data = await res.json();
      if (data.success) {
        setStates(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch states:', err);
    }
  };

  const filteredExams = exams.filter((exam) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      exam.title.toLowerCase().includes(q) ||
      exam.shortName.toLowerCase().includes(q) ||
      exam.authorityName.toLowerCase().includes(q) ||
      exam.authorityCode.toLowerCase().includes(q)
    );
  });

  const categories = [
    'ALL',
    'RECRUITMENT',
    'ENTRANCE',
    'BANKING',
    'RAILWAYS',
    'DEFENCE',
    'MEDICAL',
    'ENGINEERING',
    'LAW',
    'MANAGEMENT'
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Catalog Header */}
      <div className="gov-panel p-6 bg-slate-900 border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono font-semibold text-blue-400">
              <BookOpen className="w-4 h-4" />
              <span>NATIONAL EXAMINATION REGISTRY</span>
            </div>
            <h1 className="text-2xl font-bold font-mono text-white mt-1">Public Examination Catalog</h1>
            <p className="text-xs text-slate-400">Official catalog of Central and State Public Service Commission examinations across India.</p>
          </div>

          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-amber-400">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>REFERENCE DATASET (Prototypes labeled for compliance)</span>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search exam title, authority (e.g. UPSC, MPSC)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 pl-9 pr-3 py-2.5 rounded focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {/* Level Filter */}
          <div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-2.5 rounded focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="ALL">Level: All Authorities</option>
              <option value="CENTRAL">Level: Central / All India</option>
              <option value="STATE">Level: State PSCs</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-2.5 rounded focus:outline-none focus:border-blue-500 font-mono"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>Category: {cat}</option>
              ))}
            </select>
          </div>

          {/* State Filter */}
          <div>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-2.5 rounded focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="ALL">State: All States / UTs</option>
              {states.map((st) => (
                <option key={st.id} value={st.name}>{st.name} ({st.pscName})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Exam List Grid */}
      {loading ? (
        <div className="gov-panel p-12 text-center text-xs font-mono text-slate-400">
          Loading Examination Catalog...
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="gov-panel p-12 text-center space-y-2">
          <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
          <div className="text-sm font-mono font-bold text-slate-300">No examinations match selected criteria</div>
          <p className="text-xs text-slate-500">Try adjusting filters or keyword search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredExams.map((exam) => (
            <div key={exam.id} className="gov-panel p-6 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold badge-active uppercase">
                      {exam.authorityCode} • {exam.category}
                    </span>
                    <h3 className="text-base font-bold font-mono text-slate-100">{exam.title}</h3>
                    <p className="text-xs text-slate-400">{exam.authorityName}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    {exam.level}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300 bg-slate-950 p-3 rounded border border-slate-800">
                  <div>
                    <span className="text-slate-500 block text-[10px]">APPLICATION WINDOW</span>
                    <span>{new Date(exam.applicationStart).toLocaleDateString()} - {new Date(exam.applicationEnd).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">EXAM DATE</span>
                    <span className="text-amber-400 font-bold">{new Date(exam.examDate).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">ELIGIBILITY AGE</span>
                    <span>{exam.minAge} - {exam.maxAge} Years</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">APPLICATION FEE</span>
                    <span>₹{exam.feeAmount}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-400 leading-relaxed">
                  <span className="font-bold text-slate-300 block font-mono">Syllabus Overview:</span>
                  {exam.syllabusOverview}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-[10px] font-mono text-slate-500">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>DATASET: {exam.representationType} (DEMO DATA)</span>
                </div>

                <a
                  href={exam.officialSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 font-mono font-bold flex items-center space-x-1"
                >
                  <span>Official Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
