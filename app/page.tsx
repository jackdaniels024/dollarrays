'use client';
import { useState, useEffect } from 'react';
import { useDigitsTrading } from '../hooks/use-digits-trading';
import { useDerivWSContext } from '@/components/custom/deriv-ws-provider';
import { useLogoSrc } from '@/components/custom/logo-src-provider';
import { DigitsView } from '../components/digits-view';

export default function DigitsPage() {
  const logoSrc = useLogoSrc();
  const { ws, isConnected, isExhausted, auth } = useDerivWSContext();
  const { authState, accounts, activeAccount, login, signUp, logout, switchAccount } = auth;

  const trading = useDigitsTrading({ ws, isConnected, isExhausted, isAuthenticated: !!auth.wsUrl, onAuthWSFailed: logout });

  // ==========================================
  // DOLLARRAYSFX AUTO-PRINTER CORE CONTROLS
  // ==========================================
  const [isBotRunning, setIsBotRunning] = useState<boolean>(false);
  const [currentStake, setCurrentStake] = useState<number>(1.00);
  const [digitCounts, setDigitCounts] = useState<number[]>(Array(10).fill(0));

  const martingaleMultiplier = 2.1;
  let consecutiveOddCounter = 0;
  let targetProfit = 10.00;
  let stopLoss = -15.00;
  let accumulatedProfit = 0.00;

  // Automatically feeds every single live market tick into your printing engine
  useEffect(() => {
    // Check if trading data exists and if there is a fresh tick running
    if (trading && (trading as any).lastTick) {
      runDollarPrinterEngine((trading as any).lastTick);
    }
  }, [trading, isBotRunning]);
  function runDollarPrinterEngine(tickData: any) {
      if (!isBotRunning || !ws) return;

      if (accumulatedProfit >= targetProfit || accumulatedProfit <= stopLoss) {
          setIsBotRunning(false);
          return;
      }

      const currentPriceString = tickData.quote.toFixed(tickData.pip_size || 2);
      const lastDigit = parseInt(currentPriceString.slice(-1));

      if (!isNaN(lastDigit)) {
          setDigitCounts(prev => {
              const next = [...prev];
              next[lastDigit] += 1;
              return next;
          });

          if (lastDigit % 2 !== 0) {
              consecutiveOddCounter++;
          } else {
              consecutiveOddCounter = 0;
          }

          if (consecutiveOddCounter >= 3) {
              const contractPayload = {
                  amount: currentStake,
                  basis: "stake",
                  duration: 1,
                  duration_unit: "t",
                  currency: "USD",
                  symbol: "R_100", 
                  contract_type: "DIGITEVEN"
              };

              // Pushes the auto-trade order straight down your active WebSocket
              ws.send(JSON.stringify({ buy: 1, price: currentStake, parameters: contractPayload }));
              
              consecutiveOddCounter = 0; 
          }
      }
  }
  return (
    <DigitsView
      authState={authState}
      accounts={accounts}
      activeAccount={activeAccount}
      onLogin={login}
      onSignUp={signUp}
      onLogout={logout}
      onSwitchAccount={switchAccount}
      logoSrc={logoSrc}
      isConnected={trading.isConnected}
      isLoading={trading.isLoading}
      error={trading.error}
      symbols={trading.symbols}
      activeSymbol={trading.activeSymbol}
      selectSymbol={trading.selectSymbol}
      currentTick={trading.currentTick}
      lastDigit={trading.lastDigit}
      digitStats={trading.digitStats}
      pipSize={trading.pipSize}
      tradeType={trading.tradeType}
      setTradeType={trading.setTradeType}
      contractMode={trading.contractMode}
      setContractMode={trading.setContractMode}
      selectedDigit={trading.selectedDigit}
      setSelectedDigit={trading.setSelectedDigit}
      stake={trading.stake}
      setStake={trading.setStake}
      duration={trading.duration}
      setDuration={trading.setDuration}
      durationLimits={trading.durationLimits}
      proposal={trading.proposal}
      isProposalLoading={trading.isProposalLoading}
      buyContract={trading.buyContract}
      isBuying={trading.isBuying}
      buyResult={trading.buyResult}
      buyError={trading.buyError}
      clearBuyResult={trading.clearBuyResult}
    />
  );
}
return (
    <>
      {/* 1. This keeps your original layout view active */}
      <DigitsView
        authState={authState}
        accounts={accounts}
        activeAccount={activeAccount}
      />

      {/* 2. ULTIMATE DOLLARRAYSFX AUTO-PRINTER DASHBOARD PANEL */}
      <div className="bg-gray-900 border border-gray-800 text-white p-6 rounded-xl max-w-xl mx-auto mt-6 shadow-2xl font-sans text-left">
        
        {/* Header Status Bar */}
        <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-3">
          <div>
            <h2 className="text-sm font-black tracking-widest text-green-400">💵 DOLLARRAYSFX AUTOMATION CORE</h2>
            <p className="text-[10px] text-gray-500 font-medium uppercase mt-0.5 tracking-wider">Institutional Digit Scanner & Execution Engine</p>
          </div>
          <div className="flex items-center gap-2 bg-gray-950 px-3 py-1.5 rounded-full border border-gray-800">
            <span className={`h-2.5 w-2.5 rounded-full ${isBotRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            <span className="text-[10px] font-bold tracking-wider uppercase text-gray-400">
              {isBotRunning ? 'CORE ACTIVE' : 'ENGINE IDLE'}
            </span>
          </div>
        </div>

        {/* PRO-GRADE REALTIME DIGIT SCANNER BARS */}
        <div className="mb-6 bg-gray-950 p-4 rounded-lg border border-gray-850">
          <h3 className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-3 text-center">Live Last Digit Frequency (0 - 9)</h3>
          <div className="grid grid-cols-10 gap-1.5 items-end h-24 pt-2">
            {digitCounts.map((count, index) => {
              const maxCount = Math.max(...digitCounts, 1);
              const percentageHeight = (count / maxCount) * 100;
              return (
                <div key={index} className="flex flex-col items-center h-full justify-end group cursor-pointer">
                  <span className="text-[9px] text-gray-500 font-mono mb-1 transition group-hover:text-green-400">{count}</span>
                  <div className="w-full bg-gray-900 rounded-t relative overflow-hidden h-full flex items-end">
                    <div 
                      style={{ height: `${percentageHeight}%` }} 
                      className={`w-full transition-all duration-300 rounded-t ${
                        index % 2 === 0 ? 'bg-gradient-to-t from-blue-600 to-blue-400' : 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                      }`}
                    />
                  </div>
                  <span className={`text-xs font-bold font-mono mt-1.5 ${index % 2 === 0 ? 'text-blue-400' : 'text-emerald-400'}`}>{index}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* RISK MANAGEMENT INPUT FIELDS */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-[10px] text-gray-500 font-bold block mb-1 uppercase tracking-wider">Base Initial Stake</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500 text-sm font-bold">$</span>
              <input 
                type="number" 
                value={currentStake} 
                onChange={(e) => setCurrentStake(parseFloat(e.target.value) || 0)} 
                className="w-full bg-gray-950 pl-7 pr-3 py-2 text-sm rounded border border-gray-800 focus:border-green-500 font-mono outline-none text-white font-bold" 
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 font-bold block mb-1 uppercase tracking-wider">Martingale Factor</label>
            <input 
              type="number" 
              defaultValue="2.1" 
              className="w-full bg-gray-950 p-2 text-sm rounded border border-gray-800 font-mono text-gray-400 cursor-not-allowed" 
              disabled 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-[10px] text-gray-500 font-bold block mb-1 uppercase tracking-wider">Target Profit</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400 text-sm font-bold">$</span>
              <input 
                type="number" 
                defaultValue="10.00" 
                className="w-full bg-gray-950 pl-7 pr-3 py-2 text-sm rounded border border-gray-800 font-mono text-gray-400 cursor-not-allowed" 
                disabled 
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 font-bold block mb-1 uppercase tracking-wider">Stop Loss Cap</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400 text-sm font-bold">$</span>
              <input 
                type="number" 
                defaultValue="15.00" 
                className="w-full bg-gray-950 pl-7 pr-3 py-2 text-sm rounded border border-gray-800 font-mono text-gray-400 cursor-not-allowed" 
                disabled 
              />
            </div>
          </div>
        </div>

        {/* MASTER EXECUTION TRIGGER */}
        <button 
          onClick={() => setIsBotRunning(!isBotRunning)} 
          className={`w-full py-3.5 rounded-lg font-black text-xs uppercase tracking-widest transition duration-150 shadow-lg ${
            isBotRunning 
              ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 shadow-red-900/20' 
              : 'bg-gradient-to-r from-green-400 to-emerald-500 text-black hover:from-green-500 hover:to-emerald-600 shadow-green-900/10'
          }`}>
          {isBotRunning ? '🚨 HALT AUTOMATIC PRINTER CORE' : '⚡ INITIALIZE HIGH-SPEED SCANNER'}
        </button>
      </div>
    </>
  );
}