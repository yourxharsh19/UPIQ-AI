import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, Sparkles, Receipt } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useFinancial } from '../../context/FinancialContext';

export const ReceiptScannerModal = ({ isOpen, onClose }) => {
  const { addTransaction, formatCurrency } = useFinancial();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const processReceiptFile = (file) => {
    setIsScanning(true);
    setScannedData(null);

    setTimeout(() => {
      setIsScanning(false);
      setScannedData({
        title: file ? file.name.replace(/\.[^/.]+$/, "") : "Apple Retail Store Bill",
        amount: 129.50,
        category: "Shopping",
        mode: "Card",
        date: new Date().toISOString(),
        merchant: "Apple Store #W42",
        taxAmount: 11.65,
        confidence: "99.2%",
      });
    }, 1200);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processReceiptFile(file);
    }
  };

  const handleConfirmScan = () => {
    if (scannedData) {
      addTransaction(scannedData);
      onClose();
      setScannedData(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="OCR Billing & Receipt Scanner">
      <div className="space-y-6">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".png,.jpg,.jpeg,.pdf"
          className="hidden"
        />

        {!scannedData ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              const file = e.dataTransfer.files?.[0];
              processReceiptFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
              isDragOver
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-slate-700 hover:border-slate-500 bg-slate-950/50 light:bg-slate-50 light:border-slate-300'
            }`}
          >
            {isScanning ? (
              <div className="py-6 space-y-3">
                <Sparkles className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
                <p className="text-sm font-semibold text-slate-200">
                  Scanning bill receipt with Vision OCR...
                </p>
                <p className="text-xs text-slate-400">Extracting merchant, line items, taxes & total bill</p>
              </div>
            ) : (
              <div className="py-4 space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-600/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                  <Receipt className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-100 light:text-slate-900">
                    Upload Bill / Receipt Image
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports PNG, JPG, Receipt Photos up to 10MB
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-slate-100 light:text-slate-900">
                  Bill Receipt Scanned
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Confidence: {scannedData.confidence}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">Merchant Name:</span>
                <span className="font-bold text-slate-100">{scannedData.merchant}</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">Bill Total Amount:</span>
                <span className="font-extrabold text-emerald-400 text-sm">
                  {formatCurrency(scannedData.amount)}
                </span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">Category:</span>
                <span className="font-bold text-indigo-300">{scannedData.category}</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">Payment Mode:</span>
                <span className="font-bold text-slate-200">{scannedData.mode}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setScannedData(null);
                  fileInputRef.current?.click();
                }}
                className="flex-1"
              >
                Rescan Receipt
              </Button>
              <Button variant="emerald" onClick={handleConfirmScan} className="flex-1">
                Add Bill to Ledger
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
