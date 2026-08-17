import React, { useState, useEffect } from 'react';
import { Landmark, Building2, MapPin, CheckCircle2, ShieldAlert, Users, Server } from 'lucide-react';
import { fetchApi } from '../services/api';

export const StateDistrictPortalView: React.FC = () => {
  const [centres, setCentres] = useState<any[]>([]);
  const [selectedState, setSelectedState] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/centres');
      setCentres(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCentres = centres.filter(
    (c) => selectedState === 'ALL' || c.state.toLowerCase() === selectedState.toLowerCase()
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Landmark className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-slate-100">State & District Governance Portal</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-semibold">
                REGIONAL OVERSIGHT
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              State Public Service Commission • District Magistrate Administrative Tier
            </p>
          </div>
        </div>

        {/* State Filter */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs font-mono">
          <span className="text-slate-400 font-bold">Filter State / Region:</span>
          <select
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer font-bold"
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
          >
            <option value="ALL">ALL STATES & REGIONS</option>
            <option value="Delhi">Delhi NCT</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Telangana">Telangana</option>
            <option value="Uttar Pradesh">Uttar Pradesh</option>
            <option value="Bihar">Bihar</option>
            <option value="Rajasthan">Rajasthan</option>
            <option value="West Bengal">West Bengal</option>
            <option value="Madhya Pradesh">Madhya Pradesh</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Gujarat">Gujarat</option>
            <option value="Punjab">Punjab</option>
          </select>
        </div>
      </div>

      {/* Regional Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="text-slate-400">Active Exam Centres</div>
          <div className="text-2xl font-black text-blue-400">{filteredCentres.length}</div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="text-slate-400">Total Seating Capacity</div>
          <div className="text-2xl font-black text-emerald-400">
            {filteredCentres.reduce((acc, c) => acc + c.capacity, 0).toLocaleString()} Seats
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="text-slate-400">Gateway Connectivity</div>
          <div className="text-2xl font-black text-emerald-400">100% ONLINE</div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="text-slate-400">Regional Threat State</div>
          <div className="text-2xl font-black text-emerald-400">GREEN (ZERO ANOMALIES)</div>
        </div>
      </div>

      {/* District Centre Oversight Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 font-mono">LANDMARK EXAMINATION CENTRES NETWORK</h3>
          <span className="text-xs text-slate-400 font-mono">Showing {filteredCentres.length} digital examination nodes</span>
        </div>

        <div className="space-y-3">
          {filteredCentres.map((c) => (
            <div key={c.id} className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono">
              <div className="flex items-center space-x-4">
                <div className="p-2.5 bg-slate-800 rounded-xl text-indigo-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-100 text-sm font-sans">{c.name}</div>
                  <div className="text-slate-400 mt-0.5">
                    District: <strong className="text-slate-200">{c.district} ({c.state})</strong> | Code: <strong className="text-blue-400">{c.centreCode}</strong> | Capacity: {c.capacity} Seats
                  </div>
                  <div className="text-slate-500 font-sans mt-0.5 flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{c.address}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="px-2.5 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/30 rounded-lg text-[10px] font-bold">
                  {c.connectivityStatus}
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  {c.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
