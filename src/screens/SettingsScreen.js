import React, { useEffect, useState } from 'react';
import { View, Text, Button, NativeEventEmitter, NativeModules, StyleSheet, FlatList, AppState, Alert, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SSDeepTurboModule from '../../specs/NativeSSDeepModule';
import RNFS from 'react-native-fs';
import SQLite from 'react-native-sqlite-storage';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { useNavigation } from '@react-navigation/native';

const { DirectoryMonitor } = NativeModules;
const db = SQLite.openDatabase({ name: 'filehashes.db', location: 'default' });

const SettingsScreen = () => {
  const [availableDirectories, setAvailableDirectories] = useState({});
  const [selectedDirectory, setSelectedDirectory] = useState('');
  const [monitoredDirectories, setMonitoredDirectories] = useState([]);
  const [appState, setAppState] = useState(AppState.currentState);
  const [selectedThreshold, setSelectedThreshold] = useState(50); // default 50%
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigation = useNavigation();

  // Load selectedDirectory & monitoredDirectories when app starts
  useEffect(() => {
    const fetchStoredData = async () => {
      try {
        const storedDirectory = await AsyncStorage.getItem('selectedDirectory');
        const storedMonitoredDirs = await AsyncStorage.getItem('monitoredDirectories');
        const storedThreshold = await AsyncStorage.getItem('similarityThreshold');
        if (storedDirectory) setSelectedDirectory(storedDirectory);
        if (selectedThreshold) setSelectedThreshold(Number(storedThreshold));
        if (storedMonitoredDirs) setMonitoredDirectories(JSON.parse(storedMonitoredDirs));
      } catch (error) {
        console.error('Error retrieving stored data:', error);
      }
    };
    fetchStoredData();
    const fetchDirectories = async () => {
      try {
        const dirsJson = await DirectoryMonitor.getAvailableDirectories();
        const dirs = JSON.parse(dirsJson);
        setAvailableDirectories(dirs);

        if (!selectedDirectory) {
          const firstDir = Object.values(dirs)[0] || '';
          setSelectedDirectory(firstDir);
          await AsyncStorage.setItem('selectedDirectory', firstDir);
        }
      } catch (error) {
        console.error('Error fetching directories:', error);
      }
    };
    fetchDirectories();
  }, []);

  // Detect App Termination (Clear Data When Fully Closed)
  // useEffect(() => {
  //   const handleAppStateChange = async (nextAppState) => {
  //     if (appState.match(/inactive|background/) && nextAppState === 'active') {
  //       console.log('App has come to the foreground!');
  //     }

  //     // If app is terminated or removed from recents, clear the session data
  //     if (nextAppState === 'inactive') {
  //       console.log('App is closing, clearing session storage...');
  //       // await AsyncStorage.removeItem('selectedDirectory');
  //       // await AsyncStorage.removeItem('monitoredDirectories');
  //     }

  //     setAppState(nextAppState);
  //   };
  //   const appStateListener = AppState.addEventListener('change', handleAppStateChange);
  //   return () => appStateListener.remove();
  // }, [appState]);
  // Save selected threshold & update it
  const handleThresholdChange = async (value) => {
    setSelectedThreshold(value);
    await AsyncStorage.setItem('similarityThreshold', value.toString());
    console.log("Threshold set to: " + value)
  };
  const startMonitoring = async () => {
    if (selectedDirectory) {
      DirectoryMonitor.startMonitoring(selectedDirectory);
      console.log('Started monitoring:', selectedDirectory);

      const updatedMonitoredDirs = [...new Set([...monitoredDirectories, selectedDirectory])];
      setMonitoredDirectories(updatedMonitoredDirs);

      await AsyncStorage.setItem('monitoredDirectories', JSON.stringify(updatedMonitoredDirs));
    }
  };
  const stopMonitoring = async (directory) => {
    DirectoryMonitor.stopMonitoring(directory);
    console.log('Stopped monitoring:', directory);

    const updatedMonitoredDirs = monitoredDirectories.filter((dir) => dir !== directory);
    setMonitoredDirectories(updatedMonitoredDirs);

    await AsyncStorage.setItem('monitoredDirectories', JSON.stringify(updatedMonitoredDirs));
  };
  // Initialize the Database
  const initializeDatabase = () => {
    db.transaction(tx => {
      // Create Files_Record table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS Files_Record (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              file_name TEXT NOT NULL,
              file_type TEXT NOT NULL,
              file_path TEXT NOT NULL UNIQUE,
              file_size INTEGER NOT NULL,
              file_hash TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
        [],
        () => console.log('Files_Record table created successfully'),
        error => console.error('Error creating Files_Record table:', error),
      );

      // Create Duplicates_Record table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS Duplicates_Record (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              original_fid INTEGER NOT NULL,
              duplicate_fid INTEGER NOT NULL,
              similarity_score INTEGER NOT NULL,
              detected_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (original_fid) REFERENCES Files_Record (id),
              FOREIGN KEY (duplicate_fid) REFERENCES Files_Record (id)
            )`,
        [],
        () => console.log('Duplicates_Record table created successfully'),
        error =>
          console.error('Error creating Duplicates_Record table:', error),
      );
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS Initial_Scan_Results (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  file_type TEXT UNIQUE,
                  total_files INTEGER,
                  duplicate_files INTEGER,
                  scan_date DATETIME DEFAULT CURRENT_TIMESTAMP
                );`,
        [],
        () => console.log('✅ Initial_Scan_Results table created'),
        (_, error) =>
          console.error('Error creating Initial_Scan_Results table:', error),
      );
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS deleted_duplicates (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  file_name TEXT NOT NULL,
                  file_path TEXT NOT NULL,
                  file_size_kb INTEGER NOT NULL,
                  file_category TEXT,
                  similarity_percentage INTEGER,
                  deletion_date DATETIME DEFAULT CURRENT_TIMESTAMP
              );`,
        [],
        () => console.log('✅ Deleted_duplicates table created'),
        (_, error) =>
          console.error('Error creating deleted_duplicates table:', error),
      );
      // Create indexes
      tx.executeSql(
        'CREATE INDEX IF NOT EXISTS idx_files_record_file_path ON Files_Record (file_path)',
        [],
        () => console.log('Index on file_path created successfully'),
        error => console.error('Error creating index on file_path:', error),
      );
      tx.executeSql(
        'CREATE INDEX IF NOT EXISTS idx_files_record_file_type ON Files_Record (file_type)',
        [],
        () => console.log('Index on file_type created successfully'),
        error => console.error('Error creating index on file_type:', error),
      );
      tx.executeSql(
        'CREATE INDEX IF NOT EXISTS idx_duplicates_record_original_fid ON Duplicates_Record (original_fid)',
        [],
        () => console.log('Index on original_fid created successfully'),
        error => console.error('Error creating index on original_fid:', error),
      );
      tx.executeSql(
        'CREATE INDEX IF NOT EXISTS idx_duplicates_record_duplicate_fid ON Duplicates_Record (duplicate_fid)',
        [],
        () => console.log('Index on duplicate_fid created successfully'),
        error => console.error('Error creating index on duplicate_fid:', error),
      );
      tx.executeSql(
        'CREATE INDEX IF NOT EXISTS idx_duplicates_record_similarity_score ON Duplicates_Record (similarity_score)',
        [],
        () => console.log('Index on similarity_score created successfully'),
        error =>
          console.error('Error creating index on similarity_score:', error),
      );
    });
  };
  const getFileExtension = (filePath) => {
    return filePath.split('.').pop().toLowerCase();
  };
  const displayNotification = async (title, count, results) => {
    // Create a channel for Android notifications
    await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
    });
    // Display the notification
    await notifee.displayNotification({
      title: `<b>${title}</b>`,
      body: ` ${count} Similar file(s) were detected.`,
      android: {
        channelId: 'default',
        smallIcon: 'ic_launcher', // Ensure the icon exists in your project
        pressAction: {
          id: 'default', // Unique ID for main notification tap
        },
        actions: [
          {
            title: 'View',
            pressAction: {
              id: 'view',
            },
          },
          {
            title: 'Ignore',
            pressAction: {
              id: 'ignore',
            },
          },
        ],
      },
      data: {
        count: count,
        results: JSON.stringify(results),
      },
    });
  };
  const computeAndCompareHash = async (newFilePath) => {
    try {
      // Get file metadata (size, name)
      const fileInfo = await RNFS.stat(newFilePath);
      const fileSizeKB = (fileInfo.size / 1024).toFixed(2); // Convert to KB
      const fileName = newFilePath.split('/').pop(); // Extract file name
      const filetype = await getFileExtension(newFilePath);

      // Compute the hash of the new file
      const hash = await SSDeepTurboModule.hashFile(newFilePath);
      console.log(hash)

      // Fetch all relevant hashes from the database
      const hashes = await fetchHashesFromDatabase(filetype);
      console.log(hashes)

      // Compare the new hash with the array of hashes
      const storedThreshold = await AsyncStorage.getItem('similarityThreshold');
      const threshold = Number(storedThreshold);
      const results = await SSDeepTurboModule.compareHashWithArray(
        hash,
        hashes,
        threshold,
      );
      console.log(results);
      if (results.length > 0) {
        const similarFilesWithPath = await similarFilesPath(results);
        console.log(similarFilesWithPath);
        Alert.alert(
          'Duplicate Found',
          `${similarFilesWithPath.length} similar files found.`,
        );
        await displayNotification(
          'Duplicate files detected',
          similarFilesWithPath.length,
          results
        );
        for (const result of results) {
          console.log('In for loop')
          const originalFileHash = result.hash; // Hash of the original file
          const similarityScore = result.similarity; // Similarity score
          // Fetch the original file's ID from the database
          const originalFileId = await fetchFileIdByHash(originalFileHash);
          // Insert the duplicate file into Files_Record
          const duplicateFileId = await insertHashIntoDatabase(
            newFilePath,
            hash,
            filetype,
            fileName,
            fileSizeKB,
          );
          console.log(duplicateFileId)
          // Insert the duplicate relationship into Duplicates_Record
          await insertHashIntoDuplicates(
            originalFileId,
            duplicateFileId,
            similarityScore,
          );
          console.log('Inserted into duplicates table')
        }
      } else {
        Alert.alert('No Duplicates', 'No similar files found.');
        console.log('No duplicates found')
        // Insert the new file's hash into the database
        await insertHashIntoDatabase(
          newFilePath,
          hash,
          filetype,
          fileName,
          fileSizeKB,
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to compute or compare hashes');
      console.error(error);
    }
  };
  const fetchHashesFromDatabase = (filetype) => {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'SELECT DISTINCT file_hash FROM Files_Record WHERE file_type = ?',
          [filetype],
          (tx, results) => {
            const hashes = [];
            for (let i = 0; i < results.rows.length; i++) {
              hashes.push(results.rows.item(i).file_hash);
            }
            resolve(hashes);
          },
          (error) => {
            reject(error);
          }
        );
      });
    });
  };
  const similarFilesPath = async (results) => {
    try {
      const promises = results.map(result => {
        return new Promise((resolve, reject) => {
          db.transaction(tx => {
            tx.executeSql(
              'SELECT DISTINCT file_path FROM Files_Record WHERE file_hash = ?',
              [result.hash],
              (tx, queryResults) => {
                const similarFilePaths = [];
                for (let i = 0; i < queryResults.rows.length; i++) {
                  similarFilePaths.push({
                    filepath: queryResults.rows.item(i).file_path,
                    similarity: result.similarity,
                  });
                }
                resolve(similarFilePaths);
              },
              error => {
                reject(error);
              },
            );
          });
        });
      });

      // Wait for all promises to resolve and flatten the results
      const resolvedResults = await Promise.all(promises);
      return resolvedResults.flat(); // Flatten the nested arrays into a single array
    } catch (error) {
      console.error('Error fetching file paths:', error);
      return [];
    }
  };
  const fetchFileIdByHash = (hash) => {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'SELECT id FROM Files_Record WHERE file_hash = ?',
          [hash],
          (tx, results) => {
            if (results.rows.length > 0) {
              resolve(results.rows.item(0).id);
            } else {
              reject(new Error('File not found in database'));
            }
          },
          error => reject(error),
        );
      });
    });
  };
  const insertHashIntoDatabase = (
    filePath,
    hash,
    fileType,
    fileName,
    fileSizeKB,
  ) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO Files_Record (file_name, file_type, file_path, file_size, file_hash) VALUES (?, ?, ?, ?, ?)',
          [fileName, fileType, filePath, fileSizeKB, hash],
          (tx, results) => {
            resolve(results.insertId); // Return the ID of the inserted record
          },
          error => reject(error),
        );
      });
    });
  };
  const insertHashIntoDuplicates = (
    original_fid,
    duplicate_fid,
    similarity_score,
  ) => {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO Duplicates_Record (original_fid, duplicate_fid, similarity_score) VALUES (?, ?, ?)',
          [original_fid, duplicate_fid, similarity_score],
          () => resolve(),
          error => reject(error),
        );
      });
    });
  };
  const deleteFileRecord = (filePath) => {
    db.transaction((tx) => {
      // First, get the file ID from Files_Record
      tx.executeSql(
        `SELECT id FROM Files_Record WHERE file_path = ?`,
        [filePath],
        (_, result) => {
          if (result.rows.length > 0) {
            const fileId = result.rows.item(0).id;

            // Delete any entries from Duplicates_Record referencing this file
            tx.executeSql(
              `DELETE FROM Duplicates_Record WHERE original_fid = ? OR duplicate_fid = ?`,
              [fileId, fileId],
              () =>
                console.log(`Duplicates involving file ID ${fileId} removed`),
              error =>
                console.error('Error deleting from Duplicates_Record:', error),
            );

            // Delete from Files_Record
            tx.executeSql(
              `DELETE FROM Files_Record WHERE id = ?`,
              [fileId],
              () => console.log(`File record with ID ${fileId} deleted`),
              error =>
                console.error('Error deleting from Files_Record:', error),
            );
          } else {
            console.warn('File record not found in database.');
          }
        },
        error => console.error('Error retrieving file ID:', error),
      );
    });
  };

  useEffect(() => {
    const directoryMonitorEvents = new NativeEventEmitter(DirectoryMonitor);
    const handleFileChange = async (event) => {
      const [eventType, filePath] = event.split(':');
      console.log('File change detected:', event);
      if (eventType === 'CREATE' || eventType === 'MOVED_TO') {
        console.log('computeAndComparing new file hash');
        // const filetype = await getFileExtension(filePath);
        // const hashes = await fetchHashesFromDatabase(filetype);
        // console.log(hashes)
        computeAndCompareHash(filePath);
      } else if (eventType === 'DELETE') {
        deleteFileRecord(filePath);
      }
    };
    // Remove previous listeners to prevent duplicate executions
    directoryMonitorEvents.removeAllListeners('FileChangeEvent');
    // Add the listener
    const subscription = directoryMonitorEvents.addListener('FileChangeEvent', handleFileChange);
    return () => {
      subscription.remove(); // Cleanup when component unmounts
    };
  }, []);

  useEffect(() => {
    initializeDatabase();
  }, []);

  const truncateInitDb = () => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM Initial_Scan_Results',
        [],
        () =>
          console.log(
            'All records from "Initial_Scan_Results" table have been cleared.',
          ),
        error => console.error('Error clearing "files" table:', error),
      );
    });
  };
  const truncateDatabaseFiles = () => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM Files_Record',
        [],
        () =>
          console.log(
            'All records from "Files_Record" table have been cleared.',
          ),
        error => console.error('Error clearing "files" table:', error),
      );
    });
  };
  const truncateDatabaseDuplicates = () => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM Duplicates_Record',
        [],
        () =>
          console.log(
            'All records from "Duplicates_Record" table have been cleared.',
          ),
        error => console.error('Error clearing "files" table:', error),
      );
    });
  };
  const resetAppData = async () => {
    truncateDatabaseFiles();
    truncateDatabaseDuplicates();
    truncateInitDb();
    await AsyncStorage.removeItem('isFirstLaunch');
    console.log('First Launch set to False');
    await AsyncStorage.removeItem('hasOnboarded');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>SETTINGS</Text>
      {/* Dark/Light Mode Toggle */}
      {/* <View style={styles.settingsCard}>
        <TouchableOpacity
          style={styles.themeToggleButton}
          onPress={() => setIsDarkMode((prev) => !prev)}
        >
          <Text style={styles.themeToggleButtonText}>
            {isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          </Text>
        </TouchableOpacity>
      </View>  */}

      {/* Set Similarity Threshold */}
      <View style={styles.settingsCard}>
        <Text style={styles.thresholdLabel}>Set Similarity Threshold</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedThreshold}
            style={styles.thresholdPicker}
            onValueChange={(itemValue) => handleThresholdChange(itemValue)}
          >
            {[30, 40, 50, 60, 70, 80, 90, 100].map((value) => (
              <Picker.Item key={value} label={`${value}%`} value={value} />
            ))}
          </Picker>
        </View>

      </View>

      {/* Reset/Clear App Data */}
      <View style={styles.settingsCard}>
        <TouchableOpacity style={styles.resetButton} onPress={resetAppData}>
          <Text style={styles.resetButtonText}>Reset / Clear App Data</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Select Directory(s) for Automatic Duplicate File Detection</Text>
      <View style={styles.card}>
        <Picker
          selectedValue={selectedDirectory}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedDirectory(itemValue)}
        >
          {Object.entries(availableDirectories).map(([key, value]) => (
            <Picker.Item key={key} label={key} value={value} />
          ))}
        </Picker>
        <TouchableOpacity style={styles.startButton} onPress={startMonitoring}>
          <Text style={styles.startButtonText}>Start Monitoring</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>Monitored Directories</Text>
      <FlatList
        data={monitoredDirectories}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <View style={styles.directoryCard}>
            <Text style={styles.directoryText}>{item}</Text>
            <TouchableOpacity style={styles.stopButton} onPress={() => stopMonitoring(item)}>
              <Text style={styles.stopButtonText}>Stop</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.noDirectoryText}>No directories being monitored</Text>}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f5f5f5", // Light gray background like CCleaner UI
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
    textAlign: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#444",
  },
  card: {
    backgroundColor: "#ffffff", // White card background
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android shadow
  },
  picker: {
    height: 50,
    width: "100%",
  },
  startButton: {
    backgroundColor: "#007BFF", // Blue button like CCleaner
    paddingVertical: 12,
    marginTop: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  startButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 10,
  },
  directoryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  directoryText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  stopButton: {
    backgroundColor: "#D9534F", // CCleaner-style red button
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  stopButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  noDirectoryText: {
    color: "#888",
    textAlign: "center",
    marginTop: 10,
  },

  themeToggleButton: {
    backgroundColor: "#007BFF", // Gray color for neutral toggle
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },

  themeToggleButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  thresholdLabel: {
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
    marginBottom: 5,
    marginTop: 10,
  },

  resetButton: {
    backgroundColor: "#007BFF", // Red color like CCleaner reset
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },

  resetButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  thresholdCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  thresholdLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#444",
    marginBottom: 10,
  },

  thresholdPicker: {
    height: 50,
    width: "100%",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  settingsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  themeToggleButton: {
    backgroundColor: "#6c757d", // Neutral gray
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  themeToggleButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  thresholdLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#444",
    marginBottom: 10,
  },

  pickerWrapper: {
    backgroundColor: "black",
    borderRadius: 8,
    overflow: "hidden",
  },

  thresholdPicker: {
    height: 50,
    width: "100%",
  },

  resetButton: {
    backgroundColor: "#DC3545", // Danger red
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  resetButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },


});

export default SettingsScreen;