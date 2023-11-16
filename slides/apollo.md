---
layout: cover
transition: slide-left
highlighter: "shiki"
---

# Apollo Deep Dive

---

## Welcome!

This intro module will walk through high level techniques for building
high-quality frontend applications.

What we'll cover in this session:

<v-clicks>

- Basics of Queries and Mutation
- Understanding the Apollo Cache
- Caching Methods
- Manual Cache Modification
- Using Fetch Policies

</v-clicks>

---

```yml
layout: cover
```

# Basics of Queries and Mutation

---

## Queries vs Mutations

Before we get too far, let's first do some review of Apollo queries and
mutations to refresh ourselves on how they work.

<v-clicks>

Apollo has two primary hooks: `useQuery` and `useMutation`.

Queries fetch data, mutations change data.

</v-clicks>

<!--
Queries should almost never perform side effects such as creating or changing
data.
-->

---

## Queries

Let's look at an example query:

```javascript {all|7-8|9-10|11-12}
const { data, loading, error } = useGetLayoutQuery({
  variables: {
    id: "123",
  },
})

return loading ? (
  <Loader />
) : error ? (
  <Alert />
) : data ? (
  <Layout layout={data.getLayoutById} />
) : null
```

<v-clicks at="0">

Whenever fetching, we always want to show a loading state.

Using an alert for errors is best as toasts disappear and can be missed.

Finally we can display our UI.

</v-clicks>

---

## Mutations

Mutations look fairly similar, but they are executed as a result of an action:

```javascript
const [mutate, { loading }] = useUpdateLayoutMutation()

async function handleSave() {
  await mutate({
    variables: {
      id: "123",
      input: {
        name: "New name",
      },
    },
  })
}

return <Button onClick={handleSave}>Save</Button>
```

---

## Deferred Queries

Queries are not always executed immediately.

<v-clicks>

Sometimes they are a result of a user action (lazy query).

Or they might happen after some condition is met (modal opened).

</v-clicks>

---

## Lazy Queries

You can wait to fetch data until a user action such as filtering in a combobox.

```javascript
const [searchAccounts] = useSearchAccountsLazyQuery()

const list = useAsyncList({
  async load(filterText) {
    const { data } = await searchAccounts({
      variables: { search: filterText },
    })

    return (data?.searchAccounts ?? []).map((account) => ({
      value: account.id,
      display: account.accountName ?? "",
    }))
  },
})
```

---

## Conditional Queries

Lazy queries are great, but they are often used when conditional queries should
be used.

Conditional queries are ideal when you want to fetch data only when a given
condition is met. For example:

- The query is only needed once a modal is open
- The query depends on data from another query

<v-clicks>

```javascript {1,6}
const [isOpen, setIsOpen] = useState(false)
const { data, loading, error } = useGetLayoutQuery({
  variables: {
    id: "123",
  },
  skip: isOpen,
})
```

As a general rule of thumb, if you are using a lazy query in a `useEffect`, you
should probably use a conditional query instead.

</v-clicks>

---

```yml
layout: cover
```

# Understanding the Cache

---

## What is the Apollo Cache?

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

## What is the Apollo Cache?

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

<!--
One of the important aspects of how the Apollo cache is how it flattens queries into individually cached items.

Cached items are then referenced by other items via the __ref.
-->

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

```yml
layout: cover
```

# Caching Methods

---

## Three Principles of Caching

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

---

```yml
clicks: 2
```

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
