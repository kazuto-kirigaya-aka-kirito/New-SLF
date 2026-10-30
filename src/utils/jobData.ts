import { BaseJobId, JobEvolution } from '../types/game';

export interface BaseJobInfo {
  id: BaseJobId;
  name: string;
  tagline: string;
  description: string;
  flavor: string;
  roleIcon: string;
  primaryStat: string;
  baseStats: {
    hp: number;
    mana: number;
    mechaEnergy: number;
    atk: number;
    def: number;
    speed: number;
    criticalChance: number;
  };
  startingResourceBonus: {
    wood: number;
    ore: number;
    aether: number;
    mechaScrap: number;
  };
}

export const BASE_JOBS: Record<BaseJobId, BaseJobInfo> = {
  villager: {
    id: 'villager',
    name: 'Frontier Villager',
    tagline: 'Adaptable Pioneer & Builder',
    description: 'Resilient inhabitant of the borderlands. Masters resource foraging, quick territory fortification, and steady all-round combat development.',
    flavor: 'Even the humblest farmer in Shangri-La can excavate the legacy core of an ancient titan.',
    roleIcon: 'Home',
    primaryStat: 'Territory Building & Stamina',
    baseStats: {
      hp: 120,
      mana: 60,
      mechaEnergy: 100,
      atk: 18,
      def: 12,
      speed: 180,
      criticalChance: 0.05,
    },
    startingResourceBonus: {
      wood: 80,
      ore: 50,
      aether: 20,
      mechaScrap: 15,
    },
  },
  merchant: {
    id: 'merchant',
    name: 'Wandering Merchant',
    tagline: 'Relic Appraiser & Tech Smuggler',
    description: 'Calculative purveyor of exotic goods and black-market mech parts. Earns 50% more gold, discounts building costs, and discovers rare scrap.',
    flavor: 'Information and currency conquer Colossi faster than brute steel.',
    roleIcon: 'Coins',
    primaryStat: 'Gold Multiplier & Tech Scrap',
    baseStats: {
      hp: 100,
      mana: 80,
      mechaEnergy: 120,
      atk: 16,
      def: 10,
      speed: 190,
      criticalChance: 0.08,
    },
    startingResourceBonus: {
      wood: 40,
      ore: 60,
      aether: 40,
      mechaScrap: 40,
    },
  },
  fisherman: {
    id: 'fisherman',
    name: 'Abyssal Fisherman',
    tagline: 'Deep Tide Hunter & Harpoon Master',
    description: 'Hardened veteran of turbulent waters. Commands high precision strikes, fluid evasion, and unearths leviathan crystals from subterranean springs.',
    flavor: 'Cast your line into the void; pull up celestial relics.',
    roleIcon: 'Fish',
    primaryStat: 'Dodge Duration & Critical Rate',
    baseStats: {
      hp: 110,
      mana: 70,
      mechaEnergy: 90,
      atk: 20,
      def: 11,
      speed: 195,
      criticalChance: 0.12,
    },
    startingResourceBonus: {
      wood: 60,
      ore: 40,
      aether: 35,
      mechaScrap: 15,
    },
  },
  scavenger: {
    id: 'scavenger',
    name: 'Trash-Game Scavenger',
    tagline: 'Dual-Wielding Glitch Striker (Sunraku Archetype)',
    description: 'Plays games with zero armor for maximum adrenaline. Possesses lightning reflexes, prolonged parry windows, and uncanny intuition for Colossi weaknesses.',
    flavor: 'Armor only slows you down. A true bird-mask master dodges every lethal strike!',
    roleIcon: 'Sword',
    primaryStat: 'Attack Speed & Parry Window',
    baseStats: {
      hp: 95,
      mana: 85,
      mechaEnergy: 110,
      atk: 24,
      def: 8,
      speed: 215,
      criticalChance: 0.18,
    },
    startingResourceBonus: {
      wood: 30,
      ore: 30,
      aether: 30,
      mechaScrap: 45,
    },
  },
  apprentice_smith: {
    id: 'apprentice_smith',
    name: 'Magitech Smith',
    tagline: 'Armor Crafter & Mecha Engineer',
    description: 'Forges cutting-edge alloy armaments and builds mechanized defensive turrets. Upgrades structure durability by 100% and crafts high-caliber armaments.',
    flavor: 'With a heavy hammer and an ether forge, you can reconstruct ancient legacy mechas.',
    roleIcon: 'Hammer',
    primaryStat: 'Defense & Turret Power',
    baseStats: {
      hp: 135,
      mana: 50,
      mechaEnergy: 130,
      atk: 19,
      def: 16,
      speed: 175,
      criticalChance: 0.06,
    },
    startingResourceBonus: {
      wood: 50,
      ore: 80,
      aether: 25,
      mechaScrap: 50,
    },
  },
};

