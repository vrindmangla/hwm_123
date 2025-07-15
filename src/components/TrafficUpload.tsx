import React, { useState, useCallback } from 'react';
import { Upload, Camera, Activity, Zap, FileImage, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface TrafficUploadProps {
  onUpload: (file: File) => void;
  isProcessing: boolean;
  progress: number;
}

export const TrafficUpload: React.FC<TrafficUploadProps> = ({
  onUpload,
  isProcessing,
  progress
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card className="bg-gradient-card border-border shadow-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <Camera className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            AI Traffic Analysis
          </CardTitle>
          <p className="text-muted-foreground">
            Upload a traffic image for real-time vehicle detection and signal optimization
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!selectedFile ? (
            <div
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300
                ${dragActive 
                  ? 'border-primary bg-primary/5 shadow-glow' 
                  : 'border-border hover:border-primary/50 hover:bg-primary/5'
                }
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="image/*"
                onChange={handleFileInput}
                disabled={isProcessing}
              />
              
              <div className="space-y-4">
                <div className="mx-auto p-4 bg-primary/10 rounded-full w-fit animate-pulse-glow">
                  <Upload className="w-12 h-12 text-primary" />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Drop your traffic image here
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    or click to browse files
                  </p>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Supports: JPG, PNG, GIF, WebP • Max size: 10MB
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-muted">
                {preview && (
                  <img
                    src={preview}
                    alt="Traffic preview"
                    className="w-full h-64 object-cover"
                  />
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={clearSelection}
                  disabled={isProcessing}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileImage className="w-4 h-4" />
                <span>{selectedFile.name}</span>
                <span>({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
            </div>
          )}

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
              disabled={!selectedFile || isProcessing}
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
                  Run AI Detection
                </>
              )}
            </Button>
            
            {selectedFile && !isProcessing && (
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