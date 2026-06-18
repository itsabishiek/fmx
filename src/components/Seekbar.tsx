import { useRef, useState } from 'react';
import { GestureResponderEvent, PanResponder, StyleSheet, View } from 'react-native';
import { palette } from '@/theme';

interface SeekbarProps {
  position: number;
  duration: number;
  onSeek: (seconds: number) => void;
  color?: string;
}

/**
 * A touch/drag seek bar. While dragging it shows the scrubbed position locally and
 * only commits the seek on release, so live progress updates don't fight the gesture.
 *
 * The inner track/fill/thumb are `pointerEvents="none"` so the gesture is always
 * measured against the full-width hit area — otherwise a touch landing on the thumb or
 * fill would report a `locationX` relative to that sub-view and seek to the wrong spot.
 */
export function Seekbar({ position, duration, onSeek, color = palette.accent }: SeekbarProps) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const durationRef = useRef(duration);
  durationRef.current = duration;
  const [dragRatio, setDragRatio] = useState<number | null>(null);

  const ratioFromX = (x: number) => {
    const w = widthRef.current;
    if (w <= 0) return 0;
    return Math.max(0, Math.min(1, x / w));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (e: GestureResponderEvent) =>
        setDragRatio(ratioFromX(e.nativeEvent.locationX)),
      onPanResponderMove: (e: GestureResponderEvent) =>
        setDragRatio(ratioFromX(e.nativeEvent.locationX)),
      onPanResponderRelease: (e: GestureResponderEvent) => {
        const r = ratioFromX(e.nativeEvent.locationX);
        onSeek(r * (durationRef.current || 0));
        setDragRatio(null);
      },
      onPanResponderTerminate: () => setDragRatio(null),
    }),
  ).current;

  const ratio = dragRatio != null ? dragRatio : duration > 0 ? position / duration : 0;
  const clamped = Math.max(0, Math.min(1, ratio));
  const pct = `${clamped * 100}%` as const;

  return (
    <View
      style={styles.hitArea}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        setWidth(w);
        widthRef.current = w;
      }}
      {...panResponder.panHandlers}>
      <View style={styles.track} pointerEvents="none">
        <View style={[styles.fill, { width: pct, backgroundColor: color }]} />
        <View style={[styles.thumb, { left: pct, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hitArea: { paddingVertical: 16, justifyContent: 'center' },
  track: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
  },
  fill: { height: 5, borderRadius: 3 },
  thumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
    top: -4.5,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },
});
