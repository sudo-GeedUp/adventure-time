import React from 'react';
import { View, StyleSheet } from 'react-native';
import AntGameSimple from '../components/AntGameSimple';

export default function AntGameScreen() {
  return (
    <View style={styles.container}>
      <AntGameSimple />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
