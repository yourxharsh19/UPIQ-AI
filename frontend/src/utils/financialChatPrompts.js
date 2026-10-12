import { getTransactionCoverage } from './transactionCoverage.js';

export const getFinancialChatPrompts = (transactions = []) => {
  const latestMonth = getTransactionCoverage(transactions).defaultMonth;
  const prompts = ['What is a budget?', 'What is compound interest?'];
  if (!latestMonth) return prompts;
  const label = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' })
    .format(new Date(Number(latestMonth.slice(0, 4)), Number(latestMonth.slice(5, 7)) - 1, 1));
  return prompts.concat([
    `What were my total expenses in ${label}?`,
    `What was my Food spending in ${label}?`,
    `Compare Food and Groceries in ${label}`,
    `What was my net balance in ${label}?`,
    `What was my largest expense in ${label}?`,
  ]);
};
