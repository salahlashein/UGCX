import React, { useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useDeliverablePlayUrl } from '../hooks/api/useDeliverables';
import { LoadingState } from './ui/LoadingState';
import { ErrorState } from './ui/ErrorState';
import { colors, radius } from '../theme/tokens';

interface Props {
  deliverableId: string;
  aspect?: '16:9' | '9:16';
  onReady?: () => void;
  onError?: (message: string) => void;
}

/**
 * TASK-P3-10: VideoPlayer component for deliverable playback.
 * Uses signed URL from useDeliverablePlayUrl.
 */
export function VideoPlayer({ deliverableId, aspect = '16:9', onReady, onError }: Props) {
  const { data, isLoading, isError, error, refetch } = useDeliverablePlayUrl(deliverableId);

  const videoSource = data?.url ?? '';

  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
  });

  useEffect(() => {
    if (Platform.OS === 'web' && data?.url) {
      const timer = setTimeout(() => {
        onReady?.();
      }, 300);
      return () => clearTimeout(timer);
    }

    if (!player) return;

    const statusSubscription = player.addListener('statusChange', ({ status, error: playerError }) => {
      if (status === 'readyToPlay') {
        onReady?.();
      } else if (status === 'error') {
        const msg = playerError?.message ?? 'Failed to play video';
        onError?.(msg);
      }
    });

    return () => {
      statusSubscription?.remove?.();
    };
  }, [player, data?.url, onReady, onError]);

  if (isLoading) {
    return (
      <View style={[styles.container, aspect === '9:16' ? styles.aspect916 : styles.aspect169]}>
        <LoadingState />
      </View>
    );
  }

  if (isError || !data?.url) {
    return (
      <View style={[styles.container, aspect === '9:16' ? styles.aspect916 : styles.aspect169]}>
        <ErrorState
          title="Video unavailable"
          message={(error as Error)?.message ?? 'Could not load the video preview'}
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, aspect === '9:16' ? styles.aspect916 : styles.aspect169]}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        allowsPictureInPicture={false}
        nativeControls
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.md,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aspect169: {
    height: 220,
  },
  aspect916: {
    height: 390,
  },
});
