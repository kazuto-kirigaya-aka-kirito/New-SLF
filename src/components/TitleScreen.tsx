import React, { useState, useEffect } from 'react';
import { BaseJobId, PlayerAccount } from '../types/game';
import { BASE_JOBS } from '../utils/jobData';
import {
  Shield,
  Sparkles,
  Mail,
  Phone,
  Fingerprint,
  ChevronRight,
  Play,
  Swords,
  Cpu,
  Anchor,
  Hammer,
  Home,
  Zap,
  CheckCircle2,
  Calendar,
  Coins,
  Crosshair,
  ArrowDown,
  Layers,
  MapPin,
  Building2,
} from 'lucide-react';
import { createNewPlayerAccount, getAllSavedPlayerIds, loadPlayerAccount } from '../utils/storage';
import { soundFx } from '../utils/audio';
import worldBgImage from '../assets/images/aetheria_world_bg_1793110743544.jpg';

interface TitleScreenProps {
  onStartGame: (account: PlayerAccount) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStartGame }) => {
  const [authType, setAuthType] = useState<'gmail' | 'phone' | 'pioneer_id'>('gmail');
  const [identifier, setIdentifier] = useState('honjomasamune001@gmail.com');
  const [selectedJob, setSelectedJob] = useState<BaseJobId>('scavenger'); // Default to Sunraku Scavenger archetype!
  const [isExistingProfile, setIsExistingProfile] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  const savedIds = getAllSavedPlayerIds();

  // Check if identifier already exists
  const checkProfile = (val: string) => {
    try {
      const existing = loadPlayerAccount(val.trim().toLowerCase());
      setIsExistingProfile(!!existing);
    } catch {
      setIsExistingProfile(false);
    }
  };

  useEffect(() => {
    checkProfile(identifier);
  }, []);

  const handleIdentifierChange = (val: string) => {
    setIdentifier(val);
    checkProfile(val);
  };

  const handleLaunch = () => {
    if (isLaunching) return;
    setIsLaunching(true);

    try {
      soundFx.playMechaEngage();
      soundFx.playLevelUp();
    } catch (e) {
      console.warn('Audio start non-fatal:', e);
    }

    const cleanId = identifier.trim().toLowerCase() || 'honjomasamune001@gmail.com';
    let targetAcc: PlayerAccount | null = null;

    try {
      targetAcc = loadPlayerAccount(cleanId);
    } catch (err) {
      console.warn('Load check error:', err);
    }

    if (!targetAcc) {
      try {
        targetAcc = createNewPlayerAccount(cleanId, authType, selectedJob);
      } catch (err) {
        console.error('Account creation error:', err);
      }
    }

    // Fallback if localStorage had issues
    if (!targetAcc) {
      targetAcc = createNewPlayerAccount(cleanId || 'guest_pioneer', authType, selectedJob);
    }

    setTimeout(() => {
      onStartGame(targetAcc!);
    }, 120);
  };

  const handleSelectSaved = (savedId: string) => {
    try {
      const acc = loadPlayerAccount(savedId);
      if (acc) {
        try {
          soundFx.playBuild();
        } catch {}
        onStartGame(acc);
      }
    } catch (err) {
      console.error('Select saved error:', err);
    }
  };

  // Keyboard shortcut: Enter to launch game
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleLaunch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [identifier, authType, selectedJob, isLaunching]);

  const currentJobInfo = BASE_JOBS[selectedJob];

  return (
    <div className="relative w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. REALISTIC GAME-THEMED BACKGROUND ARTWORK */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src={worldBgImage}
          alt="Aetheria Frontier World"
          className="w-full h-full object-cover object-center opacity-40 brightness-90 contrast-110 scale-105 transition-transform duration-1000"
        />
        {/* Cinematic Vignette & Ambient VR Glows */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/65 to-slate-950/95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_65%_at_50%_-10%,rgba(6,182,212,0.25),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25" />
      </div>

      {/* MAIN SCROLLABLE CONTENT WRAPPER */}
      <div className="relative z-10 w-full flex flex-col p-4 sm:p-8">
        {/* TOP HEADER */}
        <div className="flex flex-col items-center justify-center text-center pt-2 mb-6">
          <div className="flex items-center gap-2 mb-1.5">
            <svg className="w-7 h-7 text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="text-[11px] font-mono-stat tracking-[0.28em] uppercase text-cyan-400 font-bold">
              Full-Dive VRMMO Protocol · Shangri-La Frontier
            </span>
            <svg className="w-7 h-7 text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>

          <h1 className="text-3xl sm:text-5xl font-fantasy font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-amber-300 drop-shadow-lg">
            AETHERIA FRONTIER
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
            <span className="text-[10px] sm:text-xs text-cyan-300/90 font-sans tracking-widest uppercase">
              Pre-Existing Safe Town Sanctuary · Colossi Raids · Tactical Mechas
            </span>
            <span className="text-[10px] px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 rounded-full font-mono-stat font-bold flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Pre-Built Safe Haven (No Town Building Needed)
            </span>
            <span className="text-[10px] px-2.5 py-0.5 bg-amber-500/20 border border-amber-400/50 text-amber-300 rounded-full font-mono-stat font-bold flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Daily Bounties Active
            </span>
          </div>
        </div>

        {/* CENTER: Login & Character Origin Selection */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLaunch();
          }}
          className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-5 mb-8"
        >
          {/* Left Column: Pioneer Authentication */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                    Pioneer Login & Unique ID
                  </h2>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-cyan-950 border border-cyan-400/50 text-cyan-300 rounded font-mono-stat font-bold">
                  Auto-Saves
                </span>
              </div>

              <p className="text-xs text-slate-300 mb-3">
                Sign in with your Google email, phone number, or Pioneer handle. Your progress, attributes, and unique procedural quests persist permanently on this device.
              </p>

              {/* Quick 1-Click Login Recommendation */}
              <div className="mb-3 p-2.5 bg-gradient-to-r from-cyan-950/80 to-slate-900 border border-cyan-400/50 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="text-xs font-mono-stat truncate">
                    <div className="text-[10px] text-cyan-300 uppercase font-bold">Detected User Account:</div>
                    <div className="text-slate-100 font-bold truncate">honjomasamune001@gmail.com</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAuthType('gmail');
                    setIdentifier('honjomasamune001@gmail.com');
                    checkProfile('honjomasamune001@gmail.com');
                  }}
                  className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold rounded-lg shrink-0 cursor-pointer transition-colors shadow"
                >
                  Use This
                </button>
              </div>

              {/* Auth Type Switcher */}
              <div className="grid grid-cols-3 gap-2 mb-3 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthType('gmail');
                    if (!identifier.includes('@')) {
                      setIdentifier('honjomasamune001@gmail.com');
                      checkProfile('honjomasamune001@gmail.com');
                    }
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl border transition-all cursor-pointer ${
                    authType === 'gmail'
                      ? 'bg-cyan-500 text-black font-bold border-cyan-400 shadow-md shadow-cyan-500/30'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  Gmail
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthType('phone');
                    setIdentifier('+1-555-019-2834');
                    checkProfile('+1-555-019-2834');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl border transition-all cursor-pointer ${
                    authType === 'phone'
                      ? 'bg-cyan-500 text-black font-bold border-cyan-400 shadow-md shadow-cyan-500/30'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  Phone
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthType('pioneer_id');
                    setIdentifier('Sunraku_01');
                    checkProfile('Sunraku_01');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl border transition-all cursor-pointer ${
                    authType === 'pioneer_id'
                      ? 'bg-cyan-500 text-black font-bold border-cyan-400 shadow-md shadow-cyan-500/30'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Fingerprint className="w-3.5 h-3.5" />
                  Pioneer ID
                </button>
              </div>

              {/* Input field */}
              <div className="space-y-1 mb-3">
                <label className="text-[11px] text-cyan-300 font-mono-stat uppercase tracking-wider">
                  {authType === 'gmail'
                    ? 'Pioneer Email Address:'
                    : authType === 'phone'
                    ? 'Mobile Phone Number:'
                    : 'Adventurer Nickname / Handle:'}
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => handleIdentifierChange(e.target.value)}
                  placeholder={
                    authType === 'gmail'
                      ? 'your.email@gmail.com'
                      : authType === 'phone'
                      ? '+1 555-019-2834'
                      : 'Sunraku_01'
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono-stat text-slate-100 focus:border-cyan-400 outline-none transition-colors"
                />
              </div>

              {isExistingProfile ? (
                <div className="p-2 bg-emerald-950/70 border border-emerald-500/60 rounded-xl text-emerald-300 text-xs font-mono-stat flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Existing Pioneer Profile found! Click below to resume journey.</span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 font-mono-stat mb-2">
                  • New ID detected: Character will enter the pre-existing haven of Aetheria Sanctuary.
                </div>
              )}

              {/* Saved quick switcher */}
              {savedIds.length > 0 && (
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-mono-stat mb-1">
                    Saved Profiles on this device:
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {savedIds.map((sid) => (
                      <button
                        key={sid}
                        type="button"
                        onClick={() => handleSelectSaved(sid)}
                        className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-cyan-300 text-[11px] font-mono-stat rounded transition-colors cursor-pointer truncate max-w-[170px]"
                      >
                        {sid}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Origin Job Selection & Launch CTA */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Swords className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Select Starting Job (Origin)
                </h2>
              </div>
              <p className="text-xs text-slate-300 mb-2.5">
                Choose your origin role. Complete ranked destiny quests to evolve into specialized combat classes and pilot Kirin Mecha frames.
              </p>

              {/* Job Selection Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                {(Object.keys(BASE_JOBS) as BaseJobId[]).map((jobKey) => {
                  const j = BASE_JOBS[jobKey];
                  const isSelected = selectedJob === jobKey;
                  return (
                    <button
                      key={jobKey}
                      type="button"
                      onClick={() => {
                        try {
                          soundFx.playBuild();
                        } catch {}
                        setSelectedJob(jobKey);
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-950/70 border-amber-400 text-amber-200 shadow-md shadow-amber-500/20'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {jobKey === 'villager' && <Home className="w-4 h-4 mb-1 text-emerald-400" />}
                      {jobKey === 'merchant' && <Zap className="w-4 h-4 mb-1 text-yellow-400" />}
                      {jobKey === 'fisherman' && <Anchor className="w-4 h-4 mb-1 text-cyan-400" />}
                      {jobKey === 'scavenger' && <Swords className="w-4 h-4 mb-1 text-rose-400" />}
                      {jobKey === 'apprentice_smith' && <Hammer className="w-4 h-4 mb-1 text-blue-400" />}
                      <span className="text-xs font-bold leading-tight">{j.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Job Card Preview */}
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300">{currentJobInfo.name}</span>
                  <span className="text-[10px] text-cyan-400 font-mono-stat">{currentJobInfo.primaryStat}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">{currentJobInfo.description}</p>
                <div className="text-[10px] text-slate-400 italic">"{currentJobInfo.flavor}"</div>
              </div>
            </div>

            {/* Launch CTA */}
            <button
              type="submit"
              disabled={isLaunching}
              className="w-full mt-4 py-3.5 bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-bold text-sm tracking-wider uppercase rounded-xl shadow-xl shadow-cyan-500/30 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isLaunching ? 'Connecting to Aetheria...' : 'Login & Enter Frontier (Enter)'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* SCROLL DOWN INDICATOR */}
        <div className="flex flex-col items-center justify-center text-center my-6">
          <span className="text-xs font-mono-stat text-cyan-400 uppercase tracking-widest flex items-center gap-2 bg-slate-900/80 px-4 py-1.5 rounded-full border border-cyan-500/40">
            <ArrowDown className="w-4 h-4 animate-bounce" />
            Scroll Down to View Game World, Lore & Mechanics
            <ArrowDown className="w-4 h-4 animate-bounce" />
          </span>
        </div>

        {/* BELOW THE FOLD: RICH GAME SYSTEM & LORE SHOWCASE (Scrollable) */}
        <div className="max-w-5xl mx-auto w-full space-y-6 pt-6 pb-16 border-t border-slate-800/80">
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl font-fantasy font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-cyan-300 to-emerald-400">
              AETHERIA FRONTIER CHRONICLES
            </h2>
            <p className="text-xs text-slate-400 font-mono-stat">
              Shangri-La Frontier inspired World Simulation · Pre-Existing Town & Wilderness Regions
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Safe Town Already Exists Beforehand */}
            <div className="bg-slate-900/85 backdrop-blur-sm border border-emerald-500/50 rounded-2xl p-4 space-y-2.5 shadow-xl">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Building2 className="w-4 h-4" />
                Pre-Built Ancient Safe Town
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                The Town of Aetheria is a legendary pre-existing sanctuary, not built by the player! It comes fully equipped with the Grand Adventurer Guild, Ancient Armory & Blacksmith, Mecha Hangar, Central Aether Refinery, Gate Defense Turrets, and cobblestone roads.
              </p>
              <div className="text-[10px] font-mono-stat text-emerald-300 bg-emerald-950/70 p-2 rounded-lg border border-emerald-500/30">
                • 100% Pre-Existing Infrastructure<br />
                • Peacekeeper Forcefield (Radius 360)<br />
                • Sacred Fountain Respawn (+15 HP/s Regen)
              </div>
            </div>

            {/* Card 2: SAO & SLF Stat Board */}
            <div className="bg-slate-900/85 backdrop-blur-sm border border-cyan-500/50 rounded-2xl p-4 space-y-2.5 shadow-xl">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Layers className="w-4 h-4" />
                Character Stat Board [C]
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Invest experience and free stat points directly into 6 core RPG attributes inspired by Sword Art Online and SLF: Strength (STR), Agility (AGI), Vitality (VIT), Intelligence (INT), Dexterity (DEX), and Luck (LUK) to customize your build.
              </p>
              <div className="text-[10px] font-mono-stat text-cyan-300 bg-cyan-950/70 p-2 rounded-lg border border-cyan-500/30">
                • STR: Melee Attack & Heavy Crits<br />
                • AGI: Movement Speed & Thrusters<br />
                • LUK: Rare Drops & Colossus Criticals
              </div>
            </div>

            {/* Card 3: Adventurer Guild & Market */}
            <div className="bg-slate-900/85 backdrop-blur-sm border border-amber-500/50 rounded-2xl p-4 space-y-2.5 shadow-xl">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Coins className="w-4 h-4" />
                Adventurer Guild & Shop [G]
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Visit the Town Guild Outpost to accept mercenary missions, trade harvested raw materials (Timber, Ore, Aether Crystals, Mecha Scrap) for Gold, and buy combat supplies such as Sacred Potions and Mecha Overdrive Boosters.
              </p>
              <div className="text-[10px] font-mono-stat text-amber-300 bg-amber-950/70 p-2 rounded-lg border border-amber-500/30">
                • Buy High-Grade Healing Potions<br />
                • Sell Raw Frontier Resources<br />
                • Access Ranked Guild Contracts
              </div>
            </div>

            {/* Card 4: Daily Bounties */}
            <div className="bg-slate-900/85 backdrop-blur-sm border border-purple-500/50 rounded-2xl p-4 space-y-2.5 shadow-xl">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                <Calendar className="w-4 h-4" />
                Daily Bounties System [D]
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Time-limited mercenary contracts that refresh daily at midnight. Hunt specific ranked monsters or gather rare frontier resources to earn massive bonus Gold, EXP, and relic components.
              </p>
              <div className="text-[10px] font-mono-stat text-purple-300 bg-purple-950/70 p-2 rounded-lg border border-purple-500/30">
                • Live Midnight Reset Countdown<br />
                • 3 Unique Procedural Tasks Daily<br />
                • Gold & EXP Multipliers
              </div>
            </div>

            {/* Card 5: Colossi Raids */}
            <div className="bg-slate-900/85 backdrop-blur-sm border border-rose-500/50 rounded-2xl p-4 space-y-2.5 shadow-xl">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <Crosshair className="w-4 h-4" />
                Seven Colossi Raids (Rank SSS)
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Venture 700px+ deep into outer biomes (Vorpal Forest, Mecha Scrap Badlands, Colossus Peak) to face apex threats like Gravekeeper Wezaemon. Colossi possess multi-stage patterns and colossal rewards.
              </p>
              <div className="text-[10px] font-mono-stat text-rose-300 bg-rose-950/70 p-2 rounded-lg border border-rose-500/30">
                • Wezaemon the Undying Swordsman<br />
                • Apex Threat Combat Sequences<br />
                • Unique Relics & Legacy Titles
              </div>
            </div>

            {/* Card 6: Tactical Mecha Frames */}
            <div className="bg-slate-900/85 backdrop-blur-sm border border-blue-500/50 rounded-2xl p-4 space-y-2.5 shadow-xl">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                <Cpu className="w-4 h-4" />
                Tactical Mecha Pilots [R]
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Access the pre-built Sanctuary Mecha Hangar or achieve Level 3 to summon your Kirin Tactical Mecha Frame. Unleash twin plasma lasers, shoulder-mounted missile salvos, and high-speed thruster dashes.
              </p>
              <div className="text-[10px] font-mono-stat text-blue-300 bg-blue-950/70 p-2 rounded-lg border border-blue-500/30">
                • Twin Cyan Particle Cannons<br />
                • Micro-Missile Barrage<br />
                • 1.6x Thruster Velocity
              </div>
            </div>
          </div>

          {/* Quick Launch Button at bottom */}
          <div className="text-center pt-4">
            <button
              type="button"
              onClick={handleLaunch}
              className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-bold text-sm tracking-wider uppercase rounded-xl shadow-xl shadow-cyan-500/30 inline-flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Enter Pre-Built Safe Town (Aetheria)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* BOTTOM CONTROL HINT LINE */}
        <div className="text-center text-xs font-mono-stat text-slate-400 tracking-wider py-4 border-t border-slate-900">
          Enter Start · WASD Move · Left Click Attack / Gather · Space Dodge · R Pilot Mecha · C Stats · G Guild · M Map · Esc Pause
        </div>
      </div>
    </div>
  );
};
