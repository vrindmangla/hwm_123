import React from 'react';
import { TrendingUp, CheckCircle, Timer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from './StatsCard';

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

  // Compute synchronized pair times (backend already syncs, but we guard here)
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
  const [phaseIndex, setPhaseIndex] = React.useState<number>(0); // 0 -> first pair, 1 -> second pair
  const [isComplete, setIsComplete] = React.useState<boolean>(false);

  React.useEffect(() => {
    // Reset timers if inputs change
    const startPhase: 'NS' | 'EW' = nsTime >= ewTime ? 'NS' : 'EW';
    setCurrentPhase(startPhase);
    setPhaseIndex(0);
    setIsComplete(false);
    setTimeLeft(startPhase === 'NS' ? nsTime : ewTime);
  }, [nsTime, ewTime]);

  React.useEffect(() => {
    if (isComplete) return;
    if (!Number.isFinite(timeLeft) || timeLeft <= 0) {
      // Switch to the other phase or mark complete
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

  const renderCard = (ln?: LaneResult, title?: string, rightExtra?: React.ReactNode) => (
    <Card className="bg-gradient-card border-border shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            {title || (ln?.direction ? ln.direction.toUpperCase() : `Lane ${ln?.laneId ?? ''}`)}
          </CardTitle>
          {rightExtra}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            title="Rate of Change"
            value={typeof ln?.rateOfChange === 'number' ? ln?.rateOfChange.toFixed(3) : '—'}
            icon={<TrendingUp className="w-6 h-6" />}
            trend="vehicles/sec²"
            color="primary"
          />
          <StatsCard
            title="Optimized Green Time"
            value={typeof ln?.signalTime === 'number' ? `${ln?.signalTime}s` : '—'}
            icon={<Timer className="w-6 h-6" />}
            trend="per-direction"
            color="success"
          />
          <StatsCard
            title="Vehicle Count"
            value={typeof ln?.vehicleCount === 'number' ? ln?.vehicleCount : '—'}
            icon={<CheckCircle className="w-6 h-6" />}
            trend="unique vehicles"
            color="warning"
          />
        </div>

        <div>
          {ln?.annotatedVideo ? (
            <video src={ln.annotatedVideo} className="w-full h-64 object-cover" controls />
          ) : (
            <div className="text-sm text-muted-foreground">Annotated video will appear here after processing.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-3 gap-6">
        <div />
        {/* North */}
        <div>{renderCard(
          north,
          'NORTH',
          (
            <div className={`${currentPhase === 'NS' ? 'text-success' : 'text-muted-foreground'} text-sm font-medium`}>
              NS TIMER: {currentPhase === 'NS' ? formatTimer(timeLeft) : formatTimer(nsTime)}
            </div>
          )
        )}</div>
        <div />

        {/* West */}
        <div>{renderCard(
          west,
          'WEST',
          (
            <div className={`${currentPhase === 'EW' ? 'text-success' : 'text-muted-foreground'} text-sm font-medium`}>
              EW TIMER: {currentPhase === 'EW' ? formatTimer(timeLeft) : formatTimer(ewTime)}
            </div>
          )
        )}</div>
        <div className="flex items-center justify-center text-xs text-muted-foreground">Intersection</div>
        {/* East */}
        <div>{renderCard(east, 'EAST')}</div>

        <div />
        {/* South */}
        <div>{renderCard(south, 'SOUTH')}</div>
        <div />
      </div>
    </div>
  );
};
