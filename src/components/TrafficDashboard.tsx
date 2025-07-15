import React, { useState } from 'react';
import { Activity, Zap } from 'lucide-react';
import { TrafficUpload } from './TrafficUpload';
import { TrafficResults } from './TrafficResults';
import { SystemStatus } from './SystemStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DetectionResult {
  vehicleCount: number;
  signalTime: number;
  detectedImage: string;
}

type AppState = 'upload' | 'processing' | 'results';

export const TrafficDashboard: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('upload');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<DetectionResult | null>(null);

  const simulateAIProcessing = (file: File): Promise<DetectionResult> => {
    return new Promise((resolve) => {
      // Simulate processing with progress updates
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        currentProgress += Math.random() * 15;
        if (currentProgress >= 100) {
          clearInterval(progressInterval);
          setProgress(100);
          
          // Simulate AI results based on file name or random generation
          const vehicleCount = Math.floor(Math.random() * 25) + 1;
          const baseTime = 30;
          const signalTime = Math.max(baseTime + (vehicleCount * 2), 20);
          
          // Create a mock detected image URL (in real app, this would come from backend)
          const detectedImage = URL.createObjectURL(file);
          
          resolve({
            vehicleCount,
            signalTime,
            detectedImage
          });
        } else {
          setProgress(currentProgress);
        }
      }, 200);
    });
  };

  const handleFileUpload = async (file: File) => {
    setAppState('processing');
    setProgress(0);
    
    try {
      const result = await simulateAIProcessing(file);
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
            
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-success font-medium">System Online</span>
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
              <TrafficResults
                vehicleCount={results.vehicleCount}
                signalTime={results.signalTime}
                detectedImage={results.detectedImage}
                onReset={handleReset}
              />
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