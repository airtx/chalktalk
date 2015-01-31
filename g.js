
   // Do not load any of the following sketches.
   var ignoredSketches = 'reflect'.split(' ');

   // GLOBAL VARIABLES.

   var PMA = 8; // PIE MENU NUMBER OF ANGLES
   var backgroundColor = 'black';
   var bgClickCount = 0;
   var bgClickX = 0;
   var bgClickY = 0;
   var defaultPenColor = backgroundColor == 'white' ? 'black' : 'white';
   var glyphTrace = [];
   var glyphSketch = null;
   var isAltKeyCopySketchEnabled = true;
   var isAltPressed = false;
   var isBottomGesture = false;
   var isExpertMode = true;
   var isMouseOverBackground = true;
   var isShowing2DMeshEdges = false;
   var isShowingMeshEdges = false;
   var isShowingPresenterView = false;
   var isShowingScribbleGlyphs = false;
   var isTelegraphKeyPressed = false;
   var isTextMode = false;
   var margin = 50;
   var meshOpacityOverVideo = 0.7;
   var scribbleScale = margin;
   var sketchPadding = 10;
   var sketchTypes = [];
   var sketchAction = null;
   var sketchTypesToAdd = [];
   var videoBrightness = 1;

   // SET WIDTH AND HEIGHT OF SKETCHPAGE TO MATCH THE WIDTH AND HEIGHT OF THE COMPUTER SCREEN.

   function width () { return isDef(_g) ? _g.canvas.width  : screen.width ; }
   function height() { return isDef(_g) ? _g.canvas.height : screen.height; }

   // SOMETIMES WE NEED TO SET A CUSTOM HEIGHT TO MAKE THINGS WORK WITH A PARTICULAR PROJECTOR.

   //function height() { return 640; }
   //function height() { return 720; }
   //function height() { return 920; }

   //function width() { return 1280 + 100; }
   //function height() { return 800; }

   // BEST RESOLUTION FOR CINTIQ

   //function width() { return 1920 - 103 * 1920 / 1080; }
   //function height() { return 1080 - 103; }

   // TRANSPARENT INK IN THE DEFAULT PEN COLOR.

   function scrimColor(alpha, colorId) {
      if (colorId === undefined)
         colorId = 0;
      var p = paletteRGB[colorId];
      return 'rgba(' + p[0] + ',' + p[1] + ',' + p[2] + ',' + alpha + ')';
   }

   // TRANSPARENT INK IN THE BACKGROUND COLOR.

   function bgScrimColor(alpha) {
      return (backgroundColor != 'white' ? 'rgba(0,0,0,' : 'rgba(255,255,255,') + alpha + ')';
   }

   // LEFT AND TOP COORDINATES OF THE CURRENTLY VISIBLE CANVAS.

   function clientX(event) {
      if (isDef(_g.panX)) return event.clientX - _g.panX;
      return event.clientX;
   }

   function clientY(event) {
      if (isDef(_g.panY)) return event.clientY - _g.panY;
      return event.clientY;
   }

////////////////////////////////////////////////////////////////
// INITIALIZE HANDLING OF KEYBOARD AND MOUSE EVENTS ON A CANVAS:
////////////////////////////////////////////////////////////////

   var mouseMoveEvent = null;

   function initEventHandlers(canvas) {
      function getHandle(canvas) { return window[canvas.id]; }

      var handle = getHandle(canvas);
      handle.mouseX = 1000;
      handle.mouseY = 1000;
      handle.mousePressed = false;

      document.addEventListener("touchstart"  , function(e) {e.preventDefault(); debugMessage = "touchstart " ; canvas.onmousedown(e); }, false);
      document.addEventListener("touchmove"   , function(e) {e.preventDefault(); debugMessage = "touchmove "  ; canvas.onmousemove(e); }, false);
      document.addEventListener("touchend"    , function(e) {e.preventDefault(); debugMessage = "touchend "   ; canvas.onmouseup  (e); }, false);
      document.addEventListener("touchcancel" , function(e) {e.preventDefault(); debugMessage = "touchcancel "; canvas.onmouseup  (e); }, false);

      canvas.onkeydown = function(event) {
         var handle = getHandle(this);
         if (isDef(handle.keyDown)) {
            event = event || window.event;

            // PREVENT BROWSER FROM SCROLLING IN RESPONSE TO CERTAIN KEYS.

            switch (event.keyCode) {
            case 32: // ASCII SPACE
            case 33: // ASCII PAGE UP
            case 34: // ASCII PAGE DOWN
            case 37: // ASCII LEFT ARROW
            case 38: // ASCII UP ARROW
            case 39: // ASCII RIGHT ARROW
            case 40: // ASCII DOWN ARROW
            case 8:  // ASCII DELETE
               event.preventDefault();
               break;
            }

            handle.keyDown(event.keyCode);
         }
      }

      canvas.onkeyup = function(event) {
         var handle = getHandle(this);
         if (isDef(handle.keyUp)) {
            event = event || window.event;
            handle.keyUp(event.keyCode);
         }
      }

      canvas.onkeypress = function(event) {
         switch (event.keyCode) {
         // PREVENT DEFAULT WINDOW ACTION ON BACKSPACE.
         case 8:
             event.preventDefault();
             break;
         }
         var handle = getHandle(this);
         if (isDef(handle.keyPress)) {
            event = event || window.event;
            handle.keyPress(event.keyCode);
         }
      }

      function enableTouchEvent(event) {
         if (event.touches !== undefined) {
	    event.clientX = event.touches[0].clientX;
	    event.clientY = event.touches[0].clientY;
	 }
      }

      // MOUSE PRESSED.

      canvas.onmousedown = function(event) {
         enableTouchEvent(event);

         // RESPOND DIFFERENTLY TO LEFT AND RIGHT MOUSE BUTTONS

         if ((event.which && event.which !== 1) ||
             (event.button && event.button !== 1))
            return;

         if (sketchAction != null)
            return;

         if (pullDownIsActive)
            return;

         var handle = getHandle(this);
         var r = event.target.getBoundingClientRect();
         handle.mouseX = clientX(event) - r.left;
         handle.mouseY = clientY(event) - r.top;
         handle.mousePressedAtX = handle.mouseX;
         handle.mousePressedAtY = handle.mouseY;
         handle.mousePressedAtTime = time;
         handle.mousePressed = true;

         if (isDef(handle.mouseDown))
            handle.mouseDown(handle.mouseX, handle.mouseY);

         _g.lastX = event.clientX;
         _g.lastY = event.clientY;
      };

      // MAKE SURE BROWSER CATCHES RIGHT CLICK.

      canvas.oncontextmenu = function(event) {
         setTextMode(false);
         try {
            if (isMouseOverBackground)
               pullDownLabels = pagePullDownLabels;
            pullDownStart(handle.mouseX, handle.mouseY);
         } catch (e) {}
         return false;
      };

      // MOUSE RELEASED.

      canvas.onmouseup = function(event) {
	 event.clientX = mouseMoveClientX;
	 event.clientY = mouseMoveClientY;

         // RESPOND ONLY TO LEFT MOUSE UP, NOT TO RIGHT MOUSE UP.

         if ((event.which && event.which !== 1) ||
             (event.button && event.button !== 1))
            return;

         if (sketchAction != null) {
            switch (sketchAction) {
            case "linking":
               sketchPage.figureOutLink();
               break;
            case "translating":

               // AFTER DONE TRANSLATING A SKETCH, DO CALLBACKS IF IT DROPS ONTO OTHER SKETCHES.

               var s = sk().intersectingSketches();
               for (var i = 0 ; i < s.length ; i++) {
                  if (isDef(sk().over))
                     sk().over(s[i]);
                  if (isDef(s[i].under))
                     s[i].under(sk());
               }

	       // DRAGGING A SKETCH TO A LINK INSERTS THE SKETCH, SPLITTING THE LINK IN TWO.

               if (linkAtCursor != null) {
	          var s = linkAtCursor.s;
	          linkAtCursor.removeFromInSketch();
	          linkAtCursor.removeFromOutSketch();
	          new SketchLink(linkAtCursor.a, linkAtCursor.i, sk(), 0, s / 2);
		  var i = sk().outPortIndex(true);
	          new SketchLink(sk(), i, linkAtCursor.b, linkAtCursor.j, s / 2);
               }

               // STIll NEED TO IMPLEMENT EFFECTS OF DROPPING ONE SKETCH ONTO ANOTHER.

               if (s.length > 0) {
                  console.log(sk().glyphName + " -> " + s[0].glyphName);
                  //deleteSketch(sk());
               }

               break;
            }
            sketchAction = null;
            return;
         }

         var handle = getHandle(this);
         var r = event.target.getBoundingClientRect();
         handle.mouseX = clientX(event) - r.left;
         handle.mouseY = event.clientY - r.top;
         handle.mousePressed = false;

         // UPDATE PULLDOWN MENU SELECTION ACTION.

         if (pullDownIsActive) {
            pullDownUpdate();
            return;
         }

         if (isDef(handle.mouseUp))
            handle.mouseUp(handle.mouseX, handle.mouseY);

         _g.lastX = event.clientX;
      }

      // MOUSE IS MOVED.

      canvas.onmousemove = function(event) {
         enableTouchEvent(event);

         mouseMoveEvent = event;

	 mouseMoveClientX = event.clientX;
	 mouseMoveClientY = event.clientY;

         var handle = getHandle(this);
         var r = event.target.getBoundingClientRect();
         handle.mouseX = clientX(event) - r.left;
         handle.mouseY = clientY(event) - r.top;


         //start Lobser\\_//\\_//\\_//\\_//\\_//\\_//\\_//\\_//\\_//\\_//\\_//\\_

         if (handle.mousePressed) {
            globalStrokes.filler(handle.mousePressed,handle.mouseX,handle.mouseY);
            // console.log(globalStrokes.strokes);
         }
         else{
            globalStrokes.filler(handle.mousePressed,handle.mouseX,handle.mouseY);
            // console.log(globalStrokes.strokes);
         }

         //end Lobser\\_//\\_//\\_//\\_//\\_//\\_//\\_//\\_//\\_//\\_//\\_//\\_


         if (pullDownIsActive)
            return;

         // MOUSE IS BEING DRAGGED.

         if (handle.mousePressed) {
            if (sketchAction != null)
               return;

            if (isDef(handle.mouseDrag)) {
                if (len(handle.mouseX - handle.mousePressedAtX,
                        handle.mouseY - handle.mousePressedAtY) >= 1)
                   handle.mouseIsDragging = true;

                if (handle.mouseIsDragging)
                   handle.mouseDrag(handle.mouseX, handle.mouseY);
            }
         }

         // MOUSE IS BEING MOVED WITHOUT BUTTONS PRESSED.

         else if (isDef(handle.mouseMove))
            handle.mouseMove(handle.mouseX, handle.mouseY);

         // WHILE PSEUDO-SKETCHING: ADVANCE SKETCH AT SAME RATE AS MOUSE MOVEMENT.

         if (isk() && sk().sketchState == 'in progress' && sk().isDrawingEnabled
                                                        && sk().sketchProgress < 1) {
            var dx = handle.mouseX - sk().advanceX;
            var dy = handle.mouseY - sk().advanceY;
            var t = sqrt(dx*dx + dy*dy) / sk().sketchLength;
            sk().sketchProgress = min(1, sk().sketchProgress + t);
            sk().advanceX = handle.mouseX;
            sk().advanceY = handle.mouseY;
         }

         // HANDLE PANNING OF THE ENTIRE SKETCH PAGE.

         if (isPanning) {
            if (! isVerticalPan) _g.panX = min(0, _g.panX + event.clientX - _g.lastX);
            if (  isVerticalPan) _g.panY = min(0, _g.panY + event.clientY - _g.lastY);
         }
         _g.lastX = event.clientX;
         _g.lastY = event.clientY;
      }
   }

