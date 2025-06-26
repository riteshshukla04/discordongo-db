import { matchesFilter, sortDocuments, applyProjection, applyPagination } from '../../utils/filters';
import { DBDocument } from '../../types';

describe('Filter Utils', () => {
  const sampleDocuments: DBDocument[] = [
    { _id: '1', name: 'John', age: 30, role: 'admin', tags: ['user', 'active'], score: 85 },
    { _id: '2', name: 'Jane', age: 25, role: 'user', tags: ['user'], score: 92 },
    { _id: '3', name: 'Bob', age: 35, role: 'user', tags: ['user', 'premium'], score: 78 },
    { _id: '4', name: 'Alice', age: 28, role: 'moderator', tags: ['moderator', 'active'], score: 88 },
    { _id: '5', name: 'Charlie', age: 22, role: 'user', tags: ['user', 'new'], score: 95 }
  ];

  describe('matchesFilter', () => {
    it('should match all documents with empty filter', () => {
      const results = sampleDocuments.filter(doc => matchesFilter(doc, {}));
      expect(results).toHaveLength(5);
    });

    it('should match documents with simple equality', () => {
      const results = sampleDocuments.filter(doc => matchesFilter(doc, { role: 'user' }));
      expect(results).toHaveLength(3);
      expect(results.every(doc => doc.role === 'user')).toBe(true);
    });

    it('should match documents with $eq operator', () => {
      const results = sampleDocuments.filter(doc => matchesFilter(doc, { age: { $eq: 30 } }));
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('John');
    });

    it('should match documents with $ne operator', () => {
      const results = sampleDocuments.filter(doc => matchesFilter(doc, { role: { $ne: 'user' } }));
      expect(results).toHaveLength(2);
      expect(results.every(doc => doc.role !== 'user')).toBe(true);
    });

    it('should match documents with $gt operator', () => {
      const results = sampleDocuments.filter(doc => matchesFilter(doc, { age: { $gt: 28 } }));
      expect(results).toHaveLength(2);
      expect(results.every(doc => doc.age > 28)).toBe(true);
    });

    it('should match documents with $gte operator', () => {
      const results = sampleDocuments.filter(doc => matchesFilter(doc, { age: { $gte: 28 } }));
      expect(results).toHaveLength(3);
      expect(results.every(doc => doc.age >= 28)).toBe(true);
    });

    it('should match documents with $lt operator', () => {
      const results = sampleDocuments.filter(doc => matchesFilter(doc, { age: { $lt: 28 } }));
      expect(results).toHaveLength(2);
      expect(results.every(doc => doc.age < 28)).toBe(true);
    });

    it('should match documents with $lte operator', () => {
      const results = sampleDocuments.filter(doc => matchesFilter(doc, { age: { $lte: 28 } }));
      expect(results).toHaveLength(3);
      expect(results.every(doc => doc.age <= 28)).toBe(true);
    });

    it('should match documents with $in operator', () => {
      const results = sampleDocuments.filter(doc => matchesFilter(doc, { role: { $in: ['admin', 'moderator'] } }));
      expect(results).toHaveLength(2);
      expect(results.every(doc => ['admin', 'moderator'].includes(doc.role))).toBe(true);
    });

    it('should match documents with $nin operator', () => {
      const results = sampleDocuments.filter(doc => matchesFilter(doc, { role: { $nin: ['admin', 'moderator'] } }));
      expect(results).toHaveLength(3);
      expect(results.every(doc => !['admin', 'moderator'].includes(doc.role))).toBe(true);
    });

    it('should match documents with $exists operator', () => {
      const results = sampleDocuments.filter(doc => matchesFilter(doc, { score: { $exists: true } }));
      expect(results).toHaveLength(5);
    });

    it('should match documents with $regex operator', () => {
      const results = sampleDocuments.filter(doc => matchesFilter(doc, { name: { $regex: /^J/ } }));
      expect(results).toHaveLength(2);
      expect(results.every(doc => doc.name.startsWith('J'))).toBe(true);
    });

    it('should match documents with $and operator', () => {
      const results = sampleDocuments.filter(doc => matchesFilter(doc, {
        $and: [
          { age: { $gte: 25 } },
          { role: 'user' }
        ]
      } as any));
      expect(results).toHaveLength(2);
    });

    it('should match documents with $or operator', () => {
      const results = sampleDocuments.filter(doc => matchesFilter(doc, {
        $or: [
          { role: 'admin' },
          { age: { $lt: 25 } }
        ]
      } as any));
      expect(results).toHaveLength(2);
    });

    it('should match documents with complex nested conditions', () => {
      const results = sampleDocuments.filter(doc => matchesFilter(doc, {
        $and: [
          { age: { $gte: 25, $lte: 35 } },
          { $or: [{ role: 'admin' }, { score: { $gt: 90 } }] }
        ]
      } as any));
      expect(results).toHaveLength(2);
    });
  });

  describe('sortDocuments', () => {
    it('should return documents as-is with no sort option', () => {
      const sorted = sortDocuments(sampleDocuments);
      expect(sorted).toEqual(sampleDocuments);
    });

    it('should sort documents by age ascending', () => {
      const sorted = sortDocuments(sampleDocuments, { age: 1 });
      expect(sorted.map(doc => doc.age)).toEqual([22, 25, 28, 30, 35]);
    });

    it('should sort documents by age descending', () => {
      const sorted = sortDocuments(sampleDocuments, { age: -1 });
      expect(sorted.map(doc => doc.age)).toEqual([35, 30, 28, 25, 22]);
    });

    it('should sort documents by name ascending', () => {
      const sorted = sortDocuments(sampleDocuments, { name: 'asc' });
      expect(sorted.map(doc => doc.name)).toEqual(['Alice', 'Bob', 'Charlie', 'Jane', 'John']);
    });

    it('should sort documents by name descending', () => {
      const sorted = sortDocuments(sampleDocuments, { name: 'desc' });
      expect(sorted.map(doc => doc.name)).toEqual(['John', 'Jane', 'Charlie', 'Bob', 'Alice']);
    });

    it('should sort documents by multiple fields', () => {
      const sorted = sortDocuments(sampleDocuments, { role: 1, age: -1 });
      expect(sorted.map(doc => doc.name)).toEqual(['John', 'Alice', 'Bob', 'Jane', 'Charlie']);
    });
  });

  describe('applyProjection', () => {
    it('should return documents as-is with no projection', () => {
      const projected = applyProjection(sampleDocuments);
      expect(projected).toEqual(sampleDocuments);
    });

    it('should include only specified fields with inclusive projection', () => {
      const projected = applyProjection(sampleDocuments, { name: 1, age: 1 });
      projected.forEach(doc => {
        expect(Object.keys(doc)).toEqual(['name', 'age', '_id']);
      });
    });

    it('should exclude specified fields with exclusive projection', () => {
      const projected = applyProjection(sampleDocuments, { tags: 0, score: 0 });
      projected.forEach(doc => {
        expect(doc.tags).toBeUndefined();
        expect(doc.score).toBeUndefined();
        expect(doc.name).toBeDefined();
        expect(doc.age).toBeDefined();
      });
    });

    it('should exclude _id when explicitly set to 0', () => {
      const projected = applyProjection(sampleDocuments, { name: 1, _id: 0 });
      projected.forEach(doc => {
        expect(Object.keys(doc)).toEqual(['name']);
      });
    });
  });

  describe('applyPagination', () => {
    it('should return all documents with no pagination', () => {
      const paginated = applyPagination(sampleDocuments);
      expect(paginated).toEqual(sampleDocuments);
    });

    it('should skip documents with skip parameter', () => {
      const paginated = applyPagination(sampleDocuments, 2);
      expect(paginated).toHaveLength(3);
      expect(paginated[0]._id).toBe('3');
    });

    it('should limit documents with limit parameter', () => {
      const paginated = applyPagination(sampleDocuments, 0, 3);
      expect(paginated).toHaveLength(3);
      expect(paginated.map(doc => doc._id)).toEqual(['1', '2', '3']);
    });

    it('should apply both skip and limit', () => {
      const paginated = applyPagination(sampleDocuments, 1, 2);
      expect(paginated).toHaveLength(2);
      expect(paginated.map(doc => doc._id)).toEqual(['2', '3']);
    });
  });
}); 