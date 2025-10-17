import React, { useState, useEffect } from 'react';
import { Activity, Zap } from 'lucide-react';
import { TrafficUpload } from './TrafficUpload';
import { TrafficResults } from './TrafficResults';
import { TrafficResultsMulti } from './TrafficResultsMulti';
import { SystemStatus } from './SystemStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LaneResult {
  laneId: number;
  signalTime: number;
  vehiclesPerSecond?: number;
  rateOfChange?: number;
  annotatedVideo?: string;
  vehicleCount?: number;
  direction?: string;
}

interface DetectionResult {
  signalTime: number;
  vehiclesPerSecond?: number;
  rateOfChange?: number;
  annotatedVideo?: string;
  vehicleCount?: number;
  lanes?: LaneResult[];
}

type AppState = 'upload' | 'processing' | 'results';

export const TrafficDashboard: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('upload');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<DetectionResult | null>(null);

  // Live clock (HH:MM:SS)
  const formatTime = (date: Date): string => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${hh}:${mm}:${ss}`;
  };

  const [currentTime, setCurrentTime] = useState<string>(formatTime(new Date()));

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(formatTime(new Date()));
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const computeOptimizedGreenTime = (baseSeconds: number, rateOfChange?: number): number => {
    if (rateOfChange === undefined || rateOfChange === null || isNaN(rateOfChange)) {
      return baseSeconds;
    }
    const scaleSecondsPerSlopeUnit = 10; // K = 10 seconds per (vehicles/sec²)
    const unclamped = baseSeconds + rateOfChange * scaleSecondsPerSlopeUnit;
    const clamped = Math.max(15, Math.min(65, unclamped));
    return Math.round(clamped);
  };

  const simulateAIProcessing = (video: File | null): Promise<DetectionResult> => {
  return new Promise(async (resolve, reject) => {
    try {
      setProgress(20); // optional intermediate progress

      if (!video) {
        throw new Error("No video provided");
      }

      const vForm = new FormData();
      vForm.append("video", video);
      const vResp = await fetch("http://localhost:5000/api/video/analyze", {
        method: "POST",
        body: vForm,
      });
      if (!vResp.ok) {
        throw new Error("Video analysis failed");
      }
      const vData = await vResp.json();

      setProgress(100);
      const optimized = computeOptimizedGreenTime(35, vData.rateOfChange);
      const baseResult: DetectionResult = {
        vehiclesPerSecond: vData.vehiclesPerSecond,
        rateOfChange: vData.rateOfChange,
        signalTime: optimized,
        annotatedVideo: vData.annotatedVideo ? `http://localhost:5000${vData.annotatedVideo}` : undefined,
        vehicleCount: typeof vData.vehicleCount === 'number' ? vData.vehicleCount : undefined,
      };

      resolve(baseResult);
    } catch (error) {
      reject(error);
    }
  });
};


  const simulateAIProcessingMulti = (lanes: { north?: File | null; south?: File | null; east?: File | null; west?: File | null; lane1?: File | null; lane2?: File | null; lane3?: File | null; lane4?: File | null }): Promise<DetectionResult> => {
  return new Promise(async (resolve, reject) => {
    try {
      setProgress(20);
      const vForm = new FormData();
      (['north','south','east','west','lane1','lane2','lane3','lane4'] as const).forEach(k => {
        const f = lanes[k];
        if (f) vForm.append(k, f);
      });
      const vResp = await fetch("http://localhost:5000/api/video/analyze-multi", {
        method: "POST",
        body: vForm,
      });
      if (!vResp.ok) throw new Error("Multi-lane analysis failed");
      const vData = await vResp.json();

      setProgress(100);
      const lanesOut: LaneResult[] = (vData.lanes || []).map((ln: any, idx: number) => ({
        laneId: typeof ln.laneId === 'number' ? ln.laneId : idx + 1,
        signalTime: ln.signalTime,
        vehiclesPerSecond: ln.vehiclesPerSecond,
        rateOfChange: ln.rateOfChange,
        annotatedVideo: ln.annotatedVideo ? `http://localhost:5000${ln.annotatedVideo}` : undefined,
        vehicleCount: ln.vehicleCount,
        direction: ln.direction,
      }));
      resolve({ signalTime: 0, lanes: lanesOut });
    } catch (error) {
      reject(error);
    }
  });
};


  const handleFileUpload = async (video: File | null, multi?: { north?: File | null; south?: File | null; east?: File | null; west?: File | null; lane1?: File | null; lane2?: File | null; lane3?: File | null; lane4?: File | null }) => {
    setAppState('processing');
    setProgress(0);
    
    try {
      const result = multi && (multi.north || multi.south || multi.east || multi.west || multi.lane1 || multi.lane2 || multi.lane3 || multi.lane4)
        ? await simulateAIProcessingMulti(multi)
        : await simulateAIProcessing(video);
      setResults(result);
      setAppState('results');
    } catch (error) {
      console.error('Processing failed:', error);
      setAppState('upload');
    }
  };

  const handleReset = () => {
    setAppState('upload');
    setProgress(0);
    setResults(null);
  };

  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  AI Traffic Management
                </h1>
                <p className="text-sm text-muted-foreground">
                  Real-time traffic optimization system
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <span className="font-mono tabular-nums text-muted-foreground text-base min-w-[88px] text-right">
                {currentTime}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <span className="text-success font-medium">System Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="xl:col-span-3">
            {appState === 'upload' && (
              <div className="space-y-6">
                <TrafficUpload
                  onUpload={handleFileUpload}
                  isProcessing={false}
                  progress={0}
                />
                
                {/* Quick Stats */}
                <Card className="bg-gradient-card border-border shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      System Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-primary">24/7</div>
                        <div className="text-sm text-muted-foreground">Monitoring</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-success">98.5%</div>
                        <div className="text-sm text-muted-foreground">Accuracy</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-warning">1.2s</div>
                        <div className="text-sm text-muted-foreground">Response Time</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-accent">AI</div>
                        <div className="text-sm text-muted-foreground">Powered</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {appState === 'processing' && (
              <TrafficUpload
                onUpload={handleFileUpload}
                isProcessing={true}
                progress={progress}
              />
            )}

            {appState === 'results' && results && (
              results.lanes && results.lanes.length > 0 ? (
                <TrafficResultsMulti lanes={results.lanes} onReset={handleReset} />
              ) : (
                <TrafficResults
                  signalTime={results.signalTime}
                  vehiclesPerSecond={results.vehiclesPerSecond}
                  rateOfChange={results.rateOfChange}
                  annotatedVideo={results.annotatedVideo}
                  vehicleCount={results.vehicleCount}
                  onReset={handleReset}
                />
              )
            )}
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            <SystemStatus />
            
            {/* Recent Activity */}
            <Card className="bg-gradient-card border-border shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span>Highway Junction A</span>
                    <span className="text-xs text-muted-foreground">2min ago</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    15 vehicles detected • 45s signal
                  </div>
                </div>
                
                <div className="text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span>Main Street Cross</span>
                    <span className="text-xs text-muted-foreground">5min ago</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    8 vehicles detected • 32s signal
                  </div>
                </div>
                
                <div className="text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span>Park Avenue</span>
                    <span className="text-xs text-muted-foreground">12min ago</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    22 vehicles detected • 60s signal
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};