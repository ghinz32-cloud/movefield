import {openDatabaseAsync} from 'expo-sqlite';
import {nativeStorageKey} from './shared/brand';
import {sqlRecordBackend,type AsyncDatabase} from './shared/sql-records';
import type {RecordBackend} from './shared/record-state';
let backend:Promise<RecordBackend>|null=null;
export function nativeRecordBackend(){return backend??=openDatabaseAsync(nativeStorageKey('movefield-private-records-v1.db').replace(/:/g,'-')).then(db=>sqlRecordBackend(db as unknown as AsyncDatabase)).catch(e=>{backend=null;throw e})}
