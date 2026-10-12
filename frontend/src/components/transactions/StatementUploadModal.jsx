import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, CheckCircle2, FileText, Sparkles, Table } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useFinancial } from '../../context/FinancialContext';
import { PDFService } from '../../services/pdf.service';
import { normalizeParsedTransactions } from '../../utils/statementImport';

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.userFriendlyMessage || error?.message || 'The statement could not be processed.';

export const StatementUploadModal = ({ isOpen, onClose }) => {
  const { formatCurrency, refreshTransactions, refreshDashboard } = useFinancial();
  const [isScanning, setIsScanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [statementData, setStatementData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const processStatementFile = async (file) => {
    if (!file) return;
    setIsScanning(true);
    setStatementData(null);
    setErrorMessage('');
    setImportMessage('');
    setImportResult(null);

    try {
      const response = await PDFService.upload(file);
      if (response?.success !== true || !response?.data) {
        throw new Error(response?.message || 'The parser did not return a successful result.');
      }

      const { transactions, rejectedCount } = normalizeParsedTransactions(response.data.transactions);
      if (transactions.length === 0) {
        throw new Error('No valid transactions with an amount, type, description, and date were found. No transactions were imported.');
      }

      setStatementData({ fileName: file.name, file, transactions, rejectedCount });
      if (rejectedCount > 0) {
        setImportMessage(`${rejectedCount} parsed row${rejectedCount === 1 ? '' : 's'} omitted because required transaction details were missing or invalid.`);
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileSelect = (event) => {
    processStatementFile(event.target.files?.[0]);
    // Permit selecting the same file again after correcting a parse/setup issue.
    event.target.value = '';
  };

  const handleImportAll = async () => {
    if (!statementData || isImporting) return;
    setIsImporting(true);
    setErrorMessage('');

    try {
      const response = await PDFService.importStatement(statementData.file);
      if (response?.success !== true || !response?.data) {
        throw new Error(response?.message || 'The server did not confirm statement import.');
      }
      setImportResult(response.data);
      const { importedCount = 0, duplicateCount = 0, rejectedCount = 0, failedCount = 0 } = response.data;
      setImportMessage(`Imported ${importedCount} new transaction${importedCount === 1 ? '' : 's'}; skipped ${duplicateCount} duplicate${duplicateCount === 1 ? '' : 's'}; omitted ${rejectedCount} invalid row${rejectedCount === 1 ? '' : 's'}${failedCount ? `; ${failedCount} failed and can be retried` : ''}.`);
      if (importedCount > 0) {
        await Promise.all([refreshTransactions(), refreshDashboard()]);
      }
      if (failedCount > 0) setErrorMessage(`${failedCount} row${failedCount === 1 ? '' : 's'} failed to save. Retry this statement to safely continue.`);
    } finally {
      setIsImporting(false);
    }
  };

  const resetPreview = () => {
    setStatementData(null);
    setImportResult(null);
    setErrorMessage('');
    setImportMessage('');
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    createPortal(<Modal isOpen={isOpen} onClose={onClose} title="Bank Statement Upload">
      <div className="space-y-5">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".pdf,.csv,.txt"
          className="hidden"
          aria-label="Select a bank statement PDF or CSV file"
        />

        {errorMessage && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{errorMessage}</p>}
        {importMessage && <p role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">{importMessage}</p>}

        {!statementData ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="w-full rounded-2xl border-2 border-dashed border-[var(--border-base)] bg-[var(--bg-surface)] p-8 text-center transition-colors hover:border-slate-500 disabled:cursor-wait"
          >
            {isScanning ? (
              <div className="space-y-3 py-6">
                <Sparkles className="mx-auto h-10 w-10 animate-spin text-indigo-400" />
                <p className="text-sm font-semibold text-slate-200">Parsing statement contents…</p>
              </div>
            ) : (
              <div className="space-y-3 py-4">
                <FileText className="mx-auto h-10 w-10 text-indigo-400" />
                <p className="text-sm font-bold text-[var(--text-main)]">Upload Bank Statement (PDF or CSV)</p>
                <p className="text-xs text-[var(--text-muted)]">Only transactions returned by the statement parser will be previewed.</p>
              </div>
            )}
          </button>
        ) : (
          <div className="space-y-4 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <div>
                <h4 className="text-sm font-bold text-slate-100">Statement parsed</h4>
                <p className="text-xs text-slate-400">{statementData.fileName} · {statementData.transactions.length} valid transaction rows</p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <Table className="h-3.5 w-3.5 text-indigo-400" /> Transactions to import
              </span>
              <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                {statementData.transactions.map((transaction) => {
                  return (
                    <div key={transaction.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-xs">
                      <div className="min-w-0">
                        <span className="block truncate font-bold text-slate-100">{transaction.description}</span>
                        <span className="text-[10px] text-slate-400">
                          {transaction.date.slice(0, 10)}{transaction.category ? ` · ${transaction.category}` : ''}{transaction.paymentMethod ? ` · ${transaction.paymentMethod}` : ''}
                        </span>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className={`block font-bold ${transaction.type === 'income' ? 'text-emerald-400' : 'text-slate-200'}`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button variant="secondary" onClick={resetPreview} disabled={isImporting} className="flex-1">Upload Another Statement</Button>
              <Button variant="emerald" onClick={handleImportAll} disabled={isImporting || (importResult !== null && importResult.failedCount === 0)} className="flex-1" icon={ArrowRight}>
                {isImporting ? 'Importing…' : importResult?.failedCount > 0 ? 'Retry failed rows' : `Import ${statementData.transactions.length} to Ledger`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>, document.body)
  );
};
