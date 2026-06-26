import React from 'react';
import { motion } from 'framer-motion';
//import { Input } from '@/components/ui/input';
//import { Button } from '@/components/ui/button';
import { X, User, TrendingDown, TrendingUp, Plus, Minus } from 'lucide-react';
//import { Label } from '@/components/ui/label';
// Simple UI components
const Button = ({ children, onClick, className = '', variant, size, ...props }) => (
  <button 
    onClick={onClick} 
    className={`px-4 py-2 rounded font-medium transition ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Input = ({ className = '', ...props }) => (
  <input 
    className={`px-3 py-2 border rounded w-full ${className}`}
    {...props}
  />
);

const Label = ({ children, className = '', ...props }) => (
  <label className={`block text-sm font-medium mb-1 ${className}`} {...props}>
    {children}
  </label>
);

const translations = {
  he: {
    playerName: 'שם השחקן',
    buyIn: 'כסף כניסה כולל',
    cashOut: 'כסף בסיום',
    enterName: 'הכנס שם'
  },
  en: {
    playerName: 'Player Name',
    buyIn: 'Buy-in Amount',
    cashOut: 'Cash-out Amount',
    enterName: 'Enter name'
  }
};

export default function PlayerCard({ player, index, onUpdate, onRemove, canRemove, language = 'he', currency = '₪' }) {
  const t = translations[language];
  const isRTL = language === 'he';

  const adjustValue = (field, delta) => {
    const currentValue = parseFloat(player[field]) || 0;
    const newValue = Math.max(0, currentValue + delta);
    onUpdate(player.id, field, newValue.toString());
  };
  const netBalance = player.cashOut && player.buyIn 
    ? parseFloat(player.cashOut) - parseFloat(player.buyIn)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
      className="relative bg-gradient-to-br from-[#0c4a45]/85 to-[#06302e]/90 backdrop-blur-sm border-2 border-teal-400/30 rounded-2xl p-5 shadow-2xl player-card-hover card-shine hover:border-emerald-300/60"
    >
      {/* Player Number Badge */}
      <div className="absolute -top-4 -left-4 w-10 h-10 bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-teal-950 font-bold text-base shadow-lg shadow-amber-500/50 border-2 border-amber-200">
        {index + 1}
      </div>

      {/* Remove Button */}
      {canRemove && (
        <button
          onClick={() => onRemove(player.id)}
          className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-rose-950/60 backdrop-blur-sm hover:bg-rose-800 text-rose-400 hover:text-rose-200 flex items-center justify-center transition-all duration-300 hover:scale-110 border-2 border-rose-600/50 hover:border-rose-400"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="space-y-4 mt-2">
        {/* Name Input */}
        <div>
          <Label htmlFor={`name-${player.id}`} className="text-teal-200 text-sm mb-2 flex items-center gap-2 font-semibold">
            <User className="w-4 h-4" />
            {t.playerName}
          </Label>
          <Input
            id={`name-${player.id}`}
            value={player.name}
            onChange={(e) => onUpdate(player.id, 'name', e.target.value)}
            placeholder={t.enterName}
            className="bg-teal-950/50 border-2 border-teal-500/30 text-white placeholder:text-teal-400/50 focus:border-amber-500/70 focus:ring-2 focus:ring-amber-500/30 rounded-lg h-11 transition-all duration-300"
          />
        </div>

        {/* Buy-in Input */}
        <div>
          <Label htmlFor={`buyin-${player.id}`} className="text-teal-200 text-sm mb-2 flex items-center gap-2 font-semibold">
            <TrendingDown className="w-4 h-4" />
            {t.buyIn}
          </Label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => adjustValue('buyIn', -50)}
              className="h-11 w-11 rounded-lg bg-teal-950/60 border-2 border-rose-600/40 hover:bg-rose-900/50 hover:border-rose-500 text-rose-400 hover:text-rose-300 transition-all duration-300 hover:scale-110 flex items-center justify-center"
            >
              <Minus className="w-5 h-5" />
            </button>
            <div className="relative flex-1">
              <span className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-amber-400 text-sm font-bold`}>{currency}</span>
              <Input
                id={`buyin-${player.id}`}
                type="number"
                step="50"
                min="0"
                value={player.buyIn}
                onChange={(e) => onUpdate(player.id, 'buyIn', e.target.value)}
                placeholder="0"
                className={`bg-teal-950/50 border-2 border-teal-500/30 text-white text-center placeholder:text-teal-400/50 focus:border-amber-500/70 focus:ring-2 focus:ring-amber-500/30 rounded-lg h-11 font-semibold transition-all duration-300 ${isRTL ? 'pr-10' : 'pl-10'}`}
              />
            </div>
            <button
              type="button"
              onClick={() => adjustValue('buyIn', 50)}
              className="h-11 w-11 rounded-lg bg-teal-950/60 border-2 border-emerald-500/40 hover:bg-emerald-900/50 hover:border-emerald-400 text-emerald-400 hover:text-emerald-300 transition-all duration-300 hover:scale-110 flex items-center justify-center"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cash-out Input */}
        <div>
          <Label htmlFor={`cashout-${player.id}`} className="text-teal-200 text-sm mb-2 flex items-center gap-2 font-semibold">
            <TrendingUp className="w-4 h-4" />
            {t.cashOut}
          </Label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => adjustValue('cashOut', -50)}
              className="h-11 w-11 rounded-lg bg-teal-950/60 border-2 border-rose-600/40 hover:bg-rose-900/50 hover:border-rose-500 text-rose-400 hover:text-rose-300 transition-all duration-300 hover:scale-110 flex items-center justify-center"
            >
              <Minus className="w-5 h-5" />
            </button>
            <div className="relative flex-1">
              <span className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-amber-400 text-sm font-bold`}>{currency}</span>
              <Input
                id={`cashout-${player.id}`}
                type="number"
                step="50"
                min="0"
                value={player.cashOut}
                onChange={(e) => onUpdate(player.id, 'cashOut', e.target.value)}
                placeholder="0"
                className={`bg-teal-950/50 border-2 border-teal-500/30 text-white text-center placeholder:text-teal-400/50 focus:border-amber-500/70 focus:ring-2 focus:ring-amber-500/30 rounded-lg h-11 font-semibold transition-all duration-300 ${isRTL ? 'pr-10' : 'pl-10'}`}
              />
            </div>
            <button
              type="button"
              onClick={() => adjustValue('cashOut', 50)}
              className="h-11 w-11 rounded-lg bg-teal-950/60 border-2 border-emerald-500/40 hover:bg-emerald-900/50 hover:border-emerald-400 text-emerald-400 hover:text-emerald-300 transition-all duration-300 hover:scale-110 flex items-center justify-center"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Net Balance Display */}
        {netBalance !== null && !isNaN(netBalance) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`text-center py-3 rounded-lg font-bold text-lg transition-all duration-300 ${
              netBalance > 0
                ? 'bg-emerald-900/40 text-emerald-300 border-2 border-emerald-500/50 glow-green'
                : netBalance < 0
                ? 'bg-rose-950/40 text-rose-300 border-2 border-rose-500/50 glow-red'
                : 'bg-teal-900/40 text-teal-200 border-2 border-teal-600/50'
            }`}
          >
            {netBalance > 0 ? '+' : ''}{currency}{netBalance.toFixed(2)}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}