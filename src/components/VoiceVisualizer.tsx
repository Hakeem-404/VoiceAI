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
  
  const spinValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (isActive) {
      // Create rotation animation
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
      
      const animations = animatedValues.map((animatedValue) => {
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
      spinValue.stopAnimation();
      animatedValues.forEach(animatedValue => {
        Animated.timing(animatedValue, {
          toValue: 0.1,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });
    }
  }, [isActive, animatedValues, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View 
      style={[
        styles.container, 
        { width: size, height: size },
        { transform: [{ rotate: spin }] }
      ]}
    >
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
    </Animated.View>
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