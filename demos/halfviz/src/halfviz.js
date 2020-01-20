//
// halfviz.js
//
// instantiates all the helper classes, sets up the particle system + renderer
// and maintains the canvas/editor splitview
//

(function(){
  
  trace = arbor.etc.trace
  objmerge = arbor.etc.objmerge
  objcopy = arbor.etc.objcopy
  var parse = Parseur().parse

  var HalfViz = function(elt){
    var dom = $(elt)

    sys = arbor.ParticleSystem(2600, 512, 0.5)
    sys.renderer = Renderer("#viewport") // our newly created renderer will have its .init() method called shortly by sys...
    sys.screenPadding(20)
    
    var _ed = dom.find('#editor')
    var _code = dom.find('textarea')
    var _canvas = dom.find('#viewport').get(0)
    var _grabber = dom.find('#grabber')
    
    var _updateTimeout = null
    var _current = null // will be the id of the doc if it's been saved before
    var _editing = false // whether to undim the Save menu and prevent navigating away
    var _failures = null
    
    var that = {
      canvas:_canvas,
      window:window,
      network:null,
      dashboard:Dashboard("#dashboard", sys),
      io:IO("#editor .io"),
    	defaultNodeFont:"10px Arial",
      init:function(){
        
        $(window).resize(that.resize)
        that.resize()
        that.updateLayout(Math.max(1, $(window).width()-340))

        if (_code.length > 0) {
          _code.keydown(that.typing)
          _grabber.bind('mousedown', that.grabbed)

          $(that.io).bind('get', that.getDoc)
          $(that.io).bind('clear', that.newDoc)
        }
        that.dashboard.setHalfViz(that)
        sys.renderer.setHalfViz(that)
        return that
      },
      
      getDoc:function(e){
        $.getJSON(arbor.etc.arbor_path()+'../demos/halfviz/library/'+e.id+'.json', function(doc){

          // update the system parameters
          if (doc.sys){
            sys.parameters(doc.sys)
            that.dashboard.update()
          }

          // modify the graph in the particle system
          _code.val(doc.src)
          that.updateGraph()
          that.resize()
          _editing = false
        })
        
      },

      newDoc:function(){
        var lorem = "; example global style\n" +
        		"{shadow:true,fontcolor:blue}\n" +
        		"->{weight:2,fontcolor:green}\n\n" +
        		//"{shadow:true, edge-font:8px Times New Roman}\n\n" +
        		"; some example nodes\n" +
        		"hello {color:red, label:HELLO}\n" +
        		"world {color:orange,html:test}\n" +
        		"lonely {html:<span style='font-weight:bold;font-family:Times'>Goodbye, <p>cruel world</p></span>}\n\n" +
        		"; some edges\n" +
        		"{shadow:false}\n" +
        		"hello -- world {color:#223344}\n" +
        		"foo -> bar {weight:5, font:italic 20px Arial}\n" +
        		"bar -> baz {weight:2,label:agIye,font:14px Times,labelbackground:pink,fontcolor:red}\n" +
        		"bar -> hello {label:to say}\n" +
        		"hello -> bar";
        
        _code.val(lorem).focus()
        $.address.value("")
        that.updateGraph()
        that.resize()
        _editing = false
      },

      redraw:function(){
        sys.renderer.redraw()
      },

      getParameters:function(){
        return sys.parameters()
      },

      setParameters:function(parameters){
        sys.parameters(parameters)
        that.dashboard.update()
        sys.renderer.redraw()
      },

      updateGraph:function(e){
        if (_code.length > 0) {
          var src_txt = _code.val()
          that.setNetwork(parse(src_txt))
        } else {
        	that.setNetwork(that.network)
        }
      },
      
      setNetwork:function(network) {
        if (network == null) {
        	network = {nodes:[],edges:[]}
        }
        that.network = network
        var fixed = false;
        if (Object.keys(network.nodes).length < 2) {
        /* Resolve a bug when there is only one node,
           otherwise it bounces around the screen like crazy */
          fixed = true;
        }
        sys.renderer.fixed = fixed;
        $.each(network.nodes, function(nname, ndata){
          if (ndata.label===undefined) ndata.label = nname
          ndata.fixed = fixed;
        })
        if (network.parameters) {
        	sys.parameters(network.parameters)
          that.dashboard.update()
        }
        sys.merge(network)
        _updateTimeout = null
      },
      
      pick:function(x,y){
        return sys.renderer.pick(x,y)
      },
      
      resize:function(){        
        var w = $(window).width() - 40
        var x = w - _ed.width()
        that.updateLayout(x)
        sys.renderer.redraw()
      },
      
      updateLayout:function(split){
        var canvW = 0
        var canvH = 0
        if (_grabber.length > 0) {
          var w = dom.width()
          var h = _grabber.height()
          var split = split || _grabber.offset().left
          var splitW = _grabber.width()
          _grabber.css('left',split)
  
          var edW = w - split
          var edH = h
          _ed.css({width:edW, height:edH})
          if (split > w-20) _ed.hide()
          else _ed.show()
  
          canvW = split - splitW
          canvH = h
        } else {
          canvW = dom.width()
          canvH = dom.height()
        }
        _canvas.width = canvW
        _canvas.height = canvH
        sys.screenSize(canvW, canvH)
                
        if (_code.length > 0) {
          _code.css({height:h-20,  width:edW-4, marginLeft:2})
        }
      },
      
      grabbed:function(e){
        $(window).bind('mousemove', that.dragged)
        $(window).bind('mouseup', that.released)
        return false
      },
      dragged:function(e){
        var w = dom.width()
        that.updateLayout(Math.max(10, Math.min(e.pageX-10, w)) )
        sys.renderer.redraw()
        return false
      },
      released:function(e){
        $(window).unbind('mousemove', that.dragged)
        return false
      },
      typing:function(e){
        var c = e.keyCode
        if ($.inArray(c, [37, 38, 39, 40, 16])>=0){
          return
        }
        
        if (!_editing){
          $.address.value("")
        }
        _editing = true
        
        if (_updateTimeout) clearTimeout(_updateTimeout)
        _updateTimeout = setTimeout(that.updateGraph, 900)
      }
    }
    
    return that.init()    
  }


  $(document).ready(function(){
    var mcp = HalfViz("#halfviz");
      /* this helps GWT apps embedded in iframes find the halfviz object */
    document.halfviz = mcp; 
    if (document.onHalfVizLoaded) {
    	document.onHalfVizLoaded(mcp)
    }
  })

  
})()
