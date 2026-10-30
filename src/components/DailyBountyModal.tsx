import React, { useState, useEffect } from 'react';
import { DailyBounty, PlayerAccount, RankTier } from '../types/game';
import { getDailyCountdownString } from '../utils/dailyBountyGenerator';
import { X, Calendar, Clock, Award, CheckCircle2, Flame, Sparkles, Coins, Zap, Shield, ChevronRight } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface DailyBountyModalProps {
  player: PlayerAccount;
  onUpdatePlayer: (updater: (prev: PlayerAccount) => PlayerAccount) => void;
  onClose: () => void;
}

export const DailyBountyModal: React.FC<DailyBountyModalProps> = ({ player, onUpdatePlayer, onClose }) => {
  const [countdown, setCountdown] = useState(getDailyCountdownString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getDailyCountdownString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  const handleClaimDailyBounty = (bounty: DailyBounty) => {
    if (!bounty.isCompleted || bounty.isClaimed) return;

    soundFx.playLevelUp();
    soundFx.playCritical();

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

  const bounties = player.dailyBounties || [];
  const completedCount = bounties.filter((b) => b.isCompleted).length;
  const allClaimed = bounties.length > 0 && bounties.every((b) => b.isClaimed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 select-none">
      <div className="relative w-full max-w-3xl bg-slate-950 border border-amber-500/50 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/30 bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-950 border border-amber-400 rounded-xl text-amber-300 shadow-md shadow-amber-500/20">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-fantasy font-bold text-white tracking-wide">
                  Daily Frontier Bounties
                </h2>
                <span className="px-2 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded-full font-mono-stat uppercase tracking-wider">
                  Time-Limited
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans mt-0.5">
                Complete daily hunting and gathering operations for bonus Gold, EXP, and Pioneer merits.
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

        {/* Status & Countdown Bar */}
        <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-4 text-xs font-mono-stat">
          <div className="flex items-center gap-2 text-cyan-300">
            <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Next Daily Reset: </span>
            <span className="font-bold text-white bg-slate-950 px-2.5 py-1 rounded border border-slate-700">
              {countdown}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-amber-300">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Daily Streak: </span>
              <span className="font-bold text-white">{player.dailyStreak || 1} Days</span>
            </div>
            <div className="text-slate-400 border-l border-slate-700 pl-3">
              Cleared: <span className="font-bold text-emerald-400">{completedCount}</span> / {bounties.length}
            </div>
          </div>
        </div>

        {/* Bounty Cards Grid */}
        <div className="p-6 overflow-y-auto space-y-4">
          {bounties.map((bounty) => {
            const isDone = bounty.current >= bounty.required;
            const progressPct = Math.min(100, Math.round((bounty.current / bounty.required) * 100));

            return (
              <div
                key={bounty.id}
                className={`p-4 rounded-xl border transition-all ${
                  bounty.isClaimed
                    ? 'bg-slate-950/70 border-slate-800 opacity-70'
                    : isDone
                    ? 'bg-amber-950/40 border-amber-400/80 shadow-lg shadow-amber-950/40'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`px-2 py-0.5 text-[10px] font-bold border rounded font-mono-stat ${getRankBadgeColor(bounty.rank)}`}>
                        Rank {bounty.rank}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded font-semibold uppercase">
                        {bounty.category}
                      </span>
                      <h3 className="text-sm font-bold text-white tracking-wide">{bounty.title}</h3>
                    </div>

                    <p className="text-xs text-slate-300 italic mb-1.5">"{bounty.flavor}"</p>

                    <div className="text-xs font-mono-stat text-cyan-300 font-semibold flex items-center gap-1">
                      Target: {bounty.targetName}
                    </div>
                  </div>

                  {/* Rewards preview */}
                  <div className="flex sm:flex-col items-end gap-1 font-mono-stat text-xs shrink-0 bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-amber-400 font-bold">+{bounty.rewardExp} EXP</span>
                    <span className="text-yellow-300 font-bold">+{bounty.rewardGold} Gold</span>
                  </div>
                </div>

                {/* Progress Bar & Actions */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 max-w-md">
                    <div className="flex justify-between text-[11px] font-mono-stat mb-1">
                      <span className="text-slate-400">Progress:</span>
                      <span className={isDone ? 'text-emerald-400 font-bold' : 'text-cyan-300'}>
                        {bounty.current} / {bounty.required} ({progressPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isDone ? 'bg-gradient-to-r from-emerald-500 to-amber-400' : 'bg-cyan-500'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    {bounty.isClaimed ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold font-mono-stat py-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Reward Claimed
                      </span>
                    ) : isDone ? (
                      <button
                        onClick={() => handleClaimDailyBounty(bounty)}
                        className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-bold text-xs rounded-lg shadow-lg shadow-amber-500/30 flex items-center gap-1.5 cursor-pointer animate-pulse transition-transform hover:scale-105"
                      >
                        <Award className="w-4 h-4" />
                        Claim Bonus Rewards!
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500 font-mono-stat">In Progress...</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {allClaimed && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-center space-y-1">
              <div className="text-sm font-bold text-emerald-300 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                All Daily Bounties Cleared!
              </div>
              <p className="text-xs text-slate-300">
                Outstanding dedication, Pioneer! Return after the midnight reset for fresh high-tier bounties.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
