import React, { useState, useEffect } from 'react';
import { Plus, Calculator, Trash2, AlertCircle, Flag, Sparkles, AlertTriangle } from 'lucide-react';
import PlayerCard from '../components/Poker/PlayerCard';
import SettlementResults from '../components/Poker/SettlementResults';
import '../App.css';

const STORAGE_KEY = 'poker-settlement-state-v1';

const DEFAULT_PLAYERS = [
  { id: 1, name: '', buyIn: '', cashOut: '' },
  { id: 2, name: '', buyIn: '', cashOut: '' },
  { id: 3, name: '', buyIn: '', cashOut: '' }
];

// Read persisted state from localStorage. Returns null if absent/unreadable.
const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// Validate/normalize a restored players array; fall back to defaults if invalid.
const restorePlayers = (saved) => {
  if (!Array.isArray(saved) || saved.length < 3) return DEFAULT_PLAYERS;
  return saved.map((p, i) => ({
    id: p && p.id != null ? p.id : i + 1,
    name: p && typeof p.name === 'string' ? p.name : '',
    buyIn: p && p.buyIn != null ? String(p.buyIn) : '',
    cashOut: p && p.cashOut != null ? String(p.cashOut) : ''
  }));
};

// Validate a restored settlements object; return null if the shape is unusable
// so a stale/corrupt entry can never crash the results view on load.
const restoreSettlements = (saved) =>
  saved && Array.isArray(saved.transfers) && Array.isArray(saved.balances) ? saved : null;

const Button = ({ children, onClick, className = '', variant, size, ...props }) => (
  <button 
    onClick={onClick} 
    className={`px-4 py-2 rounded font-medium transition ${className}`}
    {...props}
  >
    {children}
  </button>
);

const translations = {
  he: {
    title: 'חישוב כסף בפוקר',
    subtitle: '',
    addPlayer: 'הוסף שחקן',
    calculate: 'חשב חלוקה',
    reset: 'אפס הכל',
    errorFillAll: 'אנא מלא את כל פרטי השחקנים',
    errorBalance: 'הכסף לא מאוזן! כניסה: ₪{buyIn}, יציאה: ₪{cashOut}',
    errorBalanceSuggestion: 'אנא בדוק את הסכומים או המשך בכל זאת',
    proceedAnyway: 'המשך בכל זאת',
    currency: '₪'
  },
  en: {
    title: 'Poker Settlement',
    subtitle: '',
    addPlayer: 'Add Player',
    calculate: 'Calculate Settlement',
    reset: 'Reset All',
    errorFillAll: 'Please fill in all player details',
    errorBalance: 'Money doesn\'t balance! Buy-in: ${buyIn}, Cash-out: ${cashOut}',
    errorBalanceSuggestion: 'Please check the amounts or proceed anyway',
    proceedAnyway: 'Proceed Anyway',
    currency: '$'
  }
};

