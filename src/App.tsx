/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { HomeView } from './components/views/HomeView';
import { CatalogView } from './components/views/CatalogView';
import { DesignSystemView } from './components/views/DesignSystemView';
import { ManifestoView } from './components/views/ManifestoView';
import { WorkDetailModal } from './components/modals/WorkDetailModal';
import { PublishModal } from './components/modals/PublishModal';
import { SearchModal } from './components/modals/SearchModal';
import { ToastContainer } from './components/ui/ToastContainer';
import { ApiDiagnostics } from './components/dev/ApiDiagnostics';
import { Work, WorkFormat, Author } from './types';

import { Navigation, NavigationModule } from './components/layout/Navigation';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<'home' | 'catalog' | 'design-system' | 'manifesto'>('home');
  const [catalogFormat, setCatalogFormat] = useState<WorkFormat | 'all'>('all');
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Keyboard shortcut: Cmd+K / Ctrl+K to open Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigateToCatalog = (format: WorkFormat | 'all' = 'all') => {
    setCatalogFormat(format);
    setCurrentTab('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToDesignSystem = () => {
    setCurrentTab('design-system');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectWork = (work: Work) => {
    setSelectedWork(work);
  };

  const activeNavModule: NavigationModule = 
    currentTab === 'catalog'
      ? (catalogFormat === 'romance' || catalogFormat === 'conto' || catalogFormat === 'poesia'
          ? 'prose'
          : catalogFormat === 'hq' || catalogFormat === 'manga'
          ? 'visual'
          : 'catalog')
      : currentTab;

  const handleSelectNavModule = (mod: NavigationModule) => {
    if (mod === 'prose') {
      setCatalogFormat('romance');
      setCurrentTab('catalog');
    } else if (mod === 'visual') {
      setCatalogFormat('hq');
      setCurrentTab('catalog');
    } else if (mod === 'catalog') {
      setCatalogFormat('all');
      setCurrentTab('catalog');
    } else if (mod === 'authors') {
      setCurrentTab('home');
    } else if (mod === 'home' || mod === 'design-system' || mod === 'manifesto') {
      setCurrentTab(mod);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B1220] text-[#0B1220] dark:text-[#F8FAFC] transition-colors duration-200">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onNavigate={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSearch={() => setIsSearchModalOpen(true)}
        onOpenPublishModal={() => setIsPublishModalOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(true)}
      />

      {/* Contextual Specialized Navigation Bar */}
      <Navigation
        activeModule={activeNavModule}
        onSelectModule={handleSelectNavModule}
      />

      {/* Responsive Drawer Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentTab={currentTab}
        onNavigate={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenPublishModal={() => setIsPublishModalOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <HomeView
            onSelectWork={handleSelectWork}
            onNavigateToCatalog={handleNavigateToCatalog}
            onNavigateToDesignSystem={handleNavigateToDesignSystem}
            onOpenPublishModal={() => setIsPublishModalOpen(true)}
          />
        )}

        {currentTab === 'catalog' && (
          <CatalogView
            initialFormat={catalogFormat}
            onSelectWork={handleSelectWork}
          />
        )}

        {currentTab === 'design-system' && (
          <DesignSystemView />
        )}

        {currentTab === 'manifesto' && (
          <ManifestoView
            onNavigateToCatalog={() => handleNavigateToCatalog('all')}
            onOpenPublishModal={() => setIsPublishModalOpen(true)}
          />
        )}
      </main>

      {/* Institutional Footer */}
      <Footer
        onNavigate={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Modals & Portals */}
      <WorkDetailModal
        work={selectedWork}
        isOpen={Boolean(selectedWork)}
        onClose={() => setSelectedWork(null)}
      />

      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
      />

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectWork={handleSelectWork}
      />

      {/* Dev-only Temporary API Diagnostics Panel */}
      {import.meta.env.DEV && <ApiDiagnostics />}

      {/* Notification Toast Stack */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
