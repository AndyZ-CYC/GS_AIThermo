#!/usr/bin/env node
import { initDatabase } from '../models/schema.js';

console.log('Running database migration...');
initDatabase();
console.log('Migration completed!');
