import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ArrowUpRight, Wallet, TrendingUp, TrendingDown, PiggyBank, Sparkles } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { StatCard } from '../components/dashboard/StatCard';
import { IncomeExpenseChart } from '../components/dashboard/IncomeExpenseChart';
import { CategoryDonutChart } from '../components/dashboard/CategoryDonutChart';
import { RecentTransactionsWidget } from '../components/dashboard/RecentTransactionsWidget';
import { QuickAskBar } from '../components/dashboard/QuickAskBar';
import { UPIPaymentHub } from '../components/dashboard/UPIPaymentHub';
import { UpcomingFeaturesSection } from '../components/dashboard/UpcomingFeaturesSection';

export const Dashboard = () => {
  const { kpi, profile } = useFinancial();

  // Staggered container variants for seamless layout entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 24, opacity: 0, scale: 0.98 },
    show: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 22,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-7 md:space-y-9"
    >
      {/* Animated Top Hero Banner with Glowing Ambient Orbs */}
      <motion.section
        variants={itemVariants}
        className="relative isolate overflow-hidden rounded-[28px] border border-white/[0.075] bg-gradient-to-br from-[#151622]/95 via-[#101117]/80 to-[#101a19]/90 light:from-white light:via-slate-50 light:to-purple-50/40 light:border-slate-200 p-6 sm:p-8 lg:p-10 shadow-[0_25px_90px_-55px_rgba(99,102,241,0.45)] light:shadow-sm"
      >
        {/* Pulsing ambient radial glowing blobs */}
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.15, 0.32, 0.15],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          aria-hidden="true"
          className="absolute -right-16 -top-32 -z-10 h-80 w-80 rounded-full bg-indigo-500/20 blur-[90px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.08, 0.25, 0.08],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
          aria-hidden="true"
          className="absolute -bottom-44 right-1/3 -z-10 h-72 w-72 rounded-full bg-emerald-400/[0.12] blur-[90px]"
        />

        <div className="flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] light:border-emerald-300 light:bg-emerald-50 px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-emerald-300 light:text-emerald-700 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-65" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span>LIVE FINANCIAL OVERVIEW</span>
              <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse ml-0.5" />
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-white light:text-slate-900 sm:text-4xl lg:text-[2.8rem] leading-tight">
              Welcome back, {profile.name.split(' ')[0]}
              <span className="mt-1 block bg-gradient-to-r from-white via-zinc-200 to-indigo-300 light:from-indigo-600 light:via-purple-600 light:to-pink-600 bg-clip-text text-transparent">
                Money, in good hands.
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400 light:text-slate-600 sm:text-[15px]">
              A clearer view of your cash flow, habits, and what’s ahead. Your September 2026 overview is ready.
            </p>
          </div>

          <motion.div
            whileHover={{ scale: 1.03, y: -2 }}
            className="flex items-center gap-3 self-start rounded-2xl border border-white/[0.08] bg-black/25 backdrop-blur-md light:bg-slate-100 light:border-slate-200 px-4.5 py-3.5 xl:self-auto shadow-lg transition-all cursor-pointer"
          >
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-indigo-400/20 bg-indigo-400/15 light:bg-indigo-50 light:border-indigo-200 text-indigo-300 light:text-indigo-600 shadow-inner">
              <Activity className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400 light:text-slate-500">
                Account Status
              </p>
              <p className="mt-0.5 text-sm font-semibold text-zinc-100 light:text-slate-900">
                {profile.accountType}
              </p>
            </div>
            <ArrowUpRight className="ml-3 h-4 w-4 text-zinc-400 light:text-slate-400" />
          </motion.div>
        </div>
      </motion.section>

      {/* UPI Payment Hub Section */}
      <motion.div variants={itemVariants}>
        <UPIPaymentHub />
      </motion.div>

      {/* KPI Stat Cards Summary Grid */}
      <motion.section
        variants={itemVariants}
        aria-label="Financial summary"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        <StatCard title="Total Net Worth" value={kpi.totalBalance} change={kpi.balanceChange} isPositive icon={Wallet} color="indigo" featured className="sm:col-span-2" />
        <StatCard title="Monthly Income" value={kpi.monthlyIncome} change={kpi.incomeChange} isPositive icon={TrendingUp} color="emerald" />
        <StatCard title="Monthly Expenses" value={kpi.monthlyExpense} change={kpi.expenseChange} isPositive icon={TrendingDown} color="rose" />
        <StatCard title="Projected Savings" value={kpi.projectedSavings} change={kpi.savingsChange} isPositive icon={PiggyBank} color="purple" />
      </motion.section>

      {/* Quick AI Voice / Query Prompt Bar */}
      <motion.div variants={itemVariants}>
        <QuickAskBar />
      </motion.div>

      {/* Financial Analytics Grid */}
      <motion.section
        variants={itemVariants}
        aria-label="Financial analytics"
        className="grid grid-cols-1 gap-5 xl:grid-cols-12"
      >
        <div className="xl:col-span-8"><IncomeExpenseChart /></div>
        <div className="xl:col-span-4"><CategoryDonutChart /></div>
      </motion.section>

      {/* Recent Ledger Stream Widget */}
      <motion.div variants={itemVariants}>
        <RecentTransactionsWidget />
      </motion.div>

      {/* Backend Capabilities & System Roadmap */}
      <motion.div variants={itemVariants}>
        <UpcomingFeaturesSection />
      </motion.div>
    </motion.div>
  );
};
