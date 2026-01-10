import type { Opportunity } from '../types';

/**
 * Safe rule evaluation engine
 * Replaces dangerous new Function() approach with declarative rules
 */

/**
 * Valid types for rule values
 * Supports primitives, arrays, and special match values
 */
export type RuleValue = string | number | boolean | null | undefined | string[] | number[];

/**
 * Supported operator names
 */
export type OperatorName =
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'includes'
  | 'in'
  | 'exists'
  | 'notExists';

/**
 * Generic operator function type
 * Uses unknown for flexibility since operators handle runtime type checking
 */
type OperatorFn = (a: unknown, b?: unknown) => boolean;

// Predefined safe operators with proper typing
const SAFE_OPERATORS: Record<OperatorName, OperatorFn> = {
  equals: (a, b) => a === b,
  notEquals: (a, b) => a !== b,
  greaterThan: (a, b) => typeof a === 'number' && typeof b === 'number' && a > b,
  lessThan: (a, b) => typeof a === 'number' && typeof b === 'number' && a < b,
  greaterThanOrEqual: (a, b) => typeof a === 'number' && typeof b === 'number' && a >= b,
  lessThanOrEqual: (a, b) => typeof a === 'number' && typeof b === 'number' && a <= b,
  includes: (arr, val) => Array.isArray(arr) && arr.includes(val),
  in: (val, arr) => Array.isArray(arr) && arr.includes(val),
  exists: (a) => a !== undefined && a !== null,
  notExists: (a) => a === undefined || a === null,
};

export interface ConditionRule {
  field: keyof Opportunity;
  operator: OperatorName;
  value: RuleValue;
}

export interface CompoundCondition {
  all?: ConditionRule[];
  any?: ConditionRule[];
}

/**
 * Parse legacy string conditions to safe rule objects
 * Examples:
 *   "opp.raiseLevel === 'L1'" -> { field: 'raiseLevel', operator: 'equals', value: 'L1' }
 *   "opp.tcv > 1000000" -> { field: 'tcv', operator: 'greaterThan', value: 1000000 }
 */
