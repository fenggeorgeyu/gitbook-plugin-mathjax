
Math integration with GitBook
==============

This plugin uses MathJax to display Math/TeX formula. This is an official plugin. Versions `>=0.1.0` require GitBook `>=2.0.0`.

### How to use it?

Add it to your `book.json` configuration:

```
{
    "plugins": ["mathjax@git+https://github.com/qinix/gitbook-plugin-mathjax"]
}
```

Install your plugins using:

```
$ gitbook install ./
```

You can now add TeX formula to your book using the `$` block for inline latex:

```
When $a \ne 0$, there are two solutions to $(ax^2 + bx + c = 0)$ and they are $x = {-b \pm \sqrt{b^2-4ac} \over 2a}.$
```

You can also use the `$$` block for display style latex:

```
When $a \ne 0$, there are two solutions to $(ax^2 + bx + c = 0)$ and they are

$$x = {-b \pm \sqrt{b^2-4ac} \over 2a}.$$
```

### Configuration

You can force the use of svg pre-processed by adding to your book.json:

```
{
    "pluginsConfig": {
        "mathjax":{
            "forceSVG": true
        }
    }
}
```
