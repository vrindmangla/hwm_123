import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Vehicle {
  id: string;
  x: number;
  y: number;
  direction: 'right' | 'down' | 'left' | 'up';
  type: 'car' | 'bus' | 'truck' | 'bike';
  speed: number;
  crossed: boolean;
  stop: number;
  width: number;
  height: number;
  color: string;
}

interface TrafficSignal {
  red: number;
  yellow: number;
  green: number;
  signalText: string;
}

interface TrafficSimulationProps {
  nsTime: number;
  ewTime: number;
  onSimulationComplete: () => void;
}

export const TrafficSimulation: React.FC<TrafficSimulationProps> = ({
  nsTime,
  ewTime,
  onSimulationComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [signals, setSignals] = useState<TrafficSignal[]>([
    { red: 0, yellow: 5, green: nsTime }, // North (0)
    { red: 0, yellow: 5, green: ewTime }, // East (1) 
    { red: 0, yellow: 5, green: nsTime }, // South (2)
    { red: 0, yellow: 5, green: ewTime }  // West (3)
  ]);
  const [currentGreen, setCurrentGreen] = useState(0);
  const [currentYellow, setCurrentYellow] = useState(false);
  const [nextGreen, setNextGreen] = useState(1);
  const [vehicleIdCounter, setVehicleIdCounter] = useState(0);

  // Vehicle colors
  const vehicleColors = {
    car: '#3B82F6',
    bus: '#EF4444', 
    truck: '#8B5CF6',
    bike: '#10B981'
  };

  // Vehicle speeds
  const vehicleSpeeds = {
    car: 2.25,
    bus: 1.8,
    truck: 1.8,
    bike: 2.5
  };

  // Vehicle dimensions
  const vehicleDimensions = {
    car: { width: 30, height: 15 },
    bus: { width: 35, height: 18 },
    truck: { width: 40, height: 20 },
    bike: { width: 20, height: 10 }
  };

  // Canvas dimensions
  const canvasWidth = 600;
  const canvasHeight = 400;

  // Intersection coordinates
  const intersection = {
    x: canvasWidth / 2 - 50,
    y: canvasHeight / 2 - 50,
    width: 100,
    height: 100
  };

  // Stop lines
  const stopLines = {
    right: intersection.x,
    down: intersection.y,
    left: intersection.x + intersection.width,
    up: intersection.y + intersection.height
  };

  // Default stop positions
  const defaultStops = {
    right: intersection.x - 20,
    down: intersection.y - 20,
    left: intersection.x + intersection.width + 20,
    up: intersection.y + intersection.height + 20
  };

  // Vehicle spawn positions
  const spawnPositions = {
    right: { x: 0, y: intersection.y + intersection.height / 2 - 10 },
    down: { x: intersection.x + intersection.width / 2 - 10, y: 0 },
    left: { x: canvasWidth, y: intersection.y + intersection.height / 2 - 10 },
    up: { x: intersection.x + intersection.width / 2 - 10, y: canvasHeight }
  };

  // Generate a random vehicle
  const generateVehicle = useCallback((): Vehicle => {
    const directions: Array<'right' | 'down' | 'left' | 'up'> = ['right', 'down', 'left', 'up'];
    const types: Array<'car' | 'bus' | 'truck' | 'bike'> = ['car', 'bus', 'truck', 'bike'];
    
    const direction = directions[Math.floor(Math.random() * directions.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const spawn = spawnPositions[direction];
    const dims = vehicleDimensions[type];
    
    return {
      id: `vehicle-${vehicleIdCounter}`,
      x: spawn.x,
      y: spawn.y,
      direction,
      type,
      speed: vehicleSpeeds[type],
      crossed: false,
      stop: defaultStops[direction],
      width: dims.width,
      height: dims.height,
      color: vehicleColors[type]
    };
  }, [vehicleIdCounter]);

  // Update vehicle positions
  const updateVehicles = useCallback(() => {
    setVehicles(prevVehicles => {
      return prevVehicles.map(vehicle => {
        const newVehicle = { ...vehicle };
        
        // Check if vehicle has crossed stop line
        if (!newVehicle.crossed) {
          if (vehicle.direction === 'right' && vehicle.x + vehicle.width > stopLines.right) {
            newVehicle.crossed = true;
          } else if (vehicle.direction === 'down' && vehicle.y + vehicle.height > stopLines.down) {
            newVehicle.crossed = true;
          } else if (vehicle.direction === 'left' && vehicle.x < stopLines.left) {
            newVehicle.crossed = true;
          } else if (vehicle.direction === 'up' && vehicle.y < stopLines.up) {
            newVehicle.crossed = true;
          }
        }

        // Move vehicle if conditions are met
        const canMove = newVehicle.crossed || 
          (vehicle.direction === 'right' && (currentGreen === 0 && !currentYellow)) ||
          (vehicle.direction === 'down' && (currentGreen === 1 && !currentYellow)) ||
          (vehicle.direction === 'left' && (currentGreen === 2 && !currentYellow)) ||
          (vehicle.direction === 'up' && (currentGreen === 3 && !currentYellow));

        if (canMove) {
          switch (vehicle.direction) {
            case 'right':
              newVehicle.x += newVehicle.speed;
              break;
            case 'down':
              newVehicle.y += newVehicle.speed;
              break;
            case 'left':
              newVehicle.x -= newVehicle.speed;
              break;
            case 'up':
              newVehicle.y -= newVehicle.speed;
              break;
          }
        }

        return newVehicle;
      }).filter(vehicle => {
        // Remove vehicles that are off screen
        return vehicle.x > -50 && vehicle.x < canvasWidth + 50 && 
               vehicle.y > -50 && vehicle.y < canvasHeight + 50;
      });
    });
  }, [currentGreen, currentYellow]);

  // Update traffic signals
  const updateSignals = useCallback(() => {
    setSignals(prevSignals => {
      const newSignals = [...prevSignals];
      
      for (let i = 0; i < newSignals.length; i++) {
        if (i === currentGreen) {
          if (currentYellow) {
            newSignals[i].yellow -= 1;
            newSignals[i].signalText = newSignals[i].yellow.toString();
          } else {
            newSignals[i].green -= 1;
            newSignals[i].signalText = newSignals[i].green.toString();
          }
        } else {
          newSignals[i].red -= 1;
          newSignals[i].signalText = newSignals[i].red <= 10 ? newSignals[i].red.toString() : "---";
        }
      }

      return newSignals;
    });
  }, [currentGreen, currentYellow]);

  // Check for signal phase changes
  const checkSignalChanges = useCallback(() => {
    setSignals(prevSignals => {
      const currentSignal = prevSignals[currentGreen];
      
      if (currentSignal.green <= 0 && !currentYellow) {
        setCurrentYellow(true);
        return prevSignals;
      }
      
      if (currentSignal.yellow <= 0 && currentYellow) {
        setCurrentYellow(false);
        setCurrentGreen(nextGreen);
        setNextGreen((nextGreen + 1) % 4);
        
        // Reset signal times
        const newSignals = [...prevSignals];
        newSignals[currentGreen] = { red: 0, yellow: 5, green: currentGreen % 2 === 0 ? nsTime : ewTime };
        newSignals[nextGreen] = { red: 0, yellow: 5, green: nextGreen % 2 === 0 ? nsTime : ewTime };
        
        return newSignals;
      }
      
      return prevSignals;
    });
  }, [currentGreen, currentYellow, nextGreen, nsTime, ewTime]);

  // Check if both NS and EW are red
  const checkSimulationComplete = useCallback(() => {
    setSignals(prevSignals => {
      const nsRed = prevSignals[0].red > 0 && prevSignals[2].red > 0;
      const ewRed = prevSignals[1].red > 0 && prevSignals[3].red > 0;
      
      if (nsRed && ewRed) {
        setIsRunning(false);
        onSimulationComplete();
      }
      
      return prevSignals;
    });
  }, [onSimulationComplete]);

  // Animation loop
  const animate = useCallback(() => {
    if (!isRunning || isPaused) return;

    updateVehicles();
    updateSignals();
    checkSignalChanges();
    checkSimulationComplete();

    // Generate new vehicles occasionally
    if (Math.random() < 0.1) {
      setVehicles(prev => [...prev, generateVehicle()]);
      setVehicleIdCounter(prev => prev + 1);
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [isRunning, isPaused, updateVehicles, updateSignals, checkSignalChanges, checkSimulationComplete, generateVehicle]);

  // Draw the simulation
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1F2937';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw intersection
    ctx.fillStyle = '#374151';
    ctx.fillRect(intersection.x, intersection.y, intersection.width, intersection.height);

    // Draw roads
    ctx.fillStyle = '#4B5563';
    // Horizontal road
    ctx.fillRect(0, intersection.y + intersection.height / 2 - 20, canvasWidth, 40);
    // Vertical road
    ctx.fillRect(intersection.x + intersection.width / 2 - 20, 0, 40, canvasHeight);

    // Draw stop lines
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(stopLines.right, intersection.y);
    ctx.lineTo(stopLines.right, intersection.y + intersection.height);
    ctx.moveTo(intersection.x, stopLines.down);
    ctx.lineTo(intersection.x + intersection.width, stopLines.down);
    ctx.moveTo(stopLines.left, intersection.y);
    ctx.lineTo(stopLines.left, intersection.y + intersection.height);
    ctx.moveTo(intersection.x, stopLines.up);
    ctx.lineTo(intersection.x + intersection.width, stopLines.up);
    ctx.stroke();

    // Draw traffic signals
    const signalPositions = [
      { x: intersection.x - 30, y: intersection.y - 30 }, // North
      { x: intersection.x + intersection.width + 10, y: intersection.y - 30 }, // East
      { x: intersection.x - 30, y: intersection.y + intersection.height + 10 }, // South
      { x: intersection.x + intersection.width + 10, y: intersection.y + intersection.height + 10 } // West
    ];

    signals.forEach((signal, index) => {
      const pos = signalPositions[index];
      let color = '#EF4444'; // Red
      
      if (index === currentGreen) {
        color = currentYellow ? '#F59E0B' : '#10B981'; // Yellow or Green
      }
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw signal timer
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px Arial';
      ctx.fillText(signal.signalText, pos.x - 5, pos.y + 25);
    });

    // Draw vehicles
    vehicles.forEach(vehicle => {
      ctx.fillStyle = vehicle.color;
      ctx.fillRect(vehicle.x, vehicle.y, vehicle.width, vehicle.height);
      
      // Draw vehicle type indicator
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '8px Arial';
      ctx.fillText(vehicle.type[0].toUpperCase(), vehicle.x + 2, vehicle.y + vehicle.height - 2);
    });
  }, [vehicles, signals, currentGreen, currentYellow]);

  // Start simulation
  const startSimulation = () => {
    setIsRunning(true);
    setIsPaused(false);
    setVehicles([]);
    setVehicleIdCounter(0);
    setCurrentGreen(0);
    setCurrentYellow(false);
    setNextGreen(1);
    setSignals([
      { red: 0, yellow: 5, green: nsTime },
      { red: 0, yellow: 5, green: ewTime },
      { red: 0, yellow: 5, green: nsTime },
      { red: 0, yellow: 5, green: ewTime }
    ]);
  };

  // Pause/Resume simulation
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // Stop simulation
  const stopSimulation = () => {
    setIsRunning(false);
    setIsPaused(false);
  };

  // Animation and drawing effects
  useEffect(() => {
    if (isRunning) {
      animate();
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, animate]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <Card className="bg-gradient-card border-border shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Real Time Traffic Simulation
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={startSimulation}
              disabled={isRunning}
            >
              <Play className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={togglePause}
              disabled={!isRunning}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={stopSimulation}
              disabled={!isRunning}
            >
              <Square className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              className="border border-border rounded-lg"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="font-semibold">North-South Signal</div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  currentGreen === 0 || currentGreen === 2 
                    ? (currentYellow ? 'bg-yellow-500' : 'bg-green-500')
                    : 'bg-red-500'
                }`} />
                <span>
                  {currentGreen === 0 || currentGreen === 2 
                    ? (currentYellow ? 'Yellow' : 'Green')
                    : 'Red'
                  } - {signals[currentGreen === 0 || currentGreen === 2 ? currentGreen : 0]?.signalText || '---'}s
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="font-semibold">East-West Signal</div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  currentGreen === 1 || currentGreen === 3 
                    ? (currentYellow ? 'bg-yellow-500' : 'bg-green-500')
                    : 'bg-red-500'
                }`} />
                <span>
                  {currentGreen === 1 || currentGreen === 3 
                    ? (currentYellow ? 'Yellow' : 'Green')
                    : 'Red'
                  } - {signals[currentGreen === 1 || currentGreen === 3 ? currentGreen : 1]?.signalText || '---'}s
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground text-center">
            Simulation will stop when both North-South and East-West signals are red
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
