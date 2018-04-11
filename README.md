# react-dynamic-virtual-list
React virtual list component that aims to be the most flexible.

### Features
- Two second, super simple setup.
- Supports variable element heights.
- Supports a flexible grid layout.
- Only 1.9 KB Gzipped.
- Automatically detects element heights.
- Renders on requestAnimationFrame for good performance.
- Take control of when the rendering script is ran.
- Typescript, Babel and ES5 support.

# Installation

```
npm i react-dynamic-virtual-list
```

Using in Typescript/Babel project:

```js
import { DVL } from "react-dynamic-virtual-list";
```

Using in Node:

```js
const DVL = require("react-dynamic-virtual-list").DVL;
```

To use directly in the browser, drop the tag below into your `<head>`.

```html
<script src="https://cdn.jsdelivr.net/npm/react-dynamic-virtual-list@1.0.0/dist/react-dvl.min.js"></script>
```


## Quick Start

```tsx
import { DVL } from "react-dynamic-virtual-list";
import * as React from "React";

class App extends React.Component<any, any> {
    render() {
        return <DVL
            onRender={item => <div>{item.name}</div>}
            items={[{name: "Billy"}, {name: "Joel"}]}
        />
    }
}
```

## Usage

The Dynamic Virtual List will first render your items 500 at a time onto the dom and measure their height using `.clientHeight`, then use that cached value to render the actual virtual list.  Callbacks can be used to hide the element while it's doing this, and this behavior can be avoided by passing different values into the `calculateHeight` prop.

Grid layouts are supported provided each element is a fixed width, elements can be of any height.  

### Props
\* Required

| Prop            | Type                                                                       | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
|-----------------|----------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| onRender*       | `(item: any, index: number) => JSX.Element`                                | Function to use to render each element, must return a JSX Element.  If using a grid layout make sure you set fixed widths to your elements.                                                                                                                                                                                                                                                                                                                                    |
| items*          | `any[]`                                                                    | Array of items to render into the list.                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| calculateHeight | `(container: HTMLDivElement, item: any, index: number) => number | number` | If this prop is unused, the library will render every element onto the page to discover it's height, then display the virtual list.  You can either pass in a function to use for calculating heights or you can pass in a number that will be used as a fixed height for all elements.                                                                                                                                                                                        |
| windowContainer | `boolean`                                                                  | Pass "true" to use the window as the scroll container.                                                                                                                                                                                                                                                                                                                                                                                                                         |
| buffer          | `number`                                                                   | Default is 5, number of rows to render below and above the visual space.                                                                                                                                                                                                                                                                                                                                                                                                       |
| ref             | `HTMLDivElement`                                                           | The ref of the container DIV generated by the library to contain the list.                                                                                                                                                                                                                                                                                                                                                                                                     |
| style           | `React.CSSProperties`                                                      | Pass through styles to the container DIV.                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| className       | `string`                                                                   | Pass through classes to the container DIV.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| doUpdate        | `(calcVisible: (scrollTop?: number, height?: number) => void) => void`     | By default the library attaches the method to calculate the visible space to the scroll event and renders onRequestAnimationFrame.  You can disable and override this behavior by using this prop, the first argument is the method that calculates whats should be visible on the screen.  You can even pass in manually generated height and scrollTop values.  When you use this prop the library will only update it's visible area when the provided function is called. |
| gridItemWidth   | `number`                                                                   | Leave blank if you're doing one item per row.  If you're doing a grid layout then pass in the width of each fixed item into here.                                                                                                                                                                                                                                                                                                                                              |
| onResizeStart   | `() => void`                                                               | On the first render and each time the screen resizes the height of every element is checked and the list is re rendered.  This prop is called just after the resize has triggered and just before the library will start measuring element heights.                                                                                                                                                                                                                            |
| onResizeFinish  | `(columns: number) => void`                                                | Once the resize is done being calculated this prop will be called.  The number of columns calculated is also passed in as the single argument.                                                                                                                                                                                                                                                                                                                                 |


# MIT License

Copyright (c) 2018 Scott Lott

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
