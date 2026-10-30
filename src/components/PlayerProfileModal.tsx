import React, { useState } from 'react';
import { PlayerAccount } from '../types/game';
import {
  X,
  User,
  Mail,
  Phone,
  Fingerprint,
  Download,
  Upload,
  Check,
  RefreshCw,
  Shield,
  Award,
  Sparkles,
  Save,
} from 'lucide-react';
import {
  exportPlayerSaveData,
  getAllSavedPlayerIds,
  importPlayerSaveData,
  loadPlayerAccount,
  savePlayerAccount,
} from '../utils/storage';
import { BASE_JOBS } from '../utils/jobData';
import { soundFx } from '../utils/audio';

interface PlayerProfileModalProps {
  player: PlayerAccount;
  onSwitchPlayer: (account: PlayerAccount) => void;
  onUpdatePlayer: (updater: (prev: PlayerAccount) => PlayerAccount) => void;
  onClose: () => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  player,
  onSwitchPlayer,
  onUpdatePlayer,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [showImport, setShowImport] = useState(false);

  // Switch profile form
  const [switchInput, setSwitchInput] = useState('');
  const [switchType, setSwitchType] = useState<'gmail' | 'phone' | 'pioneer_id'>('gmail');

  const baseJob = BASE_JOBS[player.baseJob] || BASE_JOBS.villager;
  const savedIds = getAllSavedPlayerIds();

  const handleManualSave = () => {
    savePlayerAccount(player);
    soundFx.playBuild();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleExport = () => {
    const data = exportPlayerSaveData(player);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AetheriaFrontier_Save_${player.playerId}_Lv${player.level}.json`;
    a.click();
    URL.revokeObjectURL(url);
    soundFx.playBuild();
  };

  const handleImport = () => {
    if (!importJson.trim()) return;
    const imported = importPlayerSaveData(importJson);
    if (imported) {
      soundFx.playLevelUp();
      onSwitchPlayer(imported);
      onClose();
    } else {
      alert('Invalid save file format. Please check your JSON string.');
    }
  };

  const handleQuickSwitch = (targetId: string) => {
    const loaded = loadPlayerAccount(targetId);
    if (loaded) {
      soundFx.playBuild();
      onSwitchPlayer(loaded);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
      <div className="relative w-full max-w-3xl bg-slate-950 border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/30 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950 border border-cyan-400 rounded-lg text-cyan-300">
              <Fingerprint className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-fantasy font-bold text-white tracking-wide">
                Pioneer Adventurer License & Persistence Vault
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Permanent progress storage, multi-account switcher, and encrypted save backups.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Official Shangri-La Pioneer License Card */}
          <div className="relative bg-gradient-to-br from-slate-900 via-cyan-950/40 to-slate-900 border-2 border-cyan-500/60 rounded-2xl p-5 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 px-4 py-1 bg-cyan-500 text-black text-[10px] font-bold uppercase tracking-wider rounded-bl-xl font-mono-stat">
              SLF Full-Dive License
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="flex flex-col items-center justify-center w-20 h-20 bg-slate-950 border border-cyan-400 rounded-xl text-cyan-300 shadow-inner">
                <User className="w-10 h-10 text-cyan-400" />
                <span className="text-[10px] font-mono-stat text-cyan-300 mt-1 font-bold">
                  Lv.{player.level}
                </span>
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white tracking-wide">{player.playerName}</h3>
                  <span className="px-2 py-0.5 text-xs font-bold bg-amber-950 border border-amber-500 text-amber-300 rounded font-mono-stat">
                    Rank {player.adventurerRank}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-cyan-300 font-mono-stat">
                  {player.authType === 'gmail' && <Mail className="w-3.5 h-3.5 text-cyan-400" />}
                  {player.authType === 'phone' && <Phone className="w-3.5 h-3.5 text-emerald-400" />}
                  {player.authType === 'pioneer_id' && <Fingerprint className="w-3.5 h-3.5 text-purple-400" />}
                  <span className="text-slate-300 font-semibold">{player.playerId}</span>
                </div>

                <div className="text-xs text-slate-400 font-sans">
                  Origin Job: <span className="text-slate-200 font-semibold">{baseJob.name}</span> · Current Role: <span className="text-cyan-400 font-semibold">{player.currentJobId.replace(/_/g, ' ').toUpperCase()}</span>
                </div>

                <div className="text-[10px] text-slate-500 font-mono-stat pt-1">
                  Seeded Destiny Hash: #{player.playerId} · Created: {new Date(player.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* License Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 mt-4 border-t border-slate-800 text-xs font-mono-stat">
              <div className="bg-slate-950/70 p-2 rounded border border-slate-800 text-center">
                <div className="text-slate-400 text-[10px]">Total Level</div>
                <div className="text-cyan-300 font-bold text-sm">Lv.{player.level}</div>
              </div>
              <div className="bg-slate-950/70 p-2 rounded border border-slate-800 text-center">
                <div className="text-slate-400 text-[10px]">Quests Cleared</div>
                <div className="text-emerald-400 font-bold text-sm">{player.completedQuestIds.length}</div>
              </div>
              <div className="bg-slate-950/70 p-2 rounded border border-slate-800 text-center">
                <div className="text-slate-400 text-[10px]">Colossi Vanquished</div>
                <div className="text-red-400 font-bold text-sm">{player.colossiDefeated.length}</div>
              </div>
              <div className="bg-slate-950/70 p-2 rounded border border-slate-800 text-center">
                <div className="text-slate-400 text-[10px]">Territory Structures</div>
                <div className="text-amber-400 font-bold text-sm">{player.territoryBuildings.length}</div>
              </div>
            </div>
          </div>

          {/* Backup & Save Actions */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Save className="w-4 h-4 text-cyan-400" />
              Save State Management
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleManualSave}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow cursor-pointer transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                {saveSuccess ? 'Saved to Browser Cache!' : 'Manual Force Save'}
              </button>

              <button
                onClick={handleExport}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                Export Save File (JSON)
              </button>

              <button
                onClick={() => setShowImport(!showImport)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                Import External Save
              </button>
            </div>

            {showImport && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <textarea
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder="Paste your JSON save file text here..."
                  className="w-full h-24 p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:border-cyan-400 outline-none"
                />
                <button
                  onClick={handleImport}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold cursor-pointer"
                >
                  Load Imported Save
                </button>
              </div>
            )}
          </div>

          {/* Stored Character Profiles Switcher */}
          {savedIds.length > 1 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-cyan-400" />
                Switch to Saved Pioneer Profile
              </div>

              <div className="flex flex-wrap gap-2">
                {savedIds.map((sid) => (
                  <button
                    key={sid}
                    onClick={() => handleQuickSwitch(sid)}
                    disabled={sid === player.playerId}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono-stat font-semibold transition-all cursor-pointer ${
                      sid === player.playerId
                        ? 'bg-cyan-950 border border-cyan-400 text-cyan-300 cursor-default'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {sid} {sid === player.playerId ? '(Current)' : ''}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
