import { UpdateFilter, UpdateOperators, DBDocument } from '../types';

/**
 * Applies update operations to a document
 */
export function applyUpdate(document: DBDocument, update: UpdateFilter): DBDocument {
  const updatedDoc = { ...document };

  // If update is a direct object (not using operators), use $set behavior
  if (!isUpdateOperators(update)) {
    return { ...updatedDoc, ...update };
  }

  const operators = update as UpdateOperators;

  // Apply $set operations
  if (operators.$set) {
    Object.entries(operators.$set).forEach(([key, value]) => {
      setNestedValue(updatedDoc, key, value);
    });
  }

  // Apply $unset operations
  if (operators.$unset) {
    Object.keys(operators.$unset).forEach(key => {
      unsetNestedValue(updatedDoc, key);
    });
  }

  // Apply $inc operations
  if (operators.$inc) {
    Object.entries(operators.$inc).forEach(([key, increment]) => {
      const currentValue = getNestedValue(updatedDoc, key) || 0;
      if (typeof currentValue === 'number' && typeof increment === 'number') {
        setNestedValue(updatedDoc, key, currentValue + increment);
      }
    });
  }

  // Apply $push operations
  if (operators.$push) {
    Object.entries(operators.$push).forEach(([key, value]) => {
      const currentValue = getNestedValue(updatedDoc, key);
      if (Array.isArray(currentValue)) {
        setNestedValue(updatedDoc, key, [...currentValue, value]);
      } else {
        setNestedValue(updatedDoc, key, [value]);
      }
    });
  }

  // Apply $pull operations
  if (operators.$pull) {
    Object.entries(operators.$pull).forEach(([key, value]) => {
      const currentValue = getNestedValue(updatedDoc, key);
      if (Array.isArray(currentValue)) {
        const filteredArray = currentValue.filter(item => !deepEqual(item, value));
        setNestedValue(updatedDoc, key, filteredArray);
      }
    });
  }

  // Apply $addToSet operations
  if (operators.$addToSet) {
    Object.entries(operators.$addToSet).forEach(([key, value]) => {
      const currentValue = getNestedValue(updatedDoc, key);
      if (Array.isArray(currentValue)) {
        const exists = currentValue.some(item => deepEqual(item, value));
        if (!exists) {
          setNestedValue(updatedDoc, key, [...currentValue, value]);
        }
      } else {
        setNestedValue(updatedDoc, key, [value]);
      }
    });
  }

  return updatedDoc;
}

/**
 * Checks if the update object uses update operators
 */
function isUpdateOperators(update: UpdateFilter): update is UpdateOperators {
  if (typeof update !== 'object' || update === null) {
    return false;
  }

  const keys = Object.keys(update);
  return keys.some(key => key.startsWith('$'));
}

/**
 * Sets a nested value in an object using dot notation
 */
function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}

/**
 * Removes a nested value from an object using dot notation
 */
function unsetNestedValue(obj: any, path: string): void {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      return; // Path doesn't exist
    }
    current = current[key];
  }

  delete current[keys[keys.length - 1]];
}

/**
 * Gets a nested value from an object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Deep equality comparison
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => deepEqual(item, b[index]));
  }
  
  if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    return aKeys.length === bKeys.length && aKeys.every(key => deepEqual(a[key], b[key]));
  }
  
  return false;
}

/**
 * Validates update operations
 */
export function validateUpdate(update: UpdateFilter): void {
  if (!update || typeof update !== 'object') {
    throw new Error('Update must be an object');
  }

  if (isUpdateOperators(update)) {
    const operators = update as UpdateOperators;
    
    // Validate $inc values are numbers
    if (operators.$inc) {
      Object.entries(operators.$inc).forEach(([key, value]) => {
        if (typeof value !== 'number') {
          throw new Error(`$inc operator requires numeric values. Got ${typeof value} for field "${key}"`);
        }
      });
    }

    // Validate $unset values
    if (operators.$unset) {
      Object.entries(operators.$unset).forEach(([key, value]) => {
        if (value !== 1 && value !== true) {
          throw new Error(`$unset operator requires value 1 or true. Got ${value} for field "${key}"`);
        }
      });
    }
  }
} 