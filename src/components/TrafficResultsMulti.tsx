import React from 'react';
import { TrendingUp, CheckCircle, Timer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from './StatsCard';
import { TrafficLight } from './TrafficLight';

interface LaneResult {
  laneId: number;
  signalTime: number;
  vehiclesPerSecond?: number;
  rateOfChange?: number;
  annotatedVideo?: string;
  vehicleCount?: number;
  direction?: string;
}

interface TrafficResultsMultiProps {
  lanes: LaneResult[];
  onReset: () => void;
}

export const TrafficResultsMulti: React.FC<TrafficResultsMultiProps> = ({ lanes, onReset }) => {
  const getByDir = (d: string) => lanes.find(l => l.direction === d);
  const north = getByDir('north');
  const south = getByDir('south');
  const east = getByDir('east');
  const west = getByDir('west');

  const nsTime = Math.max(
    typeof north?.signalTime === 'number' ? north.signalTime : 0,
    typeof south?.signalTime === 'number' ? south.signalTime : 0,
  );

  const ewTime = Math.max(
    typeof east?.signalTime === 'number' ? east.signalTime : 0,
    typeof west?.signalTime === 'number' ? west.signalTime : 0,
  );

  const initialPhase: 'NS' | 'EW' = nsTime >= ewTime ? 'NS' : 'EW';
  const [currentPhase, setCurrentPhase] = React.useState<'NS' | 'EW'>(initialPhase);
  const [timeLeft, setTimeLeft] = React.useState<number>(initialPhase === 'NS' ? nsTime : ewTime);
  const [phaseIndex, setPhaseIndex] = React.useState<number>(0);
  const [isComplete, setIsComplete] = React.useState<boolean>(false);

  React.useEffect(() => {
    const startPhase: 'NS' | 'EW' = nsTime >= ewTime ? 'NS' : 'EW';
    setCurrentPhase(startPhase);
    setPhaseIndex(0);
    setIsComplete(false);
    setTimeLeft(startPhase === 'NS' ? nsTime : ewTime);
  }, [nsTime, ewTime]);

  React.useEffect(() => {
    if (isComplete) return;

    if (!Number.isFinite(timeLeft) || timeLeft <= 0) {
      if (phaseIndex === 0) {
        const nextPhase: 'NS' | 'EW' = currentPhase === 'NS' ? 'EW' : 'NS';
        setCurrentPhase(nextPhase);
        setPhaseIndex(1);
        setTimeLeft(nextPhase === 'NS' ? nsTime : ewTime);
      } else {
        setIsComplete(true);
      }
      return;
    }

    const t = setInterval(() => setTimeLeft(prev => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [timeLeft, currentPhase, phaseIndex, nsTime, ewTime, isComplete]);

  const formatTimer = (s?: number) => {
    if (!Number.isFinite(s || 0)) return '—';
    const v = Math.max(0, Math.floor(s as number));
    return `${v}s`;
  };

  const renderCompactCard = (ln?: LaneResult, title?: string, rightExtra?: React.ReactNode) => (
    <Card className="bg-gradient-card border-border shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            {title || (ln?.direction ? ln.direction.toUpperCase() : `Lane ${ln?.laneId ?? ''}`)}
          </CardTitle>
          {rightExtra}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatsCard
            title="Rate of Change"
            value={typeof ln?.rateOfChange === 'number' ? ln?.rateOfChange.toFixed(3) : '—'}
            icon={<TrendingUp className="w-5 h-5" />}
            trend="vehicles/sec²"
            color="primary"
          />
          <StatsCard
            title="Optimized Green Time"
            value={typeof ln?.signalTime === 'number' ? `${ln?.signalTime}s` : '—'}
            icon={<Timer className="w-5 h-5" />}
            trend="per-direction"
            color="success"
          />
          <StatsCard
            title="Vehicle Count"
            value={typeof ln?.vehicleCount === 'number' ? ln?.vehicleCount : '—'}
            icon={<CheckCircle className="w-5 h-5" />}
            trend="unique vehicles"
            color="warning"
          />
        </div>

        <div>
          {ln?.annotatedVideo ? (
            <video src={ln.annotatedVideo} className="w-full h-36 object-cover" controls />
          ) : (
            <div className="text-sm text-muted-foreground">Annotated video will appear here after processing.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      {/* Compact 2x2 grid so all lanes are visible without vertical scrolling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>{renderCompactCard(north, 'NORTH')}</div>

        <div>{renderCompactCard(east, 'EAST')}</div>

        <div>{renderCompactCard(south, 'SOUTH')}</div>
        <div>{renderCompactCard(west, 'WEST')}</div>
      </div>

      {/* Traffic Light Control Section */}
      <Card className="bg-gradient-card border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5" />
            Traffic Light Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* North-South Traffic Light */}
            <div className="flex flex-col items-center space-y-4">
              <div className="text-lg font-semibold text-center">North-South</div>
              <TrafficLight
                currentPhase={
                  currentPhase === 'NS'
                    ? (timeLeft > 5 ? 'green' : (timeLeft > 0 ? 'amber' : 'red'))
                    : 'red'
                }
              />
              <div className="text-center space-y-2">
                <div className={`text-2xl font-bold ${currentPhase === 'NS' ? 'text-success' : 'text-muted-foreground'}`}>
                  {currentPhase === 'NS' ? timeLeft : nsTime}
                </div>
                <div className="text-sm text-muted-foreground">
                  {currentPhase === 'NS' ? 'seconds remaining' : 'seconds total'}
                </div>
                <div className={`text-xs font-medium ${currentPhase === 'NS' ? 'text-success' : 'text-muted-foreground'}`}>
                  {currentPhase === 'NS' ? 'ACTIVE' : 'INACTIVE'}
                </div>
              </div>
            </div>

            {/* East-West Traffic Light */}
            <div className="flex flex-col items-center space-y-4">
              <div className="text-lg font-semibold text-center">East-West</div>
              <TrafficLight
                currentPhase={
                  currentPhase === 'EW'
                    ? (timeLeft > 5 ? 'green' : (timeLeft > 0 ? 'amber' : 'red'))
                    : 'red'
                }
              />
              <div className="text-center space-y-2">
                <div className={`text-2xl font-bold ${currentPhase === 'EW' ? 'text-success' : 'text-muted-foreground'}`}>
                  {currentPhase === 'EW' ? timeLeft : ewTime}
                </div>
                <div className="text-sm text-muted-foreground">
                  {currentPhase === 'EW' ? 'seconds remaining' : 'seconds total'}
                </div>
                <div className={`text-xs font-medium ${currentPhase === 'EW' ? 'text-success' : 'text-muted-foreground'}`}>
                  {currentPhase === 'EW' ? 'ACTIVE' : 'INACTIVE'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};