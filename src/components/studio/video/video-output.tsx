'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Copy,
  Check,
  Video as VideoIcon,
  Clock,
  Image as ImageIcon,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import type { VideoGenerationResult } from '@/types/video-api';
import { Button } from '@/components/ui/button';

interface VideoOutputProps {
  result: VideoGenerationResult;
  onGenerateAnother: () => void;
}

export function VideoOutput({ result, onGenerateAnother }: VideoOutputProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [downloadSuccess, setDownloadSuccess] = React.useState(false);

  // Video control handlers
  const togglePlay = React.useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const toggleMute = React.useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const toggleFullscreen = React.useCallback(() => {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  }, []);

  // Download video handler
  const handleDownload = React.useCallback(async () => {
    try {
      const response = await fetch(result.videoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const timestamp = Date.now();
      const a = document.createElement('a');
      a.href = url;
      a.download = `seedance-video-${timestamp}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download video. Please try again.');
    }
  }, [result.videoUrl]);

  // Download last frame handler
  const handleDownloadLastFrame = React.useCallback(async () => {
    if (!result.lastFrameUrl) return;

    try {
      const response = await fetch(result.lastFrameUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const timestamp = Date.now();
      const a = document.createElement('a');
      a.href = url;
      a.download = `seedance-last-frame-${timestamp}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Last frame download failed:', error);
      alert('Failed to download last frame. Please try again.');
    }
  }, [result.lastFrameUrl]);

  // Copy metadata to clipboard
  const handleCopyMetadata = React.useCallback(() => {
    const metadata = `Task ID: ${result.taskId}
Prompt: ${result.prompt}
Mode: ${result.mode}
Duration: ${result.actualDuration}s
Resolution: ${result.parameters.resolution}
Aspect Ratio: ${result.actualRatio}
Audio: ${result.parameters.generateAudio ? 'Enabled' : 'Disabled'}
Service Tier: ${result.parameters.serviceTier}
Generation Time: ${(result.generationTimeMs / 1000).toFixed(1)}s
Seed: ${result.seed}`;

    navigator.clipboard.writeText(metadata);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  // Format duration helper
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto space-y-6"
    >
      {/* 24-hour expiry warning */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl border-2 border-amber-500/50 bg-amber-500/5 p-4"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              Video URL expires in 24 hours
            </p>
            <p className="text-xs text-muted-foreground">
              Download your video now to save it permanently. The URL will become invalid after 24 hours.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Video player */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative rounded-2xl overflow-hidden bg-black border-2 border-border shadow-2xl"
      >
        <video
          ref={videoRef}
          src={result.videoUrl}
          className="w-full h-auto"
          controls
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          muted={isMuted}
        >
          Your browser does not support video playback.
        </video>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap gap-3"
      >
        <Button
          onClick={handleDownload}
          size="lg"
          className="flex-1 sm:flex-initial bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white border-0 shadow-lg"
        >
          {downloadSuccess ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Downloaded!
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download Video
            </>
          )}
        </Button>

        {result.lastFrameUrl && (
          <Button
            onClick={handleDownloadLastFrame}
            variant="outline"
            size="lg"
            className="flex-1 sm:flex-initial"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Last Frame
          </Button>
        )}

        <Button
          onClick={handleCopyMetadata}
          variant="outline"
          size="lg"
          className="flex-1 sm:flex-initial"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Info
            </>
          )}
        </Button>

        <Button
          onClick={() => window.open(result.videoUrl, '_blank')}
          variant="outline"
          size="lg"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open
        </Button>
      </motion.div>

      {/* Metadata grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        <MetadataCard
          icon={Clock}
          label="Duration"
          value={`${result.actualDuration}s`}
          subtext={result.parameters.duration === -1 ? 'Auto (model decided)' : `${result.parameters.duration}s requested`}
        />
        <MetadataCard
          icon={VideoIcon}
          label="Resolution"
          value={result.parameters.resolution}
          subtext={result.actualRatio}
        />
        <MetadataCard
          icon={result.parameters.generateAudio ? Volume2 : VolumeX}
          label="Audio"
          value={result.parameters.generateAudio ? 'Enabled' : 'Disabled'}
          subtext={result.parameters.generateAudio ? 'With synchronized audio' : 'Silent video'}
        />
        <MetadataCard
          icon={Clock}
          label="Generation Time"
          value={`${(result.generationTimeMs / 1000).toFixed(1)}s`}
          subtext={result.parameters.serviceTier === 'flex' ? 'Flex tier' : 'Default tier'}
        />
      </motion.div>

      {/* Prompt display */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border border-border bg-card p-6 space-y-3"
      >
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <VideoIcon className="w-4 h-4 text-green-500" />
          Prompt & Details
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {result.prompt}
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Mode:</span>{' '}
            <span className="font-medium text-foreground">{result.mode}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Task ID:</span>{' '}
            <span className="font-mono text-foreground">{result.taskId.substring(0, 8)}...</span>
          </div>
          <div>
            <span className="text-muted-foreground">Seed:</span>{' '}
            <span className="font-mono text-foreground">{result.seed}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Tokens:</span>{' '}
            <span className="font-medium text-foreground">{result.usage.total_tokens.toLocaleString()}</span>
          </div>
        </div>
      </motion.div>

      {/* Reference images */}
      {result.referenceImageUrls && result.referenceImageUrls.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl border border-border bg-card p-6 space-y-3"
        >
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-green-500" />
            Reference Images ({result.referenceImageUrls.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {result.referenceImageUrls.map((url, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-muted border border-border">
                <img
                  src={url}
                  alt={`Reference ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-xs font-medium">
                  #{idx + 1}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Generate another button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex justify-center pt-4"
      >
        <Button
          onClick={onGenerateAnother}
          size="lg"
          variant="outline"
          className="min-w-[200px]"
        >
          Generate Another Video
        </Button>
      </motion.div>
    </motion.div>
  );
}

// Metadata card component
interface MetadataCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtext?: string;
}

function MetadataCard({ icon: Icon, label, value, subtext }: MetadataCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded bg-green-500/10">
          <Icon className="w-3.5 h-3.5 text-green-500" />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-semibold text-foreground">{value}</p>
      {subtext && (
        <p className="text-xs text-muted-foreground">{subtext}</p>
      )}
    </div>
  );
}
