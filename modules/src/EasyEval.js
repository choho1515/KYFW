/*

[ EasyEval ]

Version 2.0b
Developed by LsmLands

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.

*/

const SAFEEVAL_DEFAULT_NAME = "EasyEval.js";    // SafeEval Sources' Default Name
const SAFEEVAL_DEFAULT_TIEMOUT = 3000;          // SafeEval Sources' Default Timeout
const SAFEEVAL_DEFAULT_DEPTH = 1000;            // SafeEval Sources' Default Max Depth
const SAFEEVAL_DEFAULT_RULE_ALLOW = false;      // SafeEval Blocker Rules' Default Permission

const EASYEVAL_ENABLE = true;                   // EasyEval Commands Enable
const EASYEVAL_PREFIX = "@eval";                // EasyEval Commands Prefix

const USEREVAL_ENABLE = true;                   // UserEval Commands Enable
const USEREVAL_PREFIX = "@user";                // UserEval Commands Prefix
const USEREVAL_PREFIX_RESET = "@reset";         // UserEval Commands Prefix for Users Data Reset
const USEREVAL_MAX_USER = 20;                   // UserEval Max Users Limit

const SafeEval = {  // Deprecated
    toSecureString: function(obj, isError) {    // Deprecated
        if (obj === null || obj === undefined || typeof obj.toString != "function") {
            return "Object is Empty (NULL / Undefined)";
        }

        try {
            return isError ? (obj.name + ": " + obj.message + " (" + obj.fileName + "#" + obj.lineNumber + ")") : obj.toString();
        } catch (err) {
            return "Security Error";
        }
    },

    run: function(src, name, timeout, depth, isClassVisible /* Not Working */, objData, scope, isJavaEnabled, ruleList) {   // Deprecated
        if (!src) {
            return null;
        }

        var factory = org.mozilla.javascript.ContextFactory.getGlobal();
        var cx = factory.enterContext();
        var field = cx.class.getDeclaredField("hasClassShutter");
        var setter = cx.getClassShutterSetter();
        var isRunning = false;
        var isDone, msg;

        scope = scope ? scope : (isJavaEnabled ? cx.initStandardObjects() : cx.initSafeStandardObjects());

        cx.setOptimizationLevel(-1);
        cx.setInstructionObserverThreshold(timeout ? timeout : SAFEEVAL_DEFAULT_TIEMOUT);
        cx.setMaximumInterpreterStackDepth(depth ? depth : SAFEEVAL_DEFAULT_DEPTH);
        cx.getWrapFactory().setJavaPrimitiveWrap(false);

        if (org.mozilla.javascript.Context.VERSION_ES6) {
            cx.setLanguageVersion(org.mozilla.javascript.Context.VERSION_ES6);
        }

        setter.setClassShutter(new org.mozilla.javascript.ClassShutter({
            visibleToScripts: function(fullClassName) {
                if (!isRunning || fullClassName == "org.mozilla.javascript.Context") {
                    return true;
                }

                if (fullClassName == "java.lang.Class" || fullClassName == "org.mozilla.javascript.EcmaError") {
                    return false;
                }

                ruleList = ruleList ? ruleList : [];

                for (var i in ruleList) {
                    var match = fullClassName.match(ruleList[i].regex);

                    if (match && fullClassName == match[0]) {
                        return ruleList[i].isAllow;
                    }
                }

                return SAFEEVAL_DEFAULT_RULE_ALLOW;
            }
        }));

        org.mozilla.javascript.ScriptableObject.putProperty(scope, "CallSite", function() {});

        org.mozilla.javascript.ScriptableObject.putProperty(scope, "\x67\x65\x74\x41\x75\x74\x68\x6F\x72", function() {
            return "\x4C\x73\x6D\x4C\x61\x6E\x64\x73";
        });

        org.mozilla.javascript.ScriptableObject.putProperty(scope, "\x69\x73\x43\x6F\x70\x79\x50\x61\x73\x74\x65", function() {
            return true;    // Remove This if You are Not a Noob!
        });

        if (objData) {
            for (var key in objData) {
                org.mozilla.javascript.ScriptableObject.putProperty(scope, key, objData[key]);
            }
        }

        isRunning = true;

        try {
            msg = SafeEval.toSecureString(cx.evaluateString(scope, src, name ? name : SAFEEVAL_DEFAULT_NAME, 1,  null), false);
            isDone = true;
        } catch (err) {
            msg = SafeEval.toSecureString(err, true);
            isDone = false;
        }

        isRunning = false;

        field.setAccessible(true);
        field.setBoolean(cx, false);

        cx.setOptimizationLevel(-1);
        cx.setInstructionObserverThreshold(java.lang.Integer.MAX_VALUE);
        cx.setMaximumInterpreterStackDepth(java.lang.Integer.MAX_VALUE);
        cx.getWrapFactory().setJavaPrimitiveWrap(true);

        setter.setClassShutter(null);
        org.mozilla.javascript.Context.exit();

        return new EasyEvalResult(isDone, msg, scope);
    }
};

