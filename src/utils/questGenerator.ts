import { BaseJobId, Quest, RankTier } from '../types/game';

// Deterministic PRNG seeded from player unique ID
function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
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

interface Patron {
  name: string;
  title: string;
  avatar: string;
  lore: string;
}

const PATRON_ARCHETYPES: Patron[] = [
  {
    name: 'Emul',
    title: 'Vorpal Rabbit Guide of Rabituza',
    avatar: '🐰',
    lore: 'An expressive vorpal rabbit emissary dressed in a tiny silk vest, dispatched by the King of Beasts to guide a chosen pioneer.',
  },
  {
    name: 'Vysache',
    title: 'The Vorpal Colossus King',
    avatar: '🐇',
    lore: 'A towering, pipe-smoking giant rabbit who oversees the sacred Coliseum trials and honors true grit over cowardly defense.',
  },
  {
    name: 'Bilac',
    title: 'Automaton Machinist & Heritage Blacksmith',
    avatar: '🤖',
    lore: 'An ancient legacy automaton with emerald optoelectronic sensors capable of reforging pre-collapse Colossus weaponry.',
  },
  {
    name: 'Professor Miranda',
    title: 'Chronos Pioneer & Mecha Scholar',
    avatar: '🔬',
    lore: 'A brilliant pioneer archaeologist researching the apocalyptic war between humankind and the Seven Colossi.',
  },
  {
    name: 'Captain Ironhook',
    title: 'Abyssal Dreadnought Commander',
    avatar: '⚓',
    lore: 'A battle-hardened deep-sea navigator who tracks Leviathans and sunken titan carriers in the fathomless trenches.',
  },
];

export function getPlayerPatron(playerId: string): Patron {
  const seed = stringToSeed(playerId);
  const index = seed % PATRON_ARCHETYPES.length;
  return PATRON_ARCHETYPES[index];
}

