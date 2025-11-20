import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
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
    losers: 'מפסידים'
  },
  en: {
    settlementTitle: 'Settlement Instructions',
    transfersNeeded: '{count} transfer{plural} needed to settle up',
    pays: 'Pays',
    receives: 'Receives',
    winners: 'Winners',
    losers: 'Losers'
  }
};

export default function SettlementResults({ settlements, language = 'he', currency = '₪' }) {
  const { transfers, balances } = settlements;
  const t = translations[language];
  const isRTL = language === 'he';
  
  const winners = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);
  const losers = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Settlement Instructions */}
      <div className="bg-gradient-to-br from-emerald-900/50 to-slate-900/50 border-2 border-emerald-600/40 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
        <div className="border-b-2 border-emerald-700/40 bg-gradient-to-r from-emerald-900/40 to-slate-900/40 p-6">
          <h3 className="text-3xl text-gradient flex items-center gap-3 font-bold">
            <CheckCircle className="w-8 h-8 text-amber-400" />
            {t.settlementTitle}
          </h3>
          <p className="text-emerald-200 text-base mt-3 font-medium">
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
                className="flex items-center gap-4 p-5 bg-slate-800/70 backdrop-blur-sm rounded-xl border-2 border-emerald-700/30 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-900/30 hover:scale-[1.02]"
              >
                <div className={`flex-1 ${isRTL ? 'text-left' : 'text-right'}`}>
                  <p className="text-white font-bold text-lg">{transfer.from}</p>
                  <p className="text-red-400 text-sm font-semibold mt-1">{t.pays}</p>
                </div>
                
                <div className="flex flex-col items-center gap-2">
                  <ArrowRight className={`w-7 h-7 text-amber-400 ${isRTL ? 'rotate-180' : ''}`} />
                  <div className="px-4 py-2 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 rounded-full shadow-lg shadow-amber-900/50">
                    <p className="text-slate-900 font-extrabold text-base whitespace-nowrap">
                      {currency}{transfer.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <p className="text-white font-bold text-lg">{transfer.to}</p>
                  <p className="text-green-400 text-sm font-semibold mt-1">{t.receives}</p>
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
          <div className="bg-gradient-to-br from-green-900/30 to-slate-900/50 border-2 border-green-600/40 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
            <div className="border-b-2 border-green-700/40 bg-gradient-to-r from-green-900/30 to-slate-900/30 p-5">
              <h3 className="text-xl text-green-300 flex items-center gap-2 font-bold">
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
                    className="flex justify-between items-center p-4 bg-slate-800/50 rounded-xl border-2 border-green-700/30 hover:border-green-500/50 transition-all duration-300 hover:scale-[1.02]"
                  >
                    <span className="text-white font-bold text-lg">{player.name}</span>
                    <span className="text-green-400 font-extrabold text-lg">
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
          <div className="bg-gradient-to-br from-red-900/30 to-slate-900/50 border-2 border-red-600/40 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
            <div className="border-b-2 border-red-700/40 bg-gradient-to-r from-red-900/30 to-slate-900/30 p-5">
              <h3 className="text-xl text-red-300 flex items-center gap-2 font-bold">
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
                    className="flex justify-between items-center p-4 bg-slate-800/50 rounded-xl border-2 border-red-700/30 hover:border-red-500/50 transition-all duration-300 hover:scale-[1.02]"
                  >
                    <span className="text-white font-bold text-lg">{player.name}</span>
                    <span className="text-red-400 font-extrabold text-lg">
                      {currency}{player.balance.toFixed(2)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}