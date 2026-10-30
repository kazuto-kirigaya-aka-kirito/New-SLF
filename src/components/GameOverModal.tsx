import React, { useEffect } from 'react';
import { RotateCcw, Shield, Sparkles, MapPin } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface GameOverModalProps {
  onRespawn: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ onRespawn }) => {
  const handleRespawn = () => {
    try {
      soundFx.playLevelUp();
    } catch {}
    onRespawn();
  };

  // Keyboard shortcut: Press Enter or Space to immediately respawn in sanctuary
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        handleRespawn();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-md bg-slate-950 border-2 border-emerald-500/90 rounded-2xl p-6 shadow-2xl text-center space-y-5">
        <div className="flex flex-col items-center">
          <div className="p-3.5 bg-emerald-950/80 border-2 border-emerald-400 rounded-full text-emerald-400 mb-2 animate-pulse shadow-lg shadow-emerald-500/30">
            <Shield className="w-10 h-10" />
          </div>

          <h2 className="text-3xl font-fantasy font-black tracking-wider text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.7)]">
            SANCTUARY RECALL
          </h2>
          <p className="text-xs text-slate-300 font-mono-stat mt-1 flex items-center gap-1.5 justify-center">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            Destination: Safe Town Sacred Fountain (0, 0)
          </p>
        </div>

        <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-left text-xs space-y-1.5 text-emerald-200">
          <div className="font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Peacekeeper Barrier Guaranteed Protections:
          </div>
          <div>• Instantly respawn in Safe Town Sacred Fountain with 100% full HP.</div>
          <div>• 6-Second Divine Invulnerability Aegis Shield granted upon arrival.</div>
          <div>• Monsters strictly repelled outside Town Barrier (No monster can enter).</div>
          <div>• Weapons sealed inside town (No PK allowed within Sanctuary).</div>
        </div>

        <button
          onClick={handleRespawn}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-black text-sm tracking-wider uppercase rounded-xl shadow-xl shadow-emerald-500/35 flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          <RotateCcw className="w-4 h-4" />
          Respawn in Safe Town Sanctuary (Enter)
        </button>
      </div>
    </div>
  );
};
