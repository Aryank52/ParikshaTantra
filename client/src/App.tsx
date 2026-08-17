import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { Sidebar, ViewType } from './components/Sidebar';

import { NationalLandingPage } from './views/NationalLandingPage';
import { PublicExamCatalog } from './views/PublicExamCatalog';
import { CandidateCBT } from './views/CandidateCBT';
import { AuthorityPortal } from './views/AuthorityPortal';
import { StateDistrictPortalView } from './views/StateDistrictPortalView';
import { CentrePortal } from './views/CentrePortal';
import { SOCDashboard } from './views/SOCDashboard';
import { LeakDetectionView } from './views/LeakDetectionView';
import { InsiderThreatView } from './views/InsiderThreatView';
import { AuditView } from './views/AuditView';
import { PublicVerificationPortal } from './views/PublicVerificationPortal';
import { AttackSimulatorView } from './views/AttackSimulatorView';

export const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('LANDING');

  const renderView = () => {
    switch (currentView) {
      case 'LANDING':
        return <NationalLandingPage onNavigate={setCurrentView} />;
      case 'EXAM_CATALOG':
        return <PublicExamCatalog />;
      case 'CBT_PORTAL':
        return <CandidateCBT />;
      case 'AUTHORITY_PORTAL':
        return <AuthorityPortal />;
      case 'STATE_DISTRICT':
        return <StateDistrictPortalView />;
      case 'CENTRE_PORTAL':
        return <CentrePortal />;
      case 'SOC_OPERATIONS':
        return <SOCDashboard />;
      case 'LEAK_DETECTION':
        return <LeakDetectionView />;
      case 'INSIDER_THREAT':
        return <InsiderThreatView />;
      case 'AUDIT_LEDGER':
        return <AuditView />;
      case 'CERTIFICATE_VERIFY':
        return <PublicVerificationPortal />;
      case 'ATTACK_SIMULATOR':
        return <AttackSimulatorView />;
      default:
        return <NationalLandingPage onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#080E18] flex flex-col font-sans">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentView={currentView} onSelectView={setCurrentView} />
        <main className="flex-1 overflow-y-auto bg-[#080E18]">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
