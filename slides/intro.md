---
layout: cover
transition: slide-left
highlighter: "shiki"
---

# Frontend 101

---

## Welcome!

This intro module will walk through high level techniques for building
high-quality frontend applications.

What we'll cover in this session:

<v-clicks>

- User-driven development
- Writing modular code
- Tailwind do's and dont's
- Component library best practices

</v-clicks>

---

```yml
layout: cover
```

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

---

```yml
layout: cover
```

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

## When to use arbitrary values

Arbitrary values aren't always bad, some good use cases for them include:

<v-clicks>

- Animations - `animate-[spin_1s_ease]`
- Transitioning specific properties - `transition-[margin]`
- Grid column setup - `grid-cols-[repeat(auto-fill,minmax(120px,1fr))]`
- Referencing CSS variables - `h-[var(--nav-height)]`
- Complex CSS expressions `[&:has(.child:hover)]:bg-gray-50`

</v-clicks>

<!-- Mention that complex CSS expressions should be used carefully -->

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

```yml
layout: cover
```

# Component library best practices

---

## Export Plenty of Types

Exporting types from components helps when building wrapper components.

Useful to export prop types, as well as important sub-types.

```typescript
export type MyComponentVariant = "default" | "compact"

export interface MyComponentProps {
  variant?: MyComponentVariant
}
```

---

## Build Small Components

Small components give users of your component library more flexibility

Also, with small components you can compose them together to build different
abstractions.

First, let's look at our current `Select` component.

```javascript
<Select
  label="Favorite Animal"
  options={[
    { display: "Aardvark", value: "Aardvark" },
    { display: "Cat", value: "Cat" },
    { display: "Dog", value: "Dog" },
  ]}
/>
```

---

## Breaking Components Apart

Now let's take a look at how you might do this using small components.

As you can see, while more verbose, we have smaller and more reusable components
that create the final component.

```javascript
<Select>
  <Label>Favorite Animal</Label>
  <Button>
    <SelectValue />
  </Button>
  <Popover>
    <ListBox>
      <ListBoxItem>Aardvark</ListBoxItem>
      <ListBoxItem>Cat</ListBoxItem>
      <ListBoxItem>Dog</ListBoxItem>
    </ListBox>
  </Popover>
</Select>
```

---

## Why is this Beneficial?

If we were to build a `Menu` component, we might use some very similar code to
our `Select` example.

By making small, reusable components, we don't have to rebuild a popover or a
listbox, we just use those pieces.

```javascript
<Menu>
  <Button>Open</Button>
  <Popover>
    <ListBox>
      <ListBoxItem>Aardvark</ListBoxItem>
      <ListBoxItem>Cat</ListBoxItem>
      <ListBoxItem>Dog</ListBoxItem>
    </ListBox>
  </Popover>
</Menu>
```

---

```yml
layout: two-cols-header
```

## Abstractions Come Naturally

One of the great things about building small components, is common abstractions
emerge naturally.

`FormModal` is a great example of this.

::left::

```javascript
<Modal>
  {({ close }) => (
    <BaseForm
      onSubmit={async (input) => {
        // ...
        close()
      }}
    >
      {({ form }) => <p>Content</p>}
    </BaseForm>
  )}
</Modal>
```

::right::

```javascript
<FormModal
  onSubmit={async (input) => {
    // ...
  }}
>
  {({ form }) => <p>Content</p>}
</FormModal>
```

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
