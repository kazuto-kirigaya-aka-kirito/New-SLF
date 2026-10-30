import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PlayerAccount } from '../types/game';
import {
  X,
  Compass,
  Shield,
  Trees,
  Cpu,
  Waves,
  Skull,
  Navigation,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Crosshair,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Pause,
  MapPin,
  Flame,
  Wrench,
  Building,
} from 'lucide-react';
import { soundFx } from '../utils/audio';

interface WorldMapModalProps {
  player: PlayerAccount;
  playerPos: { x: number; y: number };
  onTeleportToTown: () => void;
  onClose: () => void;
}

export const WorldMapModal: React.FC<WorldMapModalProps> = ({
  player,
  playerPos,
  onTeleportToTown,
  onClose,
}) => {
  // Map dimensions
  const MAP_SIZE = 1600; // Internal map pixel dimensions (represents -1600 to +1600 world units)
  const WORLD_EXTENT = 1600;

  // Pan and Zoom States
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number }>({
    x: 0,
    y: 0,
    panX: 0,
    panY: 0,
  });
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const playerDistTown = Math.round(Math.hypot(playerPos.x, playerPos.y));
  const isInsideTown = playerDistTown <= 360;

  // Convert world coordinates to internal map coordinates (0 to MAP_SIZE)
  const worldToMap = useCallback(
    (wx: number, wy: number) => {
      const mx = (MAP_SIZE / 2) + (wx / WORLD_EXTENT) * (MAP_SIZE / 2);
      const my = (MAP_SIZE / 2) + (wy / WORLD_EXTENT) * (MAP_SIZE / 2);
      return { x: mx, y: my };
    },
    [MAP_SIZE, WORLD_EXTENT]
  );

  const playerMapPos = worldToMap(playerPos.x, playerPos.y);

  // Center on Hero
  const handleCenterOnHero = () => {
    // Offset pan so playerMapPos is at center of view (MAP_SIZE / 2)
    const targetPanX = (MAP_SIZE / 2 - playerMapPos.x) * zoom;
    const targetPanY = (MAP_SIZE / 2 - playerMapPos.y) * zoom;
    setPan({ x: targetPanX, y: targetPanY });
  };

  // Center on Safe Town Sanctuary
  const handleCenterOnTown = () => {
    setPan({ x: 0, y: 0 });
  };

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.max(0.6, Math.min(2.4, Number((prev + delta).toFixed(2)))));
  };

  const handlePanNudge = (dx: number, dy: number) => {
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const handleResetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  // Dragging Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only primary click
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Handlers for drag
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        panX: pan.x,
        panY: pan.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomStep = e.deltaY < 0 ? 0.15 : -0.15;
    handleZoom(zoomStep);
  };

  const handleTeleport = () => {
    try {
      soundFx.playLevelUp();
    } catch {}
    onTeleportToTown();
    onClose();
  };

  // On initial mount, center map slightly towards player if they are far away
  useEffect(() => {
    if (playerDistTown > 500) {
      handleCenterOnHero();
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-5xl bg-slate-950 border border-cyan-500/50 rounded-2xl shadow-2xl flex flex-col h-[92vh] max-h-[850px] overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-cyan-500/30 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950 border border-cyan-400 rounded-lg text-cyan-300 shadow-md">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-fantasy font-bold text-white tracking-wide">
                  Cartography of Aetheria: Frontier Age
                </h2>
                <span className="px-2 py-0.5 bg-cyan-500 text-black text-[10px] font-bold rounded font-mono-stat uppercase tracking-wider">
                  Interactive Map
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans mt-0.5 hidden sm:block">
                Drag to scroll across biomes · Mouse wheel to zoom · Click pins to view frontier regions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Close Map [M] or [Esc]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SIMULATION PAUSED BANNER */}
        <div className="px-4 py-1.5 bg-amber-950/80 border-b border-amber-500/40 flex items-center justify-between text-xs text-amber-200 font-mono-stat shrink-0">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <Pause className="w-3.5 h-3.5 fill-amber-300" />
              GAME SIMULATION PAUSED
            </span>
            <span className="text-amber-200/80 hidden md:inline">
              — Frontier monsters, attacks, and world events are frozen. Exit map [M] to resume.
            </span>
          </div>

          <div className="text-[11px] text-amber-300/90 font-mono-stat">
            Zoom: {Math.round(zoom * 100)}% · Center: [{Math.round(-pan.x / zoom)}, {Math.round(-pan.y / zoom)}]
          </div>
        </div>

        {/* INTERACTIVE MAP VIEWPORT */}
        <div
          ref={mapContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          className={`relative flex-1 bg-slate-950 overflow-hidden select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {/* Draggable Map Plane */}
          <div
            className="absolute top-1/2 left-1/2 origin-center transition-transform duration-75 ease-out"
            style={{
              width: `${MAP_SIZE}px`,
              height: `${MAP_SIZE}px`,
              transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
            }}
          >
            {/* Background Grid & Outer Wilderness Borders */}
            <div className="absolute inset-0 bg-[#060b13] border-4 border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl">
              {/* Cartographic Coordinate Grid */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:50px_50px] opacity-25 pointer-events-none" />
              
              {/* Compass Axis Marks */}
              <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-cyan-500/20" />
              <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-cyan-500/20" />

              {/* ---------------- REGION 1: NORTH-EAST (Vorpal Forest) ---------------- */}
              <div className="absolute top-8 right-8 w-[680px] h-[680px] rounded-3xl bg-gradient-to-bl from-emerald-950/50 via-emerald-950/20 to-transparent border border-emerald-600/30 p-6 flex flex-col justify-start items-end pointer-events-none">
                <div className="p-4 rounded-2xl border border-emerald-500/60 bg-emerald-950/80 shadow-xl backdrop-blur-md max-w-xs text-right">
                  <div className="flex items-center justify-end gap-2 text-emerald-400 font-bold font-fantasy text-base">
                    <Trees className="w-5 h-5 text-emerald-300" />
                    VORPAL FOREST WILDERNESS
                  </div>
                  <div className="text-[11px] text-emerald-300 font-mono-stat font-semibold mt-1">
                    Rank E · Rank D Habitats
                  </div>
                  <div className="text-[10px] text-slate-300 font-sans mt-1">
                    Verdant elder groves, Horned Boars, and agile Vorpal Rabbits. Forage rich lumber and medicinal herbs.
                  </div>
                </div>

                {/* Regional Monster Radar Hotspots */}
                <div className="mt-12 mr-16 p-3 rounded-xl border border-emerald-700/50 bg-slate-900/80 text-xs flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-200 font-mono-stat font-bold">Horned Boar Territory [Rank E]</span>
                </div>
                <div className="mt-8 mr-6 p-3 rounded-xl border border-emerald-700/50 bg-slate-900/80 text-xs flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse" />
                  <span className="text-emerald-200 font-mono-stat font-bold">Vorpal Rabbit Warrens [Rank D]</span>
                </div>
              </div>

              {/* ---------------- REGION 2: SOUTH-EAST (Mecha Scrap Badlands) ---------------- */}
              <div className="absolute bottom-8 right-8 w-[680px] h-[680px] rounded-3xl bg-gradient-to-tl from-amber-950/40 via-cyan-950/20 to-transparent border border-cyan-700/30 p-6 flex flex-col justify-end items-end pointer-events-none">
                <div className="mb-8 mr-12 p-3 rounded-xl border border-cyan-700/50 bg-slate-900/80 text-xs flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-cyan-200 font-mono-stat font-bold">Titan Raptor Dunes [Rank C]</span>
                </div>
                <div className="mb-6 mr-4 p-3 rounded-xl border border-amber-700/50 bg-slate-900/80 text-xs flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-amber-200 font-mono-stat font-bold">Rust Behemoth Outcrop [Rank B]</span>
                </div>

                <div className="p-4 rounded-2xl border border-cyan-500/60 bg-slate-900/85 shadow-xl backdrop-blur-md max-w-xs text-right">
                  <div className="flex items-center justify-end gap-2 text-cyan-300 font-bold font-fantasy text-base">
                    <Cpu className="w-5 h-5 text-cyan-400" />
                    MECHA SCRAP BADLANDS
                  </div>
                  <div className="text-[11px] text-cyan-300 font-mono-stat font-semibold mt-1">
                    Rank C · Rank B Threat Level
                  </div>
                  <div className="text-[10px] text-slate-300 font-sans mt-1">
                    Ancient fallen titan chassis and scrap ruins. Rich in salvageable Mecha Scrap and conductive ores.
                  </div>
                </div>
              </div>

              {/* ---------------- REGION 3: SOUTH-WEST (Abyssal Sunken Shelf) ---------------- */}
              <div className="absolute bottom-8 left-8 w-[680px] h-[680px] rounded-3xl bg-gradient-to-tr from-blue-950/50 via-indigo-950/20 to-transparent border border-indigo-700/30 p-6 flex flex-col justify-end items-start pointer-events-none">
                <div className="mb-8 ml-10 p-3 rounded-xl border border-indigo-700/50 bg-slate-900/80 text-xs flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
                  <span className="text-indigo-200 font-mono-stat font-bold">Shadow Prowler Trench [Rank A]</span>
                </div>
                <div className="mb-6 ml-4 p-3 rounded-xl border border-blue-600/50 bg-slate-900/80 text-xs flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-blue-200 font-mono-stat font-bold">Abyssal Leviathan Basin [Rank S]</span>
                </div>

                <div className="p-4 rounded-2xl border border-blue-500/60 bg-slate-900/85 shadow-xl backdrop-blur-md max-w-xs text-left">
                  <div className="flex items-center gap-2 text-blue-300 font-bold font-fantasy text-base">
                    <Waves className="w-5 h-5 text-blue-400" />
                    ABYSSAL SUNKEN SHELF
                  </div>
                  <div className="text-[11px] text-blue-300 font-mono-stat font-semibold mt-1">
                    Rank A · Rank S Aquatic Horrors
                  </div>
                  <div className="text-[10px] text-slate-300 font-sans mt-1">
                    Luminous deep water shelf and underwater ruins. Dense clusters of concentrated Aether crystals.
                  </div>
                </div>
              </div>

              {/* ---------------- REGION 4: NORTH-WEST (Tomb of Wezaemon & Colossus Peak) ---------------- */}
              <div className="absolute top-8 left-8 w-[680px] h-[680px] rounded-3xl bg-gradient-to-br from-red-950/50 via-red-950/20 to-transparent border border-red-700/30 p-6 flex flex-col justify-start items-start pointer-events-none">
                <div className="p-4 rounded-2xl border border-red-500/60 bg-slate-900/85 shadow-xl backdrop-blur-md max-w-xs text-left">
                  <div className="flex items-center gap-2 text-red-300 font-bold font-fantasy text-base">
                    <Skull className="w-5 h-5 text-red-400" />
                    TOMB OF WEZAEMON
                  </div>
                  <div className="text-[11px] text-red-400 font-mono-stat font-bold mt-1">
                    RANK SSS COLOSSUS SUMMIT
                  </div>
                  <div className="text-[10px] text-slate-300 font-sans mt-1">
                    Crimson atmospheric peaks where legendary Unique Monsters dwell. Ultimate endgame challenge.
                  </div>
                </div>

                <div className="mt-12 ml-12 p-3 rounded-xl border border-red-700/60 bg-red-950/70 text-xs flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-red-200 font-mono-stat font-bold">Unique Monster: Colossus Kirin [SSS]</span>
                </div>
              </div>

              {/* ---------------- CENTER: SAFE TOWN SANCTUARY ---------------- */}
              {/* Outer Peacekeeper Barrier Ring (Radius: 360 world units => ~360 map px) */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-emerald-400/80 bg-emerald-950/25 flex items-center justify-center pointer-events-none shadow-[0_0_50px_rgba(52,211,153,0.3)]"
                style={{ width: '360px', height: '360px' }}
              >
                {/* Secondary inner sanctuary ring */}
                <div className="w-[280px] h-[280px] rounded-full border border-emerald-500/40 border-dashed animate-[spin_60s_linear_infinite]" />
              </div>

              {/* Safe Town Landmark Pins */}
              {/* Sacred Fountain (0, 0) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center pointer-events-none">
                <div className="p-2 bg-emerald-900/90 border-2 border-emerald-400 rounded-full text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.8)]">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="px-2 py-0.5 bg-black/90 border border-emerald-400 text-emerald-300 text-[10px] font-mono-stat font-bold rounded shadow-lg mt-1 whitespace-nowrap">
                  Sacred Fountain (Safe Respawn)
                </div>
              </div>

              {/* Pre-Built Adventurer Guild Hall (-70, -60) */}
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center pointer-events-none"
                style={{
                  left: `${worldToMap(-70, -60).x}px`,
                  top: `${worldToMap(-70, -60).y}px`,
                }}
              >
                <div className="p-1.5 bg-amber-950/90 border border-amber-400 rounded-lg text-amber-300">
                  <Building className="w-4 h-4" />
                </div>
                <div className="px-1.5 py-0.5 bg-black/80 text-amber-300 text-[9px] font-mono-stat rounded whitespace-nowrap">
                  Guild Hall
                </div>
              </div>

              {/* Pre-Built Central Refinery (70, -60) */}
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center pointer-events-none"
                style={{
                  left: `${worldToMap(70, -60).x}px`,
                  top: `${worldToMap(70, -60).y}px`,
                }}
              >
                <div className="p-1.5 bg-cyan-950/90 border border-cyan-400 rounded-lg text-cyan-300">
                  <Flame className="w-4 h-4" />
                </div>
                <div className="px-1.5 py-0.5 bg-black/80 text-cyan-300 text-[9px] font-mono-stat rounded whitespace-nowrap">
                  Refinery
                </div>
              </div>

              {/* Pre-Built Mecha Hangar (0, -110) */}
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center pointer-events-none"
                style={{
                  left: `${worldToMap(0, -110).x}px`,
                  top: `${worldToMap(0, -110).y}px`,
                }}
              >
                <div className="p-1.5 bg-purple-950/90 border border-purple-400 rounded-lg text-purple-300">
                  <Wrench className="w-4 h-4" />
                </div>
                <div className="px-1.5 py-0.5 bg-black/80 text-purple-300 text-[9px] font-mono-stat rounded whitespace-nowrap">
                  Mecha Hangar
                </div>
              </div>

              {/* Player Placed Buildings in the World */}
              {player.territoryBuildings?.map((bld, idx) => {
                const bPos = worldToMap(bld.x, bld.y);
                return (
                  <div
                    key={bld.id || `bld_${idx}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center pointer-events-none"
                    style={{ left: `${bPos.x}px`, top: `${bPos.y}px` }}
                  >
                    <div className="p-1.5 bg-sky-950/90 border border-sky-400 rounded-lg text-sky-300 shadow-md">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="px-1.5 py-0.5 bg-black/90 text-sky-200 text-[8px] font-mono-stat rounded whitespace-nowrap">
                      {bld.type}
                    </div>
                  </div>
                );
              })}

              {/* Direct Path line from Player to Safe Town Fountain */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-15">
                <line
                  x1={playerMapPos.x}
                  y1={playerMapPos.y}
                  x2={MAP_SIZE / 2}
                  y2={MAP_SIZE / 2}
                  stroke="rgba(6, 182, 212, 0.4)"
                  strokeWidth="2"
                  strokeDasharray="6,6"
                />
              </svg>

              {/* LIVE HERO / PLAYER MARKER PIN */}
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center pointer-events-none transition-transform duration-100 ease-out"
                style={{ left: `${playerMapPos.x}px`, top: `${playerMapPos.y}px` }}
              >
                <div className="relative">
                  <Navigation className="w-7 h-7 text-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,1)] rotate-45" />
                  <span className="absolute -inset-2 rounded-full bg-cyan-400/50 animate-ping pointer-events-none" />
                </div>
                <div className="px-2.5 py-1 bg-black/95 border-2 border-cyan-400 text-cyan-200 text-xs font-mono-stat font-bold rounded-lg shadow-2xl mt-1 whitespace-nowrap flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  {player.playerName} (Lv.{player.level} {player.currentJobId || player.baseJob})
                </div>
                <div className="px-1.5 py-0.5 bg-slate-900/90 text-slate-300 text-[10px] font-mono-stat rounded mt-0.5">
                  [{Math.round(playerPos.x)}, {Math.round(playerPos.y)}] · {playerDistTown}m to Town
                </div>
              </div>
            </div>
          </div>

          {/* ON-SCREEN PAN CONTROLS (D-PAD) - Bottom Left */}
          <div className="absolute bottom-4 left-4 z-40 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-2 shadow-2xl backdrop-blur-md flex flex-col items-center gap-1">
            <span className="text-[9px] font-mono-stat font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Pan
            </span>
            <button
              onClick={() => handlePanNudge(0, 100)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Pan North"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePanNudge(100, 0)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Pan West"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetView}
                className="p-1.5 bg-cyan-950 border border-cyan-500/50 hover:bg-cyan-900 text-cyan-300 rounded-lg transition-colors cursor-pointer"
                title="Reset View"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePanNudge(-100, 0)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Pan East"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => handlePanNudge(0, -100)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Pan South"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>

          {/* QUICK FOCUS & ZOOM CONTROLS - Top Right */}
          <div className="absolute top-4 right-4 z-40 flex flex-col gap-2">
            {/* Center on Hero */}
            <button
              onClick={handleCenterOnHero}
              className="px-3 py-2 bg-cyan-950/90 border border-cyan-400 hover:bg-cyan-900 text-cyan-200 rounded-xl text-xs font-mono-stat font-bold shadow-xl backdrop-blur-md flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
            >
              <Crosshair className="w-4 h-4 text-cyan-300" />
              Center on Hero
            </button>

            {/* Center on Safe Town */}
            <button
              onClick={handleCenterOnTown}
              className="px-3 py-2 bg-emerald-950/90 border border-emerald-400 hover:bg-emerald-900 text-emerald-200 rounded-xl text-xs font-mono-stat font-bold shadow-xl backdrop-blur-md flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
            >
              <Shield className="w-4 h-4 text-emerald-300" />
              Center on Town (0,0)
            </button>

            {/* Zoom Controls */}
            <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-1 shadow-xl backdrop-blur-md flex items-center justify-around gap-1">
              <button
                onClick={() => handleZoom(0.2)}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono-stat font-bold text-cyan-300 px-1">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => handleZoom(-0.2)}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM FOOTER BAR */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between flex-wrap gap-3 shrink-0">
          <div className="flex items-center gap-3 text-xs font-mono-stat">
            <span
              className={`px-3 py-1 rounded-lg border font-bold flex items-center gap-1.5 ${
                isInsideTown
                  ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300'
                  : 'bg-red-950/90 border-red-500 text-red-300'
              }`}
            >
              {isInsideTown ? (
                <>
                  <Shield className="w-3.5 h-3.5" />
                  SAFE ZONE (Sanctuary Peacekeeper Barrier Active)
                </>
              ) : (
                <>
                  <Skull className="w-3.5 h-3.5" />
                  WILDERNESS COMBAT ZONE (Hostile Monsters Present)
                </>
              )}
            </span>
            <span className="text-slate-400 hidden sm:inline">
              Coords: [{Math.round(playerPos.x)}, {Math.round(playerPos.y)}] · Dist to Town: {playerDistTown}m
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTeleport}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105"
            >
              <Shield className="w-4 h-4" />
              Recall to Safe Town
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Exit Map [M]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
