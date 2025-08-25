"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const conditions_1 = require("./conditions");
const rules_1 = require("./rules");
const types_1 = require("./types");
(0, vitest_1.describe)('conditions', () => {
    (0, vitest_1.describe)('logical conditions', () => {
        (0, vitest_1.describe)('and', () => {
            (0, vitest_1.it)('should create AND condition with multiple conditions', () => {
                const condition = (0, conditions_1.and)((0, conditions_1.eq)('$.name', 'John'), (0, conditions_1.gt)('$.age', 18));
                (0, vitest_1.expect)(condition).toEqual({
                    type: types_1.ConditionType.AND,
                    conditions: [
                        {
                            type: types_1.ConditionType.EQUALS,
                            path: '$.name',
                            value: 'John'
                        },
                        {
                            type: types_1.ConditionType.GREATHER_THAN,
                            path: '$.age',
                            value: 18
                        }
                    ]
                });
            });
            (0, vitest_1.it)('should create AND condition with single condition', () => {
                const condition = (0, conditions_1.and)((0, conditions_1.eq)('$.status', 'active'));
                (0, vitest_1.expect)(condition).toEqual({
                    type: types_1.ConditionType.AND,
                    conditions: [
                        {
                            type: types_1.ConditionType.EQUALS,
                            path: '$.status',
                            value: 'active'
                        }
                    ]
                });
            });
            (0, vitest_1.it)('should create nested AND condition', () => {
                const condition = (0, conditions_1.and)((0, conditions_1.eq)('$.type', 'user'), (0, conditions_1.or)((0, conditions_1.eq)('$.role', 'admin'), (0, conditions_1.eq)('$.role', 'moderator')));
                (0, vitest_1.expect)(condition).toEqual({
                    type: types_1.ConditionType.AND,
                    conditions: [
                        {
                            type: types_1.ConditionType.EQUALS,
                            path: '$.type',
                            value: 'user'
                        },
                        {
                            type: types_1.ConditionType.OR,
                            conditions: [
                                {
                                    type: types_1.ConditionType.EQUALS,
                                    path: '$.role',
                                    value: 'admin'
                                },
                                {
                                    type: types_1.ConditionType.EQUALS,
                                    path: '$.role',
                                    value: 'moderator'
                                }
                            ]
                        }
                    ]
                });
            });
        });
        (0, vitest_1.describe)('or', () => {
            (0, vitest_1.it)('should create OR condition with multiple conditions', () => {
                const condition = (0, conditions_1.or)((0, conditions_1.eq)('$.status', 'premium'), (0, conditions_1.gt)('$.score', 1000));
                (0, vitest_1.expect)(condition).toEqual({
                    type: types_1.ConditionType.OR,
                    conditions: [
                        {
                            type: types_1.ConditionType.EQUALS,
                            path: '$.status',
                            value: 'premium'
                        },
                        {
                            type: types_1.ConditionType.GREATHER_THAN,
                            path: '$.score',
                            value: 1000
                        }
                    ]
                });
            });
            (0, vitest_1.it)('should create OR condition with different comparison types', () => {
                const condition = (0, conditions_1.or)((0, conditions_1.eq)('$.type', 'guest'), (0, conditions_1.gte)('$.age', 65), (0, conditions_1.lt)('$.loginCount', 3));
                (0, vitest_1.expect)(condition).toEqual({
                    type: types_1.ConditionType.OR,
                    conditions: [
                        {
                            type: types_1.ConditionType.EQUALS,
                            path: '$.type',
                            value: 'guest'
                        },
                        {
                            type: types_1.ConditionType.GREATHER_THAN_OR_EQUAL,
                            path: '$.age',
                            value: 65
                        },
                        {
                            type: types_1.ConditionType.LOWER_THAN,
                            path: '$.loginCount',
                            value: 3
                        }
                    ]
                });
            });
        });
    });
    (0, vitest_1.describe)('comparison conditions', () => {
        (0, vitest_1.describe)('eq (equals)', () => {
            (0, vitest_1.it)('should create equals condition with string value', () => {
                const condition = (0, conditions_1.eq)('$.name', 'Alice');
                (0, vitest_1.expect)(condition).toEqual({
                    type: types_1.ConditionType.EQUALS,
                    path: '$.name',
                    value: 'Alice'
                });
            });
            (0, vitest_1.it)('should create equals condition with number value', () => {
                const condition = (0, conditions_1.eq)('$.count', 42);
                (0, vitest_1.expect)(condition).toEqual({
                    type: types_1.ConditionType.EQUALS,
                    path: '$.count',
                    value: 42
                });
            });
            (0, vitest_1.it)('should create equals condition with boolean value', () => {
                const condition = (0, conditions_1.eq)('$.isActive', true);
                (0, vitest_1.expect)(condition).toEqual({
                    type: types_1.ConditionType.EQUALS,
                    path: '$.isActive',
                    value: true
                });
            });
            (0, vitest_1.it)('should create equals condition with reference value', () => {
                const condition = (0, conditions_1.eq)('$.confirmPassword', (0, rules_1.ref)('password'));
                (0, vitest_1.expect)(condition).toEqual({
                    type: types_1.ConditionType.EQUALS,
                    path: '$.confirmPassword',
                    value: {
                        type: '__reference',
                        path: 'password'
                    }
                });
            });
        });
        (0, vitest_1.describe)('neq (not equals)', () => {
            (0, vitest_1.it)('should create not equals condition', () => {
                const condition = (0, conditions_1.neq)('$.status', 'deleted');
                (0, vitest_1.expect)(condition).toEqual({
                    type: types_1.ConditionType.NOT_EQUALS,
                    path: '$.status',
                    value: 'deleted'
                });
            });
            (0, vitest_1.it)('should create not equals condition with reference', () => {
                const condition = (0, conditions_1.neq)('$.newPassword', (0, rules_1.ref)('currentPassword'));
                (0, vitest_1.expect)(condition).toEqual({
                    type: types_1.ConditionType.NOT_EQUALS,
                    path: '$.newPassword',
                    value: {
                        type: '__reference',
                        path: 'currentPassword'
                    }
                });
            });
        });
        (0, vitest_1.describe)('gt (greater than)', () => {
            (0, vitest_1.it)('should create greater than condition with number', () => {
                const condition = (0, conditions_1.gt)('$.age', 18);
                (0, vitest_1.expect)(condition).toEqual({
                    type: types_1.ConditionType.GREATHER_THAN,
                    path: '$.age',
                    value: 18
                });
            });
            (0, vitest_1.it)('should create greater than condition with string', () => {
                const condition = (0, conditions_1.gt)('$.version', '1.0.0');
                (0, vitest_1.expect)(condition).toEqual({
                    type: types_1.ConditionType.GREATHER_THAN,
                    path: '$.version',
                    value: '1.0.0'
                });
            });
            (0, vitest_1.it)('should create greater than condition with reference', () => {
                const condition = (0, conditions_1.gt)('$.endDate', (0, rules_1.ref)('startDate'));
                (0, vitest_1.expect)(condition).toEqual({
                    type: types_1.ConditionType.GREATHER_THAN,
                    path: '$.endDate',
                    value: {
                        type: '__reference',
                        path: 'startDate'
                    }
                });
            });
        });
        (0, vitest_1.describe)('gte (greater than or equal)', () => {
            (0, vitest_1.it)('should create greater than or equal condition', () => {
                const condition = (0, conditions_1.gte)('$.score', 100);
                (0, vitest_1.expect)(condition).toEqual({
                    type: types_1.ConditionType.GREATHER_THAN_OR_EQUAL,
                    path: '$.score',
                    value: 100
                });
            });
            (0, vitest_1.it)('should create greater than or equal condition with reference', () => {
                const condition = (0, conditions_1.gte)('$.maxValue', (0, rules_1.ref)('minValue'));
                (0, vitest_1.expect)(condition).toEqual({
                    type: types_1.ConditionType.GREATHER_THAN_OR_EQUAL,
                    path: '$.maxValue',
                    value: {
                        type: '__reference',
                        path: 'minValue'
                    }
                });
            });
        });
        (0, vitest_1.describe)('lt (lower than)', () => {
            (0, vitest_1.it)('should create lower than condition', () => {
                const condition = (0, conditions_1.lt)('$.attempts', 3);
                (0, vitest_1.expect)(condition).toEqual({
                    type: types_1.ConditionType.LOWER_THAN,
                    path: '$.attempts',
                    value: 3
                });
            });
            (0, vitest_1.it)('should create lower than condition with reference', () => {
                const condition = (0, conditions_1.lt)('$.current', (0, rules_1.ref)('maximum'));
                (0, vitest_1.expect)(condition).toEqual({
                    type: types_1.ConditionType.LOWER_THAN,
                    path: '$.current',
                    value: {
                        type: '__reference',
                        path: 'maximum'
                    }
                });
            });
        });
        (0, vitest_1.describe)('lte (lower than or equal)', () => {
            (0, vitest_1.it)('should create lower than or equal condition', () => {
                const condition = (0, conditions_1.lte)('$.discount', 50);
                (0, vitest_1.expect)(condition).toEqual({
                    type: types_1.ConditionType.LOWER_THAN_OR_EQUAL,
                    path: '$.discount',
                    value: 50
                });
            });
            (0, vitest_1.it)('should create lower than or equal condition with reference', () => {
                const condition = (0, conditions_1.lte)('$.quantity', (0, rules_1.ref)('stock'));
                (0, vitest_1.expect)(condition).toEqual({
                    type: types_1.ConditionType.LOWER_THAN_OR_EQUAL,
                    path: '$.quantity',
                    value: {
                        type: '__reference',
                        path: 'stock'
                    }
                });
            });
        });
    });
    (0, vitest_1.describe)('pattern matching conditions', () => {
        (0, vitest_1.describe)('matches', () => {
            (0, vitest_1.it)('should create regex matches condition', () => {
                const condition = (0, conditions_1.matches)('$.email', '^[^@]+@[^@]+\\.[^@]+$');
                (0, vitest_1.expect)(condition).toEqual({
                    type: types_1.ConditionType.MATCHES,
                    path: '$.email',
                    value: '^[^@]+@[^@]+\\.[^@]+$'
                });
            });
            (0, vitest_1.it)('should create regex matches condition for phone number', () => {
                const condition = (0, conditions_1.matches)('$.phone', '^\\+?[1-9]\\d{1,14}$');
                (0, vitest_1.expect)(condition).toEqual({
                    type: types_1.ConditionType.MATCHES,
                    path: '$.phone',
                    value: '^\\+?[1-9]\\d{1,14}$'
                });
            });
            (0, vitest_1.it)('should create regex matches condition for alphanumeric', () => {
                const condition = (0, conditions_1.matches)('$.username', '^[a-zA-Z0-9_]+$');
                (0, vitest_1.expect)(condition).toEqual({
                    type: types_1.ConditionType.MATCHES,
                    path: '$.username',
                    value: '^[a-zA-Z0-9_]+$'
                });
            });
        });
    });
    (0, vitest_1.describe)('membership conditions', () => {
        (0, vitest_1.describe)('isIn', () => {
            (0, vitest_1.it)('should create is in condition with string array', () => {
                const condition = (0, conditions_1.isIn)('$.role', ['admin', 'moderator', 'user']);
                (0, vitest_1.expect)(condition).toEqual({
                    type: types_1.ConditionType.IS_IN,
                    path: '$.role',
                    value: ['admin', 'moderator', 'user']
                });
            });
            (0, vitest_1.it)('should create is in condition with number array', () => {
                const condition = (0, conditions_1.isIn)('$.level', [1, 2, 3, 5, 8]);
                (0, vitest_1.expect)(condition).toEqual({
                    type: types_1.ConditionType.IS_IN,
                    path: '$.level',
                    value: [1, 2, 3, 5, 8]
                });
            });
            (0, vitest_1.it)('should create is in condition with mixed value array', () => {
                const condition = (0, conditions_1.isIn)('$.status', ['active', 'inactive', true, false]);
                (0, vitest_1.expect)(condition).toEqual({
                    type: types_1.ConditionType.IS_IN,
                    path: '$.status',
                    value: ['active', 'inactive', true, false]
                });
            });
            (0, vitest_1.it)('should create is in condition with reference values', () => {
                const condition = (0, conditions_1.isIn)('$.category', [(0, rules_1.ref)('allowedCategories[0]'), (0, rules_1.ref)('allowedCategories[1]')]);
                (0, vitest_1.expect)(condition).toEqual({
                    type: types_1.ConditionType.IS_IN,
                    path: '$.category',
                    value: [
                        {
                            type: '__reference',
                            path: 'allowedCategories[0]'
                        },
                        {
                            type: '__reference',
                            path: 'allowedCategories[1]'
                        }
                    ]
                });
            });
        });
        (0, vitest_1.describe)('isNotIn', () => {
            (0, vitest_1.it)('should create is not in condition', () => {
                const condition = (0, conditions_1.isNotIn)('$.status', ['banned', 'suspended']);
                (0, vitest_1.expect)(condition).toEqual({
                    type: types_1.ConditionType.IS_NOT_IN,
                    path: '$.status',
                    value: ['banned', 'suspended']
                });
            });
            (0, vitest_1.it)('should create is not in condition with numbers', () => {
                const condition = (0, conditions_1.isNotIn)('$.errorCode', [404, 500, 503]);
                (0, vitest_1.expect)(condition).toEqual({
                    type: types_1.ConditionType.IS_NOT_IN,
                    path: '$.errorCode',
                    value: [404, 500, 503]
                });
            });
            (0, vitest_1.it)('should create is not in condition with references', () => {
                const condition = (0, conditions_1.isNotIn)('$.userId', [(0, rules_1.ref)('blockedUsers[0]'), (0, rules_1.ref)('blockedUsers[1]')]);
                (0, vitest_1.expect)(condition).toEqual({
                    type: types_1.ConditionType.IS_NOT_IN,
                    path: '$.userId',
                    value: [
                        {
                            type: '__reference',
                            path: 'blockedUsers[0]'
                        },
                        {
                            type: '__reference',
                            path: 'blockedUsers[1]'
                        }
                    ]
                });
            });
        });
    });
    (0, vitest_1.describe)('complex condition compositions', () => {
        (0, vitest_1.it)('should create complex nested conditions', () => {
            const condition = (0, conditions_1.and)((0, conditions_1.eq)('$.type', 'user'), (0, conditions_1.or)((0, conditions_1.and)((0, conditions_1.eq)('$.plan', 'premium'), (0, conditions_1.gte)('$.usage', 1000)), (0, conditions_1.and)((0, conditions_1.eq)('$.plan', 'free'), (0, conditions_1.lte)('$.usage', 100))), (0, conditions_1.matches)('$.email', '^[^@]+@company\\.com$'));
            (0, vitest_1.expect)(condition.type).toBe(types_1.ConditionType.AND);
            (0, vitest_1.expect)(condition.conditions).toHaveLength(3);
            (0, vitest_1.expect)(condition.conditions[0].type).toBe(types_1.ConditionType.EQUALS);
            (0, vitest_1.expect)(condition.conditions[1].type).toBe(types_1.ConditionType.OR);
            (0, vitest_1.expect)(condition.conditions[2].type).toBe(types_1.ConditionType.MATCHES);
        });
        (0, vitest_1.it)('should create condition with cross-field references', () => {
            const condition = (0, conditions_1.and)((0, conditions_1.neq)('$.newPassword', (0, rules_1.ref)('currentPassword')), (0, conditions_1.eq)('$.confirmPassword', (0, rules_1.ref)('newPassword')), (0, conditions_1.gte)('$.passwordStrength', 8));
            (0, vitest_1.expect)(condition).toEqual({
                type: types_1.ConditionType.AND,
                conditions: [
                    {
                        type: types_1.ConditionType.NOT_EQUALS,
                        path: '$.newPassword',
                        value: { type: '__reference', path: 'currentPassword' }
                    },
                    {
                        type: types_1.ConditionType.EQUALS,
                        path: '$.confirmPassword',
                        value: { type: '__reference', path: 'newPassword' }
                    },
                    {
                        type: types_1.ConditionType.GREATHER_THAN_OR_EQUAL,
                        path: '$.passwordStrength',
                        value: 8
                    }
                ]
            });
        });
        (0, vitest_1.it)('should create condition for form validation scenario', () => {
            const condition = (0, conditions_1.or)((0, conditions_1.and)((0, conditions_1.eq)('$.accountType', 'business'), (0, conditions_1.matches)('$.businessId', '^[A-Z]{2}\\d{8}$'), (0, conditions_1.isIn)('$.industry', ['tech', 'finance', 'healthcare'])), (0, conditions_1.and)((0, conditions_1.eq)('$.accountType', 'personal'), (0, conditions_1.gte)('$.age', 18), (0, conditions_1.isNotIn)('$.country', ['restricted1', 'restricted2'])));
            (0, vitest_1.expect)(condition.type).toBe(types_1.ConditionType.OR);
            (0, vitest_1.expect)(condition.conditions).toHaveLength(2);
            const businessCondition = condition.conditions[0];
            (0, vitest_1.expect)(businessCondition.type).toBe(types_1.ConditionType.AND);
            (0, vitest_1.expect)(businessCondition.conditions).toHaveLength(3);
            const personalCondition = condition.conditions[1];
            (0, vitest_1.expect)(personalCondition.type).toBe(types_1.ConditionType.AND);
            (0, vitest_1.expect)(personalCondition.conditions).toHaveLength(3);
        });
    });
    (0, vitest_1.describe)('path handling', () => {
        (0, vitest_1.it)('should handle absolute paths', () => {
            const condition = (0, conditions_1.eq)('$.user.profile.name', 'John');
            (0, vitest_1.expect)(condition).toEqual({
                type: types_1.ConditionType.EQUALS,
                path: '$.user.profile.name',
                value: 'John'
            });
        });
        (0, vitest_1.it)('should handle array index paths', () => {
            const condition = (0, conditions_1.gt)('$.scores[0]', (0, rules_1.ref)('$.scores[1]'));
            (0, vitest_1.expect)(condition).toEqual({
                type: types_1.ConditionType.GREATHER_THAN,
                path: '$.scores[0]',
                value: {
                    type: '__reference',
                    path: '$.scores[1]'
                }
            });
        });
        (0, vitest_1.it)('should handle nested object paths', () => {
            const condition = (0, conditions_1.matches)('$.user.contacts[0].email', '^[^@]+@[^@]+$');
            (0, vitest_1.expect)(condition).toEqual({
                type: types_1.ConditionType.MATCHES,
                path: '$.user.contacts[0].email',
                value: '^[^@]+@[^@]+$'
            });
        });
    });
});
