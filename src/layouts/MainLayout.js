import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function MainLayout({ children }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Navbar toggleSidebar={toggleSidebar} />
        {isSidebarOpen && <Sidebar />}
        <View style={styles.content}>{children}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white', // Optional: Set a background color for the safe area
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    marginTop: 10, // Adjust this value based on the height of your Navbar
  },
});