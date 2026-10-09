import { getRandomBytes } from 'expo-crypto';
import { configureRecordRandom } from './shared/record-identity';

configureRecordRandom(getRandomBytes);
