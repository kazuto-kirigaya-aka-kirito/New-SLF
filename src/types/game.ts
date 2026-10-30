export type RankTier = 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';

export type BaseJobId = 'villager' | 'merchant' | 'fisherman' | 'scavenger' | 'apprentice_smith';

export interface JobEvolution {
  id: string;
  name: string;
  title: string;
  description: string;
  genre: 'action' | 'adventure' | 'mecha' | 'magitech';
  baseJobId: BaseJobId;
  requiredLevel: number;
  requiredQuestId: string;
  iconName: string;
  statBonus: {
    hp: number;
    atk: number;
    def: number;
    spd: number;
    resourceBonus: number;
  };
  unlockedSkillIds: string[];
  mechaBonus?: {
    pilotTier: number;
    laserDmgBonus: number;
    thrusterSpeed: number;
  };
}

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  branch: 'martial' | 'exploration' | 'mecha';
  tier: number;
  maxLevel: number;
  currentLevel: number;
  spCost: number;
  requiresSkillId?: string;
  requiredPlayerLevel: number;
  type: 'passive' | 'active';
  cooldownSeconds?: number;
  manaCost?: number;
  icon: string;
  effectDescription: string;
}

export interface Quest {
  id: string;
  title: string;
  subtitle: string;
  giver: {
    name: string;
    title: string;
    avatar: string;
    dialogue: string;
  };
  rank: RankTier;
  category: 'destiny' | 'bounty' | 'construction' | 'colossus';
  description: string;
  loreRef: string;
  requiredLevel: number;
  objectives: {
    type: 'kill' | 'gather' | 'build' | 'survive';
    targetId: string;
    targetName: string;
    required: number;
    current: number;
  }[];
  rewards: {
    exp: number;
    gold: number;
    skillPoints: number;
    items?: string[];
    unlockedJobId?: string;
    relicName?: string;
  };
  isCompleted: boolean;
  isActive: boolean;
  isClaimed: boolean;
  isPlayerUnique: boolean;
}

export interface BuildingBlueprint {
  type: 'guild_hall' | 'blacksmith' | 'mecha_hangar' | 'refinery' | 'defense_turret' | 'pioneer_beacon' | 'greenhouse';
  name: string;
  description: string;
  woodCost: number;
  oreCost: number;
  aetherCost: number;
  tier: number;
  maxTier: number;
  benefit: string;
  icon: string;
}

export interface PlacedBuilding {
  id: string;
  type: BuildingBlueprint['type'];
  name: string;
  x: number;
  y: number;
  tier: number;
  hp: number;
  maxHp: number;
  lastProductionTime: number;
  attackCooldown: number;
}

export interface Monster {
  id: string;
  name: string;
  title?: string;
  rank: RankTier;
  isColossus?: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  speed: number;
  attackRange: number;
  attackCooldown: number;
  lastAttackTime: number;
  windupTime: number;
  isWindup: boolean;
  windupProgress: number;
  expReward: number;
  goldReward: number;
  drops: { name: string; chance: number }[];
  size: number;
  color: string;
  type: 'beast' | 'automaton' | 'colossus' | 'dreadnought';
  behavior: 'patrol' | 'chase' | 'boss_phase1' | 'boss_phase2_mecha';
  phase?: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  isPlayer: boolean;
  isMechaLaser?: boolean;
  isMissile?: boolean;
  rangeRemaining: number;
  color: string;
  radius: number;
  pierce?: number;
}

export interface ParticleEffect {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  shape?: 'circle' | 'spark' | 'smoke' | 'ring';
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  mechaEnergy: number;
  maxMechaEnergy: number;
  atk: number;
  def: number;
  speed: number;
  criticalChance: number;
}

export interface DailyBounty {
  id: string;
  title: string;
  category: 'hunting' | 'gathering' | 'colossus';
  rank: RankTier;
  flavor: string;
  type: 'kill' | 'gather';
  targetId: string;
  targetName: string;
  required: number;
  current: number;
  rewardExp: number;
  rewardGold: number;
  bonusTokens?: number;
  isCompleted: boolean;
  isClaimed: boolean;
  expiresAt: number;
}

export interface ItemSlot {
  id: string;
  name: string;
  type: 'potion' | 'buff' | 'material' | 'relic';
  count: number;
  value: number;
  icon: string;
  description: string;
  effectType?: 'heal_hp' | 'restore_energy' | 'boost_atk' | 'teleport_town';
  effectValue?: number;
}

export interface PlayerAttributes {
  str: number; // Increases ATK & Crit DMG
  agi: number; // Increases Speed, Dodge, Crit Rate
  vit: number; // Increases HP & DEF
  int: number; // Increases Mana & Skill Power
  dex: number; // Increases Mecha Damage & Hit Rate
  luk: number; // Increases Drops & Bonus Gold
}

export interface PlayerAccount {
  playerId: string; // email, phone, or custom ID
  authType: 'gmail' | 'phone' | 'pioneer_id';
  createdAt: number;
  lastLoginAt: number;
  playerName: string;
  adventurerRank: RankTier;
  level: number;
  currentExp: number;
  nextLevelExp: number;
  gold: number;
  skillPoints: number;
  attributes: PlayerAttributes;
  freeStatPoints: number;
  inventory: ItemSlot[];
  baseJob: BaseJobId;
  currentJobId: string;
  unlockedJobIds: string[];
  stats: PlayerStats;
  resources: {
    wood: number;
    ore: number;
    aether: number;
    mechaScrap: number;
  };
  skills: { [skillId: string]: number }; // skillId -> level
  activeSkills: (string | null)[]; // 4 slots
  colossiDefeated: string[];
  completedQuestIds: string[];
  quests: Quest[];
  dailyBounties?: DailyBounty[];
  dailyBountiesDate?: string;
  dailyStreak?: number;
  territoryBuildings: PlacedBuilding[];
  territoryLevel: number;
  seed: number;
}


