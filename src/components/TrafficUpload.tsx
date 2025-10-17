import React, { useState, useCallback } from 'react';
import { Upload, Activity, Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface TrafficUploadProps {
  onUpload: (video: File | null, multi?: { north?: File | null; south?: File | null; east?: File | null; west?: File | null; lane1?: File | null; lane2?: File | null; lane3?: File | null; lane4?: File | null }) => void;
  isProcessing: boolean;
  progress: number;
}

export const TrafficUpload: React.FC<TrafficUploadProps> = ({
  onUpload,
  isProcessing,
  progress
}) => {
  // Multi-lane state
  const [laneFiles, setLaneFiles] = useState<{ north?: File | null; south?: File | null; east?: File | null; west?: File | null; lane1?: File | null; lane2?: File | null; lane3?: File | null; lane4?: File | null }>({});
  const [lanePreviews, setLanePreviews] = useState<{ [k: string]: string | null }>({});
  const { toast } = useToast();

  const handleLaneInput = (laneKey: 'north' | 'south' | 'east' | 'west' | 'lane1' | 'lane2' | 'lane3' | 'lane4') => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('video/')) {
        toast({ title: 'Invalid Video', description: 'Select a valid video file (MP4, WebM, MOV).', variant: 'destructive' });
        return;
      }
      setLaneFiles(prev => ({ ...prev, [laneKey]: file }));
      const url = URL.createObjectURL(file);
      setLanePreviews(prev => ({ ...prev, [laneKey]: url }));
    }
  };

  const clearSelection = () => {
    // Clear multi-lane
    Object.values(lanePreviews).forEach(url => { if (url) URL.revokeObjectURL(url); });
    setLaneFiles({});
    setLanePreviews({});
  };

  const handleSubmit = () => {
    const anyLane = laneFiles.north || laneFiles.south || laneFiles.east || laneFiles.west || laneFiles.lane1 || laneFiles.lane2 || laneFiles.lane3 || laneFiles.lane4;
    if (anyLane) {
      onUpload(null, laneFiles);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card className="bg-gradient-card border-border shadow-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            AI Traffic Analysis (Direction-wise)
          </CardTitle>
          <p className="text-muted-foreground">
            Upload videos for North, South, East and West lanes to compute timings
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Compass-layout uploader for North/South/East/West */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Upload traffic videos by direction</label>
            <div className="grid grid-cols-3 gap-4">
              <div />
              {/* North */}
              <div className="relative border-2 border-dashed rounded-lg p-4 text-center">
                <input type="file" accept="video/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleLaneInput('north')} disabled={isProcessing} />
                {laneFiles.north ? (
                  <div className="space-y-2">
                    {lanePreviews['north'] && (<video src={lanePreviews['north'] || undefined} className="w-full h-40 object-cover" controls />)}
                    <div className="text-xs text-muted-foreground">{laneFiles.north?.name}</div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">NORTH: Click to select</div>
                )}
              </div>
              <div />

              {/* West */}
              <div className="relative border-2 border-dashed rounded-lg p-4 text-center">
                <input type="file" accept="video/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleLaneInput('west')} disabled={isProcessing} />
                {laneFiles.west ? (
                  <div className="space-y-2">
                    {lanePreviews['west'] && (<video src={lanePreviews['west'] || undefined} className="w-full h-40 object-cover" controls />)}
                    <div className="text-xs text-muted-foreground">{laneFiles.west?.name}</div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">WEST: Click to select</div>
                )}
              </div>

              {/* Center placeholder */}
              <div className="flex items-center justify-center text-xs text-muted-foreground">Intersection</div>

              {/* East */}
              <div className="relative border-2 border-dashed rounded-lg p-4 text-center">
                <input type="file" accept="video/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleLaneInput('east')} disabled={isProcessing} />
                {laneFiles.east ? (
                  <div className="space-y-2">
                    {lanePreviews['east'] && (<video src={lanePreviews['east'] || undefined} className="w-full h-40 object-cover" controls />)}
                    <div className="text-xs text-muted-foreground">{laneFiles.east?.name}</div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">EAST: Click to select</div>
                )}
              </div>

              <div />
              {/* South */}
              <div className="relative border-2 border-dashed rounded-lg p-4 text-center">
                <input type="file" accept="video/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleLaneInput('south')} disabled={isProcessing} />
                {laneFiles.south ? (
                  <div className="space-y-2">
                    {lanePreviews['south'] && (<video src={lanePreviews['south'] || undefined} className="w-full h-40 object-cover" controls />)}
                    <div className="text-xs text-muted-foreground">{laneFiles.south?.name}</div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">SOUTH: Click to select</div>
                )}
              </div>
              <div />
            </div>
          </div>

          {isProcessing && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Activity className="w-5 h-5 animate-pulse" />
                <span className="font-medium">AI Model Processing...</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="text-sm text-muted-foreground text-center">
                Analyzing traffic patterns and vehicle density
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={(!(laneFiles.north || laneFiles.south || laneFiles.east || laneFiles.west || laneFiles.lane1 || laneFiles.lane2 || laneFiles.lane3 || laneFiles.lane4)) || isProcessing}
              className="flex-1 bg-gradient-primary hover:shadow-glow transition-all duration-300"
            >
              {isProcessing ? (
                <>
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Analyze Lanes
                </>
              )}
            </Button>
            
              {!isProcessing && (
                <Button
                  variant="outline"
                  onClick={clearSelection}
                  className="px-6"
                >
                  Clear All
                </Button>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};