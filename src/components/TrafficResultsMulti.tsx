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
          <CardTitle className="flex items-center gap-2 text-sm">
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
        <div>{renderCompactCard(
          north,
          'NORTH',
          (
            <div className="flex items-center gap-2">
              <TrafficLight
                compact
                currentPhase={
                  currentPhase === 'NS'
                    ? (timeLeft > 5 ? 'green' : (timeLeft > 0 ? 'amber' : 'red'))
                    : 'red'
                }
              />
              <div className={`${currentPhase === 'NS' ? 'text-success' : 'text-muted-foreground'} text-xs font-medium`}>
                NS: {currentPhase === 'NS' ? formatTimer(timeLeft) : formatTimer(nsTime)}
              </div>
            </div>
          )
        )}</div>

        <div>{renderCompactCard(
          east,
          'EAST',
          (
            <div className="flex items-center gap-2">
              <div className={`${currentPhase === 'EW' ? 'text-success' : 'text-muted-foreground'} text-xs font-medium`}> 
                EW: {currentPhase === 'EW' ? formatTimer(timeLeft) : formatTimer(ewTime)}
              </div>
              <TrafficLight
                compact
                currentPhase={
                  currentPhase === 'EW'
                    ? (timeLeft > 5 ? 'green' : (timeLeft > 0 ? 'amber' : 'red'))
                    : 'red'
                }
              />
            </div>
          )
        )}</div>

        <div>{renderCompactCard(south, 'SOUTH')}</div>
        <div>{renderCompactCard(west, 'WEST')}</div>
      </div>
    </div>
  );
};

