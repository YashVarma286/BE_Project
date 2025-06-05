import React from 'react';
import { SafeAreaView, ScrollView, Text, View, StyleSheet } from 'react-native';
import * as Progress from 'react-native-progress';

const ScanProgressUI = ({ progress, categories }) => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Initial Scan Progress</Text>

      {/* Overall Progress Bar */}
      <View style={styles.progressContainer}>
        <Progress.Bar progress={progress} width={300} height={10} color="#007BFF" />
        <Text style={styles.progressText}>
          {Math.round(progress * 100)}% Complete
        </Text>
      </View>

      {/* Category-wise Progress */}
      <ScrollView style={styles.categoryContainer}>
        {Object.entries(categories).map(([category, data]) => (
          <View key={category} style={styles.categoryItem}>
            <Text style={styles.categoryTitle}>{category.toUpperCase()} Files</Text>
            <Text>Scanned: {data.scanned} / {data.totalFiles}</Text>
            <Text>Duplicates Found: {data.duplicates}</Text>
            {/* <Progress.Bar progress={data.scanned / data.totalFiles || 0} width={200} height={5} color="#28A745" /> */}

            {/* Display Duplicate Files */}
            {data.duplicateFiles && data.duplicateFiles.length > 0 && (
              <View style={styles.duplicatesContainer}>
                <Text style={styles.duplicatesTitle}>Duplicate Files:</Text>
                {data.duplicateFiles.map((dup, index) => (
                  <Text key={index} style={styles.duplicateItem}>
                    {dup.file} (Similarity: {dup.similarity}%)
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressText: {
    marginTop: 8,
    fontSize: 16,
  },
  categoryContainer: {
    flex: 1,
  },
  categoryItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  duplicatesContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FFE6E6',
    borderRadius: 5,
  },
  duplicatesTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#D9534F',
  },
  duplicateItem: {
    fontSize: 14,
    color: '#D9534F',
  },
});

export default ScanProgressUI;