////////////////////////////////////////////////////////////////////////////////////
//////////////////////// LOGIC TO SUPPORT PSEUDO-SKETCHING /////////////////////////
////////////////////////////////////////////////////////////////////////////////////

   var noisy = 1, _nF = 0.03, _nA = 3;

   function _noise(x,y) { return noise2(x,y) + noise2(x/2,y/2) / 2; }
   function noiseX(x,y) { return _nA * _noise(_nF*x, _nF*y); }
   function noiseY(x,y) { return _nA * _noise(_nF*x, _nF*(y+128)); }

   function NX(x, y) { return x + noise(x/30, y/30, 100) * 2; }
   function NY(x, y) { return y + noise(x/30, y/30, 200) * 2; }

   // ADD NOISE TO THE X AND Y VALUE OF A POINT ON A LINE BEING DRAWN.

   function snx(sketch,x,y) {
      var dx = 0, dy = 0, amp = 1, seed = 0;
      if (isk() && sketch != null) {
         amp = 1 - sketch.styleTransition;
         seed = 100 * sketch.index;
         dx = sketch.tx();
         dy = sketch.ty();
         if (sketch instanceof Sketch2D) {
            dx = sketch.x2D;
            dy = sketch.y2D;
         }
      }
      return x + amp * noiseX(x - dx, y - dy + seed);
   }
   function sny(sketch,x,y) {
      var dx = 0, dy = 0, amp = 1, seed = 0;
      if (isk() && sketch != null) {
         amp = 1 - sketch.styleTransition;
         seed = 100 * sketch.index;
         dx = sketch.tx();
         dy = sketch.ty();
         if (sketch instanceof Sketch2D) {
            dx = sketch.x2D;
            dy = sketch.y2D;
         }
      }
      return y + amp * noiseY(x - dx, y - dy + seed);
   }

   // WRAPPER FUNCTIONS AROUND STARTING AND ENDING DRAWING A SKETCH.

   function _g_sketchStart() {
      _g.xp1 = sk().xStart;
      _g.yp1 = sk().yStart;
      _g.inSketch = true;
   }

   function _g_sketchEnd() {
      _g.inSketch = false;
   }

   // SET OR GET CANVAS LINE WIDTH, DEPENDING ON WHETHER AN ARGUMENT IS SPECIFIED.

   function lineWidth(w) {
      if (isDef(w))
         _g.lineWidth = w;
      return _g.lineWidth;
   }

   // MOVE_TO AND LINE_TO WHILE POSSIBLY ADDING NOISE.

   var prev_x = 0, prev_y = 0;

   function _g_moveTo(x,y) {
      if (isDrawingSketch2D) {
         var xx = x, yy = y;
         x = sk().transformX2D(xx, yy);
         y = sk().transformY2D(xx, yy);
      }
      if (noisy == 0) {
         _g.moveTo(x, y);
         prev_x = x;
         prev_y = y;
      }
      else {
         _g_sketchTo(x, y, 0);
      }
   }

   function _g_lineTo(x,y) {
      if (isDrawingSketch2D) {
         var xx = x, yy = y;
         x = sk().transformX2D(xx, yy);
         y = sk().transformY2D(xx, yy);
      }
      if (noisy == 0) {
         _g.lineTo(x, y);
         prev_x = x;
         prev_y = y;
      }
      else {
         _g_sketchTo(x, y, 1);
      }
   }

   function _g_sketchTo(x, y, isLine) {

      if (! isk())
         return;

      if (sk().isMakingGlyph) {
         if (! (sk() instanceof Sketch2D))
            y = -y;
         buildTrace(glyphTrace, x, y, isLine);
         return;
      }

      x = sk().adjustX(x);
      y = sk().adjustY(y);

      if (sk().sketchTrace != null) {
         if (sk().sketchState != 'finished' && sk().glyphTransition < 0.5)
            buildTrace(sk().trace, x, y, isLine);
         else {
            _g.lineWidth = sketchLineWidth * 0.6;
            if (! isLine)
               _g.moveTo(x, y);
            else
               _g.lineTo(x, y);
         }
         return;
      }

      var cx = x;
      var cy = y;
      var isPreview = sk().sketchState == 'in progress';

      if (_g.inSketch && _g.suppressSketching <= 0)
         sk().sp.push([x, y, isLine]);

      var xPrev = _g.suppressSketching > 0 ? _g.xp0 : _g.xp1;
      var yPrev = _g.suppressSketching > 0 ? _g.yp0 : _g.yp1;

      var dx = x - xPrev;
      var dy = y - yPrev;
      var d = sqrt(dx*dx + dy*dy);

      if (_g.inSketch && sk().sketchState == 'in progress'
                      && _g.suppressSketching <= 0) {
         sk().dSum += d;
         var t = sk().sketchProgress;
         if (t < sk().dSum / sk().sketchLength) {
            var dSave = d;
            d = t * sk().sketchLength - (sk().dSum - dSave);
            cx = xPrev + dx * d / dSave;
            cy = yPrev + dy * d / dSave;
            if (d > 0) {
               cursorX = cx;
               cursorY = cy;
            }
         }
      }

      if (! isLine) {
         var sx = snx(sk(), cx, cy);
         var sy = sny(sk(), cx, cy);
         _g.moveTo(sx, sy);
      }

      else if (d > 0) {
         for (var i = 20 ; i < d ; i += 20) {
            var xx = mix(xPrev, cx, i/d);
            var yy = mix(yPrev, cy, i/d);
            var sx = snx(sk(), xx, yy);
            var sy = sny(sk(), xx, yy);
            _g.lineTo(sx, sy);
         }
         var sx = snx(sk(), cx, cy);
         var sy = sny(sk(), cx, cy);
         _g.lineTo(sx, sy);
      }

      xPrev = x;
      yPrev = y;

      if (_g.suppressSketching > 0) {
         _g.xp0 = xPrev;
         _g.yp0 = yPrev;
      }
      else {
         _g.xp1 = xPrev;
         _g.yp1 = yPrev;
      }
   }

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

   // COMPUTE THE BOUNDING BOX FOR A TRACE.

   function traceComputeBounds(trace) {
      var bounds = [];
      for (var n = 0 ; n < trace.length ; n++)
         bounds.push(computeCurveBounds(trace[n]));
      return bounds;
   }

   // RESAMPLE ALL OF THE CURVES OF A TRACE.

   function resampleTrace(src) {
      var dst = [];
      for (var n = 0 ; n < src.length ; n++)
         if (src[n].length > 1)
            dst.push(resampleCurve(src[n]));
      return dst;
   }

   function morphSketchToGlyphSketch(suppressTransition) {

      function drawTrace(tr) {
         _g.beginPath();
         for (var n = 0 ; n < tr.length ; n++)
            for (var i = 0 ; i < tr[n].length ; i++) {
               var x = tr[n][i][0];
               var y = tr[n][i][1];
               if (i == 0)
                  _g.moveTo(x, y);
               else
                  _g.lineTo(x, y);
            }
         _g.stroke();
      }

      var t = min(1, 2 * sk().glyphTransition);

      if (isDef(suppressTransition))
         t = 0;

      if (t == 0) {
         drawTrace(sk().sketchTrace);
         return;
      }

      if (t == 1)
         return;

      var A = sk().sketchTrace;
      var B = resampleTrace(sk().trace);

      // ADJUST FINAL SKETCH TO CREATE BEST FIT.

      if (sk().xyz.length == 0)
         sk().xyz = bestCurvesFit(B, A);

      var s = sCurve(t);
      var C = [];
      for (var n = 0 ; n < A.length ; n++) {
         C.push([]);
         for (var i = 0 ; i < A[n].length ; i++)
            C[C.length-1].push(mix(A[n][i], B[n][i], s));
      }

      _g.lineWidth = sketchLineWidth * mix(1, .6, t);
      drawTrace(C);
   }

   function buildTrace(trace, x, y, isLine) {
      if (! isLine && (trace.length == 0 ||
                       trace[trace.length-1].length > 0))
         trace.push([]);

      trace[trace.length-1].push([x,y]);

      prev_x = x;
      prev_y = y;
   }

   var isVideoLayer = function() {
      return videoLayer != null && videoLayer.bRender;
   }

   var meshOpacity = function() {
      return isVideoLayer() ? meshOpacityOverVideo : 1;
   }

   var isShowingRenderer = true; // IF THIS IS false, THREE.js STUFF BECOMES INVISIBLE.

   function addSketchType(name) {
      sketchTypesToAdd.push(name);
   }

   // LOAD ALL THE SKETCHES FROM THE SERVER'S SKETCHES FOLDER.

   function loadSketches() {
      try {
         var lsRequest = new XMLHttpRequest();
         lsRequest.open("GET", "ls_sketches");

         lsRequest.onloadend = function () {
            if (lsRequest.responseText != "") {
               var ls = lsRequest.responseText.trim().split("\n");
               for (var n = 0; n < ls.length; n++) {
	          var filename = ls[n];

		  // Ignore files with no extension.
	          var iDot = filename.indexOf('.');
		  if (iDot < 0)
		     continue;

		  // Ignore files that do not have the .js extension.
		  var extension = filename.substring(iDot, filename.length);
		  if (extension !== '.js')
		     continue;

		  // Ignore the ignoredSketches.
		  var name = filename.substring(0, iDot);
		  if (getIndex(ignoredSketches, name) >= 0)
		     continue;

                  importSketch(filename);
               }
            }
         }
         lsRequest.send();
      } catch (e) { }
   }

   var sketchScript = {};

   function importSketch(filename) {
      var sketchRequest = new XMLHttpRequest();
      sketchRequest.open("GET", "sketches/" + filename);
      sketchRequest.filename = filename;
      sketchRequest.onloadend = function() {

         // IF THERE IS A SYNTAX ERROR, REPORT IT.

         var error = findSyntaxError(this.responseText);
         if (error.length > 0)
            console.log("In sketches/" + this.filename + " at line " + error[0] + ": " + error[1]);

         // OTHERWISE LOAD THE NEW SKETCH TYPE.

         else {
            var script = this.responseText;
            eval(script);
            forceSetPageAtTime = time + 0.5;

            var i = script.indexOf("function "), j = script.indexOf("(");
            if (i >= 0 && j > i) {
               var type = script.substring(i + 9, j).trim();
               sketchScript[type] = script;
            }
         }
      }
      sketchRequest.send();
   }

   // MUST BE CALLED WHEN WEB PAGE LOADS.

   function gStart() {

/*
var harry = { fred: 10 };
console.log(harry.fred);
harry._foobar = function() { this.fred = 20; }
eval('harry._foobar()');
console.log(harry.fred);
*/

      preLoadObjs();

      // PREVENT DOUBLE CLICK FROM SELECTING THE CANVAS:

      var noSelectHTML = ""
      + " <style type='text/css'>"
      + " canvas {"
      + " -webkit-touch-callout: none;"
      + " -webkit-user-select: none;"
      + " -khtml-user-select: none;"
      + " -moz-user-select: none;"
      + " -ms-user-select: none;"
      + " user-select: none;"
      + " outline: none;"
      + " -webkit-tap-highlight-color: rgba(255, 255, 255, 0);"
      + " }"
      + " </style>"
      ;
      var headElement = document.getElementsByTagName('head')[0];
      headElement.innerHTML = noSelectHTML + headElement.innerHTML;

      // ADD VIEWER ELEMENTS TO DOCUMENT

      var viewerHTML = ""
      + " <canvas id='video_canvas' tabindex=1"
      + "    style='z-index:1;position:absolute;left:0;top:0;'>"
      + " </canvas>"
      + " <div id='slide' tabindex=1"
      + "    style='z-index:1;position:absolute;left:0;top:0;'>"
      + " </div>"
      + " <canvas id='sketch_canvas' tabindex=1"
      + "    style='z-index:1;position:absolute;left:0;top:0;'>"
      + " </canvas>"
      +
      (isShowingRenderer
       ?
           " <div id='scene_div' tabindex=1"
         + "    style='z-index:1;position:absolute;left:0;top:0;'>"
         + " </div>"
       :
           " <!!div id='scene_div' tabindex=1"
         + "    style='z-index:1;position:absolute;left:0;top:0;'>"
         + " <!!/div>"
      )
      + " <canvas id='events_canvas' tabindex=1"
      + "    style='z-index:1;position:absolute;left:0;top:0;'>"
      + " </canvas>"
      + " <hr id='background' size=1024 color='" + backgroundColor + "'>"
      + " <div id='code'"
      + "    style='z-index:1;position:absolute;left:0;top:0;'>"
      + " </div>"
      // + " <div id='dat-gui' style='z-index:10;position:absolute;'></div>"
      ;
      var bodyElement = document.getElementsByTagName('body')[0];
      bodyElement.innerHTML = viewerHTML + bodyElement.innerHTML;

      // SET ALL THE SCREEN-FILLING ELEMENTS TO THE SIZE OF THE SCREEN.

      slide.width = width();
      sketch_canvas.width = width();
      events_canvas.width = width();

      slide.height = height();
      sketch_canvas.height = height();
      events_canvas.height = height();

      background.style.backgroundColor = backgroundColor;

      // INITIALIZE THE SKETCH CANVAS

      sketch_canvas.animate = function(elapsed) { sketchPage.animate(elapsed); }
      sketch_canvas.overlay = function() { sketchPage.overlay(); }
      sketch_canvas.setup = function() {
         window.onbeforeunload = function(e) { sketchBook.onbeforeunload(e); }
         setPage(0);
      }

      events_canvas.keyDown   = function(key)  { e2s(); sketchPage.keyDown(key); }
      events_canvas.keyUp     = function(key)  { e2s(); sketchPage.keyUp(key); }
      events_canvas.mouseDown = function(x, y) { e2s(); sketchPage.mouseDown(x, y); }
      events_canvas.mouseDrag = function(x, y) { e2s(); sketchPage.mouseDrag(x, y); }
      events_canvas.mouseMove = function(x, y) { e2s(); sketchPage.mouseMove(x, y); }
      events_canvas.mouseUp   = function(x, y) { e2s(); sketchPage.mouseUp(x, y); }

      fourStart();

      if (window['scene_div'] !== undefined) {
         scene_div.width = width();
         scene_div.height = height();
         var sceneElement = document.getElementById('scene_div');
         sceneElement.appendChild(renderer.domElement);
      }

      // START ALL CANVASES RUNNING

      var c = document.getElementsByTagName("canvas");
      for (var i = 0 ; i < c.length ; i++)
          if (c[i].getAttribute("data-render") != "gl")
             startCanvas(c[i].id);


      // GET VIDEO CANVAS
      video_canvas = document.getElementById('video_canvas');
      video_canvas.width = width();
      video_canvas.height = height();
   }

   function e2s() {
      sketch_canvas.mouseX = events_canvas.mouseX;
      sketch_canvas.mouseY = events_canvas.mouseY;
      sketch_canvas.mousePressedAtX = events_canvas.mousePressedAtX;
      sketch_canvas.mousePressedAtY = events_canvas.mousePressedAtY;
      sketch_canvas.mousePressedAtTime = events_canvas.mousePressedAtTime;
      sketch_canvas.mousePressed = events_canvas.mousePressed;
   }

   var updateScene = 0, pixelsPerUnit = 97;

   function This() { return window[_g.name]; }

   function startCanvas(name) {
      if (name.length == 0)
         return;

      var _canvas = document.getElementById(name);
      if (name == 'events_canvas') {
         initEventHandlers(_canvas);
         return;
      }
      else if (name == 'video_canvas') {
         // ignore video_canvas
         return;
      }

      window.requestAnimFrame = (function(callback) {
      return window.requestAnimationFrame ||
             window.webkitRequestAnimationFrame ||
             window.mozRequestAnimationFrame ||
             window.oRequestAnimationFrame ||
             window.msRequestAnimationFrame ||
             function(callback) { window.setTimeout(callback, 1000 / 60); }; })();

      var g = _canvas.getContext('2d');
      g.textHeight = 12;
      g.lineCap = "round";
      g.lineJoin = "round";
      g.canvas = _canvas;
      g.name = name;
      sketchPage.clear();

      _g = g;
      _g.clearRect(0, 0, _g.canvas.width, _g.canvas.height);
      This().setup();

      pixelsPerUnit = 5.8635 * height() / cameraFOV;
      pixelsPerUnit = 5.8635 * height() / cameraFOV;

      // LOAD ALL THE SCRIBBLE GLYPHS.

      function nameToGlyph(name) {
         var scribble = new Scribble(name);
         var glyph = new Glyph(name, [scribble]);
         glyph.scribbleLength = computeCurveLength(scribble);
         return glyph;
      }

      for (var n = 0 ; n < glyphs.length ; n++) {
         var name = glyphs[n].indexName;
         scribbleGlyphs.push(nameToGlyph(name));
      }

      for (var n = 0 ; n < scribbleNames.length ; n++) {
         var name = scribbleNames[n];
         if (glyphIndex(scribbleGlyphs, name) == -1)
            addGlyph(scribbleGlyphs, nameToGlyph(name));
      }

      // LOAD ALL THE SKETCHES FROM THE SERVER'S SKETCHES FOLDER.

      loadSketches();

//server.set("state/foobar", "1234");

      setInterval( function() { tick(g); }, 1000 / 60);
   }

   var sketchType = 0;
   var pageIndex = 0;

   function colorToRGB(colorName) {
      var R = 0, G = 0, B = 0;
      switch (colorName) {
      case 'white'  : R = 0.9; G = 0.9; B = 0.9; break;
      case 'black'  : R = 0.7; G = 0.7; B = 0.7; break;
      case 'red'    : R = 1.0; G = 0.0; B = 0.0; break;
      case 'orange' : R = 1.0; G = 0.5; B = 0.0; break;
      case 'green'  : R = 0.0; G = 0.6; B = 0.0; break;
      case 'blue'   : R = 0.0; G = 0.0; B = 1.0; break;
      case 'magenta': R = 1.0; G = 0.0; B = 1.0; break;
      default       : R = 0.5; G = 0.2; B = 0.1; break;
      }
      return [R, G, B];
   }

   function drawPalette(context) {
      if (context == undefined)
         context = _g;

      var w = width(), h = height(), nc = palette.length;

      annotateStart(context);
      for (var n = 0 ; n < nc ; n++) {
         var x = paletteX(n);
         var y = paletteY(n);
         var r = paletteR(n);

         context.fillStyle = palette[n];
         context.beginPath();
         context.moveTo(x - r, y - r);
         context.lineTo(x + r, y - r);
         context.lineTo(x + r, y + r);
         context.lineTo(x - r, y + r);
         context.fill();
      }
      annotateEnd(context);
   }

   var hotKeyMenu = [
      ['a'  , "toggle audience"],
      ['b'  , "bend line"],
      ['c'  , "toggle card"],
      ['d'  , "show/hide data"],
      ['e'  , "edit code"],
      ['g'  , "group/ungroup"],
      ['h'  , "draw hint lines"],
      ['i'  , "insert text"],
      ['j'  , "joined stroke"],
      ['k'  , "toggle char glyphs"],
      ['l'  , "toggle edge render"],
      ['m'  , "toggle menu type"],
      ['n'  , "negate card color"],
      ['o'  , "output glyphs"],
      ['p'  , "pan"],
      ['r'  , "rotating"],
      ['s'  , "scaling"],
      ['t'  , "translating"],
      ['v'  , "toggle video layer"],
      ['w'  , "toggle whiteboard"],
      ['x'  , "toggle expert mode"],
      ['y'  , "toggle scribble glyphs"],
      ['z'  , "zoom"],
      ['#'  , "toggle graph paper"],
      ['-'  , "b/w <-> w/b"],
      ['='  , "show glyphs"],
      ['/'  , "pan up/down or L/R"],
      ['spc', "quick help menu"],
      ['alt', "clone"],
      ['del', "remove last stroke"],
      [U_ARROW, "previous page"],
      [D_ARROW, "next page"],

   ];

   var cloneObject = null;
   var dataColor = 'rgb(128,128,128)'
   var dataLineWidth = 2.4;
   var globalSketchId = 0;
   var linkDeleteColor = 'rgba(255,0,0,.1)';
   var linkHighlightColor = 'rgba(0,192,96,.2)';
   var liveDataColor = 'rgb(128,192,255)'
   var overlayColor = 'rgb(0,96,255)';
   var overlayClearColor = function() { return backgroundColor != 'white' ? 'rgba(192,224,255,.5)' : 'rgba(0,96,255,.5)'; }
   var overlayScrim = 'rgba(0,96,255,.25)';
   var portColor = 'rgb(0,192,96)';
   var portBgColor = backgroundColor;
   var portHeight = 24;
   var portHighlightColor = 'rgb(192,255,224)';
   var sketchLineWidth = 4;

   function addSketchOfType(i) {
      eval("addSketch(new " + sketchTypes[i] + "())");
   }

   function sketchTypeToCode(type, selection) {
      return "sg('" + type + "','" + selection + "')";
   }

   function registerSketch(type) {

      var names = [];

      // CREATE A TEMPORARY INSTANCE OF THIS SKETCH TYPE.

      eval("addSketch(new " + type + "())");
      sketchTypeLabels.push(sk().labels);

      // RENDER EACH OF ITS SELECTIONS ONCE TO CREATE GLYPH INFO.

      for (var n = 0 ; n < sk().labels.length ; n++) {
         sk().setSelection(sk().labels[n]);

         // CREATE GLYPH SHAPE INFO.

         glyphTrace = [];
         sk().isMakingGlyph = true;
         sk().renderWrapper(0.02);
         sk().isMakingGlyph = undefined;

         // REGISTER THE GLYPH.

         var code = sketchTypeToCode(type, sk().labels[n]);
         names.push(registerGlyph(code, glyphTrace, sk().labels[n]));
      }

      // FINALLY, DELETE THE SKETCH.

      deleteSketch(sk());

      return names;
   }

   // CREATE AN INSTANCE OF A REGISTERED SKETCH TYPE.

   function sg(type, selection) {

      var bounds = computeGlyphSketchBounds();
      This().mouseX = (bounds[0] + bounds[2]) / 2;
      This().mouseY = (bounds[1] + bounds[3]) / 2;

      eval("addSketch(new " + type + "())");

      sk().typeName = type;

      sk().width = bounds[2] - bounds[0];
      sk().height = bounds[3] - bounds[1];
      sk().setSelection(selection);
      if (glyphSketch != null) {
         sk().sketchTrace = resampleTrace(glyphSketch.toTrace());
         sk().glyphTransition = 0;
         sk().trace = [];
      }
      else
         sk().glyphTransition = 1;

      sk().size = 2 * max(sk().width, sk().height);

      if (sk().computeStatistics != null)
         sk().computeStatistics();
   }

   function drawGroupPath(groupPath) {
      if (groupPath == null)
         return;
      color(scrimColor(0.3));
      lineWidth(width() / 100);
      _g.beginPath();
      for (var i = 0 ; i < groupPath.length ; i++) {
         var x = groupPath[i][0];
         var y = groupPath[i][1];
         if (i == 0)
            _g.moveTo(x,y);
         else
            _g.lineTo(x,y);
      }
      _g.stroke();
   }

