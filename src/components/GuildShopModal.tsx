import React, { useState } from 'react';
import { ItemSlot, PlayerAccount } from '../types/game';
import { X, Building2, ShoppingBag, Coins, Shield, Sparkles, ArrowRight, Check, Package, TreePine, Hammer, Cpu } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface GuildShopModalProps {
  player: PlayerAccount;
  onUpdatePlayer: (updater: (prev: PlayerAccount) => PlayerAccount) => void;
  onOpenQuests: () => void;
  onClose: () => void;
}

interface ShopItem {
  id: string;
  name: string;
  type: ItemSlot['type'];
  price: number;
  icon: string;
  description: string;
  effectType?: ItemSlot['effectType'];
  effectValue?: number;
}

const GUILD_CATALOG: ShopItem[] = [
  {
    id: 'item_heal_pot_1',
    name: 'High-Grade Healing Salve',
    type: 'potion',
    price: 40,
    icon: 'FlaskConical',
    description: 'Instant restorative potion brewed with Vorpal forest herbs. Restores 140 HP.',
    effectType: 'heal_hp',
    effectValue: 140,
  },
  {
    id: 'item_energy_cell_1',
    name: 'Aether Overcharge Capsule',
    type: 'buff',
    price: 75,
    icon: 'Zap',
    description: 'Supercharges Mecha Frame thrusters and recharges 100 Mecha Energy.',
    effectType: 'restore_energy',
    effectValue: 100,
  },
  {
    id: 'item_teleport_stone_1',
    name: 'Town Return Keystone',
    type: 'relic',
    price: 120,
    icon: 'Home',
    description: 'Instantly teleports the adventurer back to the Safe Town Sanctuary.',
    effectType: 'teleport_town',
  },
  {
    id: 'item_atk_stim_1',
    name: 'Berserker Combat Stimulant',
    type: 'buff',
    price: 90,
    icon: 'Flame',
    description: 'Ancient alchemical compound that boosts physical ATK by +20 for 45 seconds.',
    effectType: 'boost_atk',
    effectValue: 20,
  },
];

