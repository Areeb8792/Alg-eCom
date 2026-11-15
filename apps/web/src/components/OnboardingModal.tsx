import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';

const GENDER_OPTIONS = [
  { id: 'ALL', label: 'NON-BINARY / ALL DOMAINS' },
  { id: 'AVANT_GARDE', label: 'AVANT-GARDE EDITORIAL' },
  { id: 'WOMENSWEAR', label: 'WOMENSWEAR SILHOUETTES' },
  { id: 'MENSWEAR', label: 'MENSWEAR STRUCTURE' }
];

const CATEGORIES = [
  { id: 'OUTERWEAR', label: 'OUTERWEAR' },
  { id: 'TAILORING', label: 'TAILORING' },
  { id: 'TOPS', label: 'TOPS & SHIRTS' },
  { id: 'BOTTOMS', label: 'BOTTOMS & TROUSERS' },
  { id: 'FOOTWEAR', label: 'FOOTWEAR' },
  { id: 'ACCESSORIES', label: 'OBJECTS & ACCESSORIES' }
];

const STYLES = [
  { id: 'BRUTALIST', label: 'MODERN BRUTALIST' },
  { id: 'MINIMALIST', label: 'MINIMALIST ARCHITECTURAL' },
  { id: 'TECHNICAL', label: 'TECHNICAL UTILITARIAN' },
  { id: 'EDITORIAL', label: 'HIGH-FASHION EDITORIAL' },
  { id: 'OVERSIZED', label: 'DECONSTRUCTED OVERSIZED' },
  { id: 'MONOCHROME', label: 'HARSH MONOCHROME' }
];

