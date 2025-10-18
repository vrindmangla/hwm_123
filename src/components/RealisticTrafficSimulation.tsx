import React, { useEffect, useRef, useState } from 'react';

type VehicleType = 'car' | 'suv' | 'bus' | 'truck';
type Direction = 'north' | 'south' | 'east' | 'west';

interface Vehicle {
  id: string;
  type: VehicleType;
  direction: Direction;
  lane: 1 | 2;
  position: number; // px from stop line (increasing away from intersection)
  speed: number; // px/sec
  targetSpeed: number; // px/sec
  acceleration: number; // px/sec^2
  color: string;
  size: { width: number; height: number }; // px
  lateralJitter?: number; // small lateral offset for realism
}

interface RealisticTrafficSimulationProps {
  currentPhase: 'NS' | 'EW';
  timeLeft: number;
  spawnRate?: number;
  canvasSize?: number;
}

const VEHICLE_CONFIGS: Record<VehicleType, { width: number; height: number; color: string; speed: number }> = {
  car: { width: 44, height: 20, color: '#FF4444', speed: 80 },
  suv: { width: 50, height: 22, color: '#4444FF', speed: 70 },
  bus: { width: 88, height: 30, color: '#FFAA00', speed: 50 },
  truck: { width: 100, height: 32, color: '#666666', speed: 45 }
};

const randChoice = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const uid = () => Math.random().toString(36).slice(2, 9);

