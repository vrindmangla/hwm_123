import React, { useState, useCallback } from 'react';
import { Upload, Activity, Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface TrafficUploadProps {
  onUpload: (video: File | null) => void;
  isProcessing: boolean;
  progress: number;
}

export const TrafficUpload: React.FC<TrafficUploadProps> = ({
  onUpload,
  isProcessing,
  progress
}) => {
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleVideoSelect = (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid Video",
        description: "Select a valid video file (MP4, WebM, MOV).",
        variant: "destructive",
      });
      return;
    }
    setSelectedVideo(file);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
  };

  const handleVideoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleVideoSelect(e.target.files[0]);
    }
  };

  const clearSelection = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setSelectedVideo(null);
    setVideoPreview(null);
  };

  const handleSubmit = () => {
    onUpload(selectedVideo);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card className="bg-gradient-card border-border shadow-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            AI Traffic Analysis (Video Only)
          </CardTitle>
          <p className="text-muted-foreground">
            Upload a traffic video to compute rate-of-change and optimize green time
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Video Uploader */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Upload traffic video for rate calculation</label>
            <div className="relative border-2 border-dashed rounded-lg p-4 text-center">
              <input
                type="file"
                accept="video/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleVideoInput}
                disabled={isProcessing}
              />
              {selectedVideo ? (
                <div className="space-y-2">
                  {videoPreview && (
                    <video src={videoPreview} className="w-full h-48 object-cover" controls />
                  )}
                  <div className="text-xs text-muted-foreground">{selectedVideo.name}</div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Click to select a video file (MP4/WebM/MOV)</div>
              )}
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
              disabled={!selectedVideo || isProcessing}
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
                  Analyze Video
                </>
              )}
            </Button>
            
            {selectedVideo && !isProcessing && (
              <Button
                variant="outline"
                onClick={clearSelection}
                className="px-6"
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};