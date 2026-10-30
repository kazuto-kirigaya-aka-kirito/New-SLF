/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Monster, PlacedBuilding, PlayerAccount } from './types/game';
import { getLastActivePlayerId, loadPlayerAccount, savePlayerAccount } from './utils/storage';
import { soundFx } from './utils/audio';
import { BUILDING_BLUEPRINTS } from './utils/buildingData';
import { ensurePlayerDailyBounties } from './utils/dailyBountyGenerator';
import { TitleScreen } from './components/TitleScreen';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { SkillTreeModal } from './components/SkillTreeModal';
import { QuestModal } from './components/QuestModal';
import { DailyBountyModal } from './components/DailyBountyModal';
import { JobEvolutionModal } from './components/JobEvolutionModal';
import { BuildingMenuModal } from './components/BuildingMenuModal';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { StatBoardModal } from './components/StatBoardModal';
import { GuildShopModal } from './components/GuildShopModal';
import { WorldMapModal } from './components/WorldMapModal';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'title' | 'playing'>('title');
  const [player, setPlayer] = useState<PlayerAccount | null>(null);

  // Active Modals
  const [isSkillTreeOpen, setIsSkillTreeOpen] = useState(false);
  const [isQuestOpen, setIsQuestOpen] = useState(false);
  const [isDailyBountyOpen, setIsDailyBountyOpen] = useState(false);
  const [isJobEvolutionOpen, setIsJobEvolutionOpen] = useState(false);
  const [isBuildMenuOpen, setIsBuildMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isStatBoardOpen, setIsStatBoardOpen] = useState(false);
  const [isGuildShopOpen, setIsGuildShopOpen] = useState(false);
  const [isWorldMapOpen, setIsWorldMapOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // In-Game Mechanics State
  const [isMechaMode, setIsMechaMode] = useState(false);
  const [isInsideTown, setIsInsideTown] = useState(true);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [teleportTrigger, setTeleportTrigger] = useState(0);
  const [buildPlacingType, setBuildPlacingType] = useState<PlacedBuilding['type'] | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  // Check last active profile on initial load
  useEffect(() => {
    try {
      const lastId = getLastActivePlayerId();
      if (lastId) {
        const savedAcc = loadPlayerAccount(lastId);
        if (savedAcc) {
          setPlayer(ensurePlayerDailyBounties(savedAcc));
        }
      }
    } catch (e) {
      console.warn('Profile load check error:', e);
    }
  }, []);

  // Periodic autosave whenever player state is active
  useEffect(() => {
    if (!player) return;
    const interval = setInterval(() => {
      savePlayerAccount(player);
    }, 4000);
    return () => clearInterval(interval);
  }, [player]);

  const handleStartGame = (account: PlayerAccount) => {
    const verifiedAccount = ensurePlayerDailyBounties(account);
    setPlayer(verifiedAccount);
    savePlayerAccount(verifiedAccount);
    setCurrentScreen('playing');
    setIsPaused(false);
  };

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      soundFx.setMuted(next);
      return next;
    });
  }, []);

  const handleUpdatePlayer = useCallback((updater: (prev: PlayerAccount) => PlayerAccount) => {
    setPlayer((prev) => {
      if (!prev) return prev;
      const updated = updater(prev);
      savePlayerAccount(updated);
      return updated;
    });
  }, []);

  // Check and update quest & daily bounty objectives on monster defeat
  const handleMonsterDefeated = useCallback(
    (monster: Monster) => {
      handleUpdatePlayer((prev) => {
        let newExp = prev.currentExp + monster.expReward;
        let newLevel = prev.level;
        let nextExp = prev.nextLevelExp;
        let newSp = prev.skillPoints;
        let newStatPoints = prev.freeStatPoints;

        // Level Up check (Grants Skill Points & Stat Points!)
        while (newExp >= nextExp) {
          newExp -= nextExp;
          newLevel += 1;
          nextExp = Math.round(nextExp * 1.45);
          newSp += 3;
          newStatPoints += 3; // +3 Free Stat Points to invest in STR/AGI/VIT/INT/DEX/LUK!
          try {
            soundFx.playLevelUp();
          } catch {}
        }

        const nextColossi = [...prev.colossiDefeated];
        if (monster.isColossus && !nextColossi.includes(monster.name)) {
          nextColossi.push(monster.name);
        }

        const monsterMatches = (targetId: string) => {
          const t = targetId.toLowerCase();
          const m = monster.name.toLowerCase();
          return (
            targetId === monster.id ||
            m.includes(t) ||
            (t.includes('colossus') && monster.isColossus) ||
            (t.includes('rabbit') && m.includes('rabbit')) ||
            (t.includes('boar') && m.includes('boar')) ||
            (t.includes('raptor') && m.includes('raptor')) ||
            (t.includes('mud_digger') && m.includes('mud-digger')) ||
            (t.includes('automaton') && monster.type === 'automaton') ||
            (t.includes('shadow_prowler') && m.includes('shadow')) ||
            (t.includes('siege') && m.includes('siege'))
          );
        };

        const updatedQuests = prev.quests.map((q) => {
          const nextObjectives = q.objectives.map((obj) => {
            if (obj.type === 'kill' && monsterMatches(obj.targetId) && obj.current < obj.required) {
              return { ...obj, current: obj.current + 1 };
            }
            return obj;
          });

          const isNowCompleted = nextObjectives.every((o) => o.current >= o.required);
          return {
            ...q,
            objectives: nextObjectives,
            isCompleted: isNowCompleted,
          };
        });

        const updatedDailyBounties = (prev.dailyBounties || []).map((bounty) => {
          if (bounty.type === 'kill' && monsterMatches(bounty.targetId) && bounty.current < bounty.required) {
            const nextCurrent = bounty.current + 1;
            return {
              ...bounty,
              current: nextCurrent,
              isCompleted: nextCurrent >= bounty.required,
            };
          }
          return bounty;
        });

        return {
          ...prev,
          level: newLevel,
          currentExp: newExp,
          nextLevelExp: nextExp,
          skillPoints: newSp,
          freeStatPoints: newStatPoints,
          gold: prev.gold + monster.goldReward,
          colossiDefeated: nextColossi,
          quests: updatedQuests,
          dailyBounties: updatedDailyBounties,
        };
      });
    },
    [handleUpdatePlayer]
  );

  // Check and update quest & daily bounty objectives on resource gather
  const handleResourceGathered = useCallback(
    (type: 'wood' | 'ore' | 'aether' | 'mechaScrap', amount: number) => {
      handleUpdatePlayer((prev) => {
        const nextRes = {
          ...prev.resources,
          [type]: prev.resources[type] + amount,
        };

        const updatedQuests = prev.quests.map((q) => {
          const nextObjectives = q.objectives.map((obj) => {
            if (obj.type === 'gather' && obj.targetId === type) {
              return { ...obj, current: Math.min(obj.required, obj.current + amount) };
            }
            return obj;
          });

          const isNowCompleted = nextObjectives.every((o) => o.current >= o.required);
          return {
            ...q,
            objectives: nextObjectives,
            isCompleted: isNowCompleted,
          };
        });

        const updatedDailyBounties = (prev.dailyBounties || []).map((bounty) => {
          if (bounty.type === 'gather' && bounty.targetId === type) {
            const nextCurrent = Math.min(bounty.required, bounty.current + amount);
            return {
              ...bounty,
              current: nextCurrent,
              isCompleted: nextCurrent >= bounty.required,
            };
          }
          return bounty;
        });

        return {
          ...prev,
          resources: nextRes,
          quests: updatedQuests,
          dailyBounties: updatedDailyBounties,
        };
      });
    },
    [handleUpdatePlayer]
  );

  // Handle building placed in territory
  const handleBuildingPlaced = useCallback(
    (building: PlacedBuilding) => {
      handleUpdatePlayer((prev) => {
        const nextBuildings = [...prev.territoryBuildings, building];

        const blueprint = BUILDING_BLUEPRINTS[building.type];
        const nextWood = Math.max(0, prev.resources.wood - (blueprint?.woodCost || 0));
        const nextOre = Math.max(0, prev.resources.ore - (blueprint?.oreCost || 0));
        const nextAether = Math.max(0, prev.resources.aether - (blueprint?.aetherCost || 0));

        const updatedQuests = prev.quests.map((q) => {
          const nextObjectives = q.objectives.map((obj) => {
            if (obj.type === 'build' && obj.targetId === building.type) {
              return { ...obj, current: Math.min(obj.required, obj.current + 1) };
            }
            return obj;
          });

          const isNowCompleted = nextObjectives.every((o) => o.current >= o.required);
          return {
            ...q,
            objectives: nextObjectives,
            isCompleted: isNowCompleted,
          };
        });

        return {
          ...prev,
          resources: {
            ...prev.resources,
            wood: nextWood,
            ore: nextOre,
            aether: nextAether,
          },
          territoryBuildings: nextBuildings,
          quests: updatedQuests,
        };
      });
      setBuildPlacingType(null);
    },
    [handleUpdatePlayer]
  );

  // Global Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentScreen !== 'playing') return;

      if (e.code === 'Escape') {
        if (buildPlacingType) {
          setBuildPlacingType(null);
          return;
        }
        if (
          isSkillTreeOpen ||
          isQuestOpen ||
          isDailyBountyOpen ||
          isJobEvolutionOpen ||
          isBuildMenuOpen ||
          isProfileOpen ||
          isStatBoardOpen ||
          isGuildShopOpen ||
          isWorldMapOpen
        ) {
          setIsSkillTreeOpen(false);
          setIsQuestOpen(false);
          setIsDailyBountyOpen(false);
          setIsJobEvolutionOpen(false);
          setIsBuildMenuOpen(false);
          setIsProfileOpen(false);
          setIsStatBoardOpen(false);
          setIsGuildShopOpen(false);
          setIsWorldMapOpen(false);
          return;
        }
        setIsPaused((prev) => !prev);
      }

      // Hotkey modals
      if (e.code === 'KeyM') {
        setIsWorldMapOpen((prev) => !prev);
        return;
      }

      if (!isPaused && !isWorldMapOpen) {
        if (e.code === 'KeyK') setIsSkillTreeOpen((prev) => !prev);
        if (e.code === 'KeyQ') setIsQuestOpen((prev) => !prev);
        if (e.code === 'KeyD') setIsDailyBountyOpen((prev) => !prev);
        if (e.code === 'KeyC') setIsStatBoardOpen((prev) => !prev);
        if (e.code === 'KeyG') setIsGuildShopOpen((prev) => !prev);
        if (e.code === 'KeyJ') setIsJobEvolutionOpen((prev) => !prev);
        if (e.code === 'KeyB') setIsBuildMenuOpen((prev) => !prev);
        if (e.code === 'KeyP') setIsProfileOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentScreen,
    buildPlacingType,
    isSkillTreeOpen,
    isQuestOpen,
    isDailyBountyOpen,
    isJobEvolutionOpen,
    isBuildMenuOpen,
    isProfileOpen,
    isStatBoardOpen,
    isGuildShopOpen,
    isWorldMapOpen,
    isPaused,
  ]);

  const handlePlayerPosChange = useCallback((pos: { x: number; y: number }) => {
    setPlayerPos(pos);
  }, []);

  const handleSafeZoneChange = useCallback((inside: boolean) => {
    setIsInsideTown(inside);
  }, []);

  // Respawn after dying: strictly placed inside Safe Town Sacred Fountain (0, 0)!
  const handleRespawn = useCallback(() => {
    setPlayerPos({ x: 0, y: 0 });
    setIsInsideTown(true);
    setTeleportTrigger(Date.now());
    handleUpdatePlayer((prev) => {
      const revived = {
        ...prev,
        stats: {
          ...prev.stats,
          hp: prev.stats.maxHp,
          mana: prev.stats.maxMana,
          mechaEnergy: prev.stats.maxMechaEnergy,
        },
      };
      savePlayerAccount(revived);
      return revived;
    });
  }, [handleUpdatePlayer]);

  // Teleport to town sanctuary from map
  const handleTeleportToTown = useCallback(() => {
    setPlayerPos({ x: 0, y: 0 });
    setIsInsideTown(true);
    setTeleportTrigger(Date.now());
  }, []);

  // Save Progress explicitly to localStorage
  const handleSaveGame = useCallback(() => {
    if (!player) return;
    savePlayerAccount(player);
    const timeStr = new Date().toLocaleTimeString();
    setLastSavedTime(timeStr);
    setSaveNotification(`Progress Saved Successfully (${timeStr})`);
    setTimeout(() => setSaveNotification(null), 3000);
  }, [player]);

  // Save Progress & Exit to Title Screen
  const handleSaveAndExit = useCallback(() => {
    if (player) {
      savePlayerAccount(player);
    }
    setIsPaused(false);
    setCurrentScreen('title');
  }, [player]);

  if (currentScreen === 'title' || !player) {
    return <TitleScreen onStartGame={handleStartGame} />;
  }

  const isDead = player.stats.hp <= 0;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* 60FPS Canvas Layer */}
      <GameCanvas
        player={player}
        onUpdatePlayer={handleUpdatePlayer}
        onMonsterDefeated={handleMonsterDefeated}
        onResourceGathered={handleResourceGathered}
        isMechaMode={isMechaMode}
        setIsMechaMode={setIsMechaMode}
        buildPlacingType={buildPlacingType}
        onBuildingPlaced={handleBuildingPlaced}
        onCancelBuild={() => setBuildPlacingType(null)}
        isPaused={isPaused || isDead || isWorldMapOpen}
        onPlayerPosChange={handlePlayerPosChange}
        onSafeZoneChange={handleSafeZoneChange}
        teleportTrigger={teleportTrigger}
      />

      {/* World-Matched Low-Occlusion HUD */}
      <HUD
        player={player}
        isMechaMode={isMechaMode}
        isInsideTown={isInsideTown}
        onToggleMecha={() => {
          setIsMechaMode((prev) => {
            const next = !prev;
            if (next) {
              try {
                soundFx.playMechaEngage();
              } catch {}
            }
            return next;
          });
        }}
        onOpenSkillTree={() => setIsSkillTreeOpen(true)}
        onOpenQuests={() => setIsQuestOpen(true)}
        onOpenDailyBounties={() => setIsDailyBountyOpen(true)}
        onOpenStatBoard={() => setIsStatBoardOpen(true)}
        onOpenGuildShop={() => setIsGuildShopOpen(true)}
        onOpenWorldMap={() => setIsWorldMapOpen(true)}
        onOpenBuildMenu={() => setIsBuildMenuOpen(true)}
        onOpenJobEvolution={() => setIsJobEvolutionOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onTogglePause={() => setIsPaused((prev) => !prev)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        buildPlacingType={buildPlacingType}
        onCancelBuild={() => setBuildPlacingType(null)}
        onSaveGame={handleSaveGame}
      />

      {/* Floating Save Notification Toast */}
      {saveNotification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none bg-emerald-950/95 border-2 border-emerald-400 text-emerald-200 px-5 py-2.5 rounded-full text-xs font-mono-stat font-bold shadow-2xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          {saveNotification}
        </div>
      )}

      {/* MODALS */}
      {isStatBoardOpen && (
        <StatBoardModal
          player={player}
          onUpdatePlayer={handleUpdatePlayer}
          onClose={() => setIsStatBoardOpen(false)}
        />
      )}

      {isGuildShopOpen && (
        <GuildShopModal
          player={player}
          onUpdatePlayer={handleUpdatePlayer}
          onOpenQuests={() => setIsQuestOpen(true)}
          onClose={() => setIsGuildShopOpen(false)}
        />
      )}

      {isWorldMapOpen && (
        <WorldMapModal
          player={player}
          playerPos={playerPos}
          onTeleportToTown={handleTeleportToTown}
          onClose={() => setIsWorldMapOpen(false)}
        />
      )}

      {isSkillTreeOpen && (
        <SkillTreeModal
          player={player}
          onUpdatePlayer={handleUpdatePlayer}
          onClose={() => setIsSkillTreeOpen(false)}
        />
      )}

      {isDailyBountyOpen && (
        <DailyBountyModal
          player={player}
          onUpdatePlayer={handleUpdatePlayer}
          onClose={() => setIsDailyBountyOpen(false)}
        />
      )}

      {isQuestOpen && (
        <QuestModal
          player={player}
          onUpdatePlayer={handleUpdatePlayer}
          onClose={() => setIsQuestOpen(false)}
        />
      )}

      {isJobEvolutionOpen && (
        <JobEvolutionModal
          player={player}
          onUpdatePlayer={handleUpdatePlayer}
          onClose={() => setIsJobEvolutionOpen(false)}
        />
      )}

      {isBuildMenuOpen && (
        <BuildingMenuModal
          player={player}
          onSelectBlueprintToPlace={(type) => setBuildPlacingType(type)}
          onClose={() => setIsBuildMenuOpen(false)}
        />
      )}

      {isProfileOpen && (
        <PlayerProfileModal
          player={player}
          onSwitchPlayer={(acc) => {
            const verified = ensurePlayerDailyBounties(acc);
            setPlayer(verified);
            savePlayerAccount(verified);
          }}
          onUpdatePlayer={handleUpdatePlayer}
          onClose={() => setIsProfileOpen(false)}
        />
      )}

      {isPaused && (
        <PauseModal
          onResume={() => setIsPaused(false)}
          onRestart={handleRespawn}
          onSaveProgress={handleSaveGame}
          onSaveAndExit={handleSaveAndExit}
          onQuitToTitle={() => {
            savePlayerAccount(player);
            setCurrentScreen('title');
            setIsPaused(false);
          }}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          lastSavedTime={lastSavedTime}
        />
      )}

      {isDead && <GameOverModal onRespawn={handleRespawn} />}
    </div>
  );
}
