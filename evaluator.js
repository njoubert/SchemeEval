
(function(){

//define a object for an envronment here

var Environment = function(parent) {
  this.parent = parent;
  this.table = {'magic':5};
  this.lookup = function(expr) {
    if (this.table[expr]) {
      return this.table[expr]
    } else if (this.parent) {
      return this.parent.lookup(expr);
    } else {
      return "Variable Not Found: " + expr;
    }
  }
}  

var Evaluator = function() {
  var obj = {};
  
  obj.env = new Environment(null);
  
  obj.eval = function(expr, env) {

    //primitive
    if (isEmpty(expr)) {
      return false;
    } else if (isNumber(expr)) {
      return parseFloat(expr);
    } else if (isString(expr)) {
      return expr;
    } else if (isVariable(expr)) {
      return env.lookup(expr);
    } else if (isAssignment(expr)) {
      return obj.eval_assignment(expr, env);
    }
  };
  
  obj.eval_assignment = function(expr, env) {
    
  }

  obj.apply = function(procedure, exprs) {

  };


  function isEmpty(expr) {
    return expr == "";
  }
  function isNumber(expr) {
    return /^[0-9]+(\.[0-9]*)?$/.test(expr);
  }
  function isString(expr) {
    return /^\".*\"$/.test(expr);
  }
  function isVariable(expr) {
    return /^[a-zA-Z]+$/.test(expr);
  }

  function first(str) {
    return str.charAt(0)
  }
  function rest(str) {
    return str.substring(1,str.length-2);
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
      res = parseSection();
      return res;
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

})();


