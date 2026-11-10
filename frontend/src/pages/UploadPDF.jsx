import { useState, useRef } from "react";
import { Upload, FileText, X, AlertCircle, Save } from "lucide-react";
import PDFService from "../services/pdf.service";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { useFinancial } from "../context/FinancialContext";
import clsx from "clsx";

import { validateStatementFile } from "../utils/fileValidation";

const UploadPDF = () => {
    let financial = null;
    try {
        financial = useFinancial();
    } catch {
        financial = null;
    }
    const setActiveTab = financial?.setActiveTab;
    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [parsedData, setParsedData] = useState(null);
    const [saving, setSaving] = useState(false);
    const [importResult, setImportResult] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;
        const validation = validateStatementFile(selectedFile);
        if (validation.valid) {
            setFile(selectedFile);
            setError(null);
        } else {
            setFile(null);
            setError(validation.error);
        }
    };

    const handleBrowseClick = () => {
        fileInputRef.current.click();
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);
        try {
            const response = await PDFService.upload(file);
            if (response.success) {
                setParsedData(response.data);
                setImportResult(null);
            } else {
                setError(response.message || "Failed to parse PDF.");
            }
        } catch (err) {
            console.error("Upload Error:", err);
            const errorMessage = err.response?.data?.message
                || err.response?.statusText
                || err.message
                || "An unknown error occurred";
            const status = err.response?.status ? ` (Status: ${err.response.status})` : "";
            setError(`Upload failed: ${errorMessage}${status}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!parsedData || !parsedData.transactions) return;
        setSaving(true);
        setError(null);
        try {
            const response = await PDFService.importStatement(file);
            if (!response?.success || !response?.data) {
                throw new Error(response?.message || "The server did not confirm the statement import.");
            }
            const result = response.data;
            setImportResult(result);
            alert(`Imported ${result.importedCount ?? 0} new rows; skipped ${result.duplicateCount ?? 0} duplicates; omitted ${result.rejectedCount ?? 0} invalid rows; ${result.failedCount ?? 0} failed.`);
            if ((result.failedCount ?? 0) === 0 && setActiveTab) setActiveTab("transactions");
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to import the statement. Please retry.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] tracking-tight">Upload Statement</h1>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Upload your bank statement (PDF or CSV) to extract and review transactions.</p>
            </div>

            {!parsedData ? (
                <Card className="p-8 sm:p-12 flex flex-col items-center justify-center border-2 border-dashed border-[var(--border-base)] hover:border-blue-500 transition-colors bg-[var(--bg-card)]">
                    <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 p-4 rounded-xl mb-4 border border-blue-500/20">
                        <Upload className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-bold text-[var(--text-main)] mb-1">Select Bank Statement</h3>
                    <p className="text-[var(--text-muted)] text-xs mb-1 max-w-xs text-center">
                        Drag and drop your PDF or CSV file here, or click to browse. Max 10MB.
                    </p>
                    <p className="text-[var(--text-muted)] text-[11px] mb-6 max-w-sm text-center">
                        Supports digital text PDFs and CSV statements. Scanned / image-only PDFs (OCR) are Coming soon.
                    </p>

                    <input
                        type="file"
                        accept=".pdf,.csv,.txt"
                        onChange={handleFileChange}
                        className="hidden"
                        ref={fileInputRef}
                    />

                    <Button variant="secondary" onClick={handleBrowseClick}>
                        Select File (.pdf, .csv)
                    </Button>

                    {file && (
                        <div className="mt-6 flex items-center gap-3 bg-[var(--bg-surface)] px-4 py-2 rounded-lg border border-[var(--border-base)]">
                            <FileText className="text-blue-500" size={18} />
                            <span className="text-xs font-semibold text-[var(--text-main)] truncate max-w-[200px]">{file.name}</span>
                            <button onClick={() => setFile(null)} className="text-[var(--text-muted)] hover:text-rose-500 transition-colors cursor-pointer">
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="mt-5 flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-medium bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}

                    <div className="mt-6 w-full max-w-xs">
                        <Button
                            onClick={handleUpload}
                            disabled={!file}
                            loading={loading}
                            className="w-full"
                            size="md"
                        >
                            {loading ? "Parsing..." : "Extract Transactions"}
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="space-y-6">
                    <Card className="p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                                <h3 className="text-base font-bold text-[var(--text-main)]">Preview Transactions</h3>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                    Found <span className="font-semibold text-[var(--text-main)]">{parsedData.totalTransactions}</span> parsed rows. The server checks duplicates when you save.
                                </p>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button variant="secondary" onClick={() => setParsedData(null)} size="sm">
                                    Cancel
                                </Button>
                                <Button onClick={handleSave} loading={saving} size="sm">
                                    <Save className="w-3.5 h-3.5 mr-1.5" />
                                    Save All
                                </Button>
                            </div>
                        </div>

                        {error && <p role="alert" className="mb-4 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-500">{error}</p>}
                        {importResult && <p role="status" className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-600">Previous attempt: {importResult.importedCount} imported, {importResult.duplicateCount} duplicates skipped, {importResult.failedCount} failed. Failed rows can be retried safely.</p>}

                        <div className="overflow-hidden bg-[var(--bg-card)] rounded-xl border border-[var(--border-base)]">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-center">
                                    <thead className="bg-[var(--bg-surface)]">
                                        <tr className="border-b border-[var(--border-base)] text-[var(--text-muted)] font-medium">
                                            <th className="px-4 py-2.5">Date</th>
                                            <th className="px-4 py-2.5 text-left">Description</th>
                                            <th className="px-4 py-2.5">Amount</th>
                                            <th className="px-4 py-2.5">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-base)]">
                                        {parsedData.transactions.map((t, i) => (
                                             <tr key={t.sourceRowIndex ?? i} className="transition-colors hover:bg-[var(--bg-surface)]">
                                                <td className="px-4 py-2.5 whitespace-nowrap text-[var(--text-muted)] font-mono text-[11px]">
                                                    {t.date ? new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : "-"}
                                                </td>
                                                <td className="px-4 py-2.5 text-left font-medium text-[var(--text-main)]">
                                                    {t.description}
                                                </td>
                                                <td className={clsx(
                                                    "px-4 py-2.5 font-semibold tabular-nums",
                                                    t.type.toLowerCase() === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-main)]'
                                                )}>
                                                    {t.type.toLowerCase() === 'income' ? '+' : '-'}₹{t.amount?.toLocaleString('en-IN')}
                                                </td>
                                                <td className="px-4 py-2.5 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-base)]">Pending server check</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default UploadPDF;
