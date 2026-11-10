import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  Sparkles,
  Table,
  UploadCloud,
  XCircle,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useFinancial } from '../../context/FinancialContext';
import { PDFService } from '../../services/pdf.service';
import { normalizeParsedTransactions, parseCsvStatementText } from '../../utils/statementImport';
import { validateStatementFile } from '../../utils/fileValidation';

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.userFriendlyMessage ||
  error?.message ||
  'The statement could not be processed.';

export const StatementUploadModal = ({ isOpen, onClose }) => {
  const { formatCurrency, refreshTransactions, refreshDashboard, importClientTransactions } = useFinancial();
  const [isScanning, setIsScanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [statementData, setStatementData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const processStatementFile = async (file) => {
    if (!file) return;

    setErrorMessage('');
    setImportMessage('');
    setImportResult(null);

    // 1. Client-side file type and size validation
    const validation = validateStatementFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error);
      return;
    }

    setIsScanning(true);
    setStatementData(null);

    try {
      let response = null;
      try {
        response = await PDFService.upload(file);
      } catch (backendError) {
        if (validation.fileType === 'csv') {
          const text = await file.text();
          const fallbackTx = parseCsvStatementText(text);
          if (fallbackTx.length > 0) {
            response = { success: true, data: { transactions: fallbackTx } };
          } else {
            throw backendError;
          }
        } else {
          throw backendError;
        }
      }

      if (response?.success !== true || !response?.data) {
        throw new Error(response?.message || 'The parser did not return a successful result.');
      }

      const { transactions, rejectedCount } = normalizeParsedTransactions(response.data.transactions);
      if (transactions.length === 0) {
        const typeLabel = validation.fileType === 'csv' ? 'CSV' : 'PDF';
        throw new Error(
          `No valid transactions with an amount, type, description, and date were found in this ${typeLabel} file. No transactions were imported.`
        );
      }

      setStatementData({
        fileName: file.name,
        file,
        fileType: validation.fileType,
        transactions,
        rejectedCount,
      });

      if (rejectedCount > 0) {
        setImportMessage(
          `${rejectedCount} parsed row${rejectedCount === 1 ? '' : 's'} omitted because required transaction details were missing or invalid.`
        );
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

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isScanning && !isImporting) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isScanning || isImporting) return;
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processStatementFile(droppedFile);
    }
  };

  const handleImportAll = async () => {
    if (!statementData || isImporting) return;
    setIsImporting(true);
    setErrorMessage('');

    try {
      let resultData = null;
      try {
        const response = await PDFService.importStatement(statementData.file);
        if (response?.success === true && response?.data) {
          resultData = response.data;
        } else {
          throw new Error(response?.message || 'The server did not confirm statement import.');
        }
      } catch (backendImportError) {
        if (importClientTransactions) {
          const count = importClientTransactions(statementData.transactions);
          resultData = {
            importedCount: count,
            duplicateCount: 0,
            rejectedCount: statementData.rejectedCount || 0,
            failedCount: 0,
          };
        } else {
          throw backendImportError;
        }
      }

      setImportResult(resultData);
      const { importedCount = 0, duplicateCount = 0, rejectedCount = 0, failedCount = 0 } = resultData;
      setImportMessage(
        `Imported ${importedCount} new transaction${importedCount === 1 ? '' : 's'}; skipped ${duplicateCount} duplicate${duplicateCount === 1 ? '' : 's'}; omitted ${rejectedCount} invalid row${rejectedCount === 1 ? '' : 's'}${failedCount ? `; ${failedCount} failed and can be retried` : ''}.`
      );
      if (importedCount > 0) {
        await Promise.all([refreshTransactions(), refreshDashboard()]);
      }
      if (failedCount > 0) {
        setErrorMessage(
          `${failedCount} row${failedCount === 1 ? '' : 's'} failed to save. Retry this statement to safely continue.`
        );
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsImporting(false);
    }
  };

  const resetUpload = () => {
    setStatementData(null);
    setImportResult(null);
    setErrorMessage('');
    setImportMessage('');
  };

  const handleClose = () => {
    resetUpload();
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <Modal isOpen={isOpen} onClose={handleClose} title="Bank Statement Upload (CSV / PDF)">
      <div className="space-y-5">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".pdf,.csv,.txt"
          className="hidden"
          aria-label="Select a bank statement PDF or CSV file"
        />

        {errorMessage && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-300">
            <XCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-rose-200">Unable to process file</p>
              <p className="text-xs text-rose-300">{errorMessage}</p>
            </div>
          </div>
        )}

        {importMessage && !errorMessage && (
          <p role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
            {importMessage}
          </p>
        )}

        {/* 1. INITIAL UPLOAD DROPZONE */}
        {!statementData && !importResult && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isScanning && fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                fileInputRef.current?.click();
              }
            }}
            className={`w-full cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-[var(--border-base)] bg-[var(--bg-surface)] hover:border-slate-400 dark:hover:border-slate-600'
            } ${isScanning ? 'cursor-wait opacity-80' : ''}`}
          >
            {isScanning ? (
              <div className="space-y-2 py-4">
                <div className="w-8 h-8 mx-auto rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                <p className="text-xs font-semibold text-[var(--text-main)]">Parsing statement contents…</p>
                <p className="text-[11px] text-[var(--text-muted)]">Extracting transaction rows and dates</p>
              </div>
            ) : (
              <div className="space-y-2 py-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--text-main)]">
                    Upload Bank Statement (.csv or .pdf)
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Drag & drop your statement here, or click to browse
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-[var(--text-muted)]">
                  <span className="flex items-center gap-1 rounded bg-[var(--bg-card)] border border-[var(--border-base)] px-1.5 py-0.5 font-medium">
                    <FileSpreadsheet className="h-3 w-3 text-emerald-500" /> .csv
                  </span>
                  <span className="flex items-center gap-1 rounded bg-[var(--bg-card)] border border-[var(--border-base)] px-1.5 py-0.5 font-medium">
                    <FileText className="h-3 w-3 text-rose-500" /> .pdf
                  </span>
                  <span className="text-[var(--text-muted)]">Max 10 MB</span>
                </div>
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={UploadCloud}
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Select Statement File
                  </Button>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] pt-1">
                  Supports digital text PDFs and CSV statements. Scanned / image-only PDFs (OCR) are Coming soon.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 2. SUCCESS SUMMARY VIEW (AFTER SAVE) */}
        {importResult && (
          <div className="space-y-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              <div>
                <h4 className="text-sm font-bold text-slate-100">Statement Import Summary</h4>
                <p className="text-xs text-slate-400">{statementData?.fileName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 text-center">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5">
                <span className="block text-lg font-extrabold text-emerald-400">
                  {importResult.importedCount ?? 0}
                </span>
                <span className="text-[11px] font-medium text-emerald-200">Imported New</span>
              </div>
              <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-2.5">
                <span className="block text-lg font-extrabold text-slate-200">
                  {importResult.duplicateCount ?? 0}
                </span>
                <span className="text-[11px] font-medium text-slate-400">Duplicates Skipped</span>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5">
                <span className="block text-lg font-extrabold text-amber-300">
                  {importResult.rejectedCount ?? 0}
                </span>
                <span className="text-[11px] font-medium text-amber-200">Omitted / Invalid</span>
              </div>
              <div className={`rounded-xl border p-2.5 ${
                (importResult.failedCount ?? 0) > 0
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                  : 'border-slate-700/50 bg-slate-800/50 text-slate-400'
              }`}>
                <span className="block text-lg font-extrabold">
                  {importResult.failedCount ?? 0}
                </span>
                <span className="text-[11px] font-medium">Failed</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button variant="secondary" onClick={resetUpload} className="flex-1" icon={RotateCcw}>
                Upload Another File
              </Button>
              <Button variant="emerald" onClick={handleClose} className="flex-1">
                Done & View Ledger
              </Button>
            </div>
          </div>
        )}

        {/* 3. PARSED STATEMENT PREVIEW */}
        {statementData && !importResult && (
          <div className="space-y-4 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <div>
                  <h4 className="text-sm font-bold text-slate-100">Statement parsed successfully</h4>
                  <p className="text-xs text-slate-400">
                    {statementData.fileName} · {statementData.transactions.length} valid transaction rows
                  </p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                statementData.fileType === 'csv'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              }`}>
                {statementData.fileType === 'csv' ? <FileSpreadsheet className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                {statementData.fileType.toUpperCase()}
              </span>
            </div>

            <div className="space-y-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <Table className="h-3.5 w-3.5 text-indigo-400" /> Transactions to import
              </span>
              <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                {statementData.transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="block truncate font-bold text-slate-100">
                        {transaction.description}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {transaction.date.slice(0, 10)}
                        {transaction.category ? ` · ${transaction.category}` : ''}
                        {transaction.paymentMethod ? ` · ${transaction.paymentMethod}` : ''}
                      </span>
                    </div>
                    <div className="shrink-0 text-right">
                      <span
                        className={`block font-bold ${
                          transaction.type === 'income' ? 'text-emerald-400' : 'text-slate-200'
                        }`}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {statementData.rejectedRows?.length > 0 && <div className="space-y-2">
              <span className="block text-xs font-bold text-amber-300">Rows requiring correction</span>
              <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-amber-100">
                {statementData.rejectedRows.map((row, index) => <li key={`${row.sourceRowIndex ?? 'unknown'}-${index}`}>
                  Row {row.sourceRowIndex == null ? 'unknown' : row.sourceRowIndex + 1}: {row.reasons.join(', ')}
                </li>)}
              </ul>
            </div>}

            <div className="flex items-center gap-3 pt-1">
              <Button
                variant="secondary"
                onClick={resetUpload}
                disabled={isImporting}
                className="flex-1"
              >
                Choose Different File
              </Button>
              <Button
                variant="emerald"
                onClick={handleImportAll}
                disabled={isImporting}
                className="flex-1"
                icon={ArrowRight}
              >
                {isImporting ? 'Importing to Ledger…' : `Import ${statementData.transactions.length} to Ledger`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>,
    document.body
  );
};
