import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { LocalDataError } from './local-crypto';
import { createNativeRecordStore } from './native-record-store';

// Load the native module only when a phone opens training data. The Expo web
// starter is not the website and must not silently use an unqualified SQL backend.
export const nativeRecords = createNativeRecordStore({
  legacy: AsyncStorage,
  open: async () => {
    if (Platform.OS === 'web') throw new LocalDataError('key-unavailable', 'Use the Movefield website in your browser. This starter saves encrypted training on iPhone and Android.');
    const SQLite = await import('expo-sqlite');
    return SQLite.openDatabaseAsync('movefield-encrypted-records-v1.db');
  },
});
