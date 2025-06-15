/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import notifee, { EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// REQUIRED: Register background handler
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { pressAction, notification } = detail;

  if (type === EventType.ACTION_PRESS && pressAction?.id === 'view') {
    // Store data somewhere (like AsyncStorage) to pick up in your app after launch
    await AsyncStorage.setItem('notificationData', JSON.stringify(notification?.data));
  }
});

AppRegistry.registerComponent(appName, () => App);
