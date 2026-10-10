import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { FraudAlertDrawer } from '../insights/FraudAlertDrawer';
import { AddEditTransactionModal } from '../transactions/AddEditTransactionModal';
import { ToastContainer } from '../common/Toast';
import { useFinancial } from '../../context/FinancialContext';

import { GradientTransition } from '../common/GradientTransition';

const TAB_INDEX_MAP = {
  dashboard: 0,
  transactions: 1,
  'ai-assistant': 2,
  insights: 3,
  security: 4,
  reports: 5,
  profile: 6,
  admin: 7,
};

export const MainLayout = ({ children }) => {
  const { activeTab } = useFinancial();
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const prevTabRef = useRef(activeTab);
  const rightViewportRef = useRef(null);

  const prevIndex = TAB_INDEX_MAP[prevTabRef.current] ?? 0;
  const currentIndex = TAB_INDEX_MAP[activeTab] ?? 0;
  const direction = currentIndex >= prevIndex ? 1 : -1;

  useEffect(() => {
    prevTabRef.current = activeTab;
    if (rightViewportRef.current) {
      rightViewportRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  // Framer Motion vertical fade-out when moving up & fade-in when back to top
  const rightContentVariants = {
    initial: (dir) => ({
      y: dir > 0 ? 60 : -60,
      opacity: 0,
      scale: 0.98,
      filter: 'blur(10px)',
    }),
    animate: {
      y: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        type: 'spring',
        stiffness: 240,
        damping: 24,
        mass: 0.7,
      },
    },
    exit: (dir) => ({
      y: dir > 0 ? -60 : 60,
      opacity: 0,
      scale: 0.98,
      filter: 'blur(10px)',
      transition: {
        duration: 0.28,
        ease: [0.16, 1, 0.3, 1],
      },
    }),
  };

  return (
    <div className="min-h-screen flex bg-transparent text-slate-100 light:text-slate-900 selection:bg-indigo-500 selection:text-white transition-colors overflow-hidden relative">
      {/* Background ambient glowing gradient mesh orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-10%] right-[-5%] w-[550px] h-[550px] rounded-full bg-gradient-to-br from-indigo-600/15 via-purple-600/12 to-transparent blur-[130px] light:from-indigo-400/25 light:via-purple-400/20" />
        <div className="absolute bottom-[-10%] left-[10%] w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-pink-600/12 via-rose-500/10 to-transparent blur-[140px] light:from-pink-400/20 light:via-rose-400/15" />
        <div className="absolute top-[40%] right-[25%] w-[450px] h-[450px] rounded-full bg-gradient-to-r from-cyan-500/10 via-emerald-500/10 to-transparent blur-[130px] light:from-cyan-400/20 light:via-emerald-400/15" />
      </div>

      {/* Modern Gradient Aura Overlay on tab switch */}
      <GradientTransition activeKey={activeTab} />

      {/* FIXED LEFT SIDEBAR: Never moves during tab transitions */}
      <Sidebar />

      {/* RIGHT SIDE AREA: Header and animated page content container */}
      <div ref={rightViewportRef} className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8 h-screen overflow-y-auto scroll-smooth">
        {/* Fixed Header */}
        <Header onOpenAddTxModal={() => setIsAddTxModalOpen(true)} />

        {/* ONLY RIGHT CONTENT AREA ANIMATES (Fades out going up, fades in back to top) */}
        <main className="relative flex-1 p-4 sm:p-6 xl:p-9 max-w-[1600px] w-full mx-auto space-y-8">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={activeTab}
              custom={direction}
              variants={rightContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full space-y-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Security & Fraud Alert Drawer */}
      <FraudAlertDrawer />

      {/* Quick Add Transaction Modal */}
      <AddEditTransactionModal
        isOpen={isAddTxModalOpen}
        onClose={() => setIsAddTxModalOpen(false)}
      />

      {/* Toast Notification Container */}
      <ToastContainer />
    </div>
  );
};
