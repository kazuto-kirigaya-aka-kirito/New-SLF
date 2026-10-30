import React from 'react';
import { PlayerAccount, JobEvolution } from '../types/game';
import { BASE_JOBS, JOB_EVOLUTIONS } from '../utils/jobData';
import { X, Award, Shield, Cpu, Sparkles, Check, Lock, ChevronRight, Zap } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface JobEvolutionModalProps {
  player: PlayerAccount;
  onUpdatePlayer: (updater: (prev: PlayerAccount) => PlayerAccount) => void;
  onClose: () => void;
}

export const JobEvolutionModal: React.FC<JobEvolutionModalProps> = ({ player, onUpdatePlayer, onClose }) => {
  const baseJob = BASE_JOBS[player.baseJob] || BASE_JOBS.villager;
  const currentEvolution = JOB_EVOLUTIONS.find((j) => j.id === player.currentJobId);
  const currentJobName = currentEvolution ? currentEvolution.name : baseJob.name;

  // Evolutions available for this player's base job
  const relevantEvolutions = JOB_EVOLUTIONS.filter((j) => j.baseJobId === player.baseJob);

  const handleEvolveJob = (evolution: JobEvolution) => {
    const isUnlocked = player.unlockedJobIds.includes(evolution.id);
    const meetsLevel = player.level >= evolution.requiredLevel;
    const hasCompletedQuest = player.completedQuestIds.includes(evolution.requiredQuestId);

    if (!isUnlocked && (!meetsLevel || !hasCompletedQuest)) return;

    soundFx.playLevelUp();
    soundFx.playMechaEngage();

    onUpdatePlayer((prev) => {
      // Calculate new base stats with bonuses
      const bonus = evolution.statBonus;
      const nextUnlocked = prev.unlockedJobIds.includes(evolution.id)
        ? prev.unlockedJobIds
        : [...prev.unlockedJobIds, evolution.id];

      return {
        ...prev,
        currentJobId: evolution.id,
        unlockedJobIds: nextUnlocked,
        adventurerRank: evolution.requiredLevel >= 15 ? 'SSS' : 'A',
        stats: {
          ...prev.stats,
          maxHp: prev.stats.maxHp + bonus.hp,
          hp: prev.stats.hp + bonus.hp,
          atk: prev.stats.atk + bonus.atk,
          def: prev.stats.def + bonus.def,
          speed: prev.stats.speed + bonus.spd,
        },
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-amber-500/40 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/30 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-950 border border-amber-400 rounded-lg text-amber-300">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-fantasy font-bold text-white tracking-wide">
                Specialized Role Evolution Sanctuary
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Transcend your starting job through trials, ancient technology, and Colossi vanquishments.
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

        {/* Current Role Status Banner */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs text-amber-400/80 font-bold uppercase tracking-wider">Current Active Job</div>
            <div className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {currentJobName}
              <span className="text-xs px-2 py-0.5 bg-amber-950 border border-amber-400/60 text-amber-300 rounded font-mono-stat">
                Rank {player.adventurerRank}
              </span>
            </div>
            <div className="text-xs text-slate-300 mt-0.5">{baseJob.flavor}</div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono-stat">
            <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg">
              <span className="text-slate-400">Base Class: </span>
              <span className="text-cyan-300 font-bold">{baseJob.name}</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg">
              <span className="text-slate-400">Player Level: </span>
              <span className="text-amber-400 font-bold">Lv.{player.level}</span>
            </div>
          </div>
        </div>

        {/* Available Evolution Paths */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Available Branch Evolutions for {baseJob.name}:
          </div>

          {relevantEvolutions.map((evo) => {
            const isActive = player.currentJobId === evo.id;
            const isUnlocked = player.unlockedJobIds.includes(evo.id);
            const meetsLevel = player.level >= evo.requiredLevel;
            const hasCompletedQuest = player.completedQuestIds.includes(evo.requiredQuestId);
            const canEvolve = isUnlocked || (meetsLevel && hasCompletedQuest);

            return (
              <div
                key={evo.id}
                className={`p-5 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-amber-950/40 border-amber-400 shadow-xl shadow-amber-950/40'
                    : canEvolve
                    ? 'bg-slate-900/80 border-cyan-500/50 hover:border-cyan-400'
                    : 'bg-slate-950/60 border-slate-800 opacity-75'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-slate-900 border border-amber-500/40 rounded-xl text-amber-300">
                      {evo.genre === 'mecha' ? <Cpu className="w-6 h-6 text-cyan-400" /> : <Shield className="w-6 h-6 text-amber-400" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-white">{evo.name}</h3>
                        <span className="text-xs text-amber-300 font-mono-stat font-semibold">
                          ({evo.title})
                        </span>
                        <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 border border-slate-700 rounded uppercase font-semibold">
                          Genre: {evo.genre.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{evo.description}</p>
                    </div>
                  </div>

                  {/* Stat Bonus badges */}
                  <div className="flex flex-wrap md:flex-col gap-1.5 text-xs font-mono-stat min-w-[140px] bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-emerald-400 font-bold">+{evo.statBonus.hp} Max HP</span>
                    <span className="text-amber-400 font-bold">+{evo.statBonus.atk} ATK</span>
                    <span className="text-blue-400 font-bold">+{evo.statBonus.def} DEF</span>
                    <span className="text-cyan-400 font-bold">+{evo.statBonus.spd} Speed</span>
                    {evo.mechaBonus && (
                      <span className="text-purple-400 font-bold border-t border-slate-800 pt-1 mt-1">
                        +{(evo.mechaBonus.laserDmgBonus * 100).toFixed(0)}% Mecha Beam
                      </span>
                    )}
                  </div>
                </div>

                {/* Requirements & Action */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 gap-3 flex-wrap">
                  <div className="flex items-center gap-3 text-xs font-mono-stat">
                    <span className={meetsLevel ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      Req. Level: Lv.{evo.requiredLevel} {meetsLevel ? '✓' : `(Current: ${player.level})`}
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className={hasCompletedQuest || isUnlocked ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      Quest Prerequisite: {evo.requiredQuestId} {hasCompletedQuest || isUnlocked ? '✓' : '✗'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleEvolveJob(evo)}
                    disabled={isActive || !canEvolve}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 cursor-default'
                        : canEvolve
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black shadow-lg shadow-amber-500/30'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        Currently Active Role
                      </>
                    ) : canEvolve ? (
                      <>
                        <Zap className="w-4 h-4" />
                        Commence Role Evolution
                        <ChevronRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Locked (Complete Trial)
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
