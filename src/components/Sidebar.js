import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function Sidebar() {
  const navigation = useNavigation();

  const navigateTo = (screen) => {
    navigation.navigate(screen);
  };

  return (
    <View style={styles.sidebar}>
      <TouchableOpacity onPress={() => navigateTo('Home')} style={styles.menuItemWrapper}>
        <Text style={styles.menuItem}>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigateTo('Scan')} style={styles.menuItemWrapper}>
        <Text style={styles.menuItem}>Scan</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigateTo('Results')} style={styles.menuItemWrapper}>
        <Text style={styles.menuItem}>Results</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigateTo('Dashboard')} style={styles.menuItemWrapper}>
        <Text style={styles.menuItem}>Dashboard</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigateTo('Settings')} style={styles.menuItemWrapper}>
        <Text style={styles.menuItem}>Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigateTo('AboutUs')} style={styles.menuItemWrapper}>
        <Text style={styles.menuItem}>About Us</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigateTo('Contacts')} style={styles.menuItemWrapper}>
        <Text style={styles.menuItem}>Contacts</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    position: 'absolute',
    top: 50, // Start from the very top
    left: 0,
    width: 260,
    height: '100%', // Cover full height of the screen
    backgroundColor: '#ffffff', // Solid white background
    paddingVertical: 10,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10, // Higher elevation to stay above other elements
    zIndex: 1000, // Ensures it's rendered above everything
  },
  menuItemWrapper: {
    width: '100%',
    marginBottom: 5,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  menuItem: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333', // Dark text for contrast
    textAlign: 'left',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#e0e0e0', // Light grey button background
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
});
