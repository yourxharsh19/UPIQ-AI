import { useState } from "react";
import { Download } from "lucide-react";
import FinancialDashboardService from "../../services/financial-dashboard.service";

export default function DownloadReportAction({ compact = false }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const download = async () => {
    setLoading(true);
    setError("");
    try {
      await FinancialDashboardService.downloadReport();
    } catch {
      setError("Report download failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={compact ? "flex flex-col items-start gap-2" : "flex flex-col items-start gap-2 sm:items-end"}>
      <button
        type="button"
        onClick={download}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-wait disabled:opacity-65"
      >
        <Download size={16} />
        {loading ? "Generating report..." : "Download Report"}
      </button>
      {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
