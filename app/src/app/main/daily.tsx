import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const DailyPracticeScreen = () => {
  const [count, setCount] = useState(0);
  const [date, setDate] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const today = new Date().toDateString();
    const savedDate = await AsyncStorage.getItem('practiceDate');
    const savedCount = await AsyncStorage.getItem('practiceCount');

    if (savedDate === today && savedCount) {
      setCount(Number(savedCount));
    } else {
      await AsyncStorage.setItem('practiceDate', today);
      await AsyncStorage.setItem('practiceCount', '0');
      setCount(0);
    }
    setDate(today);
  };

  const increment = async () => {
    const newCount = count + 1;
    setCount(newCount);
    await AsyncStorage.setItem('practiceCount', String(newCount));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔥 Daily Practice Tracker 🔥</Text>
      <Text style={styles.date}>{date}</Text>
      <Text style={styles.counter}>{count} Sentences Practiced Today</Text>

      <TouchableOpacity style={styles.button} onPress={increment}>
        <Text style={styles.buttonText}>+1 Sentence</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.push('/')}>
        <Text style={styles.backText}>← Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
};

export default DailyPracticeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    marginBottom: 10,
  },
  date: {
    fontSize: 16,
    color: '#666',
  },
  counter: {
    fontSize: 22,
    fontWeight: '600',
    marginVertical: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
  backButton: {
    marginTop: 30,
  },
  backText: {
    color: '#007AFF',
    fontSize: 16,
  },
});
