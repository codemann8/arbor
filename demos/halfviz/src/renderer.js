(function(){
  
  Renderer = function(canvas) {
    var canvas = $(canvas).get(0)
    var ctx = canvas.getContext("2d");
    var gfx = arbor.Graphics(canvas)
    var particleSystem = null
    var horizMargin = 5
    var vertMargin = 3
    var mouse = {node:null,x:0,y:0}
          
    var getTextHeight = function(font) {

  	  var text = $('<span>Hg</span>').css({ font: font });
  	  var block = $('<div style="display: inline-block; width: 1px; height: 0px;"></div>');
  
  	  var div = $('<div></div>');
  	  div.append(text, block);
  
  	  var body = $('body');
  	  body.append(div);
  
  	  try {
  
  	    var result = {};
  
  	    block.css({ verticalAlign: 'baseline' });
  	    result.ascent = block.offset().top - text.offset().top;
  
  	    block.css({ verticalAlign: 'bottom' });
  	    result.height = block.offset().top - text.offset().top;
  
  	    result.descent = result.height - result.ascent;
  
  	  } finally {
  	    div.remove();
  	  }
  
  	  return result;
  	};
    
    var drawBox = function(pt, w, h, node) {
          
      // draw a rectangle centered at pt
      if (node.data.color) ctx.fillStyle = node.data.color
//      else ctx.fillStyle = "rgba(0,0,0,.2)"
      else ctx.fillStyle = "rgba(200,200,200,1)"
      if (node.data.color=='none') ctx.fillStyle = "white"
      if (node.data.shape=='dot'){
        w = Math.max(w,h)
        h = Math.max(w,h)
      }
      
      var x = pt.x-w/2
      var y = pt.y-h/2
      
      if (x<0) {
      	pt.x-=x
      	x=0
      } else if ((x+w) > canvas.width && w < canvas.width) {
      	var diff=(x+w)-canvas.width
      	pt.x-=diff
        x-=diff
      }
          
      if (y<0) {
      	pt.y-=y
      	y=0
      } else if ((y+h) > canvas.height && h < canvas.height) {
      	var diff=(y+h)-canvas.height
      	pt.y-=diff
        y-=diff
      }
      
      ctx.save()
      if (node.data.shadow) {
        var xoff = 4 * ((x/canvas.width)-0.25)
        var yoff = 4 * ((y/canvas.height)-0.25)
        ctx.shadowColor="#555555"
        ctx.shadowOffsetX=xoff
        ctx.shadowOffsetY=yoff
        ctx.shadowBlur=10
      }
      if (node.data.shape=='dot'){
        gfx.oval(x, y, w, h, {fill:ctx.fillStyle})
      }else{
        gfx.rect(x, y, w, h, 6, {fill:ctx.fillStyle})
      }
      ctx.restore()
      var nodeBox = [x,y,w,h]
      return nodeBox
    };
    
    var drawText = function(node, pt, font) {
      // node: {mass:#, p:{x,y}, name:"", data:{}}
      // pt:   {x:#, y:#}  node position in screen coords

      //returns nodeBox
      
      node.data.box = null
      node.data.img = null
        
      ctx.font = font
            
      var label = node.data.label||""
      if (!(""+label).match(/^[ \t]*$/)){
        pt.x = Math.floor(pt.x)
        pt.y = Math.floor(pt.y)
      }else{
        label = null
      }

      var labelLines = label+""
      if (label) {
      	labelLines = label.split("\\n")
      }
      var lineHeight = getTextHeight(font)
      var totalHeight = (lineHeight.height*labelLines.length)+vertMargin

      var w = 0
      for (var i = 0; i < labelLines.length; i++) {
        w = Math.max(w,ctx.measureText(""+labelLines[i]).width + (horizMargin*2))
      }
      var h = totalHeight
      var nodeBox = drawBox(pt, w, h, node)

      // draw the text
      if (label){
        var align = "center"
        x = pt.x
        y = pt.y-(totalHeight/2)+lineHeight.ascent+2
        if (node.data.align!==undefined) {
      	  align = node.data.align
          if (align == "left") {
        	x -= (w/2-horizMargin)
          } else if (align == "right") {
        	x += (w/2-horizMargin)
          }
        }
        ctx.textAlign = align
        ctx.fillStyle = "white"
        if (node.data.color=='none') ctx.fillStyle = '#333333'
        for (var i = 0; i < labelLines.length; i++) {
          ctx.fillText(labelLines[i]||"", x, y+(i*lineHeight.height))
          ctx.fillText(labelLines[i]||"", x, y+(i*lineHeight.height))
        }
      }
      
      return nodeBox
    };

    var drawHtml = function(node, pt, defaultFont) {
      // node: {mass:#, p:{x,y}, name:"", data:{}}
      // pt:   {x:#, y:#}  node position in screen coords
      
  	//returns nodeBox
      
    	var html = node.data.html
    	if (html=="test") {
        html = "<div><span style='background-color:red'>Yo " +
        		"<span style='text-decoration:underline;font-style:oblique'>dude!</span></span></div>" +
        		"<div>Title Here</div>" +
        		"<table style='width:100px'>" +
        		"<tr><td>ul</td><td style='text-align:right'>ur</td></tr>" +
        		"<tr><td>ll</td><td style='text-align:right'>lr</td></tr>" +
        		"</table>";
    	}
        
      var id ="renderToSVGDiv"
      var div =
        "<div id='"+id+"' xmlns='http://www.w3.org/1999/xhtml' style='font:"+defaultFont+"'>" +
          html+
        "</div>";
      
      if (node.data.box) {
        node.data.box = drawBox(pt, node.data.box[2], node.data.box[3], node)
      } else {
//        window.document.getElementById('hiddenSVGDiv').innerHTML = "<div style='position:absolute;left:-999em;'>"+div+"</div>"
        window.document.getElementById('halfvizSVGDiv').innerHTML = div
        var element = canvas.ownerDocument.getElementById(id);
        node.data.box = drawBox(pt, element.clientWidth+(horizMargin*2), element.clientHeight+(vertMargin*2), node)
      }
      if (node.data.img) {
        if (node.data.imgIsLoaded) {
    	    ctx.drawImage(node.data.img, node.data.box[0]+horizMargin, node.data.box[1]+vertMargin)
        }
      } else {
        var DOMURL = self.URL || self.webkitURL || self;
      	var img = new Image();
        var svgText = 
          "<svg xmlns='http://www.w3.org/2000/svg' width='"+node.data.box[2]+"' height='"+node.data.box[3]+"'>" +
          "<foreignObject width='100%' height='100%'>" +
            "<div id='"+id+"' xmlns='http://www.w3.org/1999/xhtml' style='font:"+defaultFont+
                ";width="+node.data.box[2]+"px;height="+node.data.box[3]+"px'>" +
              html+
            "</div>"+
          "</foreignObject>" +
          "</svg>";
        var svg = new Blob([svgText], {type: "image/svg+xml;charset=utf-8"});
        var url = DOMURL.createObjectURL(svg);
        img.width = node.data.box[2]
        img.height = node.data.box[3]
      	img.onload = function() {
          node.data.box = drawBox(pt, node.data.box[2], node.data.box[3], node)
          node.data.img = img
          node.data.imgIsLoaded = true
    	    ctx.drawImage(img, node.data.box[0]+horizMargin, node.data.box[1]+vertMargin)
          DOMURL.revokeObjectURL(url);
      	};
        node.data.imgIsLoaded = false
        //img.src = "data:image/svg+xml,"+svgText
        img.src = url;
      }
  
      return node.data.box
    }
    
    var that = {
        
  	  fixed:false,
      
      init:function(system){
        
        particleSystem = system
        particleSystem.screenSize(canvas.width, canvas.height) 
        particleSystem.screenPadding(40)

        that.initMouseHandling()
      },

      redraw:function(){
        if (!particleSystem) return

        gfx.clear() // convenience ƒ: clears the whole canvas rect

        // draw the nodes & save their bounds for edge drawing
        var nodeBoxes = {}
        particleSystem.eachNode(function(node, pt){
          // node: {mass:#, p:{x,y}, name:"", data:{}}
          // pt:   {x:#, y:#}  node position in screen coords
              
          // determine the box size and round off the coords if we'll be 
          // drawing a text label (awful alignment jitter otherwise...)
          var font
          if (node.data.font) {
        	font = node.data.font
          } else {
        	font = "12px Helvetica"
          }
          
          if (node===mouse.node) {
          	pt.x = mouse.x
          	pt.y = mouse.y
          }
          
          if (node.data.html) {
            nodeBoxes[node.name] = drawHtml(node, pt, font)
          } else {
            nodeBoxes[node.name] = drawText(node, pt, font)
          }
        })

        // draw the edges
        particleSystem.eachEdge(function(edge, pt1, pt2){
          // edge: {source:Node, target:Node, length:#, data:{}}
          // pt1:  {x:#, y:#}  source position in screen coords
          // pt2:  {x:#, y:#}  target position in screen coords

          var weight = edge.data.weight
          var color = edge.data.color

          if (!color || (""+color).match(/^[ \t]*$/)) color = null

          // find the start point
          var tail = intersect_line_box(pt1, pt2, nodeBoxes[edge.source.name])
          var head = intersect_line_box(tail, pt2, nodeBoxes[edge.target.name])

          ctx.save() 
            ctx.beginPath()
            ctx.lineWidth = (!isNaN(weight)) ? parseFloat(weight) : 1
            ctx.strokeStyle = (color) ? color : "#cccccc"
            //ctx.fillStyle = null // this appears to be illegal

            ctx.moveTo(tail.x, tail.y)
            ctx.lineTo(head.x, head.y)
            ctx.stroke()
          ctx.restore()

          // draw an arrowhead if this is a -> style edge
          if (edge.data.directed){
            ctx.save()
              // move to the head position of the edge we just drew
              var wt = !isNaN(weight) ? parseFloat(weight) : 1
              var arrowLength = 6 + wt
              var arrowWidth = 2 + wt
              ctx.fillStyle = (color) ? color : "#cccccc"
              ctx.translate(head.x, head.y);
              ctx.rotate(Math.atan2(head.y - tail.y, head.x - tail.x));

              // delete some of the edge that's already there (so the point isn't hidden)
              ctx.clearRect(-arrowLength/2,-wt/2, arrowLength/2,wt)

              // draw the chevron
              ctx.beginPath();
              ctx.moveTo(-arrowLength, arrowWidth);
              ctx.lineTo(0, 0);
              ctx.lineTo(-arrowLength, -arrowWidth);
              ctx.lineTo(-arrowLength * 0.8, -0);
              ctx.closePath();
              ctx.fill();
            ctx.restore()
          }
        })



      },
      initMouseHandling:function(){
        // no-nonsense drag and drop (thanks springy.js)
        selected = null;
        nearest = null;
        var dragged = null;
        var oldmass = 1

        // set up a handler object that will initially listen for mousedowns then
        // for moves and mouseups while dragging
        var handler = {
          clicked:function(e){
            var pos = $(canvas).offset();
            _mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)
            selected = nearest = dragged = particleSystem.nearest(_mouseP);
            mouse.node = selected.node
            mouse.x = _mouseP.x
            mouse.y = _mouseP.y

            if (dragged.node !== null) dragged.node.fixed = true

            $(canvas).bind('mousemove', handler.dragged)
            $(window).bind('mouseup', handler.dropped)

            return false
          },
          dragged:function(e){
            var old_nearest = nearest && nearest.node._id
            var pos = $(canvas).offset();
            var s = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)
            mouse.x = s.x
            mouse.y = s.y

            if (!nearest) return
            if (dragged !== null && dragged.node !== null){
              var p = particleSystem.fromScreen(s)
              dragged.node.p = p
            }

            return false
          },

          dropped:function(e){
            if (dragged===null || dragged.node===undefined) return
            if (dragged.node !== null) dragged.node.fixed = that.fixed
            //dragged.node.tempMass = 1000
            dragged.node.tempMass = 50
            dragged = null
            selected = null
            mouse.node = null
            $(canvas).unbind('mousemove', handler.dragged)
            $(window).unbind('mouseup', handler.dropped)
            _mouseP = null
            return false
          }
        }
        $(canvas).mousedown(handler.clicked);

      }

    }

    // helpers for figuring out where to draw arrows (thanks springy.js)
    var intersect_line_line = function(p1, p2, p3, p4)
    {
      var denom = ((p4.y - p3.y)*(p2.x - p1.x) - (p4.x - p3.x)*(p2.y - p1.y));
      if (denom === 0) return false // lines are parallel
      var ua = ((p4.x - p3.x)*(p1.y - p3.y) - (p4.y - p3.y)*(p1.x - p3.x)) / denom;
      var ub = ((p2.x - p1.x)*(p1.y - p3.y) - (p2.y - p1.y)*(p1.x - p3.x)) / denom;

      if (ua < 0 || ua > 1 || ub < 0 || ub > 1)  return false
      return arbor.Point(p1.x + ua * (p2.x - p1.x), p1.y + ua * (p2.y - p1.y));
    }

    var intersect_line_box = function(p1, p2, boxTuple)
    {
      var p3 = {x:boxTuple[0], y:boxTuple[1]},
          w = boxTuple[2],
          h = boxTuple[3]

      var tl = {x: p3.x, y: p3.y};
      var tr = {x: p3.x + w, y: p3.y};
      var bl = {x: p3.x, y: p3.y + h};
      var br = {x: p3.x + w, y: p3.y + h};

      return intersect_line_line(p1, p2, tl, tr) ||
            intersect_line_line(p1, p2, tr, br) ||
            intersect_line_line(p1, p2, br, bl) ||
            intersect_line_line(p1, p2, bl, tl) ||
            false
    }

    return that
  }    
  
})()
