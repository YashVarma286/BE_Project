import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function Navbar({ toggleSidebar }) {
  return (
    <View style={styles.navbar}>
      <TouchableOpacity onPress={toggleSidebar}>
        <Text style={styles.menuButton}>☰</Text>
      </TouchableOpacity>
      <Text style={styles.title}>DeDupePro</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    height: 50,
    backgroundColor: 'white',    
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  menuButton: {
    color: 'black',
    fontSize: 24,
  },
  title: {
    color: 'black',
    fontSize: 20,
    fontWeight: 'bold',
  },
});