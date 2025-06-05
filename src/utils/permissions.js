import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

// Function to request storage permissions
export const requestStoragePermission = async () => {
  const result = await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
  
  if (result === RESULTS.GRANTED) {
    console.log('Storage Permission Granted');
    return true;
  } else {
    console.log('Storage Permission Denied');
    return false;
  }
};
