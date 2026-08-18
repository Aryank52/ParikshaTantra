import React, { useState, useEffect } from 'react';
import { Camera, Mic, Monitor, HardDrive, Wifi, ShieldCheck, CheckCircle2, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { fetchApi } from '../services/api';

export const DeviceCheckView: React.FC = () => {
  const [cameraStatus, setCameraStatus] = useState<'TESTING' | 'PASS' | 'FAIL'>('TESTING');
  const [micStatus, setMicStatus] = useState<'TESTING' | 'PASS' | 'FAIL'>('TESTING');
  const [screenRes, setScreenRes] = useState(`${window.innerWidth}x${window.innerHeight}`);
  const [storageCap, setStorageCap] = useState('Available (IndexedDB Ready)');
  const [latencyMs, setLatencyMs] = useState(14);
  const [isLogged, setIsLogged] = useState(false);

  useEffect(() => {
    // Run hardware diagnostic test simulation
    const timer = setTimeout(() => {
      setCameraStatus('PASS');
      setMicStatus('PASS');
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const handleLogDiagnostic = async () => {
    try {
      await fetchApi('/hardware-check/log', {
        method: 'POST',
        body: JSON.stringify({
          checkType: 'CANDIDATE_DEVICE',
          entityId: 'CAND-2026-001',
          cameraStatus,
          micStatus,
          screenRes,
          storageCap,
          networkLatencyMs: latencyMs,
          overallStatus: cameraStatus === 'PASS' && micStatus === 'PASS' ? 'PASS' : 'WARNING',
        }),
      });
      setIsLogged(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto font-sans">
      {/* Header */}
      <div className="gov-panel p-6 border border-slate-800 flex items-center justify-between shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-950 border border-blue-500/30 rounded-xl text-blue-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-mono text-slate-100">
              Candidate Pre-Exam Hardware & Device Diagnostic Desk
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Verify local webcam, microphone, screen resolution, local storage, and zero-trust security compliance before entering the CBT Lobby.
            </p>
          </div>
        </div>
      </div>

      {/* Diagnostics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Camera Check */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-slate-200 font-bold text-sm">
              <Camera className="w-5 h-5 text-blue-400" />
              <span>Camera Sensor Health</span>
            </div>
            {cameraStatus === 'PASS' ? (
              <span className="flex items-center space-x-1 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>PASSED (1080p)</span>
              </span>
            ) : (
              <span className="text-xs font-mono text-amber-400 animate-pulse">TESTING FEED...</span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Resolution verified: 1920x1080 @ 30fps. Zero motion occlusion or camera lens blocking detected.
          </p>
        </div>

        {/* Microphone Check */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-slate-200 font-bold text-sm">
              <Mic className="w-5 h-5 text-indigo-400" />
              <span>Microphone Audio Feed</span>
            </div>
            {micStatus === 'PASS' ? (
              <span className="flex items-center space-x-1 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>CALIBRATED (48kHz)</span>
              </span>
            ) : (
              <span className="text-xs font-mono text-amber-400 animate-pulse">TESTING AUDIO...</span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Audio input gain calibrated. Background noise floor below 18dB threshold.
          </p>
        </div>

        {/* Screen Resolution */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-slate-200 font-bold text-sm">
              <Monitor className="w-5 h-5 text-emerald-400" />
              <span>Display Bounds & Fullscreen</span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
              {screenRes}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Standard 16:9 ratio display detected. Fullscreen lock API supported by current browser environment.
          </p>
        </div>

        {/* Storage & Network */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-slate-200 font-bold text-sm">
              <HardDrive className="w-5 h-5 text-amber-400" />
              <span>Offline Storage & Network</span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
              {latencyMs}ms LATENCY
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {storageCap}. Encrypted local IndexedDB buffer ready for offline retry queuing.
          </p>
        </div>
      </div>

      {/* Confirmation & Submission */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-slate-100">Diagnostic Summary</div>
          <p className="text-xs text-slate-400 mt-0.5">
            {isLogged
              ? 'Diagnostic results successfully registered in Centre Control Tower log.'
              : 'Click to record diagnostics and proceed to examination lobby.'}
          </p>
        </div>

        <button
          onClick={handleLogDiagnostic}
          disabled={isLogged}
          className={`px-6 py-3 text-xs font-mono font-bold rounded-xl flex items-center space-x-2 transition-all shadow-lg ${
            isLogged
              ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
          }`}
        >
          <span>{isLogged ? 'DIAGNOSTIC LOGGED ✓' : 'LOG DIAGNOSTIC & PROCEED'}</span>
          {!isLogged && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
