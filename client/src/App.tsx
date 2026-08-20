import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { Sidebar, ViewType } from './components/Sidebar';
import { ParikshaAIAssistant } from './components/ParikshaAIAssistant';

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

import { ExamDayControlTower } from './views/ExamDayControlTower';
import { CentreGatewayView } from './views/CentreGatewayView';
import { TerminalManagementView } from './views/TerminalManagementView';
import { CandidateArrivalView } from './views/CandidateArrivalView';
import { LeakForensicsWorkbench } from './views/LeakForensicsWorkbench';
import { StatusView } from './views/StatusView';
import { DeviceCheckView } from './views/DeviceCheckView';
import { HardwareCheckView } from './views/HardwareCheckView';
import { AnswerSheetUploadView } from './views/AnswerSheetUploadView';

import { CandidateDashboard } from './views/CandidateDashboard';
import { CandidateProfileView } from './views/CandidateProfileView';
import { NotificationsView } from './views/NotificationsView';
import { LoginView } from './views/LoginView';

export const AppContent: React.FC = () => {
  const [portalMode, setPortalMode] = useState<'STUDENT' | 'GOVERNMENT'>('STUDENT');
  const [currentView, setCurrentView] = useState<ViewType>('CANDIDATE_DASHBOARD');
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);

  const handlePortalSwitch = (mode: 'STUDENT' | 'GOVERNMENT') => {
    setPortalMode(mode);
    if (mode === 'STUDENT') {
      setCurrentView('CANDIDATE_DASHBOARD');
    } else {
      setCurrentView('CONTROL_TOWER');
    }
  };

  const handleAiAction = (actionCode: string) => {
    switch (actionCode) {
      case 'NAVIGATE_APPLICATIONS':
      case 'NAVIGATE_CATALOG':
        setCurrentView('EXAM_CATALOG');
        break;
      case 'RUN_DEVICE_CHECK':
        setCurrentView('DEVICE_CHECK');
        break;
      case 'NAVIGATE_CENTRES':
        setCurrentView('CENTRE_PORTAL');
        break;
      case 'NAVIGATE_SOC':
        setCurrentView('SOC_OPERATIONS');
        break;
      case 'NAVIGATE_AUDIT':
        setCurrentView('AUDIT_LEDGER');
        break;
      case 'NAVIGATE_NATIONAL':
        setCurrentView('AUTHORITY_PORTAL');
        break;
      case 'NAVIGATE_SIMULATOR':
        setCurrentView('ATTACK_SIMULATOR');
        break;
      default:
        setCurrentView('EXAM_CATALOG');
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'LANDING':
        return <NationalLandingPage onNavigate={setCurrentView} />;
      case 'LOGIN':
        return <LoginView onNavigate={setCurrentView} onSelectPortal={handlePortalSwitch} />;
      case 'CANDIDATE_DASHBOARD':
        return <CandidateDashboard onNavigate={setCurrentView} />;
      case 'CANDIDATE_PROFILE':
        return <CandidateProfileView onNavigate={setCurrentView} />;
      case 'NOTIFICATIONS':
        return <NotificationsView portalContext={portalMode} onNavigate={setCurrentView} />;
      case 'EXAM_CATALOG':
        return <PublicExamCatalog />;
      case 'CONTROL_TOWER':
        return <ExamDayControlTower />;
      case 'CANDIDATE_ARRIVAL':
        return <CandidateArrivalView />;
      case 'DEVICE_CHECK':
        return <DeviceCheckView />;
      case 'HARDWARE_CHECK':
        return <HardwareCheckView />;
      case 'ANSWER_SHEETS':
        return <AnswerSheetUploadView />;
      case 'CENTRE_GATEWAY':
        return <CentreGatewayView />;
      case 'TERMINAL_MANAGEMENT':
        return <TerminalManagementView />;
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
      case 'LEAK_FORENSICS':
        return <LeakForensicsWorkbench />;
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
      case 'SYSTEM_STATUS':
        return <StatusView />;
      default:
        return <CandidateDashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#080E18] flex flex-col font-sans relative">
      <Header
        portalMode={portalMode}
        onTogglePortal={handlePortalSwitch}
        onOpenAiAssistant={() => setAiAssistantOpen(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          portalMode={portalMode}
          currentView={currentView}
          onSelectView={setCurrentView}
          onTogglePortal={handlePortalSwitch}
        />
        <main className="flex-1 overflow-y-auto bg-[#080E18]">
          {renderView()}
        </main>
      </div>

      {/* Floating Pariksha AI Assistant & Copilot */}
      <ParikshaAIAssistant
        portalContext={portalMode}
        onExecuteAction={handleAiAction}
        isOpenDefault={aiAssistantOpen}
      />
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
