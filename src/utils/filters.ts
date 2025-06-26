import { Filter, FilterOperators, DBDocument, SortOption, SortDirection } from '../types';

/**
 * Evaluates if a document matches a filter condition
 */
export function matchesFilter(document: DBDocument, filter: Filter): boolean {
  if (!filter || Object.keys(filter).length === 0) {
    return true;
  }

  return Object.entries(filter).every(([key, value]) => {
    // Handle logical operators at document level
    if (key === '$and') {
      return Array.isArray(value) && value.every(subFilter => matchesFilter(document, subFilter as Filter));
    }
    
    if (key === '$or') {
      return Array.isArray(value) && value.some(subFilter => matchesFilter(document, subFilter as Filter));
    }
    
    if (key === '$not') {
      return !matchesFilter(document, value as Filter);
    }
    
    return evaluateFieldFilter(document, key, value);
  });
}

/**
 * Evaluates a single field filter
 */
function evaluateFieldFilter(document: DBDocument, key: string, filterValue: any): boolean {
  const docValue = getNestedValue(document, key);

  // Handle operator objects
  if (filterValue && typeof filterValue === 'object' && !Array.isArray(filterValue) && !(filterValue instanceof Date) && !(filterValue instanceof RegExp)) {
    return evaluateOperators(docValue, filterValue as FilterOperators);
  }

  // Handle direct value comparison
  return compareValues(docValue, filterValue);
}

/**
 * Evaluates filter operators
 */
function evaluateOperators(docValue: any, operators: FilterOperators): boolean {
  return Object.entries(operators).every(([operator, operatorValue]) => {
    switch (operator) {
      case '$eq':
        return compareValues(docValue, operatorValue);
      
      case '$ne':
        return !compareValues(docValue, operatorValue);
      
      case '$gt':
        return docValue > operatorValue;
      
      case '$gte':
        return docValue >= operatorValue;
      
      case '$lt':
        return docValue < operatorValue;
      
      case '$lte':
        return docValue <= operatorValue;
      
      case '$in':
        return Array.isArray(operatorValue) && operatorValue.some(val => compareValues(docValue, val));
      
      case '$nin':
        return Array.isArray(operatorValue) && !operatorValue.some(val => compareValues(docValue, val));
      
      case '$exists':
        return operatorValue ? docValue !== undefined : docValue === undefined;
      
      case '$regex':
        const regex = operatorValue instanceof RegExp ? operatorValue : new RegExp(operatorValue, operators.$options);
        return regex.test(String(docValue));
      
      case '$and':
        // $and should be handled at the document level, not field level
        return true;
      
      case '$or':
        // $or should be handled at the document level, not field level  
        return true;
      
      case '$not':
        return !matchesFilter({ docValue }, operatorValue);
      
      default:
        return true;
    }
  });
}

/**
 * Compares two values for equality
 */
function compareValues(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  
  if (b instanceof RegExp) {
    return b.test(String(a));
  }
  
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => compareValues(item, b[index]));
  }
  
  if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    return aKeys.length === bKeys.length && aKeys.every(key => compareValues(a[key], b[key]));
  }
  
  return false;
}

/**
 * Gets nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Sorts documents based on sort options
 */
export function sortDocuments(documents: DBDocument[], sortOption?: SortOption): DBDocument[] {
  if (!sortOption || Object.keys(sortOption).length === 0) {
    return documents;
  }

  return [...documents].sort((a, b) => {
    for (const [field, direction] of Object.entries(sortOption)) {
      const aValue = getNestedValue(a, field);
      const bValue = getNestedValue(b, field);
      
      const comparison = compareForSort(aValue, bValue);
      if (comparison !== 0) {
        const sortDir = normalizeSortDirection(direction);
        return comparison * sortDir;
      }
    }
    return 0;
  });
}

/**
 * Compares two values for sorting
 */
function compareForSort(a: any, b: any): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return -1;
  if (b === null || b === undefined) return 1;
  
  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b);
  }
  
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }
  
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  
  return String(a).localeCompare(String(b));
}

/**
 * Normalizes sort direction to 1 or -1
 */
function normalizeSortDirection(direction: SortDirection): number {
  if (direction === 1 || direction === 'asc') return 1;
  if (direction === -1 || direction === 'desc') return -1;
  return 1;
}

/**
 * Applies projection to documents
 */
export function applyProjection(documents: DBDocument[], projection?: { [key: string]: 1 | 0 }): DBDocument[] {
  if (!projection || Object.keys(projection).length === 0) {
    return documents;
  }

  const isInclusive = Object.values(projection).some(val => val === 1);
  
  return documents.map(doc => {
    if (isInclusive) {
      const projected: DBDocument = {};
      Object.entries(projection).forEach(([key, include]) => {
        if (include === 1) {
          projected[key] = getNestedValue(doc, key);
        }
      });
      // Always include _id unless explicitly excluded
      if (projection._id !== 0) {
        projected._id = doc._id;
      }
      return projected;
    } else {
      const projected = { ...doc };
      Object.entries(projection).forEach(([key, exclude]) => {
        if (exclude === 0) {
          delete projected[key];
        }
      });
      return projected;
    }
  });
}

/**
 * Applies pagination to documents
 */
export function applyPagination(documents: DBDocument[], skip = 0, limit?: number): DBDocument[] {
  let result = documents.slice(skip);
  if (limit !== undefined) {
    result = result.slice(0, limit);
  }
  return result;
} 