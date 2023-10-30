---
layout: cover
transition: slide-left
---

# Frontend 101

---

## Welcome!

This intro module will walk through high level techniques for building
high-quality frontend applications.

What we'll cover in this session:

<v-clicks>

- User-driven development
- Effective Apollo/GraphQL
- Writing modular code
- Tailwind do's and dont's
- Component library best practices

</v-clicks>

<!-- prettier-ignore-start -->

---
layout: cover
---

<!-- prettier-ignore-end -->

# User-driven development

---

## Why care about the user?

Understanding users is critically important in frontend development.

<v-clicks>

Focusing on wrong, or non-existent users, is an easy mistake to make.

When developing features, ask yourself if the feature is solving the user's
problems.

</v-clicks>

<v-click>

### Further Reading

- ["Avoid the test user" by Kent C. Dodds](https://kentcdodds.com/blog/avoid-the-test-user)

</v-click>

---

## Who is the user?

The user is not always the customer! Here is a list of possible users:

- Day-to-day customers (e.g. underwriters)
- Customer admins/managers
- External users (e.g. brokers)
- Customer success
- Sales
- Engineering

<!--
This is especially true for us right now as we work on externalization.
-->

---

## Understand the user for your feature

Because the user can be different for each feature, understand which user you
are serving.

Just because one feature serves the engineering user, doesn't mean they all
should 😁

<!-- prettier-ignore-start -->

---
layout: cover
---

<!-- prettier-ignore-end -->

# Effective Apollo/GraphQL

---

## Apollo is a critical piece of our stack

We use Apollo and GraphQL for the majority of our data fetching on the frontend.

If we understand a few key concepts, we can build exceptional interfaces.

Let's start with an overview of the Apollo cache.

---

## Explaining the Apollo Cache

When Apollo fetches data, it normalizes all data into a central cache. Take
these two queries for example:

```graphql
query GetAccountInfo {
  accountById(accountId: 12) {
    id
    name
  }
}

query GetAccountUsers {
  accountById(accountId: 12) {
    id
    users {
      id
      name
    }
  }
}
```

---

## Explaining the Apollo Cache

When Apollo fetches these two queries, it will normalize them into the following
cache entries:

```json
{
  "ROOT_QUERY": {
    "accountById(accountId: 12})": {
      "__ref": "NBAccountsType:12"
    }
  },
  "NBAccountsType:12": {
    "__typename": "NBAccountsType",
    "id": "12",
    "name": "Mark's Account",
    "users": [{ "__ref": "UserType:18" }]
  },
  "UserType:18": {
    "__typename": "UserType",
    "id": "18",
    "name": "Mark Skelton"
  }
}
```

_This is not exactly the structure of the Apollo cache, but it's a close
approximation._

---

## The key to caching

For Apollo to cache queries properly, it needs a way to uniquely identify each
object.

By default, this is a combination of the `__typename` and `id` fields.

<v-click>

For example, this query result is stored with a cache id of `NBAccountsType:12`:

```json {2-3}
{
  "__typename": "NBAccountsType",
  "id": 12,
  "name": "Mark's Account"
}
```

</v-click>

<v-click>

_Apollo automatically adds the `__typename` field to every query, but if we omit
the `id`, Apollo can't normalize our data into the cache properly._

</v-click>

---

## Why does data normalization matter?

All this talk about caching and ids, but why does it matter?

<v-clicks>

It's about **data consistency**

If the cache is not normalized, then multiple queries with the same data will
not remain consistent.

This isn't often an issue with data that is only fetched, but becomes a big
challenge with mutations.

</v-clicks>

---

## Speaking of mutations...

The large majority of our application usage is data entry/manipulation.

<v-clicks>

Three principles for building great mutations:

1. Modify the cache after mutations
1. Utilize optimistic responses
1. Avoid re-fetching when possible

</v-clicks>

---

## Modify the cache after mutations

Always update the cache when performing a mutation.

<v-clicks>

This ensures queries are updated with the most recent data.

There are two main ways to update the cache:

1. Automatically using response fields
1. Manually using `cache.modify`

</v-clicks>

<!-- prettier-ignore-start -->

---
clicks: 2
---

<!-- prettier-ignore-end -->

## Updating the cache automatically

When you provide response fields in a GraphQL mutation, Apollo will
automatically update the cache with the results.

```graphql {all|4-5|3}
mutation UpdatePolicy {
  updatePolicy(input: $input) {
    id
    name
    totalPremium
  }
}
```

<v-clicks at="0">

The `name` and `totalPremium` values will be updated in the cache when the
request finishes.

For this to work, you **MUST** provide an `id` in the response.

</v-clicks>

---

## Updating the cache manually

We can use the `update` function and `cache.modify` to manually update the
cache.

The `update` function provides the response data from the mutation.

```typescript {7-12}
updatePolicy({
  variables: {
    policyId,
    field,
    value,
  },
  update: (cache, { data }) => {
    cache.modify({
      id: cache.identify(data?.updatePolicy ?? {}),
      fields: { [field]: () => value },
    })
  },
})
```

---

## Utilize optimistic responses

When you know the data that will be returned, use an optimistic response.

Optimistic responses improve the user experience, and help prevent frontend race
conditions.

```typescript {3-8}
updatePolicy({
  // ...
  optimisticResponse: {
    updatePolicy: {
      __typename: "PolicyType",
      id: policyId,
    },
  },
})
```

<v-click>

_Server-calculated data is the primary use-case where optimistic responses do
not work the best._

</v-click>

---

## Avoid re-fetching when possible

While it's tempting to simply add the `refetchQueries` property and move on,
avoid this whenever possible.

Re-fetching has a much higher cost on performance and user experience.

```typescript {3-6}
updatePolicy({
  // ...
  awaitRefetchQueries: true,
  refetchQueries: [
    { query: observable.query, variables: observable.variables },
  ],
})
```

<!-- prettier-ignore-start -->

---
layout: cover
---

<!-- prettier-ignore-end -->

# Tailwind do's and dont's

---

## Use inline styles extremely sparingly

Always use Tailwind classes for styling elements.

Inline styles should be used in very few and very specific circumstances.

**Don't**

```jsx
<p style={{ margin: "12px" }} />
```

**Do**

```jsx
<p class="m-3" />
```

---

## Avoid arbitrary values when possible

Tailwind's
[arbitrary values](https://tailwindcss.com/docs/adding-custom-styles#using-arbitrary-values)
syntax is great, but should only be used if needed.

**Don't**

```jsx
<p class="m-[12px]" />
```

**Do**

```jsx
<p class="m-3" />
```

**Remember**

- When possible, use builtin values.
- Try to use the closest builtin value rather than a custom value

---

## Don't interpolate class names

Tailwind builds a CSS file based on the class names it finds in the project.

Interpolating class names prevents Tailwind from finding them.

Interpolation may appear to work if the class is found elsewhere, but **NEVER**
rely on this.

**Don't**

```jsx
const left = 10

<p className={`left-[${left}px]`} />
```

**Do**

```jsx
const left = 10

<p style={{ left: `${left}px` }} />
```

---

##

---

##

---

##

---

##

---

##

---

##

---

##

---

## Thanks!

Big thanks to Tim for encouraging me to start this series, and for everyone here
joining and participating in the fun!

### Further Reading

-