/////////////////////////////////////////////////////////////////////
/////////////////////// LINKS AND DATA PORTS ////////////////////////
/////////////////////////////////////////////////////////////////////

   function computeLinkCurvature(link, C) {
      link.s = computeCurvature(link.a.portXY(link.i), C, link.b.portXY(link.j));
      link.status = undefined;
   }

   var portDataValues = [], outSketchPrev = null, outPortPrev = -1;

   function drawPortData(sketch, port, dataValues, isAlwaysDrawing) {
      if (isAlwaysDrawing === undefined || ! isAlwaysDrawing) {
         var lo = 100000, hi = -100000;
         for (var i = 0 ; i < dataValues.length ; i++) {
            lo = min(lo, dataValues[i]);
            hi = max(hi, dataValues[i]);
         }
         if (hi - lo < 0.1)
            return;
      }

      var xy = sketch.portXY(port);

      lineWidth(1);
      _g.beginPath();
      for (var i = 0 ; i < dataValues.length ; i++) {
         var x = xy[0] + 2 * i;
         var y = xy[1] - 2 * 30 * dataValues[i];
         if (i == 0)
            _g.moveTo(x, y);
         else
            _g.lineTo(x, y);
      }
      _g.stroke();
   }

   function drawPossibleLink(s, x, y) {
      lineWidth(dataLineWidth);
      color(dataColor);
      if (s.linkCurve != null) {
         var C = s.linkCurve;
         drawCurve(createCurve(C[0], C[C.length-1], computeCurvature(C)));
      }
      else {
         var xy = s.portXY(outPort);
         arrow(xy[0], xy[1], x, y);
      }
   }

   function findOutSketchAndPort() {
      outSketch = isHover() ? sk() : null;
      outPort = -1;
      if (outSketch != null) {
         outPort = findOutPortAtCursor(outSketch);
         inSketch = null;
         inPort = -1;
      }
   }

   function findInSketchAndPort() {
      inSketch = null;
      inPort = -1;
      for (var I = nsk() - 1 ; I >= 0 ; I--)
         if (isLinkTargetSketch(sk(I))) {
            if ((inPort = findNearestInPort(sk(I))) >= 0)
               inSketch = sk(I);
            break;
         }
   }

   function isLinkTargetSketch(s) {
      return s != outSketch && s.parent == null
                            && s.contains(sketchPage.mx, sketchPage.my);
   }

   var linkAtCursor = null;
   var arrowAtCursor = null;
   var outSketch = null, inSketch = null;
   var outPort = -1, inPort = -1;

   function findNearestInPort(sketch) {
      return sketch == null ? -1 :
             sketch.portName.length > 0 ? findNearestPortAtCursor(sketch, sketch.in, true)
                                        : firstUndefinedArrayIndex(sketch.in);
   }

   function findNearestOutPort(sketch) {
      if (sketch.portName.length == 0)
         return 0;
      var i = findNearestPortAtCursor(sketch);
      if (outValue[i] == undefined)
         return -1;
      return i;
   }

   function findNearestPortAtCursor(sketch, slots, isOnlyInPorts) {
      if (isOnlyInPorts === undefined)
         isOnlyInPorts = false;
      var x = This().mouseX;
      var y = This().mouseY;
      var n = -1, ddMin = 10000;
      for (var i = 0 ; i < sketch.portName.length ; i++) {
         if (isOnlyInPorts && sketch.portName[i] == "out")
	    continue;
         if ((slots === undefined) || slots[i] == null) {
            var xy = sketch.portXY(i);
            var dd = (xy[0]-x)*(xy[0]-x) + (xy[1]-y)*(xy[1]-y);
            if (dd < ddMin) {
               n = i;
               ddMin = dd;
            }
         }
      }
      return n;
   }

   function findOutPortAtCursor(sketch) {
      if (sketch instanceof NumericSketch ||
          sketch instanceof SimpleSketch &&
                 (! sketch.isNullText() || isDef(sketch.inValue[0])))
         return sketch.isMouseOver ? 0 : -1;
      var x = This().mouseX;
      var y = This().mouseY;
      for (var i = 0 ; i < sketch.portName.length ; i++)
         if (sketch.outValue[i] !== undefined) {
            var xy = sketch.portXY(i);
            if ( x >= xy[0] - portHeight/2 && x < xy[0] + portHeight/2 &&
                 y >= xy[1] - portHeight/2 && y < xy[1] + portHeight/2 )
               return i;
         }
      return -1;
   }

   function deleteLinkAtCursor() {
      linkAtCursor.removeFromOutSketch();
      linkAtCursor.removeFromInSketch();
   }

   function isSimpleSketch(s) {
      return s instanceof SimpleSketch && ! (s instanceof GeometrySketch);
   }

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

   function finishDrawingUnfinishedSketch() {
      if (! pullDownIsActive && isk()
                           && ! isHover()
                           && sk().sketchState != 'finished') {
         finishSketch();
      }
   }

   function finishSketch(sketch) {
      if (sketch === undefined)
         sketch = sk();
      sketch.sketchProgress = 1;
      sketch.cursorTransition = 1;
      sketch.styleTransition = 1;
      sketch.sketchState = 'finished';
   }

   function isFinishedDrawing() {
      return isk() && sk().sketchState == 'finished';
   }

   function isMouseNearCurve(c) {
      return dsqFromCurve(This().mouseX, This().mouseY, c) < 10 * 10;
   }

   function moveChildren(children, dx, dy) {
      for (var i = 0 ; i < children.length ; i++) {
         children[i].tX += dx;
         children[i].tY += dy;
         children[i].textX += dx;
         children[i].textY += dy;
         if (children[i] instanceof Sketch2D) {
            children[i].x2D += children[i].unadjustD(dx);
            children[i].y2D += children[i].unadjustD(dy);
         }
      }
   }

   function setTextMode(state) {
      isTextMode = state;
      if (isTextMode)
         loadGlyphArray(characterGlyphData);
      else
         unloadGlyphArray(characterGlyphData);
      delete sketchPage.isPortValueTextMode;
      return isTextMode;
   }

   function toggleTextMode(sketch) {
      if (setTextMode(! isTextMode)) {
         isShiftPressed = false;
         if (sketch === undefined) {
            addSketch(new SimpleSketch());
            sk().sketchProgress = 1;
            sk().sketchState = 'finished';
            sk().textX = sk().tX = This().mouseX;
            sk().textY = sk().tY = This().mouseY;
         }
         else if (sk().text.length == 0) {
            sketch.textX = sk().tx();
            sketch.textY = sk().ty();
         }
      }
   }

   var strokes = [];
   var strokesStartTime = 0;
   var strokesGlyph = null;

   function findGlyph(strokes, glyphs) {
      if (strokes.length == 0 || strokes[0].length < 2)
         return null;

      strokesGlyph = new Glyph("", strokes);

      if (isCreatingGlyphData)
         console.log(strokesGlyph.toString());

      var bestMatch = 0;
      var bestScore = 10000000;
      for (var i = 0 ; i < glyphs.length ; i++) {

         if (glyphs[i].scribbleLength !== undefined && strokesGlyph.scribbleLength === undefined)
            strokesGlyph.scribbleLength = computeCurveLength(strokes[0]) / scribbleScale;

         var score = strokesGlyph.compare(glyphs[i]);
         if (score < bestScore) {
            bestScore = score;
            bestMatch = i;
         }
      }
      return glyphs[bestMatch];
   }

   function strokesComputeBounds(src, i0) {
      if (i0 === undefined) i0 = 0;
      var xlo = 10000, ylo = xlo, xhi = -xlo, yhi = -ylo;
      for (var n = 0 ; n < src.length ; n++)
         for (var i = i0 ; i < src[n].length ; i++) {
            xlo = min(xlo, src[n][i][0]);
            ylo = min(ylo, src[n][i][1]);
            xhi = max(xhi, src[n][i][0]);
            yhi = max(yhi, src[n][i][1]);
         }
      return [xlo,ylo,xhi,yhi];
   }

   function strokesNormalize(src) {
      var B = strokesComputeBounds(src);
      var cx = (B[0] + B[2]) / 2;
      var cy = (B[1] + B[3]) / 2;
      var scale = 1 / max(B[2] - B[0], B[3] - B[1]);
      var dst = [];
      for (var n = 0 ; n < src.length ; n++) {
         dst.push([]);
         for (var i = 0 ; i < src[n].length ; i++)
            dst[n].push([ (src[n][i][0] - cx) * scale,
                          (src[n][i][1] - cy) * scale ]);
      }
      return dst;
   }

   function unregisterGlyph(indexName) {
      for (var i = 0 ; i < glyphs.length ; i++)
         if (indexName == glyphs[i].indexName)
            glyphs.splice(i--, 0);
   }

   function registerGlyph(name, strokes, indexName) {
      if (indexName === undefined) {
         indexName = name;
         var j = indexName.indexOf('Sketch');
         if (j > 0)
            indexName = indexName.substring(0, j);
         var j = indexName.indexOf('(');
         if (j > 0)
            indexName = indexName.substring(0, j);
      }

      for (var i = 0 ; i < glyphs.length ; i++)
         if (indexName == glyphs[i].indexName)
            return;

      if (name.indexOf("sg(") < 0 && typeof(strokes[0]) != 'string')
         for (var n = 0 ; n < strokes.length ; n++)
            for (var i = 0 ; i < strokes[n].length ; i++)
               strokes[n][i][1] *= -1;

      var glyph = new Glyph(name, strokes);
      glyph.indexName = indexName;

      for (var i = 0 ; i < glyphs.length ; i++)
         if (indexName < glyphs[i].indexName) {
            glyphs.splice(i, 0, glyph);
            return glyph.indexName;
         }

      glyphs.push(glyph);
      return glyph.indexName;
   }

   function Glyph(name, src) {

      this.src = src;

      this.toString = function() {
         var str = '"' + this.name + '",\n';
         str += '[';
         for (var n = 0 ; n < this.data.length ; n++) {
            str += '"';
            for (var i = 0 ; i < this.data[n].length ; i++)
               str += ef.encode(this.data[n][i][0] / 100)
                    + ef.encode(this.data[n][i][1] / 100);
            str += '",';
         }
         str += '],';
         return str;
      }

      this.compare = function(other) {
         if (this.data.length != other.data.length)
            return 1000000;
         var score = 0;
         for (var n = 0 ; n < this.data.length ; n++) {
            for (var i = 0 ; i < this.data[n].length ; i++) {
               var dx = this.data[n][i][0] - other.data[n][i][0];
               var dy = this.data[n][i][1] - other.data[n][i][1];
               score += dx * dx + dy * dy;
            }

            // IF GLYPHS ARE SCRIBBLES, THEY NEED TO BE OF SIMILAR LENGTH.

            if ( this.scribbleLength  !== undefined && this.scribbleLength  > 0 &&
                 other.scribbleLength !== undefined && other.scribbleLength > 0 ) {
               var ratio = other.scribbleLength / this.scribbleLength;
               score *= max(ratio, 1 / ratio);
            }
         }
         return score;
      }

      this.toSimpleSketch = function(tx, ty, sc) {
         var s = new SimpleSketch();
         for (var n = 0 ; n < this.data.length ; n++)
            for (var i = 0 ; i < this.data[n].length ; i++) {
               var x1 = sc * this.data[n][i][0] - 50;
               var y1 = sc * this.data[n][i][1] - 50;
               var x = x1 + 2*sc * noise2(x1 / 30, y1 / 30);
               var y = y1 + 2*sc * noise2(x1 / 30, y1 / 30 + 100);
               s.sp0.push([x,y]);
               s.sp.push([x,y,i>0]);
            }
         sketchPage.add(s);
         finishSketch();
         s.setColorId(sketchPage.colorId);
         s.tX = tx;
         s.tY = ty;
      }

      this.toSketch = function() {

         // IF A '(' IS FOUND, CALL A FUNCTION.

         if (this.name.indexOf('(') > 0) {
            eval(this.name);
         }

         // IF GLYPH IS A DIGIT, CREATE A NUMBER OBJECT.

         else if (isNumeric(parseInt(this.name))) {
            var s = new NumericSketch();
            addSketch(s);
            s.init(this.name, sketchPage.x, sketchPage.y);
            s.textCursor = s.text.length;
            setTextMode(true);
         }

         // DEFAULT: CREATE A TEXT OBJECT.

         else if (this.name != 'del') {
            sketchPage.createTextSketch(this.name);
            setTextMode(true);
         }

         // USE THE TYPE OF THIS GLYPH TO DEFINE A GLYPH NAME FOR THE SKETCH.

         sk().glyph = this;
         sk().glyphName = this.indexName;
      }

      this.name = name;
      this.data = [];

      if (src.length > 0 && typeof(src[0]) == 'string') {
         for (var n = 0 ; n < src.length ; n++) {
            this.data.push([]);
            for (var i = 0 ; i < src[n].length ; i += 2)
               this.data[n].push([ 100 * ef.decode(src[n].substring(i,i+1)),
                                   100 * ef.decode(src[n].substring(i+1,i+2)) ]);
         }
         return;
      }

      var N = 100;

      // MOVE AND SCALE STROKES TO FIT WITHIN A UNIT SQUARE.

      var strokes = strokesNormalize(src);

      for (var n = 0 ; n < strokes.length ; n++) {

         // RESCALE EACH STROKE TO FIT WITHIN A 100x100 PIXEL SQUARE.

         var stroke = strokes[n];
         for (var i = 0 ; i < stroke.length ; i++) {
            stroke[i][0] = 50 + 100 * stroke[i][0];
            stroke[i][1] = 50 + 100 * stroke[i][1];
         }

         // COMPUTE FRACTIONAL LENGTHS ALONG STROKE.

         var ns = stroke.length;

         var f = [0], sum = 0;
         for (var i = 1 ; i < ns ; i++)
             f.push(sum += len(stroke[i][0] - stroke[i-1][0],
                               stroke[i][1] - stroke[i-1][1]));
         for (var i = 0 ; i < ns ; i++)
             f[i] /= sum;

         // RESAMPLE TO 100 EQUAL-LENGTH SAMPLES.

         this.data.push([]);
         var i = 0;
         for (var j = 0 ; j < N ; j++) {
            var t = j / (N-1);
            while (i < ns && f[i] <= t)
               i++;
            if (i == ns) {
               this.data[n].push([stroke[ns-1][0], stroke[ns-1][1]]);
               break;
            }
            var u = (t - f[i-1]) / (f[i] - f[i-1]);
            if (i == 0)
               this.data[n].push([stroke[i][0], stroke[i][1]]);
            else
               this.data[n].push(mix(stroke[i-1], stroke[i], u));
         }
      }
   }

   var isCreatingGlyphData = false;

   function shift(textChar) {
      if (isShiftPressed && textChar.length == 1) {
         var ch = textChar.charCodeAt(0);
         textChar = String.fromCharCode(ch - 32);
      }
      else if (isNumericShorthandMode && textChar.length == 1) {
         var ch = textChar.charCodeAt(0);
         textChar = String.fromCharCode(ch - 64);
      }
      return textChar;
   }

   var isBgActionEnabled = false;
   var isSketchDragEnabled = false;
   var sketchDragMode = -1;
   var sketchDragActionXY = [0,0];
   var sketchDragActionSize = [0,0];

