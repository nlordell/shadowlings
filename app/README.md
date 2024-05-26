# Shadowling App

## ToDos

- [ ] Calculate transaction proof
- [ ] Submit tx via 4337
- [ ] Add recovery UI
- [ ] Calculate recovery proof
- [ ] Display recovery json


# Note

To make this work it is necessary to add polyfills in the React scripts.

- `node_modules/react-scripts/config/webpack.config.js`

Add in the `resolve` block the following code:

```js
fallback: {
    buffer: require.resolve('buffer/'),
    assert: require.resolve('assert/'),
},
```

and to the `plugins` block the following code:

```js
new webpack.ProvidePlugin({
    process: "process/browser",
    Buffer: ["buffer", "Buffer"],
}),
```

Proper fix: Ditch React