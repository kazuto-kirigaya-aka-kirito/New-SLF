import React from 'react';
import { BuildingBlueprint, PlacedBuilding, PlayerAccount } from '../types/game';
import { BUILDING_BLUEPRINTS } from '../utils/buildingData';
import { X, Layers, TreePine, Hammer, Sparkles, Cpu, Plus, Check } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface BuildingMenuModalProps {
  player: PlayerAccount;
  onSelectBlueprintToPlace: (type: BuildingBlueprint['type']) => void;
  onClose: () => void;
}

export const BuildingMenuModal: React.FC<BuildingMenuModalProps> = ({
  player,
  onSelectBlueprintToPlace,
  onClose,
}) => {
  const blueprints = Object.values(BUILDING_BLUEPRINTS);

  const canAfford = (bp: BuildingBlueprint) => {
    return (
      player.resources.wood >= bp.woodCost &&
      player.resources.ore >= bp.oreCost &&
      player.resources.aether >= bp.aetherCost
    );
  };

  const handleStartPlacement = (bp: BuildingBlueprint) => {
    if (!canAfford(bp)) return;
    soundFx.playBuild();
    onSelectBlueprintToPlace(bp.type);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-emerald-500/40 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/30 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950 border border-emerald-400 rounded-lg text-emerald-300">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-fantasy font-bold text-white tracking-wide">
                Wilderness Outposts & Pioneer Architecture
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                The Safe Town of Aetheria is already fully built beforehand. Construct forward beacons and defense turrets outside town in the wilderness.
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

        {/* Current Resources Bar */}
        <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center gap-6 text-xs font-mono-stat flex-wrap">
          <span className="text-slate-400 font-sans font-bold uppercase">Available Materials:</span>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <TreePine className="w-4 h-4" />
            <span>Timber: {player.resources.wood}</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <Hammer className="w-4 h-4" />
            <span>Iron Ore: {player.resources.ore}</span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Sparkles className="w-4 h-4" />
            <span>Aether: {player.resources.aether}</span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-400">
            <Cpu className="w-4 h-4" />
            <span>Mecha Scrap: {player.resources.mechaScrap}</span>
          </div>
        </div>

        {/* Blueprints List */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {blueprints.map((bp) => {
            const affordable = canAfford(bp);
            const alreadyPlacedCount = player.territoryBuildings.filter((b) => b.type === bp.type).length;

            return (
              <div
                key={bp.type}
                className="flex flex-col justify-between p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-emerald-950 border border-emerald-500/40 rounded-lg text-emerald-300">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          {bp.name}
                          {alreadyPlacedCount > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-cyan-300 border border-slate-700 rounded font-mono-stat font-semibold">
                              Built: {alreadyPlacedCount}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-emerald-400 font-mono-stat">Tier {bp.tier} Blueprint</div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mb-2 leading-relaxed">{bp.description}</p>
                  <div className="text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 rounded p-2 mb-3">
                    <span className="font-bold text-emerald-400">Territory Benefit:</span> {bp.benefit}
                  </div>
                </div>

                {/* Costs & Place CTA */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-xs font-mono-stat">
                    <span className={player.resources.wood >= bp.woodCost ? 'text-slate-300' : 'text-red-400'}>
                      🌲{bp.woodCost}
                    </span>
                    <span className={player.resources.ore >= bp.oreCost ? 'text-slate-300' : 'text-red-400'}>
                      ⛏️{bp.oreCost}
                    </span>
                    <span className={player.resources.aether >= bp.aetherCost ? 'text-slate-300' : 'text-red-400'}>
                      💎{bp.aetherCost}
                    </span>
                  </div>

                  <button
                    onClick={() => handleStartPlacement(bp)}
                    disabled={!affordable}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      affordable
                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black shadow-md shadow-emerald-500/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Place Structure
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
