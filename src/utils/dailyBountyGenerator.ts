import { DailyBounty, PlayerAccount, RankTier } from '../types/game';

function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function getCurrentDateKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function getMidnightResetTimestamp(): number {
  const tomorrow = new Date();
  tomorrow.setHours(24, 0, 0, 0);
  return tomorrow.getTime();
}

export function getDailyCountdownString(): string {
  const diff = Math.max(0, getMidnightResetTimestamp() - Date.now());
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
}

interface BountyBlueprint {
  title: string;
  category: 'hunting' | 'gathering' | 'colossus';
  rank: RankTier;
  flavor: string;
  type: 'kill' | 'gather';
  targetId: string;
  targetName: string;
  baseRequired: number;
  baseExp: number;
  baseGold: number;
  bonusTokens?: number;
}

const HUNTING_POOL: BountyBlueprint[] = [
  {
    title: '[Daily Hunt] Vorpal Warren Containment',
    category: 'hunting',
    rank: 'E',
    flavor: 'Rabituza territory scouts report an influx of aggressive horned rabbits near the border.',
    type: 'kill',
    targetId: 'beast_horn_rabbit',
    targetName: 'Horned Vorpal Rabbits (Rank E)',
    baseRequired: 4,
    baseExp: 450,
    baseGold: 350,
  },
  {
    title: '[Daily Hunt] Scrap Boar Elimination',
    category: 'hunting',
    rank: 'D',
    flavor: 'Tough ironhide beasts are rummaging through machinery supplies. Subdue them swiftly.',
    type: 'kill',
    targetId: 'beast_ironhide_boar',
    targetName: 'Ironhide Boars (Rank D)',
    baseRequired: 4,
    baseExp: 600,
    baseGold: 500,
  },
  {
    title: '[Daily Hunt] Behemoth Subjugation Protocol',
    category: 'hunting',
    rank: 'C',
    flavor: 'Heavy subterranean behemoths are shaking the foundations of the frontier beacon.',
    type: 'kill',
    targetId: 'behemoth_mud_digger',
    targetName: 'Mud-Digger Behemoths (Rank C)',
    baseRequired: 3,
    baseExp: 900,
    baseGold: 750,
    bonusTokens: 1,
  },
  {
    title: '[Daily Hunt] Cyber-Raptor Interception',
    category: 'hunting',
    rank: 'B',
    flavor: 'Fast bipedal mechanoids are patrolling the scrap badlands. Terminate their patrol.',
    type: 'kill',
    targetId: 'automaton_cyber_raptor',
    targetName: 'Cyber Raptors (Rank B)',
    baseRequired: 3,
    baseExp: 1250,
    baseGold: 1000,
    bonusTokens: 1,
  },
  {
    title: '[Daily Elite] Ancient Automaton Core Purge',
    category: 'hunting',
    rank: 'A',
    flavor: 'Pre-collapse defense guardians are awakening. Destroy the Automaton before it powers up.',
    type: 'kill',
    targetId: 'automaton_ancient_guardian',
    targetName: 'Ancient Magitech Automaton (Rank A)',
    baseRequired: 1,
    baseExp: 1800,
    baseGold: 1500,
    bonusTokens: 2,
  },
  {
    title: '[Daily Hunt] Shadow Prowler Exorcism',
    category: 'hunting',
    rank: 'S',
    flavor: 'Dark beasts carrying the curse of Lycagon threaten the perimeter. Hunt the stalker down.',
    type: 'kill',
    targetId: 'beast_shadow_prowler',
    targetName: 'Shadow Prowler (Rank S)',
    baseRequired: 1,
    baseExp: 2600,
    baseGold: 2200,
    bonusTokens: 3,
  },
];

