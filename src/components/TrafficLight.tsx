import React from 'react';

interface TrafficLightProps {
  currentPhase: 'green' | 'amber' | 'red';
}

export const TrafficLight: React.FC<TrafficLightProps> = ({ currentPhase }) => {
  return (
    <div className="bg-secondary p-6 rounded-2xl shadow-card">
      <div className="space-y-4">
        {/* Red Light */}
        <div className={`
          w-16 h-16 rounded-full border-4 border-gray-600 transition-all duration-300
          ${currentPhase === 'red' 
            ? 'bg-traffic-red shadow-[0_0_30px_hsl(var(--traffic-red))] animate-traffic-pulse' 
            : 'bg-gray-700'
          }
        `} />
        
        {/* Amber Light */}
        <div className={`
          w-16 h-16 rounded-full border-4 border-gray-600 transition-all duration-300
          ${currentPhase === 'amber' 
            ? 'bg-traffic-amber shadow-[0_0_30px_hsl(var(--traffic-amber))] animate-traffic-pulse' 
            : 'bg-gray-700'
          }
        `} />
        
        {/* Green Light */}
        <div className={`
          w-16 h-16 rounded-full border-4 border-gray-600 transition-all duration-300
          ${currentPhase === 'green' 
            ? 'bg-traffic-green shadow-[0_0_30px_hsl(var(--traffic-green))] animate-traffic-pulse' 
            : 'bg-gray-700'
          }
        `} />
      </div>
    </div>
  );
};