export default function PokerSettlement() {
  // Read persisted state once per mount and reuse for all initializers.
  const [saved] = useState(loadState);
  const [language, setLanguage] = useState(() =>
    saved && (saved.language === 'en' || saved.language === 'he') ? saved.language : 'he'
  );
  const [players, setPlayers] = useState(() => restorePlayers(saved?.players));
  const [settlements, setSettlements] = useState(() => restoreSettlements(saved?.settlements));
  const [error, setError] = useState('');
  const [balanceMismatch, setBalanceMismatch] = useState(null);

  const t = translations[language];
  const isRTL = language === 'he';

  // Persist players, language and the latest settlement so a refresh keeps the data.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ players, language, settlements }));
    } catch {
      // Storage may be unavailable (private mode, quota); fail silently.
    }
  }, [players, language, settlements]);

  const addPlayer = () => {
    if (players.length < 12) {
      setPlayers([...players, { 
        id: Date.now(), 
        name: '', 
        buyIn: '', 
        cashOut: '' 
      }]);
      setSettlements(null);
    }
  };

  const removePlayer = (id) => {
    if (players.length > 3) {
      setPlayers(players.filter(p => p.id !== id));
      setSettlements(null);
    }
  };

  const updatePlayer = (id, field, value) => {
    setPlayers(players.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
    setSettlements(null);
    setError('');
    setBalanceMismatch(null);
  };

  const calculateSettlementsWithAdjustment = (adjustBalances = false) => {
    const invalidPlayers = players.filter(p => 
      !p.name.trim() || p.buyIn === '' || p.cashOut === ''
    );
    
    if (invalidPlayers.length > 0) {
      setError(t.errorFillAll);
      setBalanceMismatch(null);
      return;
    }

    const totalBuyIn = players.reduce((sum, p) => sum + parseFloat(p.buyIn || 0), 0);
    const totalCashOut = players.reduce((sum, p) => sum + parseFloat(p.cashOut || 0), 0);
    const difference = totalCashOut - totalBuyIn;

    // Check for balance mismatch
    if (Math.abs(difference) > 0.01 && !adjustBalances) {
      setBalanceMismatch({
        totalBuyIn,
        totalCashOut,
        difference
      });
      setError(t.errorBalance
        .replace('{buyIn}', totalBuyIn.toFixed(2))
        .replace('{cashOut}', totalCashOut.toFixed(2)));
      return;
    }

    // Calculate balances
    let balances = players.map(p => ({
      name: p.name,
      balance: parseFloat(p.cashOut) - parseFloat(p.buyIn)
    }));

    // Adjust balances if there's a mismatch and user chose to proceed
    if (adjustBalances && Math.abs(difference) > 0.01) {
      const winners = balances.filter(b => b.balance > 0.01);
      const losers = balances.filter(b => b.balance < -0.01);
      const totalWinnings = winners.reduce((sum, w) => sum + w.balance, 0);
      const totalLosses = losers.reduce((sum, l) => sum + Math.abs(l.balance), 0);
      
      if (difference < 0) {
        // More money entered than left (totalBuyIn > totalCashOut)
        // Reduce losers' losses proportionally to match winners' gains
        // Winners keep their gains, losers pay less
        if (losers.length > 0 && totalLosses > 0) {
          const scaleFactor = totalWinnings / totalLosses;
          balances = balances.map(b => {
            if (b.balance < -0.01) {
              return { ...b, balance: b.balance * scaleFactor };
            }
            return b;
          });
        }
      } else {
        // Less money entered than left (totalBuyIn < totalCashOut)
        // Reduce winners' gains proportionally to match losers' losses
        // Losers keep their losses, winners get less
        if (winners.length > 0 && totalWinnings > 0) {
          const scaleFactor = totalLosses / totalWinnings;
          balances = balances.map(b => {
            if (b.balance > 0.01) {
              return { ...b, balance: b.balance * scaleFactor };
            }
            return b;
          });
        }
      }
    }

    // Clone into working copies — the settlement loop below mutates .balance,
    // and these must NOT alias the objects in `balances` (which is what the
    // Results view displays). Without the clone, winners get zeroed out here.
    const creditors = balances
      .filter(b => b.balance > 0.01)
      .map(b => ({ ...b }))
      .sort((a, b) => b.balance - a.balance);

    const debtors = balances
      .filter(b => b.balance < -0.01)
      .map(b => ({ ...b, balance: Math.abs(b.balance) }))
      .sort((a, b) => b.balance - a.balance);

    const transfers = [];
    let i = 0, j = 0;

    while (i < creditors.length && j < debtors.length) {
      const creditor = { ...creditors[i] };
      const debtor = { ...debtors[j] };
      
      const amount = Math.min(creditor.balance, debtor.balance);
      
      transfers.push({
        from: debtor.name,
        to: creditor.name,
        amount: amount
      });

      creditors[i].balance -= amount;
      debtors[j].balance -= amount;

      if (creditors[i].balance < 0.01) i++;
      if (debtors[j].balance < 0.01) j++;
    }

    setSettlements({
      transfers,
      balances: balances.map(b => ({
        ...b,
        balance: parseFloat(b.balance.toFixed(2))
      }))
    });
    setError('');
    setBalanceMismatch(null);
  };

  const calculateSettlements = () => {
    calculateSettlementsWithAdjustment(false);
  };

  const proceedAnyway = () => {
    calculateSettlementsWithAdjustment(true);
  };

  const resetAll = () => {
    setPlayers(DEFAULT_PLAYERS.map(p => ({ ...p })));
    setSettlements(null);
    setError('');
    setBalanceMismatch(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#042f2e] via-[#0a3f3c] to-[#0d3b3a] poker-chip-bg p-4 md:p-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-20 left-10 w-32 h-32 bg-teal-400 rounded-full blur-3xl animate-float"></div>
          <div className="absolute top-40 right-1/4 w-24 h-24 bg-amber-400 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-emerald-400 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Language Toggle */}
        <div className="flex justify-end mb-4 relative z-10">
          <button
            onClick={() => setLanguage(language === 'he' ? 'en' : 'he')}
            className="flex items-center gap-2 px-4 py-2 bg-teal-950/60 backdrop-blur-sm border border-teal-400/40 text-teal-100 hover:bg-teal-900/70 hover:border-teal-300 rounded-lg font-medium transition-all duration-300 hover:scale-105"
          >
            <Flag className="w-4 h-4" />
            {language === 'he' ? 'English' : 'עברית'}
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8 md:mb-12 relative z-10">
          <div className="inline-block">
            <h1 className="text-4xl md:text-6xl font-bold text-gradient mb-3 animate-pulse-slow">
              {t.title}
            </h1>
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full"></div>
          </div>
          <p className="text-teal-100/90 text-lg mt-4 font-medium">
            {t.subtitle}
          </p>
        </div>

        {/* Player Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 relative z-10">
          {players.map((player, index) => (
            <PlayerCard
              key={player.id}
              player={player}
              index={index}
              onUpdate={updatePlayer}
              onRemove={removePlayer}
              canRemove={players.length > 3}
              language={language}
              currency={t.currency}
            />
          ))}
        </div>

        {/* Add Player Button */}
        {players.length < 12 && (
          <div className="flex justify-center mb-6 relative z-10">
            <button
              onClick={addPlayer}
              className="flex items-center gap-2 px-6 py-3 bg-teal-800/40 backdrop-blur-sm border-2 border-teal-400/50 text-teal-100 hover:bg-teal-700/50 hover:border-emerald-300 hover:text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/30"
            >
              <Plus className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t.addPlayer} ({players.length}/12)
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-rose-950/50 backdrop-blur-sm border-2 border-rose-500/60 rounded-xl relative z-10">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-rose-100 font-medium mb-2">{error}</p>
                {balanceMismatch && (
                  <div className="mt-3">
                    <p className="text-rose-200 text-sm mb-3">{t.errorBalanceSuggestion}</p>
                    <button
                      onClick={proceedAnyway}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-teal-950 font-semibold rounded-lg transition-all duration-300 hover:scale-105"
                    >
                      <Calculator className="w-4 h-4" />
                      {t.proceedAnyway}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8 relative z-10">
          <button
            onClick={calculateSettlements}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:from-amber-300 hover:via-yellow-200 hover:to-amber-300 text-teal-950 font-bold rounded-xl shadow-2xl shadow-amber-500/40 transition-all duration-300 hover:scale-105 hover:-translate-y-1 glow-amber text-lg"
          >
            <Calculator className={`w-6 h-6 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t.calculate}
          </button>
          <button
            onClick={resetAll}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-teal-950/50 backdrop-blur-sm border-2 border-teal-500/40 text-teal-100 hover:bg-teal-900/70 hover:border-teal-400 hover:text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105"
          >
            <Trash2 className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t.reset}
          </button>
        </div>

        {/* Results */}
        {settlements && (
          <div className="relative z-10">
            <SettlementResults settlements={settlements} language={language} currency={t.currency} />
          </div>
        )}
      </div>
    </div>

  );
}