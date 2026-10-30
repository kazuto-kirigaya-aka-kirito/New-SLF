import React, { useEffect, useRef } from 'react';
import { FloatingText, Monster, ParticleEffect, PlacedBuilding, PlayerAccount, Projectile, RankTier } from '../types/game';
import { soundFx } from '../utils/audio';
import { BUILDING_BLUEPRINTS, PRE_BUILT_TOWN_BUILDINGS } from '../utils/buildingData';

export const SAFE_TOWN_RADIUS = 360;

interface GameCanvasProps {
  player: PlayerAccount;
  onUpdatePlayer: (updater: (prev: PlayerAccount) => PlayerAccount) => void;
  onMonsterDefeated: (monster: Monster) => void;
  onResourceGathered: (type: 'wood' | 'ore' | 'aether' | 'mechaScrap', amount: number) => void;
  isMechaMode: boolean;
  setIsMechaMode: (val: boolean | ((v: boolean) => boolean)) => void;
  buildPlacingType: PlacedBuilding['type'] | null;
  onBuildingPlaced: (building: PlacedBuilding) => void;
  onCancelBuild: () => void;
  isPaused: boolean;
  onPlayerPosChange?: (pos: { x: number; y: number }) => void;
  onSafeZoneChange?: (isInside: boolean) => void;
  teleportTrigger?: number;
}

interface WorldResourceNode {
  id: string;
  type: 'tree' | 'ore' | 'aether_crystal' | 'mecha_wreck';
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  yieldType: 'wood' | 'ore' | 'aether' | 'mechaScrap';
  yieldAmount: number;
  respawnTime?: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  player,
  onUpdatePlayer,
  onMonsterDefeated,
  onResourceGathered,
  isMechaMode,
  setIsMechaMode,
  buildPlacingType,
  onBuildingPlaced,
  onCancelBuild,
  isPaused,
  onPlayerPosChange,
  onSafeZoneChange,
  teleportTrigger,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keep latest callbacks in ref to avoid recreation loops and animation-frame thrashing
  const callbacksRef = useRef({
    onUpdatePlayer,
    onMonsterDefeated,
    onResourceGathered,
    onBuildingPlaced,
    onPlayerPosChange,
    onSafeZoneChange,
  });

  useEffect(() => {
    callbacksRef.current = {
      onUpdatePlayer,
      onMonsterDefeated,
      onResourceGathered,
      onBuildingPlaced,
      onPlayerPosChange,
      onSafeZoneChange,
    };
  });

  const lastReportedCoordRef = useRef({ x: 0, y: 0, time: 0 });

  // References to keep mutable game state isolated from React re-renders for fluid 60FPS
  const gameStateRef = useRef({
    playerRef: player,
    isMechaModeRef: isMechaMode,
    isPausedRef: isPaused,
    buildPlacingTypeRef: buildPlacingType,
    camera: { x: 0, y: 0 },
    mouse: { worldX: 0, worldY: 0, screenX: 0, screenY: 0, isDown: false, rightDown: false },
    keys: {} as Record<string, boolean>,
    justPressedKeys: {} as Record<string, boolean>,
    playerPos: { x: 0, y: 0, vx: 0, vy: 0, angle: 0 },
    dodge: { isDodging: false, timer: 0, duration: 0.28, cooldownTimer: 0 },
    attackCombo: { comboStep: 0, cooldown: 0, isAttacking: false, swingAngle: 0, swingProgress: 0 },
    hitStopMs: 0,
    cameraShake: 0,
    particles: [] as ParticleEffect[],
    projectiles: [] as Projectile[],
    floatingTexts: [] as FloatingText[],
    monsters: [] as Monster[],
    resourceNodes: [] as WorldResourceNode[],
    placedBuildings: player.territoryBuildings || [],
    lastSpawnTime: Date.now(),
    lastBossSpawnTime: Date.now(),
    productionTimer: 0,
    townRegenTimer: 0,
    isInsideTown: true,
    respawnShieldTimer: 0,
  });

  // Keep references synced
  useEffect(() => {
    gameStateRef.current.playerRef = player;
    gameStateRef.current.placedBuildings = player.territoryBuildings || [];
  }, [player]);

  useEffect(() => {
    gameStateRef.current.isMechaModeRef = isMechaMode;
  }, [isMechaMode]);

  useEffect(() => {
    gameStateRef.current.isPausedRef = isPaused;
  }, [isPaused]);

  useEffect(() => {
    gameStateRef.current.buildPlacingTypeRef = buildPlacingType;
  }, [buildPlacingType]);

  // Handle teleport back to Safe Town Fountain (used by Respawn & Map Recall)
  useEffect(() => {
    if (teleportTrigger && teleportTrigger > 0) {
      const state = gameStateRef.current;
      // 1. Force player coordinates directly to Sacred Fountain (0, 0)
      state.playerPos.x = 0;
      state.playerPos.y = 0;
      state.playerPos.vx = 0;
      state.playerPos.vy = 0;
      state.camera.x = 0;
      state.camera.y = 0;
      state.cameraShake = 0;

      // 2. Clear movement inputs so ghost WASD keys don't push player
      state.keys = {};
      state.justPressedKeys = {};
      state.dodge.isDodging = false;
      state.isInsideTown = true;

      // 3. Grant 6-second Divine Sanctuary Invulnerability Shield
      state.respawnShieldTimer = 6.0;

      // 4. Clear any hostile projectiles in the world
      state.projectiles = state.projectiles.filter((p) => p.isPlayer);

      // 5. Repel all monsters away from Town Barrier and clear combat aggression
      state.monsters.forEach((mob) => {
        mob.isWindup = false;
        mob.windupProgress = 0;
        mob.vx = 0;
        mob.vy = 0;
        const d = Math.hypot(mob.x, mob.y);
        if (d < SAFE_TOWN_RADIUS + 250) {
          const angle = Math.atan2(mob.y, mob.x) || Math.random() * Math.PI * 2;
          mob.x = Math.cos(angle) * (SAFE_TOWN_RADIUS + 350);
          mob.y = Math.sin(angle) * (SAFE_TOWN_RADIUS + 350);
        }
      });

      lastReportedCoordRef.current = { x: 0, y: 0, time: performance.now() };

      // 6. Notify parent state immediately
      callbacksRef.current.onPlayerPosChange?.({ x: 0, y: 0 });
      callbacksRef.current.onSafeZoneChange?.(true);

      state.floatingTexts.push({
        id: `tp_${Date.now()}`,
        x: 0,
        y: -40,
        text: '🛡️ RESPAWNED IN SAFE SANCTUARY (SACRED FOUNTAIN)',
        color: '#34d399',
        size: 20,
        life: 2.5,
        maxLife: 2.5,
      });
    }
  }, [teleportTrigger]);