/////////////////////// HANDLE BACKGROUND SCRIBBLES /////////////////////////

   //var scribbleNames = "a b c d e f g h i j k l m n o p q r s t u v w x y z now is the time for all good men to come aid of their party C D N P".split(' ');
   var scribbleNames = "a b c d e f g h i j k l m n o p q r s t u v w x y z C D N P".split(' ');
   var scribbleGlyphs = [];

//        3stu4
//   5vCw6     1_r_2
//
// 7xDy8         mnopq
//
//   9zab0     jhilk
//        cdefg

   function Scribble(str) {
      var charIndex = "9zab0 cdefg jhilk mnopq 1ArB2 3stu4 5vCw6 7xDy8";
      var charDir   = "55555 66666 77777 00000 11111 22222 33333 44444";
      var charShape = "<(|)> <(|)> <(|)> <(|)> <(|)> <(|)> <(|)> <(|)>";
      var s = [[0,0]];
      for (var i = 0 ; i < str.length ; i++) {
         var ch = str.substring(i, i+1);
         var n = charIndex.indexOf(ch);
         var dir = -charDir.substring(n, n+1);
         var shape = charShape.substring(n, n+1);
         var C = cos(TAU * dir / 8);
         var S = sin(TAU * dir / 8);
         function xf(pts, xy) {
            for (var k = 0 ; k < pts.length ; k++) {
               var x = pts[k][0], y = pts[k][1];
               pts[k][0] = xy[0] + C * x - S * y;
               pts[k][1] = xy[1] + S * x + C * y;
            }
            return pts;
         }
         function arced(c) {
            var p = [];
            for (var k = 1 ; k <= 10 ; k++) {
               var t = k / 10;
               p.push([t, c * t * (1 - t) * 1.3]);
            }
            return p;
         }
         function curly(c) {
            var p = [];
            for (var k = 1 ; k <= 10 ; k++) {
               var t = k / 10;
               var x = t + sin(TAU * t) / 2.5;
               var y = c * (1 - cos(TAU * t)) / 4;
               p.push([x, y]);
            }
            return p;
         }
         var ep = s[s.length - 1];
         switch (shape) {
         case "<": s = s.concat(xf(curly( 1), ep)); break;
         case "(": s = s.concat(xf(arced( 1), ep)); break;
         case "|": s = s.concat(xf(arced( 0), ep)); break;
         case ")": s = s.concat(xf(arced(-1), ep)); break;
         case ">": s = s.concat(xf(curly(-1), ep)); break;
         }
      }
      return s;
   }

   function glyphIndex(glyphs, name) {
      for (var i = 0 ; i < glyphs.length ; i++)
         if (glyphs[i].indexName == name)
            return i;
      return -1;
   }

   function addGlyph(glyphs, glyph) {
      for (var i = 0 ; i < glyphs.length ; i++)
         if (glyph.name < glyphs[i].name) {
            glyphs.splice(i, 0, glyph);
            return;
         }
      glyphs.push(glyph);
   }

   function scribbleColor() {
      return backgroundColor == 'white' ? 'rgb(  0, 112, 128)'
                                        : 'rgb(128, 224, 255)';
   }

   function BgScribble(x, y) {
      this.path = [[x,y]];
      this.index = 0;
      this.draw = function() {
         color(scribbleColor());

         lineWidth(1);
         var r = margin / 5;
         drawOval(this.path[0][0] - r, this.path[0][1] - r, 2 * r, 2 * r);

         lineWidth(0.5);
         drawCurve(this.path);
      }
      this.drag = function(x, y) {
         this.path.push([x, y]);
      }
      this.interpret = function() {
         var glyph = findGlyph([this.path], scribbleGlyphs);
         scribbleScale = mix(scribbleScale, computeCurveLength(this.path) / glyph.pathLength, 0.1);
         return glyph == null ? "" : glyph.name;
      }
   }
   var bgs, bgsText = "", bgsTextUndo = [];
   var isBgsDelete = false, isBgsShift = false, isBgsNumeric = false;

   function bgActionDown(x, y) {

      // IF ALREADY IN SCRIBBLE-TEXT MODE, START NEXT WORD.

      if (bgs !== undefined)
         bgs.path[0] = [x, y];

      // ELSE IF LINE STARTS AT CLICK, ENTER SCRIBBLE-TEXT MODE.

      else if (len(x - bgClickX, y - bgClickY) < clickSize) {
/*
         bgs = new BgScribble(x, y);
         bgsText = "";
         bgsTextUndo = [];
         sketchPage.beginTextSketch();
*/
      }

      else {
         var bgCommand = pieMenuIndex(bgClickX - x, bgClickY - y, 8);
         switch(bgCommand) {
         case 1:
            sketchPage.isGlyphable = ! sketchPage.isGlyphable;
            break;
         }
      }
   }

   function bgActionDrag(x, y) {

      // ADD NEXT POINT TO SCRIBBLE-TEXT STROKE.

      if (bgs !== undefined)
         bgs.drag(x, y);
   }

   function bgActionUp(x, y) {

      // HANDLE A SCRIBBLE-TEXT STROKE.

      if (bgs !== undefined) {
         var str = bgs.interpret();
         switch (str) {
         case "C":
            isBgsShift = true;
            break;
         case "D":
            if (bgsTextUndo.length > 0) {
               bgsText = bgsTextUndo.splice(bgsTextUndo.length - 1, 1)[0];
               sk().setText(bgsText);
               sk().textCursor = bgsText.length;
            }
            break;
         default:
            bgsTextUndo.push(bgsText);
            if (bgsText.length > 0 && str.length > 1)
               bgsText += " ";
            if (isBgsShift) {
               str = str.substring(0, 1).toUpperCase() + str.substring(1, str.length);
               isBgsShift = false;
            }

            if (bgsText.length == 0)
               for (var n = 0 ; n < glyphs.length ; n++)
                  if (str == glyphs[n].indexName) {
                     sk().setText(str);
                     convertTextSketchToGlyphSketch(sk(), bgClickX, bgClickY);
                     bgActionEnd();
                     return;
                  }

            bgsText += str;
            sk().setText(bgsText);
            sk().textCursor = bgsText.length;
            break;
         }
         bgs = new BgScribble(x, y);
         return;
      }

      var x0 = bgClickX;
      var y0 = bgClickY;
      var x1 = sketchPage.xDown;
      var y1 = sketchPage.yDown;

      var n1 = pieMenuIndex(x0 - x1, y0 - y1, 8);

      // n1 = POSITION OF THE FIRST CLICK WRT THE SECOND CLICK.

      if (len(x - x1, y - y1) < clickSize) {
         bgGesture(n1);
         return;
      }

      var sketches = sketchPage.sketchesAt(x, y);
      if (sketches.length == 0)

         // POSITION OF START OF SWIPE WRT END OF SWIPE.

         bgGesture(n1, pieMenuIndex(x1 - x, y1 - y, 8));

      else {

         // POSITION OF START OF SWIPE WRT CENTER OF THE SKETCH.

         var s = sketches[0];
         bgGesture(n1, pieMenuIndex(x1 - s.cx(), y1 - s.cy(), 8), s);
      }
   }

   function bgActionEnd(x, y) {

      // EXIT SCRIBBLE-TEXT MODE.

      bgs = undefined;
      bgsText = "";
      bgsTextUndo = [];
      setTextMode(false);
   }

