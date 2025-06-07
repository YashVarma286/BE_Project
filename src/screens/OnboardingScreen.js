import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logo1 from "../assets/images/analytics.png"
import logo2 from "../assets/images/analytics1.png"
import logo3 from "../assets/images/file_cleaner.png"
import logo4 from "../assets/images/free_up_space.png"
import logo5 from "../assets/images/racoon_logo.png"
import logo6 from "../../android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png"

const onboardingData = [
  { id: 1, text: "Welcome to MyApp!", image: logo1 }, // App Logo
  { id: 2,  text: "Detect duplicate files efficiently.", image: logo2 },
  { id: 3,  text: "Save storage and manage files better.", image: logo5 },
  { id: 4,  text: "Fast and secure scanning process.", image: logo4 },
  { id: 5,  text: "Start exploring MyApp now!", image: logo2 },
];

export default function OnboardingScreen({ navigation }) {
  const [currentPage, setCurrentPage] = useState(0);

  const handleNext = async () => {
    if (currentPage < onboardingData.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      await AsyncStorage.setItem('hasOnboarded', 'true'); // Save onboarding completion
      navigation.replace('Settings'); // Navigate to Settings
    }
  };

  return (
    <View style={styles.container}>
      <Image source={onboardingData[currentPage].image} style={styles.image} />
      <Text style={styles.text}>{onboardingData[currentPage].text}</Text>
      
      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.buttonText}>{currentPage === onboardingData.length - 1 ? "Get Started" : "Next"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'white' },
  image: { width: 300, height: 300, resizeMode: 'contain', marginBottom: 20 },
  text: { fontSize: 20, textAlign: 'center', fontWeight: 'bold', color: 'black' },
  nextButton: { marginTop: 20, padding: 15, backgroundColor: '#007AFF', borderRadius: 10, width: '80%', alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});
