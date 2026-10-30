import React from 'react';
import { PlayerAccount, RankTier } from '../types/game';
import { BASE_JOBS, JOB_EVOLUTIONS } from '../utils/jobData';
import { INITIAL_SKILL_NODES } from '../utils/skillTreeData';
import {
  Shield,
  Zap,
  Cpu,
  Coins,
  TreePine,
  Hammer,
  BookOpen,
  Volume2,
  VolumeX,
  Pause,
  User,
  Sparkles,
  Flame,
  Award,
  Layers,
  Calendar,
  Building2,
  Compass,
  Swords,
  ShieldAlert,
  Save,
} from 'lucide-react';

interface HUDProps {
  player: PlayerAccount;
  isMechaMode: boolean;
  isInsideTown: boolean;
  onToggleMecha: () => void;
  onOpenSkillTree: () => void;
  onOpenQuests: () => void;
  onOpenDailyBounties: () => void;
  onOpenBuildMenu: () => void;
  onOpenJobEvolution: () => void;
  onOpenProfile: () => void;
  onOpenStatBoard: () => void;
  onOpenGuildShop: () => void;
  onOpenWorldMap: () => void;
  onTogglePause: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  buildPlacingType: string | null;
  onCancelBuild: () => void;
  onSaveGame?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  player,
  isMechaMode,
  isInsideTown,
  onToggleMecha,
  onOpenSkillTree,
  onOpenQuests,
  onOpenDailyBounties,
  onOpenBuildMenu,
  onOpenJobEvolution,
  onOpenProfile,
  onOpenStatBoard,
  onOpenGuildShop,
  onOpenWorldMap,
  onTogglePause,
  isMuted,
  onToggleMute,
  buildPlacingType,
  onCancelBuild,
  onSaveGame,
}) => {
  const baseJob = BASE_JOBS[player.baseJob] || BASE_JOBS.villager;
  const currentEvolution = JOB_EVOLUTIONS.find((j) => j.id === player.currentJobId);
  const currentJobTitle = currentEvolution ? currentEvolution.name : baseJob.name;

  const unclaimedDailyCount = (player.dailyBounties || []).filter((b) => b.isCompleted && !b.isClaimed).length;
  const activeQuest = player.quests.find((q) => q.isActive && !q.isCompleted) || player.quests[0];

  const getRankBadgeColor = (rank: RankTier) => {
    switch (rank) {
      case 'SSS':
        return 'bg-red-950 text-red-400 border-red-500 shadow-red-500/50';
      case 'SS':
      case 'S':
        return 'bg-amber-950 text-amber-300 border-amber-500 shadow-amber-500/50';
      case 'A':
      case 'B':
        return 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-cyan-500/50';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-4 font-sans select-none z-10">
      {/* TOP ROW */}
      <div className="flex justify-between items-start w-full gap-2">
        {/* Top-Left: Hero Identity & Core Vitals */}
        <div className="pointer-events-auto flex items-start gap-3 bg-slate-950/85 border border-cyan-500/30 rounded-xl p-3 shadow-xl max-w-sm">
          <button
            onClick={onOpenProfile}
            title="Open Pioneer License Card [P]"
            className="relative flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-gradient-to-br from-cyan-950 to-slate-900 border border-cyan-400/50 text-cyan-300 hover:scale-105 transition-transform cursor-pointer"
          >
            {isMechaMode ? <Cpu className="w-8 h-8 text-cyan-400 animate-pulse" /> : <Shield className="w-8 h-8 text-cyan-400" />}
            <span className="absolute -bottom-1.5 px-1 bg-cyan-900 border border-cyan-400 text-[10px] font-mono-stat font-bold text-white rounded">
              Lv.{player.level}
            </span>
          </button>

          {/* Vitals Cluster */}
          <div className="flex flex-col gap-1.5 min-w-[190px]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-100 flex items-center gap-1.5 tracking-wide">
                {player.playerName}
                <span className="text-[10px] text-cyan-400/80 font-mono-stat">[{player.authType.toUpperCase()}]</span>
              </span>
              <span className={`px-1.5 py-0.5 text-[10px] font-bold border rounded font-mono-stat ${getRankBadgeColor(player.adventurerRank)}`}>
                Rank {player.adventurerRank}
              </span>
            </div>

            <div className="text-[11px] text-cyan-300/80 font-semibold truncate flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              {currentJobTitle}
            </div>

            {/* HP Bar */}
            <div className="w-full bg-slate-900/90 border border-red-900/40 rounded-full h-2.5 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-150"
                style={{ width: `${Math.min(100, (player.stats.hp / player.stats.maxHp) * 100)}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-[9px] font-mono-stat text-white/90 drop-shadow">
                {Math.round(player.stats.hp)} / {player.stats.maxHp} HP
              </div>
            </div>

            {/* EXP Bar */}
            <div className="w-full bg-slate-900/90 border border-amber-900/40 rounded-full h-2 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-150"
                style={{ width: `${Math.min(100, (player.currentExp / player.nextLevelExp) * 100)}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-[8px] font-mono-stat text-white/90 drop-shadow">
                {player.currentExp} / {player.nextLevelExp} EXP
              </div>
            </div>
          </div>
        </div>

        {/* Top-Center: SAFE ZONE / WILDERNESS INDICATOR */}
        <div className="pointer-events-auto self-start">
          <div
            onClick={onOpenWorldMap}
            title="Click to Open Full World Map [M]"
            className={`px-3 py-1.5 rounded-full border text-xs font-mono-stat font-bold flex items-center gap-2 shadow-lg cursor-pointer transition-all hover:scale-105 ${
              isInsideTown
                ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-emerald-500/30'
                : 'bg-red-950/90 border-red-500 text-red-300 shadow-red-500/30'
            }`}
          >
            {isInsideTown ? (
              <>
                <Shield className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>SAFE TOWN (Non-Combat Area · HP Regen)</span>
              </>
            ) : (
              <>
                <Swords className="w-4 h-4 text-red-400 animate-pulse" />
                <span>WILDERNESS (PK / Combat Active)</span>
              </>
            )}
            <span className="text-[10px] px-1 bg-black/60 rounded text-slate-300 font-normal">[M] Map</span>
          </div>
        </div>

        {/* Top-Right: Resources, Territory Status & Quick Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Territory Resources Cluster */}
          <div className="flex items-center gap-2.5 bg-slate-950/85 border border-cyan-500/30 rounded-xl px-3 py-2 text-xs shadow-xl font-mono-stat">
            <div className="flex items-center gap-1 text-emerald-400" title="Frontier Timber">
              <TreePine className="w-3.5 h-3.5" />
              <span className="font-bold">{player.resources.wood}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-400" title="Iron & Mineral Ore">
              <Hammer className="w-3.5 h-3.5" />
              <span className="font-bold">{player.resources.ore}</span>
            </div>
            <div className="flex items-center gap-1 text-cyan-400" title="Pure Aether Crystals">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="font-bold">{player.resources.aether}</span>
            </div>
            <div className="flex items-center gap-1 text-blue-400" title="Mecha Scrap & Parts">
              <Cpu className="w-3.5 h-3.5" />
              <span className="font-bold">{player.resources.mechaScrap}</span>
            </div>
            <div className="flex items-center gap-1 text-yellow-400 border-l border-slate-700 pl-2" title="Gold Credits">
              <Coins className="w-3.5 h-3.5" />
              <span className="font-bold">{player.gold}</span>
            </div>
          </div>

          {/* Audio and Pause Buttons */}
          <div className="flex items-center gap-1 bg-slate-950/85 border border-cyan-500/30 rounded-xl p-1 shadow-xl">
            {onSaveGame && (
              <button
                onClick={onSaveGame}
                className="p-1.5 px-2 text-emerald-300 hover:text-emerald-200 hover:bg-emerald-950/70 border border-emerald-500/40 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-mono-stat"
                title="Save Pioneer Progress"
              >
                <Save className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Save</span>
              </button>
            )}
            <button
              onClick={onToggleMute}
              className="p-1.5 text-slate-300 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
            <button
              onClick={onTogglePause}
              className="p-1.5 text-slate-300 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Pause Game / Settings (Esc)"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ACTIVE BUILD NOTICE IF PLACING */}
      {buildPlacingType && (
        <div className="pointer-events-auto self-center bg-cyan-950/90 border-2 border-cyan-400 text-cyan-100 px-6 py-2 rounded-full shadow-2xl flex items-center gap-4 animate-bounce">
          <span className="text-sm font-bold tracking-wide">
            Placing {buildPlacingType.replace('_', ' ').toUpperCase()} (Left-Click map to place)
          </span>
          <button
            onClick={onCancelBuild}
            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold cursor-pointer"
          >
            Cancel [Right-Click]
          </button>
        </div>
      )}

      {/* BOTTOM ROW */}
      <div className="flex justify-between items-end w-full gap-2">
        {/* Bottom-Left: Active Unique Player Quest Tracker */}
        <div className="pointer-events-auto bg-slate-950/85 border border-cyan-500/30 rounded-xl p-3 shadow-xl max-w-xs">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              {activeQuest.isPlayerUnique ? 'Unique Destiny Quest' : 'Guild Bounty'}
            </div>
            <span className={`px-1.5 py-0.5 text-[10px] font-bold border rounded font-mono-stat ${getRankBadgeColor(activeQuest.rank)}`}>
              Rank {activeQuest.rank}
            </span>
          </div>

          <div className="text-xs font-bold text-slate-100 truncate mb-1">{activeQuest.title}</div>

          <div className="flex flex-col gap-1 text-[11px] font-mono-stat">
            {activeQuest.objectives.map((obj, idx) => (
              <div key={idx} className="flex justify-between items-center text-slate-300">
                <span className="truncate max-w-[170px]">• {obj.targetName}</span>
                <span className={`font-bold ${obj.current >= obj.required ? 'text-emerald-400' : 'text-cyan-400'}`}>
                  {obj.current} / {obj.required}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom-Center: Skill Quickbar & Mecha Button */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-950/85 border border-cyan-500/30 rounded-2xl p-2 shadow-2xl">
          <button
            onClick={onToggleMecha}
            className={`relative flex flex-col items-center justify-center px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
              isMechaMode
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-300 text-white shadow-lg shadow-cyan-500/40 animate-pulse'
                : 'bg-slate-900 border-cyan-500/30 text-cyan-300 hover:border-cyan-400'
            }`}
          >
            <Cpu className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold tracking-wider uppercase">
              {isMechaMode ? 'Mecha Active' : 'Mecha'}
            </span>
            <span className="text-[9px] text-cyan-200 font-mono-stat">[R]</span>
          </button>

          {/* Action Slots 1 to 4 */}
          {[0, 1, 2, 3].map((slotIdx) => {
            const skillId = player.activeSkills[slotIdx];
            const skillNode = INITIAL_SKILL_NODES.find((s) => s.id === skillId);
            const isAssigned = !!skillNode;

            return (
              <div
                key={slotIdx}
                className="relative flex flex-col items-center justify-center w-11 h-13 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-cyan-400 text-slate-200 transition-colors"
                title={isAssigned ? `${skillNode.name}: ${skillNode.effectDescription}` : 'Empty Slot (Assign in Skill Tree)'}
              >
                {isAssigned ? (
                  <>
                    <Zap className="w-4 h-4 text-cyan-400 mb-0.5" />
                    <span className="text-[8px] text-slate-300 font-semibold truncate max-w-[36px] px-0.5">
                      {skillNode.name.split(' ')[0]}
                    </span>
                  </>
                ) : (
                  <span className="text-slate-600 text-xs">-</span>
                )}
                <span className="absolute -top-1.5 -left-1 px-1 bg-slate-800 border border-slate-600 text-[8px] font-mono-stat font-bold text-cyan-300 rounded">
                  {slotIdx + 1}
                </span>
              </div>
            );
          })}

          <div
            className="flex flex-col items-center justify-center w-11 h-13 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-200"
            title="Dodge Roll / Dash [Space / Right-Click]"
          >
            <Flame className="w-4 h-4 text-amber-400 mb-0.5" />
            <span className="text-[8px] font-bold text-amber-300">DODGE</span>
            <span className="text-[7px] text-slate-400 font-mono-stat">[Space]</span>
          </div>
        </div>

        {/* Bottom-Right: Modal Buttons (Stats, Guild, Map, Skills, Quests, Build, Job Evolution) */}
        <div className="pointer-events-auto flex items-center gap-1.5 flex-wrap justify-end max-w-md">
          {/* Character Stat Board (SAO / SLF Style) */}
          <button
            onClick={onOpenStatBoard}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-b from-purple-950 to-slate-950 border border-purple-500/60 hover:border-purple-400 text-purple-300 shadow-md hover:scale-105 transition-all cursor-pointer relative"
            title="Character Stat Board & Attributes [C]"
          >
            <User className="w-4 h-4" />
            <span className="text-[8px] font-bold tracking-wider uppercase mt-0.5">Stats</span>
            <span className="text-[7px] text-purple-400/80 font-mono-stat">[C]</span>
            {player.freeStatPoints > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 text-white font-mono-stat font-bold text-[9px] rounded-full flex items-center justify-center shadow animate-bounce">
                {player.freeStatPoints}
              </span>
            )}
          </button>

          {/* Adventurer Guild Outpost & Merchant */}
          <button
            onClick={onOpenGuildShop}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-b from-yellow-950 to-slate-950 border border-yellow-500/60 hover:border-yellow-400 text-yellow-300 shadow-md hover:scale-105 transition-all cursor-pointer"
            title="Adventurer Guild Shop & Trade [G]"
          >
            <Building2 className="w-4 h-4" />
            <span className="text-[8px] font-bold tracking-wider uppercase mt-0.5">Guild</span>
            <span className="text-[7px] text-yellow-400/80 font-mono-stat">[G]</span>
          </button>

          {/* Cartography / World Map */}
          <button
            onClick={onOpenWorldMap}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-b from-cyan-950 to-slate-950 border border-cyan-500/60 hover:border-cyan-400 text-cyan-300 shadow-md hover:scale-105 transition-all cursor-pointer"
            title="Aetheria World Map [M]"
          >
            <Compass className="w-4 h-4" />
            <span className="text-[8px] font-bold tracking-wider uppercase mt-0.5">Map</span>
            <span className="text-[7px] text-cyan-400/80 font-mono-stat">[M]</span>
          </button>

          {/* Daily Bounties */}
          <button
            onClick={onOpenDailyBounties}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-b from-amber-950 to-slate-950 border border-amber-500/60 hover:border-amber-400 text-amber-300 shadow-md hover:scale-105 transition-all cursor-pointer relative"
            title="Daily Bounties [D]"
          >
            <Calendar className="w-4 h-4" />
            <span className="text-[8px] font-bold tracking-wider uppercase mt-0.5">Daily</span>
            <span className="text-[7px] text-amber-400/80 font-mono-stat">[D]</span>
            {unclaimedDailyCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white font-mono-stat font-bold text-[9px] rounded-full flex items-center justify-center shadow animate-bounce">
                {unclaimedDailyCount}
              </span>
            )}
          </button>

          {/* Quests Button */}
          <button
            onClick={onOpenQuests}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-b from-blue-950 to-slate-950 border border-blue-500/50 hover:border-blue-400 text-blue-300 shadow-md hover:scale-105 transition-all cursor-pointer"
            title="Ranked Quest Board [Q]"
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-[8px] font-bold tracking-wider uppercase mt-0.5">Quests</span>
            <span className="text-[7px] text-blue-400/80 font-mono-stat">[Q]</span>
          </button>

          {/* Skill Tree Button */}
          <button
            onClick={onOpenSkillTree}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-b from-cyan-950 to-slate-950 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 shadow-md hover:scale-105 transition-all cursor-pointer relative"
            title="Dynamic Skill Tree [K]"
          >
            <Zap className="w-4 h-4" />
            <span className="text-[8px] font-bold tracking-wider uppercase mt-0.5">Skills</span>
            <span className="text-[7px] text-cyan-400/80 font-mono-stat">[K]</span>
            {player.skillPoints > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-black font-mono-stat font-bold text-[9px] rounded-full flex items-center justify-center shadow">
                {player.skillPoints}
              </span>
            )}
          </button>

          {/* Territory Build Menu */}
          <button
            onClick={onOpenBuildMenu}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-b from-emerald-950 to-slate-950 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 shadow-md hover:scale-105 transition-all cursor-pointer"
            title="Frontier Territory Building [B]"
          >
            <Layers className="w-4 h-4" />
            <span className="text-[8px] font-bold tracking-wider uppercase mt-0.5">Build</span>
            <span className="text-[7px] text-emerald-400/80 font-mono-stat">[B]</span>
          </button>

          {/* Job Evolution Button */}
          <button
            onClick={onOpenJobEvolution}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-b from-amber-950 to-slate-950 border border-amber-500/50 hover:border-amber-400 text-amber-300 shadow-md hover:scale-105 transition-all cursor-pointer"
            title="Specialized Job Evolution [J]"
          >
            <Award className="w-4 h-4" />
            <span className="text-[8px] font-bold tracking-wider uppercase mt-0.5">Evolve</span>
            <span className="text-[7px] text-amber-400/80 font-mono-stat">[J]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