/////////////////////////////////////////////////////////////////////////////

   function directionsToPage(n1, n2) { return 8 * n1 + n2; }
   function pageToDirections(page) { return [ floor(page / 8), page % 8 ]; }

   // THIS NEEDS TO BE BUILT OUT INTO A FLEXIBLE PROGRAMMER DEFINED MAPPING.

   function bgGesture(n1, n2, s) {
console.log("bgGesture(" + n1 + "," + n2 + "," + s + ")");
      if (n2 === undefined) {
         switch (n1) {
         case 2: setPage(pageIndex - 1); break;
         case 6: setPage(pageIndex + 1); break;
         }
      }
      else if (s === undefined) {
         sketchPage.setPageInfo = { x: sketchPage.x, y: sketchPage.y, page: directionsToPage(n1, n2) };
         bgClickCount = 0;
      }
      else
         console.log("BG SWIPE TO SKETCH " + n1 + " " + n2 + " [" + s.glyphName + "]");
   }

   function startSketchDragAction(x, y) {
      sketchDragMode = pieMenuIndex(bgClickX - x, bgClickY - y, 8);
      switch (sketchDragMode) {
      case 2:
         sk().motionPath = [[x],[y]];
         sketchPage.definingMotion = sk().colorId;
         break;
      case 3:
         sketchDragActionXY = [x,y];
         sketchDragActionSize = [sk().xhi - sk().xlo, sk().yhi - sk().ylo];
         break;
      case 4:
         outSketch = sk();
         outPort = findOutPortAtCursor(outSketch);
	 if (outPort == -1) {
	    outPort = outSketch.getPortIndex("out");
	    if (outPort == -1) {
	       outSketch.addPort("out", 0, 0);
	       outPort = outSketch.portName.length - 1;
            }
         }
         outSketch.linkCurve = [[x,y]];
         break;
      case 5:
         if (isDef(sk().onCmdPress)) {
	    m.save();
	    computeStandardViewInverse();
	    sketchPage.skCallback('onCmdPress', x, y);
	    m.restore();
	 }
         break;
      case 6:
         sk().arrowBegin(x, y);
         break;
      }
   }

   function doSketchDragAction(x, y) {
      switch (sketchDragMode) {
      case 2:
         sk().motionPath[0].push(x);
         sk().motionPath[1].push(y);
         break;
      case 3:
         var dx = x - sketchDragActionXY[0];
         var dy = y - sketchDragActionXY[1];
         if ( abs(dx) > sketchDragActionSize[0] ||
              abs(dy) > sketchDragActionSize[1] ) {
            copySketch(sk());
            sketchDragActionXY[0] = x;
            sketchDragActionXY[1] = y;
         }
      case 4:
         if (outSketch.linkCurve !== undefined)
            outSketch.linkCurve.push([x,y]);
         break;
      case 5:
         if (isDef(sk().onCmdDrag)) {
	    m.save();
	    computeStandardViewInverse();
	    sketchPage.skCallback('onCmdDrag', x, y);
	    m.restore();
	 }
         break;
      case 6:
         sk().arrowDrag(x, y);
         break;
      case 7:
         sketchPage.isCreatingGroup = true;
         sketchPage.groupDragPath(x, y);
         break;
      }
   }

   function endSketchDragAction(x, y) {
      switch (sketchDragMode) {
      case 2:
         delete sketchPage.definingMotion;
         break;
      case 4:
         tryToSelectSketchAtCursor();

         // DRAG ENDS ON A DIFFERENT SKETCH: CREATE LINK BETWEEN SKETCHES.

         if (sk() != outSketch && sk().isMouseOver) {
            inSketch = sk();
            inPort = findNearestInPort(inSketch);
         }

         // DRAG ENDS ON BACKGROUND: CREATE LINK TO A NEW TEXT SKETCH.

         else if (sk() == outSketch && ! sk().isMouseOver) {
            inSketch = sketchPage.createTextSketch("   ");
            inPort = 0;
         }
         else
            break;

         sketchPage.createLink();
         var i = outSketch.out[outPort].length - 1;
         outSketch.out[outPort][i].s = computeCurvature(outSketch.linkCurve);

         break;
      case 5:
         if (isDef(sk().onCmdRelease)) {
	    m.save();
	    computeStandardViewInverse();
	    sketchPage.skCallback('onCmdRelease', x, y);
	    m.restore();
	 }
         break;
      case 6:
         sk().arrowEnd(x, y);
         break;
      case 7:
         sketchPage.isCreatingGroup = false;
         sketchPage.toggleGroup();
         break;
      }
      sketchDragMode = -1;
   }

   function doSketchClickAction(x, y) {

      if (bgClickCount != 1 || ! isHover())
         return false;

      // CLICK ON A SKETCH AFTER CLICK OVER THE BACKGROUND: DO SPECIAL ACTIONS.

      bgClickCount = 0;

      var index = pieMenuIndex(bgClickX - x, bgClickY - y, 8);
      switch (index) {
      case 0:
         sk().fadeAway = 1;             // E -- FADE TO DELETE
         fadeArrowsIntoSketch(sk());
         break;
      case 1:
         if (isSimpleSketch(sk()) && ! (sk() instanceof NumericSketch ))
            sk().isGlyphable = ! sk().isGlyphable;
         else if (sk().glyph !== undefined) {
            sk().fadeAway = 1;
            sk().glyph.toSimpleSketch(sk().cx(), sk().cy(), sk().size / 200 * sk().size / (sk().size - 2 * sketchPadding));
         }
         break;
      case 2:
         sketchAction = "translating";  // N -- TRANSLATE
         break;
      case 3:
         copySketch(sk());              // NW -- CLONE
         sketchAction = "translating";
         break;
      case 4:
         sketchAction = "scaling";      // W -- SCALE
         break;
      case 5:
         if (sk() instanceof SimpleSketch)
            toggleTextMode();           // SW -- IF SIMPLE SKETCH, TOGGLE TEXT MODE
         else if (isDef(sk().onCmdClick)) { //   ELSE CMD CLICK
	    m.save();
	    computeStandardViewInverse();
	    sketchPage.skCallback('onCmdClick', x, y);
	    m.restore();
	 }
         break;
      case 6:
         sketchAction = "rotating";     // S -- ROTATE
         break;
      case 7:
         sketchAction = "undrawing";    // SE -- "UNDRAW" A SIMPLE SKETCH
         sketchPage.tUndraw = 0;
         break;
      }

      return true;
   }

   function findPaletteColorIndex(x, y) {
      for (var n = 0 ; n < palette.length ; n++) {
         var dx = x - paletteX(n);
         var dy = y - paletteY(n);
            if (dx * dx + dy * dy < 20 * 20)
               return n;
      }
      return -1;
   }

   function isHover() { return isk() && sk().isMouseOver; }
   function isk() { return isDef(sk()) && sk() != null; }
   function nsk() { return sketchPage.sketches.length; }
   function sk(i) { return nsk() == 0 ? null : sketchPage.sketches[i === undefined ? sketchPage.index : i]; }

   function clear() { sketchPage.clear(); }

   function image(name, scale) {
      if (scale === undefined)
         scale = 1;
      addSketch(new Picture('imgs/' + name));
      sk().sketchState = 'in progress';
      sk().styleTransition = 0;
      sk().sketchProgress = 1;
      sk().sc = scale * (glyphSketch.xhi - glyphSketch.xlo) / 250;
   }

   var saveNoisy;

   function annotateStart(context) {
      if (context === undefined)
         context = _g;
      saveNoisy = noisy;
      noisy = 0;
      context.save();
      context.lineWidth = 1;
   }

   function annotateEnd(context) {
      if (context === undefined)
         context = _g;
      noisy = saveNoisy;
      context.restore();
   }

   var visible_sp = null;

   var ttForce = newZeroArray(1024);

   function ttTick() {
      if (tt !== undefined && tt.myState === undefined)
         tt.waitForDomReady(document, function() {
            tt.load(function(error) {
               tt.myState = new tt.State();
            });
         });
      if (tt.myState !== undefined) {
         tt.pollState(tt.myState);
         for (var i = 0 ; i < 1024 ; i++)
            ttForce[i] = tt.myState.hmd.forces[i] / 4096;
/*
var hi = -10000, lo = 10000;
for (var i = 0 ; i < 1024 ; i++) {
   hi = max(hi, ttForce[i]);
   lo = min(lo, ttForce[i]);
}
console.log(lo + " " + hi);
*/
      }
   }

   var tryToSelectSketchAtCursor = function() {
      for (var I = nsk() - 1 ; I >= 0 ; I--)
         if (sk(I).isMouseOver && sk(I).sketchState == 'finished') {
            selectSketch(I);
            break;
         }
   }

   var tick = function(g) {

//server.get("state/foobar", function(val) { console.log(val); });

      if (window.forceSetPageAtTime !== undefined && forceSetPageAtTime < time) {
         forceSetPageAtTime = undefined;
         setPage(pageIndex);
      }

      var w = width(), h = height();

      // RENDER CONTENTS OF VIDEO LAYER

      if (isVideoLayer()) {
         videoLayer.render();
      }

      // SET CONSTANTS FOR projectX() and projectY().

      pxM =  344 * w / 1440;
      pxB =  w / 2;
      pyM = -344 * w / 1440;
      pyB =  h / 2;


// THE CALL TO ttTick IS COMMENTED OUT SO CHALKTALK WILL WORK OVER THE WEB.
// IF YOU WANT TO USE THE PRESSURE IMAGING SENSOR, UNCOMMENT THIS LINE.

      // ttTick();     // HANDLE THE TACTONIC SENSOR, IF ANY.


      // TURN OFF ALL DOCUMENT SCROLLING.

      document.body.scrollTop = 0;

      // DON'T DO ANYTHING UNTIL THE ANIMATE FUNCTION IS DEFINED.

      if (isDef(window[g.name].animate)) {

         // SET THE CURSOR STYLE.

         document.body.style.cursor =
            (isVideoPlaying && ! isBottomGesture && ! isRightHover) ||
            isExpertMode && (pieMenuIsActive || isSketchInProgress())
                                                ? 'none'
            : bgClickCount == 1                 ? 'cell'
            : isRightHover && ! isBottomGesture ? 'pointer'
            : isBottomGesture                   ? '-webkit-grabbing'
            : isBottomHover                     ? '-webkit-grab'
         // : (videoLayer != undefined) && videoLayer.isShowing() ? 'none'
            :                                     'crosshair'
            ;

         onScreenKeyboard.x = w / 2;
         onScreenKeyboard.y = h * 3 / 4;

         var prevTime = time;
         time = ((new Date()).getTime() - _startTime) / 1000.0;
         This().elapsed = time - prevTime;

         pieMenuUpdate(This().mouseX, This().mouseY);

         _g = g;

         if (! isDef(_g.panX))
            _g.panX = 0;

         if (! isDef(_g.panY))
            _g.panY = 0;

         // CLEAR THE CANVAS

         _g.clearRect(-_g.panX - 100, -_g.panY, w + 200, h);
         _g.inSketch = false;

         // IF THERE IS A VIDEO LAYER, DARKEN IT.

         if (isVideoLayer() && videoBrightness < 1) {
            var scrimAlpha = max(0, 1 - videoBrightness);
            _g.fillStyle = 'rgba('
                         + (backgroundColor == 'white' ? '255,255,255,' : '0,0,0,')
                         + scrimAlpha + ')';
            var x = _g.panX, y = _g.panY;
            _g.beginPath();
            _g.moveTo(-100-x,0-y);
            _g.lineTo(   w-x,0-y);
            _g.lineTo(   w-x,h-y);
            _g.lineTo(-100-x,h-y);
            _g.fill();
         }

         // DO ACTUAL CANVAS PANNING

         _g.setTransform(1,0,0,1,0,0);
         _g.translate(_g.panX, _g.panY, 0);

         // PAN 3D OBJECTS TOO

         root.position.x =  _g.panX / (0.3819 * height());
         root.position.y = -_g.panY / (0.3819 * height());

         if (sketchPage.isWhiteboard) {
            color(backgroundColor);
            fillRect(-_g.panX - 100, -_g.panY, w + 200, h);
         }

         // START OFF CURRENT PSEUDO-SKETCH, IF NECESSARY

         if (isk() && sk().sketchState != 'finished') {
            if (sk().sketchState == 'start') {
               sk().cursorTransition = 0;
               sk().styleTransition = 0;
               sk().sketchLength = 1;
               sk().sketchProgress = 0;
               sk().tX = This().mouseX - width()/2;
               sk().tY = This().mouseY - height()/2;
               sk().xStart = cursorX = sk().advanceX = This().mouseX;
               sk().yStart = cursorY = sk().advanceY = This().mouseY;
               sk().sketchState = 'in progress';
            }

            if (sk().sketchState == 'in progress' && sk().isDrawingEnabled && sk().sketchProgress == 0) {
               sk().advanceX = This().mouseX;
               sk().advanceY = This().mouseY;
            }
         }

         // ANIMATE AND DRAW ALL THE STROKES

         for (var I = 0 ; I < nsk() ; I++)
            if (! sk(I).isSimple()) {
               sk(I).sp = [[sk(I).xStart, sk(I).yStart, 0]];
               sk(I).dSum = 0;
            }

         This().animate(This().elapsed);

         for (var I = 0 ; I < nsk() ; I++)
            if (! sk(I).isSimple())
               sk(I).sketchLength = sk(I).dSum;

         // COMPUTE SKETCH BOUNDING BOXES.

         if (! pullDownIsActive) {
            isMouseOverBackground = true;
            for (var I = 0 ; I < nsk() ; I++) {
               if (! sk(I).isGroup() && sk(I).parent == null) {

                  var xlo = 10000;
                  var ylo = 10000;
                  var xhi = -10000;
                  var yhi = -10000;
                  for (var i = 1 ; i < sk(I).sp.length ; i++) {
                     xlo = min(xlo, sk(I).sp[i][0]);
                     xhi = max(xhi, sk(I).sp[i][0]);
                     ylo = min(ylo, sk(I).sp[i][1]);
                     yhi = max(yhi, sk(I).sp[i][1]);
                  }

                  // PORTS EXTEND THE BOUNDING BOX OF A SKETCH.

                  for (var i = 0 ; i < sk(I).portName.length ; i++) {
                     if (! sk(I).hasPortBounds(i))
                        continue;
                     xlo = min(xlo, sk(I).portBounds[i][0]);
                     ylo = min(ylo, sk(I).portBounds[i][1]);
                     xhi = max(xhi, sk(I).portBounds[i][2]);
                     yhi = max(yhi, sk(I).portBounds[i][3]);
                  }

                  // TEXT EXTENDS THE BOUNDING BOX OF A SKETCH.

                  if (sk(I) instanceof SimpleSketch && sk(I).text.length > 0) {
                     var rx = sk(I).scale() * sk(I).textWidth / 2;
                     var ry = sk(I).scale() * sk(I).textHeight / 2;
                     var x1 = mix(sk(I).tx(), sk(I).textX, sk(I).scale());
                     var y1 = mix(sk(I).ty(), sk(I).textY, sk(I).scale());
                     xlo = min(xlo, x1 - rx);
                     ylo = min(ylo, y1 - ry);
                     xhi = max(xhi, x1 + rx);
                     yhi = max(yhi, y1 + ry);
                  }
                  else if (sk(I).sp.length <= 1) {
                     xlo = xhi = sk(I).cx();
                     ylo = yhi = sk(I).cy();
                  }

                  sk(I).xlo = xlo - sketchPadding;
                  sk(I).ylo = ylo - sketchPadding;
                  sk(I).xhi = xhi + sketchPadding;
                  sk(I).yhi = yhi + sketchPadding;
               }

               sk(I).isMouseOver = sk(I).parent == null &&
                                   This().mouseX >= sk(I).xlo &&
                                   This().mouseX <  sk(I).xhi &&
                                   This().mouseY >= sk(I).ylo &&
                                   This().mouseY <  sk(I).yhi ;

               // IF MOUSE IS OVER ANY SKETCH, THEN IT IS NOT OVER BACKGROUND.

               if (sk(I).isMouseOver)
                  isMouseOverBackground = false;
            }
         }

         // SELECT FRONTMOST SKETCH AT THE CURSOR.

         if (! pullDownIsActive && isFinishedDrawing()
                                && letterPressed == '\0'
                                && (! sketchPage.isPressed || sketchPage.paletteColorDragXY != null)
                                && sketchAction == null)
            tryToSelectSketchAtCursor();

         // HANDLE TEXT SHORTHAND MODE TIMEOUT

         if (isTextMode && time - strokesStartTime >= 0.5)
            isShorthandTimeout = true;

         // DRAW ARROWS.

         if (! sketchPage.isPressed)
            arrowNearCursor = null;

         annotateStart();
         for (var I = 0 ; I < nsk() ; I++)
            if (sk(I).parent == null) {
               var a = sk(I);
               for (var n = 0 ; n < a.arrows.length ; n++) {
                  var c = a.arrows[n][0];
                  var b = a.arrows[n][1];

                  var alpha = 1;
                  var fade = a.arrows[n][2];
                  if (fade !== undefined) {
                     alpha = fade;
                     alpha = max(0, a.arrows[n][2] - 3 * This().elapsed);
                     if (alpha == 0) {
                        a.arrowRemove(b);
                        continue;
                     }
                     a.arrows[n][2] = alpha;
                  }
		  alpha *= sk(I).fade();

                  var C = b == null ? c : createCurve([a.cx(),a.cy()], [b.cx(),b.cy()], c);

                  C = clipCurveAgainstRect(C, [a.xlo,a.ylo,a.xhi,a.yhi]);

                  if (b != null)
                     C = clipCurveAgainstRect(C, [b.xlo,b.ylo,b.xhi,b.yhi]);

                  if (C[0] === undefined)
                     continue;

		  if (! sketchPage.isPressed && isMouseNearCurve(C))
		     arrowNearCursor = { s: sk(I), n: n };

                  var nc = C.length;
                  _g.strokeStyle = defaultPenColor;
                  _g.lineWidth = width() / 300;
                  _g.globalAlpha = sCurve(alpha);
                  _g.beginPath();
                  _g.moveTo(C[0][0], C[0][1]);
                  for (var k = 0 ; k < nc ; k++)
                     _g.lineTo(C[k][0], C[k][1]);
                  if (nc > 4) {
                     var dx = C[nc-1][0] - C[nc-4][0];
                     var dy = C[nc-1][1] - C[nc-4][1];
                     var d = len(dx, dy);
                     dx *= _g.lineWidth * 5 / d;
                     dy *= _g.lineWidth * 5 / d;
                     _g.lineTo(C[nc-1][0] - dx - dy, C[nc-1][1] - dy + dx);
                     _g.moveTo(C[nc-1][0], C[nc-1][1]);
                     _g.lineTo(C[nc-1][0] - dx + dy, C[nc-1][1] - dy - dx);
                  }
                  _g.stroke();
               }
            }
         annotateEnd();

         // DRAW LINKS.

         if (isAudiencePopup() || ! isShowingOverlay()) {

            annotateStart();

            // START DRAWING A POSSIBLE NEW LINK.

            if (sketchDragMode == 4 ||
                 linkAtCursor == null
                 && isk()
                 && sketchAction == "linking"
                 && outSketch != null
                 && outPort >= 0 )
               drawPossibleLink(outSketch, sketchPage.mx, sketchPage.my);

            // DRAW ALL EXISTING LINKS.

            if (! sketchPage.isPressed)
               linkAtCursor = null;

            for (var I = 0 ; I < nsk() ; I++)
               if (sk(I).parent == null) {
                  var a = sk(I);
                  for (var i = 0 ; i < a.out.length ; i++)
                     if (isDef(a.out[i]))
                        for (var k = 0 ; k < a.out[i].length ; k++) {
			   var link = a.out[i][k];
                           link.draw(true);
                           if (! this.isPressed && isMouseNearCurve(link.C))
                               linkAtCursor = link;
                        }
               }

            annotateEnd();
         }

         if (isExpertMode) {
            if (pieMenuIsActive)
               drawCrosshair(pieMenuX, pieMenuY);
            else if (isSketchInProgress())
               drawCrosshair(cursorX, cursorY);
         }

         if (isShowingScribbleGlyphs && bgs !== undefined && bgs != null)
            bgs.draw();

         if (isAudiencePopup()) {

            // MAKE SURE AUDIENCE VIEW HAS THE RIGHT BACKGROUND COLOR.

            audienceCanvas.style.backgroundColor = backgroundColor;

            // DRAW A CURSOR WHERE AUDIENCE SHOULD SEE IT.

            if (pullDownIsActive)
               drawCrosshair(pullDownX, pullDownY);
            else if (isSketchInProgress())
               drawCrosshair(cursorX, cursorY);
            else
               drawCrosshair(This().mouseX, This().mouseY);

            // SHOW AUDIENCE VIEW.

            if (! isShowingPresenterView) {
               audienceContext.clearRect(0, 0, width(), height());
               if (sketchPage.isWhiteboard) {
                  audienceContext.fillStyle = backgroundColor;
                  audienceContext.fillRect(0, 0, width(), height());
               }
               audienceContext.drawImage(_g.canvas, 0, 0);
            }
         }

         // EVALUATE AND PROPAGATE EXPRESSIONS AND LINKS BETWEEN PORTS.

         for (var I = 0 ; I < nsk() ; I++) {
            var S = sk(I);

            // IF NO TEXT: JUST PASS INPUT TO OUTPUT.
/*
            if (S.isNullText()) {
               if (S instanceof SimpleSketch) {
                  if (isDef(S.out[0]))
                     S.outValue[0] = S.inValue[0];
               }
               else
                 for (var i = 0 ; i < S.in.length ; i++)
                    if (isDef(S.in[i]))
                       S.outValue[i] = S.inValue[i];
            }

            // IF SKETCH HAS TEXT: EVALUATE IT.  IF THERE IS ANY RESULT, PASS IT TO OUTPUT.

            else {
*/
            if (! S.isNullText()) {
               S.evalResult = S.evalCode(S.text);
               if (S.evalResult != null && isDef(S.out[0]))
                  S.outValue[0] = S.evalResult;
            }

            // VALUES PROPAGATE ALONG LINKS.

            for (var i = 0 ; i < S.out.length ; i++)
               if (isDef(S.out[i])) {
                  var outValue = isDef(S.outValue[i]) ? S.outValue[i] : "0";
                  for (var k = 0 ; k < S.out[i].length ; k++) {
		     var link = S.out[i][k];
                     link.b.inValue[link.j] = outValue;
                  }
               }
         }

         // UPDATE FLATTENED ARRAYS OF SKETCH INPUT VALUES.

         for (var I = 0 ; I < nsk() ; I++) {
            var S = sk(I);
            S.inValues = [];
            for (var i = -1 ; i < S.in.length ; i++) {
               var val = S.inValue[i];
               if (isDef(val)) {
                  if (Array.isArray(val))
                     for (var k = 0 ; k < val.length ; k++)
                        S.inValues.push(val[k]);
                  else
                     S.inValues.push(val);
               }
            }

            // IF NOT EVALUATING TEXT, JUST PASS INPUT TO OUTPUT.

            if (S.isNullText())
               S.outValue[0] = S.inValues;
         }

         // DRAW THE HINT TRACE IF THERE IS ONE.

         if (sketchPage.hintTrace !== undefined) {
            _g.save();
            _g.strokeStyle = 'cyan';
            _g.globalAlpha = 0.25;
            _g.lineWidth = 20;
            _g.beginPath();
            for (var n = 0 ; n < sketchPage.hintTrace.length ; n++) {
               var stroke = sketchPage.hintTrace[n];
               _g.moveTo(stroke[0][0], stroke[0][1]);
               for (var i = 1 ; i < stroke.length ; i++)
                  _g.lineTo(stroke[i][0], stroke[i][1]);
            }
            _g.stroke();
            _g.restore();
         }

         // IF SHOWING LIVE DATA

         var isShowingLiveDataAtPort = outSketch != null && outSketch.isShowingLiveData;

         if (showingLiveDataMode > 0 || isShowingLiveDataAtPort) {

            if (showingLiveDataMode >= 1 || isShowingLiveDataAtPort) {

               // DRAW ANY TIME-VARYING LIVE DATA FROM THE OUT-PORT AT THE CURSOR.

               if (outSketch != outSketchPrev || outPort != outPortPrev)
                  portDataValues = [];
               outSketchPrev = outSketch;
               outPortPrev = outPort;

               if (outSketch != null && outPort >= 0 && ! (outSketch instanceof NumericSketch)) {
                  var val = outSketch.outValue[outPort];
                  portDataValues.push(val == false ? 0 : val == true ? 1 : val);
                  color(liveDataColor);
                  drawPortData(outSketch, outPort, portDataValues, isShowingLiveDataAtPort);
               }
            }

            if (showingLiveDataMode >= 2)
               for (var I = 0 ; I < sketchPage.sketches.length ; I++) {
                  var s = sketchPage.sketches[I];
                  for (var i = 0 ; i < s.portName.length ; i++)
                     if (s.outValue[i] !== undefined && s.inValue[i] === undefined) {
                        var xy = s.portXY(i);
                        var val = s.outValue[i];
                        var str = isNumeric(val) ? roundedString(val) : val;

                        textHeight(20);
                        color(backgroundColor);
                        var _sw = textWidth(str);
                        var _sh = textHeight();
                        _g.beginPath();
                        _g.moveTo(xy[0] - _sw/2, xy[1] - _sh/2);
                        _g.lineTo(xy[0] + _sw/2, xy[1] - _sh/2);
                        _g.lineTo(xy[0] + _sw/2, xy[1] + _sh/2);
                        _g.lineTo(xy[0] - _sw/2, xy[1] + _sh/2);
                        _g.fill();

                        color(liveDataColor);
                        utext(str, xy[0], xy[1], .75, .5);
                     }
               }
         }

         sketchPage.computePortBounds();

         if (isShowingOverlay())
            This().overlay();

         sketchPage.advanceCurrentSketch();

         if (isAudiencePopup() && isShowingPresenterView) {
            audienceContext.fillStyle = backgroundColor;
            audienceContext.fillRect(0, 0, width(), height());
            audienceContext.drawImage(_g.canvas, 0, 0);
         }

         // ADJUST X POSITIONS ACCORDING TO PAN VALUE

         var leftX   = 0 - _g.panX;
         var rightX  = w - _g.panX;
         var topY    = 0 - _g.panY;
         var bottomY = h - _g.panY;

         // DRAW PAGE NUMBER AND BACKGROUND IF QUICK SWITCHING PAGES

         if (! isVerticalPan) {
            if (isRightHover && ! isBottomGesture) {
               annotateStart();
               _g.save();
               _g.globalAlpha = 1.0;
               lineWidth(1);

               // FILL GREY BOXES AS PAGE NUMBER BACKGROUNDS

               var numberSpacing = (h - margin) / sketchPages.length;
               _g.fillStyle = scrimColor(.2);
               for (var i = 0; i < h - margin; i += numberSpacing * 2) {
                  _g.beginPath();

                  _g.moveTo(rightX - margin, topY + i);
                  _g.lineTo(rightX - margin, topY + i + numberSpacing);
                  _g.lineTo(rightX         , topY + i + numberSpacing);
                  _g.lineTo(rightX         , topY + i);

                  _g.fill();
               }

               // DRAW OUTLINE AROUND CURRENT PAGE NUMBER

               var currentPageY = pageIndex * numberSpacing;
               lineWidth(0.75);
               _g.globalAlpha = 1.0;
               _g.beginPath();
               _g.moveTo(rightX - margin, topY + currentPageY);
               _g.lineTo(rightX - margin, topY + currentPageY + numberSpacing);
               _g.lineTo(rightX, topY + currentPageY + numberSpacing);
               _g.lineTo(rightX, topY + currentPageY);
               _g.lineTo(rightX - margin, topY + currentPageY);
               _g.strokeStyle = "rgb(255, 255, 255)";
               _g.stroke();

               // DRAW PAGE NUMBERS IN SLIDE SWITCHER

               _g.font = "14px Arial";
               var pageNumber = floor((This().mouseY / (h - margin)) * sketchPages.length);
               for (var pn = 0; pn < sketchPages.length; pn++) {
                  var alpha = pageNumber == pn ? 0.8 : 0.35;
                  _g.fillStyle = "rgba(255, 255, 255, " + alpha + ")";

                  // MAKE SURE BOTH ONE AND TWO DIGIT NUMBERS ARE CENTERED

                  var centerRatio = pn < 10 ? 0.57 : 0.65;
                  var numberX = w - _g.panX - margin * centerRatio;
                  _g.fillText(pn, numberX, (pn + 0.75) * numberSpacing);
               }

               if (! isExpertMode) {
                  var d = h / 10;
                  var nn = pageToDirections(pageNumber), n1 = nn[0], n2 = nn[1];
                  var x1 = w/2 - d * cos(n1 * TAU / 8);
                  var y1 = h/2 + d * sin(n1 * TAU / 8);
                  var x2 = x1  - d * cos(n2 * TAU / 8);
                  var y2 = y1  + d * sin(n2 * TAU / 8);

                  // OUTLINE OF A DOT TO REPRESENT INITIAL CLICK.

                  lineWidth(d/12);
                  color(defaultPenColor);
                  fillOval(w/2 - d/12, h/2 - d/12, d/6, d/6);

                  lineWidth(d/15);
                  color(backgroundColor);
                  fillOval(w/2 - d/20, h/2 - d/20, d/10, d/10);

                  // OUTLINE OF AN ARROW TO REPRESENT FOLLOWING DRAG.

                  lineWidth(d/12);
                  color(defaultPenColor);
                  arrow(x1, y1, x2, y2, d/8);

                  lineWidth(d/20);
                  color(backgroundColor);
                  arrow(x1, y1, x2, y2, d/8);
               }

               _g.restore();
               annotateEnd();
            }
         }
         else {
            if (isBottomHover && ! isRightGesture) {
               annotateStart();
               _g.save();
               _g.globalAlpha = 1.0;
               lineWidth(1);

               // FILL GREY BOXES AS PAGE NUMBER BACKGROUNDS

               var numberSpacing = (w - margin) / sketchPages.length;
               _g.fillStyle = scrimColor(.2);
               for (var i = 0; i < w - margin; i += numberSpacing * 2) {
                  _g.beginPath();

                  _g.moveTo(leftX + i                , bottomY - margin);
                  _g.lineTo(leftX + i + numberSpacing, bottomY - margin);
                  _g.lineTo(leftX + i + numberSpacing, bottomY);
                  _g.lineTo(leftX + i                , bottomY);

                  _g.fill();
               }

               // DRAW OUTLINE AROUND CURRENT PAGE NUMBER

               var currentPageX = pageIndex * numberSpacing;
               lineWidth(0.75);
               _g.globalAlpha = 1.0;
               _g.strokeStyle = "rgb(255, 255, 255)";
               _g.beginPath();

               _g.moveTo(leftX + currentPageX                , bottomY - margin);
               _g.lineTo(leftX + currentPageX + numberSpacing, bottomY - margin);
               _g.lineTo(leftX + currentPageX + numberSpacing, bottomY);
               _g.lineTo(leftX + currentPageX                , bottomY);
               _g.lineTo(leftX + currentPageX                , bottomY - margin);

               _g.stroke();

               // DRAW PAGE NUMBERS IN SLIDE SWITCHER

               _g.font = "14px Arial";
               var pageNumber = floor((This().mouseY / (h - margin)) * sketchPages.length);
               for (var pn = 0; pn < sketchPages.length; pn++) {
                  var alpha = pageNumber == pn ? 0.8 : 0.35;
                  _g.fillStyle = "rgba(255, 255, 255, " + alpha + ")";

                  // MAKE SURE BOTH ONE AND TWO DIGIT NUMBERS ARE CENTERED

                  var centerRatio = pn < 10 ? 0.57 : 0.75;
                  _g.fillText(pn, (pn - centerRatio) * numberSpacing, h - _g.panY - margin * 0.5);
               }

               if (! isExpertMode) {
                  var d = h / 10;
                  var nn = pageToDirections(pageNumber), n1 = nn[0], n2 = nn[1];
                  var x1 = w/2 - d * cos(n1 * TAU / 8);
                  var y1 = h/2 + d * sin(n1 * TAU / 8);
                  var x2 = x1  - d * cos(n2 * TAU / 8);
                  var y2 = y1  + d * sin(n2 * TAU / 8);

                  // OUTLINE OF A DOT TO REPRESENT INITIAL CLICK.

                  lineWidth(d/12);
                  color(defaultPenColor);
                  fillOval(w/2 - d/12, h/2 - d/12, d/6, d/6);

                  lineWidth(d/15);
                  color(backgroundColor);
                  fillOval(w/2 - d/20, h/2 - d/20, d/10, d/10);

                  // OUTLINE OF AN ARROW TO REPRESENT FOLLOWING DRAG.

                  lineWidth(d/12);
                  color(defaultPenColor);
                  arrow(x1, y1, x2, y2, d/8);

                  lineWidth(d/20);
                  color(backgroundColor);
                  arrow(x1, y1, x2, y2, d/8);
               }

               _g.restore();
               annotateEnd();
            }
         }

         if (visible_sp != null) {
            annotateStart();
            for (var i = 0 ; i < visible_sp.length ; i++) {
               color(i == 0 ? 'green' : visible_sp[i][2] == 0 ? 'blue' : 'red');
               fillOval(visible_sp[i][0] - 4, visible_sp[i][1] - 4, 8, 8);
            }
            annotateEnd();
         }

         if (isShowingNLParse)
            showNLParse();

         // DRAW PAN STRIP.

         _g.save();
         _g.globalAlpha = 1.0;

         if (! isVerticalPan) {
            if (this.mouseY >= h - margin || isBottomGesture) {
               color(scrimColor(0.06));
               fillRect(-_g.panX, h - margin - _g.panY, w, margin - 2);

               color(scrimColor(0.03));
               var dx = margin / 2;
               for (var x = _g.panX % dx - _g.panX ; x < w - _g.panX ; x += dx)
                  fillRect(x, h - margin - _g.panY, dx/2, margin - 2);
            }
         }
         else {
            if (this.mouseX >= w - margin || isRightGesture) {
               color(scrimColor(0.06));
               fillRect(w - margin - _g.panX, -_g.panY, margin - 2, h);

               color(scrimColor(0.03));
               var dy = 45;
               for (var y = _g.panY % dy - _g.panY - dy/4 ; y < h - _g.panY ; y += dy)
                  fillRect(w - margin - _g.panX, y, margin - 2, dy/2);
            }
         }

         // FAINTLY OUTLINE ENTIRE SCREEN, FOR CASES WHEN PROJECTED IMAGE SHOWS UP SMALL ON NOTEBOOK COMPUTER.

         lineWidth(0.25);
         color(defaultPenColor);
         drawRect(-_g.panX, -_g.panY, w-1, h-1);

         _g.restore();

         if (isShowingGlyphs && isExpertMode)
            sketchPage.showGlyphs();

         // MAKE SURE ALT-CMD-J (TO BRING UP CONSOLE) DOES NOT ACCIDENTALLY DO A SKETCH COPY.

         if (isAltPressed && isCommandPressed)
            isAltKeyCopySketchEnabled = false;
         else if (!isAltPressed && ! isCommandPressed)
            isAltKeyCopySketchEnabled = true;

      // GLOW AT OUTPUT PORT (NOT CURRENTLY BEING USED -KP)
/*
         if (outPort >= 0) {
            color(scrimColor(.05));
            for (var n = 0 ; n < 10 ; n++) {
               var r = 30 - 3 * n;
               fillOval(This().mouseX - r, This().mouseY - r, 2 * r, 2 * r);
            }
         }
*/
      }

      if (isShowingScribbleGlyphs) {
         var ncols = 25;
         var cw = w / ncols;

         color(scribbleColor());
         lineWidth(cw / 70);

         var fs = floor(0.2 * w / ncols);
         _g.font = (2*fs) + "px Arial";
         _g.fillText(bgsText, 7, 28);

         _g.font = fs + "px Arial";
         for (var ns = 0 ; ns < scribbleGlyphs.length ; ns++) {
            function xfx(x) { return x0 + x / 2; }
            function xfy(y) { return y0 + y / 2; }
            var col = ns % ncols;
            var row = floor(ns / ncols);
            var x0 = (col + 0.3) * cw;
            var y0 = (row + 0.8) * cw * 1.5;
            var s = scribbleGlyphs[ns].data;

            var x = xfx(s[0][0][0] * cw / 70);
            var y = xfy(s[0][0][1] * cw / 70);
            var dr = 3 * cw / 70;
            _g.beginPath();
            _g.moveTo(x - dr, y - dr);
            _g.lineTo(x + dr, y - dr);
            _g.lineTo(x + dr, y + dr);
            _g.lineTo(x - dr, y + dr);
            _g.fill();

            _g.fillText(scribbleGlyphs[ns].name, x0, y0 - 10);

            for (var n = 0 ; n < s.length ; n++) {
               _g.beginPath();
               for (var i = 0 ; i < s[n].length ; i++) {
                  var x = xfx(s[n][i][0] * cw / 70);
                  var y = xfy(s[n][i][1] * cw / 70);
                  if (i == 0)
                     _g.moveTo(x, y);
                  else
                     _g.lineTo(x, y);
               }
               _g.stroke();
            }
         }
      }

      if (window.debugMessage !== undefined) {
         annotateStart();
	 _g.fillStyle = _g.strokeStyle = 'cyan';
	 textHeight(50);
	 text(debugMessage, w/2, h/2);
         annotateEnd();
	 console.log(debugMessage);
	 debugMessage = undefined;
      }
   }

   var ef = new EncodedFraction();

   function isSketchInProgress() {
      return isk() && sk().sketchState == 'in progress';
   }

   function isShowingOverlay() {
      return ! isExpertMode &&
             ( isShowingGlyphs || isDef(This().overlay) );
   }

   var timelineH = 80;
   var isShowingTimeline = false;
   var isDraggingTimeline = false;

   function fillPath(sp, i0, i1, context) {
      if (context === undefined)
         context = _g;
      context.beginPath();
      var offset = context.lineWidth * 0.35;
      context.moveTo(sp[i0][0] - offset, sp[i0][1] - offset);
      for (var i = i0 + 1 ; i <= i1 ; i++)
         context.lineTo(sp[i][0] - offset, sp[i][1] - offset);
      context.fill();
   }

   var letterPressed = '\0';

   var audiencePopup = null, audienceCanvas, audienceContext;
   var cursorX = 0, cursorY = 0;

   function deleteSketch(sketch) {
      if (sketch === undefined)
         return;

      // WHENEVER SELECTED SKETCH IS DELETED, MAKE SURE WE DON'T STAY IN TEXT MODE.

      if (sketch == sk())
         setTextMode(false);

      for (var j = 0 ; j < sketch.children.length ; j++) {
         var k = sketchPage.findIndex(sketch.children[j]);
         sketchPage.sketches.splice(k, 1);
      }
      deleteSketchOnly(sketch);
   }

   function fadeArrowsIntoSketch(sketch) {
      for (var I = 0 ; I < nsk() ; I++)
         if (sk(I) != sketch)
            sk(I).arrowFade(sketch);
   }

   function deleteSketchOnly(sketch) {

      if (sketch.mesh !== undefined)
         root.remove(sketch.mesh);

      if (this.visibleEdgesMesh !== undefined)
         sketchPage.scene.remove(this.visibleEdgesMesh);

      var i = sketchPage.findIndex(sketch);
      if (i >= 0) {
         if (sketch.cleanup != null)
            sketch.cleanup();

         sketchPage.sketches.splice(i, 1);

	 // SEE IF THERE WILL BE A WAY TO LINK DELETED SKETCH'S INPUT TO ITS OUTPUT.

         var inLink = null, outLink = null;
         if (sketch.in.length > 0 && isDef(sketch.in[0])) {
            inLink = sketch.in[0];
	    var outPortIndex = sketch.outPortIndex();
	    if (outPortIndex >= 0) {
	       var outLinks = sketch.out[outPortIndex];
	       if (isDef(outLinks) && outLinks.length > 0 && isDef(outLinks[0]))
	          outLink = outLinks[0];
            }
         }

         // DELETE LINKS TO THIS SKETCH FROM OTHER SKETCHES:
         //
         //    FOR EACH ACTIVE IN-PORT OF sketch:
         //    LOOP THROUGH ACTIVE OUT-PORTS OF THE SKETCH a THAT LINKS TO IT.
         //    FOR EACH ACTIVE OUT-PORT OF a, LOOP THROUGH THE SKETCHES a LINKS TO.
         //    WHEREVER a LINKS TO sketch, REMOVE THAT OUT-LINK FROM a.

         for (var inPort = 0 ; inPort < sketch.in.length ; inPort++)
            if (isDef(sketch.in[inPort])) {
               var a = sketch.in[inPort].a;
               for (var outPort = 0 ; outPort < a.out.length ; outPort++)
                  if (isDef(a.out[outPort]))
                     for (var k = a.out[outPort].length - 1 ; k >= 0 ; k--) {
                        var link = a.out[outPort][k];
                        if (link.b == sketch)
                           link.removeFromOutSketch();
                     }
            }

         // DELETE LINKS FROM THIS SKETCH TO OTHER SKETCHES:

         for (var outPort = 0 ; outPort < sketch.out.length ; outPort++)
            if (isDef(sketch.out[outPort]))
               for (var k = sketch.out[outPort].length - 1 ; k >= 0 ; k--) {
	          var link = sketch.out[outPort][k];
	          link.removeFromInSketch();
               }

         // IF POSSIBLE, LINK DELETED SKETCH'S INPUT TO ITS OUTPUT.

         if (inLink != null && outLink != null) {
	    var ca = inLink.C, cb = outLink.C;
	    var p0 = ca[0];
	    var p1 = mix(ca[ca.length-1], cb[0], .5);
	    var p2 = cb[cb.length-1];
	    new SketchLink(inLink.a, inLink.i, outLink.b, outLink.j,
	       computeCurvature(ca[0], mix(ca[ca.length-1], cb[0], .5), cb[cb.length-1]));
         }
      }

      if (isCodeWidget && sketch == codeSketch)
         toggleCodeWidget();

      if (sketchPage.index >= nsk())
         selectSketch(nsk() - 1);
   }

   function selectSketch(n) {
      if (n == sketchPage.index)
         return;
      sketchPage.index = n;
      if (n >= 0)
         pullDownLabels = sketchActionLabels.concat(sk().labels);
   }

   function copySketch(s) {
      if (s === undefined || s == null)
         return;

      var children = null, groupPath = [];

      if (s.isGroup()) {
         children = [];
         for (var i = 0 ; i < s.children.length ; i++) {
            copySketch(s.children[i]);
            children.push(sk());
            sk().tX = s.children[i].tX;
            sk().tY = s.children[i].tY;
         }

         groupPath = cloneArray(s.groupPath);
      }

      else if (s instanceof GeometrySketch) {

         var sketch = new GeometrySketch();

         var x = This().mouseX, y = This().mouseY;
         var xr = (s.xhi - s.xlo) / 2 - sketchPadding;
         var yr = (s.yhi - s.ylo) / 2 - sketchPadding;
         sketch.sp0 = [[0,0],[x-xr,y-yr],[x+xr,y-yr],[x+xr,y+yr]];
         sketch.sp = [[0,0,0],[x-xr,y-yr,0],[x+xr,y-yr,1],[x+xr,y+yr,1]];

         var mesh = new THREE.Mesh(s.mesh.geometry.clone(), s.mesh.material.clone());
         root.add(mesh);
         mesh.sketch = sketch;
         mesh.update = s.mesh.update;

         sketch.fragmentShader = s.fragmentShader;
         sketch.glyphName = s.glyphName;
         sketch.mesh = mesh;
         sketch.onClick = s.onClick;
         sketch.onSwipe = s.onSwipe;
         sketch.rX = s.rX;
         sketch.rY = s.rY;
         sketch.shaderCount = 0;
         sketch.sketchProgress = 1;
         sketch.sketchState = 'finished';
         sketch.sx = s.sx;
         sketch.sy = s.sy;
         sketch.update = s.update;

         addSketch(sketch);
         finishDrawingUnfinishedSketch();
         return;
      }

      addSketch(s.clone());
      if (sk().createMesh !== undefined)
         sk().mesh = undefined;
      sk().sketchProgress = 1;
      sk().sketchState = 'finished';

      var dx = This().mouseX - (s.isGroup() ? s.cx() : s.tx());
      var dy = This().mouseY - (s.isGroup() ? s.cy() : s.ty());

      if (s.isGroup()) {
         sk().xlo += dx;
         sk().ylo += dy;
         sk().xhi += dx;
         sk().yhi += dy;

         sk().children = [];
         for (var i = 0 ; i < children.length ; i++) {
            sk().children.push(children[i]);
            sk().children[i].parent = sk();
         }
         moveChildren(sk().children, dx, dy);

         for (var i = 0 ; i < groupPath.length ; i++) {
            groupPath[i][0] += dx;
            groupPath[i][1] += dy;
         }
         sk().groupPath = groupPath;
      }
      else {
         sk().tX += dx;
         sk().tY += dy;
         if (! sk().isSimple()) {
            sk().tX -= width() / 2;
            sk().tY -= height() / 2;
         }
         sk().textX += dx;
         sk().textY += dy;
      }
   }

   function addSketch(sketch) {
      if (sketch.labels.length == 0)
         sketch.labels.push(sketch.label);
      sketchPage.add(sketch);
      sk().arrows = [];
      sk().id = globalSketchId++;
      sk().setColorId(sketchPage.colorId);
      sk().sketchState = 'start';
      sk().children = [];
      sk().in = [];
      sk().out = [];
      sk().inValue = [];
      sk().motionPath = [];
      sk().outValue = [];
      sk().defaultValue = [];
      sk().portBounds = [];
      sk().portLocation = [];
      sk().zoom = sketchPage.zoom;
      sk().isDrawingEnabled = false;
      if (sk() instanceof Sketch2D) {
         sk().x2D = This().mouseX;
         sk().y2D = This().mouseY;
      }
   }

   function computeCentroid(parent, sk, pts) {
      var xlo = sk.xlo;
      var ylo = sk.ylo;
      var xhi = sk.xhi;
      var yhi = sk.yhi;

      var x = 0, y = 0, sum = 0;
      for (var i = 0 ; i < pts.length ; i++)
         if ( pts[i][0] >= xlo && pts[i][0] < xhi &&
              pts[i][1] >= ylo && pts[i][1] < yhi ) {
            x += pts[i][0];
            y += pts[i][1];
            sum++;
         }

      if (sum == 0) {
         x = (xlo + xhi) / 2;
         y = (ylo + yhi) / 2;
      }
      else {
         x /= sum;
         y /= sum;
      }
      return [parent.m2x(x), parent.m2y(y)];
   }

