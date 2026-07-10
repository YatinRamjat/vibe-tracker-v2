"use client";

import { useState, useEffect } from "react";
import { supabase, UserProfile } from "@/lib/supabase";

type GoalSettingsSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onProfileUpdate: (profile: UserProfile) => void;
};

export default function GoalSettingsSheet({
  isOpen,
  onClose,
  userProfile,
  onProfileUpdate,
}: GoalSettingsSheetProps) {
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userProfile) {
      // Use setTimeout to avoid synchronous state update warning during render cycle if it applies
      setTimeout(() => setFormData(userProfile), 0);
    }
  }, [userProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("user_profile")
        .update({
          calorie_target: formData.calorie_target,
          protein_target: formData.protein_target,
          carbs_target: formData.carbs_target,
          fat_target: formData.fat_target,
          fiber_target: formData.fiber_target,
          sodium_target: formData.sodium_target,
          potassium_target: formData.potassium_target,
          calcium_target: formData.calcium_target,
          iron_target: formData.iron_target,
        })
        .eq("id", 1) // Updating row 1 as requested
        .select()
        .single();

      if (error) {
        console.error("Error updating profile:", error);
      } else if (data) {
        onProfileUpdate(data as UserProfile);
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 transition-opacity">
      <div className="w-full max-w-md bg-slate-950 rounded-t-2xl p-6 shadow-xl border-t border-emerald-500/20 slide-up-animation max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Edit Goals</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <InputField label="Calories (kcal)" name="calorie_target" value={formData.calorie_target} onChange={handleChange} />
          <div className="grid grid-cols-3 gap-3">
            <InputField label="Protein (g)" name="protein_target" value={formData.protein_target} onChange={handleChange} />
            <InputField label="Carbs (g)" name="carbs_target" value={formData.carbs_target} onChange={handleChange} />
            <InputField label="Fat (g)" name="fat_target" value={formData.fat_target} onChange={handleChange} />
          </div>
          <h3 className="text-sm font-medium text-emerald-500 pt-2 border-t border-slate-800">Micronutrients</h3>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Fiber (g)" name="fiber_target" value={formData.fiber_target} onChange={handleChange} />
            <InputField label="Sodium (mg)" name="sodium_target" value={formData.sodium_target} onChange={handleChange} />
            <InputField label="Potassium (mg)" name="potassium_target" value={formData.potassium_target} onChange={handleChange} />
            <InputField label="Calcium (mg)" name="calcium_target" value={formData.calcium_target} onChange={handleChange} />
            <InputField label="Iron (mg)" name="iron_target" value={formData.iron_target} onChange={handleChange} />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full mt-8 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Goals"}
        </button>
      </div>
    </div>
  );
}

function InputField({ label, name, value, onChange }: { label: string; name: string; value: any; onChange: any }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
      <input
        type="number"
        name={name}
        value={value || ""}
        onChange={onChange}
        className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 transition-colors"
      />
    </div>
  );
}
