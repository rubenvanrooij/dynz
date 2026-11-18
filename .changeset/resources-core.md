---
"dynz": minor
---

Add resources: external data a form depends on, looked up by a key. Declare them on an object with `setResources` and `resource(...)`, and read them anywhere below that object with `resourceRef("name.outcome")` or `resourceRef("name.data.field")`. Resources can depend on other resources (through `enabled`, `key`, or the declaring object's `included`) and are evaluated in dependency order. `validate` takes `resolvers` per resource to fetch them, and `getOptionsForSchema` accepts the resolved resource states so option `enabled` predicates can use `resourceRef`.
