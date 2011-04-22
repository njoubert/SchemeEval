
(function(){

//define a object for an envronment here

var Environment = function(parent) {
  this.parent = parent;
  this.table = {};
  this.lookup = function(expr) {
    if (this.table[expr]) {
      return this.table[expr]
    } else if (this.parent) {
      return this.parent.lookup(expr);
    } else {
      return "Variable Not Found: " + expr;
    }
  }
  this.set = function(name, value) {
    this.table[name] = value;
  }
}  

var Evaluator = function() {
  var obj = {};
  
  obj.env = new Environment(null);
  
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
    } else if (isApply(expr)) {
      var first = expr.shift();
      return obj.apply(first, expr, env)
    } else {
      return "Unknown operation";
    }
  };
  
  obj.eval_assignment = function(expr, env) {
    var name = expr[1];
    var value = obj.eval(expr[2], env);
    env.set(name, value);
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

  obj.apply = function(procedure, exprs, env) {
    if (isSimpleProc(procedure)) {
      var args = exprs.map(function(e) { return obj.eval(e, env); });
      return obj.applySimple(procedure, args);
    }
      return "Applying " + procedure + " to " + exprs;
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
    return !is_list(expr) && /^[0-9]+(\.[0-9]*)?$/.test(expr);
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
      return f;      
    }
    container.innerHTML = getHTML(name);
    console_form = document.getElementById(name+"_form");
    console_inpt = document.getElementById(name+"_input");
    console_outp = document.getElementById(name+"_output");

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