export const JOB_EVOLUTIONS: JobEvolution[] = [
  // Villager Evolutions
  {
    id: 'pioneer_warlord',
    name: 'Pioneer Warlord',
    title: 'Rank A - Sovereign of the Frontier',
    description: 'A leader who forged a bustling frontier metropolis from wilderness. Wields broad-cleave polearms and bolsters allied territory defense turrets.',
    genre: 'action',
    baseJobId: 'villager',
    requiredLevel: 8,
    requiredQuestId: 'destiny_villager_rank_a',
    iconName: 'Shield',
    statBonus: { hp: 120, atk: 25, def: 20, spd: 20, resourceBonus: 0.4 },
    unlockedSkillIds: ['spiral_thrust', 'citadel_barrier'],
  },
  {
    id: 'titan_vanguard',
    name: 'Titan Vanguard Mecha Pilot',
    title: 'Rank SSS - Legacy Colossus Breaker',
    description: 'Harnessed ancient excavation frames into heavy orbital siege armor. Commands devastating seismic stomps and impenetrable kinetic barriers.',
    genre: 'mecha',
    baseJobId: 'villager',
    requiredLevel: 18,
    requiredQuestId: 'destiny_villager_colossus',
    iconName: 'Cpu',
    statBonus: { hp: 250, atk: 55, def: 45, spd: 35, resourceBonus: 0.7 },
    unlockedSkillIds: ['titan_mecha_overdrive', 'citadel_barrier', 'plasma_overcharge'],
    mechaBonus: { pilotTier: 3, laserDmgBonus: 0.6, thrusterSpeed: 60 },
  },

  // Merchant Evolutions
  {
    id: 'high_industrialist',
    name: 'Magitech Industrialist',
    title: 'Rank A - Apex Syndicate Chief',
    description: 'Constructs automated harvesting drone networks and orbital supply pods. Turns scrap into devastating micro-missile arrays.',
    genre: 'mecha',
    baseJobId: 'merchant',
    requiredLevel: 8,
    requiredQuestId: 'destiny_merchant_rank_a',
    iconName: 'Briefcase',
    statBonus: { hp: 80, atk: 30, def: 18, spd: 25, resourceBonus: 1.0 },
    unlockedSkillIds: ['tactical_missile_salvo', 'automated_drone_builder'],
    mechaBonus: { pilotTier: 2, laserDmgBonus: 0.4, thrusterSpeed: 40 },
  },
  {
    id: 'gold_alchemist',
    name: 'Celestial Relic Appraiser',
    title: 'Rank SSS - Omniscient Factor',
    description: 'Transcends simple commerce to transmute pure ether into reality-bending weapons and infinite laser capacitors.',
    genre: 'magitech',
    baseJobId: 'merchant',
    requiredLevel: 18,
    requiredQuestId: 'destiny_merchant_colossus',
    iconName: 'Sparkles',
    statBonus: { hp: 190, atk: 60, def: 35, spd: 40, resourceBonus: 1.5 },
    unlockedSkillIds: ['titan_mecha_overdrive', 'tactical_missile_salvo', 'automated_drone_builder'],
    mechaBonus: { pilotTier: 3, laserDmgBonus: 0.8, thrusterSpeed: 50 },
  },

  // Fisherman Evolutions
  {
    id: 'abyssal_tidecaller',
    name: 'Abyssal Tidecaller',
    title: 'Rank A - Sovereign of the Deep Trenches',
    description: 'Manipulates vortex currents and launches high-velocity hyper-pressurized hydro-needles that pierce through armor.',
    genre: 'adventure',
    baseJobId: 'fisherman',
    requiredLevel: 8,
    requiredQuestId: 'destiny_fisherman_rank_a',
    iconName: 'Waves',
    statBonus: { hp: 110, atk: 32, def: 16, spd: 35, resourceBonus: 0.3 },
    unlockedSkillIds: ['spiral_thrust', 'gale_step'],
  },
  {
    id: 'leviathan_slayer',
    name: 'Cyber Harpooner: Leviathan Slayer',
    title: 'Rank SSS - Deep Ocean Mecha Striker',
    description: 'Equipped with underwater turbine thrusters and plasma harpoons capable of subduing Colossi larger than mountains.',
    genre: 'mecha',
    baseJobId: 'fisherman',
    requiredLevel: 18,
    requiredQuestId: 'destiny_fisherman_colossus',
    iconName: 'Anchor',
    statBonus: { hp: 220, atk: 65, def: 38, spd: 45, resourceBonus: 0.6 },
    unlockedSkillIds: ['titan_mecha_overdrive', 'plasma_overcharge', 'gale_step'],
    mechaBonus: { pilotTier: 3, laserDmgBonus: 0.7, thrusterSpeed: 70 },
  },

  // Scavenger Evolutions (Sunraku Style!)
  {
    id: 'vorpal_blademaster',
    name: 'Vorpal Dual-Blader',
    title: 'Rank A - Knight of the Vorpal Warren',
    description: 'Trained under the master bunnies of Rabbitz. Blends acrobatics with relentless critical dual-strike cascades.',
    genre: 'action',
    baseJobId: 'scavenger',
    requiredLevel: 8,
    requiredQuestId: 'destiny_scavenger_rank_a',
    iconName: 'Zap',
    statBonus: { hp: 100, atk: 45, def: 14, spd: 50, resourceBonus: 0.2 },
    unlockedSkillIds: ['vorpal_dual_strike', 'gale_step', 'parry_counter'],
  },
  {
    id: 'chronos_striker',
    name: 'Phantom Mecha Slayer (Kirin Hunter)',
    title: 'Rank SSS - Tombguard Vanquisher',
    description: 'Inherits the speed of Wezaemon and pilots the Kirin Tactical Mecha Frame. Slices through laser fire and bends temporal perception.',
    genre: 'mecha',
    baseJobId: 'scavenger',
    requiredLevel: 18,
    requiredQuestId: 'destiny_scavenger_colossus',
    iconName: 'Crosshair',
    statBonus: { hp: 210, atk: 80, def: 32, spd: 65, resourceBonus: 0.5 },
    unlockedSkillIds: ['titan_mecha_overdrive', 'crimson_blade_torrent', 'plasma_overcharge'],
    mechaBonus: { pilotTier: 3, laserDmgBonus: 0.9, thrusterSpeed: 80 },
  },

  // Smith Evolutions
  {
    id: 'magitech_gunblade_smith',
    name: 'Magitech Gunblade Smith',
    title: 'Rank A - Master of Hybrid Ordnance',
    description: 'Blends explosive gunnery with razor sharp metallurgy. Can fire shotgun bursts between heavy hammer impacts.',
    genre: 'action',
    baseJobId: 'apprentice_smith',
    requiredLevel: 8,
    requiredQuestId: 'destiny_smith_rank_a',
    iconName: 'Wrench',
    statBonus: { hp: 140, atk: 38, def: 28, spd: 20, resourceBonus: 0.5 },
    unlockedSkillIds: ['plasma_overcharge', 'citadel_barrier'],
  },
  {
    id: 'mecha_frame_engineer',
    name: 'Bahamut Mecha Frame Architect',
    title: 'Rank SSS - Ancient Technology Restorer',
    description: 'The ultimate artisan who fully restores pre-collapse apocalyptic war frames. Turns personal mechas into flying dreadnoughts.',
    genre: 'mecha',
    baseJobId: 'apprentice_smith',
    requiredLevel: 18,
    requiredQuestId: 'destiny_smith_colossus',
    iconName: 'Layers',
    statBonus: { hp: 260, atk: 62, def: 52, spd: 35, resourceBonus: 0.9 },
    unlockedSkillIds: ['titan_mecha_overdrive', 'tactical_missile_salvo', 'automated_drone_builder'],
    mechaBonus: { pilotTier: 3, laserDmgBonus: 1.0, thrusterSpeed: 65 },
  },
];
