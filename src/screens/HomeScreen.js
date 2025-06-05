import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, NativeModules } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import CpuUsage from '../components/CpuUsage';
import StorageStats from '../components/StorageStats';
import { useNavigation } from '@react-navigation/native';
import notifee, { EventType } from '@notifee/react-native';
//import DonutChart from "react-native-donut-chart";

const { FileScannerModule } = NativeModules;

export default function HomeScreen() {
  const navigation = useNavigation();
  const [fileDistribution, setFileDistribution] = useState([]);
  const [isLoading, setisLoading] = useState(false);

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };
  const navigateTo = (screen) => {
    navigation.navigate(screen);
  };
  const scanFiles = async () => {
    try {
      const files = await FileScannerModule.scanFiles();
      const parsedFiles = JSON.parse(files);
      console.log(parsedFiles);

      const categoryCounts = {};
      parsedFiles.forEach((file) => {
        categoryCounts[file.category] = (categoryCounts[file.category] || 0) + 1;
      });

      console.log(categoryCounts);
      const distributionData = Object.entries(categoryCounts).map(
        ([category, count]) => ({
          name: category,
          population: count,
          color: getRandomColor(),
          legendFontColor: "white",
          legendFontSize: 14,
        })
      );
      setFileDistribution(distributionData);
    } catch (error) {
      console.error("File scan error:", error);
    }
  };

  useEffect(() => {
    setisLoading(true)
    scanFiles();
    setisLoading(false)
  }, []);

  return (
    <ScrollView contentContainerStyle={{ alignItems: 'center', padding: 10 }}>

      {isLoading == true ? (
         <View style={styles.card}>
            <Text style={styles.scanButtonText}>Loading...</Text>
        </View>

      ) : (

      <View style={styles.container}>

        <StorageStats />

        <View style={styles.card}>
          {/* Scan Button */}
          <TouchableOpacity onPress={() => navigateTo('Scan')} style={styles.scanButton}>
            <Text style={styles.scanButtonText}>SCAN FILES</Text>
          </TouchableOpacity>
        </View>

        {/* <CpuUsage /> */}

        <View style={styles.card}>
          <Text style={styles.heading}>File Distribution</Text>

          {fileDistribution.length > 0 ? (
            <PieChart
              data={fileDistribution}
              width={Dimensions.get('window').width - 60} // Slightly reduced width for padding
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                color: (opacity = 1) => `rgba(50, 50, 50, ${opacity})`, // Dark grey text
                strokeWidth: 2,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute // Shows values inside the chart
            />
          ) : (
            <Text style={styles.noFilesText}>Loading files distribution...</Text>
          )}

        </View>
      </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 0,
    backgroundColor: "#fff", // White background for a clean UI
  },
  heading: {
    fontSize: 24,
    color: '#202124', // Google's dark gray
    margin: 16,
    fontWeight: '500',
    elevation: 2, // Android shadow
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  /* Scan Button */
  scanButton: {
    backgroundColor: "#007AFF", // CCleaner-style blue button
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3, // Android shadow
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 1,
  },

  /* No Files Text */
  noFilesText: {
    fontSize: 14,
    color: "#777",
  },
});
