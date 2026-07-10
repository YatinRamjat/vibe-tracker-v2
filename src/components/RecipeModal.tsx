"use client";

import { useState, useEffect } from "react";
import { GlobalFoodCache, supabase } from "@/lib/supabase";

type RecipeModalProps = {
  foodData: GlobalFoodCache | null;
  onClose: () => void;
  selectedDate: string;
  onLogSaved: () => void;
};

export default function RecipeModal({ foodData, onClose, selectedDate, onLogSaved }: RecipeModalProps) {
  const [editedData, setEditedData] = useState<GlobalFoodCache | null>(null);
  const [oilAdded, setOilAdded] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (foodData) {
      setTimeout(() => {
        setEditedData(JSON.parse(JSON.stringify(foodData))); // Deep copy
        setOilAdded(0);
      }, 0);
    }
  }, [foodData]);

  if (!foodData || !editedData) return null;

  const handleInputChange = (field: keyof GlobalFoodCache, value: string) => {
    setEditedData((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: parseFloat(value) || 0 };
    });
  };

  const handleIngredientChange = (index: number, field: string, value: string) => {
    setEditedData((prev) => {
      if (!prev || !prev.ingredients) return prev;
      const newIngredients = [...prev.ingredients];
      newIngredients[index] = {
        ...newIngredients[index],
        [field]: field === 'name' ? value : (parseFloat(value) || 0)
      };
      return { ...prev, ingredients: newIngredients };
    });
  };

  const handleLogToDiary = async () => {
    setIsSaving(true);
    try {
      const finalCalories = editedData.total_calories + (oilAdded * 9);
      const finalFat = editedData.total_fat + oilAdded;

      const { error } = await supabase.from("user_food_logs").insert({
        log_date: selectedDate,
        food_name: editedData.name,
        total_calories: finalCalories,
        total_protein: editedData.total_protein,
        total_carbs: editedData.total_carbs,
        total_fat: finalFat,
        fiber: editedData.fiber,
        sodium: editedData.sodium,
        potassium: editedData.potassium,
        calcium: editedData.calcium,
        iron: editedData.iron,
        oil_added_grams: oilAdded,
      });

      if (error) throw error;
      onLogSaved();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to log to diary.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveToLibrary = async () => {
    setIsSaving(true);
    try {
      // Upsert by name as identifier for simplicity or id if exists
      const { error } = await supabase
        .from("global_food_cache")
        .upsert({
          id: editedData.id, // Will update if id exists
          name: editedData.name,
          is_complex_dish: editedData.is_complex_dish,
          total_calories: editedData.total_calories,
          total_protein: editedData.total_protein,
          total_carbs: editedData.total_carbs,
          total_fat: editedData.total_fat,
          fiber: editedData.fiber,
          sodium: editedData.sodium,
          potassium: editedData.potassium,
          calcium: editedData.calcium,
          iron: editedData.iron,
          ingredients: editedData.ingredients
        }, { onConflict: 'name' }); // Assuming name is unique, or just rely on Supabase upsert rules

      if (error) throw error;
      alert("Product saved to library.");
    } catch (err) {
      console.error(err);
      alert("Failed to save to library.");
    } finally {
      setIsSaving(false);
    }
  };

  // Derived values including oil
  const displayCalories = editedData.total_calories + (oilAdded * 9);
  const displayFat = editedData.total_fat + oilAdded;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 transition-opacity p-2 sm:p-0">
      <div className="w-full max-w-lg bg-slate-950 rounded-t-3xl sm:rounded-3xl sm:mb-8 border border-emerald-500/20 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden slide-up-animation">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <input
            type="text"
            value={editedData.name}
            onChange={(e) => setEditedData({...editedData, name: e.target.value})}
            className="text-xl font-bold text-white bg-transparent border-none focus:outline-none w-full"
          />
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors ml-4 shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">

          {/* Main Macros */}
          <div>
            <h3 className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-4">Total Macros</h3>
            <div className="grid grid-cols-4 gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50">
              <EditableStat label="Calories" value={displayCalories} isDerived />
              <EditableStat label="Protein" value={editedData.total_protein} onChange={(v) => handleInputChange('total_protein', v)} unit="g" />
              <EditableStat label="Carbs" value={editedData.total_carbs} onChange={(v) => handleInputChange('total_carbs', v)} unit="g" />
              <EditableStat label="Fat" value={displayFat} isDerived unit="g" />
            </div>

            <div className="mt-4 grid grid-cols-5 gap-2 px-2">
              <EditableMicro label="Fiber" value={editedData.fiber} onChange={(v) => handleInputChange('fiber', v)} />
              <EditableMicro label="Sodium" value={editedData.sodium} onChange={(v) => handleInputChange('sodium', v)} />
              <EditableMicro label="Pot" value={editedData.potassium} onChange={(v) => handleInputChange('potassium', v)} />
              <EditableMicro label="Calc" value={editedData.calcium} onChange={(v) => handleInputChange('calcium', v)} />
              <EditableMicro label="Iron" value={editedData.iron} onChange={(v) => handleInputChange('iron', v)} />
            </div>
          </div>

          {/* Oil Slider */}
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-medium text-slate-300">Added Cooking Oil / Ghee</label>
              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full text-sm">
                {oilAdded}g
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              value={oilAdded}
              onChange={(e) => setOilAdded(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span>0g</span>
              <span>+{(oilAdded * 9)} kcal / +{oilAdded}g fat</span>
              <span>30g</span>
            </div>
          </div>

          {/* Ingredients */}
          {editedData.ingredients && editedData.ingredients.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-4">Raw Ingredients</h3>
              <div className="space-y-2">
                {editedData.ingredients.map((ing: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <input
                      type="text"
                      value={ing.name}
                      onChange={(e) => handleIngredientChange(i, 'name', e.target.value)}
                      className="flex-1 bg-transparent text-sm text-white focus:outline-none focus:text-emerald-400"
                    />
                    <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                      <input
                        type="number"
                        value={ing.weightGrams}
                        onChange={(e) => handleIngredientChange(i, 'weightGrams', e.target.value)}
                        className="w-12 text-right bg-transparent text-sm text-slate-300 focus:outline-none focus:text-white appearance-none"
                      />
                      <span className="text-xs text-slate-500">g</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 backdrop-blur flex flex-col gap-3">
          <button
            onClick={handleLogToDiary}
            disabled={isSaving}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3.5 px-4 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Log to Diary"}
          </button>
          <button
            onClick={handleSaveToLibrary}
            disabled={isSaving}
            className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium py-3 px-4 rounded-xl border border-slate-800 transition-colors disabled:opacity-50"
          >
            Save Product to Library
          </button>
        </div>
      </div>
    </div>
  );
}

function EditableStat({ label, value, onChange, unit = "", isDerived = false }: { label: string, value: number, onChange?: (v: string) => void, unit?: string, isDerived?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">{label}</div>
      <div className="flex items-baseline">
        {isDerived ? (
          <span className="text-xl font-bold text-white">{Math.round(value)}</span>
        ) : (
          <input
            type="number"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-12 text-center text-xl font-bold text-white bg-transparent border-b border-transparent focus:border-emerald-500 focus:outline-none appearance-none"
          />
        )}
        <span className="text-xs text-slate-500 ml-0.5">{unit}</span>
      </div>
    </div>
  );
}

function EditableMicro({ label, value, onChange }: { label: string, value: number, onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col items-center bg-slate-900/50 p-2 rounded-lg border border-slate-800/50">
      <div className="text-[9px] text-slate-500 uppercase truncate w-full text-center">{label}</div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-center text-xs font-medium text-slate-300 bg-transparent border-none focus:outline-none focus:text-white appearance-none mt-1"
      />
    </div>
  );
}
