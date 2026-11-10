import { Calendar, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useDateFilter } from "../../context/DateFilterContext";

const DateRangeFilter = () => {
  const { startDate, endDate, resetToCurrentMonth, resetToLastMonth, resetToLast30Days, resetToLast90Days, resetToThisYear, resetToAllTime } = useDateFilter();
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handlePresetClick = (presetFn) => {
    presetFn();
    setIsOpen(false);
  };

  const handleCustomRange = () => {
    // For now, just close. In a full implementation, you'd open a date picker modal
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-base)] rounded-lg hover:bg-[var(--bg-surface)] transition-colors shadow-sm"
      >
        <Calendar size={15} className="text-[var(--text-muted)]" />
        <span className="text-xs font-medium text-[var(--text-main)]">
          {formatDate(startDate)} - {formatDate(endDate)}
        </span>
        <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-1.5 w-56 bg-[var(--bg-card)] rounded-xl shadow-lg border border-[var(--border-base)] z-20 overflow-hidden">
            <div className="p-1.5">
              <div className="px-2.5 py-1 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-base)] mb-1">
                Quick Filters
              </div>
              <button
                onClick={() => handlePresetClick(resetToCurrentMonth)}
                className="w-full text-left px-2.5 py-1.5 text-xs text-[var(--text-main)] hover:bg-[var(--bg-surface)] rounded-md transition-colors"
              >
                This Month
              </button>
              <button
                onClick={() => handlePresetClick(resetToLastMonth)}
                className="w-full text-left px-2.5 py-1.5 text-xs text-[var(--text-main)] hover:bg-[var(--bg-surface)] rounded-md transition-colors"
              >
                Last Month
              </button>
              <button
                onClick={() => handlePresetClick(resetToLast30Days)}
                className="w-full text-left px-2.5 py-1.5 text-xs text-[var(--text-main)] hover:bg-[var(--bg-surface)] rounded-md transition-colors"
              >
                Last 30 Days
              </button>
              <button
                onClick={() => handlePresetClick(resetToLast90Days)}
                className="w-full text-left px-2.5 py-1.5 text-xs text-[var(--text-main)] hover:bg-[var(--bg-surface)] rounded-md transition-colors"
              >
                Last 90 Days
              </button>
              <button
                onClick={() => handlePresetClick(resetToThisYear)}
                className="w-full text-left px-2.5 py-1.5 text-xs text-[var(--text-main)] hover:bg-[var(--bg-surface)] rounded-md transition-colors"
              >
                This Year
              </button>
              <button
                onClick={() => handlePresetClick(resetToAllTime)}
                className="w-full text-left px-2.5 py-1.5 text-xs text-[var(--text-main)] hover:bg-[var(--bg-surface)] rounded-md transition-colors border-t border-[var(--border-base)] mt-1 pt-1.5"
              >
                All Time
              </button>
              <div className="px-2.5 py-1 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider border-t border-[var(--border-base)] mt-1">
                Custom Range
              </div>
              <button
                onClick={handleCustomRange}
                className="w-full text-left px-2.5 py-1.5 text-xs text-[var(--text-main)] hover:bg-[var(--bg-surface)] rounded-md transition-colors"
              >
                Select Dates...
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DateRangeFilter;

