
(function(){

//define a object for an envronment here

var Environment = function(parent) {
  this.parent = parent;
  this.table = {};
  this.children = [];
  this.lookup = function(expr) {
    if (this.table[expr]) {
      return this.table[expr]
    } else if (this.parent) {
      return this.parent.lookup(expr);
    } else {
      return null;
    }
  }
  this.contains = function(name) {
    return this.table[name] != undefined
  }
  this.set = function(name, value) {
    this.table[name] = value;
  }
  this.extend = function(formal_parameters, actual_parameters) {
    var e = new Environment(this);
    for (i = 0; i < formal_parameters.length; i++) {
      e.table[formal_parameters[i]] = actual_parameters[i];
    }
    return e;
  }
}  

var Procedure = function(parameters, body, env) {
  this.parameters = parameters;
  this.body = body;
  this.env = env;
}

var Evaluator = function() {
  var obj = {};
  
  obj.env = new Environment(null);
  obj.env_div = "";  
  
  function draw_env() {
    function text_for_env(env) {
      var s = "<div class='env_box'>"
      for (var p in env.table) {
        if (is_procedure(env.table[p])) {
          s += "proc " + p + "<br/>";
        } else {
          s += p + ": " + env.table[p] + "<br/>";
        }
      }
      for (i = 0; i < env.children.length; i++) {
        s += text_for_env(env.children[i]);
      }
      s += "</div>"
      return s;
    }
    obj.env_div.innerHTML = "" + text_for_env(obj.env) + "</div>";
  }
  
  obj.eval = function(expr, env) {
    if (isEmpty(expr)) {
      return;
    } else if (isNumber(expr)) {
      return parseFloat(expr);
    } else if (isString(expr)) {
      return expr;
    } else if (isBoolean(expr)) {
      return !(expr == "false");
    } else if (isVariable(expr)) {
      return env.lookup(expr);
    } else if (isAssignment(expr)) {
      return obj.eval_assignment(expr, env);
    } else if (isIf(expr)) {
      return obj.eval_if(expr, env);
    } else if (isSimpleProc(expr)) {
      return expr;
    } else if (isLambda(expr)) {
      expr.shift() //remove lambda
      var param = expr[0];
      expr.shift();
      return new Procedure(param, expr, env);
    } else if (isDefine(expr)) {
      return obj.eval_define(expr, env);
    } else if (isApply(expr)) {
      var proc = obj.eval(expr.shift(), env);
      var args = expr.map(function(e) { return obj.eval(e, env); });
      return obj.apply(proc, args, env)
    } else {
      return "Unknown operation";
    }
  };
  
  obj.eval_assignment = function(expr, env) {    
    var name = expr[1];
    var value = obj.eval(expr[2], env);
    if (value != null) {
      e = env;
      found = false;
      while (e != null) {
        if (e.contains(name)) {
          e.set(name, value);
          found = true;
          break;
        } else {
          e = e.parent;
        }
      }
      if (!found) {
        env.set(name, value);        
      }
    }
    draw_env();
    return value;
  }
  obj.eval_define = function(expr, env) {
    var value;
    if (is_list(expr[1])) {
      expr.shift();
      var name = expr[0].shift();
      var param = expr[0];
      expr.shift();
      var value = new Procedure(param, expr, env);
      env.set(name, value);
    } else {
      var name = expr[1];
      var value = obj.eval(expr[2], env);
      if (value != null) {
        env.set(name, value);
      }
    }
    draw_env();
    return value;
  }
  obj.eval_if = function(expr, env) {
    var pred = obj.eval(expr[1], env);
    if (pred) {
      return obj.eval(expr[2], env);
    } else if (expr.length == 4) {
      return obj.eval(expr[3], env);
    }
    return null;
  }

  obj.apply = function(procedure, args, env) {
    if (isSimpleProc(procedure)) {
      var v = obj.applySimple(procedure, args); 
      return v;
    } else {
      var e = env.extend(procedure.parameters, args);
      var r = false;
      for (i = 0; i < procedure.body.length; i++) {
        r = obj.eval(procedure.body[i], e);
      }
      return r;
    }
  };
  
  obj.applySimple = function(procedure,args) {
    if (procedure == "+") {
      return args.reduce(function(a,b) {return a+b;});
    }
    if (procedure == "-") {
      return args.reduce(function(a,b) {return a-b;});
    }
    if (procedure == "*") {
      return args.reduce(function(a,b) {return a*b;});
    }
    if (procedure == "/") {
      return args.reduce(function(a,b) {return a/b;});
    }
    if (procedure == "=") {
      return args[0] === args[1];
    }
    if (procedure == "!") {
      return !args[0];
    }

  }


  function isEmpty(expr) {
    return expr == "";
  }
  function isNumber(expr) {
    return !is_list(expr) && (~isNaN(expr-0)) && /^[0-9]+(\.[0-9]*)?$/.test(expr);
  }
  function isString(expr) {
    return !is_list(expr) && (/^\".*\"$/.test(expr));
  }
  function isBoolean(expr) {
    return expr == "false" || expr == "true";
  }
  function isVariable(expr) {
    return !is_list(expr) && (/^[a-zA-Z]+$/.test(expr));
  }
  function isAssignment(expr) {
    return (is_list(expr) && expr[0] == "set!");
  }
  function isIf(expr) {
    return (is_list(expr) && expr[0] == "if");
  }
  function isLambda(expr) {
    return (is_list(expr) && expr[0] == "lambda" && expr.length > 2);
  }
  function isDefine(expr) {
    return (is_list(expr) && expr[0] == "define" && expr.length > 2);
  }
  function isApply(expr) {
    return (is_list(expr));
  }
  function isSimpleProc(procedure) {
    return (procedure === "+" ||
            procedure === "-" ||
            procedure === "*" ||
            procedure === "/" ||
            procedure === "!" ||
            procedure === "=");
  }

  function first(str) {
    return str.charAt(0)
  }
  function rest(str) {
    return str.substring(1,str.length-2);
  }
  function is_list(expr) {
    return expr && typeof expr === 'object' && expr.constructor === Array;
  }
  function is_procedure(expr) {
    return expr && typeof expr === 'object' && expr.constructor === Procedure;    
  }


  obj.parse = function(str) {
    function parseString(substr) {
      //lexer with state
      function getToken() {
        var tok = "";
        while (substr.charAt(0) == " ") {
          substr = substr.substring(1,substr.length);
        }
        if (substr.charAt(0) == "(" || substr.charAt(0) == ")") {
          tok = substr.charAt(0);
          substr = substr.substring(1,substr.length);
        } else {
          while (substr.length > 0 && substr.charAt(0) != " " && substr.charAt(0) != ")") {
            tok += substr.charAt(0);
            substr = substr.substring(1,substr.length);            
          }
        }
        return tok;
      }
      //two parsing functions
      function parseList() { //returns a list
        var tok = "";
        var list = [];
        while ((tok = getToken()) != "") {
          if (tok === "(") {
            list.push(parseList());
          } else if (tok === ")") {
            return list;
          } else {
            list.push(tok);
          }
        }        
      }
      function parseSection() {
        var tok = "";
        while ((tok = getToken()) != "") {
          if (tok === "(") {
            return parseList();
          } else {
            return tok;
          }
        }        
      }
      return parseSection();
    }
    
    return parseString(str);
  }  

  
  return obj;
};

var Console = function(container_id, evaluator) {
  //object to create:
  var obj = {};
  
  //private variables:
  var console_form = "";
  var console_inpt = "";
  var console_outp = "";
  
  obj.buffer = []
  obj.bufferCounter = 0;
  //public functions
  obj.eventInput = function(str) {
    obj.buffer.push(str);
    console_outp.innerHTML += "> " + str + "\n";
    console_outp.innerHTML += evaluator.eval(evaluator.parse(str), evaluator.env) + "\n";
  };
  
  //private functions
  var buildConsole = function(container, name) {
    function getHTML(name) {
      var f = "";
      f += "<form id='"+name+"_form' onSubmit='javascript:return false;'>";
      f += "<textarea id='"+name+"_output' style='width: 600px; height: 400px;'></textarea><br/>";
      f += "<input id='"+name+"_input' style='width: 600px' autocomplete=off onfocus='this.value = this.value;'/>";
      f += "</form>";
      f += "<div class='console_env'><h4>Environment</h4><div id='"+name+"_env'></div></div>"
      return f;      
    }
    container.innerHTML = getHTML(name);
    console_form = document.getElementById(name+"_form");
    console_inpt = document.getElementById(name+"_input");
    console_outp = document.getElementById(name+"_output");
    
    evaluator.env_div = document.getElementById(name+"_env");
    
    console_form.addEventListener('submit', function() { 
        var input = this.childNodes[2].value;
        this.childNodes[2].value = "";
        if (input != "")
          obj.eventInput(input); 
      });
    console_inpt.addEventListener('keydown', function(e) {
      if (e.keyCode==38) { //down arrow
        if (obj.buffer.length > obj.bufferCounter) {
          obj.bufferCounter+=1;
          this.value = obj.buffer[obj.buffer.length-obj.bufferCounter];
        }
      } else if (e.keyCode==40) { //up arrow
        if (obj.buffer.length > obj.bufferCounter-1 && obj.bufferCounter > 1) {
          obj.bufferCounter-=1;
          this.value = obj.buffer[obj.buffer.length-obj.bufferCounter];
        } else {
          obj.bufferCounter=0;
          this.value = "";
        }
      } else if (e.keyCode==13) {
        obj.bufferCounter = 0;
      }
    });
    console_inpt.focus();
  }
  
  //constructor
  var c = document.getElementById(container_id);
  buildConsole(c, container_id);  
}

var evaluator;
var console;

window.onload = function() {
  evaluator = Evaluator();
  console = Console('console01', evaluator);
};

if (!Array.prototype.map)
{
  Array.prototype.map = function(fun /*, thisp*/)
  {
    var len = this.length;
    if (typeof fun != "function")
      throw new TypeError();

    var res = new Array(len);
    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in this)
        res[i] = fun.call(thisp, this[i], i, this);
    }

    return res;
  };
}

if (!Array.prototype.reduce)
{
  Array.prototype.reduce = function(fun /*, initial*/)
  {
    var len = this.length;
    if (typeof fun != "function")
      throw new TypeError();

    // no value to return if no initial value and an empty array
    if (len == 0 && arguments.length == 1)
      throw new TypeError();

    var i = 0;
    if (arguments.length >= 2)
    {
      var rv = arguments[1];
    }
    else
    {
      do
      {
        if (i in this)
        {
          rv = this[i++];
          break;
        }

        // if array contains no values, no initial value to return
        if (++i >= len)
          throw new TypeError();
      }
      while (true);
    }

    for (; i < len; i++)
    {
      if (i in this)
        rv = fun.call(null, rv, this[i], i, this);
    }

    return rv;
  };
}

})();


