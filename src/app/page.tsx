"use client";

import { useState, useEffect } from "react";
import { supabase, UserProfile, UserFoodLog, GlobalFoodCache } from "@/lib/supabase";
import MetricDashboard from "@/components/MetricDashboard";
import GoalSettingsSheet from "@/components/GoalSettingsSheet";
import InputCapture from "@/components/InputCapture";
import RecipeModal from "@/components/RecipeModal";

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [foodLogs, setFoodLogs] = useState<UserFoodLog[]>([]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<GlobalFoodCache | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial profile
  useEffect(() => {
    async function fetchProfile() {
      const { data } = await supabase.from("user_profile").select("*").eq("id", 1).single();
      if (data) {
        setUserProfile(data as UserProfile);
      } else {
        // Fallback defaults if db is empty for preview
        setUserProfile({
          id: 1,
          calorie_target: 2000,
          protein_target: 150,
          carbs_target: 200,
          fat_target: 65,
          fiber_target: 30,
          sodium_target: 2300,
          potassium_target: 3400,
          calcium_target: 1000,
          iron_target: 18,
        });
      }
    }
    fetchProfile();
  }, []);

  // Fetch logs based on date
  useEffect(() => {
    async function fetchLogs() {
      setIsLoading(true);
      const { data } = await supabase
        .from("user_food_logs")
        .select("*")
        .eq("log_date", selectedDate);

      if (data) {
        setFoodLogs(data as UserFoodLog[]);
      } else {
        setFoodLogs([]);
      }
      setIsLoading(false);
    }
    fetchLogs();
  }, [selectedDate]);

  const refreshLogs = async () => {
    const { data } = await supabase
      .from("user_food_logs")
      .select("*")
      .eq("log_date", selectedDate);
    if (data) setFoodLogs(data as UserFoodLog[]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-emerald-500/30 pb-32">
      <main className="max-w-md mx-auto p-4 sm:p-6 space-y-8">

        {/* Top Dashboard */}
        <MetricDashboard
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          userProfile={userProfile}
          foodLogs={foodLogs}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Logged Foods List for current day */}
        <div className="space-y-3 mt-8">
          <h2 className="text-sm font-semibold text-slate-400 px-2">Logged Today</h2>
          {isLoading ? (
            <div className="text-center text-slate-500 text-sm py-4">Loading logs...</div>
          ) : foodLogs.length === 0 ? (
            <div className="text-center text-slate-600 text-sm py-8 bg-slate-900/50 rounded-2xl border border-slate-800/50">
              No food logged yet. Search or scan below!
            </div>
          ) : (
            foodLogs.map((log, i) => (
              <div key={log.id || i} className="flex justify-between items-center p-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-sm">
                <div>
                  <div className="font-medium text-slate-200">{log.food_name}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {log.total_protein}g P • {log.total_carbs}g C • {log.total_fat}g F
                    {log.oil_added_grams > 0 && <span className="text-emerald-500 ml-1">(+{log.oil_added_grams}g oil)</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-400 font-bold">{Math.round(log.total_calories)}</div>
                  <div className="text-[10px] text-slate-500 uppercase">kcal</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Floating Input */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pb-8">
          <InputCapture onFoodFound={setSelectedFood} />
        </div>

      </main>

      {/* Overlays */}
      <GoalSettingsSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userProfile={userProfile}
        onProfileUpdate={setUserProfile}
      />

      {selectedFood && (
        <RecipeModal
          foodData={selectedFood}
          onClose={() => setSelectedFood(null)}
          selectedDate={selectedDate}
          onLogSaved={refreshLogs}
        />
      )}
    </div>
  );
}