export function generatePlayerDestinyQuests(playerId: string, baseJob: BaseJobId): Quest[] {
  const seed = stringToSeed(playerId);
  const rand = seededRandom(seed);
  const patron = getPlayerPatron(playerId);

  const jobFlavors = {
    villager: {
      site: rand() > 0.5 ? 'Sunken Frontier Citadel' : 'Celestial Aether Quarry',
      artifact: rand() > 0.5 ? 'Seed of Aetheria' : 'Titan Heart Keystone',
      colossusTitle: 'The Unyielding Earth Titan',
    },
    merchant: {
      site: rand() > 0.5 ? 'Black Market Mecha Vault' : 'Orbital Scrap Crash-Site',
      artifact: rand() > 0.5 ? 'Alchemical Ledger of Bahamut' : 'Infinite Hyper-Capacitor',
      colossusTitle: 'The Celestial Gilded Dreadnought',
    },
    fisherman: {
      site: rand() > 0.5 ? 'Subterranean Abyssal Trench' : 'Leviathan Coral Spire',
      artifact: rand() > 0.5 ? 'Heart of the Deep Kraken' : 'Hydro-Plasma Trident Core',
      colossusTitle: 'The Deep Abyss Colossus',
    },
    scavenger: {
      site: rand() > 0.5 ? 'Vorpal Warren Hidden Labyrinth' : 'Apocalyptic Tomb of Wezaemon',
      artifact: rand() > 0.5 ? 'Kirin Mecha Flight Synchronizer' : 'Dual Vorpal Moonblades',
      colossusTitle: 'Gravekeeper Wezaemon (Rank SSS)',
    },
    apprentice_smith: {
      site: rand() > 0.5 ? 'Ancient Magitech Foundry' : 'Ruined Mecha Assembly Line',
      artifact: rand() > 0.5 ? 'Promethean Forge Engine' : 'Apex Kirin Frame Schematics',
      colossusTitle: 'The Rampaging Colossus Kirin Mk.IX',
    },
  }[baseJob];

  // Specific procedural variant titles based on seed
  const variantId1 = (seed % 997).toString(16).toUpperCase();
  const variantId2 = ((seed * 7) % 997).toString(16).toUpperCase();

  const quests: Quest[] = [
    // Rank E - Starting Awakening
    {
      id: `destiny_${baseJob}_awakening`,
      title: `[Destiny-${variantId1}] The Pioneer's Awakening`,
      subtitle: `Patron: ${patron.name}`,
      giver: {
        name: patron.name,
        title: patron.title,
        avatar: patron.avatar,
        dialogue: `Greetings, adventurer! Our fates are entwined by your Pioneer ID #${variantId1}. Step forward and establish our frontier base!`,
      },
      rank: 'E',
      category: 'destiny',
      description: `Establish your footprint in the Frontier. Gather timber and stone, construct an Adventurer Guild Hall, and repel early beast scouts.`,
      loreRef: `Shangri-La Pioneer Guild Record #${variantId1}`,
      requiredLevel: 1,
      objectives: [
        { type: 'gather', targetId: 'wood', targetName: 'Frontier Timber', required: 40, current: 0 },
        { type: 'gather', targetId: 'ore', targetName: 'Iron Ore', required: 25, current: 0 },
        { type: 'build', targetId: 'guild_hall', targetName: 'Adventurer Guild Hall', required: 1, current: 0 },
        { type: 'kill', targetId: 'beast_horn_rabbit', targetName: 'Horned Creepers (Rank E)', required: 3, current: 0 },
      ],
      rewards: {
        exp: 250,
        gold: 150,
        skillPoints: 2,
        items: ['Frontier Pioneer Sigil'],
      },
      isCompleted: false,
      isActive: true,
      isClaimed: false,
      isPlayerUnique: true,
    },

    // Rank C - Mecha & Defense Expansion
    {
      id: `destiny_${baseJob}_rank_c`,
      title: `[Destiny-${variantId2}] Foundry of ${jobFlavors.site}`,
      subtitle: `Patron: ${patron.name}`,
      giver: {
        name: patron.name,
        title: patron.title,
        avatar: patron.avatar,
        dialogue: `Intriguing readings! The resonance of your Pioneer License has uncovered remnants of ${jobFlavors.site}. We need a Mecha Hangar!`,
      },
      rank: 'C',
      category: 'destiny',
      description: `Construct a Mecha Hangar and Defense Turret to secure your frontier territory against Rank C Behemoths.`,
      loreRef: `Ancient Mechanized Era Archives`,
      requiredLevel: 4,
      objectives: [
        { type: 'build', targetId: 'mecha_hangar', targetName: 'Tactical Mecha Hangar', required: 1, current: 0 },
        { type: 'build', targetId: 'defense_turret', targetName: 'Pulse Defense Turret', required: 1, current: 0 },
        { type: 'kill', targetId: 'behemoth_mud_digger', targetName: 'Mud-Digger Behemoths (Rank C)', required: 4, current: 0 },
      ],
      rewards: {
        exp: 650,
        gold: 400,
        skillPoints: 3,
        items: ['Mark-II Mecha Reactor Component'],
      },
      isCompleted: false,
      isActive: false,
      isClaimed: false,
      isPlayerUnique: true,
    },

    // Rank A - Job Evolution Quest Milestone 1!
    {
      id: `destiny_${baseJob}_rank_a`,
      title: `[Specialization Trial] The ${jobFlavors.artifact}`,
      subtitle: `Patron: ${patron.name}`,
      giver: {
        name: patron.name,
        title: patron.title,
        avatar: patron.avatar,
        dialogue: `You have proven yourself far beyond a simple ${baseJob}. The trial to claim the ${jobFlavors.artifact} and evolve your specialized role has arrived!`,
      },
      rank: 'A',
      category: 'destiny',
      description: `Fell the Ancient Magitech Automaton and recover the ${jobFlavors.artifact}. Completing this unlocks your Rank A Specialized Job evolution!`,
      loreRef: `Coliseum of the Vorpal Warrens`,
      requiredLevel: 8,
      objectives: [
        { type: 'kill', targetId: 'automaton_ancient_guardian', targetName: 'Ancient Magitech Automaton (Rank A)', required: 1, current: 0 },
        { type: 'gather', targetId: 'aether', targetName: 'Pure Aether Shards', required: 30, current: 0 },
        { type: 'gather', targetId: 'mechaScrap', targetName: 'Mecha Core Scraps', required: 25, current: 0 },
      ],
      rewards: {
        exp: 1500,
        gold: 1200,
        skillPoints: 5,
        relicName: jobFlavors.artifact,
        unlockedJobId: `${baseJob === 'villager' ? 'pioneer_warlord' : baseJob === 'merchant' ? 'high_industrialist' : baseJob === 'fisherman' ? 'abyssal_tidecaller' : baseJob === 'scavenger' ? 'vorpal_blademaster' : 'magitech_gunblade_smith'}`,
      },
      isCompleted: false,
      isActive: false,
      isClaimed: false,
      isPlayerUnique: true,
    },

    // Rank SSS - Ultimate Colossus Battle! (SLF Wezaemon / Colossi Reference!)
    {
      id: `destiny_${baseJob}_colossus`,
      title: `[Colossus Raid: SSS] Confronting ${jobFlavors.colossusTitle}`,
      subtitle: `Patron: ${patron.name}`,
      giver: {
        name: patron.name,
        title: patron.title,
        avatar: patron.avatar,
        dialogue: `The heavens tremble! ${jobFlavors.colossusTitle} has awakened at the horizon. Mount your Tactical Mecha, summon all your skills, and etch your Pioneer ID in history!`,
      },
      rank: 'SSS',
      category: 'colossus',
      description: `Survive against the highest-ranked legendary entity in Shangri-La Frontier. Slay the Colossus to unlock the Apex Rank SSS Mecha / Celestial Role!`,
      loreRef: `The Seven Great Colossi of Shangri-La`,
      requiredLevel: 15,
      objectives: [
        { type: 'kill', targetId: 'colossus_wezaemon', targetName: 'Gravekeeper Wezaemon / Colossus (Rank SSS)', required: 1, current: 0 },
        { type: 'build', targetId: 'refinery', targetName: 'Aether Refinery Core', required: 1, current: 0 },
      ],
      rewards: {
        exp: 5000,
        gold: 6000,
        skillPoints: 10,
        relicName: 'Heart of the Colossus Kirin',
        unlockedJobId: `${baseJob === 'villager' ? 'titan_vanguard' : baseJob === 'merchant' ? 'gold_alchemist' : baseJob === 'fisherman' ? 'leviathan_slayer' : baseJob === 'scavenger' ? 'chronos_striker' : 'mecha_frame_engineer'}`,
      },
      isCompleted: false,
      isActive: false,
      isClaimed: false,
      isPlayerUnique: true,
    },
  ];

  return quests;
}

