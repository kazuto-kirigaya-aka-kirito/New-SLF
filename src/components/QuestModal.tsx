import React, { useState } from 'react';
import { DailyBounty, PlayerAccount, Quest, RankTier } from '../types/game';
import { X, BookOpen, CheckCircle, Award, Sparkles, Shield, User, ChevronRight, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { soundFx } from '../utils/audio';


interface QuestModalProps {
  player: PlayerAccount;
  onUpdatePlayer: (updater: (prev: PlayerAccount) => PlayerAccount) => void;
  onClose: () => void;
}

export const QuestModal: React.FC<QuestModalProps> = ({ player, onUpdatePlayer, onClose }) => {
  const [activeTab, setActiveTab] = useState<'destiny' | 'bounty' | 'daily' | 'all'>('destiny');


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

  const handleClaimQuest = (quest: Quest) => {
    if (!quest.isCompleted || quest.isClaimed) return;

    soundFx.playLevelUp();
    onUpdatePlayer((prev) => {
      // Add rewards
      let newExp = prev.currentExp + quest.rewards.exp;
      let newLevel = prev.level;
      let nextExp = prev.nextLevelExp;
      let newSp = prev.skillPoints + quest.rewards.skillPoints;

      while (newExp >= nextExp) {
        newExp -= nextExp;
        newLevel += 1;
        nextExp = Math.round(nextExp * 1.45);
        newSp += 3;
      }

      // Check job unlock
      let nextUnlockedJobs = [...prev.unlockedJobIds];
      if (quest.rewards.unlockedJobId && !nextUnlockedJobs.includes(quest.rewards.unlockedJobId)) {
        nextUnlockedJobs.push(quest.rewards.unlockedJobId);
      }

      // Update quest state
      const nextQuests = prev.quests.map((q) => {
        if (q.id === quest.id) {
          return { ...q, isClaimed: true };
        }
        return q;
      });

      // Activate next destiny quest if applicable
      const nextDestiny = nextQuests.find((q) => q.category === 'destiny' && !q.isCompleted && !q.isActive);
      if (nextDestiny) {
        nextDestiny.isActive = true;
      }

      return {
        ...prev,
        level: newLevel,
        currentExp: newExp,
        nextLevelExp: nextExp,
        gold: prev.gold + quest.rewards.gold,
        skillPoints: newSp,
        unlockedJobIds: nextUnlockedJobs,
        completedQuestIds: [...prev.completedQuestIds, quest.id],
        quests: nextQuests,
      };
    });
  };

  const handleSetActiveQuest = (questId: string) => {
    onUpdatePlayer((prev) => ({
      ...prev,
      quests: prev.quests.map((q) => ({
        ...q,
        isActive: q.id === questId,
      })),
    }));
  };

  const handleClaimDailyBounty = (bounty: DailyBounty) => {
    if (!bounty.isCompleted || bounty.isClaimed) return;

    soundFx.playLevelUp();
    onUpdatePlayer((prev) => {
      let newExp = prev.currentExp + bounty.rewardExp;
      let newLevel = prev.level;
      let nextExp = prev.nextLevelExp;
      let newSp = prev.skillPoints;

      while (newExp >= nextExp) {
        newExp -= nextExp;
        newLevel += 1;
        nextExp = Math.round(nextExp * 1.45);
        newSp += 3;
      }

      const updatedBounties = (prev.dailyBounties || []).map((b) => {
        if (b.id === bounty.id) {
          return { ...b, isClaimed: true };
        }
        return b;
      });

      return {
        ...prev,
        level: newLevel,
        currentExp: newExp,
        nextLevelExp: nextExp,
        gold: prev.gold + bounty.rewardGold,
        skillPoints: newSp,
        dailyBounties: updatedBounties,
      };
    });
  };

  const filteredQuests = player.quests.filter((q) => {
    if (activeTab === 'destiny') return q.category === 'destiny' || q.category === 'colossus';
    if (activeTab === 'bounty') return q.category === 'bounty';
    return true;
  });

  const dailyBounties = player.dailyBounties || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/30 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950 border border-cyan-400 rounded-lg text-cyan-300">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-fantasy font-bold text-white tracking-wide">
                Ranked Quest Matrix & Pioneer Trials
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Unique player storylines seeded from your Pioneer ID, daily contracts, and guild bounties.
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

        {/* Tab Selector */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-800 bg-slate-900/40 text-xs flex-wrap">
          <button
            onClick={() => setActiveTab('destiny')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'destiny'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Unique Player Destiny Line
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Daily Bounties ({dailyBounties.filter((b) => !b.isClaimed).length})
          </button>
          <button
            onClick={() => setActiveTab('bounty')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'bounty'
                ? 'bg-blue-500 text-black shadow-md shadow-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Guild Bounty Board
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-200 text-black shadow-md'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900'
            }`}
          >
            All Quests ({player.quests.length})
          </button>
        </div>

        {/* Quest / Daily Bounty List */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'daily' ? (
            dailyBounties.map((bounty) => {
              const isDone = bounty.current >= bounty.required;
              return (
                <div
                  key={bounty.id}
                  className={`p-4 rounded-xl border transition-all ${
                    bounty.isClaimed
                      ? 'bg-slate-950/60 border-slate-800 opacity-70'
                      : isDone
                      ? 'bg-amber-950/40 border-amber-400/80 shadow-lg shadow-amber-950/40'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2 py-0.5 text-[10px] font-bold border rounded font-mono-stat ${getRankBadgeColor(bounty.rank)}`}>
                          Rank {bounty.rank}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] bg-amber-950 text-amber-300 border border-amber-500/50 rounded font-bold uppercase">
                          Daily Task
                        </span>
                        <h3 className="text-sm font-bold text-white">{bounty.title}</h3>
                      </div>
                      <p className="text-xs text-slate-300 italic mb-1.5">"{bounty.flavor}"</p>
                      <div className="text-xs font-mono-stat text-cyan-300 font-semibold">
                        Target: {bounty.targetName}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono-stat bg-slate-950 border border-slate-800 p-2 rounded-lg self-start">
                      <span className="text-amber-400 font-bold">+{bounty.rewardExp} EXP</span>
                      <span className="text-yellow-300 font-bold">+{bounty.rewardGold} Gold</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-3">
                    <div className="text-xs font-mono-stat text-slate-300">
                      Progress: <span className={isDone ? 'text-emerald-400 font-bold' : 'text-cyan-400'}>{bounty.current} / {bounty.required}</span>
                    </div>

                    <div>
                      {bounty.isClaimed ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold font-mono-stat">
                          <CheckCircle2 className="w-4 h-4" />
                          Claimed
                        </span>
                      ) : isDone ? (
                        <button
                          onClick={() => handleClaimDailyBounty(bounty)}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-bold text-xs rounded-lg shadow-md flex items-center gap-1 cursor-pointer animate-pulse"
                        >
                          <Award className="w-3.5 h-3.5" />
                          Claim Reward
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500 font-mono-stat">In Progress</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            filteredQuests.map((quest) => {

            const isFinished = quest.objectives.every((o) => o.current >= o.required);
            const isClaimed = quest.isClaimed;

            return (
              <div
                key={quest.id}
                className={`p-4 rounded-xl border transition-all ${
                  quest.isActive
                    ? 'bg-slate-900/90 border-cyan-500/60 shadow-lg shadow-cyan-950/40'
                    : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl p-2 bg-slate-900 border border-slate-800 rounded-lg">
                      {quest.giver.avatar}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 text-xs font-bold border rounded font-mono-stat ${getRankBadgeColor(quest.rank)}`}>
                          Rank {quest.rank}
                        </span>
                        <h3 className="text-base font-bold text-white">{quest.title}</h3>
                        {quest.isPlayerUnique && (
                          <span className="px-2 py-0.5 text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-400/50 rounded font-semibold">
                            Player Seed Exclusive
                          </span>
                        )}
                        {quest.isActive && (
                          <span className="px-2 py-0.5 text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/50 rounded font-bold">
                            Active Tracker
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 mt-1">
                        <span className="text-cyan-300 font-semibold">{quest.giver.name}</span> · {quest.giver.title}
                      </div>
                      <div className="text-xs text-slate-300 italic mt-1 bg-slate-900/60 border-l-2 border-cyan-500 pl-2 py-1">
                        "{quest.giver.dialogue}"
                      </div>
                    </div>
                  </div>

                  {/* Rewards preview */}
                  <div className="flex items-center gap-2 text-xs font-mono-stat bg-slate-900 border border-slate-800 p-2 rounded-lg self-start">
                    <span className="text-amber-400">+{quest.rewards.exp} EXP</span>
                    <span className="text-yellow-300">+{quest.rewards.gold} Gold</span>
                    <span className="text-cyan-300">+{quest.rewards.skillPoints} SP</span>
                    {quest.rewards.unlockedJobId && (
                      <span className="text-emerald-400 font-bold border-l border-slate-700 pl-2 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        Role Unlock
                      </span>
                    )}
                  </div>
                </div>

                {/* Objectives Progress */}
                <div className="space-y-2 mb-3 bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Objectives:</div>
                  {quest.objectives.map((obj, idx) => {
                    const done = obj.current >= obj.required;
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs font-mono-stat">
                        <span className="text-slate-300 flex items-center gap-2">
                          {done ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-cyan-400" />
                          )}
                          {obj.targetName}
                        </span>
                        <span className={done ? 'text-emerald-400 font-bold' : 'text-cyan-400'}>
                          {obj.current} / {obj.required}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] text-slate-500 font-mono-stat">
                    {quest.loreRef}
                  </div>

                  <div className="flex items-center gap-2">
                    {!quest.isActive && !isClaimed && (
                      <button
                        onClick={() => handleSetActiveQuest(quest.id)}
                        className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg cursor-pointer"
                      >
                        Set as Active Tracker
                      </button>
                    )}

                    {isFinished && !isClaimed && (
                      <button
                        onClick={() => handleClaimQuest(quest)}
                        className="px-4 py-1.5 text-xs font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black rounded-lg shadow-lg shadow-emerald-500/30 flex items-center gap-1 cursor-pointer animate-pulse"
                      >
                        <Award className="w-4 h-4" />
                        Claim Rewards
                      </button>
                    )}

                    {isClaimed && (
                      <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold font-mono-stat">
                        <CheckCircle className="w-4 h-4" />
                        Completed & Claimed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          }))}
        </div>
      </div>
    </div>
  );
};

