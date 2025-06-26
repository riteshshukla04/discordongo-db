import { applyUpdate, validateUpdate } from '../../utils/updates';
import { DBDocument } from '../../types';

describe('Update Utils', () => {
  const sampleDocument: DBDocument = {
    _id: '1',
    name: 'John',
    age: 30,
    role: 'user',
    tags: ['active', 'premium'],
    profile: {
      email: 'john@example.com',
      phone: '123-456-7890'
    },
    score: 85
  };

  describe('applyUpdate', () => {
    it('should apply direct object update', () => {
      const update = { name: 'Jane', age: 25 };
      const result = applyUpdate(sampleDocument, update);
      
      expect(result.name).toBe('Jane');
      expect(result.age).toBe(25);
      expect(result.role).toBe('user'); // unchanged
      expect(result._id).toBe('1'); // unchanged
    });

    it('should apply $set operator', () => {
      const update = { $set: { name: 'Jane', age: 25 } };
      const result = applyUpdate(sampleDocument, update);
      
      expect(result.name).toBe('Jane');
      expect(result.age).toBe(25);
      expect(result.role).toBe('user'); // unchanged
    });

    it('should apply $set with nested fields', () => {
      const freshDoc = { ...sampleDocument, profile: { ...sampleDocument.profile } };
      const update = { $set: { 'profile.email': 'jane@example.com' } };
      const result = applyUpdate(freshDoc, update);
      
      expect(result.profile.email).toBe('jane@example.com');
      expect(result.profile.phone).toBe('123-456-7890'); // unchanged
    });

    it('should apply $unset operator', () => {
      const update = { $unset: { role: 1 } };
      const result = applyUpdate(sampleDocument, update);
      
      expect(result.role).toBeUndefined();
      expect(result.name).toBe('John'); // unchanged
    });

    it('should apply $unset with nested fields', () => {
      const freshDoc = { ...sampleDocument, profile: { ...sampleDocument.profile } };
      const update = { $unset: { 'profile.phone': 1 } };
      const result = applyUpdate(freshDoc, update);
      
      expect(result.profile.phone).toBeUndefined();
      expect(result.profile.email).toBe('john@example.com'); // unchanged
    });

    it('should apply $inc operator', () => {
      const update = { $inc: { age: 5, score: -10 } };
      const result = applyUpdate(sampleDocument, update);
      
      expect(result.age).toBe(35);
      expect(result.score).toBe(75);
      expect(result.name).toBe('John'); // unchanged
    });

    it('should apply $inc with non-existent field', () => {
      const update = { $inc: { newField: 10 } };
      const result = applyUpdate(sampleDocument, update);
      
      expect(result.newField).toBe(10);
    });

    it('should apply $push operator', () => {
      const update = { $push: { tags: 'new-tag' } };
      const result = applyUpdate(sampleDocument, update);
      
      expect(result.tags).toEqual(['active', 'premium', 'new-tag']);
    });

    it('should apply $push to non-existent field', () => {
      const update = { $push: { newArray: 'item' } };
      const result = applyUpdate(sampleDocument, update);
      
      expect(result.newArray).toEqual(['item']);
    });

    it('should apply $pull operator', () => {
      const update = { $pull: { tags: 'premium' } };
      const result = applyUpdate(sampleDocument, update);
      
      expect(result.tags).toEqual(['active']);
    });

    it('should apply $addToSet operator', () => {
      const update = { $addToSet: { tags: 'new-tag' } };
      const result = applyUpdate(sampleDocument, update);
      
      expect(result.tags).toEqual(['active', 'premium', 'new-tag']);
    });

    it('should not add duplicate with $addToSet', () => {
      const update = { $addToSet: { tags: 'premium' } };
      const result = applyUpdate(sampleDocument, update);
      
      expect(result.tags).toEqual(['active', 'premium']); // no duplicate
    });

    it('should apply $addToSet to non-existent field', () => {
      const update = { $addToSet: { newArray: 'item' } };
      const result = applyUpdate(sampleDocument, update);
      
      expect(result.newArray).toEqual(['item']);
    });

    it('should apply multiple operators', () => {
      const update = {
        $set: { name: 'Jane' },
        $inc: { age: 1 },
        $push: { tags: 'updated' },
        $unset: { role: 1 }
      };
      const result = applyUpdate(sampleDocument, update);
      
      expect(result.name).toBe('Jane');
      expect(result.age).toBe(31);
      expect(result.tags).toEqual(['active', 'premium', 'updated']);
      expect(result.role).toBeUndefined();
    });

    it('should handle complex nested updates', () => {
      const freshDoc = { ...sampleDocument, profile: { ...sampleDocument.profile } };
      const update = {
        $set: {
          'profile.email': 'new@example.com',
          'profile.settings.theme': 'dark'
        }
      };
      const result = applyUpdate(freshDoc, update);
      
      expect(result.profile.email).toBe('new@example.com');
      expect(result.profile.settings.theme).toBe('dark');
      expect(result.profile.phone).toBe('123-456-7890'); // unchanged
    });
  });

  describe('validateUpdate', () => {
    it('should validate valid update object', () => {
      expect(() => validateUpdate({ name: 'John' })).not.toThrow();
      expect(() => validateUpdate({ $set: { name: 'John' } })).not.toThrow();
    });

    it('should throw error for null/undefined update', () => {
      expect(() => validateUpdate(null as any)).toThrow('Update must be an object');
      expect(() => validateUpdate(undefined as any)).toThrow('Update must be an object');
    });

    it('should validate $inc operator with numbers', () => {
      expect(() => validateUpdate({ $inc: { age: 5 } })).not.toThrow();
    });

    it('should throw error for $inc with non-numeric values', () => {
      expect(() => validateUpdate({ $inc: { age: 'five' as any } }))
        .toThrow('$inc operator requires numeric values. Got string for field "age"');
    });

    it('should validate $unset operator', () => {
      expect(() => validateUpdate({ $unset: { field: 1 } })).not.toThrow();
      expect(() => validateUpdate({ $unset: { field: true } })).not.toThrow();
    });

    it('should throw error for invalid $unset values', () => {
      expect(() => validateUpdate({ $unset: { field: 'invalid' as any } }))
        .toThrow('$unset operator requires value 1 or true. Got invalid for field "field"');
    });

    it('should validate complex update operations', () => {
      const update = {
        $set: { name: 'John' },
        $inc: { age: 1, score: -5 },
        $unset: { temp: 1 },
        $push: { tags: 'new' }
      };
      expect(() => validateUpdate(update)).not.toThrow();
    });
  });
}); 