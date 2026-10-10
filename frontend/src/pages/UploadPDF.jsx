import { useState, useRef } from "react";
import { Upload, FileText, X, AlertCircle, Save } from "lucide-react";
import PDFService from "../services/pdf.service";
import TransactionService from "../services/transaction.service";
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
                // Check for duplicates before showing parsed data
                const txResponse = await TransactionService.getAll();
                const existingTransactions = txResponse.success ? txResponse.data : [];

                // Debug log to check date format
                if (existingTransactions.length > 0) {
                    console.log("Sample existing transaction date:", existingTransactions[0].date);
                }
                const parsedTransactions = response.data.transactions;

                // Helper to normalize date from String or Array (LocalDateTime)
                const normalizeDate = (dateVal) => {
                    if (!dateVal) return null;
                    if (Array.isArray(dateVal)) {
                        // [yyyy, mm, dd, hh, mm, ss]
                        // Note: JS Date month is 0-indexed, Java/Array is 1-indexed
                        const [year, month, day, hour = 0, min = 0, sec = 0] = dateVal;
                        return new Date(year, month - 1, day, hour, min, sec);
                    }
                    return new Date(dateVal);
                };

                // Mark duplicates
                const transactionsWithDuplicateFlag = parsedTransactions.map(parsed => {
                    const isDuplicate = existingTransactions.some(existing => {
                        // Check if amounts match exactly
                        if (Math.abs(existing.amount - parsed.amount) > 0.01) return false;

                        // Check if dates are on the same day
                        const d1 = normalizeDate(existing.date);
                        const d2 = normalizeDate(parsed.date);

                        if (!d1 || !d2) return false;

                        if (d1.toDateString() !== d2.toDateString()) return false;

                        // Check if descriptions are similar (case-insensitive contains)
                        const existingDesc = (existing.description || "").toLowerCase();
                        const parsedDesc = (parsed.description || "").toLowerCase();

                        const isMatch = existingDesc.includes(parsedDesc) || parsedDesc.includes(existingDesc);

                        if (!isMatch && Math.abs(existing.amount - parsed.amount) < 0.01) {
                            console.log("Potential match failed description check:", {
                                existingDesc, parsedDesc, amount: parsed.amount
                            });
                        }

                        return isMatch;
                    });

                    if (isDuplicate) console.log("Duplicate found:", parsed);

                    return { ...parsed, isDuplicate };
                });

                setParsedData({
                    ...response.data,
                    transactions: transactionsWithDuplicateFlag
                });
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
        try {
            // Filter out duplicates
            const transactionsToSave = parsedData.transactions.filter(t => !t.isDuplicate);
            const totalToSave = transactionsToSave.length;
            const duplicateCount = parsedData.transactions.length - totalToSave;

            console.log(`Starting save: ${totalToSave} new transactions, ${duplicateCount} duplicates ignored.`);

            if (totalToSave === 0) {
                alert("All transactions are duplicates. No new transactions to save.");
                setSaving(false);
                return;
            }

            let successCount = 0;
            for (let i = 0; i < transactionsToSave.length; i++) {
                const transaction = transactionsToSave[i];
                let isoDate;

                if (transaction.date) {
                    isoDate = transaction.date;
                } else {
                    const now = new Date();
                    isoDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 19);
                    console.warn(`Transaction ${i + 1} missing date, using fallback:`, isoDate);
                }

                console.log(`Saving transaction ${i + 1}/${totalToSave}:`, {
                    desc: transaction.description,
                    amount: transaction.amount,
                    date: isoDate
                });

                try {
                    await TransactionService.create({
                        ...transaction,
                        date: isoDate,
                        category: "Uncategorized",
                        paymentMethod: transaction.paymentMethod || "UPI"
                    });
                    successCount++;
                } catch (txErr) {
                    console.error(`Failed to save transaction ${i + 1}:`, transaction, txErr);
                }
            }

            const message = successCount === totalToSave
                ? `Successfully saved all ${successCount} transactions!`
                : `Saved ${successCount} of ${totalToSave} transactions. Check console for errors.`;

            if (duplicateCount > 0) {
                alert(`${message} (${duplicateCount} duplicates skipped)`);
            } else {
                alert(message);
            }

            navigate("/transactions"); // Navigate to transactions page to see results
        } catch (err) {
            console.error("General save error:", err);
            setError("Failed to save transactions. Please check your connection.");
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
                                    Found <span className="text-[var(--text-main)] font-bold">{parsedData.totalTransactions}</span> transactions.
                                    {parsedData.transactions.filter(t => t.isDuplicate).length > 0 && (
                                        <span className="text-amber-500 font-bold ml-1">
                                            ({parsedData.transactions.filter(t => t.isDuplicate).length} duplicates will be skipped)
                                        </span>
                                    )}
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
                                            <tr key={i} className={clsx(
                                                "transition-colors",
                                                t.isDuplicate ? 'bg-[var(--bg-surface)]/50 opacity-60' : 'hover:bg-[var(--bg-surface)]/30'
                                            )}>
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
                                                    {t.isDuplicate ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                            Duplicate
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
                                                            New
                                                        </span>
                                                    )}
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