const GATHERING_POOL: BountyBlueprint[] = [
  {
    title: '[Daily Harvest] Frontier Timber Supply',
    category: 'gathering',
    rank: 'E',
    flavor: 'The guild requires high-tensile ancient wood to reinforce fortress watchtowers.',
    type: 'gather',
    targetId: 'wood',
    targetName: 'Frontier Timber',
    baseRequired: 50,
    baseExp: 400,
    baseGold: 300,
  },
  {
    title: '[Daily Excavation] Iron Mineral Logistics',
    category: 'gathering',
    rank: 'D',
    flavor: 'The blacksmith forge requires refined mineral ores to alloy heavy armor plating.',
    type: 'gather',
    targetId: 'ore',
    targetName: 'Iron Ore',
    baseRequired: 35,
    baseExp: 550,
    baseGold: 450,
  },
  {
    title: '[Daily Extract] Pure Aether Crystal Resonance',
    category: 'gathering',
    rank: 'C',
    flavor: 'Aether crystals are at peak harmonic frequency today. Harvest them for energy cells.',
    type: 'gather',
    targetId: 'aether',
    targetName: 'Pure Aether Crystals',
    baseRequired: 20,
    baseExp: 800,
    baseGold: 700,
    bonusTokens: 1,
  },
  {
    title: '[Daily Salvage] Mecha Wreckage Reclamation',
    category: 'gathering',
    rank: 'B',
    flavor: 'Recover ancient mechanical linkages and micro-circuits from fallen titan husks.',
    type: 'gather',
    targetId: 'mechaScrap',
    targetName: 'Titan Mecha Scrap',
    baseRequired: 25,
    baseExp: 1100,
    baseGold: 950,
    bonusTokens: 1,
  },
];

export function generateDailyBounties(playerId: string, playerLevel: number, dateKey: string): DailyBounty[] {
  const seed = stringToSeed(`${playerId}_${dateKey}`);
  const rand = seededRandom(seed);
  const expiresAt = getMidnightResetTimestamp();

  // Select 2 hunting and 1 or 2 gathering bounties based on level
  const selectedHunts: BountyBlueprint[] = [];
  const selectedGathers: BountyBlueprint[] = [];

  // Filter pools by level availability
  const availableHunts = HUNTING_POOL.filter((h) => {
    if (h.rank === 'S' && playerLevel < 8) return false;
    if (h.rank === 'A' && playerLevel < 5) return false;
    if (h.rank === 'B' && playerLevel < 3) return false;
    return true;
  });

  const availableGathers = GATHERING_POOL;

  // Pick 2 distinct hunts
  const shuffledHunts = [...availableHunts].sort(() => rand() - 0.5);
  selectedHunts.push(shuffledHunts[0], shuffledHunts[1] || shuffledHunts[0]);

  // Pick 2 distinct gathers
  const shuffledGathers = [...availableGathers].sort(() => rand() - 0.5);
  selectedGathers.push(shuffledGathers[0], shuffledGathers[1] || shuffledGathers[0]);

  const allBlueprints = [selectedHunts[0], selectedGathers[0], selectedHunts[1], selectedGathers[1]];

  const levelMultiplier = 1 + (playerLevel - 1) * 0.15;

  return allBlueprints.map((bp, idx) => ({
    id: `daily_${dateKey}_${bp.type}_${idx}_${playerId.slice(0, 4)}`,
    title: bp.title,
    category: bp.category,
    rank: bp.rank,
    flavor: bp.flavor,
    type: bp.type,
    targetId: bp.targetId,
    targetName: bp.targetName,
    required: bp.baseRequired,
    current: 0,
    rewardExp: Math.round(bp.baseExp * levelMultiplier),
    rewardGold: Math.round(bp.baseGold * levelMultiplier),
    bonusTokens: bp.bonusTokens || 1,
    isCompleted: false,
    isClaimed: false,
    expiresAt,
  }));
}

export function ensurePlayerDailyBounties(player: PlayerAccount): PlayerAccount {
  const currentDateKey = getCurrentDateKey();

  if (!player.dailyBounties || player.dailyBountiesDate !== currentDateKey || player.dailyBounties.length === 0) {
    const newBounties = generateDailyBounties(player.playerId, player.level, currentDateKey);
    return {
      ...player,
      dailyBounties: newBounties,
      dailyBountiesDate: currentDateKey,
      dailyStreak: player.dailyStreak || 1,
    };
  }

  return player;
}
