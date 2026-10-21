export type VideoQuality = 'Auto' | '4K UHD' | '1080p FHD' | '720p HD';

export type PlaybackRate = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;

export interface PlayerSettings {
  quality: VideoQuality;
  speed: PlaybackRate;
  audioTrack: string;
  subtitles: string;
}

export interface VideoPlayerProps {
  title: string;
  streamUrl: string;
  rawStreamUrl?: string;
  youtubeTrailerId?: string;
  posterUrl?: string;
  backdropUrl?: string;
  category?: string;
  year?: number;
  durationText?: string;
  isAndroidNativeMode?: boolean;
  onToggleAndroidNativeMode?: () => void;
  onClose?: () => void;
  onWatchProgress?: (seconds: number, durationSeconds?: number) => void;
}