export const RealisticTrafficSimulation: React.FC<RealisticTrafficSimulationProps> = ({
  currentPhase,
  timeLeft,
  spawnRate = 0.15,
  canvasSize = 800
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const vehiclesRef = useRef<Vehicle[]>([]);
  const animRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const spawnIntervalRef = useRef<number | null>(null);

  const [vehicleCount, setVehicleCount] = useState(0);

  // Setup canvas DPR scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    canvas.style.width = `${canvasSize}px`;
    canvas.style.height = `${canvasSize}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, [canvasSize]);

  // Spawn interval
  useEffect(() => {
    const interval = 800;
    spawnIntervalRef.current = window.setInterval(() => {
      if (Math.random() < spawnRate) spawnVehicle();
    }, interval);
    return () => {
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current);
        spawnIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spawnRate]);

  const spawnVehicle = () => {
    const types: VehicleType[] = ['car', 'suv', 'bus', 'truck'];
    const directions: Direction[] = ['north', 'south', 'east', 'west'];
    const lanes: (1 | 2)[] = [1, 2];
    const type = randChoice(types);
    const direction = randChoice(directions);
    const lane = randChoice(lanes);
    const cfg = VEHICLE_CONFIGS[type];

    // Determine starting position behind existing vehicles in same lane/direction
    const laneVehicles = vehiclesRef.current
      .filter(v => v.direction === direction && v.lane === lane)
      .sort((a, b) => b.position - a.position);

    const minSpacingPx = 30 + cfg.width;
    let startPos = -150;
    if (laneVehicles.length > 0) {
      const farthest = laneVehicles[0];
      startPos = Math.min(-50, farthest.position - minSpacingPx);
    }
    startPos += (Math.random() - 0.5) * 20;

    const lateralJitter = (Math.random() - 0.5) * 3; // small jitter but will be clamped

    const newVehicle: Vehicle = {
      id: uid(),
      type,
      direction,
      lane,
      position: startPos,
      speed: 0,
      targetSpeed: cfg.speed,
      acceleration: 120,
      color: cfg.color,
      size: { width: cfg.width, height: cfg.height },
      lateralJitter
    };

    vehiclesRef.current.push(newVehicle);
    setVehicleCount(vehiclesRef.current.length);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;
    const roadWidth = 160; // px full road width crossing the intersection
    const laneWidth = roadWidth / 4; // 4 logical lanes across the road (2 per direction)
    const halfRoad = roadWidth / 2;
    const roadLeftX = centerX - halfRoad;
    const roadRightX = centerX + halfRoad;
    const roadTopY = centerY - halfRoad;
    const roadBottomY = centerY + halfRoad;

    const drawRoads = () => {
      ctx.fillStyle = '#2C2C2C';
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      ctx.fillStyle = '#404040';
      ctx.fillRect(centerX - halfRoad, 0, roadWidth, canvasSize);
      ctx.fillRect(0, centerY - halfRoad, canvasSize, roadWidth);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 10]);
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, canvasSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(canvasSize, centerY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#333';
      ctx.fillRect(centerX - halfRoad, centerY - halfRoad, roadWidth, roadWidth);
    };

    const drawTrafficLights = () => {
      const nsOn = currentPhase === 'NS';
      const ewOn = currentPhase === 'EW';
      const lightSize = 12;
      const renderPole = (x: number, y: number, ns: boolean, ew: boolean) => {
        ctx.fillStyle = '#111';
        ctx.fillRect(x - 4, y - 16, 8, 32);
        ctx.fillStyle = ns ? '#00cc00' : '#550000';
        ctx.beginPath();
        ctx.arc(x, y - 8, lightSize / 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = ew ? '#00cc00' : '#550000';
        ctx.beginPath();
        ctx.arc(x, y + 8, lightSize / 3, 0, Math.PI * 2);
        ctx.fill();
      };
      renderPole(centerX - halfRoad - 14, centerY - halfRoad - 14, nsOn, ewOn);
      renderPole(centerX + halfRoad + 14, centerY - halfRoad - 14, nsOn, ewOn);
      renderPole(centerX - halfRoad - 14, centerY + halfRoad + 14, nsOn, ewOn);
      renderPole(centerX + halfRoad + 14, centerY + halfRoad + 14, nsOn, ewOn);
    };

    const computeLaneCenterOffset = (laneIndex: 1 | 2) => {
      // We want lane centers that sit fully inside the road:
      // For each approach (NS vertical), lanes are spaced evenly across the road width.
      // We'll position lanes symmetrically around the centerline for each direction.
      // laneWidth is roadWidth / 4. Two lanes per direction occupy one half of the road on each side.
      // For simplicity, for vertical roads (NS), lane lateral offset (x) will be:
      // - lane 1: -laneWidth/2  (closer to left road edge)
      // - lane 2: +laneWidth/2  (closer to center)
      // But to guarantee vehicle fits inside lane, clamp using vehicle half width.
      const offsetForLane = laneIndex === 1 ? -laneWidth / 2 : laneWidth / 2;
      return offsetForLane;
    };

    const drawVehicles = () => {
      const vehicles = vehiclesRef.current;
      vehicles.forEach(v => {
        // Determine lane center offsets (ensuring vehicle stays inside lane)
        // For NS directions (vertical), lateral offset is in x; for EW (horizontal) it's in y.

        // baseOffset is the center offset for the lane in coordinate space
        let baseOffset = computeLaneCenterOffset(v.lane);

        // Compute per-vehicle safe lateral padding so the vehicle body never crosses lane boundary
        // Maximum usable half-lane width for vehicle center:
        const halfLaneWidth = laneWidth / 2; // distance from lane center to lane edge
        const maxLateral = halfLaneWidth - Math.max(4, v.size.width / 2); // px
        const lateral = Math.max(-maxLateral, Math.min(maxLateral, v.lateralJitter ?? 0));

        // final offset = base + clamped lateral jitter
        const finalOffset = baseOffset + lateral;

        let x = 0, y = 0, rot = 0;

        if (v.direction === 'north') {
          x = centerX + finalOffset;
          y = centerY - halfRoad - v.position;
          rot = Math.PI;
          // clamp x inside road edges
          const minX = roadLeftX + Math.max(2, v.size.width / 2);
          const maxX = roadRightX - Math.max(2, v.size.width / 2);
          x = Math.max(minX, Math.min(maxX, x));
        } else if (v.direction === 'south') {
          x = centerX + finalOffset;
          y = centerY + halfRoad + v.position;
          rot = 0;
          const minX = roadLeftX + Math.max(2, v.size.width / 2);
          const maxX = roadRightX - Math.max(2, v.size.width / 2);
          x = Math.max(minX, Math.min(maxX, x));
        } else if (v.direction === 'east') {
          x = centerX + halfRoad + v.position;
          y = centerY + finalOffset;
          rot = Math.PI / 2;
          const minY = roadTopY + Math.max(2, v.size.width / 2);
          const maxY = roadBottomY - Math.max(2, v.size.width / 2);
          y = Math.max(minY, Math.min(maxY, y));
        } else { // west
          x = centerX - halfRoad - v.position;
          y = centerY + finalOffset;
          rot = -Math.PI / 2;
          const minY = roadTopY + Math.max(2, v.size.width / 2);
          const maxY = roadBottomY - Math.max(2, v.size.width / 2);
          y = Math.max(minY, Math.min(maxY, y));
        }

        // shadow
        ctx.save();
        ctx.translate(x + 2, y + 4);
        ctx.rotate(rot);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(-v.size.width / 2, -v.size.height / 2, v.size.width, v.size.height);
        ctx.restore();

        // body
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.fillStyle = v.color;
        const w = v.size.width;
        const h = v.size.height;
        ctx.beginPath();
        ctx.moveTo(-w/2 + 4, -h/2);
        ctx.lineTo(w/2 - 4, -h/2);
        ctx.quadraticCurveTo(w/2, -h/2, w/2, -h/2 + 4);
        ctx.lineTo(w/2, h/2 - 4);
        ctx.quadraticCurveTo(w/2, h/2, w/2 - 4, h/2);
        ctx.lineTo(-w/2 + 4, h/2);
        ctx.quadraticCurveTo(-w/2, h/2, -w/2, h/2 - 4);
        ctx.lineTo(-w/2, -h/2 + 4);
        ctx.quadraticCurveTo(-w/2, -h/2, -w/2 + 4, -h/2);
        ctx.closePath();
        ctx.fill();

        // windshield
        ctx.fillStyle = '#bfe7ff';
        ctx.fillRect(-w/2 + 2, -h/2 + 2, w - 4, Math.max(6, h * 0.28));

        // wheels
        ctx.fillStyle = '#111';
        const wheelRadius = Math.max(3, Math.min(5, h * 0.22));
        ctx.beginPath();
        ctx.arc(-w/2 + 8, h/2 - 4, wheelRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w/2 - 8, h/2 - 4, wheelRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });
    };

    const step = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const deltaMs = ts - lastTsRef.current;
      const deltaSec = Math.min(0.08, deltaMs / 1000);
      lastTsRef.current = ts;

      // physics update
      const vehicles = vehiclesRef.current;
      const newVehicles: Vehicle[] = [];
      const safeStopDistance = 8;

      for (let i = 0; i < vehicles.length; i++) {
        const v = vehicles[i];
        const canMove = (currentPhase === 'NS' && (v.direction === 'north' || v.direction === 'south')) ||
                        (currentPhase === 'EW' && (v.direction === 'east' || v.direction === 'west'));

        const ahead = vehicles
          .filter(x => x.direction === v.direction && x.lane === v.lane && x !== v && x.position > v.position)
          .sort((a,b) => a.position - b.position)[0];

        let desired = v.targetSpeed;
        if (!canMove && v.position > -10) desired = 0;

        if (ahead) {
          const gap = ahead.position - v.position - ahead.size.height;
          const timeHeadway = 1.0;
          const safeSpeed = Math.max(0, (gap - safeStopDistance) / Math.max(0.001, timeHeadway));
          if (safeSpeed < desired) desired = Math.min(desired, safeSpeed);
        }

        if (v.speed < desired) {
          v.speed = Math.min(desired, v.speed + v.acceleration * deltaSec);
        } else if (v.speed > desired) {
          v.speed = Math.max(desired, v.speed - v.acceleration * 1.8 * deltaSec);
        }

        v.position += v.speed * deltaSec;

        // keep lateral jitter small and clamped each frame for safety
        if (typeof v.lateralJitter === 'number') {
          v.lateralJitter += (Math.random() - 0.5) * 0.6; // small dynamic jitter
          const halfLaneWidth = laneWidth / 2;
          const maxLateral = halfLaneWidth - Math.max(4, v.size.width / 2);
          v.lateralJitter = Math.max(-maxLateral, Math.min(maxLateral, v.lateralJitter));
        }

        // remove if vehicle has moved way off-screen
        const offscreenThreshold = canvasSize + 250;
        if (Math.abs(v.position) < offscreenThreshold) {
          newVehicles.push(v);
        }
      }

      vehiclesRef.current = newVehicles;
      if (Math.random() < 0.02) setVehicleCount(vehiclesRef.current.length);

      // draw
      ctx.clearRect(0, 0, canvasSize, canvasSize);
      drawRoads();
      drawTrafficLights();
      drawVehicles();

      animRef.current = requestAnimationFrame(step);
    };

    animRef.current = requestAnimationFrame(step);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      lastTsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPhase, canvasSize]);

  useEffect(() => {
    const id = window.setInterval(() => setVehicleCount(vehiclesRef.current.length), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-full" style={{ maxWidth: `${canvasSize}px` }}>
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        style={{ width: canvasSize, height: canvasSize, display: 'block', background: '#222' }}
      />
      <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
        {currentPhase === 'NS' ? 'North-South' : 'East-West'}: {timeLeft}s
      </div>
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
        Vehicles: {vehicleCount}
      </div>
    </div>
  );
};

