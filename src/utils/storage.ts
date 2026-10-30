import { BaseJobId, PlayerAccount, Quest } from '../types/game';
import { BASE_JOBS } from './jobData';
import { generateBountyBoardQuests, generatePlayerDestinyQuests } from './questGenerator';
import { INITIAL_SKILL_NODES } from './skillTreeData';
import { ensurePlayerDailyBounties, getCurrentDateKey } from './dailyBountyGenerator';

const STORAGE_PREFIX = 'aetheria_frontier_player_';
const LAST_PLAYER_ID_KEY = 'aetheria_frontier_last_active_id';

export function createNewPlayerAccount(
  playerId: string,
  authType: 'gmail' | 'phone' | 'pioneer_id',
  baseJobId: BaseJobId,
  playerName?: string
): PlayerAccount {
  const baseJob = BASE_JOBS[baseJobId] || BASE_JOBS.villager;
  const now = Date.now();

  const destinyQuests = generatePlayerDestinyQuests(playerId, baseJobId);
  const bounties = generateBountyBoardQuests(1);
  const initialQuests: Quest[] = [...destinyQuests, ...bounties];


  const initialSkills: { [skillId: string]: number } = {};
  INITIAL_SKILL_NODES.forEach((s) => {
    initialSkills[s.id] = s.currentLevel;
  });

  const account: PlayerAccount = {
    playerId: playerId.trim().toLowerCase(),
    authType,
    createdAt: now,
    lastLoginAt: now,
    playerName: playerName?.trim() || playerId.split('@')[0] || `Pioneer-${playerId.slice(0, 6)}`,
    adventurerRank: 'F',
    level: 1,
    currentExp: 0,
    nextLevelExp: 200,
    gold: 250,
    skillPoints: 3,
    attributes: {
      str: 10,
      agi: 10,
      vit: 10,
      int: 10,
      dex: 10,
      luk: 10,
    },
    freeStatPoints: 5,
    inventory: [
      {
        id: 'item_heal_pot_1',
        name: 'High-Grade Healing Salve',
        type: 'potion',
        count: 3,
        value: 40,
        icon: 'FlaskConical',
        description: 'Instant restorative potion brewed with Vorpal forest herbs. Restores 120 HP.',
        effectType: 'heal_hp',
        effectValue: 120,
      },
      {
        id: 'item_energy_cell_1',
        name: 'Aether Overcharge Capsule',
        type: 'buff',
        count: 2,
        value: 75,
        icon: 'Zap',
        description: 'Supercharges Mecha Frame thrusters and recharges 100 Mecha Energy.',
        effectType: 'restore_energy',
        effectValue: 100,
      },
      {
        id: 'item_teleport_stone_1',
        name: 'Town Return Keystone',
        type: 'relic',
        count: 1,
        value: 120,
        icon: 'Home',
        description: 'Instantly teleports the adventurer back to the Safe Town Sanctuary.',
        effectType: 'teleport_town',
      },
    ],
    baseJob: baseJobId,
    currentJobId: baseJobId,
    unlockedJobIds: [baseJobId],
    stats: {
      hp: baseJob.baseStats.hp,
      maxHp: baseJob.baseStats.hp,
      mana: baseJob.baseStats.mana,
      maxMana: baseJob.baseStats.mana,
      mechaEnergy: baseJob.baseStats.mechaEnergy,
      maxMechaEnergy: baseJob.baseStats.mechaEnergy,
      atk: baseJob.baseStats.atk,
      def: baseJob.baseStats.def,
      speed: baseJob.baseStats.speed,
      criticalChance: baseJob.baseStats.criticalChance,
    },
    resources: {
      wood: 120 + baseJob.startingResourceBonus.wood,
      ore: 80 + baseJob.startingResourceBonus.ore,
      aether: 50 + baseJob.startingResourceBonus.aether,
      mechaScrap: 30 + baseJob.startingResourceBonus.mechaScrap,
    },
    skills: initialSkills,
    activeSkills: ['spiral_thrust', null, null, null],
    colossiDefeated: [],
    completedQuestIds: [],
    quests: initialQuests,
    dailyBountiesDate: getCurrentDateKey(),
    dailyStreak: 1,

    territoryBuildings: [
      {
        id: 'starting_beacon_1',
        type: 'pioneer_beacon',
        name: 'Frontier Beacon Alpha',
        x: 0,
        y: 0,
        tier: 1,
        hp: 500,
        maxHp: 500,
        lastProductionTime: now,
        attackCooldown: 0,
      },
    ],
    territoryLevel: 1,
    seed: now,
  };

  const finalAccount = ensurePlayerDailyBounties(account);
  savePlayerAccount(finalAccount);
  return finalAccount;
}

export function savePlayerAccount(account: PlayerAccount): void {
  try {
    const key = STORAGE_PREFIX + account.playerId;
    localStorage.setItem(key, JSON.stringify(account));
    localStorage.setItem(LAST_PLAYER_ID_KEY, account.playerId);
  } catch (err) {
    console.warn('Failed to save to localStorage:', err);
  }
}

export function loadPlayerAccount(playerId: string): PlayerAccount | null {
  try {
    const key = STORAGE_PREFIX + playerId.trim().toLowerCase();
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlayerAccount;
    if (!parsed.attributes) {
      parsed.attributes = { str: 10, agi: 10, vit: 10, int: 10, dex: 10, luk: 10 };
    }
    if (parsed.freeStatPoints === undefined) {
      parsed.freeStatPoints = 5;
    }
    if (!parsed.inventory) {
      parsed.inventory = [
        {
          id: 'item_heal_pot_1',
          name: 'High-Grade Healing Salve',
          type: 'potion',
          count: 3,
          value: 40,
          icon: 'FlaskConical',
          description: 'Instant restorative potion brewed with Vorpal forest herbs. Restores 120 HP.',
          effectType: 'heal_hp',
          effectValue: 120,
        },
      ];
    }
    return ensurePlayerDailyBounties(parsed);
  } catch (err) {
    console.error('Failed to load player account:', err);
    return null;
  }
}



export function getLastActivePlayerId(): string | null {
  try {
    return localStorage.getItem(LAST_PLAYER_ID_KEY);
  } catch {
    return null;
  }
}

export function getAllSavedPlayerIds(): string[] {
  try {
    const result: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        result.push(key.replace(STORAGE_PREFIX, ''));
      }
    }
    return result;
  } catch {
    return [];
  }
}

export function exportPlayerSaveData(account: PlayerAccount): string {
  return JSON.stringify(account, null, 2);
}

export function importPlayerSaveData(jsonString: string): PlayerAccount | null {
  try {
    const parsed = JSON.parse(jsonString) as PlayerAccount;
    if (parsed.playerId && parsed.stats && parsed.quests) {
      savePlayerAccount(parsed);
      return parsed;
    }
    return null;
  } catch (err) {
    console.error('Invalid save data format:', err);
    return null;
  }
}
