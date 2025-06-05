import RNFS from 'react-native-fs';

// Function to scan files from a specific directory
export const scanFiles = async (path) => {
  try {
    const files = await RNFS.readDir(path); // Get all files in the directory
    return files;
  } catch (error) {
    console.error("Error scanning files: ", error);
    return [];
  }
};
