import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowDownLeft, ArrowLeftRight, ArrowRight, ArrowUpRight, BadgeCheck, Banknote,
  Camera, Check, ChevronRight, Clock3, ContactRound, Fingerprint, History,
  ImagePlus, LockKeyhole, Plus, ScanLine, ShieldCheck, Sparkles, WalletCards, X,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';

const contactsSeed = [
  { name: 'Raj', vpa: 'raj.mehta@upi', initials: 'RM', color: 'from-violet-500 to-indigo-500' },
  { name: 'Priya', vpa: 'priya.k@upi', initials: 'PK', color: 'from-rose-400 to-orange-400' },
  { name: 'Mom', vpa: 'anita.sharma@upi', initials: 'AS', color: 'from-emerald-400 to-cyan-500' },
  { name: 'Sameer', vpa: 'sameer.r@upi', initials: 'SR', color: 'from-sky-400 to-blue-600' },
];
const quickAmounts = [100, 500, 1500, 5000];
const formatRupees = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const QRPattern = () => {
  const cells = useMemo(() => Array.from({ length: 225 }, (_, index) => {
    const row = Math.floor(index / 15);
    const col = index % 15;
    const finder = [[0, 0], [0, 8], [8, 0]].some(([r, c]) => row >= r && row < r + 7 && col >= c && col < c + 7);
    if (finder) {
      const r = row % 8; const c = col % 8;
      return r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
    }
    return ((row * 7 + col * 11 + row * col) % 5) < 2;
  }), []);
  return <div className="qr-pattern" aria-label="Sample UPI QR code">{cells.map((isDark, index) => <i key={index} className={isDark ? 'qr-cell qr-cell--dark' : 'qr-cell'} />)}</div>;
};