// HANDLE FAKE CROSSHAIR CURSOR.

   function drawCrosshair(x, y, context) {
      if (context === undefined)
         context = _g;

      var r = 6.5 * window.innerWidth / window.outerWidth;

      x = floor(x);
      y = floor(y);

      for (var n = 0 ; n < 2 ; n++) {
         context.strokeStyle = n == 0 ? backgroundColor : defaultPenColor;
         context.lineWidth = (n == 0 ? .3 : .1) * r;
         context.beginPath();
         context.moveTo(x - r, y);
         context.lineTo(x + r, y);
         context.moveTo(x, y - r);
         context.lineTo(x, y + r);
         context.stroke();
      }
   }

////////////////////////////////////////////////////////////
/////// SKETCHES THAT MAKE USE OF WEBGL AND SHADERS ////////
////////////////////////////////////////////////////////////

   var pxM, pxB, pyM, pyB;

   function projectX(x) { return pxM * x + pxB; }
   function projectY(y) { return pyM * y + pyB; }

   function GeometrySketch() {
      this.sx = 1;
      this.sy = 1;
      this.dragx = 0;
      this.dragy = 0;
      this.downx = 0;
      this.downy = 0;
      this.isOutline = false;
      this.cleanup = function() {
         root.remove(this.mesh);
         if (this.visibleEdgesMesh !== undefined)
            sketchPage.scene.remove(this.visibleEdgesMesh);
      }
      this.meshAlpha = meshOpacity();
      this.mouseDown = function(x,y) {
         this.downx = this.dragx = x;
         this.downy = this.dragy = y;
      }
      this.mouseDrag = function(x,y) {
         this.sx *= (400 + x - this.dragx) / 400;
         this.sy *= (400 - y + this.dragy) / 400;
         this.dragx = x;
         this.dragy = y;
      }
      this.mouseUp = function(x,y) {
      }
      this.render = function(elapsed) {

         // TURN OFF ROTATION TO COMPUTE 2D BOUNDING BOX.

         var save_rX = this.rX;
         this.rX = 0;
         this.makeXform();
         this.rX = save_rX;

         if (this.bounds !== undefined && this.e2bounds !== undefined) {
            var b1 = this.e2bounds;
            var b2 = this.bounds;

            this._dx = (b2[0] + b2[2]) / 2 - (b1[0] + b1[2]) / 2;
            this._dy = (b2[1] + b2[3]) / 2 - (b1[1] + b1[3]) / 2;
            this._ds = (b2[2] - b2[0]) / (b1[2] - b1[0]) * pow((b2[2] - b2[0]) / this.sw, 0.2) * 1.03;

            delete this.bounds;
         }

         if (this._dx !== undefined) {
            this.xf[0] += this._dx;
            this.xf[1] += this._dy;
            this.xf[4] *= this._ds;
         }

         for (var i = 0 ; i < min(this.sp.length, this.sp0.length) ; i++) {
            var xy = this.xform(this.sp0[i]);
            this.sp[i][0] = xy[0];
            this.sp[i][1] = xy[1];
         }

         var b = [ this.xlo, this.ylo, this.xhi, this.yhi ];
         var x = ( b[0] + b[2] - width()     ) / 2 / pixelsPerUnit;
         var y = ( b[1] + b[3] - height()    ) / 2 / pixelsPerUnit;
         var s = len(b[2] - b[0] + 2 * sketchPadding,
                     b[3] - b[1] + 2 * sketchPadding) / 4 / pixelsPerUnit;

         if (this.mesh.sc !== undefined)
            s *= this.mesh.sc;

         this.mesh.getMatrix()
             .identity()
             .translate(x, -y, 0)
             .rotateY( PI*this.rX)
             .rotateX(-PI*this.rY)
             .scale(s * this.sx, s * this.sy, s);

         if (this.inValue[0] !== undefined) this.setUniform("x", this.inValue[0]);
         if (this.inValue[1] !== undefined) this.setUniform("y", this.inValue[1]);
         if (this.inValue[2] !== undefined) this.setUniform("z", this.inValue[2]);

         if (isDef(this.mesh.update))
            this.mesh.update(elapsed);

         if (isDef(this.update))
            this.update(elapsed);

         if (this.fadeAway > 0 || sketchPage.fadeAway > 0
                               || this.glyphSketch != null
                               || this.meshAlpha !== undefined
                               || sketchPage.fadeAway > 0) {
            this.alpha = this.fadeAway > 0 ? this.fadeAway :
                         this.glyphSketch != null ? 1.0 - this.glyphSketch.fadeAway :
                         this.meshAlpha !== undefined ? this.meshAlpha :
                         sketchPage.fadeAway;
            this.mesh.setOpacity(sCurve(this.alpha));

            if (this.glyphSketch != null && this.glyphSketch.fadeAway == 0)
               this.glyphSketch = null;
         }
         else if (this.mesh.material.alpha !== undefined) {
            this.mesh.setOpacity(this.mesh.material.alpha);
            this.mesh.material.alpha = undefined;
         }

         if (this.visibleEdgesMesh !== undefined)
            sketchPage.scene.remove(this.visibleEdgesMesh);

         if (this.hasMatrix === undefined)
            this.alpha = 0;
         this.hasMatrix = true;

         if (this.isOutline || isShowingMeshEdges) {

            // FIND VISIBLE EDGES FOR THIS VIEW, THEN BUILD 3D EDGES TO DISPLAY WITH THE 3D MODEL.

            var visibleEdges = this.mesh.findVisibleEdges();

            // MW VISIBLE EDGE FIX
            // to restore previous algorithm, comment out the next two lines (and follow instructions below)

            var moreVisibleEdges = this.mesh.findMoreVisibleEdges();
            var newVisibleEdges = visibleEdges[0][1].concat(moreVisibleEdges[0][1]);

            // BUT IF YOU WANT TO USE THE NEW EDGES BUT NOT THE ORIGINAL ONES, LEAVE THE ABOVE
            // TWO LINES INTACT BUT UNCOMMENT OUT THE FOLLOWING LINE
            // var newVisibleEdges = [].concat(moreVisibleEdges[0][1]);

            // TO ONLY USE THE ORIGINAL ALGORITHM TO GENERATE EDGES, COMMENT OUT THE FOLLOWING LINE
            visibleEdges[0][1] = newVisibleEdges;

            // console.log("length of first element of ve = " + visibleEdges[0].length);
            // console.log("length of 2nd element of ve = " + visibleEdges[1].length);
            // console.log("ve = " + visibleEdges.length.toFixed(0) + "  mve = " + moreVisibleEdges.length.toFixed(0));
            // console.log("array test " + Array.isArray(visibleEdges) + "   " + Array.isArray(moreVisibleEdges));
            // console.log("ve " + JSON.stringify(visibleEdges[0][1]));
            // console.log("mve " + JSON.stringify(moreVisibleEdges[0][1]));
            // visibleEdges[0][1] = visibleEdges.concat(moreVisibleEdges[0][1]);
            // console.log("new ve " + JSON.stringify(visibleEdges[0][1]));

            // FROM HERE FORWARD EVERYTHING IS THE SAME

            this.visibleEdgesMesh = createVisibleEdgesMesh(visibleEdges);

            sketchPage.scene.add(this.visibleEdgesMesh);

            if (this.alpha !== undefined) {
               this.visibleEdgesMesh.material.opacity = sCurve(this.alpha);
               this.visibleEdgesMesh.material.transparent = true;
            }

            // Project the visible edges, and connect them into long 2d strokes.

            var e2;
            if (this.bounds !== undefined || isShowing2DMeshEdges)
               e2 = this.mesh.projectVisibleEdges(visibleEdges);

            if (this.bounds !== undefined) {

               // COMPUTE BOUNDS AND ATTACH TO THEM TO SKETCH.

               var b = [10000,10000,-10000,-10000];
               for (var n = 0 ; n < e2.length ; n++)
               for (var i = 0 ; i < e2[n].length ; i++) {
                  b[0] = min(b[0], e2[n][i][0]);
                  b[1] = min(b[1], e2[n][i][1]);
                  b[2] = max(b[2], e2[n][i][0]);
                  b[3] = max(b[3], e2[n][i][1]);
               }
               this.e2bounds = b;
            }

            if (isShowing2DMeshEdges) {
               var c2 = edgesToStrokes(e2);

               annotateStart();
/*
               // Draw the long connected 2d strokes in different colors.

               lineWidth(20);
               function c(m, p) { return (m % (p+p)) < p ? 255 : 64; }
               for (var m = 0 ; m < c2.length ; m++) {
                  color('rgba(' + c(m,1) + ',' + c(m,2) + ',' + c(m,4) + ', 0.5)');
                  drawCurve(c2[m]);
               }
*/
               // Draw the projected 2d edges.

               lineWidth(10);
               color('rgba(255,0,0,0.5)');
               for (var n = 0 ; n < e2.length ; n++)
                  drawCurve(e2[n]);

               annotateEnd();
            }
         }

         if (this.alpha !== undefined)
            this.alpha = min(1, this.alpha + 10 * elapsed);
/*
         if (this.meshTrace !== undefined) {
            _g.save();
            _g.globalAlpha = 0.5;
            color('green');
            lineWidth(6);
            _g.beginPath();
            for (var n = 0 ; n < this.meshTrace.length ; n++) {
               var stroke = this.meshTrace[n];
               _g.moveTo(stroke[0][0], stroke[0][1]);
               for (var i = 1 ; i < stroke.length ; i++)
                  _g.lineTo(stroke[i][0], stroke[i][1]);
            }
            _g.stroke();
            _g.restore();
         }
*/
      }
   }
   GeometrySketch.prototype = new SimpleSketch;

   function addPlaneShaderSketch(vertexShader, fragmentShader, n) {
      return addGeometryShaderSketch(new THREE.PlaneGeometry(2,2,n,n), vertexShader, fragmentShader);
   }

   function addSphereShaderSketch(vertexShader, fragmentShader) {
       return addGeometryShaderSketch(new THREE.SphereGeometry(1.0, 21.0, 21.0), vertexShader, fragmentShader);
   }

   // MW TORUS GEOMETRY

   function addTorusShaderSketch(vertexShader, fragmentShader) {
       return addGeometryShaderSketch(new THREE.TorusGeometry(1.0, 0.5, 11.0, 9.0), vertexShader, fragmentShader);
   }

   function createMesh(geometry, vertexShader, fragmentShader) {
      return new THREE.Mesh(geometry, shaderMaterial(vertexShader, fragmentShader));
   }

   function addGeometryShaderSketch(geometry, vertexShader, fragmentShader) {
      sk().fadeAway = 1.0;
      var mesh = createMesh(geometry, vertexShader, fragmentShader);
      root.add(mesh);
      mesh.sketch = geometrySketch(mesh);
      mesh.sketch.fragmentShader = fragmentShader;
      setMeshUpdateFunction(mesh);
      return mesh.sketch;
   }

   function computeGlyphSketchBounds() {
      if (glyphSketch != null)
         return computeCurveBounds(glyphSketch.sp, 1);
      else
         return [sketchPage.x-50, sketchPage.y-50, sketchPage.x+50, sketchPage.y+50];
   }

   function geometrySketch(mesh, xf) {

      var sketch = new GeometrySketch();

      var b = computeGlyphSketchBounds();

      if (glyphSketch != null) {
         sketchPage.add(glyphSketch);
         glyphSketch.fadeAway = 1.0;
         sketch.glyphSketch = glyphSketch;
      }

      if (isDef(xf)) {
         var w = b[2] - b[0];
         var x = (b[0] + b[2]) / 2;
         var y = (b[1] + b[3]) / 2;
         var dx = xf[0] * w;
         var dy = xf[1] * w;
         var sc = xf[4];
         b[0] = x + dx - (x - b[0]) * sc;
         b[1] = y + dy - (y - b[1]) * sc;
         b[2] = x + dx + (b[2] - x) * sc;
         b[3] = y + dy + (b[3] - y) * sc;
         sketch.rX = xf[2];
         sketch.rY = xf[3];
      }

      var x = (b[0] + b[2]) / 2;
      var y = (b[1] + b[3]) / 2;

      // FORCE THE BOUNDING RECTANGLE TO BE A SQUARE.

      var r = (b[2] - b[0] + b[3] - b[1]) / 3.0;
      b[0] = x - r + sketchPadding;
      b[1] = y - r + sketchPadding;
      b[2] = x + r - sketchPadding;
      b[3] = y + r - sketchPadding;

      sketch.sp0 = [ [0,0  ] , [b[0]-x,b[1]-y  ] , [b[2]-x,b[3]-y  ] ];
      sketch.sp  = [ [0,0,0] , [b[0]  ,b[1]  ,1] , [b[2]  ,b[3]  ,1] ];

      sketch.tX = x;
      sketch.tY = y;
      sketch.mesh = mesh;
      mesh.sketch = sketch;
      setMeshUpdateFunction(mesh);

      if (mesh.material == bgMaterial() && ! isShowingMeshEdges)
         setMeshMaterialToRGB(mesh, paletteRGB[sketchPage.colorId]);

      addSketch(sketch);

      finishDrawingUnfinishedSketch();
      return sketch;
   }

   function SketchTo3D() {
      this.initSketchTo3D = function(label, curves, initMesh) {
         this.labels = [ label ];
         this.initMesh = initMesh;
         this.curves = curves;
      }
      this.render = function(elapsed) {
         m.save();
         for (var n = 0 ; n < this.curves.length ; n++)
            mCurve(this.curves[n]);
         m.restore();
         this.afterSketch(function() {
            if (this.shapeSketch === undefined) {
               glyphSketch = null;
               this.shapeSketch = geometrySketch(this.initMesh());
               this.shapeSketch.tX = this.tX + width() / 2;
               this.shapeSketch.tY = this.tY + height() / 2;
               this.shapeSketch.mesh.sc = 1.75 * (this.xyz.length < 3 ? 1 : this.xyz[2]);

               this.shapeSketch.meshAlpha = 0.3;
               this.shapeSketch.update = function(elapsed) {
                  this.meshAlpha = min(meshOpacity(), this.meshAlpha + elapsed);
                  if (this.meshAlpha == meshOpacity())
                     delete this.update;
               }

               this.fadeAway = 1;
            }
         });
      }
   }
   SketchTo3D.prototype = new Sketch;

   function setMeshUpdateFunction(mesh) {
      mesh.update = function() {
         if (this.material.uniforms === undefined)
            return;

         var S = this.sketch;

         // TELL THE MATERIAL ABOUT THE CURRENT TIME.

         S.setUniform('time', time);

         // TELL THE MATERIAL WHAT THE CURRENT SKETCH LOCATION IS IN PIXELS.

         if (S.x == 0) {
            S.x = (S.xlo + S.xhi)/2;
            S.y = (S.ylo + S.yhi)/2;
         }

         // TELL THE MATERIAL WHAT THE CURRENT MOUSE LOCATION IS ON THE SKETCH, ON A RANGE FROM FROM -1 TO +1.

         if (! S.isClick) {
            S.setUniform('mx', (S.x - (S.xlo + S.xhi)/2) / ((S.xhi - S.xlo)/2));
            S.setUniform('my',-(S.y - (S.ylo + S.yhi)/2) / ((S.yhi - S.ylo)/2));
         }

         // TELL THE MATERIAL ABOUT ALPHA AND THE FADEAWAY BEFORE THE SKETCH IS DELETED.

	 var alpha = (S.fadeAway == 0 ? 1 : S.fadeAway) * (isDef(S.alpha) ? S.alpha : 1);
	 mesh.material.transparent = alpha < 1;
         S.setUniform('alpha', alpha);

         // TELL THE MATERIAL WHICH INDEX IS SELECTED IN THE SKETCH'S CODE TEXT BUBBLE.

         S.setUniform('selectedIndex', isDef(S.selectedIndex) ? S.selectedIndex : 0);

         // TELL THE MATERIAL THE SIZE OF ONE PIXEL, IN TEXTURE SPACE.

         S.setUniform('pixelSize', 3 / (S.xhi - S.xlo));
      }
   }

   // RENDERING MATERIAL CORRESPONDING TO A CANVAS RGB COLOR.

   function setMeshMaterialToRGB(mesh, rgb) {
      var r = rgb[0] / 255;
      var g = rgb[1] / 255;
      var b = rgb[2] / 255;
      mesh.setMaterial(new phongMaterial().setAmbient(.3*r,.3*g,.3*b)
                                          .setDiffuse(.5*r,.5*g,.5*b)
                                          .setSpecular(0,0,0,1));
   }

   // RENDERING MATERIALS CORRESPONDING TO BACKGROUND AND FOREGROUND COLORS.

   function bgMaterial() {
      return backgroundColor == 'white' ? whiteMaterial : blackMaterial;
   }

   function penMaterial() {
      return backgroundColor == 'white' ? blackMaterial : whiteMaterial;
   }

