import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, TrendingUp, TrendingDown, Copy, Check } from 'lucide-react';
//import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
const Card = ({ children, className = '', ...props }) => (
  <div className={`border rounded-lg shadow-sm bg-white ${className}`} {...props}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`p-4 border-b ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={`text-lg font-semibold ${className}`} {...props}>
    {children}
  </h3>
);

const CardContent = ({ children, className = '', ...props }) => (
  <div className={`p-4 ${className}`} {...props}>
    {children}
  </div>
);
const translations = {
  he: {
    settlementTitle: 'הוראות העברה',
    transfersNeeded: 'נדרשות {count} העברות ',
    pays: 'משלם',
    receives: 'מקבל',
    winners: 'מנצחים',
    losers: 'מפסידים',
    copyButton: 'העתק סיכום לשיתוף',
    copied: 'הועתק!',
    copyFailed: 'ההעתקה נכשלה',
    shareHeader: 'חישוב כסף בפוקר',
    transfersLabel: 'העברות',
    resultsLabel: 'תוצאות',
    payLine: '{from} משלם ל-{to} — {amount}',
    allSettled: '✅ הכל מאוזן, אין צורך בהעברות'
  },
  en: {
    settlementTitle: 'Settlement Instructions',
    transfersNeeded: '{count} transfer{plural} needed to settle up',
    pays: 'Pays',
    receives: 'Receives',
    winners: 'Winners',
    losers: 'Losers',
    copyButton: 'Copy Summary to Share',
    copied: 'Copied!',
    copyFailed: 'Copy failed',
    shareHeader: 'Poker Settlement',
    transfersLabel: 'Transfers',
    resultsLabel: 'Results',
    payLine: '{from} pays {to} — {amount}',
    allSettled: '✅ All settled, no transfers needed'
  }
};

export default function SettlementResults({ settlements, language = 'he', currency = '₪' }) {
  // Tolerate a missing/partial settlements object so a stale localStorage entry
  // can never throw during render and blank the page.
  const { transfers = [], balances = [] } = settlements || {};
  const t = translations[language];
  const isRTL = language === 'he';

  const [copyStatus, setCopyStatus] = useState('idle'); // 'idle' | 'copied' | 'error'
  const copyTimerRef = useRef(null);

  // Cancel a pending "copied" reset if the component unmounts (e.g. user edits a
  // field or hits Reset within the 2s window).
  useEffect(() => () => clearTimeout(copyTimerRef.current), []);

  const winners = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);
  const losers = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);
  const evens = balances.filter(b => b.balance === 0);

  // Wrap a currency amount in bidi isolates (LRI…PDI) so it always renders
  // left-to-right inside RTL (Hebrew) text — otherwise "-₪50.00" can visually
  // reorder when pasted into a Hebrew WhatsApp chat. No-op for LTR.
  const iso = (s) => (isRTL ? `⁦${s}⁩` : s);

  // Build a clean, plain-text summary suitable for pasting into WhatsApp.
  const buildShareText = () => {
    const lines = [];
    lines.push(`🃏 ${t.shareHeader} 🃏`);
    lines.push('');

    if (transfers.length > 0) {
      lines.push(`💸 ${t.transfersLabel} (${transfers.length}):`);
      transfers.forEach(transfer => {
        lines.push('• ' + t.payLine
          .replace('{from}', transfer.from)
          .replace('{to}', transfer.to)
          .replace('{amount}', iso(`${currency}${transfer.amount.toFixed(2)}`)));
      });
    } else {
      lines.push(t.allSettled);
    }

    lines.push('');
    lines.push(`📊 ${t.resultsLabel}:`);
    winners.forEach(w => lines.push(`🟢 ${w.name}: ${iso(`+${currency}${w.balance.toFixed(2)}`)}`));
    losers.forEach(l => lines.push(`🔴 ${l.name}: ${iso(`${currency}${l.balance.toFixed(2)}`)}`));
    evens.forEach(e => lines.push(`⚪ ${e.name}: ${iso(`${currency}0.00`)}`));

    return lines.join('\n');
  };

  const handleCopy = async () => {
    const text = buildShareText();
    let success = false;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        success = true;
      } else {
        // Fallback for non-secure contexts (e.g. the dev app opened over plain
        // http on a LAN IP from a phone). Kept on-screen but invisible and uses
        // a Range selection so it also works on iOS Safari, which ignores
        // select() on readonly/off-screen elements.
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.contentEditable = 'true';
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.width = '1px';
        textarea.style.height = '1px';
        textarea.style.padding = '0';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        const range = document.createRange();
        range.selectNodeContents(textarea);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        textarea.setSelectionRange(0, text.length);
        success = document.execCommand('copy');
        selection.removeAllRanges();
        document.body.removeChild(textarea);
      }
    } catch {
      success = false;
    }

    setCopyStatus(success ? 'copied' : 'error');
    // Restart the 2s window on every click so the confirmation never vanishes early.
    clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopyStatus('idle'), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Settlement Instructions */}
      <div className="bg-gradient-to-br from-[#0c4a45]/60 to-[#06302e]/60 border-2 border-teal-400/40 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden glow-teal">
        <div className="border-b-2 border-teal-500/40 bg-gradient-to-r from-teal-900/40 to-emerald-900/30 p-6">
          <h3 className="text-3xl text-gradient flex items-center gap-3 font-bold">
            <CheckCircle className="w-8 h-8 text-amber-400" />
            {t.settlementTitle}
          </h3>
          <p className="text-teal-100 text-base mt-3 font-medium">
            {language === 'he' 
              ? t.transfersNeeded.replace('{count}', transfers.length)
              : t.transfersNeeded.replace('{count}', transfers.length).replace('{plural}', transfers.length !== 1 ? 's' : '')
            }
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {transfers.map((transfer, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-5 bg-teal-950/50 backdrop-blur-sm rounded-xl border-2 border-teal-500/30 hover:border-emerald-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.02]"
              >
                <div className={`flex-1 ${isRTL ? 'text-left' : 'text-right'}`}>
                  <p className="text-white font-bold text-lg">{transfer.from}</p>
                  <p className="text-rose-400 text-sm font-semibold mt-1">{t.pays}</p>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <ArrowRight className={`w-7 h-7 text-amber-400 ${isRTL ? 'rotate-180' : ''}`} />
                  <div className="px-4 py-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 rounded-full shadow-lg shadow-amber-500/40">
                    <p className="text-teal-950 font-extrabold text-base whitespace-nowrap">
                      {currency}{transfer.amount.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <p className="text-white font-bold text-lg">{transfer.to}</p>
                  <p className="text-emerald-400 text-sm font-semibold mt-1">{t.receives}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Winners */}
        {winners.length > 0 && (
          <div className="bg-gradient-to-br from-emerald-900/40 to-[#06302e]/50 border-2 border-emerald-500/40 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden glow-green">
            <div className="border-b-2 border-emerald-500/40 bg-gradient-to-r from-emerald-900/40 to-teal-900/20 p-5">
              <h3 className="text-xl text-emerald-300 flex items-center gap-2 font-bold">
                <TrendingUp className="w-6 h-6" />
                {t.winners}
              </h3>
            </div>
            <div className="p-5">
              <div className="space-y-3">
                {winners.map((player, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex justify-between items-center p-4 bg-teal-950/40 rounded-xl border-2 border-emerald-500/30 hover:border-emerald-400/60 transition-all duration-300 hover:scale-[1.02]"
                  >
                    <span className="text-white font-bold text-lg">{player.name}</span>
                    <span className="text-emerald-400 font-extrabold text-lg">
                      +{currency}{player.balance.toFixed(2)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Losers */}
        {losers.length > 0 && (
          <div className="bg-gradient-to-br from-rose-950/40 to-[#06302e]/50 border-2 border-rose-500/40 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden glow-red">
            <div className="border-b-2 border-rose-500/40 bg-gradient-to-r from-rose-950/40 to-teal-900/20 p-5">
              <h3 className="text-xl text-rose-300 flex items-center gap-2 font-bold">
                <TrendingDown className="w-6 h-6" />
                {t.losers}
              </h3>
            </div>
            <div className="p-5">
              <div className="space-y-3">
                {losers.map((player, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex justify-between items-center p-4 bg-teal-950/40 rounded-xl border-2 border-rose-500/30 hover:border-rose-400/60 transition-all duration-300 hover:scale-[1.02]"
                  >
                    <span className="text-white font-bold text-lg">{player.name}</span>
                    <span className="text-rose-400 font-extrabold text-lg">
                      {currency}{player.balance.toFixed(2)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Copy / Share Summary */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={handleCopy}
          className={`flex items-center justify-center gap-2 px-8 py-4 font-bold rounded-xl shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-950 text-lg ${
            copyStatus === 'copied'
              ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 text-teal-950 shadow-emerald-500/50 glow-green'
              : copyStatus === 'error'
              ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 text-white shadow-rose-500/40'
              : 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:via-emerald-400 hover:to-emerald-500 text-teal-950 shadow-emerald-500/40'
          }`}
        >
          {copyStatus === 'copied' ? (
            <>
              <Check className={`w-6 h-6 ${isRTL ? 'ml-1' : 'mr-1'}`} />
              {t.copied}
            </>
          ) : copyStatus === 'error' ? (
            <>
              <Copy className={`w-6 h-6 ${isRTL ? 'ml-1' : 'mr-1'}`} />
              {t.copyFailed}
            </>
          ) : (
            <>
              <Copy className={`w-6 h-6 ${isRTL ? 'ml-1' : 'mr-1'}`} />
              {t.copyButton}
            </>
          )}
        </button>
        {/* Announce copy result to screen readers (kept mounted so the change fires). */}
        <span role="status" aria-live="polite" className="sr-only">
          {copyStatus === 'copied' ? t.copied : copyStatus === 'error' ? t.copyFailed : ''}
        </span>
      </div>
    </motion.div>
  );
}