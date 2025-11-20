import React, { useState } from 'react';
import { Plus, Calculator, Trash2, AlertCircle, Flag, Sparkles } from 'lucide-react';
import PlayerCard from '../components/Poker/PlayerCard';
import SettlementResults from '../components/poker/SettlementResults';
import '../App.css';

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
    currency: '$'
  }
};

export default function PokerSettlement() {
  const [language, setLanguage] = useState('he');
  const [players, setPlayers] = useState([
    { id: 1, name: '', buyIn: '', cashOut: '' },
    { id: 2, name: '', buyIn: '', cashOut: '' },
    { id: 3, name: '', buyIn: '', cashOut: '' }
  ]);
  const [settlements, setSettlements] = useState(null);
  const [error, setError] = useState('');

  const t = translations[language];
  const isRTL = language === 'he';

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
  };

  const calculateSettlements = () => {
    const invalidPlayers = players.filter(p => 
      !p.name.trim() || p.buyIn === '' || p.cashOut === ''
    );
    
    if (invalidPlayers.length > 0) {
      setError(t.errorFillAll);
      return;
    }

    const totalBuyIn = players.reduce((sum, p) => sum + parseFloat(p.buyIn || 0), 0);
    const totalCashOut = players.reduce((sum, p) => sum + parseFloat(p.cashOut || 0), 0);

    if (Math.abs(totalBuyIn - totalCashOut) > 0.01) {
      setError(t.errorBalance
        .replace('{buyIn}', totalBuyIn.toFixed(2))
        .replace('{cashOut}', totalCashOut.toFixed(2)));
      return;
    }

    const balances = players.map(p => ({
      name: p.name,
      balance: parseFloat(p.cashOut) - parseFloat(p.buyIn)
    }));

    const creditors = balances
      .filter(b => b.balance > 0.01)
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
  };

  const resetAll = () => {
    setPlayers([
      { id: 1, name: '', buyIn: '', cashOut: '' },
      { id: 2, name: '', buyIn: '', cashOut: '' },
      { id: 3, name: '', buyIn: '', cashOut: '' }
    ]);
    setSettlements(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 poker-chip-bg p-4 md:p-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 bg-amber-500 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-emerald-500 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Language Toggle */}
        <div className="flex justify-end mb-4 relative z-10">
          <button
            onClick={() => setLanguage(language === 'he' ? 'en' : 'he')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/70 backdrop-blur-sm border border-emerald-600/40 text-emerald-200 hover:bg-slate-700/80 hover:border-emerald-500 rounded-lg font-medium transition-all duration-300 hover:scale-105"
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
          <p className="text-emerald-200/90 text-lg mt-4 font-medium">
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
              className="flex items-center gap-2 px-6 py-3 bg-emerald-800/40 backdrop-blur-sm border-2 border-emerald-600/50 text-emerald-200 hover:bg-emerald-700/50 hover:border-emerald-500 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-900/50"
            >
              <Plus className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t.addPlayer} ({players.length}/12)
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/40 backdrop-blur-sm border-2 border-red-600/60 rounded-xl flex items-center gap-3 relative z-10 animate-pulse">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-200 font-medium">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8 relative z-10">
          <button
            onClick={calculateSettlements}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:via-yellow-400 hover:to-amber-500 text-slate-900 font-bold rounded-xl shadow-2xl shadow-amber-900/50 transition-all duration-300 hover:scale-105 hover:-translate-y-1 glow-amber text-lg"
          >
            <Calculator className={`w-6 h-6 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t.calculate}
          </button>
          <button
            onClick={resetAll}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-800/60 backdrop-blur-sm border-2 border-slate-600 text-slate-300 hover:bg-slate-700/80 hover:border-slate-500 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
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