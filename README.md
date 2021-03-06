# CanvasControls
## A composite shape/control API for the HTML 5 Canvas

CanvasControls aims to provide a simple and reusable framework for UI controls in the HTML 5 Canvas.

A simple sample can be found here: http://lars-erik.github.com/CanvasControls/compositesandbox.htm.

## Dependencies

jQuery
http://www.jquery.org

John Resig's simple inheritance structure
http://ejohn.org/blog/simple-javascript-inheritance/

Brandon Aaron's jQuery mousewheel plugin
http://brandonaaron.net/code/mousewheel/docs

Jonathan Sharp's mockjax for tests
https://github.com/appendto/jquery-mockjax

## Core classes

### Observable

Base class for CanvasView and Shape.
Adapts the jQuery functions on and trigger.

### Shape

Base class for shapes and controls. Is called from canvasview or parent for painting.
`Paint` receives the 2D canvas context translated to the shape's x and y coordinates,
so the shape can draw itself from 0,0.

### CompositeShape (new)

Base class for shapes with child shapes. Contains all logic for transforming coordinates
and pushing events to children.

### CanvasView

Adapter for the canvas element. Derives from compositeshape, but has some more logic
for interacting with the canvas.

### DragView

Support for dragging shapes around on the screen. 
Drags a shape and paints it on a 100% x 100% canvas with zIndex above all others.

## Controls / Shapes

### Timeline

Displays periods horizontally, allowing scrolling sideways and zooming to different period definitions.

### TimelineBoard

Displays content of a timeline, scrolls with timeline and expands with timelinetree

### TimelineTree

A good old treeview, possible to integrate with timelineboard.

### Image

Draws an image

### Box (to be depreciated / simplified)

See animationsandbox.htm

### DragShape

Copies image data from a context and fades it in a quarter ellipse.
See dragsandbox.htm

## Utilities

### AjaxQueue

Queues ajax request/callback pairs. 
Used for ensuring that calls are done in sequence.

## Controllers / Mediators

### TimelineTreeController

Controls communication between the tree, a datasource and menus

### TreeBoardMediator

Controls communication between the tree and the timeline board


## Samples

This is the code from animationsandbox.htm

```javascript
		var Box = canvascontrols.Shape.extend({
			init: function (x, y, width, height) {
				this._super({
					x: x,
					y: y,
					width: width,
					height: height,
					start: new Date().getTime(),
					color: "#" + parseInt(Math.random() * 0xFFFFFF).toString(16)
				});
			},
			width: function () {
				return this._options.width;
			},
			height: function () {
				return this._options.height;
			},
			paint: function (context) {
				var rotTime = 2500;
				var now = new Date().getTime();
				var passed = (now - this._options.start) % rotTime;
				context.translate(this.width() / 2, this.height() / 2);
				context.rotate(Math.PI * 2 * passed / rotTime);
				context.fillStyle = this._options.color;
				context.fillRect(this.width() / 2 * -1, this.height() / 2 * -1, this.width(), this.height());
			}
		});

		$("canvas").height($(window).height() - 100);
		var view = new canvascontrols.CanvasView("canvas");
		var size = 20;
		var pad = 5;
		for (var x = pad; x < $(window).width() - size - pad; x += size + pad) {
			for (var y = pad; y < $(window).height() - size - pad; y += size + pad) {
				view.add(new Box(x, y, size, size));
			}
		}
		setInterval(function () {
			view.paint();
		}, 1000 / 30);
```

This is the code from dragsandbox.htm

```javascript
		$("#root").height($(window).height());

		var rootView = new canvascontrols.CanvasView("#root");
		var dragView = new canvascontrols.DragView("#drag");

		// this is the windows sample pictures koala.
		// add the hacking folder and image to your project to see something. :)
		var img = new canvascontrols.Image("hacking/koala.jpg");
		rootView.add(img);
		img.on("loaded.cc", {}, function (s, e) {
			imageLoaded();
		});

		img.on("mousedown", img, function (s, e) {
			startIt(e);
		});

		dragView.on("dragStopped.cc", {}, function (s, e) {
			img._x = e.pageX - $("#root").offset().left;
			img._y = e.pageY - $("#root").offset().top;
			rootView.paint();
		});

		function imageLoaded() {
			var size = img.getSize();
			img.setSize(300, 300 * size.height / size.width);
			rootView.paint();
		}

		function startIt(e) {
			var ctx = $("#root")[0].getContext("2d");
			var dragShape = canvascontrols.DragShape.create(
				ctx,
				img.x(), img.y(), 200, 150
			);
			dragView.startDrag(
				dragShape,
				$("#root").offset().left - e.pageX,
				$("#root").offset().top - e.pageY
			);
		}

```

A hoverable composite box

```javascript

		var CompositeBox = canvascontrols.CompositeShape.extend({
			init: function (options) {
				this._super(options);
				this.l = options.l;
				this.hovered = false;

				this.on("mouseover", this, function () {
					this.hovered = true;
				});

				this.on("mouseout", this, function () {
					this.hovered = false;
				});
			},
			paint: function (context) {
				context.save();
				context.fillStyle = "#FFFFFF";
				context.strokeStyle = this.hovered ? "#0000FF" : "#000000";
				context.fillRect(0, 0, this.width(), this.height());
				context.strokeRect(0, 0, this.width(), this.height());
				context.fillStyle = "#000000";
				context.fillText(this.l, 0, this.height());
				context.restore();
				this._super(context);
			}
		});

```

## Current status / todos

The timeline view was first prototyped with a MVC/P ish approach, naively wrapping canvas in concrete views.
This is the main focus of the project I am going to use the API in, so this will be what I write for now.

- Rewrite timeline controls (see timelinetreesandbox.htm) to implement the CanvasView / Shape classes.
  - Current classes being rewritten are Timeline and TimelineTree
- Rewrite tests to use common canvas mock.

- Extend TimelineTree to have n generic columns to the right side of the tree

- Integrate with jQuery mobile to allow swiping the timeline
- Research mobile device pinch support for timeline

- Support for "invalidate" of individual shapes

## Notes about pull requests / contributions

There's nothing I'd like more than contributions to this framework.
I couldn't find any other projects with this focus, so I hope it'll be useful for someone. 
If you'd like to contribute, keep this in mind:

- I aim to keep ~100% test coverage using QUnit.
- I use Visual Studio 2010 and NuGet to keep track of jQuery and possibly other stuff
  - (Project files are not checked in)
- The project is currently under development, I might change stuff on a whim