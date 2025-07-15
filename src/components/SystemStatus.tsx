import React from 'react';
import { Activity, Wifi, Database, Cpu, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SystemStatusProps {
  isOnline?: boolean;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({ isOnline = true }) => {
  const statusItems = [
    {
      label: 'AI Model',
      status: 'Online',
      icon: <Cpu className="w-4 h-4" />,
      health: 98
    },
    {
      label: 'Network',
      status: 'Connected',
      icon: <Wifi className="w-4 h-4" />,
      health: 100
    },
    {
      label: 'Database',
      status: 'Active',
      icon: <Database className="w-4 h-4" />,
      health: 95
    },
    {
      label: 'Security',
      status: 'Secure',
      icon: <Shield className="w-4 h-4" />,
      health: 100
    }
  ];

  return (
    <Card className="bg-gradient-card border-border shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {statusItems.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-success">
                {item.icon}
              </div>
              <div>
                <div className="font-medium text-sm">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.health}% Health</div>
              </div>
            </div>
            <Badge variant="secondary" className="bg-success/10 text-success">
              {item.status}
            </Badge>
          </div>
        ))}
        
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Status</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-sm text-success font-medium">Operational</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};