export const GuildShopModal: React.FC<GuildShopModalProps> = ({ player, onUpdatePlayer, onOpenQuests, onClose }) => {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  const handleBuyItem = (shopItem: ShopItem) => {
    if (player.gold < shopItem.price) {
      showFeedback('Insufficient Gold!');
      return;
    }

    try {
      soundFx.playBuild();
    } catch {}

    onUpdatePlayer((prev) => {
      const nextInv = [...prev.inventory];
      const existingItem = nextInv.find((i) => i.id === shopItem.id);

      if (existingItem) {
        existingItem.count += 1;
      } else {
        nextInv.push({
          id: shopItem.id,
          name: shopItem.name,
          type: shopItem.type,
          count: 1,
          value: Math.round(shopItem.price * 0.6),
          icon: shopItem.icon,
          description: shopItem.description,
          effectType: shopItem.effectType,
          effectValue: shopItem.effectValue,
        });
      }

      return {
        ...prev,
        gold: prev.gold - shopItem.price,
        inventory: nextInv,
      };
    });

    showFeedback(`Purchased ${shopItem.name}!`);
  };

  const handleSellResource = (type: 'wood' | 'ore' | 'aether' | 'mechaScrap', count: number, unitPrice: number) => {
    const currentAmount = player.resources[type];
    const sellAmount = Math.min(currentAmount, count);
    if (sellAmount <= 0) return;

    const earnedGold = sellAmount * unitPrice;

    try {
      soundFx.playBuild();
    } catch {}

    onUpdatePlayer((prev) => ({
      ...prev,
      gold: prev.gold + earnedGold,
      resources: {
        ...prev.resources,
        [type]: prev.resources[type] - sellAmount,
      },
    }));

    showFeedback(`Sold ${sellAmount}x ${type.toUpperCase()} for +${earnedGold} Gold!`);
  };

  const handleUseItem = (item: ItemSlot) => {
    if (item.count <= 0) return;

    try {
      soundFx.playLevelUp();
    } catch {}

    onUpdatePlayer((prev) => {
      const nextInv = prev.inventory
        .map((i) => (i.id === item.id ? { ...i, count: i.count - 1 } : i))
        .filter((i) => i.count > 0);

      let nextHp = prev.stats.hp;
      if (item.effectType === 'heal_hp') {
        nextHp = Math.min(prev.stats.maxHp, prev.stats.hp + (item.effectValue || 100));
      }

      return {
        ...prev,
        inventory: nextInv,
        stats: {
          ...prev.stats,
          hp: nextHp,
        },
      };
    });

    showFeedback(`Used ${item.name}!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 select-none">
      <div className="relative w-full max-w-3xl bg-slate-950 border border-amber-500/50 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/30 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-950 border border-amber-400 rounded-xl text-amber-300 shadow-md shadow-amber-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-fantasy font-bold text-white tracking-wide">
                  Adventurer Guild Merchant & Outpost
                </h2>
                <span className="px-2 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded font-mono-stat uppercase">
                  Guild Hub
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans mt-0.5">
                The governing headquarters of all frontier operations. Trade raw materials, gear up, and accept missions.
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

        {/* Tab Selector & Currency Bar */}
        <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-4 text-xs font-mono-stat">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('buy')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'buy'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950'
              }`}
            >
              Buy Supplies
            </button>
            <button
              onClick={() => setActiveTab('sell')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'sell'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950'
              }`}
            >
              Sell Resources & Relics
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenQuests();
              }}
              className="px-3 py-1.5 rounded-lg font-bold text-cyan-300 hover:text-white bg-cyan-950/60 border border-cyan-500/40 hover:border-cyan-400 transition-colors cursor-pointer flex items-center gap-1"
            >
              Guild Mission Board
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-yellow-300 font-bold bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-700">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span>Treasury: {player.gold} Gold</span>
          </div>
        </div>

        {/* Feedback message banner */}
        {feedbackMsg && (
          <div className="px-6 py-1.5 bg-cyan-950 border-b border-cyan-500 text-cyan-200 text-xs font-mono-stat text-center animate-fade-in">
            {feedbackMsg}
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'buy' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {GUILD_CATALOG.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-amber-500/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-white tracking-wide">{item.name}</h3>
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-amber-300 rounded uppercase font-mono-stat font-semibold">
                          {item.type}
                        </span>
                      </div>
                      <div className="text-xs font-mono-stat font-bold text-yellow-400 flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5" />
                        {item.price} Gold
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed mb-3">{item.description}</p>
                  </div>

                  <button
                    onClick={() => handleBuyItem(item)}
                    disabled={player.gold < item.price}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      player.gold >= item.price
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black shadow-md shadow-amber-500/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Purchase for {item.price} Gold
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-slate-400 font-mono-stat mb-2">
                Sell excess raw materials and collected relics to the guild treasury for currency:
              </div>

              {/* Resource selling row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Timber */}
                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <TreePine className="w-6 h-6 text-emerald-400" />
                    <div>
                      <div className="text-xs font-bold text-white">Frontier Timber</div>
                      <div className="text-[10px] text-slate-400 font-mono-stat">Stock: {player.resources.wood} · 5 Gold/ea</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono-stat">
                    <button
                      onClick={() => handleSellResource('wood', 10, 5)}
                      disabled={player.resources.wood < 10}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded disabled:opacity-40 cursor-pointer"
                    >
                      Sell 10
                    </button>
                    <button
                      onClick={() => handleSellResource('wood', player.resources.wood, 5)}
                      disabled={player.resources.wood <= 0}
                      className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs rounded disabled:opacity-40 cursor-pointer"
                    >
                      Sell All
                    </button>
                  </div>
                </div>

                {/* Ore */}
                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Hammer className="w-6 h-6 text-amber-400" />
                    <div>
                      <div className="text-xs font-bold text-white">Iron Mineral Ore</div>
                      <div className="text-[10px] text-slate-400 font-mono-stat">Stock: {player.resources.ore} · 8 Gold/ea</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono-stat">
                    <button
                      onClick={() => handleSellResource('ore', 10, 8)}
                      disabled={player.resources.ore < 10}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded disabled:opacity-40 cursor-pointer"
                    >
                      Sell 10
                    </button>
                    <button
                      onClick={() => handleSellResource('ore', player.resources.ore, 8)}
                      disabled={player.resources.ore <= 0}
                      className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs rounded disabled:opacity-40 cursor-pointer"
                    >
                      Sell All
                    </button>
                  </div>
                </div>

                {/* Aether */}
                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-6 h-6 text-cyan-400" />
                    <div>
                      <div className="text-xs font-bold text-white">Pure Aether Shards</div>
                      <div className="text-[10px] text-slate-400 font-mono-stat">Stock: {player.resources.aether} · 18 Gold/ea</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono-stat">
                    <button
                      onClick={() => handleSellResource('aether', 5, 18)}
                      disabled={player.resources.aether < 5}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded disabled:opacity-40 cursor-pointer"
                    >
                      Sell 5
                    </button>
                    <button
                      onClick={() => handleSellResource('aether', player.resources.aether, 18)}
                      disabled={player.resources.aether <= 0}
                      className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs rounded disabled:opacity-40 cursor-pointer"
                    >
                      Sell All
                    </button>
                  </div>
                </div>

                {/* Mecha Scrap */}
                <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Cpu className="w-6 h-6 text-blue-400" />
                    <div>
                      <div className="text-xs font-bold text-white">Titan Mecha Scrap</div>
                      <div className="text-[10px] text-slate-400 font-mono-stat">Stock: {player.resources.mechaScrap} · 15 Gold/ea</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono-stat">
                    <button
                      onClick={() => handleSellResource('mechaScrap', 5, 15)}
                      disabled={player.resources.mechaScrap < 5}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded disabled:opacity-40 cursor-pointer"
                    >
                      Sell 5
                    </button>
                    <button
                      onClick={() => handleSellResource('mechaScrap', player.resources.mechaScrap, 15)}
                      disabled={player.resources.mechaScrap <= 0}
                      className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs rounded disabled:opacity-40 cursor-pointer"
                    >
                      Sell All
                    </button>
                  </div>
                </div>
              </div>

              {/* Player Inventory section */}
              <div className="pt-3 border-t border-slate-800">
                <div className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-cyan-400" />
                  Your Carried Inventory (Use directly)
                </div>
                {player.inventory.length === 0 ? (
                  <div className="text-xs text-slate-500 italic p-3 text-center bg-slate-900/40 rounded-xl">
                    Inventory empty. Purchase healing salves and boosters above!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {player.inventory.map((invItem) => (
                      <div
                        key={invItem.id}
                        className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-white">{invItem.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono-stat">
                            Quantity: <span className="text-cyan-300 font-bold">{invItem.count}x</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleUseItem(invItem)}
                          className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold rounded-lg cursor-pointer transition-colors shadow"
                        >
                          Use Item
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
