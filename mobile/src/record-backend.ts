import {openDatabaseAsync} from 'expo-sqlite';
import {sqlRecordBackend,type AsyncDatabase} from './shared/sql-records';
import type {RecordBackend} from './shared/record-state';
let backend:Promise<RecordBackend>|null=null;
export function nativeRecordBackend(){return backend??=openDatabaseAsync('movefield-private-records-v1.db').then(db=>sqlRecordBackend(db as unknown as AsyncDatabase)).catch(e=>{backend=null;throw e})}
