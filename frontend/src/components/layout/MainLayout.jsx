import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { AddEditTransactionModal } from '../transactions/AddEditTransactionModal';
import { StatementUploadModal } from '../transactions/StatementUploadModal';
import { useFinancial } from '../../context/FinancialContext';

const TAB_INDEX_MAP = {
  dashboard: 0,
  transactions: 1,
  categories: 2,
  'ai-assistant': 3,
  insights: 4,
  security: 5,
  reports: 6,
  profile: 7,
  admin: 8,
};

export const MainLayout = ({ children }) => {
  const { activeTab, isStatementModalOpen, closeStatementModal } = useFinancial();
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const prevTabRef = useRef(activeTab);
  const rightViewportRef = useRef(null);

  const prevIndex = TAB_INDEX_MAP[prevTabRef.current] ?? 0;
  const currentIndex = TAB_INDEX_MAP[activeTab] ?? 0;
  const direction = currentIndex >= prevIndex ? 1 : -1;

  useEffect(() => {
    prevTabRef.current = activeTab;
    if (rightViewportRef.current) {
      rightViewportRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [activeTab]);

  // Clean, subtle fade transition - fast, responsive, and purposeful (like Linear / Stripe)
  const rightContentVariants = {
    initial: {
      opacity: 0,
      y: 4,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.16,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.1,
        ease: 'easeIn',
      },
    },
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors overflow-hidden relative">
      {/* FIXED LEFT SIDEBAR: Never moves during tab transitions */}
      <Sidebar />

      {/* RIGHT SIDE AREA: Header and animated page content container */}
      <div ref={rightViewportRef} className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8 h-screen overflow-y-auto">
        {/* Fixed Header */}
        <Header onOpenAddTxModal={() => setIsAddTxModalOpen(true)} />

        {/* MAIN CONTENT AREA */}
        <main className="relative flex-1 p-4 sm:p-6 lg:p-8 max-w-[1500px] w-full mx-auto space-y-6">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={activeTab}
              variants={rightContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full space-y-6"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Quick Add Transaction Modal */}
      <AddEditTransactionModal
        isOpen={isAddTxModalOpen}
        onClose={() => setIsAddTxModalOpen(false)}
      />

      {/* Global Statement Upload Modal */}
      <StatementUploadModal
        isOpen={isStatementModalOpen}
        onClose={closeStatementModal}
      />
    </div>
  );
};