const FITS = [
  { id: 'OVERSIZED', label: 'OVERSIZED' },
  { id: 'STRUCTURED', label: 'STRUCTURED' },
  { id: 'RELAXED', label: 'RELAXED' },
  { id: 'SLIM', label: 'SLIM SHARP' },
  { id: 'CROPPED', label: 'CROPPED' }
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const COLORS = [
  { id: 'BLACK', label: 'INK BLACK', hex: '#1B0E0D' },
  { id: 'CHALK', label: 'CHALK / OFF-WHITE', hex: '#E3E2DE' },
  { id: 'BURNT_RED', label: 'BURNT RED', hex: '#C72A09' },
  { id: 'SLATE', label: 'SLATE GREY', hex: '#5A6065' },
  { id: 'ESPRESSO', label: 'DARK ESPRESSO', hex: '#61220F' },
  { id: 'NEON', label: 'NEON MATRIX', hex: '#31EF07' }
];

export const OnboardingModal: React.FC = () => {
  const { isOnboardingModalOpen, closeOnboardingModal, updatePreferences, preferences } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [genderPresentation, setGenderPresentation] = useState<string>(preferences?.gender_presentation || 'ALL');
  const [favoriteCategories, setFavoriteCategories] = useState<string[]>(preferences?.favorite_categories || ['OUTERWEAR', 'TAILORING']);
  const [preferredStyles, setPreferredStyles] = useState<string[]>(preferences?.preferred_styles || ['BRUTALIST', 'MINIMALIST']);
  const [preferredFits, setPreferredFits] = useState<string[]>(preferences?.preferred_fits || ['OVERSIZED']);
  const [preferredSizes, setPreferredSizes] = useState<string[]>(preferences?.preferred_sizes || ['M', 'L']);
  const [preferredColors, setPreferredColors] = useState<string[]>(preferences?.preferred_colors || ['BLACK', 'BURNT_RED']);
  const [maxPriceCents, setMaxPriceCents] = useState<number>(preferences?.price_range_max_cents || 350000);
  const [saving, setSaving] = useState(false);

  if (!isOnboardingModalOpen) return null;

  const toggleArrayItem = (list: string[], item: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const handleSave = async (skip = false) => {
    setSaving(true);
    try {
      await updatePreferences({
        gender_presentation: genderPresentation,
        favorite_categories: favoriteCategories,
        preferred_styles: preferredStyles,
        preferred_fits: preferredFits,
        preferred_sizes: preferredSizes,
        preferred_colors: preferredColors,
        price_range_min_cents: 0,
        price_range_max_cents: maxPriceCents,
        onboarding_completed: true
      });
      closeOnboardingModal();
    } catch (err) {
      console.error('Failed to save preferences:', err);
      // Even if update failed, close so user is not stuck
      if (skip) closeOnboardingModal();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#E3E2DE] border-2 border-[#1B0E0D] shadow-[12px_12px_0px_#1B0E0D] p-6 lg:p-8 text-[#1B0E0D] max-h-[92vh] flex flex-col justify-between overflow-y-auto">
        {/* Top Editorial Bar */}
        <div>
          <div className="flex justify-between items-start border-b-2 border-[#1B0E0D] pb-3 mb-4">
            <div>
              <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C72A09] font-bold block">
                SEASON 04 // DOSSIER ONBOARDING
              </span>
              <h2 className="font-clash text-2xl lg:text-3xl font-black uppercase tracking-tight">
                CURATE YOUR EDITORIAL PROFILE
              </h2>
            </div>
            <button
              onClick={() => handleSave(true)}
              className="font-mono text-xs uppercase text-gray-500 hover:text-[#C72A09] font-bold py-1 px-2 border border-gray-400 hover:border-[#C72A09]"
            >
              SKIP
            </button>
          </div>

          {/* Step Tracker */}
          <div className="flex items-center justify-between mb-6 font-mono text-[11px] text-gray-600">
            <span>
              STEP [0{step}/03] — {step === 1 && 'DOMAIN & CATEGORIES'}
              {step === 2 && 'AESTHETIC & FIT MATRIX'}
              {step === 3 && 'SILHOUETTE & PALETTE'}
            </span>
            <div className="w-32 h-2 bg-gray-300 border border-[#1B0E0D]">
              <div
                className="h-full bg-[#31EF07] transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* STEP 1: Presentation & Categories */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#1B0E0D] mb-2">
                  01 // AESTHETIC PRESENTATION DOMAIN
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {GENDER_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setGenderPresentation(opt.id)}
                      className={`p-3 border font-mono text-xs font-bold text-left transition-all ${
                        genderPresentation === opt.id
                          ? 'bg-[#1B0E0D] text-[#E3E2DE] border-[#1B0E0D] shadow-[3px_3px_0px_#C72A09]'
                          : 'bg-white text-[#1B0E0D] border-gray-300 hover:border-[#1B0E0D]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#1B0E0D] mb-2">
                  02 // PRIMARY FOCUS CATEGORIES (SELECT ALL THAT APPLY)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => {
                    const isSelected = favoriteCategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleArrayItem(favoriteCategories, cat.id, setFavoriteCategories)}
                        className={`p-2.5 border font-mono text-xs font-bold text-center transition-all ${
                          isSelected
                            ? 'bg-[#1B0E0D] text-[#E3E2DE] border-[#1B0E0D] shadow-[2px_2px_0px_#31EF07]'
                            : 'bg-white text-[#1B0E0D] border-gray-300 hover:border-[#1B0E0D]'
                        }`}
                      >
                        {isSelected ? `✓ ${cat.label}` : cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Styles & Fits */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#1B0E0D] mb-2">
                  03 // ARCHITECTURAL AESTHETIC (SELECT PREFERRED)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {STYLES.map((style) => {
                    const isSelected = preferredStyles.includes(style.id);
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => toggleArrayItem(preferredStyles, style.id, setPreferredStyles)}
                        className={`p-3 border font-mono text-xs font-bold text-left transition-all ${
                          isSelected
                            ? 'bg-[#1B0E0D] text-[#E3E2DE] border-[#1B0E0D] shadow-[3px_3px_0px_#C72A09]'
                            : 'bg-white text-[#1B0E0D] border-gray-300 hover:border-[#1B0E0D]'
                        }`}
                      >
                        {isSelected ? `✓ ${style.label}` : style.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#1B0E0D] mb-2">
                  04 // SILHOUETTE FIT DIMENSIONS
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FITS.map((fit) => {
                    const isSelected = preferredFits.includes(fit.id);
                    return (
                      <button
                        key={fit.id}
                        type="button"
                        onClick={() => toggleArrayItem(preferredFits, fit.id, setPreferredFits)}
                        className={`p-2.5 border font-mono text-xs font-bold text-center transition-all ${
                          isSelected
                            ? 'bg-[#1B0E0D] text-[#E3E2DE] border-[#1B0E0D] shadow-[2px_2px_0px_#31EF07]'
                            : 'bg-white text-[#1B0E0D] border-gray-300 hover:border-[#1B0E0D]'
                        }`}
                      >
                        {isSelected ? `✓ ${fit.label}` : fit.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Sizes, Colors & Budget */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#1B0E0D] mb-2">
                  05 // PREFERRED GARMENT SIZES
                </label>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map((sz) => {
                    const isSelected = preferredSizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => toggleArrayItem(preferredSizes, sz, setPreferredSizes)}
                        className={`w-12 h-12 border font-mono font-bold text-sm flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-[#1B0E0D] text-[#E3E2DE] border-[#1B0E0D] shadow-[3px_3px_0px_#C72A09]'
                            : 'bg-white text-[#1B0E0D] border-gray-300 hover:border-[#1B0E0D]'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#1B0E0D] mb-2">
                  06 // PREFERRED COLOR PALETTE
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COLORS.map((col) => {
                    const isSelected = preferredColors.includes(col.id);
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => toggleArrayItem(preferredColors, col.id, setPreferredColors)}
                        className={`p-2.5 border flex items-center gap-2 font-mono text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-[#1B0E0D] text-[#E3E2DE] border-[#1B0E0D] shadow-[2px_2px_0px_#31EF07]'
                            : 'bg-white text-[#1B0E0D] border-gray-300 hover:border-[#1B0E0D]'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 border border-[#1B0E0D] shrink-0"
                          style={{ backgroundColor: col.hex }}
                        />
                        <span className="truncate">{col.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[#1B0E0D]">
                    07 // BUDGET THRESHOLD (MAX USD)
                  </label>
                  <span className="font-mono text-xs font-bold text-[#C72A09]">
                    ${(maxPriceCents / 100).toLocaleString()} USD
                  </span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="1000000"
                  step="5000"
                  value={maxPriceCents}
                  onChange={(e) => setMaxPriceCents(Number(e.target.value))}
                  className="w-full accent-[#C72A09] cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="border-t-2 border-[#1B0E0D] pt-4 mt-6 flex justify-between items-center">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="py-2.5 px-5 border border-[#1B0E0D] font-mono text-xs font-bold uppercase hover:bg-white transition-colors"
            >
              ← PREVIOUS
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="py-2.5 px-6 bg-[#1B0E0D] text-[#E3E2DE] font-clash text-xs font-bold uppercase tracking-wider hover:bg-[#C72A09] transition-colors shadow-[3px_3px_0px_#C72A09]"
            >
              NEXT PROTOCOL →
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(false)}
              className="py-2.5 px-6 bg-[#31EF07] text-[#1B0E0D] font-clash text-xs font-black uppercase tracking-wider hover:bg-[#1B0E0D] hover:text-[#E3E2DE] transition-colors shadow-[3px_3px_0px_#1B0E0D] disabled:opacity-60"
            >
              {saving ? 'SYNCHRONIZING...' : 'SAVE DOSSIER & DISCOVER →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
