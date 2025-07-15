import React, { useEffect, useState } from 'react';
import { Car, Clock, TrendingUp, ArrowLeft, AlertTriangle, CheckCircle, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrafficLight } from './TrafficLight';
import { StatsCard } from './StatsCard';

interface TrafficResultsProps {
  vehicleCount: number;
  signalTime: number;
  detectedImage: string;
  onReset: () => void;
}

export const TrafficResults: React.FC<TrafficResultsProps> = ({
  vehicleCount,
  signalTime,
  detectedImage,
  onReset
}) => {
  const [timeLeft, setTimeLeft] = useState(signalTime);
  const [currentPhase, setCurrentPhase] = useState<'green' | 'amber' | 'red'>('green');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setTimeLeft(signalTime);
    setCurrentPhase('green');
    setIsComplete(false);
  }, [signalTime]);

  useEffect(() => {
    if (timeLeft <= 0) {
      setIsComplete(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsComplete(true);
          return 0;
        }
        
        // Phase transitions
        if (prev === 4) {
          setCurrentPhase('amber');
        } else if (prev === 1) {
          setCurrentPhase('red');
        }
        
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const getDensityLevel = (count: number): { level: string; color: 'primary' | 'success' | 'warning' | 'destructive'; intensity: string } => {
    if (count <= 5) return { level: 'Low', color: 'success', intensity: 'light' };
    if (count <= 15) return { level: 'Medium', color: 'warning', intensity: 'moderate' };
    return { level: 'High', color: 'destructive', intensity: 'heavy' };
  };

  const density = getDensityLevel(vehicleCount);
  const progressPercentage = ((signalTime - timeLeft) / signalTime) * 100;

  const handleNewAnalysis = () => {
    onReset();
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-success/10 rounded-full">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-success bg-clip-text text-transparent">
              Detection Complete
            </h1>
            <p className="text-muted-foreground">
              AI analysis completed successfully
            </p>
          </div>
        </div>
        
        <Button
          variant="outline"
          onClick={handleNewAnalysis}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          New Analysis
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Vehicles Detected"
          value={vehicleCount}
          icon={<Car className="w-6 h-6" />}
          trend="+12% from last scan"
          color="primary"
        />
        
        <StatsCard
          title="Traffic Density"
          value={density.level}
          icon={<TrendingUp className="w-6 h-6" />}
          trend={`${density.intensity} traffic flow`}
          color={density.color}
        />
        
        <StatsCard
          title="Signal Duration"
          value={`${signalTime}s`}
          icon={<Clock className="w-6 h-6" />}
          trend="Optimized timing"
          color="success"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Light Control */}
        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5" />
              Traffic Signal Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center">
              <TrafficLight currentPhase={currentPhase} />
            </div>
            
            <div className="text-center space-y-4">
              <div className="text-4xl font-bold text-success">
                {timeLeft > 0 ? timeLeft : 0}
              </div>
              <div className="text-muted-foreground">
                seconds remaining
              </div>
              
              <Progress 
                value={progressPercentage} 
                className="h-3"
              />
              
              <div className="flex items-center justify-center gap-2">
                <Badge 
                  variant={currentPhase === 'green' ? 'default' : 'secondary'}
                  className={`${currentPhase === 'green' ? 'bg-success' : ''}`}
                >
                  {currentPhase.toUpperCase()} PHASE
                </Badge>
                {isComplete && (
                  <Badge variant="outline" className="animate-pulse">
                    CYCLE COMPLETE
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detected Image */}
        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              Vehicle Detection Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative rounded-lg overflow-hidden bg-muted">
              <img
                src={detectedImage}
                alt="Detected vehicles"
                className="w-full h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    <span className="font-medium">{vehicleCount} vehicles detected</span>
                  </div>
                  <Badge className="bg-primary">
                    AI Processed
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert for completion */}
      {isComplete && (
        <Card className="bg-gradient-card border-warning shadow-card animate-pulse">
          <CardContent className="flex items-center gap-4 pt-6">
            <AlertTriangle className="w-8 h-8 text-warning" />
            <div>
              <h3 className="font-semibold text-warning">Signal Cycle Complete</h3>
              <p className="text-muted-foreground">
                Ready for next traffic image analysis
              </p>
            </div>
            <Button
              onClick={handleNewAnalysis}
              className="ml-auto bg-gradient-primary"
            >
              Start New Analysis
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};