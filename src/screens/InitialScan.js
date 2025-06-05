import { SafeAreaView, StyleSheet, Text, View, Button, NativeModules } from 'react-native';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import SQLite from 'react-native-sqlite-storage';
import SSDeepTurboModule from '../../specs/NativeSSDeepModule';
import ScanProgressUI from '../components/ScanProgressUI';
import { useNavigation } from '@react-navigation/native';

const db = SQLite.openDatabase({ name: 'filehashes.db', location: 'default' });

const { FileScannerModule } = NativeModules;

export default function InitialScan() {
  const [scanBtnText, setScanBtnText] = useState('Start Files Scan');
  const [scanCompleted, setScanCompleted] = useState(false); // Track scan completion
  const navigation = useNavigation(); // Use navigation
  const [isScanning, setIsScanning] = useState(false);
  const [categoriesFinished, setCategoriesFinished] = useState([]);
  const [progress, setProgress] = useState(0); // Overall progress (0 to 1)
  const [categories, setCategories] = useState({
    text: { totalFiles: 0, duplicates: 0, scanned: 0 },
    pptx: { totalFiles: 0, duplicates: 0, scanned: 0 },
    documents: { totalFiles: 0, duplicates: 0, scanned: 0 },
    excel: { totalFiles: 0, duplicates: 0, scanned: 0 },
    audio: { totalFiles: 0, duplicates: 0, scanned: 0 },
    pdfs: { totalFiles: 0, duplicates: 0, scanned: 0 },
    image: { totalFiles: 0, duplicates: 0, scanned: 0 },
    video: { totalFiles: 0, duplicates: 0, scanned: 0 },
  });
  const checkFirstLaunch = async () => {
    const isFirstLaunch = await AsyncStorage.getItem('isFirstLaunch');
    if (isFirstLaunch === null) {
      await AsyncStorage.setItem('isFirstLaunch', 'true');
      console.log('First Launch: True');
      return true;
    }
    if (isFirstLaunch === 'true') {
      console.log('Initial Scan Remaining: True');
      return true;
    }
    if (isFirstLaunch === 'false') {
      return false;
    }
  };
  const startScan = async () => {
    console.log('IN startScan')
    setIsScanning(true);
    // const isFirstLaunch = await checkFirstLaunch();
    // if (isFirstLaunch) {
      const results = await performInitialScan();
      console.log("Initial scan completed:", results);
      insertInitialScanResults(results);
      // Update button to "Results"
      setScanBtnText("Results");
      setScanCompleted(true);
      await AsyncStorage.setItem('isFirstLaunch', 'false');
    // }
    setIsScanning(false);
  };
  useEffect(() => {
    // Check if the scan was completed in the past and update UI accordingly
    checkFirstLaunch().then((isFirstLaunch) => {
      if (!isFirstLaunch) {
        setScanBtnText("Results");
        setScanCompleted(true);
      }
    });
  }, []);
  const handleButtonPress = () => {
    if (scanCompleted) {
      // Navigate to Results screen if scan is completed
      navigation.navigate("Results");
    } else {
      startScan();
    }
  };
  const fileCategories = {
    text: ['.txt'],
    pptx: ['.ppt', '.pptx'],
    documents: ['.docx', '.doc'],
    excel: ['.xlsx', '.xls', '.csv'],
    audio: ['.mp3', '.wav'],
    image: ['.jpg', '.png', '.jpeg'],
    pdfs: ['.pdf'],
    video: ['.mp4', '.mkv'],
  };

  const insertHashIntoDatabase = (filePath, hash, fileType, fileName, fileSizeKB) => {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'INSERT INTO Files_Record (file_name, file_type, file_path, file_size, file_hash) VALUES (?, ?, ?, ?, ?)',
          [fileName, fileType, filePath, fileSizeKB, hash],
          (tx, results) => {
            resolve(results.insertId); // Return the ID of the inserted record
          },
          (error) => reject(error)
        );
      });
    });
  };
  const insertHashIntoDuplicates = (original_fid, duplicate_fid, similarity_score) => {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'INSERT INTO Duplicates_Record (original_fid, duplicate_fid, similarity_score) VALUES (?, ?, ?)',
          [original_fid, duplicate_fid, similarity_score],
          () => resolve(),
          (error) => reject(error)
        );
      });
    });
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
          (error) => reject(error)
        );
      });
    });
  };
  const fetchHashesFromDatabase = (filetype) => {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'SELECT file_hash FROM Files_Record WHERE file_type = ?',
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
  const getFileExtension = filePath => {
    return filePath.split('.').pop().toLowerCase();
  };
  const processFilesInCategory = async (filetype, files, extensions, threshold) => {
    console.log('In processFilesInCategory: ' + filetype);
    const category = filetype;
    const hashes = [];
    const duplicates = [];
    for (const file of files) {
      try { 
        // Get file metadata (size, name)
        const fileInfo = await RNFS.stat(file);
        const fileSizeKB = (fileInfo.size / 1024).toFixed(2); // Convert to KB
        const fileName = file.split('/').pop(); // Extract file name
        const extension = await getFileExtension(file);
        console.log(fileName);
        // Compute SSDeep hash
        const hash = await SSDeepTurboModule.hashFile(file);
        console.log(hash)
        // Fetch existing hashes for this category
        const existingHashes = await fetchHashesFromDatabase(extension);
        // Compare the hash with existing hashes
        const results = await SSDeepTurboModule.compareHashWithArray(hash, existingHashes, threshold);
        if (results.length > 0) {
          // Duplicate(s) found
          for (const result of results) {
            const originalFileHash = result.hash; // Hash of the original file
            const similarityScore = result.similarity; // Similarity score
            // Fetch the original file's ID from the database
            const originalFileId = await fetchFileIdByHash(originalFileHash);
            // Insert the duplicate file into Files_Record
            const duplicateFileId = await insertHashIntoDatabase(file, hash, extension, fileName, fileSizeKB);
            // Insert the duplicate relationship into Duplicates_Record
            await insertHashIntoDuplicates(originalFileId, duplicateFileId, similarityScore);
            duplicates.push({ file, similarity: similarityScore });
          }
        } else {
          // No duplicates found, insert into Files_Record
          await insertHashIntoDatabase(file, hash, extension, fileName, fileSizeKB);
        }
        hashes.push({ file, hash });
        setCategories((prev) => ({
          ...prev,
          [category]: {
            totalFiles: files.length,
            scanned: prev[category].scanned + 1
          },
        }));
      } catch (error) {
        console.warn(`Error processing file: ${file}, ${error.message}`);
      }
    }
    return { hashes, duplicates };
  };

  const performInitialScan = async () => {
    const results = {};
    const storedThreshold = await AsyncStorage.getItem('similarityThreshold');
    const threshold = Number(storedThreshold);
    for (const [category, extensions] of Object.entries(fileCategories)) {
      const categoryFiles = await FileScannerModule.scanFilesByCategory(category);
      const files = JSON.parse(categoryFiles);
      console.log(files);
      const { hashes, duplicates } = await processFilesInCategory(category, files, extensions, threshold);
      console.log('processFilesInCategory done for:' + extensions)
      results[category] = {
        totalFiles: files.length,
        duplicates: duplicates.length,
        duplicateFiles: duplicates, // Store duplicates 
        files: hashes,
      };
      console.log(results)
      // Update UI with progress
      
      await updateProgress(category, files.length, duplicates.length, duplicates);
    }
    return results;
  };
  const updateProgress = (category, totalFilesCount, duplicates, duplicateFiles) => {
    categoriesFinished.push(category);
    console.log("Categories Finished Length: " + categoriesFinished.length)
    setCategories((prev) => ({
      ...prev,
      [category]: {
        totalFiles: totalFilesCount,
        duplicates,
        scanned: totalFilesCount,
        duplicateFiles, // Store duplicate file paths and similarity
      },
    }));
    const progressValue = categoriesFinished.length / Object.keys(fileCategories).length;
    setProgress(progressValue);
  };
  const insertInitialScanResults = (scanData) => {
    db.transaction(tx => {
      Object.keys(scanData).forEach(fileType => {
        const { totalFiles, duplicates } = scanData[fileType];

        tx.executeSql(
          `INSERT OR REPLACE INTO Initial_Scan_Results (file_type, total_files, duplicate_files) 
        VALUES (?, ?, ?)`,
          [fileType, totalFiles, duplicates],
          () => console.log(`✅ Data inserted for ${fileType}`),
          (_, error) => console.error(`Error inserting data for ${fileType}:`, error)
        );
      });
    });
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScanProgressUI progress={progress} categories={categories} />
      <Button
        title={isScanning ? "Scanning..." : scanBtnText}
        onPress={handleButtonPress}
        disabled={isScanning}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});