export function generateBountyBoardQuests(playerLevel: number): Quest[] {
  const bounties: Quest[] = [
    {
      id: 'bounty_iron_hide_boar',
      title: '[Bounty: Rank D] Ironhide Scrap Boars',
      subtitle: 'Frontier Guild Bounty',
      giver: {
        name: 'Guild Receptionist',
        title: 'Frontier Registrar',
        avatar: '📜',
        dialogue: 'Wild boars infused with scrap alloy are tearing up agricultural plots. Put them down!',
      },
      rank: 'D',
      category: 'bounty',
      description: 'Hunt 5 Ironhide Boars roaming in the outskirts of the territory.',
      loreRef: 'Guild Bounty Board #104',
      requiredLevel: 2,
      objectives: [
        { type: 'kill', targetId: 'beast_ironhide_boar', targetName: 'Ironhide Boar (Rank D)', required: 5, current: 0 },
      ],
      rewards: {
        exp: 350,
        gold: 250,
        skillPoints: 1,
      },
      isCompleted: false,
      isActive: true,
      isClaimed: false,
      isPlayerUnique: false,
    },
    {
      id: 'bounty_cyber_raptor',
      title: '[Bounty: Rank B] Cybernetic Raptor Flock',
      subtitle: 'Techno-Wasteland Hunt',
      giver: {
        name: 'Wandering Scout',
        title: 'Recon Specialist',
        avatar: '🦅',
        dialogue: 'High-speed bipedal mechanoids are ambushing trading convoys. Take down 4 of them!',
      },
      rank: 'B',
      category: 'bounty',
      description: 'Eliminate 4 Cyber Raptors roaming the mecha scrap field.',
      loreRef: 'Guild Bounty Board #288',
      requiredLevel: 6,
      objectives: [
        { type: 'kill', targetId: 'automaton_cyber_raptor', targetName: 'Cyber Raptor (Rank B)', required: 4, current: 0 },
      ],
      rewards: {
        exp: 850,
        gold: 600,
        skillPoints: 2,
      },
      isCompleted: false,
      isActive: true,
      isClaimed: false,
      isPlayerUnique: false,
    },
    {
      id: 'bounty_void_mantis',
      title: '[Bounty: Rank S] The Vorpal Night-Stalker',
      subtitle: 'Apex Threat Hunt',
      giver: {
        name: 'Vysache',
        title: 'King of Beasts',
        avatar: '🐇',
        dialogue: 'A shadow-stalker blessed with the curse of Lycagon roams the dark thickets. Test your mettle!',
      },
      rank: 'S',
      category: 'bounty',
      description: 'Vanquish the Rank S Shadow Prowler and retrieve its lunar crystal.',
      loreRef: 'Guild Bounty Board #666',
      requiredLevel: 10,
      objectives: [
        { type: 'kill', targetId: 'beast_shadow_prowler', targetName: 'Shadow Prowler (Rank S)', required: 2, current: 0 },
      ],
      rewards: {
        exp: 2200,
        gold: 1800,
        skillPoints: 4,
      },
      isCompleted: false,
      isActive: true,
      isClaimed: false,
      isPlayerUnique: false,
    },
    {
      id: 'bounty_dreadnought_siege_mech',
      title: '[Bounty: Rank SS] Rogue Dreadnought Siege Mech',
      subtitle: 'Cataclysm Protocol Threat',
      giver: {
        name: 'Bilac',
        title: 'Heritage Blacksmith',
        avatar: '🤖',
        dialogue: 'An automated siege frame from the pre-collapse war has rebooted in berserk mode. Destroy it before it razes the frontier!',
      },
      rank: 'SS',
      category: 'bounty',
      description: 'Engage with Tactical Mechas and take down the Rank SS Siege Dreadnought.',
      loreRef: 'Cataclysm Threat Matrix',
      requiredLevel: 14,
      objectives: [
        { type: 'kill', targetId: 'mech_siege_dreadnought', targetName: 'Siege Dreadnought (Rank SS)', required: 1, current: 0 },
      ],
      rewards: {
        exp: 3600,
        gold: 3200,
        skillPoints: 6,
      },
      isCompleted: false,
      isActive: true,
      isClaimed: false,
      isPlayerUnique: false,
    },
  ];

  return bounties;
}
