/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Zap, Clock, Calendar, Play, FastForward, RotateCcw, 
  Info, CheckCircle2, BarChart3, PieChart as PieChartIcon, 
  HelpCircle, ChevronRight, Wind, Lightbulb, Refrigerator, Coffee, Snowflake
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Constants & Data ---

interface Option {
  id: string;
  label: string;
  isCorrect: boolean;
  impact: number; // Percentage change in consumption
}

interface Appliance {
  id: string;
  name: string;
  icon: React.ReactNode;
  dailyHours: number;
  baseWattage: number; // in Watts
  options: Option[];
  color: string;
}

const APPLIANCES: Appliance[] = [
  {
    id: 'ac',
    name: '冷氣',
    icon: <Snowflake className="w-6 h-6" />,
    dailyHours: 3,
    baseWattage: 1000,
    color: '#3b82f6',
    options: [
      { id: 'ac-1', label: '溫度設定在26-28度並搭配風扇', isCorrect: true, impact: -0.15 },
      { id: 'ac-3', label: '選購大坪數專用的冷氣較快冷', isCorrect: false, impact: 0.15 },
      { id: 'ac-4', label: '短暫出門1小時不關冷氣較省電', isCorrect: false, impact: 0.1 },
      { id: 'ac-2', label: '定期清洗濾網', isCorrect: true, impact: -0.1 },
      { id: 'ac-5', label: '全天開啟舒眠模式最省電', isCorrect: false, impact: 0.05 },
      { id: 'ac-6', label: '冷氣溫度設定越低越好', isCorrect: false, impact: 0.3 },
    ]
  },
  {
    id: 'fan',
    name: '風扇',
    icon: <Wind className="w-6 h-6" />,
    dailyHours: 14,
    baseWattage: 50,
    color: '#10b981',
    options: [
      { id: 'fan-1', label: '配合冷氣使用，增加空氣對流', isCorrect: true, impact: -0.1 },
      { id: 'fan-3', label: '風扇對著牆壁吹可以降溫', isCorrect: false, impact: 0.05 },
      { id: 'fan-4', label: '放在窗戶旁往室內吹最新鮮', isCorrect: false, impact: 0.05 },
      { id: 'fan-2', label: '選用DC直流變頻風扇', isCorrect: true, impact: -0.3 },
      { id: 'fan-5', label: '選購葉片數最多的風扇最省電', isCorrect: false, impact: 0.05 },
      { id: 'fan-6', label: '24小時不間斷運轉', isCorrect: false, impact: 0.2 },
    ]
  },
  {
    id: 'light',
    name: '電燈',
    icon: <Lightbulb className="w-6 h-6" />,
    dailyHours: 14,
    baseWattage: 100,
    color: '#f59e0b',
    options: [
      { id: 'light-1', label: '全面更換為LED燈具', isCorrect: true, impact: -0.5 },
      { id: 'light-3', label: '使用「護眼」燈泡比較省電', isCorrect: false, impact: 0.05 },
      { id: 'light-4', label: '每天擦拭燈管可以增加亮度省電', isCorrect: false, impact: 0.02 },
      { id: 'light-2', label: '養成隨手關燈的好習慣', isCorrect: true, impact: -0.2 },
      { id: 'light-5', label: '使用黃色暖光燈泡較省電', isCorrect: false, impact: 0.03 },
      { id: 'light-6', label: '燈開著可以防偷，所以不關', isCorrect: false, impact: 0.3 },
    ]
  },
  {
    id: 'kettle',
    name: '熱水瓶',
    icon: <Coffee className="w-6 h-6" />,
    dailyHours: 1,
    baseWattage: 1500,
    color: '#ef4444',
    options: [
      { id: 'kettle-1', label: '使用快煮壺搭配保溫瓶', isCorrect: true, impact: -0.6 },
      { id: 'kettle-3', label: '水裝全滿省去加水次數', isCorrect: false, impact: 0.1 },
      { id: 'kettle-4', label: '買超大容量熱水瓶備用', isCorrect: false, impact: 0.15 },
      { id: 'kettle-2', label: '善用定時節電功能', isCorrect: true, impact: -0.2 },
      { id: 'kettle-5', label: '維持在80度低溫模式最省電', isCorrect: false, impact: 0.1 },
      { id: 'kettle-6', label: '24小時維持在98度高溫', isCorrect: false, impact: 0.4 },
    ]
  },
  {
    id: 'fridge',
    name: '冰箱',
    icon: <Refrigerator className="w-6 h-6" />,
    dailyHours: 24,
    baseWattage: 200,
    color: '#8b5cf6',
    options: [
      { id: 'fridge-1', label: '食物裝八分滿，保持冷氣流通', isCorrect: true, impact: -0.1 },
      { id: 'fridge-3', label: '冰箱內放大量冰塊可以保冷', isCorrect: false, impact: 0.1 },
      { id: 'fridge-4', label: '冰箱頂部放置雜物節省空間', isCorrect: false, impact: 0.05 },
      { id: 'fridge-2', label: '減少開門次數與時間', isCorrect: true, impact: -0.15 },
      { id: 'fridge-5', label: '加裝冰箱內透明塑膠簾', isCorrect: false, impact: 0.05 },
      { id: 'fridge-6', label: '冰箱靠牆放，完全不留縫隙', isCorrect: false, impact: 0.15 },
    ]
  }
];

