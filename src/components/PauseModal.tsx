import React, { useState } from 'react';
import { Play, Volume2, VolumeX, LogOut, Save, CheckCircle2, Shield, Sparkles } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onSaveProgress: () => void;
  onSaveAndExit: () => void;
  onQuitToTitle: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  lastSavedTime?: string | null;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onSaveProgress,
  onSaveAndExit,
  onQuitToTitle,
  isMuted,
  onToggleMute,
  lastSavedTime,
}) => {
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleQuickSave = () => {
    try {
      soundFx.playBuild();
    } catch {}
    onSaveProgress();
    setSaveStatus('Progress successfully saved to Pioneer Terminal!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleSaveAndExitClick = () => {
    try {
      soundFx.playLevelUp();
    } catch {}
    setSaveStatus('Saving progress and safely returning to Terminal...');
    setTimeout(() => {
      onSaveAndExit();
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-md bg-slate-950 border border-cyan-500/50 rounded-2xl p-6 shadow-2xl text-center space-y-4">
        <div>
          <h2 className="text-2xl font-fantasy font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-300">
            AETHERIA FRONTIER
          </h2>
          <p className="text-xs text-slate-400 font-mono-stat mt-1">
            Simulation Standby · Pioneer Session Paused
          </p>
        </div>

        {saveStatus && (
          <div className="p-2.5 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-mono-stat rounded-xl flex items-center justify-center gap-2 animate-pulse">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveStatus}</span>
          </div>
        )}

        <div className="space-y-2.5 font-mono-stat text-xs">
          {/* Resume */}
          <button
            onClick={onResume}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
          >
            <Play className="w-4 h-4 fill-current" />
            Resume Frontier Simulation (Esc)
          </button>

          {/* Save Progress & Exit to Title (Explicit User Request) */}
          <button
            onClick={handleSaveAndExitClick}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
          >
            <Save className="w-4 h-4" />
            Save Progress & Exit to Title
          </button>

          {/* Quick Save without exiting */}
          <button
            onClick={handleQuickSave}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/50 hover:border-emerald-400 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Save Progress Now (Keep Playing)
          </button>

          {/* Audio toggle */}
          <button
            onClick={onToggleMute}
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            {isMuted ? 'Unmute Audio' : 'Mute Audio'}
          </button>

          {/* Exit without extra save */}
          <button
            onClick={onQuitToTitle}
            className="w-full py-2 bg-slate-950 hover:bg-slate-900 text-rose-300 border border-rose-950 hover:border-rose-700 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Exit to Title (Fast)
          </button>
        </div>

        {lastSavedTime && (
          <div className="text-[10px] text-slate-400 font-mono-stat">
            Last Saved: {lastSavedTime}
          </div>
        )}

        <div className="pt-2.5 border-t border-slate-800 text-[11px] text-slate-300 font-mono-stat text-left space-y-1">
          <div className="font-bold text-cyan-300 mb-1">Quick Reference:</div>
          <div>• [C] Stat Board · [G] Guild Shop · [M] World Map</div>
          <div>• [D] Daily Bounties · [Q] Quests · [K] Skill Tree</div>
          <div>• [Space] Dodge Roll · [R] Kirin Mecha Frame</div>
        </div>
      </div>
    </div>
  );
};
