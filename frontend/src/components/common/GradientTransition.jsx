import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const GradientTransition = ({ activeKey }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeKey}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: [0, 1, 0], scale: [0.96, 1.02, 1.05] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-40 overflow-hidden select-none"
      >
        {/* Top-right vibrant violet/indigo glowing gradient aura */}
        <motion.div
          initial={{ opacity: 0, x: 120, y: -120 }}
          animate={{ opacity: [0, 0.55, 0], x: [120, 0, -60], y: [-120, 0, 60] }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="absolute -top-32 -right-32 w-[650px] h-[650px] rounded-full bg-gradient-to-br from-indigo-500/35 via-purple-600/30 to-pink-500/25 blur-[100px]"
        />

        {/* Bottom-left electric cyan/emerald glowing gradient aura */}
        <motion.div
          initial={{ opacity: 0, x: -120, y: 120 }}
          animate={{ opacity: [0, 0.45, 0], x: [-120, 0, 60], y: [120, 0, -60] }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="absolute -bottom-32 -left-32 w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-cyan-500/30 via-teal-500/25 to-indigo-600/20 blur-[100px]"
        />

        {/* Center luminous radiant sweep */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0, 0.35, 0], scale: [0.8, 1.25, 1.4] }}
          transition={{ duration: 0.48, ease: "easeOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-gradient-to-r from-indigo-500/20 via-purple-500/25 to-pink-500/20 blur-[90px]"
        />
      </motion.div>
    </AnimatePresence>
  );
};