  // Main Canvas & Simulation Lifecycle
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Initialize world resource nodes in outer wilderness biomes
    const initialResources: WorldResourceNode[] = [];
    for (let i = 0; i < 48; i++) {
      const angle = (i * 137.5 * Math.PI) / 180;
      // Resources spawned outside Safe Town (radius 420 to 1400)
      const dist = 420 + (i % 8) * 120;
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist;

      const typePick = i % 4;
      if (typePick === 0) {
        initialResources.push({
          id: `tree_${i}`,
          type: 'tree',
          x,
          y,
          hp: 40,
          maxHp: 40,
          yieldType: 'wood',
          yieldAmount: 15,
        });
      } else if (typePick === 1) {
        initialResources.push({
          id: `ore_${i}`,
          type: 'ore',
          x,
          y,
          hp: 60,
          maxHp: 60,
          yieldType: 'ore',
          yieldAmount: 12,
        });
      } else if (typePick === 2) {
        initialResources.push({
          id: `aether_${i}`,
          type: 'aether_crystal',
          x,
          y,
          hp: 80,
          maxHp: 80,
          yieldType: 'aether',
          yieldAmount: 8,
        });
      } else {
        initialResources.push({
          id: `wreck_${i}`,
          type: 'mecha_wreck',
          x,
          y,
          hp: 90,
          maxHp: 90,
          yieldType: 'mechaScrap',
          yieldAmount: 10,
        });
      }
    }
    gameStateRef.current.resourceNodes = initialResources;

    // Spawn monster in distinct regional wilderness biomes (Far outside Safe Town!)
    const spawnMonsterInWilderness = (rank: RankTier, isBoss = false): Monster => {
      // Pick biome quadrant outside Safe Town:
      // Quadrant 0: Vorpal Forest (North-East: angle -0.2 to 1.3 rad, dist 600-1100)
      // Quadrant 1: Mecha Badlands (South-East: angle 1.4 to 2.8 rad, dist 650-1200)
      // Quadrant 2: Abyssal Waters (South-West: angle 2.9 to 4.2 rad, dist 650-1200)
      // Quadrant 3: Colossus Plateau (North-West: angle 4.3 to 5.9 rad, dist 700-1300)
      let minAngle = 0;
      let maxAngle = Math.PI * 2;
      let minRank = rank;

      if (rank === 'E' || rank === 'D') {
        // Vorpal Forest (North-East)
        minAngle = 0;
        maxAngle = Math.PI * 0.5;
      } else if (rank === 'C' || rank === 'B') {
        // Mecha Scrap Badlands (South-East)
        minAngle = Math.PI * 0.5;
        maxAngle = Math.PI;
      } else if (rank === 'A') {
        // Abyssal Waters (South-West)
        minAngle = Math.PI;
        maxAngle = Math.PI * 1.5;
      } else {
        // Colossus Peak (North-West)
        minAngle = Math.PI * 1.5;
        maxAngle = Math.PI * 2;
      }

      const angle = minAngle + Math.random() * (maxAngle - minAngle);
      const dist = isBoss ? 800 + Math.random() * 300 : 580 + Math.random() * 500;
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist;

      if (isBoss) {
        const isWezaemon = rank === 'SSS';
        return {
          id: `monster_${Date.now()}_${Math.random()}`,
          name: isWezaemon ? 'Gravekeeper Wezaemon (Colossus)' : `Rank ${rank} Dreadnought Colossus`,
          title: isWezaemon ? 'The Undying Swordsman of the Ancient Age' : 'Apex Threat Entity',
          rank,
          isColossus: true,
          x,
          y,
          vx: 0,
          vy: 0,
          hp: isWezaemon ? 4500 : 2200,
          maxHp: isWezaemon ? 4500 : 2200,
          atk: isWezaemon ? 48 : 34,
          def: isWezaemon ? 25 : 18,
          speed: isWezaemon ? 130 : 105,
          attackRange: isWezaemon ? 180 : 150,
          attackCooldown: 2.2,
          lastAttackTime: 0,
          windupTime: 1.1,
          isWindup: false,
          windupProgress: 0,
          expReward: isWezaemon ? 3500 : 1800,
          goldReward: isWezaemon ? 4000 : 2000,
          drops: [{ name: 'Colossus Core', chance: 1.0 }, { name: 'Kirin Frame Schematics', chance: 0.8 }],
          size: isWezaemon ? 46 : 38,
          color: isWezaemon ? '#ef4444' : '#8b5cf6',
          type: 'colossus',
          behavior: 'boss_phase1',
          phase: 1,
        };
      }

      const rankData: Record<RankTier, { name: string; hp: number; atk: number; def: number; speed: number; exp: number; gold: number; size: number; color: string; type: Monster['type'] }> = {
        F: { name: 'Slime Creeper', hp: 50, atk: 8, def: 2, speed: 70, exp: 30, gold: 20, size: 16, color: '#22c55e', type: 'beast' },
        E: { name: 'Horned Vorpal Rabbit', hp: 90, atk: 12, def: 4, speed: 110, exp: 60, gold: 45, size: 18, color: '#38bdf8', type: 'beast' },
        D: { name: 'Ironhide Boar', hp: 160, atk: 16, def: 8, speed: 90, exp: 110, gold: 80, size: 22, color: '#f59e0b', type: 'beast' },
        C: { name: 'Mud-Digger Behemoth', hp: 280, atk: 22, def: 12, speed: 80, exp: 200, gold: 160, size: 28, color: '#d97706', type: 'beast' },
        B: { name: 'Cyber-Raptor', hp: 440, atk: 28, def: 15, speed: 140, exp: 380, gold: 280, size: 26, color: '#06b6d4', type: 'automaton' },
        A: { name: 'Magitech Automaton', hp: 720, atk: 36, def: 22, speed: 100, exp: 650, gold: 500, size: 32, color: '#ec4899', type: 'automaton' },
        S: { name: 'Shadow Prowler', hp: 1200, atk: 45, def: 26, speed: 150, exp: 1200, gold: 950, size: 34, color: '#a855f7', type: 'beast' },
        SS: { name: 'Siege Dreadnought', hp: 2000, atk: 52, def: 32, speed: 105, exp: 2200, gold: 1800, size: 40, color: '#dc2626', type: 'dreadnought' },
        SSS: { name: 'Gravekeeper Wezaemon', hp: 4500, atk: 65, def: 40, speed: 130, exp: 4000, gold: 4500, size: 46, color: '#ef4444', type: 'colossus' },
      };

      const data = rankData[minRank] || rankData.F;
      return {
        id: `monster_${Date.now()}_${Math.random()}`,
        name: `${data.name} [Rank ${minRank}]`,
        rank: minRank,
        x,
        y,
        vx: 0,
        vy: 0,
        hp: data.hp,
        maxHp: data.hp,
        atk: data.atk,
        def: data.def,
        speed: data.speed,
        attackRange: data.type === 'automaton' ? 120 : 50,
        attackCooldown: 1.6,
        lastAttackTime: 0,
        windupTime: 0.7,
        isWindup: false,
        windupProgress: 0,
        expReward: data.exp,
        goldReward: data.gold,
        drops: [{ name: 'Scrap Ore', chance: 0.7 }],
        size: data.size,
        color: data.color,
        type: data.type,
        behavior: 'patrol',
      };
    };