export const UPIPaymentHub = () => {
  const { profile, transactions, addTransaction, addToast, formatCurrency, currentCurrency, kpi } = useFinancial();
  const [contacts, setContacts] = useState(contactsSeed);
  const [selectedContact, setSelectedContact] = useState(contactsSeed[0]);
  const [amount, setAmount] = useState(500);
  const [note, setNote] = useState('');
  const [transferMode, setTransferMode] = useState('send');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const [scanReady, setScanReady] = useState(false);
  const [qrFileName, setQrFileName] = useState('');
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [beneficiary, setBeneficiary] = useState({ name: '', vpa: '' });
  const [showBalance, setShowBalance] = useState(false);
  const galleryInput = useRef(null);

  const initials = profile.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  const transactionsForFeed = transactions.slice(0, 4);

  const selectMode = (mode) => {
    setTransferMode(mode);
    if (mode === 'balance') {
      setShowBalance(true);
      addToast('Bank balance refreshed', `Available balance ${formatCurrency(kpi.totalBalance)}`, 'success');
    } else {
      setShowBalance(false);
      document.getElementById('transfer-widget')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const submitTransfer = (event) => {
    event.preventDefault();
    if (amount < 1) { addToast('Enter an amount', 'Choose an amount greater than 0 to continue', 'warning'); return; }
    if (transferMode === 'request') {
      addToast('Request sent', `${selectedContact.name} received your ${currentCurrency?.symbol || '₹'}${amount} request`, 'success');
      setTransferMode('send');
      return;
    }
    setPin(''); setPinError(''); setIsPinModalOpen(true);
  };

  const confirmPin = (event) => {
    event.preventDefault();
    if (!/^\d{4}$/.test(pin)) { setPinError('Enter your 4 digit demo PIN to continue.'); return; }
    const receipt = { id: `UPI${Date.now().toString().slice(-10)}`, amount: Number(amount), date: new Date(), recipient: selectedContact, note, mode: transferMode };
    setIsPinModalOpen(false);
    setPaymentSuccess(receipt);
    addTransaction({ title: `${transferMode === 'self' ? 'Self transfer' : 'UPI payment'} · ${selectedContact.name}`, merchant: selectedContact.vpa, amount: receipt.amount, type: 'expense', category: 'Transfers', mode: 'UPI', date: receipt.date.toISOString(), location: 'UPIQ secure transfer' });
  };

  const addBeneficiary = (event) => {
    event.preventDefault();
    const name = beneficiary.name.trim(); const vpa = beneficiary.vpa.trim();
    if (!name || !vpa) return;
    const item = { name, vpa, initials: name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase(), color: 'from-cyan-400 to-indigo-500' };
    setContacts((current) => [...current, item]); setSelectedContact(item); setBeneficiary({ name: '', vpa: '' }); setIsAddContactOpen(false);
    addToast('Beneficiary added', `${name} is ready for UPI payments`, 'success');
  };

  const closeQr = () => { setIsQrModalOpen(false); setCameraOn(false); setScanReady(false); };
  const startScan = () => {
    setCameraOn((current) => !current);
    if (!cameraOn) { setScanReady(false); window.setTimeout(() => setScanReady(true), 1400); }
  };

  return (
    <section className="upi-hub space-y-5" aria-label="UPI payment tools">
      <div className="upi-status glass-surface">
        <div className="status-user"><div className="status-avatar">{initials}</div><div><p className="status-greeting">YOUR UPI SPACE</p><h2>Hey, {profile.name.split(' ')[0]} <span>✦</span></h2></div></div>
        <div className="upi-id-pill"><span className="upi-online-dot" /><span>{profile.email?.split('@')[0] || 'user'}@upiq</span><BadgeCheck size={14} /></div>
        <div className="status-secure"><ShieldCheck size={15} /> Protected by UPIQ Shield</div>
      </div>

      <div className="upi-hub-grid">
        <article className="scan-card glass-surface">
          <div className="panel-title-row"><div><span className="section-kicker">INSTANT PAYMENTS</span><h3>Scan & pay</h3><p>Point your camera at any UPI QR</p></div><span className="mini-icon"><ScanLine size={18} /></span></div>
          <button className="qr-tile" type="button" onClick={() => setIsQrModalOpen(true)} aria-label="Open QR scanner">
            <span className="qr-corner qr-corner--tl" /><span className="qr-corner qr-corner--tr" /><span className="qr-corner qr-corner--bl" />
            <QRPattern /><span className="qr-center-mark"><WalletCards size={15} /></span>
            <span className="qr-cta"><ScanLine size={15} /> Open scanner <ChevronRight size={14} /></span>
          </button>
          <div className="scan-card-foot"><span><LockKeyhole size={12} /> Private by design</span><button type="button" onClick={() => setIsQrModalOpen(true)}>Upload a QR <ImagePlus size={13} /></button></div>
        </article>

        <article className="transfer-card glass-surface" id="transfer-widget">
          <div className="panel-title-row"><div><span className="section-kicker">SEND WITH UPI</span><h3>{transferMode === 'self' ? 'Move between accounts' : transferMode === 'request' ? 'Request a payment' : 'Send money'}</h3><p>Fast, secure transfers to people you trust</p></div><span className="mini-icon mini-icon--cyan"><ArrowUpRight size={18} /></span></div>

          <div className="contacts-label"><span>QUICK PAY</span><button type="button" onClick={() => setIsAddContactOpen(true)} aria-label="Add beneficiary"><Plus size={14} /> Add</button></div>
          <div className="contact-carousel">{contacts.map((contact) => <button type="button" key={contact.vpa} onClick={() => setSelectedContact(contact)} className={`contact-chip ${selectedContact.vpa === contact.vpa ? 'contact-chip--selected' : ''}`} aria-pressed={selectedContact.vpa === contact.vpa}><span className={`contact-avatar bg-gradient-to-br ${contact.color}`}>{contact.initials}</span><span>{contact.name}</span></button>)}</div>

          <form onSubmit={submitTransfer}>
            <div className="amount-entry"><span>{currentCurrency?.symbol || '₹'}</span><input aria-label="Transfer amount" type="number" min="1" max="1000000" value={amount} onChange={(event) => setAmount(Math.max(0, Number(event.target.value)))} /><span className="amount-label">{currentCurrency?.code || 'INR'}</span></div>
            <input className="amount-slider" aria-label="Adjust transfer amount" type="range" min="0" max="10000" step="100" value={Math.min(amount, 10000)} onChange={(event) => setAmount(Number(event.target.value))} style={{ '--slider-progress': `${Math.min(amount / 10000 * 100, 100)}%` }} />
            <div className="amount-chips">{quickAmounts.map((quickAmount) => <button key={quickAmount} type="button" onClick={() => setAmount(quickAmount)} className={amount === quickAmount ? 'amount-chip amount-chip--active' : 'amount-chip'}>{currentCurrency?.symbol || '₹'}{quickAmount}</button>)}</div>
            <label className="sr-only" htmlFor="upi-note">Add a note</label><input id="upi-note" className="note-input" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a note (optional)" maxLength={60} />
            <div className="transfer-summary"><span>{transferMode === 'request' ? 'Requesting from' : transferMode === 'self' ? 'Transferring to' : 'Paying'} <b>{selectedContact.name}</b></span><span><LockKeyhole size={12} /> UPI secure</span></div>
            <button type="submit" className="transfer-submit">{transferMode === 'request' ? 'Request money' : 'Pay securely with UPI PIN'}<ArrowRight size={16} /></button>
          </form>
        </article>
      </div>

      <div className="upi-lower-grid">
        <section className="action-panel glass-surface"><div className="panel-title-row"><div><span className="section-kicker">YOUR MONEY, ONE TAP AWAY</span><h3>Everyday actions</h3></div><Sparkles className="action-sparkle" size={17} /></div><div className="action-grid">
          <button type="button" onClick={() => selectMode('send')}><span className="action-icon action-icon--violet"><ArrowUpRight size={18} /></span><b>Send money</b><small>To any UPI ID</small></button>
          <button type="button" onClick={() => selectMode('request')}><span className="action-icon action-icon--cyan"><ArrowDownLeft size={18} /></span><b>Request money</b><small>Ask with a tap</small></button>
          <button type="button" onClick={() => selectMode('self')}><span className="action-icon action-icon--blue"><ArrowLeftRight size={18} /></span><b>Self transfer</b><small>Between your banks</small></button>
          <button type="button" onClick={() => selectMode('balance')}><span className="action-icon action-icon--green"><Banknote size={18} /></span><b>Bank balance</b><small>{showBalance ? formatCurrency(kpi.totalBalance) : 'Check securely'}</small></button>
        </div></section>

        <section className="activity-panel glass-surface"><div className="panel-title-row"><div><span className="section-kicker">RECENT ACTIVITY</span><h3>UPI transactions</h3></div><button className="history-link" type="button" onClick={() => addToast('Transaction history', 'Your full ledger is available in the Transactions tab', 'info')}>Full history <ChevronRight size={14} /></button></div>
          <div className="upi-transactions">{transactionsForFeed.length ? transactionsForFeed.map((transaction) => {
            const isCredit = transaction.type === 'income';
            const avatarText = (transaction.title || 'UPI').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
            return <div className="upi-transaction" key={transaction.id}><span className={`merchant-avatar ${isCredit ? 'merchant-avatar--credit' : ''}`}>{avatarText}</span><span className="merchant-copy"><b>{transaction.title}</b><small><Clock3 size={11} />{new Date(transaction.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {transaction.category}</small></span><span className={`merchant-amount ${isCredit ? 'merchant-amount--credit' : ''}`}>{isCredit ? '+' : '−'}{formatCurrency(transaction.amount)}</span></div>;
          }) : <div className="empty-activity"><History size={17} />Your recent UPI payments will appear here.</div>}</div>
        </section>
      </div>

      {isQrModalOpen && <div className="upi-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeQr(); }}><section className="upi-dialog glass-surface qr-dialog" role="dialog" aria-modal="true" aria-labelledby="qr-title"><button className="dialog-close" type="button" onClick={closeQr} aria-label="Close scanner"><X size={18} /></button><div className="dialog-icon"><ScanLine size={20} /></div><h3 id="qr-title">Scan any UPI QR</h3><p>Place the code inside the frame to detect a payment address.</p><div className={`scanner-frame ${cameraOn ? 'scanner-frame--active' : ''}`}><QRPattern />{cameraOn && <span className="scanner-laser" />}{scanReady && cameraOn && <span className="scanner-detected"><Check size={14} /> Sample UPI QR detected</span>}{!cameraOn && <div className="scanner-placeholder"><Camera size={22} /><span>Camera is off</span></div>}<span className="scanner-corner scanner-corner--a" /><span className="scanner-corner scanner-corner--b" /><span className="scanner-corner scanner-corner--c" /><span className="scanner-corner scanner-corner--d" /></div><button type="button" className="dialog-primary" onClick={startScan}><Camera size={15} />{cameraOn ? 'Stop camera simulation' : 'Start camera simulation'}</button><input ref={galleryInput} type="file" accept="image/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) { setQrFileName(file.name); setScanReady(true); } }} /><button type="button" className="dialog-secondary" onClick={() => galleryInput.current?.click()}><ImagePlus size={15} />{qrFileName || 'Choose QR from gallery'}</button>{qrFileName && <p className="upload-status"><Check size={13} /> QR image ready to scan locally</p>}</section></div>}

      {isPinModalOpen && <div className="upi-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsPinModalOpen(false); }}><section className="upi-dialog glass-surface pin-dialog" role="dialog" aria-modal="true" aria-labelledby="pin-title"><button className="dialog-close" type="button" onClick={() => setIsPinModalOpen(false)} aria-label="Close PIN entry"><X size={18} /></button><div className="dialog-icon dialog-icon--green"><Fingerprint size={20} /></div><span className="section-kicker">SECURE CONFIRMATION</span><h3 id="pin-title">Enter your UPI PIN</h3><p>Confirm {formatRupees(amount)} to {selectedContact.name}</p><form onSubmit={confirmPin}><input className="pin-input" aria-label="4 digit UPI PIN" type="password" inputMode="numeric" autoComplete="one-time-code" maxLength={4} value={pin} onChange={(event) => { setPin(event.target.value.replace(/\D/g, '').slice(0, 4)); setPinError(''); }} placeholder="••••" /><div className="pin-dots" aria-hidden="true">{Array.from({ length: 4 }, (_, index) => <i key={index} className={index < pin.length ? 'pin-dot pin-dot--filled' : 'pin-dot'} />)}</div>{pinError && <p className="pin-error">{pinError}</p>}<p className="demo-pin-hint"><LockKeyhole size={12} /> Demo flow: enter any four digits</p><button className="dialog-primary" type="submit">Confirm payment <ArrowRight size={15} /></button></form></section></div>}

      {paymentSuccess && <div className="upi-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPaymentSuccess(null); }}><section className="upi-dialog glass-surface receipt-dialog" role="dialog" aria-modal="true" aria-labelledby="receipt-title"><button className="dialog-close" type="button" onClick={() => setPaymentSuccess(null)} aria-label="Close receipt"><X size={18} /></button><div className="success-burst"><span><Check size={25} /></span></div><span className="section-kicker">PAYMENT COMPLETE</span><h3 id="receipt-title">Sent with a little ease.</h3><p>Your payment is on its way to {paymentSuccess.recipient.name}.</p><strong className="receipt-amount">{formatRupees(paymentSuccess.amount)}</strong><div className="receipt-details"><div><span>UPI ID</span><b>{paymentSuccess.recipient.vpa}</b></div><div><span>Transaction ID</span><b>{paymentSuccess.id}</b></div><div><span>Date & time</span><b>{paymentSuccess.date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</b></div>{paymentSuccess.note && <div><span>Note</span><b>{paymentSuccess.note}</b></div>}</div><button type="button" className="dialog-primary" onClick={() => setPaymentSuccess(null)}>Done <Check size={15} /></button><span className="receipt-foot"><ShieldCheck size={12} /> Secured by UPIQ Shield</span></section></div>}

      {isAddContactOpen && <div className="upi-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsAddContactOpen(false); }}><section className="upi-dialog glass-surface add-contact-dialog" role="dialog" aria-modal="true" aria-labelledby="beneficiary-title"><button className="dialog-close" type="button" onClick={() => setIsAddContactOpen(false)} aria-label="Close add beneficiary"><X size={18} /></button><div className="dialog-icon dialog-icon--cyan"><ContactRound size={20} /></div><h3 id="beneficiary-title">Add a beneficiary</h3><p>Keep your favorite people close for next time.</p><form onSubmit={addBeneficiary}><label className="field-label" htmlFor="beneficiary-name">Name</label><input className="premium-input" id="beneficiary-name" value={beneficiary.name} onChange={(event) => setBeneficiary({ ...beneficiary, name: event.target.value })} placeholder="e.g. Neha Rao" required /><label className="field-label" htmlFor="beneficiary-vpa">UPI ID</label><input className="premium-input" id="beneficiary-vpa" value={beneficiary.vpa} onChange={(event) => setBeneficiary({ ...beneficiary, vpa: event.target.value })} placeholder="name@bank" required /><button type="submit" className="dialog-primary"><Plus size={15} />Add beneficiary</button></form></section></div>}
    </section>
  );
};
