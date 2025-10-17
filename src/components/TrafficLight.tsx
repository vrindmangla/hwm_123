import React from 'react';

interface TrafficLightProps {
  currentPhase: 'green' | 'amber' | 'red';
  /** Render a smaller/compact version for use in tight layouts */
  compact?: boolean;
}

export const TrafficLight: React.FC<TrafficLightProps> = ({ currentPhase, compact = false }) => {
  const sizeClass = compact ? 'w-6 h-6' : 'w-16 h-16';
  const spacing = compact ? 'space-y-2' : 'space-y-4';
  const padding = compact ? 'p-2' : 'p-6';

  return (
    <div className={`bg-secondary ${padding} rounded-2xl shadow-card`} aria-label={`Traffic light is ${currentPhase}`}>
      <div className={spacing}>
        {/* Red Light */}
        <div className={`
          ${sizeClass} rounded-full border-4 border-gray-600 transition-all duration-300
          ${currentPhase === 'red' 
            ? 'bg-traffic-red shadow-[0_0_30px_hsl(var(--traffic-red))] animate-traffic-pulse' 
            : 'bg-gray-700'
          }
        `} />
        
        {/* Amber Light */}
        <div className={`
          ${sizeClass} rounded-full border-4 border-gray-600 transition-all duration-300
          ${currentPhase === 'amber' 
            ? 'bg-traffic-amber shadow-[0_0_30px_hsl(var(--traffic-amber))] animate-traffic-pulse' 
            : 'bg-gray-700'
          }
        `} />
        
        {/* Green Light */}
        <div className={`
          ${sizeClass} rounded-full border-4 border-gray-600 transition-all duration-300
          ${currentPhase === 'green' 
            ? 'bg-traffic-green shadow-[0_0_30px_hsl(var(--traffic-green))] animate-traffic-pulse' 
            : 'bg-gray-700'
          }
        `} />
      </div>
    </div>
  );
};