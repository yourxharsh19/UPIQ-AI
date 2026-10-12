import { useState, useRef } from "react";
import { Upload, FileText, X, AlertCircle, Save } from "lucide-react";
import PDFService from "../services/pdf.service";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";

const UploadPDF = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [parsedData, setParsedData] = useState(null);
    const [saving, setSaving] = useState(false);
    const [importResult, setImportResult] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === "application/pdf") {
            setFile(selectedFile);
            setError(null);
        } else {
            setFile(null);
            setError("Please upload a valid PDF file.");
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
            if ((result.failedCount ?? 0) === 0) navigate("/transactions");
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to import the statement. Please retry.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[var(--text-main)]">Upload Statement</h1>
                <p className="text-[var(--text-muted)]">Upload your bank statement PDF to automatically extract transactions.</p>
            </div>

            {!parsedData ? (
                <Card className="p-12 flex flex-col items-center justify-center border-2 border-dashed border-[var(--border-base)] hover:border-primary-500 transition-all duration-300 group bg-[var(--bg-card)]">
                    <div className="bg-primary-500/10 p-5 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 border border-primary-500/20">
                        <Upload className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--text-main)] mb-2 tracking-tight transition-colors">Upload Bank Statement</h3>
                    <p className="text-[var(--text-muted)] text-sm mb-10 max-w-xs text-center leading-relaxed">
                        Drag and drop your PDF here, or click to browse.
                    </p>

                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        ref={fileInputRef}
                    />

                    <Button variant="outline" onClick={handleBrowseClick}>
                        Select PDF
                    </Button>

                    {file && (
                        <div className="mt-8 flex items-center gap-4 bg-[var(--bg-surface)] px-6 py-3 rounded-2xl border border-[var(--border-base)] animate-fade-in">
                            <FileText className="text-primary-600" size={20} />
                            <span className="text-sm font-bold text-[var(--text-main)] truncate max-w-[200px]">{file.name}</span>
                            <button onClick={() => setFile(null)} className="text-[var(--text-muted)] hover:text-rose-500 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="mt-6 flex items-center gap-2 text-rose-600 text-xs font-bold uppercase tracking-wider bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/20 animate-fade-in">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}

                    <div className="mt-10 w-full max-w-sm">
                        <Button
                            onClick={handleUpload}
                            disabled={!file}
                            loading={loading}
                            className="w-full"
                            size="lg"
                        >
                            {loading ? "Parsing..." : "Extract Transactions"}
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="space-y-8 animate-fade-in">
                    <Card className="p-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight">Preview Transactions</h3>
                                <p className="text-sm text-[var(--text-muted)] mt-1">
                                    Found <span className="text-[var(--text-main)] font-bold">{parsedData.totalTransactions}</span> parsed rows. The server checks duplicates when you save.
                                </p>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <Button variant="ghost" onClick={() => setParsedData(null)} size="md">
                                    Cancel
                                </Button>
                                <Button onClick={handleSave} loading={saving} size="md">
                                    <Save className="w-4 h-4 mr-2" />
                                    Save All
                                </Button>
                            </div>
                        </div>

                        {error && <p role="alert" className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-500">{error}</p>}
                        {importResult && <p role="status" className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-600">Previous attempt: {importResult.importedCount} imported, {importResult.duplicateCount} duplicates skipped, {importResult.failedCount} failed. Failed rows can be retried safely.</p>}

                        <div className="overflow-hidden bg-[var(--bg-card)] rounded-2xl border border-[var(--border-base)]">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-center">
                                    <thead className="bg-[var(--bg-surface)]">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Date</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Description</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Amount</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-base)]">
                                        {parsedData.transactions.map((t, i) => (
                                            <tr key={t.sourceRowIndex ?? i} className="transition-colors hover:bg-[var(--bg-surface)]/30">
                                                <td className="px-6 py-4 whitespace-nowrap text-[var(--text-muted)] font-medium">
                                                    {t.date ? new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : "-"}
                                                </td>
                                                <td className="px-6 py-4 text-left font-bold text-[var(--text-main)] tracking-tight">
                                                    {t.description}
                                                </td>
                                                <td className={clsx(
                                                    "px-6 py-4 font-bold tracking-tight",
                                                    t.type.toLowerCase() === 'income' ? 'text-emerald-500' : 'text-rose-500'
                                                )}>
                                                    {t.type.toLowerCase() === 'income' ? '+' : '-'}₹{t.amount?.toLocaleString('en-IN')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">Pending server check</span>
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
