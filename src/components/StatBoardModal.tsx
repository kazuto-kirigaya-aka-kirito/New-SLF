import React, { useState } from 'react';
import { PlayerAccount, PlayerAttributes } from '../types/game';
import { X, User, Plus, Minus, RotateCcw, Sparkles, Shield, Zap, Swords, Wind, Eye, Clover, Award, ArrowUpRight } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface StatBoardModalProps {
  player: PlayerAccount;
  onUpdatePlayer: (updater: (prev: PlayerAccount) => PlayerAccount) => void;
  onClose: () => void;
}

export const StatBoardModal: React.FC<StatBoardModalProps> = ({ player, onUpdatePlayer, onClose }) => {
  const [tempAlloc, setTempAlloc] = useState<PlayerAttributes>({ ...player.attributes });
  const [spentPoints, setSpentPoints] = useState(0);

  const availablePoints = player.freeStatPoints - spentPoints;

  const handleIncrement = (stat: keyof PlayerAttributes) => {
    if (availablePoints <= 0) return;
    try {
      soundFx.playBuild();
    } catch {}
    setTempAlloc((prev) => ({ ...prev, [stat]: prev[stat] + 1 }));
    setSpentPoints((prev) => prev + 1);
  };

  const handleDecrement = (stat: keyof PlayerAttributes) => {
    if (tempAlloc[stat] <= player.attributes[stat]) return;
    try {
      soundFx.playBuild();
    } catch {}
    setTempAlloc((prev) => ({ ...prev, [stat]: prev[stat] - 1 }));
    setSpentPoints((prev) => prev - 1);
  };

  // Convert EXP to Stat Points (like SLF / SAO anime)
  const expCostPerPoint = Math.max(150, Math.round(player.nextLevelExp * 0.25));
  const canConvertExp = player.currentExp >= expCostPerPoint;

  const handleConvertExp = () => {
    if (!canConvertExp) return;
    try {
      soundFx.playLevelUp();
    } catch {}
    onUpdatePlayer((prev) => ({
      ...prev,
      currentExp: prev.currentExp - expCostPerPoint,
      freeStatPoints: prev.freeStatPoints + 1,
    }));
  };

  const handleConfirmAllocation = () => {
    if (spentPoints === 0) {
      onClose();
      return;
    }

    try {
      soundFx.playLevelUp();
    } catch {}

    onUpdatePlayer((prev) => {
      // Re-calculate derived combat stats
      const strDiff = tempAlloc.str - prev.attributes.str;
      const agiDiff = tempAlloc.agi - prev.attributes.agi;
      const vitDiff = tempAlloc.vit - prev.attributes.vit;
      const intDiff = tempAlloc.int - prev.attributes.int;

      const hpGain = vitDiff * 25;
      const atkGain = strDiff * 2.5 + Math.round(tempAlloc.dex * 0.5);
      const defGain = vitDiff * 1.8;
      const spdGain = agiDiff * 3;
      const manaGain = intDiff * 15;
      const critGain = agiDiff * 0.006;

      return {
        ...prev,
        attributes: { ...tempAlloc },
        freeStatPoints: prev.freeStatPoints - spentPoints,
        stats: {
          ...prev.stats,
          maxHp: prev.stats.maxHp + hpGain,
          hp: Math.min(prev.stats.maxHp + hpGain, prev.stats.hp + hpGain),
          maxMana: prev.stats.maxMana + manaGain,
          mana: prev.stats.mana + manaGain,
          atk: Math.round(prev.stats.atk + atkGain),
          def: Math.round(prev.stats.def + defGain),
          speed: prev.stats.speed + spdGain,
          criticalChance: Math.min(0.75, prev.stats.criticalChance + critGain),
        },
      };
    });

    onClose();
  };

  // Stat definitions
  const statDefs: {
    key: keyof PlayerAttributes;
    name: string;
    label: string;
    description: string;
    bonusLabel: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      key: 'str',
      name: 'STR',
      label: 'Strength (Muscle Density)',
      description: 'Increases raw physical strike power, melee stagger impact, and critical burst damage.',
      bonusLabel: '+2.5 ATK · +1.2% Crit DMG per pt',
      icon: <Swords className="w-5 h-5 text-red-400" />,
      color: 'border-red-500/40 text-red-300',
    },
    {
      key: 'agi',
      name: 'AGI',
      label: 'Agility (Reflex & Acrobatics)',
      description: 'Increases dash speed, critical strike probability, and dodge invulnerability window (Sunraku playstyle).',
      bonusLabel: '+3 Speed · +0.6% Crit · +0.02s i-Frames',
      icon: <Wind className="w-5 h-5 text-cyan-400" />,
      color: 'border-cyan-500/40 text-cyan-300',
    },
    {
      key: 'vit',
      name: 'VIT',
      label: 'Vitality (Endurance & Armor)',
      description: 'Expands maximum health reserves, passive HP recovery rate, and defensive barrier rating.',
      bonusLabel: '+25 Max HP · +1.8 DEF per pt',
      icon: <Shield className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-500/40 text-emerald-300',
    },
    {
      key: 'int',
      name: 'INT',
      label: 'Intelligence (Aether Mastery)',
      description: 'Bolsters mana pools, shortens active skill cooldowns, and increases ether beam efficiency.',
      bonusLabel: '+15 Max Mana · +2.2% Skill DMG',
      icon: <Sparkles className="w-5 h-5 text-purple-400" />,
      color: 'border-purple-500/40 text-purple-300',
    },
    {
      key: 'dex',
      name: 'DEX',
      label: 'Dexterity (Tech & Gunnery)',
      description: 'Improves Kirin Mecha plasma laser damage, micro-missile lock speed, and engineering precision.',
      bonusLabel: '+2.8 Mecha Beam ATK · Precision Hit',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-500/40 text-amber-300',
    },
    {
      key: 'luk',
      name: 'LUK',
      label: 'Luck (Pioneer Providence)',
      description: 'Amplifies monster item drops, rare titan relic scrap yields, and merchant commerce multiplier.',
      bonusLabel: '+2.5% Drop Rate · +3% Bonus Gold',
      icon: <Clover className="w-5 h-5 text-yellow-400" />,
      color: 'border-yellow-500/40 text-yellow-300',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 select-none">
      <div className="relative w-full max-w-3xl bg-slate-950 border border-cyan-500/50 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header (SAO / SLF Style) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/30 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-950 border border-cyan-400 rounded-xl text-cyan-300 shadow-md shadow-cyan-500/20">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-fantasy font-bold text-white tracking-wide">
                  Pioneer Status & Attribute Matrix
                </h2>
                <span className="px-2 py-0.5 bg-cyan-500 text-black text-[10px] font-bold rounded font-mono-stat uppercase">
                  SLF Stat Board
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans mt-0.5">
                Allocate free stat points and convert experience directly into core combat attributes.
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

        {/* Available Points & EXP Conversion Bar */}
        <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-4 text-xs font-mono-stat">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-amber-950/70 border border-amber-500/70 px-3.5 py-1.5 rounded-lg text-amber-300 font-bold text-sm">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Available Stat Points: {availablePoints}</span>
            </div>
            {spentPoints > 0 && (
              <span className="text-emerald-400 text-xs">({spentPoints} ready to confirm)</span>
            )}
          </div>

          {/* EXP to Stat Conversion Button */}
          <div className="flex items-center gap-2">
            <div className="text-[11px] text-slate-400">
              Surplus EXP: <span className="text-amber-300 font-bold">{player.currentExp}</span> / {expCostPerPoint}
            </div>
            <button
              onClick={handleConvertExp}
              disabled={!canConvertExp}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                canConvertExp
                  ? 'bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-md shadow-purple-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
              title="Convert 25% level EXP into 1 permanent Stat Point"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Convert EXP (+1 Point)
            </button>
          </div>
        </div>

        {/* Attributes Investment Grid */}
        <div className="p-6 overflow-y-auto space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {statDefs.map((def) => {
              const currentVal = tempAlloc[def.key];
              const baseVal = player.attributes[def.key];
              const isAllocated = currentVal > baseVal;

              return (
                <div
                  key={def.key}
                  className={`p-3.5 rounded-xl border bg-slate-900/80 transition-all ${
                    isAllocated ? 'border-cyan-400 bg-slate-900 shadow-md shadow-cyan-950/50' : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-slate-950 border border-slate-700 rounded-lg">
                        {def.icon}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          {def.name}
                          <span className="text-xs text-slate-400 font-sans font-normal">
                            ({def.label.split('(')[0].trim()})
                          </span>
                        </div>
                        <div className="text-[10px] text-cyan-300 font-mono-stat">{def.bonusLabel}</div>
                      </div>
                    </div>

                    {/* Number & Buttons */}
                    <div className="flex items-center gap-2 font-mono-stat">
                      <button
                        onClick={() => handleDecrement(def.key)}
                        disabled={currentVal <= baseVal}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 font-bold cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <span
                        className={`text-base font-bold min-w-[28px] text-center ${
                          isAllocated ? 'text-amber-300' : 'text-white'
                        }`}
                      >
                        {currentVal}
                      </span>

                      <button
                        onClick={() => handleIncrement(def.key)}
                        disabled={availablePoints <= 0}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold cursor-pointer transition-colors shadow"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-snug">{def.description}</p>
                </div>
              );
            })}
          </div>

          {/* Derived Combat Stats Panel */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2 mt-4">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Live Combat Readout (With Attributes Applied)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono-stat">
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="text-slate-400 text-[10px]">Max Vitality (HP)</div>
                <div className="text-emerald-400 font-bold">{player.stats.maxHp} HP</div>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="text-slate-400 text-[10px]">Physical ATK</div>
                <div className="text-red-400 font-bold">{player.stats.atk} DMG</div>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="text-slate-400 text-[10px]">Kinetic Armor (DEF)</div>
                <div className="text-blue-400 font-bold">{player.stats.def} DEF</div>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="text-slate-400 text-[10px]">Critical Rate</div>
                <div className="text-amber-400 font-bold">{(player.stats.criticalChance * 100).toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <button
            onClick={() => {
              setTempAlloc({ ...player.attributes });
              setSpentPoints(0);
            }}
            disabled={spentPoints === 0}
            className="px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Allocation
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAllocation}
              className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/30 cursor-pointer transition-transform hover:scale-105"
            >
              {spentPoints > 0 ? `Apply Changes (${spentPoints} Pts)` : 'Close Stat Board'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
