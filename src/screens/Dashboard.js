import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import { LineChart, BarChart, PieChart, ProgressChart, ContributionGraph } from "react-native-chart-kit";
import SQLite from 'react-native-sqlite-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const screenWidth = Dimensions.get("window").width;
const db = SQLite.openDatabase({ name: 'filehashes.db', location: 'default' });

export default function DashboardScreen() {
  const [scanData, setScanData] = useState([]);

  // Function to generate random colors
  const getRandomColor = () => `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  
  // Fetch initial scan results
  const getInitialScanResults = (callback) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM Initial_Scan_Results`,
        [],
        (_, result) => {
          let results = [];
          for (let i = 0; i < result.rows.length; i++) {
            results.push(result.rows.item(i)); // Correct way to extract each row
          }
          callback(results);
        },
        (_, error) => console.error("Error fetching scan results:", error)
      );
    });
  };

  useEffect(() => {
    getInitialScanResults((results) => {
      console.log("Raw Scan Results:", results); // Debugging
      setScanData(results);
    });
  }, []);

  // Transform scan data into chart-friendly format
  const fileTypes = scanData.map((item) => item.file_type);
  const totalFiles = scanData.map((item) => item.total_files);
  const duplicateFiles = scanData.map((item) => item.duplicate_files);

  // Bar Chart (Total Files by Type)
  const barData = {
    labels: fileTypes.length > 0 ? fileTypes : ["No Data"],
    datasets: [{ data: totalFiles.length > 0 ? totalFiles : [0] }]
  };

  // Line Chart (Duplicate Files by Type)
  const lineData = {
    labels: fileTypes.length > 0 ? fileTypes : ["No Data"],
    datasets: [{ data: duplicateFiles.length > 0 ? duplicateFiles : [0] }]
  };

  // Pie Chart (Duplicate File Distribution)
  const pieData = scanData.length > 0 ? scanData.map((item) => ({
    name: item.file_type,
    population: item.duplicate_files,
    color: getRandomColor(),
    legendFontColor: "#FFF",
    legendFontSize: 12
  })) : [{ name: "No Data", population: 1, color: "#CCCCCC", legendFontColor: "#FFF", legendFontSize: 12 }];

  // Progress Chart (Percentage of Duplicate Files)
  const totalScanned = totalFiles.reduce((acc, val) => acc + val, 0);
  const totalDuplicates = duplicateFiles.reduce((acc, val) => acc + val, 0);
  const progressData = { data: totalScanned > 0 ? [totalDuplicates / totalScanned] : [0] };

  // Heatmap Chart (Dummy Data for Now)
  const heatmapData = [
    { date: "2024-02-01", count: 10 },
    { date: "2024-02-02", count: 20 },
    { date: "2024-02-03", count: 15 },
  ];

  // Chart config
  const chartConfig = {
    backgroundGradientFrom: "#1E2923",
    backgroundGradientTo: "#08130D",
    color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  };

  useEffect(() => {
    // AsyncStorage.removeItem('isFirstLaunch');
    // console.log('item removed')
  }, [])
  

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>DASHBOARD STATS</Text>

      <View style={styles.card}>
        <Text style={styles.chartTitle}>Total Files (Bar Chart)</Text>
        <BarChart data={barData} width={screenWidth * 0.81} height={220} chartConfig={chartConfig} />
      </View>

      <View style={styles.card}>
        <Text style={styles.chartTitle}>Duplicate Files (Line Chart)</Text>
        <LineChart data={lineData} width={screenWidth * 0.81} height={220} chartConfig={chartConfig} />
      </View>

      <View style={styles.card}>
        <Text style={styles.chartTitle}>Duplicate File Distribution (Pie Chart)</Text>
        <PieChart data={pieData} width={screenWidth * 0.81} height={220} accessor="population" chartConfig={chartConfig} />
      </View>

      <View style={styles.card}>
        <Text style={styles.chartTitle}>Duplicate Files Percentage (Progress Chart)</Text>
        <ProgressChart data={progressData} width={screenWidth * 0.81} height={220} strokeWidth={16} radius={32} chartConfig={chartConfig} />
      </View>
    </ScrollView>
  
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa", // Light grey background (CCleaner-style)
    padding: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333", // Dark grey
    textAlign: "center",
    marginBottom: 20,
    textTransform: "uppercase", // Capitalized like CCleaner
  },
  card: {
    backgroundColor: "#ffffff", // White background
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    width: "100%", // Ensure it takes full width
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4, // Slight elevation for material effect
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#444", // Softer black
    marginBottom: 10,
  },
});