export function parseLegacyCondition(condition: string, silent = false): CompoundCondition | null {
  if (!condition || condition.trim() === '') return null;

  // Handle literal 'false' - always false condition (used to disable checkpoints)
  if (condition.trim() === 'false') {
    return { all: [{ field: 'id' as keyof Opportunity, operator: 'equals', value: '__NEVER_MATCH__' }] };
  }

  // Remove 'opp.' prefix
  const cleaned = condition.replace(/opp\./g, '');

  // Simple pattern matching for common conditions
  // This is a migration helper - new conditions should use rule objects directly

  // Pattern: field === 'value'
  const equalsMatch = cleaned.match(/^(\w+)\s*===\s*["'](.+?)["']$/);
  if (equalsMatch) {
    return {
      all: [{
        field: equalsMatch[1] as keyof Opportunity,
        operator: 'equals',
        value: equalsMatch[2]
      }]
    };
  }

  // Pattern: field !== 'value' or field != 'value' (notEquals with string)
  const notEqualsStrMatch = cleaned.match(/^(\w+)\s*!==?\s*["'](.+?)["']$/);
  if (notEqualsStrMatch) {
    return {
      all: [{
        field: notEqualsStrMatch[1] as keyof Opportunity,
        operator: 'notEquals',
        value: notEqualsStrMatch[2]
      }]
    };
  }

  // Pattern: field !== undefined (exists check)
  const existsMatch = cleaned.match(/^(\w+)\s*!==\s*undefined$/);
  if (existsMatch) {
    return {
      all: [{
        field: existsMatch[1] as keyof Opportunity,
        operator: 'exists',
        value: true
      }]
    };
  }

  // Pattern: field === undefined (not exists check)
  const notExistsMatch = cleaned.match(/^(\w+)\s*===\s*undefined$/);
  if (notExistsMatch) {
    return {
      all: [{
        field: notExistsMatch[1] as keyof Opportunity,
        operator: 'notExists',
        value: true
      }]
    };
  }

  // Pattern: field === true/false
  const boolMatch = cleaned.match(/^(\w+)\s*===\s*(true|false)$/);
  if (boolMatch) {
    return {
      all: [{
        field: boolMatch[1] as keyof Opportunity,
        operator: 'equals',
        value: boolMatch[2] === 'true'
      }]
    };
  }

  // Pattern: field !== true/false (notEquals with boolean)
  const notEqualsBoolMatch = cleaned.match(/^(\w+)\s*!==?\s*(true|false)$/);
  if (notEqualsBoolMatch) {
    return {
      all: [{
        field: notEqualsBoolMatch[1] as keyof Opportunity,
        operator: 'notEquals',
        value: notEqualsBoolMatch[2] === 'true'
      }]
    };
  }

  // Pattern: field > number
  const gtMatch = cleaned.match(/^(\w+)\s*>\s*(\d+)$/);
  if (gtMatch) {
    return {
      all: [{
        field: gtMatch[1] as keyof Opportunity,
        operator: 'greaterThan',
        value: parseInt(gtMatch[2], 10)
      }]
    };
  }

  // Pattern: field >= number
  const gteMatch = cleaned.match(/^(\w+)\s*>=\s*(\d+)$/);
  if (gteMatch) {
    return {
      all: [{
        field: gteMatch[1] as keyof Opportunity,
        operator: 'greaterThanOrEqual',
        value: parseInt(gteMatch[2], 10)
      }]
    };
  }

  // Pattern: field < number
  const ltMatch = cleaned.match(/^(\w+)\s*<\s*(\d+)$/);
  if (ltMatch) {
    return {
      all: [{
        field: ltMatch[1] as keyof Opportunity,
        operator: 'lessThan',
        value: parseInt(ltMatch[2], 10)
      }]
    };
  }

  // Pattern: field <= number
  const lteMatch = cleaned.match(/^(\w+)\s*<=\s*(\d+)$/);
  if (lteMatch) {
    return {
      all: [{
        field: lteMatch[1] as keyof Opportunity,
        operator: 'lessThanOrEqual',
        value: parseInt(lteMatch[2], 10)
      }]
    };
  }

  // Pattern: field1 === 'val1' && field2 === 'val2' && field3 === 'val3' (with or without parentheses)
  // Handle compound AND conditions with multiple clauses
  if (cleaned.includes('&&')) {
    // Remove outer parentheses if present
    const withoutParens = cleaned.replace(/^\((.+)\)$/, '$1');
    // Split by && and parse each part
    const parts = withoutParens.split('&&').map(p => p.trim());
    const conditions: ConditionRule[] = [];

    for (const part of parts) {
      // Use silent=true for recursive parsing to avoid warning spam
      const parsed = parseLegacyCondition(part, true);
      if (parsed?.all) {
        conditions.push(...parsed.all);
      }
    }

    if (conditions.length > 0) {
      return {
        all: conditions
      };
    }
  }

  // Pattern: field1 === 'val1' || field2 === 'val2' || field3 === 'val3' (with or without parentheses)
  // Handle compound OR conditions with multiple clauses
  if (cleaned.includes('||')) {
    // Remove outer parentheses if present
    const withoutParens = cleaned.replace(/^\((.+)\)$/, '$1');
    // Split by || and parse each part
    const parts = withoutParens.split('||').map(p => p.trim());
    const conditions: ConditionRule[] = [];

    for (const part of parts) {
      // Use silent=true for recursive parsing to avoid warning spam
      const parsed = parseLegacyCondition(part, true);
      if (parsed?.all) {
        conditions.push(...parsed.all);
      }
    }

    if (conditions.length > 0) {
      return {
        any: conditions
      };
    }
  }

  if (!silent) {
    console.warn('Could not parse legacy condition:', condition);
  }
  return null;
}

/**
 * Evaluate a condition safely
 */
export function evaluateCondition(
  condition: string | CompoundCondition | null | undefined,
  opp: Opportunity
): boolean {
  if (!condition) return true;

  let rules: CompoundCondition;

  // Parse legacy string conditions
  if (typeof condition === 'string') {
    const parsed = parseLegacyCondition(condition);
    if (!parsed) return false;
    rules = parsed;
  } else {
    rules = condition;
  }

  // Evaluate 'all' conditions (AND)
  if (rules.all) {
    return rules.all.every(rule => {
      const fieldValue = opp[rule.field];
      const operator = SAFE_OPERATORS[rule.operator];
      if (!operator) {
        console.error('Unknown operator:', rule.operator);
        return false;
      }
      return operator(fieldValue, rule.value);
    });
  }

  // Evaluate 'any' conditions (OR)
  if (rules.any) {
    return rules.any.some(rule => {
      const fieldValue = opp[rule.field];
      const operator = SAFE_OPERATORS[rule.operator];
      if (!operator) {
        console.error('Unknown operator:', rule.operator);
        return false;
      }
      return operator(fieldValue, rule.value);
    });
  }

  return true;
}
