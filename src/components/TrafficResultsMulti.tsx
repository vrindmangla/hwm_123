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

  const renderCard = (ln?: LaneResult, title?: string) => (
    <Card className="bg-gradient-card border-border shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title || (ln?.direction ? ln.direction.toUpperCase() : `Lane ${ln?.laneId ?? ''}`)}
        </CardTitle>
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
        <div>{renderCard(north, 'NORTH')}</div>
        <div />

        {/* West */}
        <div>{renderCard(west, 'WEST')}</div>
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