////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////

   var _g, time = 0, _startTime = (new Date()).getTime();

   var motion = [];
   for (var i = 0 ; i < palette.length ; i++)
      motion.push(1);

   var glyphCountBeforePage = 0;

   function setPage(index) {

      if (index < 0 || index >= sketchPages.length)
         return;

      // SAVE PAN VALUE FOR PREVIOUS PAGE

      sketchPages[pageIndex].panX = _g.panX;
      sketchPages[pageIndex].panY = _g.panY;

      // RESTORE PAN VALUE FOR NEXT PAGE

      _g.panX = sketchPages[index].panX;
      _g.panY = sketchPages[index].panY;

      // MAKE SURE SKETCH ACTION, BG-CLICK ACTION, CODE WIDGET, ETC ARE TURNED OFF.

      sketchAction = null;
      bgClickCount = 0;
      if (isCodeWidget)
         toggleCodeWidget();

      // REMOVE ALL GLYPHS DEFINED FROM PREVIOUS PAGE, IF ANY (THIS IS WRONG).
/*
      if (glyphCountBeforePage > 0)
         glyphs.splice(glyphCountBeforePage, glyphs.length - glyphCountBeforePage);
      glyphCountBeforePage = glyphs.length;
*/
      if (index === undefined)
         index = pageIndex;

      pageIndex = (index + sketchPages.length) % sketchPages.length;

      sketchPage = sketchBook.setPage(pageIndex);
      var slide = document.getElementById('slide');

      // SET PAGE CONTENT FROM TEMPLATE OR STRAIGHT FROM HTML

      pageObject = sketchPages[pageIndex];
      if (isDef(pageObject.innerHTML))
         slide.innerHTML = pageObject.innerHTML;
      else if (isDef(pageObject.template))
         insertTemplate(pageObject.template, slide);

      // IF THERE IS A VIDEO ON THE NEW PAGE, START PLAYING IT.

      vidElements = slide.getElementsByClassName("vid");
      if (isVideoPlaying = vidElements.length > 0) {
         vidElements[0].play();
      }

      // IF THERE IS AN AUDIENCE POP-UP, SET IT TO THE RIGHT PAGE.

      if (isAudiencePopup())
         audiencePopup.document.getElementById('slide').innerHTML =
            document.getElementById(pageName).innerHTML;

      // SET SKETCH TYPES FOR THIS PAGE.

      sketchTypes = sketchPages[pageIndex].availableSketches;
      pagePullDownLabels = pageActionLabels.concat(sketchTypes);
      pullDownLabels = pagePullDownLabels;

      sketchTypeLabels = [];

      for (var n = 0 ; n < sketchTypes.length ; n++)
         registerSketch(sketchTypes[n]);

      for (var i = 0 ; i < sketchTypesToAdd.length ; i++)
         registerSketch(sketchTypesToAdd[i]);

      // SWAP IN THE 3D RENDERED SCENE FOR THIS PAGE.

      if (sketchPage.scene == null) {
         sketchPage.scene = new THREE.Scene();
         sketchPage.scene.add(ambientLight(0x333333));
         sketchPage.scene.add(directionalLight(1,1,1, 0xffffff));
         sketchPage.scene.add(directionalLight(-1,0,-1, 0x808080));
         sketchPage.scene.root = new node();
         sketchPage.scene.add(sketchPage.scene.root);
      }
      renderer.scene = sketchPage.scene;
      root = renderer.scene.root;
   }

   function insertTemplate(template, slide) {
      var parent = document.createElement('parent');
      var table = document.createElement('table');
      var tablePaddingRow = document.createElement('tr');
      tablePaddingRow.className = 'padding';

      parent.appendChild(table);
      table.appendChild(tablePaddingRow);
      table.setAttribute('width', width());

      if (template instanceof Array)
         if (template[0] instanceof Array)
            for (var i = 0; i < template.length; i++) {
               table.appendChild(row(template[i]));
               if (i != template.length - 1) {
                  var spacerRow = document.createElement('tr');
                  spacerRow.setAttribute('height', '50');
                  table.appendChild(spacerRow);
               }
            }
         else
            table.appendChild(row(template));
      else
         table.appendChild(row(template));

      slide.innerHTML = parent.innerHTML;
   }

   function resizePadding() {
      var paddingHeight = (height() - slide.clientHeight) / 2;
      slide.getElementsByClassName('padding')[0].setAttribute('height', paddingHeight);
   }

   function row(template) {
      var rowElement = document.createElement('tr');
      if (template instanceof Array)
         for (var i = 0; i < template.length; i++)
            rowElement.appendChild(column(template[i]));
      else
         rowElement.appendChild(content(template));
      return rowElement;
   }

   function column(template) {
      var columnElement = document.createElement('td');
      columnElement.appendChild(content(template));
      return columnElement;
   }

   function content(template) {
      if (template.indexOf('.mp4') > -1) {
         var th = document.createElement('th');
         th.appendChild(videoElement(template));
         return th;
      } else if (template.indexOf('.jpg') > -1 || template.indexOf('.png') > -1) {
         var th = document.createElement('th');
         th.appendChild(imageElement(template));
         return th;
      } else {
         var center = document.createElement('center');
         center.appendChild(textElement(template));
         return center;
      }
   }

   function textElement(text) {
      var font = document.createElement('font');
      font.setAttribute('color', 'white');
      font.setAttribute('size', '10');
      font.innerHTML = text;
      return font;
   }

   function imageElement(imageName) {
      var img = document.createElement('img');
      img.setAttribute('src', imageName);
      img.setAttribute('width', '700');
      return img;
   }

   function videoElement(videoName) {
      var video = document.createElement('video');
      video.className = 'vid';
      video.setAttribute('width', '60%');
      video.setAttribute('height', 'auto');
      var source = document.createElement('source');
      source.setAttribute('src', videoName);
      video.appendChild(source);
      return video;
   }

   function loadGlyphArray(a) {
      for (var i = 0 ; i < a.length ; i += 2)
         registerGlyph(a[i], a[i+1]);
   }

   function unloadGlyphArray(a) {
      for (var i = 0 ; i < a.length ; i += 2)
         for (var j = 0 ; j < glyphs.length ; j++)
            if (a[i] == glyphs[j].name)
                glyphs.splice(j--, 1);
   }

var glyphs = [];
loadGlyphArray(numericGlyphData);