const COLORS = APPLIANCES.map(a => a.color);

// --- Components ---

export default function App() {
  const [gameState, setGameState] = useState<'intro' | 'simulating' | 'finished'>('intro');
  const [currentDate, setCurrentDate] = useState(new Date(2024, 5, 1, 0, 0)); // June 1st
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [simulationData, setSimulationData] = useState<any[]>([]);
  const [accumulatedStats, setAccumulatedStats] = useState<Record<string, { hours: number; kwh: number }>>(
    Object.fromEntries(APPLIANCES.map(a => [a.id, { hours: 0, kwh: 0 }]))
  );
  const [isFastForward, setIsFastForward] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [activeTab, setActiveTab] = useState<'bar' | 'pie'>('bar');
  const [visibleAppliances, setVisibleAppliances] = useState<Record<string, boolean>>(
    Object.fromEntries(APPLIANCES.map(a => [a.id, true]))
  );

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalKwh = useMemo(() => {
    return (Object.values(accumulatedStats) as { hours: number; kwh: number }[]).reduce((sum, stat) => sum + stat.kwh, 0);
  }, [accumulatedStats]);

  const toggleOption = (applianceId: string, optionId: string) => {
    setSelectedOptions(prev => {
      const current = prev[applianceId] || [];
      if (current.includes(optionId)) {
        return { ...prev, [applianceId]: current.filter(id => id !== optionId) };
      } else {
        if (current.length >= 2) return prev; // Limit to 2 per appliance
        return { ...prev, [applianceId]: [...current, optionId] };
      }
    });
  };

  const startSimulation = () => {
    setGameState('simulating');
    setCurrentDate(new Date(2024, 5, 1, 0, 0));
    setAccumulatedStats(Object.fromEntries(APPLIANCES.map(a => [a.id, { hours: 0, kwh: 0 }])));
    setSimulationData([]);
  };

  const resetSimulation = () => {
    setGameState('intro');
    setIsFastForward(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (gameState === 'simulating') {
      const interval = isFastForward ? 100 : 800;
      timerRef.current = setInterval(() => {
        setCurrentDate(prev => {
          const next = new Date(prev.getTime() + 12 * 60 * 60 * 1000); // Progress 12 hours (half day)
          
          if (next.getMonth() > 5 || (next.getMonth() === 5 && next.getDate() > 30)) {
            setGameState('finished');
            if (timerRef.current) clearInterval(timerRef.current);
            return prev;
          }

          // Calculate consumption for the half day (12 hours)
          const newStats = { ...accumulatedStats };
          const dailyData: any = { date: `${next.getMonth() + 1}/${next.getDate()} ${next.getHours() === 0 ? 'AM' : 'PM'}` };

          APPLIANCES.forEach(app => {
            // Base consumption for 12 hours
            // dailyHours is per 24h, so for 12h it's dailyHours / 2
            const hoursInPeriod = app.dailyHours / 2;
            let multiplier = 1;

            const selectedIds = selectedOptions[app.id] || [];
            selectedIds.forEach(optId => {
              const opt = app.options.find(o => o.id === optId);
              if (opt) multiplier += opt.impact;
            });

            const kwhInPeriod = (app.baseWattage / 1000) * hoursInPeriod * multiplier;
            
            newStats[app.id] = {
              hours: newStats[app.id].hours + hoursInPeriod,
              kwh: newStats[app.id].kwh + kwhInPeriod
            };
            dailyData[app.id] = kwhInPeriod;
          });

          setAccumulatedStats(newStats);
          setSimulationData(prevData => [...prevData, dailyData]);
          
          return next;
        });
      }, interval);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, isFastForward, selectedOptions, accumulatedStats]);

  const pieData = useMemo(() => {
    return APPLIANCES.map(app => ({
      name: app.name,
      value: accumulatedStats[app.id].kwh,
      color: app.color,
      angle: totalKwh > 0 ? (accumulatedStats[app.id].kwh / totalKwh) * 360 : 0
    }));
  }, [accumulatedStats, totalKwh]);

  const barData = useMemo(() => {
    return APPLIANCES.map(app => ({
      name: app.name,
      kwh: accumulatedStats[app.id].kwh,
      color: app.color
    }));
  }, [accumulatedStats]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">節能挑戰賽</h1>
              <p className="text-slate-500 font-medium">智慧用電對決 ~ 六月電力模擬</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowInstructions(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Info className="w-5 h-5 text-blue-500" />
              <span className="font-semibold">操作說明</span>
            </button>
            {gameState !== 'intro' && (
              <button 
                onClick={resetSimulation}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors shadow-md"
              >
                <RotateCcw className="w-5 h-5" />
                <span className="font-semibold">重新開始</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main>
          {gameState === 'intro' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Zap className="w-6 h-6 text-yellow-500" />
                    第一步：設定節能策略
                  </h2>
                  <p className="text-slate-600 mb-6">
                    請為每個電器勾選正確的節能選項（每個電器最多選 2 項）。正確的選項將減少耗電量，錯誤或似是而非的選項則會增加耗電量。
                  </p>

                  <div className="space-y-8">
                    {APPLIANCES.map(app => (
                      <div key={app.id} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: `${app.color}20`, color: app.color }}>
                            {app.icon}
                          </div>
                          <h3 className="font-bold text-lg">{app.name}</h3>
                          <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-500">
                            每日運轉 {app.dailyHours} 小時 | 已選 {(selectedOptions[app.id] || []).length}/2
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {app.options.map(opt => (
                            <button
                              key={opt.id}
                              onClick={() => toggleOption(app.id, opt.id)}
                              className={cn(
                                "text-left p-3 rounded-xl border transition-all text-sm flex items-start gap-3",
                                (selectedOptions[app.id] || []).includes(opt.id)
                                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                                  : "border-slate-200 hover:border-slate-300 bg-white"
                              )}
                            >
                              <div className={cn(
                                "w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center mt-0.5",
                                (selectedOptions[app.id] || []).includes(opt.id)
                                  ? "bg-blue-500 border-blue-500"
                                  : "bg-white border-slate-300"
                              )}>
                                {(selectedOptions[app.id] || []).includes(opt.id) && <CheckCircle2 className="w-4 h-4 text-white" />}
                              </div>
                              <span className={cn(
                                "font-medium",
                                (selectedOptions[app.id] || []).includes(opt.id) ? "text-blue-700" : "text-slate-600"
                              )}>
                                {opt.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-600 p-8 rounded-3xl text-white shadow-xl shadow-blue-200 sticky top-8">
                  <h2 className="text-2xl font-bold mb-4">準備好了嗎？</h2>
                  <p className="text-blue-100 mb-8 leading-relaxed">
                    完成所有電器的節能設定後，點擊下方按鈕開始模擬六月份的用電情況。看看你的策略能節省多少電力！
                  </p>
                  
                  <button 
                    onClick={startSimulation}
                    className="w-full py-4 bg-white text-blue-600 rounded-2xl font-bold text-xl shadow-lg hover:bg-blue-50 transition-all flex items-center justify-center gap-3 group"
                  >
                    <Play className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" />
                    開始模擬
                  </button>

                  <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-3 text-blue-100 text-sm">
                      <Calendar className="w-5 h-5" />
                      <span>模擬期間：6月1日 ~ 6月30日</span>
                    </div>
                    <div className="flex items-center gap-3 text-blue-100 text-sm">
                      <Clock className="w-5 h-5" />
                      <span>模擬步進：每 12 小時一次</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {gameState === 'simulating' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Simulation Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
                  <Calendar className="w-8 h-8 text-blue-500 mb-2" />
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">當前日期</p>
                  <p className="text-3xl font-black text-slate-800">
                    {currentDate.getMonth() + 1}月{currentDate.getDate()}日
                  </p>
                  <p className="text-lg font-bold text-blue-600">
                    {currentDate.getHours() === 0 ? '上午 00:00' : '下午 12:00'}
                  </p>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
                  <Zap className="w-8 h-8 text-yellow-500 mb-2" />
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">總累計耗電量</p>
                  <p className="text-4xl font-black text-slate-800">
                    {totalKwh.toFixed(2)} <span className="text-xl font-bold text-slate-400">度</span>
                  </p>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center items-center gap-4">
                  <button 
                    onClick={() => setIsFastForward(!isFastForward)}
                    className={cn(
                      "w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md",
                      isFastForward ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    <FastForward className={cn("w-6 h-6", isFastForward && "animate-pulse")} />
                    {isFastForward ? "快進中..." : "時間快進"}
                  </button>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${(currentDate.getDate() / 30) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs font-bold text-slate-400">模擬進度: {Math.floor((currentDate.getDate() / 30) * 100)}%</p>
                </div>
              </div>

              {/* Live Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {APPLIANCES.map(app => (
                  <div key={app.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: `${app.color}20`, color: app.color }}>
                        {app.icon}
                      </div>
                      <h3 className="font-bold">{app.name}</h3>
                    </div>
                    <div className="space-y-2 mt-2">
                      <div className="flex justify-between items-end">
                        <span className="text-xs text-slate-400 font-bold uppercase">運作時間</span>
                        <span className="font-bold text-slate-700">{accumulatedStats[app.id].hours.toFixed(1)} <span className="text-[10px]">hr</span></span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-xs text-slate-400 font-bold uppercase">耗電量</span>
                        <span className="font-bold text-slate-700">{accumulatedStats[app.id].kwh.toFixed(2)} <span className="text-[10px]">度</span></span>
                      </div>
                    </div>
                    <div className="mt-auto pt-3 border-t border-slate-50">
                      <div className="flex flex-wrap gap-1">
                        {(selectedOptions[app.id] || []).map(optId => (
                          <div key={optId} className="w-2 h-2 rounded-full bg-blue-500" />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {gameState === 'finished' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              {/* Summary Header */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                    <h2 className="text-3xl font-black mb-2">模擬完成！</h2>
                    <p className="text-blue-100 text-lg">六月份總計耗電量：<span className="text-white font-bold text-2xl">{totalKwh.toFixed(2)}</span> 度</p>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={resetSimulation}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl font-bold transition-all backdrop-blur-sm flex items-center gap-2"
                    >
                      <RotateCcw className="w-5 h-5" />
                      重新挑戰
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabs for Charts */}
              <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex gap-2 w-fit mx-auto">
                <button 
                  onClick={() => setActiveTab('bar')}
                  className={cn(
                    "px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all",
                    activeTab === 'bar' ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
                  )}
                >
                  <BarChart3 className="w-5 h-5" />
                  長條圖
                </button>
                <button 
                  onClick={() => setActiveTab('pie')}
                  className={cn(
                    "px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all",
                    activeTab === 'pie' ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
                  )}
                >
                  <PieChartIcon className="w-5 h-5" />
                  圓形圖
                </button>
              </div>

              {/* Chart Display */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[500px] flex flex-col">
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                  {APPLIANCES.map(app => (
                    <button
                      key={app.id}
                      onClick={() => setVisibleAppliances(prev => ({ ...prev, [app.id]: !prev[app.id] }))}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all border",
                        visibleAppliances[app.id] 
                          ? "bg-white border-slate-200 shadow-sm" 
                          : "bg-slate-50 border-transparent text-slate-300 opacity-50"
                      )}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: app.color }} />
                      {app.name}
                    </button>
                  ))}
                </div>

                <div className="flex-grow">
                  {activeTab === 'bar' && (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={barData.filter(d => visibleAppliances[APPLIANCES.find(a => a.name === d.name)?.id || ''])}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" />
                        <YAxis label={{ value: '耗電量 (度)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="kwh" radius={[8, 8, 0, 0]}>
                          {barData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}

                  {activeTab === 'pie' && (
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                      <div className="w-full h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData.filter(d => visibleAppliances[APPLIANCES.find(a => a.name === d.name)?.id || ''])}
                              cx="50%"
                              cy="50%"
                              innerRadius={80}
                              outerRadius={140}
                              paddingAngle={5}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100">
                                      <p className="font-bold text-slate-800 mb-1">{data.name}</p>
                                      <p className="text-blue-600 font-bold">{data.value.toFixed(2)} 度</p>
                                      <div className="mt-2 pt-2 border-t border-slate-50 text-xs text-slate-500 space-y-1">
                                        <p>佔比: {((data.value / totalKwh) * 100).toFixed(1)}%</p>
                                        <p>圓心角: {data.angle.toFixed(1)}°</p>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-bold text-slate-400 uppercase text-xs tracking-widest">電力結構分析</h4>
                        {pieData.filter(d => visibleAppliances[APPLIANCES.find(a => a.name === d.name)?.id || '']).map((item, i) => (
                          <div key={i} className="flex items-center gap-4">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                            <div className="flex-grow">
                              <p className="font-bold text-slate-700">{item.name}</p>
                              <div className="w-48 bg-slate-100 h-2 rounded-full mt-1 overflow-hidden">
                                <div 
                                  className="h-full" 
                                  style={{ backgroundColor: item.color, width: `${(item.value / totalKwh) * 100}%` }} 
                                />
                              </div>
                            </div>
                            <span className="font-black text-slate-400">{((item.value / totalKwh) * 100).toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Reflection Section */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <HelpCircle className="w-7 h-7 text-indigo-500" />
                  結果與反思
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <ChevronRight className="w-5 h-5 text-indigo-500" />
                        節能成效分析
                      </h4>
                      <p className="text-slate-600 leading-relaxed">
                        觀察圖表，哪一個電器的耗電量最高？這和你預期的結果一樣嗎？
                        你所選擇的節能選項中，哪一項對降低總耗電量的貢獻最大？
                      </p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <ChevronRight className="w-5 h-5 text-indigo-500" />
                        生活實踐
                      </h4>
                      <p className="text-slate-600 leading-relaxed">
                        在現實生活中，你是否也能落實這些節能行為？
                        除了模擬中的五個電器，家裡還有哪些電器是「隱形耗電王」？
                      </p>
                    </div>
                  </div>
                  <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                    <h4 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                      <Zap className="w-6 h-6" />
                      智慧用電小撇步
                    </h4>
                    <ul className="space-y-4 text-indigo-800">
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-indigo-200 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
                        <span>選購具有「節能標章」或「能源效率1級」的電器。</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-indigo-200 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
                        <span>長時間不使用的電器，應拔掉插頭或關閉排插電源。</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-indigo-200 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
                        <span>夏季尖峰用電時段，盡量減少使用高耗能電器。</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-slate-200 text-center text-slate-400 text-sm pb-8">
          <p>© 2024 節能挑戰賽 ~ 智慧用電對決 | 數位教具</p>
        </footer>
      </div>

      {/* Instructions Modal */}
      <AnimatePresence>
        {showInstructions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInstructions(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Info className="w-6 h-6" />
                  操作說明與耗電計算
                </h2>
                <button 
                  onClick={() => setShowInstructions(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <RotateCcw className="w-6 h-6 rotate-45" />
                </button>
              </div>
              <div className="p-8 max-h-[70vh] overflow-y-auto space-y-8">
                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 border-l-4 border-blue-500 pl-3">耗電量計算說明</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-left">
                          <th className="p-3 font-bold">電器名稱</th>
                          <th className="p-3 font-bold">每日開機</th>
                          <th className="p-3 font-bold">半天基本耗電</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {APPLIANCES.map(app => (
                          <tr key={app.id}>
                            <td className="p-3 font-bold text-slate-700">{app.name}</td>
                            <td className="p-3 text-slate-600">{app.dailyHours} 小時</td>
                            <td className="p-3 text-slate-600">{((app.baseWattage / 1000) * (app.dailyHours / 2)).toFixed(2)} 度</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 border-l-4 border-blue-500 pl-3">操作步驟</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex gap-4 items-start">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">1</div>
                      <div>
                        <p className="font-bold text-slate-800">完成節電設定</p>
                        <p className="text-sm text-slate-500">在首頁為五個電器勾選你認為正確的節能選項。</p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">2</div>
                      <div>
                        <p className="font-bold text-slate-800">開始模擬</p>
                        <p className="text-sm text-slate-500">點擊「開始模擬」，系統會模擬 6/1 至 6/30 的用電情況。</p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">3</div>
                      <div>
                        <p className="font-bold text-slate-800">觀察數據</p>
                        <p className="text-sm text-slate-500">模擬過程中可查看總電表、各電器累計時間與耗電量。</p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">4</div>
                      <div>
                        <p className="font-bold text-slate-800">分析結果</p>
                        <p className="text-sm text-slate-500">結束後透過長條圖與圓形圖分析節能成效。</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setShowInstructions(false)}
                  className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all"
                >
                  我了解了
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
