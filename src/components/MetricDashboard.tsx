"use client";

import { UserProfile, UserFoodLog } from "@/lib/supabase";
import { useState } from "react";

type MetricDashboardProps = {
  selectedDate: string;
  onDateChange: (date: string) => void;
  userProfile: UserProfile | null;
  foodLogs: UserFoodLog[];
  onOpenSettings: () => void;
};

export default function MetricDashboard({
  selectedDate,
  onDateChange,
  userProfile,
  foodLogs,
  onOpenSettings,
}: MetricDashboardProps) {
  const [showMicros, setShowMicros] = useState(false);

  // Calculate Totals
  const totals = foodLogs.reduce(
    (acc, log) => {
      acc.calories += log.total_calories;
      acc.protein += log.total_protein;
      acc.carbs += log.total_carbs;
      acc.fat += log.total_fat;
      acc.fiber += log.fiber;
      acc.sodium += log.sodium;
      acc.potassium += log.potassium;
      acc.calcium += log.calcium;
      acc.iron += log.iron;
      return acc;
    },
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sodium: 0,
      potassium: 0,
      calcium: 0,
      iron: 0,
    }
  );

  const calTarget = userProfile?.calorie_target || 2000;
  const remainingCals = calTarget - totals.calories;
  const calPercent = Math.min((totals.calories / calTarget) * 100, 100);

  // Date Logic
  const currentDate = new Date(selectedDate);
  const handlePrevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    onDateChange(prev.toISOString().split("T")[0]);
  };
  const handleNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    onDateChange(next.toISOString().split("T")[0]);
  };
  const handleToday = () => {
    onDateChange(new Date().toISOString().split("T")[0]);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Date Selector */}
      <div className="flex items-center justify-between bg-slate-900 rounded-full px-4 py-2 border border-slate-800">
        <button onClick={handlePrevDay} className="text-slate-400 hover:text-emerald-500 font-bold px-2">&lt;</button>
        <div className="flex gap-4 text-sm font-medium">
          <button onClick={handleToday} className="text-white hover:text-emerald-500">Today</button>
          <span className="text-emerald-500">{selectedDate}</span>
        </div>
        <button onClick={handleNextDay} className="text-slate-400 hover:text-emerald-500 font-bold px-2">&gt;</button>
      </div>

      {/* Main Radial Display */}
      <div className="relative flex justify-center items-center py-6">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              className="text-slate-800 stroke-current"
              strokeWidth="6"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
            ></circle>
            <circle
              className="text-emerald-500 stroke-current transition-all duration-1000 ease-in-out"
              strokeWidth="6"
              strokeLinecap="round"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              strokeDasharray="251.2"
              strokeDashoffset={251.2 - (251.2 * calPercent) / 100}
            ></circle>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-white">{Math.round(remainingCals)}</span>
            <span className="text-xs text-slate-400 mt-1">Remaining</span>
          </div>
        </div>
        <button
          onClick={onOpenSettings}
          className="absolute top-0 right-0 p-2 text-slate-400 hover:text-emerald-500 transition-colors"
          title="Goal Settings"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      <div className="flex justify-between text-center px-8 text-sm">
        <div>
          <div className="text-slate-400">Target</div>
          <div className="text-white font-medium">{calTarget}</div>
        </div>
        <div className="text-slate-600">-</div>
        <div>
          <div className="text-slate-400">Food</div>
          <div className="text-emerald-500 font-medium">{Math.round(totals.calories)}</div>
        </div>
      </div>

      {/* Macros */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <MacroProgress label="Protein" current={totals.protein} target={userProfile?.protein_target || 150} unit="g" />
        <MacroProgress label="Carbs" current={totals.carbs} target={userProfile?.carbs_target || 200} unit="g" />
        <MacroProgress label="Fat" current={totals.fat} target={userProfile?.fat_target || 65} unit="g" />
      </div>

      {/* Micros */}
      <div className="pt-2">
        <button
          onClick={() => setShowMicros(!showMicros)}
          className="w-full flex items-center justify-between text-sm text-slate-400 hover:text-white py-2"
        >
          <span>Micronutrients</span>
          <span>{showMicros ? "▲" : "▼"}</span>
        </button>

        {showMicros && (
          <div className="space-y-3 mt-2 pl-2 border-l-2 border-slate-800">
            <MacroProgress label="Fiber" current={totals.fiber} target={userProfile?.fiber_target || 30} unit="g" isMicro />
            <MacroProgress label="Sodium" current={totals.sodium} target={userProfile?.sodium_target || 2300} unit="mg" isMicro />
            <MacroProgress label="Potassium" current={totals.potassium} target={userProfile?.potassium_target || 3400} unit="mg" isMicro />
            <MacroProgress label="Calcium" current={totals.calcium} target={userProfile?.calcium_target || 1000} unit="mg" isMicro />
            <MacroProgress label="Iron" current={totals.iron} target={userProfile?.iron_target || 18} unit="mg" isMicro />
          </div>
        )}
      </div>
    </div>
  );
}

function MacroProgress({ label, current, target, unit, isMicro = false }: { label: string, current: number, target: number, unit: string, isMicro?: boolean }) {
  const percent = Math.min((current / target) * 100, 100) || 0;

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-300 font-medium">{label}</span>
        <span className="text-slate-400">
          <span className="text-white">{Math.round(current)}</span> / {target}{unit}
        </span>
      </div>
      <div className={`w-full bg-slate-800 rounded-full ${isMicro ? 'h-1.5' : 'h-2'}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${isMicro ? 'bg-slate-500' : 'bg-emerald-500'}`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
}
