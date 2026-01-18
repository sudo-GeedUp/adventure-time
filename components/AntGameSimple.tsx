import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ANT_SIZE = 80;

interface Ant {
  id: number;
  x: number;
  y: number;
  active: boolean;
}

interface Splat {
  id: number;
  x: number;
  y: number;
}

export default function AntGameSimple() {
  const [score, setScore] = useState(0);
  const [ants, setAnts] = useState<Ant[]>([]);
  const [splats, setSplats] = useState<Splat[]>([]);
  const nextAntId = useRef(0);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    let lastSpawn = Date.now();
    
    const animate = () => {
      const now = Date.now();
      
      // Spawn new ants every 1.5 seconds
      if (now - lastSpawn > 1500) {
        const newAnt: Ant = {
          id: nextAntId.current++,
          x: -ANT_SIZE,
          y: Math.random() * (SCREEN_HEIGHT - ANT_SIZE - 150) + 100,
          active: true,
        };
        setAnts(prev => [...prev, newAnt]);
        lastSpawn = now;
      }
      
      // Move ants
      setAnts(prev => prev
        .map(ant => ({
          ...ant,
          x: ant.x + 3, // Move 3 pixels per frame
        }))
        .filter(ant => ant.x < SCREEN_WIDTH + ANT_SIZE) // Remove ants that went off screen
      );
      
      animationFrameId.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  const handleAntPress = (antId: number) => {
    const ant = ants.find(a => a.id === antId);
    if (!ant || !ant.active) return;
    
    // Add splat effect
    setSplats(prev => [...prev, { id: ant.id, x: ant.x, y: ant.y }]);
    
    // Remove splat after animation
    setTimeout(() => {
      setSplats(prev => prev.filter(s => s.id !== ant.id));
    }, 500);
    
    // Remove ant and increment score
    setAnts(prev => prev.filter(a => a.id !== antId));
    setScore(prev => prev + 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>Score: {score}</Text>
      </View>

      {ants.map(ant => (
        <TouchableOpacity
          key={ant.id}
          style={[
            styles.ant,
            {
              left: ant.x,
              top: ant.y,
            },
          ]}
          onPress={() => handleAntPress(ant.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.antEmoji}>🐜</Text>
        </TouchableOpacity>
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
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  ant: {
    position: 'absolute',
    width: ANT_SIZE,
    height: ANT_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  antEmoji: {
    fontSize: 60,
  },
  splat: {
    position: 'absolute',
    width: ANT_SIZE,
    height: ANT_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splatEmoji: {
    fontSize: 60,
  },
});