    // Spawn 6 initial mobs stationed in their outer biomes
    const initialMobs: Monster[] = [
      spawnMonsterInWilderness('E'),
      spawnMonsterInWilderness('D'),
      spawnMonsterInWilderness('C'),
      spawnMonsterInWilderness('B'),
    ];
    gameStateRef.current.monsters = initialMobs;

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      if (!gameStateRef.current.keys[code]) {
        gameStateRef.current.justPressedKeys[code] = true;
      }
      gameStateRef.current.keys[code] = true;

      // Quick hotkeys
      if (code === 'KeyR') {
        const hasHangar = gameStateRef.current.placedBuildings.some((b) => b.type === 'mecha_hangar');
        const isUnlocked = hasHangar || (gameStateRef.current.playerRef.level >= 3);
        if (isUnlocked) {
          setIsMechaMode((prev) => {
            const next = !prev;
            if (next) {
              try { soundFx.playMechaEngage(); } catch {}
            }
            return next;
          });
        }
      }

      if (code === 'Digit1') triggerActiveSkill(0);
      if (code === 'Digit2') triggerActiveSkill(1);
      if (code === 'Digit3') triggerActiveSkill(2);
      if (code === 'Digit4') triggerActiveSkill(3);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameStateRef.current.keys[e.code] = false;
    };

    const handleBlur = () => {
      gameStateRef.current.keys = {};
      gameStateRef.current.justPressedKeys = {};
      gameStateRef.current.mouse.isDown = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const state = gameStateRef.current;
      const rect = canvas.getBoundingClientRect();
      state.mouse.screenX = e.clientX - rect.left;
      state.mouse.screenY = e.clientY - rect.top;
      state.mouse.worldX = state.mouse.screenX - canvas.width / 2 + state.camera.x;
      state.mouse.worldY = state.mouse.screenY - canvas.height / 2 + state.camera.y;
    };

    const handleMouseDown = (e: MouseEvent) => {
      const state = gameStateRef.current;
      if (e.button === 0) {
        state.mouse.isDown = true;
        // Check building placement
        if (state.buildPlacingTypeRef) {
          const bp = BUILDING_BLUEPRINTS[state.buildPlacingTypeRef];
          if (bp) {
            onBuildingPlaced({
              id: `bld_${Date.now()}_${Math.random()}`,
              type: state.buildPlacingTypeRef,
              name: bp.name,
              x: Math.round(state.mouse.worldX / 30) * 30,
              y: Math.round(state.mouse.worldY / 30) * 30,
              tier: 1,
              hp: 600,
              maxHp: 600,
              lastProductionTime: Date.now(),
              attackCooldown: 0,
            });
            try { soundFx.playBuild(); } catch {}
            return;
          }
        }
        // Attack
        performAttack();
      } else if (e.button === 2) {
        e.preventDefault();
        state.mouse.rightDown = true;
        performDodge();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) gameStateRef.current.mouse.isDown = false;
      if (e.button === 2) gameStateRef.current.mouse.rightDown = false;
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      if (gameStateRef.current.buildPlacingTypeRef) {
        onCancelBuild();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('contextmenu', handleContextMenu);

    // Attack action (with Safe Town non-combat rule!)
    function performAttack() {
      const state = gameStateRef.current;
      const p = state.playerRef;
      if (state.dodge.isDodging) return;

      // Safe Town Peacekeeper Rule: Weapons sealed inside town
      const distFromCenter = Math.hypot(state.playerPos.x, state.playerPos.y);
      if (distFromCenter < SAFE_TOWN_RADIUS) {
        state.floatingTexts.push({
          id: `safe_${Date.now()}`,
          x: state.playerPos.x,
          y: state.playerPos.y - 25,
          text: 'SAFE ZONE · WEAPONS SEALED',
          color: '#34d399',
          size: 13,
          life: 0.6,
          maxLife: 0.6,
        });
        return;
      }

      const angle = Math.atan2(state.mouse.worldY - state.playerPos.y, state.mouse.worldX - state.playerPos.x);

      if (state.isMechaModeRef) {
        try { soundFx.playLaser(); } catch {}
        const perp = angle + Math.PI / 2;
        const offset = 18;

        [-offset, offset].forEach((off) => {
          state.projectiles.push({
            id: `proj_${Date.now()}_${Math.random()}`,
            x: state.playerPos.x + Math.cos(angle) * 35 + Math.cos(perp) * off,
            y: state.playerPos.y + Math.sin(angle) * 35 + Math.sin(perp) * off,
            vx: Math.cos(angle) * 750,
            vy: Math.sin(angle) * 750,
            damage: p.stats.atk * 1.85,
            isPlayer: true,
            isMechaLaser: true,
            rangeRemaining: 650,
            color: '#06b6d4',
            radius: 5,
            pierce: 2,
          });
        });
        return;
      }

      // Normal Hero Attack (Melee Slash Combo)
      try { soundFx.playSlash(); } catch {}
      state.attackCombo.isAttacking = true;
      state.attackCombo.swingAngle = angle;
      state.attackCombo.swingProgress = 0;
      state.attackCombo.comboStep = (state.attackCombo.comboStep + 1) % 3;

      const reach = 85;
      const isCrit = Math.random() < p.stats.criticalChance;
      let hitAny = false;

      state.monsters.forEach((mob) => {
        const dx = mob.x - state.playerPos.x;
        const dy = mob.y - state.playerPos.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= reach + mob.size) {
          const mobAngle = Math.atan2(dy, dx);
          let diffAngle = mobAngle - angle;
          while (diffAngle < -Math.PI) diffAngle += Math.PI * 2;
          while (diffAngle > Math.PI) diffAngle -= Math.PI * 2;

          if (Math.abs(diffAngle) < Math.PI / 1.7) {
            hitAny = true;
            const rawDmg = p.stats.atk * (isCrit ? 2.2 : 1.0) * (1 + state.attackCombo.comboStep * 0.2);
            const netDmg = Math.max(5, Math.round(rawDmg - mob.def * 0.4));
            mob.hp -= netDmg;

            mob.vx += Math.cos(angle) * 180;
            mob.vy += Math.sin(angle) * 180;

            for (let i = 0; i < (isCrit ? 16 : 8); i++) {
              state.particles.push({
                x: mob.x,
                y: mob.y,
                vx: Math.cos(angle + (Math.random() - 0.5) * 1.5) * (150 + Math.random() * 150),
                vy: Math.sin(angle + (Math.random() - 0.5) * 1.5) * (150 + Math.random() * 150),
                life: 0.35,
                maxLife: 0.35,
                color: isCrit ? '#f59e0b' : '#38bdf8',
                size: isCrit ? 4 : 2.5,
                shape: 'spark',
              });
            }

            state.floatingTexts.push({
              id: `dmg_${Date.now()}_${Math.random()}`,
              x: mob.x + (Math.random() - 0.5) * 20,
              y: mob.y - 15,
              text: isCrit ? `CRIT! ${netDmg}` : `${netDmg}`,
              color: isCrit ? '#fbbf24' : '#ffffff',
              size: isCrit ? 20 : 15,
              life: 0.8,
              maxLife: 0.8,
            });

            if (isCrit) {
              try { soundFx.playCritical(); } catch {}
              state.hitStopMs = 45;
              state.cameraShake = 5;
            }
          }
        }
      });

      // Harvest nearby world resources
      state.resourceNodes.forEach((node) => {
        const dx = node.x - state.playerPos.x;
        const dy = node.y - state.playerPos.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= reach + 25) {
          node.hp -= 25;
          state.floatingTexts.push({
            id: `gth_${Date.now()}_${Math.random()}`,
            x: node.x,
            y: node.y - 20,
            text: `+${Math.ceil(node.yieldAmount / 3)} ${node.yieldType}`,
            color: '#34d399',
            size: 14,
            life: 0.65,
            maxLife: 0.65,
          });

          onResourceGathered(node.yieldType, Math.ceil(node.yieldAmount / 3));

          if (node.hp <= 0) {
            onResourceGathered(node.yieldType, node.yieldAmount);
            node.hp = node.maxHp;
            node.x += (Math.random() - 0.5) * 300;
            node.y += (Math.random() - 0.5) * 300;
          }
        }
      });

      if (hitAny) {
        state.cameraShake = Math.max(state.cameraShake, 2);
      }
    }

    // Dodge action
    function performDodge() {
      const state = gameStateRef.current;
      if (state.dodge.isDodging || state.dodge.cooldownTimer > 0) return;

      try { soundFx.playDodge(); } catch {}
      state.dodge.isDodging = true;
      state.dodge.timer = state.dodge.duration;
      state.dodge.cooldownTimer = 0.55;

      let dx = 0;
      let dy = 0;
      if (state.keys['KeyW'] || state.keys['ArrowUp']) dy -= 1;
      if (state.keys['KeyS'] || state.keys['ArrowDown']) dy += 1;
      if (state.keys['KeyA'] || state.keys['ArrowLeft']) dx -= 1;
      if (state.keys['KeyD'] || state.keys['ArrowRight']) dx += 1;

      if (dx === 0 && dy === 0) {
        const angle = Math.atan2(state.mouse.worldY - state.playerPos.y, state.mouse.worldX - state.playerPos.x);
        dx = Math.cos(angle);
        dy = Math.sin(angle);
      } else {
        const len = Math.hypot(dx, dy);
        dx /= len;
        dy /= len;
      }

      const dodgeSpeed = state.isMechaModeRef ? 700 : 540;
      state.playerPos.vx = dx * dodgeSpeed;
      state.playerPos.vy = dy * dodgeSpeed;
    }

    // Trigger skills by slot (safe zone checks)
    function triggerActiveSkill(slotIdx: number) {
      const state = gameStateRef.current;
      const skillId = state.playerRef.activeSkills[slotIdx];
      if (!skillId) return;

      // Safe Town Peacekeeper Rule
      const distFromCenter = Math.hypot(state.playerPos.x, state.playerPos.y);
      if (distFromCenter < SAFE_TOWN_RADIUS) {
        state.floatingTexts.push({
          id: `safe_sk_${Date.now()}`,
          x: state.playerPos.x,
          y: state.playerPos.y - 25,
          text: 'SAFE ZONE · SKILLS SEALED',
          color: '#34d399',
          size: 13,
          life: 0.6,
          maxLife: 0.6,
        });
        return;
      }

      const p = state.playerRef;
      const angle = Math.atan2(state.mouse.worldY - state.playerPos.y, state.mouse.worldX - state.playerPos.x);

      if (skillId === 'spiral_thrust') {
        try { soundFx.playSlash(); } catch {}
        state.projectiles.push({
          id: `proj_${Date.now()}`,
          x: state.playerPos.x,
          y: state.playerPos.y,
          vx: Math.cos(angle) * 600,
          vy: Math.sin(angle) * 600,
          damage: p.stats.atk * 2.8,
          isPlayer: true,
          rangeRemaining: 400,
          color: '#38bdf8',
          radius: 12,
          pierce: 5,
        });
        state.cameraShake = 4;
      } else if (skillId === 'vorpal_dual_strike') {
        try { soundFx.playCritical(); } catch {}
        [-0.3, 0.3].forEach((spread) => {
          state.projectiles.push({
            id: `proj_${Date.now()}_${spread}`,
            x: state.playerPos.x,
            y: state.playerPos.y,
            vx: Math.cos(angle + spread) * 550,
            vy: Math.sin(angle + spread) * 550,
            damage: p.stats.atk * 3.2,
            isPlayer: true,
            rangeRemaining: 350,
            color: '#ec4899',
            radius: 10,
            pierce: 3,
          });
        });
      } else if (skillId === 'plasma_overcharge') {
        try { soundFx.playLaser(); } catch {}
        for (let i = -2; i <= 2; i++) {
          const a = angle + i * 0.18;
          state.projectiles.push({
            id: `proj_${Date.now()}_${i}`,
            x: state.playerPos.x,
            y: state.playerPos.y,
            vx: Math.cos(a) * 650,
            vy: Math.sin(a) * 650,
            damage: p.stats.atk * 2.0,
            isPlayer: true,
            isMechaLaser: true,
            rangeRemaining: 500,
            color: '#06b6d4',
            radius: 6,
            pierce: 2,
          });
        }
      } else if (skillId === 'tactical_missile_salvo') {
        try { soundFx.playMissile(); } catch {}
        for (let i = 0; i < 6; i++) {
          const a = angle + (Math.random() - 0.5) * 1.2;
          state.projectiles.push({
            id: `missile_${Date.now()}_${i}`,
            x: state.playerPos.x,
            y: state.playerPos.y,
            vx: Math.cos(a) * 450,
            vy: Math.sin(a) * 450,
            damage: p.stats.atk * 3.5,
            isPlayer: true,
            isMissile: true,
            rangeRemaining: 600,
            color: '#f97316',
            radius: 8,
          });
        }
      } else if (skillId === 'titan_mecha_overdrive') {
        setIsMechaMode(true);
        try { soundFx.playMechaEngage(); } catch {}
        state.cameraShake = 8;
      } else if (skillId === 'crimson_blade_torrent') {
        try { soundFx.playCritical(); } catch {}
        state.cameraShake = 10;
        for (let i = 0; i < 16; i++) {
          const a = (i * Math.PI * 2) / 16;
          state.projectiles.push({
            id: `blade_${Date.now()}_${i}`,
            x: state.playerPos.x,
            y: state.playerPos.y,
            vx: Math.cos(a) * 500,
            vy: Math.sin(a) * 500,
            damage: p.stats.atk * 4.2,
            isPlayer: true,
            rangeRemaining: 400,
            color: '#ef4444',
            radius: 9,
            pierce: 99,
          });
        }
      }
    }

    const checkSpace = () => {
      const state = gameStateRef.current;
      if (state.justPressedKeys['Space']) {
        state.justPressedKeys['Space'] = false;
        performDodge();
      }
    };

    // ----------------------------------------------------
    // MAIN GAME LOOP (60FPS RAF SIMULATION)
    // ----------------------------------------------------
    const gameLoop = (currentTime: number) => {
      const state = gameStateRef.current;
      const rawDt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      const dt = Math.min(rawDt, 0.05);

      if (!state.isPausedRef) {
        checkSpace();

        if (state.respawnShieldTimer > 0) {
          state.respawnShieldTimer = Math.max(0, state.respawnShieldTimer - dt);
        }

        if (state.hitStopMs > 0) {
          state.hitStopMs -= dt * 1000;
        } else {
          // 1. Player Input & Movement
          const p = state.playerRef;
          let moveX = 0;
          let moveY = 0;
          if (state.keys['KeyW'] || state.keys['ArrowUp']) moveY -= 1;
          if (state.keys['KeyS'] || state.keys['ArrowDown']) moveY += 1;
          if (state.keys['KeyA'] || state.keys['ArrowLeft']) moveX -= 1;
          if (state.keys['KeyD'] || state.keys['ArrowRight']) moveX += 1;

          if (moveX !== 0 && moveY !== 0) {
            moveX *= 0.7071;
            moveY *= 0.7071;
          }

          const baseSpeed = p.stats.speed * (state.isMechaModeRef ? 1.6 : 1.0);
          if (!state.dodge.isDodging) {
            state.playerPos.vx = moveX * baseSpeed;
            state.playerPos.vy = moveY * baseSpeed;
          }

          state.playerPos.x += state.playerPos.vx * dt;
          state.playerPos.y += state.playerPos.vy * dt;

          if (state.dodge.isDodging) {
            state.playerPos.vx *= 0.94;
            state.playerPos.vy *= 0.94;
            state.dodge.timer -= dt;
            if (state.dodge.timer <= 0) state.dodge.isDodging = false;
          }
          if (state.dodge.cooldownTimer > 0) {
            state.dodge.cooldownTimer -= dt;
          }

          // Camera follow
          state.camera.x += (state.playerPos.x - state.camera.x) * 6 * dt;
          state.camera.y += (state.playerPos.y - state.camera.y) * 6 * dt;

          if (state.cameraShake > 0) {
            state.cameraShake = Math.max(0, state.cameraShake - dt * 12);
          }

          // Check if player is currently in Safe Town
          const playerDistCenter = Math.hypot(state.playerPos.x, state.playerPos.y);
          const inTown = playerDistCenter <= SAFE_TOWN_RADIUS;
          if (inTown !== state.isInsideTown) {
            state.isInsideTown = inTown;
            callbacksRef.current.onSafeZoneChange?.(inTown);
          }

          // Safe Town Sanctuary passive health regeneration (+15 HP/sec when resting)
          if (inTown && p.stats.hp < p.stats.maxHp) {
            state.townRegenTimer += dt;
            if (state.townRegenTimer >= 1.0) {
              state.townRegenTimer = 0;
              callbacksRef.current.onUpdatePlayer?.((prev) => ({
                ...prev,
                stats: {
                  ...prev.stats,
                  hp: Math.min(prev.stats.maxHp, prev.stats.hp + 15),
                },
              }));
            }
          }

          // Throttle player coordinates reporting to parent (prevents 60FPS React state thrashing)
          const nowCoord = performance.now();
          if (nowCoord - lastReportedCoordRef.current.time > 200) {
            const dx = Math.abs(state.playerPos.x - lastReportedCoordRef.current.x);
            const dy = Math.abs(state.playerPos.y - lastReportedCoordRef.current.y);
            if (dx > 10 || dy > 10) {
              lastReportedCoordRef.current = {
                x: state.playerPos.x,
                y: state.playerPos.y,
                time: nowCoord,
              };
              callbacksRef.current.onPlayerPosChange?.({
                x: Math.round(state.playerPos.x),
                y: Math.round(state.playerPos.y),
              });
            }
          }

          // 2. Pre-Existing Town & Outpost Production Timers
          state.productionTimer += dt;
          if (state.productionTimer >= 3.0) {
            state.productionTimer = 0;
            // The Pre-Built Town Central Refinery continuously grants aether and scrap to the hero!
            onResourceGathered('aether', 1);
            onResourceGathered('mechaScrap', 1);
            // The Pre-Built Adventurer Guild continuously awards Guild mercenary gold!
            onUpdatePlayer((prev) => ({ ...prev, gold: prev.gold + 4 }));

            // Any player-placed wilderness field outposts also produce
            state.placedBuildings.forEach((bld) => {
              if (bld.type === 'refinery') {
                onResourceGathered('aether', 1);
                onResourceGathered('mechaScrap', 1);
              } else if (bld.type === 'guild_hall') {
                onUpdatePlayer((prev) => ({ ...prev, gold: prev.gold + 5 }));
              }
            });
          }

          // Pre-Built Town Gate Defense Turrets actively guard against wilderness beasts
          PRE_BUILT_TOWN_BUILDINGS.filter((b) => b.type === 'defense_turret').forEach((turret) => {
            turret.attackCooldown = Math.max(0, turret.attackCooldown - dt);
            if (turret.attackCooldown <= 0) {
              const target = state.monsters.find((m) => Math.hypot(m.x - turret.x, m.y - turret.y) < 280);
              if (target) {
                turret.attackCooldown = 1.3;
                try { soundFx.playLaser(); } catch {}
                const a = Math.atan2(target.y - turret.y, target.x - turret.x);
                state.projectiles.push({
                  id: `turret_${Date.now()}_${Math.random()}`,
                  x: turret.x,
                  y: turret.y,
                  vx: Math.cos(a) * 650,
                  vy: Math.sin(a) * 650,
                  damage: 55,
                  isPlayer: true,
                  color: '#34d399',
                  radius: 5,
                  rangeRemaining: 320,
                });
              }
            }
          });

          // 3. Spawning monsters: NOT right after town, and NOT often! (Every 18 seconds, max 7 monsters)
          const nowMs = Date.now();
          if (state.monsters.length < 7 && nowMs - state.lastSpawnTime > 18000) {
            state.lastSpawnTime = nowMs;
            const availableRanks: RankTier[] = p.level < 4 ? ['E', 'D'] : p.level < 8 ? ['D', 'C', 'B'] : ['C', 'B', 'A'];
            const r = availableRanks[Math.floor(Math.random() * availableRanks.length)];
            state.monsters.push(spawnMonsterInWilderness(r));
          }

          // Colossus spawn (slow, epic, outside in Colossus Peak)
          if (p.level >= 6 && nowMs - state.lastBossSpawnTime > 60000) {
            state.lastBossSpawnTime = nowMs;
            const hasBoss = state.monsters.some((m) => m.isColossus);
            if (!hasBoss) {
              const bossRank: RankTier = p.level >= 12 ? 'SSS' : 'S';
              state.monsters.push(spawnMonsterInWilderness(bossRank, true));
              try { soundFx.playBossRoar(); } catch {}
              state.cameraShake = 8;
            }
          }

          // 4. Monster AI & Safe Town Barrier Repel!
          state.monsters.forEach((mob) => {
            const dx = state.playerPos.x - mob.x;
            const dy = state.playerPos.y - mob.y;
            const distToPlayer = Math.hypot(dx, dy);

            // Friction
            mob.vx *= 0.9;
            mob.vy *= 0.9;
            mob.x += mob.vx * dt;
            mob.y += mob.vy * dt;

            // Safe Town Barrier Check: Monsters strictly cannot enter safe town!
            const mobDistFromCenter = Math.hypot(mob.x, mob.y);
            if (mobDistFromCenter < SAFE_TOWN_RADIUS + 40) {
              const pushAngle = Math.atan2(mob.y, mob.x);
              mob.x = Math.cos(pushAngle) * (SAFE_TOWN_RADIUS + 45);
              mob.y = Math.sin(pushAngle) * (SAFE_TOWN_RADIUS + 45);
              mob.vx = Math.cos(pushAngle) * 120;
              mob.vy = Math.sin(pushAngle) * 120;
              return;
            }

            // If player is inside safe town, monsters CANNOT attack the player!
            if (inTown) {
              mob.isWindup = false;
              // Roam peacefully in wilderness
              return;
            }

            // Normal Wilderness Combat
            if (distToPlayer < mob.attackRange + 20) {
              if (!mob.isWindup) {
                mob.isWindup = true;
                mob.windupProgress = 0;
              } else {
                mob.windupProgress += dt / mob.windupTime;
                if (mob.windupProgress >= 1.0) {
                  mob.windupProgress = 0;
                  mob.isWindup = false;
                  // Strike player if not dodging, not in safe zone, and not under respawn aegis shield
                  if (!state.dodge.isDodging && !inTown && state.respawnShieldTimer <= 0 && distToPlayer < mob.attackRange + 30) {
                    const rawMobDmg = mob.atk - p.stats.def * 0.35;
                    const netDmg = Math.max(4, Math.round(rawMobDmg));
                    onUpdatePlayer((prev) => ({
                      ...prev,
                      stats: { ...prev.stats, hp: Math.max(0, prev.stats.hp - netDmg) },
                    }));
                    try { soundFx.playSlash(); } catch {}
                    state.cameraShake = 6;
                    state.floatingTexts.push({
                      id: `pl_hit_${Date.now()}_${Math.random()}`,
                      x: state.playerPos.x,
                      y: state.playerPos.y - 25,
                      text: `-${netDmg} HP`,
                      color: '#ef4444',
                      size: 18,
                      life: 0.8,
                      maxLife: 0.8,
                    });
                  }
                }
              }
            } else {
              mob.isWindup = false;
              // Chase player in wilderness
              const angle = Math.atan2(dy, dx);
              mob.x += Math.cos(angle) * mob.speed * dt;
              mob.y += Math.sin(angle) * mob.speed * dt;
            }
          });

          // Check Monster Deaths
          for (let i = state.monsters.length - 1; i >= 0; i--) {
            const mob = state.monsters[i];
            if (mob.hp <= 0) {
              state.monsters.splice(i, 1);
              onMonsterDefeated(mob);

              state.floatingTexts.push({
                id: `reward_${Date.now()}_${Math.random()}`,
                x: mob.x,
                y: mob.y,
                text: `+${mob.expReward} EXP  +${mob.goldReward}G`,
                color: '#fbbf24',
                size: 16,
                life: 1.2,
                maxLife: 1.2,
              });

              for (let pIdx = 0; pIdx < 16; pIdx++) {
                const a = Math.random() * Math.PI * 2;
                state.particles.push({
                  x: mob.x,
                  y: mob.y,
                  vx: Math.cos(a) * (80 + Math.random() * 120),
                  vy: Math.sin(a) * (80 + Math.random() * 120),
                  life: 0.45,
                  maxLife: 0.45,
                  color: mob.color,
                  size: 3 + Math.random() * 4,
                  shape: 'spark',
                });
              }
            }
          }

          // Projectile simulation
          for (let i = state.projectiles.length - 1; i >= 0; i--) {
            const proj = state.projectiles[i];
            const stepDist = Math.hypot(proj.vx, proj.vy) * dt;
            proj.x += proj.vx * dt;
            proj.y += proj.vy * dt;
            proj.rangeRemaining -= stepDist;

            if (proj.isPlayer) {
              for (const mob of state.monsters) {
                const d = Math.hypot(mob.x - proj.x, mob.y - proj.y);
                if (d < mob.size + proj.radius) {
                  const dmg = Math.round(proj.damage);
                  mob.hp -= dmg;
                  mob.vx += (proj.vx / 500) * 100;
                  mob.vy += (proj.vy / 500) * 100;

                  state.floatingTexts.push({
                    id: `proj_hit_${Date.now()}_${Math.random()}`,
                    x: mob.x,
                    y: mob.y - 10,
                    text: `${dmg}`,
                    color: proj.color,
                    size: 17,
                    life: 0.6,
                    maxLife: 0.6,
                  });

                  if (proj.isMissile) {
                    try { soundFx.playMissile(); } catch {}
                    state.cameraShake = 4;
                  }

                  if (proj.pierce && proj.pierce > 1) {
                    proj.pierce -= 1;
                  } else {
                    proj.rangeRemaining = -1;
                    break;
                  }
                }
              }
            }

            if (proj.rangeRemaining <= 0) {
              state.projectiles.splice(i, 1);
            }
          }

          // Particles & Floating texts
          for (let i = state.particles.length - 1; i >= 0; i--) {
            const part = state.particles[i];
            part.x += part.vx * dt;
            part.y += part.vy * dt;
            part.life -= dt;
            if (part.life <= 0) state.particles.splice(i, 1);
          }

          for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
            const fl = state.floatingTexts[i];
            fl.y -= 35 * dt;
            fl.life -= dt;
            if (fl.life <= 0) state.floatingTexts.splice(i, 1);
          }
        }
      }

      // ----------------------------------------------------
      // RENDERING PIPELINE
      // ----------------------------------------------------
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      const shakeX = (Math.random() - 0.5) * state.cameraShake * 2;
      const shakeY = (Math.random() - 0.5) * state.cameraShake * 2;
      ctx.translate(canvas.width / 2 - state.camera.x + shakeX, canvas.height / 2 - state.camera.y + shakeY);

      // 1. Grid Background
      const gridSize = 80;
      const startX = Math.floor((state.camera.x - canvas.width / 2) / gridSize) * gridSize;
      const endX = startX + canvas.width + gridSize * 2;
      const startY = Math.floor((state.camera.y - canvas.height / 2) / gridSize) * gridSize;
      const endY = startY + canvas.height + gridSize * 2;

      ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
      ctx.lineWidth = 1;
      for (let x = startX; x <= endX; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.stroke();
      }
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
      }

      // 2. PRE-EXISTING ANCIENT SAFE TOWN OF AETHERIA (Pre-Built Sanctuary)
      // Cobblestone Town Ground
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.beginPath();
      ctx.arc(0, 0, SAFE_TOWN_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Stone Town Perimeter Wall (Thick Fortified Rampart)
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(0, 0, SAFE_TOWN_RADIUS - 4, 0, Math.PI * 2);
      ctx.stroke();

      // Cobblestone Main Thoroughfares (Crossroads connecting all quadrants and gates)
      ctx.fillStyle = 'rgba(51, 65, 85, 0.55)';
      ctx.fillRect(-22, -SAFE_TOWN_RADIUS + 10, 44, (SAFE_TOWN_RADIUS - 10) * 2);
      ctx.fillRect(-SAFE_TOWN_RADIUS + 10, -22, (SAFE_TOWN_RADIUS - 10) * 2, 44);

      // Cobblestone Pavers Texture
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)';
      ctx.lineWidth = 1.5;
      for (let r = 80; r < SAFE_TOWN_RADIUS; r += 70) {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Peacekeeper Barrier Forcefield (Luminous Emerald Dome)
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.85)';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(0, 0, SAFE_TOWN_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Safe Town Perimeter Banner
      ctx.fillStyle = 'rgba(52, 211, 153, 0.95)';
      ctx.font = 'bold 11px Rajdhani, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🛡️ PRE-BUILT SAFE TOWN · PEACEKEEPER BARRIER · WEAPONS SEALED', 0, -SAFE_TOWN_RADIUS - 14);

      // 3. PRE-BUILT TOWN BUILDINGS (Permanent Ancient Settlement Facilities)
      PRE_BUILT_TOWN_BUILDINGS.forEach((bld) => {
        ctx.save();
        ctx.translate(bld.x, bld.y);

        if (bld.type === 'guild_hall') {
          // Grand Adventurer Guild Headquarters
          ctx.fillStyle = '#1e293b';
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(-40, -35, 80, 70, 8);
          ctx.fill();
          ctx.stroke();

          // Guild Roof & Crest
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.moveTo(-44, -35);
          ctx.lineTo(0, -56);
          ctx.lineTo(44, -35);
          ctx.fill();
          ctx.strokeStyle = '#f59e0b';
          ctx.stroke();

          // Gold Guild Banner & Reception Door
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(-10, -10, 20, 25);
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(0, -22, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 10px Rajdhani, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('ADVENTURER GUILD [G]', 0, 48);
        } else if (bld.type === 'blacksmith') {
          // Ancient Armory & Forge
          ctx.fillStyle = '#262626';
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(-38, -34, 76, 68, 6);
          ctx.fill();
          ctx.stroke();

          // Forge Chimney & Glowing Fire Anvil
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 10;
          ctx.fillRect(-12, -8, 24, 16);
          ctx.shadowBlur = 0;

          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(-16, -38, 12, 16); // Chimney

          ctx.fillStyle = '#fdba74';
          ctx.font = 'bold 10px Rajdhani, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('MASTER BLACKSMITH', 0, 48);
        } else if (bld.type === 'mecha_hangar') {
          // Sanctuary Mecha Hangar
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(-42, -35, 84, 70, 8);
          ctx.fill();
          ctx.stroke();

          // Caution Hazard Stripes
          ctx.fillStyle = '#eab308';
          ctx.fillRect(-36, -30, 72, 6);

          // Mecha Docking Bay Core
          ctx.fillStyle = '#0891b2';
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(0, 2, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.fillStyle = '#67e8f9';
          ctx.font = 'bold 10px Rajdhani, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('MECHA HANGAR [R]', 0, 48);
        } else if (bld.type === 'refinery') {
          // Central Aether Refinery Core
          ctx.fillStyle = '#1e1b4b';
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(-38, -34, 76, 68, 8);
          ctx.fill();
          ctx.stroke();

          // Rotating Crystal Core
          const crystalAngle = Date.now() / 600;
          ctx.fillStyle = '#c084fc';
          ctx.shadowColor = '#c084fc';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(0, 0, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.fillStyle = '#e9d5ff';
          ctx.font = 'bold 10px Rajdhani, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('AETHER REFINERY', 0, 48);
        } else if (bld.type === 'defense_turret') {
          // Fortified Gate Defense Turret
          ctx.fillStyle = '#334155';
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Plasma Crystal Barrel
          ctx.fillStyle = '#34d399';
          ctx.shadowColor = '#34d399';
          ctx.shadowBlur = 8;
          ctx.fillRect(-5, -28, 10, 18);
          ctx.shadowBlur = 0;

          ctx.fillStyle = '#6ee7b7';
          ctx.font = 'bold 9px Rajdhani, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(bld.name.includes('North') ? 'NORTH GATE TURRET' : 'SOUTH GATE TURRET', 0, 32);
        }
        ctx.restore();
      });

      // 4. Sanctuary Central Sacred Fountain of Rebirth (Respawn Monument)
      const fountainPulse = Math.sin(Date.now() / 250) * 2;
      ctx.fillStyle = '#0f766e';
      ctx.beginPath();
      ctx.arc(0, 0, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2dd4bf';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Enchanted Water Pool
      ctx.fillStyle = '#14b8a6';
      ctx.beginPath();
      ctx.arc(0, 0, 22 + fountainPulse, 0, Math.PI * 2);
      ctx.fill();

      // Geyser Core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();

      // Safe Town Monument Label
      ctx.fillStyle = '#5eead4';
      ctx.font = 'bold 12px Rajdhani, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SACRED FOUNTAIN (RESPAWN SANCTUARY)', 0, 52);

      // 3. World Resource Nodes (in Wilderness)
      state.resourceNodes.forEach((node) => {
        if (node.type === 'tree') {
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.arc(node.x, node.y - 10, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#78350f';
          ctx.fillRect(node.x - 4, node.y + 4, 8, 12);
        } else if (node.type === 'ore') {
          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.arc(node.x, node.y, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(node.x - 4, node.y - 4, 8, 8);
        } else if (node.type === 'aether_crystal') {
          ctx.fillStyle = '#06b6d4';
          ctx.beginPath();
          ctx.moveTo(node.x, node.y - 24);
          ctx.lineTo(node.x + 12, node.y + 12);
          ctx.lineTo(node.x - 12, node.y + 12);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = '#475569';
          ctx.fillRect(node.x - 18, node.y - 14, 36, 28);
          ctx.fillStyle = '#0ea5e9';
          ctx.fillRect(node.x - 8, node.y - 6, 16, 5);
        }

        if (node.hp < node.maxHp) {
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(node.x - 15, node.y - 30, 30, 4);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(node.x - 15, node.y - 30, 30 * (node.hp / node.maxHp), 4);
        }
      });

      // 4. Placed Territory Buildings
      state.placedBuildings.forEach((bld) => {
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(bld.x - 30, bld.y - 30, 60, 60, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(bld.x, bld.y, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '11px Rajdhani, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(bld.name, bld.x, bld.y + 44);
      });

      // 5. Draw Monsters in Wilderness
      state.monsters.forEach((mob) => {
        if (mob.isWindup) {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(mob.x, mob.y, mob.attackRange * mob.windupProgress, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = mob.color;
        ctx.beginPath();
        ctx.arc(mob.x, mob.y, mob.size, 0, Math.PI * 2);
        ctx.fill();

        // Rank Badge
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(mob.x - 14, mob.y - mob.size - 22, 28, 14);
        ctx.fillStyle = mob.rank === 'SSS' ? '#ef4444' : mob.rank === 'S' || mob.rank === 'SS' ? '#f59e0b' : '#38bdf8';
        ctx.font = 'bold 10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`[${mob.rank}]`, mob.x, mob.y - mob.size - 11);

        // Monster HP Bar
        const barW = Math.max(36, mob.size * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(mob.x - barW / 2, mob.y - mob.size - 7, barW, 5);
        ctx.fillStyle = mob.isColossus ? '#ef4444' : '#22c55e';
        ctx.fillRect(mob.x - barW / 2, mob.y - mob.size - 7, barW * (mob.hp / mob.maxHp), 5);
      });

      // 6. Projectiles
      state.projectiles.forEach((proj) => {
        ctx.fillStyle = proj.color;
        ctx.shadowColor = proj.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 7. Hero / Mecha
      const px = state.playerPos.x;
      const py = state.playerPos.y;
      const aimAngle = Math.atan2(state.mouse.worldY - py, state.mouse.worldX - px);

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(aimAngle);

      if (state.isMechaModeRef) {
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 3;
        ctx.fillRect(-22, -22, 44, 44);
        ctx.strokeRect(-22, -22, 44, 44);

        ctx.fillStyle = '#334155';
        ctx.fillRect(6, -26, 28, 8);
        ctx.fillRect(6, 18, 28, 8);

        ctx.fillStyle = '#06b6d4';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12;
        ctx.fillRect(10, -6, 12, 12);
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.moveTo(6, -8);
        ctx.lineTo(20, 0);
        ctx.lineTo(6, 8);
        ctx.fill();

        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(8, 12);
        ctx.lineTo(26, 18);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(8, -12);
        ctx.lineTo(26, -18);
        ctx.stroke();

        if (state.attackCombo.isAttacking) {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, 48, -0.7, 0.7);
          ctx.stroke();
        }

        // Divine Sanctuary Aegis Shield (Active upon Safe Town respawn)
        if (state.respawnShieldTimer > 0) {
          const shieldPulse = Math.sin(Date.now() / 150) * 4;
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.9)';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(0, 0, 34 + shieldPulse, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = 'rgba(52, 211, 153, 0.15)';
          ctx.beginPath();
          ctx.arc(0, 0, 34 + shieldPulse, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.fillStyle = '#6ee7b7';
          ctx.font = 'bold 10px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`AEGIS SHIELD ${state.respawnShieldTimer.toFixed(1)}s`, 0, -42);
        }
      }
      ctx.restore();

      // 8. Particles
      state.particles.forEach((p) => {
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      // 9. Floating Numbers
      state.floatingTexts.forEach((fl) => {
        const alpha = Math.max(0, fl.life / fl.maxLife);
        ctx.fillStyle = fl.color;
        ctx.globalAlpha = alpha;
        ctx.font = `bold ${fl.size}px Rajdhani, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(fl.text, fl.x, fl.y);
        ctx.globalAlpha = 1.0;
      });

      ctx.restore();

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden select-none bg-slate-950">
      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />
    </div>
  );
};