exports.EasyEval = function () {
    function EasyEval(name) {
        this.name = name ? name : SAFEEVAL_DEFAULT_NAME;
    
        this.timeout = SAFEEVAL_DEFAULT_TIEMOUT;
        this.depth = SAFEEVAL_DEFAULT_DEPTH;
        this.objData = {};
    
        this.isJavaEnabled = false;
        this.ruleList = [];
    
        this.executor = new java.util.concurrent.ThreadPoolExecutor(0, java.lang.Runtime.getRuntime().availableProcessors(), 1, java.util.concurrent.TimeUnit.MINUTES, new java.util.concurrent.LinkedBlockingQueue());
        this.executor.allowCoreThreadTimeOut(true);
    }
    
    EasyEval.prototype.putObject = function(key, value) {
        if (key) {
            this.objData[key] = value;
        }
    };
    
    EasyEval.prototype.putFunction = function(key, func, obj) {
        if (!key || !func || typeof func != "function") {
            return;
        }
    
        this.putObject(key, function() {
            var args = [];
    
            for (var i in arguments) {
                args.push(arguments[i]);
            }
    
            return func.apply(obj, args);
        });
    };
    
    EasyEval.prototype.removeObject = function(key) {
        if (key && this.objData[key]) {
            delete this.objData[key];
        }
    };
    
    EasyEval.prototype.addRule = function(regex, isAllow) {
        if (regex) {
            this.ruleList.push(new EasyEvalRule(regex, isAllow));
        }
    };
    
    EasyEval.prototype.removeRule = function(index) {
        if (index && index >= 0 && index < this.ruleList.length) {
            this.ruleList.splice(index, 1);
        }
    };
    
    EasyEval.prototype.exec = function(src, scope, callback) {
        if (!src) {
            return;
        }
    
        var obj = this;
    
        this.executor.execute(new java.lang.Runnable({
            run: function() {
                try {
                    var result = SafeEval.run(src, obj.name, obj.timeout, obj.depth, false, obj.objData, scope, obj.isJavaEnabled, obj.ruleList);
    
                    if (callback) {
                        callback(result);
                    }
                } catch (ignore) {}
            }
        }));
    };
    
    EasyEval.prototype.runCommand = function(replier, msg) {
        if (!EASYEVAL_ENABLE || !replier || !msg || !msg.startsWith(EASYEVAL_PREFIX + " ")) {
            return;
        }
    
        this.exec(msg.substring(EASYEVAL_PREFIX.length + 1), null, function(result) {
            //return "Eval " + (result.isDone ? "Result" : "Error") + ": " + result.msg
            replier.reply("Eval " + (result.isDone ? "Result" : "Error") + ": " + result.msg);
        });
    };
    
    function EasyEvalRule(regex, isAllow) {
        this.regex = regex;
        this.isAllow = isAllow;
    }
    
    function EasyEvalResult(isDone, msg, scope) {
        this.isDone = isDone;
        this.msg = msg;
        this.scope = scope;
    }
    
    EasyEvalResult.prototype.toString = EasyEvalResult.prototype.toSource = function() {
        return this.msg;
    };
    
    function UserEval(easyEval) {
        this.easyEval = easyEval ? easyEval : new EasyEval(SAFEEVAL_DEFAULT_NAME);
    
        this.userList = [];
        this.userData = {};
    }
    
    UserEval.prototype.exec = function(userName, src, scope, callback) {
        if (!userName || !src) {
            return;
        }
    
        if (!this.userData[userName]) {
            if (USEREVAL_MAX_USER > 0 && this.userList.length >= USEREVAL_MAX_USER) {
                delete this.userData[this.userList.shift()];
            }
    
            this.userList.push(userName);
            this.userData[userName] = new UserEvalData(userName);
        }
    
        var obj = this;
    
        this.easyEval.exec(src, scope ? scope : this.userData[userName].scope, function(result) {
            obj.userData[userName].scope = result.scope;
    
            if (callback) {
                callback(result);
            }
        });
    };
    
    UserEval.prototype.runCommand = function(replier, sender, msg) {
        if (!USEREVAL_ENABLE || !replier || !sender || !msg) {
            return;
        }
    
        if (msg.startsWith(USEREVAL_PREFIX + " ")) {
            this.exec(sender, msg.substring(USEREVAL_PREFIX.length + 1), null, function(result) {
                replier.reply("User " + (result.isDone ? "Result" : "Error") + ": " + result.msg);
            });
        } else if (msg.startsWith(USEREVAL_PREFIX_RESET) && this.userData[sender]) {
            this.userList.splice(this.userList.indexOf(sender), 1);
            delete this.userData[sender];
    
            replier.reply("User Reset");
        }
    };
    
    function UserEvalData(name) {
        this.name = name;
        this.scope = null;
        this.extra = {};
    }
    return EasyEval
}

/*

[ Sample Source for ManDongI-Family Bot ]

var easyEval = new EasyEval(SAFEEVAL_DEFAULT_NAME);
var userEval = new UserEval(easyEval);

function response(room, msg, sender, isGroupChat, replier) {
    easyEval.runCommand(replier, msg);
    userEval.runCommand(replier, sender, msg);
}

*/