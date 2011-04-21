
(function(){

//define a object for an envronment here

var Environment = function(parent) {
  this.parent = parent;
  this.table = {'a':5};
  this.lookup = function(expr) {
    if (this.table[expr]) {
      return this.table[expr]
    } else if (this.parent) {
      return this.parent.lookup(expr);
    } else {
      return false;
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
    }
  };

  obj.apply = function(procedure, exprs) {

  };
  
  obj.parse = function(str) {
    return str;
  }

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
    return str.substr(1,str.length);
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
      if (e.keyCode==38) {
        if (obj.buffer.length > obj.bufferCounter) {
          obj.bufferCounter+=1;
          this.value = obj.buffer[obj.buffer.length-obj.bufferCounter];
        }
      } else if (e.keyCode==40) {
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


