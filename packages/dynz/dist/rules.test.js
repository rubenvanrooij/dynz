"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const rules_1 = require("./rules");
const conditions_1 = require("./conditions");
const types_1 = require("./types");
(0, vitest_1.describe)('rules', () => {
    (0, vitest_1.describe)('rules function', () => {
        (0, vitest_1.it)('should return array of rules when given multiple rules', () => {
            const result = (0, rules_1.rules)((0, rules_1.min)(5), (0, rules_1.max)(10), (0, rules_1.regex)('^[a-z]+$'));
            (0, vitest_1.expect)(result).toEqual([
                { type: types_1.RuleType.MIN, min: 5 },
                { type: types_1.RuleType.MAX, max: 10 },
                { type: types_1.RuleType.REGEX, regex: '^[a-z]+$' }
            ]);
        });
        (0, vitest_1.it)('should return array with single rule', () => {
            const result = (0, rules_1.rules)((0, rules_1.equals)('test'));
            (0, vitest_1.expect)(result).toEqual([
                { type: types_1.RuleType.EQUALS, value: 'test' }
            ]);
        });
        (0, vitest_1.it)('should return empty array when no rules provided', () => {
            const result = (0, rules_1.rules)();
            (0, vitest_1.expect)(result).toEqual([]);
        });
        (0, vitest_1.it)('should preserve rule order', () => {
            const result = (0, rules_1.rules)((0, rules_1.max)(100), (0, rules_1.min)(1), (0, rules_1.equals)(50));
            (0, vitest_1.expect)(result[0]).toEqual({ type: types_1.RuleType.MAX, max: 100 });
            (0, vitest_1.expect)(result[1]).toEqual({ type: types_1.RuleType.MIN, min: 1 });
            (0, vitest_1.expect)(result[2]).toEqual({ type: types_1.RuleType.EQUALS, value: 50 });
        });
    });
    (0, vitest_1.describe)('ref function', () => {
        (0, vitest_1.it)('should create reference with simple path', () => {
            const reference = (0, rules_1.ref)('name');
            (0, vitest_1.expect)(reference).toEqual({
                type: '__reference',
                path: 'name'
            });
        });
        (0, vitest_1.it)('should create reference with absolute path', () => {
            const reference = (0, rules_1.ref)('$.user.email');
            (0, vitest_1.expect)(reference).toEqual({
                type: '__reference',
                path: '$.user.email'
            });
        });
        (0, vitest_1.it)('should create reference with array index path', () => {
            const reference = (0, rules_1.ref)('items[0].id');
            (0, vitest_1.expect)(reference).toEqual({
                type: '__reference',
                path: 'items[0].id'
            });
        });
        (0, vitest_1.it)('should create reference with nested object path', () => {
            const reference = (0, rules_1.ref)('user.profile.settings.theme');
            (0, vitest_1.expect)(reference).toEqual({
                type: '__reference',
                path: 'user.profile.settings.theme'
            });
        });
        (0, vitest_1.it)('should preserve exact path string', () => {
            const complexPath = '$.data.users[5].contacts[0].address.street';
            const reference = (0, rules_1.ref)(complexPath);
            (0, vitest_1.expect)(reference.path).toBe(complexPath);
        });
    });
    (0, vitest_1.describe)('min rule', () => {
        (0, vitest_1.it)('should create min rule with number value', () => {
            const rule = (0, rules_1.min)(5);
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.MIN,
                min: 5
            });
        });
        (0, vitest_1.it)('should create min rule with decimal number', () => {
            const rule = (0, rules_1.min)(3.14);
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.MIN,
                min: 3.14
            });
        });
        (0, vitest_1.it)('should create min rule with zero', () => {
            const rule = (0, rules_1.min)(0);
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.MIN,
                min: 0
            });
        });
        (0, vitest_1.it)('should create min rule with negative number', () => {
            const rule = (0, rules_1.min)(-10);
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.MIN,
                min: -10
            });
        });
        (0, vitest_1.it)('should create min rule with date string', () => {
            const rule = (0, rules_1.min)('2024-01-01');
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.MIN,
                min: '2024-01-01'
            });
        });
        (0, vitest_1.it)('should create min rule with reference', () => {
            const reference = (0, rules_1.ref)('minimumValue');
            const rule = (0, rules_1.min)(reference);
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.MIN,
                min: {
                    type: '__reference',
                    path: 'minimumValue'
                }
            });
        });
        (0, vitest_1.it)('should create min rule with cross-field reference', () => {
            const rule = (0, rules_1.min)((0, rules_1.ref)('$.startDate'));
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.MIN,
                min: {
                    type: '__reference',
                    path: '$.startDate'
                }
            });
        });
    });
    (0, vitest_1.describe)('max rule', () => {
        (0, vitest_1.it)('should create max rule with number value', () => {
            const rule = (0, rules_1.max)(100);
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.MAX,
                max: 100
            });
        });
        (0, vitest_1.it)('should create max rule with decimal number', () => {
            const rule = (0, rules_1.max)(99.99);
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.MAX,
                max: 99.99
            });
        });
        (0, vitest_1.it)('should create max rule with date string', () => {
            const rule = (0, rules_1.max)('2024-12-31');
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.MAX,
                max: '2024-12-31'
            });
        });
        (0, vitest_1.it)('should create max rule with reference', () => {
            const reference = (0, rules_1.ref)('maximumAllowed');
            const rule = (0, rules_1.max)(reference);
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.MAX,
                max: {
                    type: '__reference',
                    path: 'maximumAllowed'
                }
            });
        });
        (0, vitest_1.it)('should create max rule with array reference', () => {
            const rule = (0, rules_1.max)((0, rules_1.ref)('limits[0]'));
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.MAX,
                max: {
                    type: '__reference',
                    path: 'limits[0]'
                }
            });
        });
    });
    (0, vitest_1.describe)('regex rule', () => {
        (0, vitest_1.it)('should create regex rule for email validation', () => {
            const rule = (0, rules_1.regex)('^[^@]+@[^@]+\\.[^@]+$');
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.REGEX,
                regex: '^[^@]+@[^@]+\\.[^@]+$'
            });
        });
        (0, vitest_1.it)('should create regex rule for phone number validation', () => {
            const rule = (0, rules_1.regex)('^\\+?[1-9]\\d{1,14}$');
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.REGEX,
                regex: '^\\+?[1-9]\\d{1,14}$'
            });
        });
        (0, vitest_1.it)('should create regex rule for alphanumeric validation', () => {
            const rule = (0, rules_1.regex)('^[a-zA-Z0-9]+$');
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.REGEX,
                regex: '^[a-zA-Z0-9]+$'
            });
        });
        (0, vitest_1.it)('should create regex rule for URL validation', () => {
            const urlPattern = '^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$';
            const rule = (0, rules_1.regex)(urlPattern);
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.REGEX,
                regex: urlPattern
            });
        });
        (0, vitest_1.it)('should create regex rule for password strength', () => {
            const passwordPattern = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$';
            const rule = (0, rules_1.regex)(passwordPattern);
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.REGEX,
                regex: passwordPattern
            });
        });
        (0, vitest_1.it)('should handle simple patterns', () => {
            const rule = (0, rules_1.regex)('[0-9]+');
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.REGEX,
                regex: '[0-9]+'
            });
        });
    });
    (0, vitest_1.describe)('equals rule', () => {
        (0, vitest_1.it)('should create equals rule with string value', () => {
            const rule = (0, rules_1.equals)('admin');
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.EQUALS,
                value: 'admin'
            });
        });
        (0, vitest_1.it)('should create equals rule with number value', () => {
            const rule = (0, rules_1.equals)(42);
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.EQUALS,
                value: 42
            });
        });
        (0, vitest_1.it)('should create equals rule with boolean value', () => {
            const rule = (0, rules_1.equals)(true);
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.EQUALS,
                value: true
            });
        });
        (0, vitest_1.it)('should create equals rule with reference', () => {
            const reference = (0, rules_1.ref)('confirmPassword');
            const rule = (0, rules_1.equals)(reference);
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.EQUALS,
                value: {
                    type: '__reference',
                    path: 'confirmPassword'
                }
            });
        });
        (0, vitest_1.it)('should create equals rule with cross-field reference', () => {
            const rule = (0, rules_1.equals)((0, rules_1.ref)('$.user.expectedRole'));
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.EQUALS,
                value: {
                    type: '__reference',
                    path: '$.user.expectedRole'
                }
            });
        });
        (0, vitest_1.it)('should create equals rule with array value', () => {
            const rule = (0, rules_1.equals)(['admin', 'user']);
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.EQUALS,
                value: ['admin', 'user']
            });
        });
    });
    (0, vitest_1.describe)('isNumeric rule', () => {
        (0, vitest_1.it)('should create isNumeric rule', () => {
            const rule = (0, rules_1.isNumeric)();
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.IS_NUMERIC
            });
        });
        (0, vitest_1.it)('should create isNumeric rule without parameters', () => {
            const rule = (0, rules_1.isNumeric)();
            (0, vitest_1.expect)(rule.type).toBe(types_1.RuleType.IS_NUMERIC);
            (0, vitest_1.expect)(Object.keys(rule)).toHaveLength(1);
        });
    });
    (0, vitest_1.describe)('custom rule', () => {
        (0, vitest_1.it)('should create custom rule with name only', () => {
            const rule = (0, rules_1.custom)('validateUniqueEmail');
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.CUSTOM,
                name: 'validateUniqueEmail',
                params: {}
            });
        });
        (0, vitest_1.it)('should create custom rule with name and params', () => {
            const rule = (0, rules_1.custom)('validateLength', {
                min: 5,
                max: 50
            });
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.CUSTOM,
                name: 'validateLength',
                params: {
                    min: 5,
                    max: 50
                }
            });
        });
        (0, vitest_1.it)('should create custom rule with reference parameters', () => {
            const rule = (0, rules_1.custom)('validateGreaterThan', {
                threshold: (0, rules_1.ref)('minimumValue'),
                strict: true
            });
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.CUSTOM,
                name: 'validateGreaterThan',
                params: {
                    threshold: {
                        type: '__reference',
                        path: 'minimumValue'
                    },
                    strict: true
                }
            });
        });
        (0, vitest_1.it)('should create custom rule with complex parameters', () => {
            const rule = (0, rules_1.custom)('validateBusinessRules', {
                category: 'finance',
                limits: {
                    daily: (0, rules_1.ref)('$.settings.dailyLimit'),
                    monthly: (0, rules_1.ref)('$.settings.monthlyLimit')
                },
                allowOverride: false,
                notificationEmail: 'admin@company.com'
            });
            (0, vitest_1.expect)(rule.name).toBe('validateBusinessRules');
            (0, vitest_1.expect)(rule.params.category).toBe('finance');
            (0, vitest_1.expect)(rule.params.limits.daily).toEqual({
                type: '__reference',
                path: '$.settings.dailyLimit'
            });
            (0, vitest_1.expect)(rule.params.allowOverride).toBe(false);
        });
        (0, vitest_1.it)('should handle empty params object', () => {
            const rule = (0, rules_1.custom)('simpleValidation', {});
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.CUSTOM,
                name: 'simpleValidation',
                params: {}
            });
        });
    });
    (0, vitest_1.describe)('conditional rule', () => {
        (0, vitest_1.it)('should create conditional rule with simple condition', () => {
            const rule = (0, rules_1.conditional)({
                when: (0, conditions_1.eq)('$.type', 'premium'),
                then: (0, rules_1.min)(10)
            });
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.CONDITIONAL,
                when: {
                    type: types_1.ConditionType.EQUALS,
                    path: '$.type',
                    value: 'premium'
                },
                then: {
                    type: types_1.RuleType.MIN,
                    min: 10
                }
            });
        });
        (0, vitest_1.it)('should create conditional rule with complex condition', () => {
            const rule = (0, rules_1.conditional)({
                when: (0, conditions_1.and)((0, conditions_1.eq)('$.accountType', 'business'), (0, conditions_1.eq)('$.plan', 'enterprise')),
                then: (0, rules_1.max)(1000)
            });
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.CONDITIONAL,
                when: {
                    type: types_1.ConditionType.AND,
                    conditions: [
                        {
                            type: types_1.ConditionType.EQUALS,
                            path: '$.accountType',
                            value: 'business'
                        },
                        {
                            type: types_1.ConditionType.EQUALS,
                            path: '$.plan',
                            value: 'enterprise'
                        }
                    ]
                },
                then: {
                    type: types_1.RuleType.MAX,
                    max: 1000
                }
            });
        });
        (0, vitest_1.it)('should create conditional rule with OR condition', () => {
            const rule = (0, rules_1.conditional)({
                when: (0, conditions_1.or)((0, conditions_1.eq)('$.role', 'admin'), (0, conditions_1.eq)('$.role', 'moderator')),
                then: (0, rules_1.regex)('^[a-zA-Z0-9_-]+$')
            });
            (0, vitest_1.expect)(rule.when.type).toBe(types_1.ConditionType.OR);
            (0, vitest_1.expect)(rule.then.type).toBe(types_1.RuleType.REGEX);
        });
        (0, vitest_1.it)('should create conditional rule with custom rule', () => {
            const rule = (0, rules_1.conditional)({
                when: (0, conditions_1.eq)('$.requiresValidation', true),
                then: (0, rules_1.custom)('complexBusinessValidation', {
                    level: 'strict',
                    timeout: 5000
                })
            });
            (0, vitest_1.expect)(rule).toEqual({
                type: types_1.RuleType.CONDITIONAL,
                when: {
                    type: types_1.ConditionType.EQUALS,
                    path: '$.requiresValidation',
                    value: true
                },
                then: {
                    type: types_1.RuleType.CUSTOM,
                    name: 'complexBusinessValidation',
                    params: {
                        level: 'strict',
                        timeout: 5000
                    }
                }
            });
        });
        (0, vitest_1.it)('should create nested conditional rules scenario', () => {
            const rule = (0, rules_1.conditional)({
                when: (0, conditions_1.and)((0, conditions_1.eq)('$.userType', 'premium'), (0, conditions_1.or)((0, conditions_1.eq)('$.region', 'US'), (0, conditions_1.eq)('$.region', 'EU'))),
                then: (0, rules_1.equals)((0, rules_1.ref)('$.settings.premiumValue'))
            });
            (0, vitest_1.expect)(rule.when.type).toBe(types_1.ConditionType.AND);
            (0, vitest_1.expect)(rule.when.conditions).toHaveLength(2);
            (0, vitest_1.expect)(rule.when.conditions[1].type).toBe(types_1.ConditionType.OR);
            (0, vitest_1.expect)(rule.then.type).toBe(types_1.RuleType.EQUALS);
            (0, vitest_1.expect)(rule.then.value.type).toBe('__reference');
        });
    });
    (0, vitest_1.describe)('rule combinations', () => {
        (0, vitest_1.it)('should create complex rule set for password validation', () => {
            const passwordRules = (0, rules_1.rules)((0, rules_1.min)(8), (0, rules_1.max)(128), (0, rules_1.regex)('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$'), (0, rules_1.conditional)({
                when: (0, conditions_1.eq)('$.securityLevel', 'high'),
                then: (0, rules_1.min)(12)
            }));
            (0, vitest_1.expect)(passwordRules).toHaveLength(4);
            (0, vitest_1.expect)(passwordRules[0].type).toBe(types_1.RuleType.MIN);
            (0, vitest_1.expect)(passwordRules[1].type).toBe(types_1.RuleType.MAX);
            (0, vitest_1.expect)(passwordRules[2].type).toBe(types_1.RuleType.REGEX);
            (0, vitest_1.expect)(passwordRules[3].type).toBe(types_1.RuleType.CONDITIONAL);
        });
        (0, vitest_1.it)('should create email validation rule set', () => {
            const emailRules = (0, rules_1.rules)((0, rules_1.regex)('^[^@]+@[^@]+\\.[^@]+$'), (0, rules_1.max)(320), // RFC 5321 limit
            (0, rules_1.custom)('validateEmailDomain', {
                allowedDomains: ['company.com', 'partner.org'],
                blockDisposable: true
            }));
            (0, vitest_1.expect)(emailRules).toHaveLength(3);
            (0, vitest_1.expect)(emailRules[0].type).toBe(types_1.RuleType.REGEX);
            (0, vitest_1.expect)(emailRules[1].type).toBe(types_1.RuleType.MAX);
            (0, vitest_1.expect)(emailRules[2].type).toBe(types_1.RuleType.CUSTOM);
            (0, vitest_1.expect)(emailRules[2].name).toBe('validateEmailDomain');
        });
        (0, vitest_1.it)('should create age validation with cross-references', () => {
            const ageRules = (0, rules_1.rules)((0, rules_1.min)((0, rules_1.ref)('$.legalMinimumAge')), (0, rules_1.max)((0, rules_1.ref)('$.retirementAge')), (0, rules_1.conditional)({
                when: (0, conditions_1.eq)('$.requiresParentalConsent', true),
                then: (0, rules_1.custom)('validateParentalConsent', {
                    guardianEmail: (0, rules_1.ref)('$.guardian.email')
                })
            }));
            (0, vitest_1.expect)(ageRules).toHaveLength(3);
            (0, vitest_1.expect)(ageRules[0].min.type).toBe('__reference');
            (0, vitest_1.expect)(ageRules[1].max.type).toBe('__reference');
            (0, vitest_1.expect)(ageRules[2].type).toBe(types_1.RuleType.CONDITIONAL);
        });
        (0, vitest_1.it)('should create date range validation', () => {
            const dateRules = (0, rules_1.rules)((0, rules_1.min)((0, rules_1.ref)('$.startDate')), (0, rules_1.max)('2030-12-31'), (0, rules_1.conditional)({
                when: (0, conditions_1.eq)('$.isRecurring', true),
                then: (0, rules_1.custom)('validateRecurrencePattern', {
                    maxOccurrences: (0, rules_1.ref)('$.maxRecurrences'),
                    endDate: (0, rules_1.ref)('$.seriesEndDate')
                })
            }));
            (0, vitest_1.expect)(dateRules).toHaveLength(3);
            (0, vitest_1.expect)(dateRules[0].min.path).toBe('$.startDate');
            (0, vitest_1.expect)(dateRules[1].max).toBe('2030-12-31');
            (0, vitest_1.expect)(dateRules[2].then.params.maxOccurrences.type).toBe('__reference');
        });
    });
});
