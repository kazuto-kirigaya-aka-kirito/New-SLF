import React, { useState } from 'react';
import { PlayerAccount, SkillNode } from '../types/game';
import { INITIAL_SKILL_NODES } from '../utils/skillTreeData';
import { X, Zap, Shield, Compass, Cpu, Check, Lock, ChevronRight } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface SkillTreeModalProps {
  player: PlayerAccount;
  onUpdatePlayer: (updater: (prev: PlayerAccount) => PlayerAccount) => void;
  onClose: () => void;
}

export const SkillTreeModal: React.FC<SkillTreeModalProps> = ({ player, onUpdatePlayer, onClose }) => {
  const [selectedBranch, setSelectedBranch] = useState<'all' | 'martial' | 'exploration' | 'mecha'>('all');
  const [activeSlotTarget, setActiveSlotTarget] = useState<number | null>(null);

  const getSkillCurrentLevel = (skillId: string) => {
    return player.skills[skillId] || 0;
  };

  const handleUpgradeSkill = (skill: SkillNode) => {
    const curLevel = getSkillCurrentLevel(skill.id);
    if (curLevel >= skill.maxLevel) return;
    if (player.skillPoints < skill.spCost) return;
    if (player.level < skill.requiredPlayerLevel) return;

    if (skill.requiresSkillId) {
      const parentLevel = getSkillCurrentLevel(skill.requiresSkillId);
      if (parentLevel < 1) return;
    }

    soundFx.playLevelUp();
    onUpdatePlayer((prev) => ({
      ...prev,
      skillPoints: prev.skillPoints - skill.spCost,
      skills: {
        ...prev.skills,
        [skill.id]: curLevel + 1,
      },
    }));
  };

  const handleAssignToSlot = (skillId: string, slotIndex: number) => {
    soundFx.playBuild();
    onUpdatePlayer((prev) => {
      const nextSlots = [...prev.activeSkills];
      // remove if already in another slot
      const existingIdx = nextSlots.indexOf(skillId);
      if (existingIdx !== -1) nextSlots[existingIdx] = null;
      nextSlots[slotIndex] = skillId;
      return { ...prev, activeSkills: nextSlots };
    });
    setActiveSlotTarget(null);
  };

  const filteredSkills = INITIAL_SKILL_NODES.filter(
    (s) => selectedBranch === 'all' || s.branch === selectedBranch
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/30 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950 border border-cyan-400 rounded-lg text-cyan-300">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-fantasy font-bold text-white tracking-wide">
                Dynamic Skill Tree & Progression
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Unlock specialized abilities across Martial Arts, World Exploration, and Mecha Engineering.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-amber-950/70 border border-amber-500/60 px-3 py-1.5 rounded-lg text-amber-300 font-mono-stat font-bold text-sm">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Available SP: {player.skillPoints}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Branch Filter Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-800 bg-slate-900/40 text-xs">
          <button
            onClick={() => setSelectedBranch('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              selectedBranch === 'all'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900'
            }`}
          >
            All Disciplines
          </button>
          <button
            onClick={() => setSelectedBranch('martial')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              selectedBranch === 'martial'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Martial & Action
          </button>
          <button
            onClick={() => setSelectedBranch('exploration')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              selectedBranch === 'exploration'
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            World Building & Survey
          </button>
          <button
            onClick={() => setSelectedBranch('mecha')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              selectedBranch === 'mecha'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Mecha & Magitech
          </button>
        </div>

        {/* Skill Nodes Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSkills.map((skill) => {
            const curLevel = getSkillCurrentLevel(skill.id);
            const isUnlocked = curLevel > 0;
            const isMaxed = curLevel >= skill.maxLevel;
            const meetsPlayerLevel = player.level >= skill.requiredPlayerLevel;
            const hasParent = !skill.requiresSkillId || getSkillCurrentLevel(skill.requiresSkillId) > 0;
            const canAfford = player.skillPoints >= skill.spCost;
            const canUpgrade = !isMaxed && meetsPlayerLevel && hasParent && canAfford;

            return (
              <div
                key={skill.id}
                className={`flex flex-col justify-between p-4 rounded-xl border transition-all ${
                  isUnlocked
                    ? 'bg-slate-900/90 border-cyan-500/50 shadow-lg shadow-cyan-950/30'
                    : 'bg-slate-950/70 border-slate-800 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-2 rounded-lg border ${
                          skill.branch === 'martial'
                            ? 'bg-rose-950 border-rose-500/60 text-rose-300'
                            : skill.branch === 'exploration'
                            ? 'bg-emerald-950 border-emerald-500/60 text-emerald-300'
                            : 'bg-cyan-950 border-cyan-500/60 text-cyan-300'
                        }`}
                      >
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          {skill.name}
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded uppercase">
                            {skill.type}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono-stat text-cyan-400">
                          Tier {skill.tier} · Req. Lv.{skill.requiredPlayerLevel}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-mono-stat font-bold text-amber-300">
                        Lv.{curLevel} / {skill.maxLevel}
                      </div>
                      <div className="text-[10px] font-mono-stat text-slate-400">
                        {skill.spCost} SP / rank
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mb-2 leading-relaxed">{skill.description}</p>
                  <div className="text-xs text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 rounded p-2 mb-3">
                    <span className="font-bold text-cyan-400">Effect:</span> {skill.effectDescription}
                  </div>
                </div>

                {/* Action Row */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-2">
                  {/* Slot assignment button if active & unlocked */}
                  {skill.type === 'active' && isUnlocked ? (
                    <div className="relative">
                      {activeSlotTarget === null ? (
                        <button
                          onClick={() => setActiveSlotTarget(activeSlotTarget === null ? 0 : null)}
                          className="px-2.5 py-1 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded cursor-pointer"
                        >
                          Equip to Quickbar
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">Slot:</span>
                          {[0, 1, 2, 3].map((slotIdx) => (
                            <button
                              key={slotIdx}
                              onClick={() => handleAssignToSlot(skill.id, slotIdx)}
                              className="w-6 h-6 bg-cyan-900 hover:bg-cyan-500 hover:text-black border border-cyan-400 text-cyan-200 text-xs font-mono-stat font-bold rounded cursor-pointer"
                            >
                              {slotIdx + 1}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div />
                  )}

                  {/* Upgrade CTA */}
                  <button
                    onClick={() => handleUpgradeSkill(skill)}
                    disabled={!canUpgrade}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isMaxed
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : canUpgrade
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/30'
                        : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    {isMaxed ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Maxed
                      </>
                    ) : !meetsPlayerLevel ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        Req. Lv.{skill.requiredPlayerLevel}
                      </>
                    ) : !hasParent ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        Need Prerequisite
                      </>
                    ) : !canAfford ? (
                      <>Need {skill.spCost} SP</>
                    ) : (
                      <>
                        Learn / Upgrade (+{skill.spCost} SP)
                        <ChevronRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
