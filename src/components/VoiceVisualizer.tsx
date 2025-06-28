import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface VoiceVisualizerProps {
  audioLevels: number[];
  isActive: boolean;
  size?: number;
}

export function VoiceVisualizer({ audioLevels, isActive, size = 100 }: VoiceVisualizerProps) {
  const { colors } = useTheme();
  const animatedValues = useRef(
    Array.from({ length: 20 }, () => new Animated.Value(0.1))
  ).current;
  
  useEffect(() => {
    if (isActive) {
      const animations = animatedValues.map((animatedValue, index) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(animatedValue, {
              toValue: Math.random() * 0.9 + 0.1,
              duration: 200 + Math.random() * 300,
              useNativeDriver: false,
            }),
            Animated.timing(animatedValue, {
              toValue: 0.1,
              duration: 200 + Math.random() * 300,
              useNativeDriver: false,
            }),
          ])
        );
      });
      
      Animated.stagger(50, animations).start();
    } else {
      animatedValues.forEach(animatedValue => {
        Animated.timing(animatedValue, {
          toValue: 0.1,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });
    }
  }, [isActive, animatedValues]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={styles.visualizer}>
        {animatedValues.map((animatedValue, index) => (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
                backgroundColor: colors.primary,
                height: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['10%', '100%'],
                }),
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  visualizer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
  },
  bar: {
    flex: 1,
    marginHorizontal: 1,
    borderRadius: 2,
    minHeight: 4,
  },
});