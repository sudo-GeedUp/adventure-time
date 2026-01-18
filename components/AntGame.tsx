import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Animated, Text } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ANT_SIZE = 60;

export default function AntGame() {
  const [score, setScore] = useState(0);
  const [ants, setAnts] = useState<Array<{ id: number; x: Animated.Value; y: number; active: boolean }>>([]);
  const nextAntId = useRef(0);
  const [splats, setSplats] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    const spawnAnt = () => {
      const startY = Math.random() * (SCREEN_HEIGHT - ANT_SIZE - 100) + 100;
      const duration = 3000 + Math.random() * 2000;

      const newAnt = {
        id: nextAntId.current++,
        x: new Animated.Value(-ANT_SIZE),
        y: startY,
        active: true,
      };

      setAnts(prev => [...prev, newAnt]);

      Animated.timing(newAnt.x, {
        toValue: SCREEN_WIDTH + ANT_SIZE,
        duration: duration,
        useNativeDriver: false,
      }).start(() => {
        setAnts(prev => prev.filter(ant => ant.id !== newAnt.id));
      });
    };

    const interval = setInterval(spawnAnt, 1500);
    spawnAnt();

    return () => clearInterval(interval);
  }, []);

  const handlePress = (antId: number) => {
    console.log('Ant pressed:', antId);
    const ant = ants.find(a => a.id === antId);
    if (!ant || !ant.active) return;

    ant.x.stopAnimation((currentX) => {
      console.log('Smashed ant at position:', currentX, ant.y);
      setSplats(prev => [...prev, { id: ant.id, x: currentX, y: ant.y }]);
      setTimeout(() => {
        setSplats(prev => prev.filter(s => s.id !== ant.id));
      }, 500);
    });

    setAnts(prev => prev.filter(a => a.id !== antId));
    setScore(prev => prev + 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>Score: {score}</Text>
      </View>

      {ants.map(ant => (
        <Animated.View
          key={ant.id}
          style={[
            styles.ant,
            {
              position: 'absolute',
              left: ant.x,
              top: ant.y,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => handlePress(ant.id)}
            style={styles.touchArea}
            activeOpacity={0.8}
          >
            <Text style={styles.antEmoji}>🐜</Text>
          </TouchableOpacity>
        </Animated.View>
      ))}

      {splats.map(splat => (
        <View
          key={`splat-${splat.id}`}
          style={[
            styles.splat,
            {
              left: splat.x,
              top: splat.y,
            },
          ]}
        >
          <Text style={styles.splatEmoji}>💥</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5E6D3',
  },
  scoreContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  ant: {
    width: ANT_SIZE,
    height: ANT_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  antEmoji: {
    fontSize: 50,
  },
  splat: {
    position: 'absolute',
    width: ANT_SIZE,
    height: ANT_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splatEmoji: {
    fontSize: 50,
  },
  touchArea: {
    width: ANT_SIZE,
    height: ANT_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
