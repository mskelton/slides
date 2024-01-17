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

```js {all|7-8|9-10|11-12}
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

```js
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

```js
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

```js {1,6}
const [isOpen, setIsOpen] = useState(false)
const { data, loading, error } = useGetLayoutQuery({
  variables: {
    id: "123",
  },
  skip: !isOpen,
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

```ts {7-12}
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

```ts {3-8}
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

```ts {3-6}
updatePolicy({
  // ...
  awaitRefetchQueries: true,
  refetchQueries: [
    { query: observable.query, variables: observable.variables },
  ],
})
```

---

```yml
layout: cover
```

# Manual Cache Modification

Diving deeper

---

## Updating existing data

While it's preferable to let Apollo automatically update the cache, sometimes
you need to manually update the cache. Tables are the most common reason where
automatic caching will cause race conditions.

Let's see an example of what this might look like.

```ts
updateTableColumn({
  // ...
  update: (cache, { data }) => {
    cache.modify({
      id: cache.identify(data?.updateTableColumn ?? {}),
      fields: {
        sortable: () => true,
      },
    })
  },
})
```

<!--
Identifying the object in the cache is key.  In this example we are using cache.identify using the returned object.

In a real-world scenario, you likely will be iterating over a list of fields, or specifying key/value pairs of fields using the syntax we saw earlier.
-->

---

## Explaining cache.identify

The `cache.identify` function is a simple utility to make it easier to generate
cache references from GraphQL objects. Under the hood, it looks something like
this:

```js
cache.identify = ({ __typename, id }) => {
  return `${__typename}:${id}`
}
```

This is very simplified and missing much of the details of what Apollo does to
determine cache ids based on `keyFields`, but the idea is similar.

In general, it's best to pass returned objects to `cache.identify` when doing
manual cache modification.

---

## Adding data to a list

When adding an item to a list, the caching is a little bit more complex. Instead
of just updating fields, we need to add the newly created object to the parent
list in which it lives.

```ts
createTableColumnMutation({
  update(cache, { data }) {
    if (!data) return

    cache.modify({
      id: cache.identify(table),
      fields: {
        columns(prev, { toReference }) {
          return [...prev, toReference(data.createTableColumn)]
        },
      },
    })
  },
})
```

<!--
This example shows creating a table column and adding it to the parent table. We use the `toReference` function to convert the returned data into a reference object so the parent table will refer to the cached object, rather than static data.
-->

---

## Removing data from a list

When removing data from a list, we can `filter` through the list of data in the
parent object and use `readField` to find the item to remove.

```ts
deleteTableColumn({
  update(cache, { data }) {
    if (!data) return

    cache.modify({
      id: cache.identify(table),
      fields: {
        columns(prev, { readField }) {
          return prev.filter((ref: Reference) => id !== readField("id", ref))
        },
      },
    })
  },
})
```

---

## Handling many-to-many relationships

Many-to-many relationships are a lot more complicated to manage with manual
caching. Let's take a look at some real code.

---

```yml
layout: cover
```

# Using Fetch Policies

---

## What are fetch policies?

Fetch policies allow you to control how Apollo manages refetching potentially
stale data.

In this section, we'll review all the fetch policies and when you would use
each.

---

## `cache-first`

If Apollo already has **all** the data it needs for a query in the cache, it
will not refetch the data and will use the already cached data.

This is the default fetch policy and is always preferred as it reduces data
fetching and network traffic.

---

## `cache-and-network`

Apollo will use any data from the cache if it exists, but also refetch the data
from the server.

This is useful to provide an immediate response to the user but still refetch in
the background in case of stale data.

Be cautious with this one to ensure that when the data loads, it doesn't cause
content flashing if the user is currently viewing data.

---

## `network-only`

Apollo will ignore the cache and always refetch the query. Results will be
stored in the cache for other queries and such, but this query will never read
from the cache.

**Avoid this fetch policy at all costs!**

---

## `cache-only`

Only pull data from the cache, never fetch from the server. If the data doesn't
exist, throw an error.

This one is pretty rare.

---

## `no-cache`

Basically the same as `network-only`, but the results of this query should not
be stored in the cache.

This is useful in scenarios where you have large data collections that you don't
need to keep in the cache.

---

## `standby`

This is the same as `cache-first`, but it does not change when fields in the
cache are updated.

Unsure of any times when this would make sense for us.

---

```yml
layout: cover
```

# Thank You!

For more software engineering content, checkout my blog at
[mskelton.dev](https://mskelton.dev/blog).
