var Module = typeof Module != "undefined" ? Module : {};
var moduleOverrides = Object.assign({}, Module);
var arguments_ = [];
var thisProgram = "./this.program";
var quit_ = (status, toThrow) => {
  throw toThrow;
};
var ENVIRONMENT_IS_WEB = typeof window == "object";
var ENVIRONMENT_IS_WORKER = typeof importScripts == "function";
var ENVIRONMENT_IS_NODE =
  typeof process == "object" &&
  typeof process.versions == "object" &&
  typeof process.versions.node == "string";
var ENVIRONMENT_IS_SHELL =
  !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (Module["ENVIRONMENT"]) {
  throw new Error(
    "Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)"
  );
}
var scriptDirectory = "";
function locateFile(path) {
  if (Module["locateFile"]) {
    return Module["locateFile"](path, scriptDirectory);
  }
  return scriptDirectory + path;
}
var read_, readAsync, readBinary, setWindowTitle;
if (ENVIRONMENT_IS_NODE) {
  if (
    typeof process == "undefined" ||
    !process.release ||
    process.release.name !== "node"
  )
    throw new Error(
      "not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)"
    );
  var nodeVersion = process.versions.node;
  var numericVersion = nodeVersion.split(".").slice(0, 3);
  numericVersion =
    numericVersion[0] * 1e4 +
    numericVersion[1] * 100 +
    numericVersion[2].split("-")[0] * 1;
  if (numericVersion < 101900) {
    throw new Error(
      "This emscripten-generated code requires node v10.19.19.0 (detected v" +
        nodeVersion +
        ")"
    );
  }
  var fs = require("fs");
  var nodePath = require("path");
  if (ENVIRONMENT_IS_WORKER) {
    scriptDirectory = nodePath.dirname(scriptDirectory) + "/";
  } else {
    scriptDirectory = __dirname + "/";
  }
  read_ = (filename, binary) => {
    filename = isFileURI(filename)
      ? new URL(filename)
      : nodePath.normalize(filename);
    return fs.readFileSync(filename, binary ? undefined : "utf8");
  };
  readBinary = (filename) => {
    var ret = read_(filename, true);
    if (!ret.buffer) {
      ret = new Uint8Array(ret);
    }
    assert(ret.buffer);
    return ret;
  };
  readAsync = (filename, onload, onerror, binary = true) => {
    filename = isFileURI(filename)
      ? new URL(filename)
      : nodePath.normalize(filename);
    fs.readFile(filename, binary ? undefined : "utf8", (err, data) => {
      if (err) onerror(err);
      else onload(binary ? data.buffer : data);
    });
  };
  if (!Module["thisProgram"] && process.argv.length > 1) {
    thisProgram = process.argv[1].replace(/\\/g, "/");
  }
  arguments_ = process.argv.slice(2);
  if (typeof module != "undefined") {
    module["exports"] = Module;
  }
  process.on("uncaughtException", (ex) => {
    if (
      ex !== "unwind" &&
      !(ex instanceof ExitStatus) &&
      !(ex.context instanceof ExitStatus)
    ) {
      throw ex;
    }
  });
  var nodeMajor = process.versions.node.split(".")[0];
  if (nodeMajor < 15) {
    process.on("unhandledRejection", (reason) => {
      throw reason;
    });
  }
  quit_ = (status, toThrow) => {
    process.exitCode = status;
    throw toThrow;
  };
  Module["inspect"] = () => "[Emscripten Module object]";
} else if (ENVIRONMENT_IS_SHELL) {
  if (
    (typeof process == "object" && typeof require === "function") ||
    typeof window == "object" ||
    typeof importScripts == "function"
  )
    throw new Error(
      "not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)"
    );
  if (typeof read != "undefined") {
    read_ = (f) => {
      return read(f);
    };
  }
  readBinary = (f) => {
    let data;
    if (typeof readbuffer == "function") {
      return new Uint8Array(readbuffer(f));
    }
    data = read(f, "binary");
    assert(typeof data == "object");
    return data;
  };
  readAsync = (f, onload, onerror) => {
    setTimeout(() => onload(readBinary(f)), 0);
  };
  if (typeof clearTimeout == "undefined") {
    globalThis.clearTimeout = (id) => {};
  }
  if (typeof scriptArgs != "undefined") {
    arguments_ = scriptArgs;
  } else if (typeof arguments != "undefined") {
    arguments_ = arguments;
  }
  if (typeof quit == "function") {
    quit_ = (status, toThrow) => {
      setTimeout(() => {
        if (!(toThrow instanceof ExitStatus)) {
          let toLog = toThrow;
          if (toThrow && typeof toThrow == "object" && toThrow.stack) {
            toLog = [toThrow, toThrow.stack];
          }
          err(`exiting due to exception: ${toLog}`);
        }
        quit(status);
      });
      throw toThrow;
    };
  }
  if (typeof print != "undefined") {
    if (typeof console == "undefined") console = {};
    console.log = print;
    console.warn = console.error =
      typeof printErr != "undefined" ? printErr : print;
  }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WORKER) {
    scriptDirectory = self.location.href;
  } else if (typeof document != "undefined" && document.currentScript) {
    scriptDirectory = document.currentScript.src;
  }
  if (scriptDirectory.indexOf("blob:") !== 0) {
    scriptDirectory = scriptDirectory.substr(
      0,
      scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1
    );
  } else {
    scriptDirectory = "";
  }
  if (!(typeof window == "object" || typeof importScripts == "function"))
    throw new Error(
      "not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)"
    );
  {
    read_ = (url) => {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, false);
      xhr.send(null);
      return xhr.responseText;
    };
    if (ENVIRONMENT_IS_WORKER) {
      readBinary = (url) => {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        xhr.responseType = "arraybuffer";
        xhr.send(null);
        return new Uint8Array(xhr.response);
      };
    }
    readAsync = (url, onload, onerror) => {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.responseType = "arraybuffer";
      xhr.onload = () => {
        if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
          onload(xhr.response);
          return;
        }
        onerror();
      };
      xhr.onerror = onerror;
      xhr.send(null);
    };
  }
  setWindowTitle = (title) => (document.title = title);
} else {
  throw new Error("environment detection error");
}
var out = Module["print"] || console.log.bind(console);
var err = Module["printErr"] || console.error.bind(console);
Object.assign(Module, moduleOverrides);
moduleOverrides = null;
checkIncomingModuleAPI();
if (Module["arguments"]) arguments_ = Module["arguments"];
legacyModuleProp("arguments", "arguments_");
if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
legacyModuleProp("thisProgram", "thisProgram");
if (Module["quit"]) quit_ = Module["quit"];
legacyModuleProp("quit", "quit_");
assert(
  typeof Module["memoryInitializerPrefixURL"] == "undefined",
  "Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead"
);
assert(
  typeof Module["pthreadMainPrefixURL"] == "undefined",
  "Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead"
);
assert(
  typeof Module["cdInitializerPrefixURL"] == "undefined",
  "Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead"
);
assert(
  typeof Module["filePackagePrefixURL"] == "undefined",
  "Module.filePackagePrefixURL option was removed, use Module.locateFile instead"
);
assert(
  typeof Module["read"] == "undefined",
  "Module.read option was removed (modify read_ in JS)"
);
assert(
  typeof Module["readAsync"] == "undefined",
  "Module.readAsync option was removed (modify readAsync in JS)"
);
assert(
  typeof Module["readBinary"] == "undefined",
  "Module.readBinary option was removed (modify readBinary in JS)"
);
assert(
  typeof Module["setWindowTitle"] == "undefined",
  "Module.setWindowTitle option was removed (modify setWindowTitle in JS)"
);
assert(
  typeof Module["TOTAL_MEMORY"] == "undefined",
  "Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY"
);
legacyModuleProp("read", "read_");
legacyModuleProp("readAsync", "readAsync");
legacyModuleProp("readBinary", "readBinary");
legacyModuleProp("setWindowTitle", "setWindowTitle");
assert(
  !ENVIRONMENT_IS_SHELL,
  "shell environment detected but not enabled at build time.  Add 'shell' to `-sENVIRONMENT` to enable."
);
var wasmBinary;
if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
legacyModuleProp("wasmBinary", "wasmBinary");
var noExitRuntime = Module["noExitRuntime"] || true;
legacyModuleProp("noExitRuntime", "noExitRuntime");
if (typeof WebAssembly != "object") {
  abort("no native wasm support detected");
}
var wasmMemory;
var ABORT = false;
var EXITSTATUS;
function assert(condition, text) {
  if (!condition) {
    abort("Assertion failed" + (text ? ": " + text : ""));
  }
}
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
function updateMemoryViews() {
  var b = wasmMemory.buffer;
  Module["HEAP8"] = HEAP8 = new Int8Array(b);
  Module["HEAP16"] = HEAP16 = new Int16Array(b);
  Module["HEAP32"] = HEAP32 = new Int32Array(b);
  Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
  Module["HEAPU16"] = HEAPU16 = new Uint16Array(b);
  Module["HEAPU32"] = HEAPU32 = new Uint32Array(b);
  Module["HEAPF32"] = HEAPF32 = new Float32Array(b);
  Module["HEAPF64"] = HEAPF64 = new Float64Array(b);
}
assert(
  !Module["STACK_SIZE"],
  "STACK_SIZE can no longer be set at runtime.  Use -sSTACK_SIZE at link time"
);
assert(
  typeof Int32Array != "undefined" &&
    typeof Float64Array !== "undefined" &&
    Int32Array.prototype.subarray != undefined &&
    Int32Array.prototype.set != undefined,
  "JS engine does not provide full typed array support"
);
assert(
  !Module["wasmMemory"],
  "Use of `wasmMemory` detected.  Use -sIMPORTED_MEMORY to define wasmMemory externally"
);
assert(
  !Module["INITIAL_MEMORY"],
  "Detected runtime INITIAL_MEMORY setting.  Use -sIMPORTED_MEMORY to define wasmMemory dynamically"
);
var wasmTable;
function writeStackCookie() {
  var max = _emscripten_stack_get_end();
  assert((max & 3) == 0);
  if (max == 0) {
    max += 4;
  }
  HEAPU32[max >> 2] = 34821223;
  checkInt32(34821223);
  HEAPU32[(max + 4) >> 2] = 2310721022;
  checkInt32(2310721022);
  HEAPU32[0 >> 2] = 1668509029;
  checkInt32(1668509029);
}
function checkStackCookie() {
  if (ABORT) return;
  var max = _emscripten_stack_get_end();
  if (max == 0) {
    max += 4;
  }
  var cookie1 = HEAPU32[max >> 2];
  var cookie2 = HEAPU32[(max + 4) >> 2];
  if (cookie1 != 34821223 || cookie2 != 2310721022) {
    abort(
      `Stack overflow! Stack cookie has been overwritten at ${ptrToString(
        max
      )}, expected hex dwords 0x89BACDFE and 0x2135467, but received ${ptrToString(
        cookie2
      )} ${ptrToString(cookie1)}`
    );
  }
  if (HEAPU32[0 >> 2] != 1668509029) {
    abort(
      "Runtime error: The application has corrupted its heap memory area (address zero)!"
    );
  }
}
(function () {
  var h16 = new Int16Array(1);
  var h8 = new Int8Array(h16.buffer);
  h16[0] = 25459;
  if (h8[0] !== 115 || h8[1] !== 99)
    throw "Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)";
})();
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
var runtimeKeepaliveCounter = 0;
function keepRuntimeAlive() {
  return noExitRuntime || runtimeKeepaliveCounter > 0;
}
function preRun() {
  if (Module["preRun"]) {
    if (typeof Module["preRun"] == "function")
      Module["preRun"] = [Module["preRun"]];
    while (Module["preRun"].length) {
      addOnPreRun(Module["preRun"].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function initRuntime() {
  assert(!runtimeInitialized);
  runtimeInitialized = true;
  checkStackCookie();
  setStackLimits();
  callRuntimeCallbacks(__ATINIT__);
}
function postRun() {
  checkStackCookie();
  if (Module["postRun"]) {
    if (typeof Module["postRun"] == "function")
      Module["postRun"] = [Module["postRun"]];
    while (Module["postRun"].length) {
      addOnPostRun(Module["postRun"].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
assert(
  Math.imul,
  "This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill"
);
assert(
  Math.fround,
  "This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill"
);
assert(
  Math.clz32,
  "This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill"
);
assert(
  Math.trunc,
  "This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill"
);
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;
var runDependencyTracking = {};
function addRunDependency(id) {
  runDependencies++;
  if (Module["monitorRunDependencies"]) {
    Module["monitorRunDependencies"](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval != "undefined") {
      runDependencyWatcher = setInterval(() => {
        if (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          return;
        }
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            err("still waiting on run dependencies:");
          }
          err("dependency: " + dep);
        }
        if (shown) {
          err("(end of list)");
        }
      }, 1e4);
    }
  } else {
    err("warning: run dependency added without ID");
  }
}
function removeRunDependency(id) {
  runDependencies--;
  if (Module["monitorRunDependencies"]) {
    Module["monitorRunDependencies"](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    err("warning: run dependency removed without ID");
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback();
    }
  }
}
function abort(what) {
  if (Module["onAbort"]) {
    Module["onAbort"](what);
  }
  what = "Aborted(" + what + ")";
  err(what);
  ABORT = true;
  EXITSTATUS = 1;
  var e = new WebAssembly.RuntimeError(what);
  throw e;
}
var FS = {
  error: function () {
    abort(
      "Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with -sFORCE_FILESYSTEM"
    );
  },
  init: function () {
    FS.error();
  },
  createDataFile: function () {
    FS.error();
  },
  createPreloadedFile: function () {
    FS.error();
  },
  createLazyFile: function () {
    FS.error();
  },
  open: function () {
    FS.error();
  },
  mkdev: function () {
    FS.error();
  },
  registerDevice: function () {
    FS.error();
  },
  analyzePath: function () {
    FS.error();
  },
  ErrnoError: function ErrnoError() {
    FS.error();
  },
};
Module["FS_createDataFile"] = FS.createDataFile;
Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
var dataURIPrefix = "data:application/octet-stream;base64,";
function isDataURI(filename) {
  return filename.startsWith(dataURIPrefix);
}
function isFileURI(filename) {
  return filename.startsWith("file://");
}
function createExportWrapper(name, fixedasm) {
  return function () {
    var displayName = name;
    var asm = fixedasm;
    if (!fixedasm) {
      asm = Module["asm"];
    }
    assert(
      runtimeInitialized,
      "native function `" +
        displayName +
        "` called before runtime initialization"
    );
    if (!asm[name]) {
      assert(
        asm[name],
        "exported native function `" + displayName + "` not found"
      );
    }
    return asm[name].apply(null, arguments);
  };
}
var wasmBinaryFile;
wasmBinaryFile = "AzureAIVisionFace.wasm";
if (!isDataURI(wasmBinaryFile)) {
  wasmBinaryFile = locateFile(wasmBinaryFile);
}
function getBinary(file) {
  try {
    if (file == wasmBinaryFile && wasmBinary) {
      return new Uint8Array(wasmBinary);
    }
    if (readBinary) {
      return readBinary(file);
    }
    throw "both async and sync fetching of the wasm failed";
  } catch (err) {
    abort(err);
  }
}
function getBinaryPromise(binaryFile) {
  if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
    if (typeof fetch == "function" && !isFileURI(binaryFile)) {
      return fetch(binaryFile, { credentials: "same-origin" })
        .then((response) => {
          if (!response["ok"]) {
            throw "failed to load wasm binary file at '" + binaryFile + "'";
          }
          return response["arrayBuffer"]();
        })
        .catch(() => getBinary(binaryFile));
    } else {
      if (readAsync) {
        return new Promise((resolve, reject) => {
          readAsync(
            binaryFile,
            (response) => resolve(new Uint8Array(response)),
            reject
          );
        });
      }
    }
  }
  return Promise.resolve().then(() => getBinary(binaryFile));
}
function instantiateArrayBuffer(binaryFile, imports, receiver) {
  return getBinaryPromise(binaryFile)
    .then((binary) => {
      return WebAssembly.instantiate(binary, imports);
    })
    .then((instance) => {
      return instance;
    })
    .then(receiver, (reason) => {
      err("failed to asynchronously prepare wasm: " + reason);
      if (isFileURI(wasmBinaryFile)) {
        err(
          "warning: Loading from a file URI (" +
            wasmBinaryFile +
            ") is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing"
        );
      }
      abort(reason);
    });
}
function instantiateAsync(binary, binaryFile, imports, callback) {
  if (
    !binary &&
    typeof WebAssembly.instantiateStreaming == "function" &&
    !isDataURI(binaryFile) &&
    !isFileURI(binaryFile) &&
    !ENVIRONMENT_IS_NODE &&
    typeof fetch == "function"
  ) {
    return fetch(binaryFile, { credentials: "same-origin" }).then(
      (response) => {
        var result = WebAssembly.instantiateStreaming(response, imports);
        return result.then(callback, function (reason) {
          err("wasm streaming compile failed: " + reason);
          err("falling back to ArrayBuffer instantiation");
          return instantiateArrayBuffer(binaryFile, imports, callback);
        });
      }
    );
  } else {
    return instantiateArrayBuffer(binaryFile, imports, callback);
  }
}
function createWasm() {
  var info = { env: wasmImports, wasi_snapshot_preview1: wasmImports };
  function receiveInstance(instance, module) {
    var exports = instance.exports;
    Module["asm"] = exports;
    wasmMemory = Module["asm"]["memory"];
    assert(wasmMemory, "memory not found in wasm exports");
    updateMemoryViews();
    wasmTable = Module["asm"]["__indirect_function_table"];
    assert(wasmTable, "table not found in wasm exports");
    addOnInit(Module["asm"]["__wasm_call_ctors"]);
    removeRunDependency("wasm-instantiate");
    return exports;
  }
  addRunDependency("wasm-instantiate");
  var trueModule = Module;
  function receiveInstantiationResult(result) {
    assert(
      Module === trueModule,
      "the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?"
    );
    trueModule = null;
    receiveInstance(result["instance"]);
  }
  if (Module["instantiateWasm"]) {
    try {
      return Module["instantiateWasm"](info, receiveInstance);
    } catch (e) {
      err("Module.instantiateWasm callback failed with error: " + e);
      return false;
    }
  }
  instantiateAsync(
    wasmBinary,
    wasmBinaryFile,
    info,
    receiveInstantiationResult
  );
  return {};
}
function legacyModuleProp(prop, newName) {
  if (!Object.getOwnPropertyDescriptor(Module, prop)) {
    Object.defineProperty(Module, prop, {
      configurable: true,
      get: function () {
        abort(
          "Module." +
            prop +
            " has been replaced with plain " +
            newName +
            " (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)"
        );
      },
    });
  }
}
function ignoredModuleProp(prop) {
  if (Object.getOwnPropertyDescriptor(Module, prop)) {
    abort(
      "`Module." +
        prop +
        "` was supplied but `" +
        prop +
        "` not included in INCOMING_MODULE_JS_API"
    );
  }
}
function isExportedByForceFilesystem(name) {
  return (
    name === "FS_createPath" ||
    name === "FS_createDataFile" ||
    name === "FS_createPreloadedFile" ||
    name === "FS_unlink" ||
    name === "addRunDependency" ||
    name === "FS_createLazyFile" ||
    name === "FS_createDevice" ||
    name === "removeRunDependency"
  );
}
function missingGlobal(sym, msg) {
  if (typeof globalThis !== "undefined") {
    Object.defineProperty(globalThis, sym, {
      configurable: true,
      get: function () {
        warnOnce("`" + sym + "` is not longer defined by emscripten. " + msg);
        return undefined;
      },
    });
  }
}
missingGlobal("buffer", "Please use HEAP8.buffer or wasmMemory.buffer");
function missingLibrarySymbol(sym) {
  if (
    typeof globalThis !== "undefined" &&
    !Object.getOwnPropertyDescriptor(globalThis, sym)
  ) {
    Object.defineProperty(globalThis, sym, {
      configurable: true,
      get: function () {
        var msg =
          "`" +
          sym +
          "` is a library symbol and not included by default; add it to your library.js __deps or to DEFAULT_LIBRARY_FUNCS_TO_INCLUDE on the command line";
        var librarySymbol = sym;
        if (!librarySymbol.startsWith("_")) {
          librarySymbol = "$" + sym;
        }
        msg +=
          " (e.g. -sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE=" + librarySymbol + ")";
        if (isExportedByForceFilesystem(sym)) {
          msg +=
            ". Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you";
        }
        warnOnce(msg);
        return undefined;
      },
    });
  }
  unexportedRuntimeSymbol(sym);
}
function unexportedRuntimeSymbol(sym) {
  if (!Object.getOwnPropertyDescriptor(Module, sym)) {
    Object.defineProperty(Module, sym, {
      configurable: true,
      get: function () {
        var msg =
          "'" +
          sym +
          "' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)";
        if (isExportedByForceFilesystem(sym)) {
          msg +=
            ". Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you";
        }
        abort(msg);
      },
    });
  }
}
var MAX_UINT8 = 2 ** 8 - 1;
var MAX_UINT16 = 2 ** 16 - 1;
var MAX_UINT32 = 2 ** 32 - 1;
var MAX_UINT53 = 2 ** 53 - 1;
var MAX_UINT64 = 2 ** 64 - 1;
var MIN_INT8 = -(2 ** (8 - 1)) + 1;
var MIN_INT16 = -(2 ** (16 - 1)) + 1;
var MIN_INT32 = -(2 ** (32 - 1)) + 1;
var MIN_INT53 = -(2 ** (53 - 1)) + 1;
var MIN_INT64 = -(2 ** (64 - 1)) + 1;
function checkInt(value, bits, min, max) {
  assert(
    Number.isInteger(Number(value)),
    "attempt to write non-integer (" + value + ") into integer heap"
  );
  assert(
    value <= max,
    "value (" + value + ") too large to write as " + bits + "-bit value"
  );
  assert(
    value >= min,
    "value (" + value + ") too small to write as " + bits + "-bit value"
  );
}
var checkInt8 = (value) => checkInt(value, 8, MIN_INT8, MAX_UINT8);
var checkInt16 = (value) => checkInt(value, 16, MIN_INT16, MAX_UINT16);
var checkInt32 = (value) => checkInt(value, 32, MIN_INT32, MAX_UINT32);
var ASM_CONSTS = {
  1753272: () => {
    var jsString = navigator.userAgent;
    return stringToNewUTF8(jsString);
  },
  1753346: () => {
    if (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    ) {
      return 0;
    } else {
      return 1;
    }
  },
  1753477: ($0, $1) => {
    const input = new Uint8Array(Module.HEAPU8.buffer, $0, $1);
    const buffer = new ArrayBuffer($1);
    const view = new Uint8Array(buffer);
    view.set(input);
    const resultLength = 64;
    const result = stringToNewUTF8("0".repeat(resultLength));
    const promise = crypto.subtle
      .digest("SHA-256", view)
      .then((d) =>
        Array.from(new Uint8Array(d))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
          .toUpperCase()
      )
      .then((d) => stringToUTF8(d, result, result))
      .then((c) => {
        if (c !== resultLength) {
          return Promise.reject();
        }
      });
    const salt = crypto.randomUUID().replace(/-/g, "");
    globalThis._AAI_promises = globalThis._AAI_promises || {};
    globalThis._AAI_promises[
      (BigInt(result) ^ BigInt("0x" + salt)).toString(16).padStart(32, "0")
    ] = promise;
    return stringToNewUTF8(salt + result.toString(16).padStart(32, "0"));
  },
};
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = `Program terminated with exit(${status})`;
  this.status = status;
}
function callRuntimeCallbacks(callbacks) {
  while (callbacks.length > 0) {
    callbacks.shift()(Module);
  }
}
function getValue(ptr, type = "i8") {
  if (type.endsWith("*")) type = "*";
  switch (type) {
    case "i1":
      return HEAP8[ptr >> 0];
    case "i8":
      return HEAP8[ptr >> 0];
    case "i16":
      return HEAP16[ptr >> 1];
    case "i32":
      return HEAP32[ptr >> 2];
    case "i64":
      abort("to do getValue(i64) use WASM_BIGINT");
    case "float":
      return HEAPF32[ptr >> 2];
    case "double":
      return HEAPF64[ptr >> 3];
    case "*":
      return HEAPU32[ptr >> 2];
    default:
      abort(`invalid type for getValue: ${type}`);
  }
}
function ptrToString(ptr) {
  assert(typeof ptr === "number");
  return "0x" + ptr.toString(16).padStart(8, "0");
}
function setStackLimits() {
  var stackLow = _emscripten_stack_get_base();
  var stackHigh = _emscripten_stack_get_end();
  ___set_stack_limits(stackLow, stackHigh);
}
function setValue(ptr, value, type = "i8") {
  if (type.endsWith("*")) type = "*";
  switch (type) {
    case "i1":
      HEAP8[ptr >> 0] = value;
      checkInt8(value);
      break;
    case "i8":
      HEAP8[ptr >> 0] = value;
      checkInt8(value);
      break;
    case "i16":
      HEAP16[ptr >> 1] = value;
      checkInt16(value);
      break;
    case "i32":
      HEAP32[ptr >> 2] = value;
      checkInt32(value);
      break;
    case "i64":
      abort("to do setValue(i64) use WASM_BIGINT");
    case "float":
      HEAPF32[ptr >> 2] = value;
      break;
    case "double":
      HEAPF64[ptr >> 3] = value;
      break;
    case "*":
      HEAPU32[ptr >> 2] = value;
      break;
    default:
      abort(`invalid type for setValue: ${type}`);
  }
}
function warnOnce(text) {
  if (!warnOnce.shown) warnOnce.shown = {};
  if (!warnOnce.shown[text]) {
    warnOnce.shown[text] = 1;
    if (ENVIRONMENT_IS_NODE) text = "warning: " + text;
    err(text);
  }
}
var UTF8Decoder =
  typeof TextDecoder != "undefined" ? new TextDecoder("utf8") : undefined;
function UTF8ArrayToString(heapOrArray, idx, maxBytesToRead) {
  var endIdx = idx + maxBytesToRead;
  var endPtr = idx;
  while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
  if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
    return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
  }
  var str = "";
  while (idx < endPtr) {
    var u0 = heapOrArray[idx++];
    if (!(u0 & 128)) {
      str += String.fromCharCode(u0);
      continue;
    }
    var u1 = heapOrArray[idx++] & 63;
    if ((u0 & 224) == 192) {
      str += String.fromCharCode(((u0 & 31) << 6) | u1);
      continue;
    }
    var u2 = heapOrArray[idx++] & 63;
    if ((u0 & 240) == 224) {
      u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
    } else {
      if ((u0 & 248) != 240)
        warnOnce(
          "Invalid UTF-8 leading byte " +
            ptrToString(u0) +
            " encountered when deserializing a UTF-8 string in wasm memory to a JS string!"
        );
      u0 =
        ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
    }
    if (u0 < 65536) {
      str += String.fromCharCode(u0);
    } else {
      var ch = u0 - 65536;
      str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
    }
  }
  return str;
}
function UTF8ToString(ptr, maxBytesToRead) {
  assert(typeof ptr == "number");
  return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
}
function ___assert_fail(condition, filename, line, func) {
  abort(
    `Assertion failed: ${UTF8ToString(condition)}, at: ` +
      [
        filename ? UTF8ToString(filename) : "unknown filename",
        line,
        func ? UTF8ToString(func) : "unknown function",
      ]
  );
}
function ExceptionInfo(excPtr) {
  this.excPtr = excPtr;
  this.ptr = excPtr - 24;
  this.set_type = function (type) {
    HEAPU32[(this.ptr + 4) >> 2] = type;
  };
  this.get_type = function () {
    return HEAPU32[(this.ptr + 4) >> 2];
  };
  this.set_destructor = function (destructor) {
    HEAPU32[(this.ptr + 8) >> 2] = destructor;
  };
  this.get_destructor = function () {
    return HEAPU32[(this.ptr + 8) >> 2];
  };
  this.set_caught = function (caught) {
    caught = caught ? 1 : 0;
    HEAP8[(this.ptr + 12) >> 0] = caught;
    checkInt8(caught);
  };
  this.get_caught = function () {
    return HEAP8[(this.ptr + 12) >> 0] != 0;
  };
  this.set_rethrown = function (rethrown) {
    rethrown = rethrown ? 1 : 0;
    HEAP8[(this.ptr + 13) >> 0] = rethrown;
    checkInt8(rethrown);
  };
  this.get_rethrown = function () {
    return HEAP8[(this.ptr + 13) >> 0] != 0;
  };
  this.init = function (type, destructor) {
    this.set_adjusted_ptr(0);
    this.set_type(type);
    this.set_destructor(destructor);
  };
  this.set_adjusted_ptr = function (adjustedPtr) {
    HEAPU32[(this.ptr + 16) >> 2] = adjustedPtr;
  };
  this.get_adjusted_ptr = function () {
    return HEAPU32[(this.ptr + 16) >> 2];
  };
  this.get_exception_ptr = function () {
    var isPointer = ___cxa_is_pointer_type(this.get_type());
    if (isPointer) {
      return HEAPU32[this.excPtr >> 2];
    }
    var adjusted = this.get_adjusted_ptr();
    if (adjusted !== 0) return adjusted;
    return this.excPtr;
  };
}
var exceptionLast = 0;
var uncaughtExceptionCount = 0;
function ___cxa_throw(ptr, type, destructor) {
  var info = new ExceptionInfo(ptr);
  info.init(type, destructor);
  exceptionLast = ptr;
  uncaughtExceptionCount++;
  assert(
    false,
    "Exception thrown, but exception catching is not enabled. Compile with -sNO_DISABLE_EXCEPTION_CATCHING or -sEXCEPTION_CATCHING_ALLOWED=[..] to catch."
  );
}
var dlopenMissingError =
  "To use dlopen, you need enable dynamic linking, see https://emscripten.org/docs/compiling/Dynamic-Linking.html";
function ___dlsym(handle, symbol, ra) {
  abort(dlopenMissingError);
}
function ___handle_stack_overflow(requested) {
  requested = requested >>> 0;
  var base = _emscripten_stack_get_base();
  var end = _emscripten_stack_get_end();
  abort(
    `stack overflow (Attempt to set SP to ${ptrToString(requested)}` +
      `, with stack limits [${ptrToString(end)} - ${ptrToString(base)}` +
      "]). If you require more stack space build with -sSTACK_SIZE=<bytes>"
  );
}
var SYSCALLS = {
  varargs: undefined,
  get: function () {
    assert(SYSCALLS.varargs != undefined);
    SYSCALLS.varargs += 4;
    var ret = HEAP32[(SYSCALLS.varargs - 4) >> 2];
    return ret;
  },
  getStr: function (ptr) {
    var ret = UTF8ToString(ptr);
    return ret;
  },
};
function ___syscall_faccessat(dirfd, path, amode, flags) {
  abort(
    "it should not be possible to operate on streams when !SYSCALLS_REQUIRE_FILESYSTEM"
  );
}
function ___syscall_fcntl64(fd, cmd, varargs) {
  SYSCALLS.varargs = varargs;
  return 0;
}
function ___syscall_fstat64(fd, buf) {
  abort(
    "it should not be possible to operate on streams when !SYSCALLS_REQUIRE_FILESYSTEM"
  );
}
function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    var c = str.charCodeAt(i);
    if (c <= 127) {
      len++;
    } else if (c <= 2047) {
      len += 2;
    } else if (c >= 55296 && c <= 57343) {
      len += 4;
      ++i;
    } else {
      len += 3;
    }
  }
  return len;
}
function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
  assert(typeof str === "string");
  if (!(maxBytesToWrite > 0)) return 0;
  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1;
  for (var i = 0; i < str.length; ++i) {
    var u = str.charCodeAt(i);
    if (u >= 55296 && u <= 57343) {
      var u1 = str.charCodeAt(++i);
      u = (65536 + ((u & 1023) << 10)) | (u1 & 1023);
    }
    if (u <= 127) {
      if (outIdx >= endIdx) break;
      heap[outIdx++] = u;
    } else if (u <= 2047) {
      if (outIdx + 1 >= endIdx) break;
      heap[outIdx++] = 192 | (u >> 6);
      heap[outIdx++] = 128 | (u & 63);
    } else if (u <= 65535) {
      if (outIdx + 2 >= endIdx) break;
      heap[outIdx++] = 224 | (u >> 12);
      heap[outIdx++] = 128 | ((u >> 6) & 63);
      heap[outIdx++] = 128 | (u & 63);
    } else {
      if (outIdx + 3 >= endIdx) break;
      if (u > 1114111)
        warnOnce(
          "Invalid Unicode code point " +
            ptrToString(u) +
            " encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF)."
        );
      heap[outIdx++] = 240 | (u >> 18);
      heap[outIdx++] = 128 | ((u >> 12) & 63);
      heap[outIdx++] = 128 | ((u >> 6) & 63);
      heap[outIdx++] = 128 | (u & 63);
    }
  }
  heap[outIdx] = 0;
  return outIdx - startIdx;
}
function stringToUTF8(str, outPtr, maxBytesToWrite) {
  assert(
    typeof maxBytesToWrite == "number",
    "stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!"
  );
  return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
}
function ___syscall_getcwd(buf, size) {
  abort(
    "it should not be possible to operate on streams when !SYSCALLS_REQUIRE_FILESYSTEM"
  );
}
function ___syscall_getdents64(fd, dirp, count) {
  abort(
    "it should not be possible to operate on streams when !SYSCALLS_REQUIRE_FILESYSTEM"
  );
}
function ___syscall_ioctl(fd, op, varargs) {
  SYSCALLS.varargs = varargs;
  return 0;
}
function ___syscall_lstat64(path, buf) {
  abort(
    "it should not be possible to operate on streams when !SYSCALLS_REQUIRE_FILESYSTEM"
  );
}
function ___syscall_mkdirat(dirfd, path, mode) {
  abort(
    "it should not be possible to operate on streams when !SYSCALLS_REQUIRE_FILESYSTEM"
  );
}
function ___syscall_newfstatat(dirfd, path, buf, flags) {
  abort(
    "it should not be possible to operate on streams when !SYSCALLS_REQUIRE_FILESYSTEM"
  );
}
function ___syscall_openat(dirfd, path, flags, varargs) {
  SYSCALLS.varargs = varargs;
  abort(
    "it should not be possible to operate on streams when !SYSCALLS_REQUIRE_FILESYSTEM"
  );
}
function ___syscall_readlinkat(dirfd, path, buf, bufsize) {
  abort(
    "it should not be possible to operate on streams when !SYSCALLS_REQUIRE_FILESYSTEM"
  );
}
function ___syscall_rmdir(path) {
  abort(
    "it should not be possible to operate on streams when !SYSCALLS_REQUIRE_FILESYSTEM"
  );
}
function ___syscall_stat64(path, buf) {
  abort(
    "it should not be possible to operate on streams when !SYSCALLS_REQUIRE_FILESYSTEM"
  );
}
function ___syscall_unlinkat(dirfd, path, flags) {
  abort(
    "it should not be possible to operate on streams when !SYSCALLS_REQUIRE_FILESYSTEM"
  );
}
var structRegistrations = {};
function runDestructors(destructors) {
  while (destructors.length) {
    var ptr = destructors.pop();
    var del = destructors.pop();
    del(ptr);
  }
}
function simpleReadValueFromPointer(pointer) {
  return this["fromWireType"](HEAP32[pointer >> 2]);
}
var awaitingDependencies = {};
var registeredTypes = {};
var typeDependencies = {};
var char_0 = 48;
var char_9 = 57;
function makeLegalFunctionName(name) {
  if (undefined === name) {
    return "_unknown";
  }
  name = name.replace(/[^a-zA-Z0-9_]/g, "$");
  var f = name.charCodeAt(0);
  if (f >= char_0 && f <= char_9) {
    return `_${name}`;
  }
  return name;
}
function createNamedFunction(name, body) {
  name = makeLegalFunctionName(name);
  return {
    [name]: function () {
      return body.apply(this, arguments);
    },
  }[name];
}
function extendError(baseErrorType, errorName) {
  var errorClass = createNamedFunction(errorName, function (message) {
    this.name = errorName;
    this.message = message;
    var stack = new Error(message).stack;
    if (stack !== undefined) {
      this.stack =
        this.toString() + "\n" + stack.replace(/^Error(:[^\n]*)?\n/, "");
    }
  });
  errorClass.prototype = Object.create(baseErrorType.prototype);
  errorClass.prototype.constructor = errorClass;
  errorClass.prototype.toString = function () {
    if (this.message === undefined) {
      return this.name;
    } else {
      return `${this.name}: ${this.message}`;
    }
  };
  return errorClass;
}
var InternalError = undefined;
function throwInternalError(message) {
  throw new InternalError(message);
}
function whenDependentTypesAreResolved(
  myTypes,
  dependentTypes,
  getTypeConverters
) {
  myTypes.forEach(function (type) {
    typeDependencies[type] = dependentTypes;
  });
  function onComplete(typeConverters) {
    var myTypeConverters = getTypeConverters(typeConverters);
    if (myTypeConverters.length !== myTypes.length) {
      throwInternalError("Mismatched type converter count");
    }
    for (var i = 0; i < myTypes.length; ++i) {
      registerType(myTypes[i], myTypeConverters[i]);
    }
  }
  var typeConverters = new Array(dependentTypes.length);
  var unregisteredTypes = [];
  var registered = 0;
  dependentTypes.forEach((dt, i) => {
    if (registeredTypes.hasOwnProperty(dt)) {
      typeConverters[i] = registeredTypes[dt];
    } else {
      unregisteredTypes.push(dt);
      if (!awaitingDependencies.hasOwnProperty(dt)) {
        awaitingDependencies[dt] = [];
      }
      awaitingDependencies[dt].push(() => {
        typeConverters[i] = registeredTypes[dt];
        ++registered;
        if (registered === unregisteredTypes.length) {
          onComplete(typeConverters);
        }
      });
    }
  });
  if (0 === unregisteredTypes.length) {
    onComplete(typeConverters);
  }
}
function __embind_finalize_value_object(structType) {
  var reg = structRegistrations[structType];
  delete structRegistrations[structType];
  var rawConstructor = reg.rawConstructor;
  var rawDestructor = reg.rawDestructor;
  var fieldRecords = reg.fields;
  var fieldTypes = fieldRecords
    .map((field) => field.getterReturnType)
    .concat(fieldRecords.map((field) => field.setterArgumentType));
  whenDependentTypesAreResolved([structType], fieldTypes, (fieldTypes) => {
    var fields = {};
    fieldRecords.forEach((field, i) => {
      var fieldName = field.fieldName;
      var getterReturnType = fieldTypes[i];
      var getter = field.getter;
      var getterContext = field.getterContext;
      var setterArgumentType = fieldTypes[i + fieldRecords.length];
      var setter = field.setter;
      var setterContext = field.setterContext;
      fields[fieldName] = {
        read: (ptr) => {
          return getterReturnType["fromWireType"](getter(getterContext, ptr));
        },
        write: (ptr, o) => {
          var destructors = [];
          setter(
            setterContext,
            ptr,
            setterArgumentType["toWireType"](destructors, o)
          );
          runDestructors(destructors);
        },
      };
    });
    return [
      {
        name: reg.name,
        fromWireType: function (ptr) {
          var rv = {};
          for (var i in fields) {
            rv[i] = fields[i].read(ptr);
          }
          rawDestructor(ptr);
          return rv;
        },
        toWireType: function (destructors, o) {
          for (var fieldName in fields) {
            if (!(fieldName in o)) {
              throw new TypeError(`Missing field: "${fieldName}"`);
            }
          }
          var ptr = rawConstructor();
          for (fieldName in fields) {
            fields[fieldName].write(ptr, o[fieldName]);
          }
          if (destructors !== null) {
            destructors.push(rawDestructor, ptr);
          }
          return ptr;
        },
        argPackAdvance: 8,
        readValueFromPointer: simpleReadValueFromPointer,
        destructorFunction: rawDestructor,
      },
    ];
  });
}
function __embind_register_bigint(
  primitiveType,
  name,
  size,
  minRange,
  maxRange
) {}
function getShiftFromSize(size) {
  switch (size) {
    case 1:
      return 0;
    case 2:
      return 1;
    case 4:
      return 2;
    case 8:
      return 3;
    default:
      throw new TypeError(`Unknown type size: ${size}`);
  }
}
function embind_init_charCodes() {
  var codes = new Array(256);
  for (var i = 0; i < 256; ++i) {
    codes[i] = String.fromCharCode(i);
  }
  embind_charCodes = codes;
}
var embind_charCodes = undefined;
function readLatin1String(ptr) {
  var ret = "";
  var c = ptr;
  while (HEAPU8[c]) {
    ret += embind_charCodes[HEAPU8[c++]];
  }
  return ret;
}
var BindingError = undefined;
function throwBindingError(message) {
  throw new BindingError(message);
}
function registerType(rawType, registeredInstance, options = {}) {
  if (!("argPackAdvance" in registeredInstance)) {
    throw new TypeError(
      "registerType registeredInstance requires argPackAdvance"
    );
  }
  var name = registeredInstance.name;
  if (!rawType) {
    throwBindingError(
      `type "${name}" must have a positive integer typeid pointer`
    );
  }
  if (registeredTypes.hasOwnProperty(rawType)) {
    if (options.ignoreDuplicateRegistrations) {
      return;
    } else {
      throwBindingError(`Cannot register type '${name}' twice`);
    }
  }
  registeredTypes[rawType] = registeredInstance;
  delete typeDependencies[rawType];
  if (awaitingDependencies.hasOwnProperty(rawType)) {
    var callbacks = awaitingDependencies[rawType];
    delete awaitingDependencies[rawType];
    callbacks.forEach((cb) => cb());
  }
}
function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
  var shift = getShiftFromSize(size);
  name = readLatin1String(name);
  registerType(rawType, {
    name: name,
    fromWireType: function (wt) {
      return !!wt;
    },
    toWireType: function (destructors, o) {
      return o ? trueValue : falseValue;
    },
    argPackAdvance: 8,
    readValueFromPointer: function (pointer) {
      var heap;
      if (size === 1) {
        heap = HEAP8;
      } else if (size === 2) {
        heap = HEAP16;
      } else if (size === 4) {
        heap = HEAP32;
      } else {
        throw new TypeError("Unknown boolean type size: " + name);
      }
      return this["fromWireType"](heap[pointer >> shift]);
    },
    destructorFunction: null,
  });
}
function ClassHandle_isAliasOf(other) {
  if (!(this instanceof ClassHandle)) {
    return false;
  }
  if (!(other instanceof ClassHandle)) {
    return false;
  }
  var leftClass = this.$$.ptrType.registeredClass;
  var left = this.$$.ptr;
  var rightClass = other.$$.ptrType.registeredClass;
  var right = other.$$.ptr;
  while (leftClass.baseClass) {
    left = leftClass.upcast(left);
    leftClass = leftClass.baseClass;
  }
  while (rightClass.baseClass) {
    right = rightClass.upcast(right);
    rightClass = rightClass.baseClass;
  }
  return leftClass === rightClass && left === right;
}
function shallowCopyInternalPointer(o) {
  return {
    count: o.count,
    deleteScheduled: o.deleteScheduled,
    preservePointerOnDelete: o.preservePointerOnDelete,
    ptr: o.ptr,
    ptrType: o.ptrType,
    smartPtr: o.smartPtr,
    smartPtrType: o.smartPtrType,
  };
}
function throwInstanceAlreadyDeleted(obj) {
  function getInstanceTypeName(handle) {
    return handle.$$.ptrType.registeredClass.name;
  }
  throwBindingError(getInstanceTypeName(obj) + " instance already deleted");
}
var finalizationRegistry = false;
function detachFinalizer(handle) {}
function runDestructor($$) {
  if ($$.smartPtr) {
    $$.smartPtrType.rawDestructor($$.smartPtr);
  } else {
    $$.ptrType.registeredClass.rawDestructor($$.ptr);
  }
}
function releaseClassHandle($$) {
  $$.count.value -= 1;
  var toDelete = 0 === $$.count.value;
  if (toDelete) {
    runDestructor($$);
  }
}
function downcastPointer(ptr, ptrClass, desiredClass) {
  if (ptrClass === desiredClass) {
    return ptr;
  }
  if (undefined === desiredClass.baseClass) {
    return null;
  }
  var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
  if (rv === null) {
    return null;
  }
  return desiredClass.downcast(rv);
}
var registeredPointers = {};
function getInheritedInstanceCount() {
  return Object.keys(registeredInstances).length;
}
function getLiveInheritedInstances() {
  var rv = [];
  for (var k in registeredInstances) {
    if (registeredInstances.hasOwnProperty(k)) {
      rv.push(registeredInstances[k]);
    }
  }
  return rv;
}
var deletionQueue = [];
function flushPendingDeletes() {
  while (deletionQueue.length) {
    var obj = deletionQueue.pop();
    obj.$$.deleteScheduled = false;
    obj["delete"]();
  }
}
var delayFunction = undefined;
function setDelayFunction(fn) {
  delayFunction = fn;
  if (deletionQueue.length && delayFunction) {
    delayFunction(flushPendingDeletes);
  }
}
function init_embind() {
  Module["getInheritedInstanceCount"] = getInheritedInstanceCount;
  Module["getLiveInheritedInstances"] = getLiveInheritedInstances;
  Module["flushPendingDeletes"] = flushPendingDeletes;
  Module["setDelayFunction"] = setDelayFunction;
}
var registeredInstances = {};
function getBasestPointer(class_, ptr) {
  if (ptr === undefined) {
    throwBindingError("ptr should not be undefined");
  }
  while (class_.baseClass) {
    ptr = class_.upcast(ptr);
    class_ = class_.baseClass;
  }
  return ptr;
}
function getInheritedInstance(class_, ptr) {
  ptr = getBasestPointer(class_, ptr);
  return registeredInstances[ptr];
}
function makeClassHandle(prototype, record) {
  if (!record.ptrType || !record.ptr) {
    throwInternalError("makeClassHandle requires ptr and ptrType");
  }
  var hasSmartPtrType = !!record.smartPtrType;
  var hasSmartPtr = !!record.smartPtr;
  if (hasSmartPtrType !== hasSmartPtr) {
    throwInternalError("Both smartPtrType and smartPtr must be specified");
  }
  record.count = { value: 1 };
  return attachFinalizer(Object.create(prototype, { $$: { value: record } }));
}
function RegisteredPointer_fromWireType(ptr) {
  var rawPointer = this.getPointee(ptr);
  if (!rawPointer) {
    this.destructor(ptr);
    return null;
  }
  var registeredInstance = getInheritedInstance(
    this.registeredClass,
    rawPointer
  );
  if (undefined !== registeredInstance) {
    if (0 === registeredInstance.$$.count.value) {
      registeredInstance.$$.ptr = rawPointer;
      registeredInstance.$$.smartPtr = ptr;
      return registeredInstance["clone"]();
    } else {
      var rv = registeredInstance["clone"]();
      this.destructor(ptr);
      return rv;
    }
  }
  function makeDefaultHandle() {
    if (this.isSmartPointer) {
      return makeClassHandle(this.registeredClass.instancePrototype, {
        ptrType: this.pointeeType,
        ptr: rawPointer,
        smartPtrType: this,
        smartPtr: ptr,
      });
    } else {
      return makeClassHandle(this.registeredClass.instancePrototype, {
        ptrType: this,
        ptr: ptr,
      });
    }
  }
  var actualType = this.registeredClass.getActualType(rawPointer);
  var registeredPointerRecord = registeredPointers[actualType];
  if (!registeredPointerRecord) {
    return makeDefaultHandle.call(this);
  }
  var toType;
  if (this.isConst) {
    toType = registeredPointerRecord.constPointerType;
  } else {
    toType = registeredPointerRecord.pointerType;
  }
  var dp = downcastPointer(
    rawPointer,
    this.registeredClass,
    toType.registeredClass
  );
  if (dp === null) {
    return makeDefaultHandle.call(this);
  }
  if (this.isSmartPointer) {
    return makeClassHandle(toType.registeredClass.instancePrototype, {
      ptrType: toType,
      ptr: dp,
      smartPtrType: this,
      smartPtr: ptr,
    });
  } else {
    return makeClassHandle(toType.registeredClass.instancePrototype, {
      ptrType: toType,
      ptr: dp,
    });
  }
}
function attachFinalizer(handle) {
  if ("undefined" === typeof FinalizationRegistry) {
    attachFinalizer = (handle) => handle;
    return handle;
  }
  finalizationRegistry = new FinalizationRegistry((info) => {
    console.warn(info.leakWarning.stack.replace(/^Error: /, ""));
    releaseClassHandle(info.$$);
  });
  attachFinalizer = (handle) => {
    var $$ = handle.$$;
    var hasSmartPtr = !!$$.smartPtr;
    if (hasSmartPtr) {
      var info = { $$: $$ };
      var cls = $$.ptrType.registeredClass;
      info.leakWarning = new Error(
        `Embind found a leaked C++ instance ${cls.name} <${ptrToString(
          $$.ptr
        )}>.\n` +
          "We'll free it automatically in this case, but this functionality is not reliable across various environments.\n" +
          "Make sure to invoke .delete() manually once you're done with the instance instead.\n" +
          "Originally allocated"
      );
      if ("captureStackTrace" in Error) {
        Error.captureStackTrace(
          info.leakWarning,
          RegisteredPointer_fromWireType
        );
      }
      finalizationRegistry.register(handle, info, handle);
    }
    return handle;
  };
  detachFinalizer = (handle) => finalizationRegistry.unregister(handle);
  return attachFinalizer(handle);
}
function ClassHandle_clone() {
  if (!this.$$.ptr) {
    throwInstanceAlreadyDeleted(this);
  }
  if (this.$$.preservePointerOnDelete) {
    this.$$.count.value += 1;
    return this;
  } else {
    var clone = attachFinalizer(
      Object.create(Object.getPrototypeOf(this), {
        $$: { value: shallowCopyInternalPointer(this.$$) },
      })
    );
    clone.$$.count.value += 1;
    clone.$$.deleteScheduled = false;
    return clone;
  }
}
function ClassHandle_delete() {
  if (!this.$$.ptr) {
    throwInstanceAlreadyDeleted(this);
  }
  if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
    throwBindingError("Object already scheduled for deletion");
  }
  detachFinalizer(this);
  releaseClassHandle(this.$$);
  if (!this.$$.preservePointerOnDelete) {
    this.$$.smartPtr = undefined;
    this.$$.ptr = undefined;
  }
}
function ClassHandle_isDeleted() {
  return !this.$$.ptr;
}
function ClassHandle_deleteLater() {
  if (!this.$$.ptr) {
    throwInstanceAlreadyDeleted(this);
  }
  if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
    throwBindingError("Object already scheduled for deletion");
  }
  deletionQueue.push(this);
  if (deletionQueue.length === 1 && delayFunction) {
    delayFunction(flushPendingDeletes);
  }
  this.$$.deleteScheduled = true;
  return this;
}
function init_ClassHandle() {
  ClassHandle.prototype["isAliasOf"] = ClassHandle_isAliasOf;
  ClassHandle.prototype["clone"] = ClassHandle_clone;
  ClassHandle.prototype["delete"] = ClassHandle_delete;
  ClassHandle.prototype["isDeleted"] = ClassHandle_isDeleted;
  ClassHandle.prototype["deleteLater"] = ClassHandle_deleteLater;
}
function ClassHandle() {}
function ensureOverloadTable(proto, methodName, humanName) {
  if (undefined === proto[methodName].overloadTable) {
    var prevFunc = proto[methodName];
    proto[methodName] = function () {
      if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
        throwBindingError(
          `Function '${humanName}' called with an invalid number of arguments (${arguments.length}) - expects one of (${proto[methodName].overloadTable})!`
        );
      }
      return proto[methodName].overloadTable[arguments.length].apply(
        this,
        arguments
      );
    };
    proto[methodName].overloadTable = [];
    proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
  }
}
function exposePublicSymbol(name, value, numArguments) {
  if (Module.hasOwnProperty(name)) {
    if (
      undefined === numArguments ||
      (undefined !== Module[name].overloadTable &&
        undefined !== Module[name].overloadTable[numArguments])
    ) {
      throwBindingError(`Cannot register public name '${name}' twice`);
    }
    ensureOverloadTable(Module, name, name);
    if (Module.hasOwnProperty(numArguments)) {
      throwBindingError(
        `Cannot register multiple overloads of a function with the same number of arguments (${numArguments})!`
      );
    }
    Module[name].overloadTable[numArguments] = value;
  } else {
    Module[name] = value;
    if (undefined !== numArguments) {
      Module[name].numArguments = numArguments;
    }
  }
}
function RegisteredClass(
  name,
  constructor,
  instancePrototype,
  rawDestructor,
  baseClass,
  getActualType,
  upcast,
  downcast
) {
  this.name = name;
  this.constructor = constructor;
  this.instancePrototype = instancePrototype;
  this.rawDestructor = rawDestructor;
  this.baseClass = baseClass;
  this.getActualType = getActualType;
  this.upcast = upcast;
  this.downcast = downcast;
  this.pureVirtualFunctions = [];
}
function upcastPointer(ptr, ptrClass, desiredClass) {
  while (ptrClass !== desiredClass) {
    if (!ptrClass.upcast) {
      throwBindingError(
        `Expected null or instance of ${desiredClass.name}, got an instance of ${ptrClass.name}`
      );
    }
    ptr = ptrClass.upcast(ptr);
    ptrClass = ptrClass.baseClass;
  }
  return ptr;
}
function constNoSmartPtrRawPointerToWireType(destructors, handle) {
  if (handle === null) {
    if (this.isReference) {
      throwBindingError(`null is not a valid ${this.name}`);
    }
    return 0;
  }
  if (!handle.$$) {
    throwBindingError(`Cannot pass "${embindRepr(handle)}" as a ${this.name}`);
  }
  if (!handle.$$.ptr) {
    throwBindingError(
      `Cannot pass deleted object as a pointer of type ${this.name}`
    );
  }
  var handleClass = handle.$$.ptrType.registeredClass;
  var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
  return ptr;
}
function genericPointerToWireType(destructors, handle) {
  var ptr;
  if (handle === null) {
    if (this.isReference) {
      throwBindingError(`null is not a valid ${this.name}`);
    }
    if (this.isSmartPointer) {
      ptr = this.rawConstructor();
      if (destructors !== null) {
        destructors.push(this.rawDestructor, ptr);
      }
      return ptr;
    } else {
      return 0;
    }
  }
  if (!handle.$$) {
    throwBindingError(`Cannot pass "${embindRepr(handle)}" as a ${this.name}`);
  }
  if (!handle.$$.ptr) {
    throwBindingError(
      `Cannot pass deleted object as a pointer of type ${this.name}`
    );
  }
  if (!this.isConst && handle.$$.ptrType.isConst) {
    throwBindingError(
      `Cannot convert argument of type ${
        handle.$$.smartPtrType
          ? handle.$$.smartPtrType.name
          : handle.$$.ptrType.name
      } to parameter type ${this.name}`
    );
  }
  var handleClass = handle.$$.ptrType.registeredClass;
  ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
  if (this.isSmartPointer) {
    if (undefined === handle.$$.smartPtr) {
      throwBindingError("Passing raw pointer to smart pointer is illegal");
    }
    switch (this.sharingPolicy) {
      case 0:
        if (handle.$$.smartPtrType === this) {
          ptr = handle.$$.smartPtr;
        } else {
          throwBindingError(
            `Cannot convert argument of type ${
              handle.$$.smartPtrType
                ? handle.$$.smartPtrType.name
                : handle.$$.ptrType.name
            } to parameter type ${this.name}`
          );
        }
        break;
      case 1:
        ptr = handle.$$.smartPtr;
        break;
      case 2:
        if (handle.$$.smartPtrType === this) {
          ptr = handle.$$.smartPtr;
        } else {
          var clonedHandle = handle["clone"]();
          ptr = this.rawShare(
            ptr,
            Emval.toHandle(function () {
              clonedHandle["delete"]();
            })
          );
          if (destructors !== null) {
            destructors.push(this.rawDestructor, ptr);
          }
        }
        break;
      default:
        throwBindingError("Unsupporting sharing policy");
    }
  }
  return ptr;
}
function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
  if (handle === null) {
    if (this.isReference) {
      throwBindingError(`null is not a valid ${this.name}`);
    }
    return 0;
  }
  if (!handle.$$) {
    throwBindingError(`Cannot pass "${embindRepr(handle)}" as a ${this.name}`);
  }
  if (!handle.$$.ptr) {
    throwBindingError(
      `Cannot pass deleted object as a pointer of type ${this.name}`
    );
  }
  if (handle.$$.ptrType.isConst) {
    throwBindingError(
      `Cannot convert argument of type ${handle.$$.ptrType.name} to parameter type ${this.name}`
    );
  }
  var handleClass = handle.$$.ptrType.registeredClass;
  var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
  return ptr;
}
function RegisteredPointer_getPointee(ptr) {
  if (this.rawGetPointee) {
    ptr = this.rawGetPointee(ptr);
  }
  return ptr;
}
function RegisteredPointer_destructor(ptr) {
  if (this.rawDestructor) {
    this.rawDestructor(ptr);
  }
}
function RegisteredPointer_deleteObject(handle) {
  if (handle !== null) {
    handle["delete"]();
  }
}
function init_RegisteredPointer() {
  RegisteredPointer.prototype.getPointee = RegisteredPointer_getPointee;
  RegisteredPointer.prototype.destructor = RegisteredPointer_destructor;
  RegisteredPointer.prototype["argPackAdvance"] = 8;
  RegisteredPointer.prototype["readValueFromPointer"] =
    simpleReadValueFromPointer;
  RegisteredPointer.prototype["deleteObject"] = RegisteredPointer_deleteObject;
  RegisteredPointer.prototype["fromWireType"] = RegisteredPointer_fromWireType;
}
function RegisteredPointer(
  name,
  registeredClass,
  isReference,
  isConst,
  isSmartPointer,
  pointeeType,
  sharingPolicy,
  rawGetPointee,
  rawConstructor,
  rawShare,
  rawDestructor
) {
  this.name = name;
  this.registeredClass = registeredClass;
  this.isReference = isReference;
  this.isConst = isConst;
  this.isSmartPointer = isSmartPointer;
  this.pointeeType = pointeeType;
  this.sharingPolicy = sharingPolicy;
  this.rawGetPointee = rawGetPointee;
  this.rawConstructor = rawConstructor;
  this.rawShare = rawShare;
  this.rawDestructor = rawDestructor;
  if (!isSmartPointer && registeredClass.baseClass === undefined) {
    if (isConst) {
      this["toWireType"] = constNoSmartPtrRawPointerToWireType;
      this.destructorFunction = null;
    } else {
      this["toWireType"] = nonConstNoSmartPtrRawPointerToWireType;
      this.destructorFunction = null;
    }
  } else {
    this["toWireType"] = genericPointerToWireType;
  }
}
function replacePublicSymbol(name, value, numArguments) {
  if (!Module.hasOwnProperty(name)) {
    throwInternalError("Replacing nonexistant public symbol");
  }
  if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
    Module[name].overloadTable[numArguments] = value;
  } else {
    Module[name] = value;
    Module[name].argCount = numArguments;
  }
}
function dynCallLegacy(sig, ptr, args) {
  assert(
    "dynCall_" + sig in Module,
    `bad function pointer type - dynCall function not found for sig '${sig}'`
  );
  if (args && args.length) {
    assert(args.length === sig.substring(1).replace(/j/g, "--").length);
  } else {
    assert(sig.length == 1);
  }
  var f = Module["dynCall_" + sig];
  return args && args.length
    ? f.apply(null, [ptr].concat(args))
    : f.call(null, ptr);
}
var wasmTableMirror = [];
function getWasmTableEntry(funcPtr) {
  var func = wasmTableMirror[funcPtr];
  if (!func) {
    if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
    wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
  }
  assert(
    wasmTable.get(funcPtr) == func,
    "JavaScript-side Wasm function table mirror is out of date!"
  );
  return func;
}
function dynCall(sig, ptr, args) {
  if (sig.includes("j")) {
    return dynCallLegacy(sig, ptr, args);
  }
  assert(getWasmTableEntry(ptr), `missing table entry in dynCall: ${ptr}`);
  var rtn = getWasmTableEntry(ptr).apply(null, args);
  return rtn;
}
function getDynCaller(sig, ptr) {
  assert(
    sig.includes("j") || sig.includes("p"),
    "getDynCaller should only be called with i64 sigs"
  );
  var argCache = [];
  return function () {
    argCache.length = 0;
    Object.assign(argCache, arguments);
    return dynCall(sig, ptr, argCache);
  };
}
function embind__requireFunction(signature, rawFunction) {
  signature = readLatin1String(signature);
  function makeDynCaller() {
    if (signature.includes("j")) {
      return getDynCaller(signature, rawFunction);
    }
    return getWasmTableEntry(rawFunction);
  }
  var fp = makeDynCaller();
  if (typeof fp != "function") {
    throwBindingError(
      `unknown function pointer with signature ${signature}: ${rawFunction}`
    );
  }
  return fp;
}
var UnboundTypeError = undefined;
function getTypeName(type) {
  var ptr = ___getTypeName(type);
  var rv = readLatin1String(ptr);
  _free(ptr);
  return rv;
}
function throwUnboundTypeError(message, types) {
  var unboundTypes = [];
  var seen = {};
  function visit(type) {
    if (seen[type]) {
      return;
    }
    if (registeredTypes[type]) {
      return;
    }
    if (typeDependencies[type]) {
      typeDependencies[type].forEach(visit);
      return;
    }
    unboundTypes.push(type);
    seen[type] = true;
  }
  types.forEach(visit);
  throw new UnboundTypeError(
    `${message}: ` + unboundTypes.map(getTypeName).join([", "])
  );
}
function __embind_register_class(
  rawType,
  rawPointerType,
  rawConstPointerType,
  baseClassRawType,
  getActualTypeSignature,
  getActualType,
  upcastSignature,
  upcast,
  downcastSignature,
  downcast,
  name,
  destructorSignature,
  rawDestructor
) {
  name = readLatin1String(name);
  getActualType = embind__requireFunction(
    getActualTypeSignature,
    getActualType
  );
  if (upcast) {
    upcast = embind__requireFunction(upcastSignature, upcast);
  }
  if (downcast) {
    downcast = embind__requireFunction(downcastSignature, downcast);
  }
  rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
  var legalFunctionName = makeLegalFunctionName(name);
  exposePublicSymbol(legalFunctionName, function () {
    throwUnboundTypeError(`Cannot construct ${name} due to unbound types`, [
      baseClassRawType,
    ]);
  });
  whenDependentTypesAreResolved(
    [rawType, rawPointerType, rawConstPointerType],
    baseClassRawType ? [baseClassRawType] : [],
    function (base) {
      base = base[0];
      var baseClass;
      var basePrototype;
      if (baseClassRawType) {
        baseClass = base.registeredClass;
        basePrototype = baseClass.instancePrototype;
      } else {
        basePrototype = ClassHandle.prototype;
      }
      var constructor = createNamedFunction(legalFunctionName, function () {
        if (Object.getPrototypeOf(this) !== instancePrototype) {
          throw new BindingError("Use 'new' to construct " + name);
        }
        if (undefined === registeredClass.constructor_body) {
          throw new BindingError(name + " has no accessible constructor");
        }
        var body = registeredClass.constructor_body[arguments.length];
        if (undefined === body) {
          throw new BindingError(
            `Tried to invoke ctor of ${name} with invalid number of parameters (${
              arguments.length
            }) - expected (${Object.keys(
              registeredClass.constructor_body
            ).toString()}) parameters instead!`
          );
        }
        return body.apply(this, arguments);
      });
      var instancePrototype = Object.create(basePrototype, {
        constructor: { value: constructor },
      });
      constructor.prototype = instancePrototype;
      var registeredClass = new RegisteredClass(
        name,
        constructor,
        instancePrototype,
        rawDestructor,
        baseClass,
        getActualType,
        upcast,
        downcast
      );
      if (registeredClass.baseClass) {
        if (registeredClass.baseClass.__derivedClasses === undefined) {
          registeredClass.baseClass.__derivedClasses = [];
        }
        registeredClass.baseClass.__derivedClasses.push(registeredClass);
      }
      var referenceConverter = new RegisteredPointer(
        name,
        registeredClass,
        true,
        false,
        false
      );
      var pointerConverter = new RegisteredPointer(
        name + "*",
        registeredClass,
        false,
        false,
        false
      );
      var constPointerConverter = new RegisteredPointer(
        name + " const*",
        registeredClass,
        false,
        true,
        false
      );
      registeredPointers[rawType] = {
        pointerType: pointerConverter,
        constPointerType: constPointerConverter,
      };
      replacePublicSymbol(legalFunctionName, constructor);
      return [referenceConverter, pointerConverter, constPointerConverter];
    }
  );
}
function heap32VectorToArray(count, firstElement) {
  var array = [];
  for (var i = 0; i < count; i++) {
    array.push(HEAPU32[(firstElement + i * 4) >> 2]);
  }
  return array;
}
function newFunc(constructor, argumentList) {
  if (!(constructor instanceof Function)) {
    throw new TypeError(
      `new_ called with constructor type ${typeof constructor} which is not a function`
    );
  }
  var dummy = createNamedFunction(
    constructor.name || "unknownFunctionName",
    function () {}
  );
  dummy.prototype = constructor.prototype;
  var obj = new dummy();
  var r = constructor.apply(obj, argumentList);
  return r instanceof Object ? r : obj;
}
function craftInvokerFunction(
  humanName,
  argTypes,
  classType,
  cppInvokerFunc,
  cppTargetFunc,
  isAsync
) {
  var argCount = argTypes.length;
  if (argCount < 2) {
    throwBindingError(
      "argTypes array size mismatch! Must at least get return value and 'this' types!"
    );
  }
  assert(!isAsync, "Async bindings are only supported with JSPI.");
  var isClassMethodFunc = argTypes[1] !== null && classType !== null;
  var needsDestructorStack = false;
  for (var i = 1; i < argTypes.length; ++i) {
    if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) {
      needsDestructorStack = true;
      break;
    }
  }
  var returns = argTypes[0].name !== "void";
  var argsList = "";
  var argsListWired = "";
  for (var i = 0; i < argCount - 2; ++i) {
    argsList += (i !== 0 ? ", " : "") + "arg" + i;
    argsListWired += (i !== 0 ? ", " : "") + "arg" + i + "Wired";
  }
  var invokerFnBody = `\n        return function ${makeLegalFunctionName(
    humanName
  )}(${argsList}) {\n        if (arguments.length !== ${
    argCount - 2
  }) {\n          throwBindingError('function ${humanName} called with ${
    arguments.length
  } arguments, expected ${argCount - 2} args!');\n        }`;
  if (needsDestructorStack) {
    invokerFnBody += "var destructors = [];\n";
  }
  var dtorStack = needsDestructorStack ? "destructors" : "null";
  var args1 = [
    "throwBindingError",
    "invoker",
    "fn",
    "runDestructors",
    "retType",
    "classParam",
  ];
  var args2 = [
    throwBindingError,
    cppInvokerFunc,
    cppTargetFunc,
    runDestructors,
    argTypes[0],
    argTypes[1],
  ];
  if (isClassMethodFunc) {
    invokerFnBody +=
      "var thisWired = classParam.toWireType(" + dtorStack + ", this);\n";
  }
  for (var i = 0; i < argCount - 2; ++i) {
    invokerFnBody +=
      "var arg" +
      i +
      "Wired = argType" +
      i +
      ".toWireType(" +
      dtorStack +
      ", arg" +
      i +
      "); // " +
      argTypes[i + 2].name +
      "\n";
    args1.push("argType" + i);
    args2.push(argTypes[i + 2]);
  }
  if (isClassMethodFunc) {
    argsListWired =
      "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired;
  }
  invokerFnBody +=
    (returns || isAsync ? "var rv = " : "") +
    "invoker(fn" +
    (argsListWired.length > 0 ? ", " : "") +
    argsListWired +
    ");\n";
  if (needsDestructorStack) {
    invokerFnBody += "runDestructors(destructors);\n";
  } else {
    for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
      var paramName = i === 1 ? "thisWired" : "arg" + (i - 2) + "Wired";
      if (argTypes[i].destructorFunction !== null) {
        invokerFnBody +=
          paramName + "_dtor(" + paramName + "); // " + argTypes[i].name + "\n";
        args1.push(paramName + "_dtor");
        args2.push(argTypes[i].destructorFunction);
      }
    }
  }
  if (returns) {
    invokerFnBody += "var ret = retType.fromWireType(rv);\n" + "return ret;\n";
  } else {
  }
  invokerFnBody += "}\n";
  args1.push(invokerFnBody);
  return newFunc(Function, args1).apply(null, args2);
}
function __embind_register_class_constructor(
  rawClassType,
  argCount,
  rawArgTypesAddr,
  invokerSignature,
  invoker,
  rawConstructor
) {
  assert(argCount > 0);
  var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
  invoker = embind__requireFunction(invokerSignature, invoker);
  whenDependentTypesAreResolved([], [rawClassType], function (classType) {
    classType = classType[0];
    var humanName = `constructor ${classType.name}`;
    if (undefined === classType.registeredClass.constructor_body) {
      classType.registeredClass.constructor_body = [];
    }
    if (
      undefined !== classType.registeredClass.constructor_body[argCount - 1]
    ) {
      throw new BindingError(
        `Cannot register multiple constructors with identical number of parameters (${
          argCount - 1
        }) for class '${
          classType.name
        }'! Overload resolution is currently only performed using the parameter count, not actual type info!`
      );
    }
    classType.registeredClass.constructor_body[argCount - 1] = () => {
      throwUnboundTypeError(
        `Cannot construct ${classType.name} due to unbound types`,
        rawArgTypes
      );
    };
    whenDependentTypesAreResolved([], rawArgTypes, function (argTypes) {
      argTypes.splice(1, 0, null);
      classType.registeredClass.constructor_body[argCount - 1] =
        craftInvokerFunction(
          humanName,
          argTypes,
          null,
          invoker,
          rawConstructor
        );
      return [];
    });
    return [];
  });
}
function __embind_register_class_function(
  rawClassType,
  methodName,
  argCount,
  rawArgTypesAddr,
  invokerSignature,
  rawInvoker,
  context,
  isPureVirtual,
  isAsync
) {
  var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
  methodName = readLatin1String(methodName);
  rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
  whenDependentTypesAreResolved([], [rawClassType], function (classType) {
    classType = classType[0];
    var humanName = `${classType.name}.${methodName}`;
    if (methodName.startsWith("@@")) {
      methodName = Symbol[methodName.substring(2)];
    }
    if (isPureVirtual) {
      classType.registeredClass.pureVirtualFunctions.push(methodName);
    }
    function unboundTypesHandler() {
      throwUnboundTypeError(
        `Cannot call ${humanName} due to unbound types`,
        rawArgTypes
      );
    }
    var proto = classType.registeredClass.instancePrototype;
    var method = proto[methodName];
    if (
      undefined === method ||
      (undefined === method.overloadTable &&
        method.className !== classType.name &&
        method.argCount === argCount - 2)
    ) {
      unboundTypesHandler.argCount = argCount - 2;
      unboundTypesHandler.className = classType.name;
      proto[methodName] = unboundTypesHandler;
    } else {
      ensureOverloadTable(proto, methodName, humanName);
      proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler;
    }
    whenDependentTypesAreResolved([], rawArgTypes, function (argTypes) {
      var memberFunction = craftInvokerFunction(
        humanName,
        argTypes,
        classType,
        rawInvoker,
        context,
        isAsync
      );
      if (undefined === proto[methodName].overloadTable) {
        memberFunction.argCount = argCount - 2;
        proto[methodName] = memberFunction;
      } else {
        proto[methodName].overloadTable[argCount - 2] = memberFunction;
      }
      return [];
    });
    return [];
  });
}
function HandleAllocator() {
  this.allocated = [undefined];
  this.freelist = [];
  this.get = function (id) {
    assert(this.allocated[id] !== undefined, `invalid handle: ${id}`);
    return this.allocated[id];
  };
  this.has = function (id) {
    return this.allocated[id] !== undefined;
  };
  this.allocate = function (handle) {
    var id = this.freelist.pop() || this.allocated.length;
    this.allocated[id] = handle;
    return id;
  };
  this.free = function (id) {
    assert(this.allocated[id] !== undefined);
    this.allocated[id] = undefined;
    this.freelist.push(id);
  };
}
var emval_handles = new HandleAllocator();
function __emval_decref(handle) {
  if (
    handle >= emval_handles.reserved &&
    0 === --emval_handles.get(handle).refcount
  ) {
    emval_handles.free(handle);
  }
}
function count_emval_handles() {
  var count = 0;
  for (
    var i = emval_handles.reserved;
    i < emval_handles.allocated.length;
    ++i
  ) {
    if (emval_handles.allocated[i] !== undefined) {
      ++count;
    }
  }
  return count;
}
function init_emval() {
  emval_handles.allocated.push(
    { value: undefined },
    { value: null },
    { value: true },
    { value: false }
  );
  emval_handles.reserved = emval_handles.allocated.length;
  Module["count_emval_handles"] = count_emval_handles;
}
var Emval = {
  toValue: (handle) => {
    if (!handle) {
      throwBindingError("Cannot use deleted val. handle = " + handle);
    }
    return emval_handles.get(handle).value;
  },
  toHandle: (value) => {
    switch (value) {
      case undefined:
        return 1;
      case null:
        return 2;
      case true:
        return 3;
      case false:
        return 4;
      default: {
        return emval_handles.allocate({ refcount: 1, value: value });
      }
    }
  },
};
function __embind_register_emval(rawType, name) {
  name = readLatin1String(name);
  registerType(rawType, {
    name: name,
    fromWireType: function (handle) {
      var rv = Emval.toValue(handle);
      __emval_decref(handle);
      return rv;
    },
    toWireType: function (destructors, value) {
      return Emval.toHandle(value);
    },
    argPackAdvance: 8,
    readValueFromPointer: simpleReadValueFromPointer,
    destructorFunction: null,
  });
}
function enumReadValueFromPointer(name, shift, signed) {
  switch (shift) {
    case 0:
      return function (pointer) {
        var heap = signed ? HEAP8 : HEAPU8;
        return this["fromWireType"](heap[pointer]);
      };
    case 1:
      return function (pointer) {
        var heap = signed ? HEAP16 : HEAPU16;
        return this["fromWireType"](heap[pointer >> 1]);
      };
    case 2:
      return function (pointer) {
        var heap = signed ? HEAP32 : HEAPU32;
        return this["fromWireType"](heap[pointer >> 2]);
      };
    default:
      throw new TypeError("Unknown integer type: " + name);
  }
}
function __embind_register_enum(rawType, name, size, isSigned) {
  var shift = getShiftFromSize(size);
  name = readLatin1String(name);
  function ctor() {}
  ctor.values = {};
  registerType(rawType, {
    name: name,
    constructor: ctor,
    fromWireType: function (c) {
      return this.constructor.values[c];
    },
    toWireType: function (destructors, c) {
      return c.value;
    },
    argPackAdvance: 8,
    readValueFromPointer: enumReadValueFromPointer(name, shift, isSigned),
    destructorFunction: null,
  });
  exposePublicSymbol(name, ctor);
}
function requireRegisteredType(rawType, humanName) {
  var impl = registeredTypes[rawType];
  if (undefined === impl) {
    throwBindingError(humanName + " has unknown type " + getTypeName(rawType));
  }
  return impl;
}
function __embind_register_enum_value(rawEnumType, name, enumValue) {
  var enumType = requireRegisteredType(rawEnumType, "enum");
  name = readLatin1String(name);
  var Enum = enumType.constructor;
  var Value = Object.create(enumType.constructor.prototype, {
    value: { value: enumValue },
    constructor: {
      value: createNamedFunction(`${enumType.name}_${name}`, function () {}),
    },
  });
  Enum.values[enumValue] = Value;
  Enum[name] = Value;
}
function embindRepr(v) {
  if (v === null) {
    return "null";
  }
  var t = typeof v;
  if (t === "object" || t === "array" || t === "function") {
    return v.toString();
  } else {
    return "" + v;
  }
}
function floatReadValueFromPointer(name, shift) {
  switch (shift) {
    case 2:
      return function (pointer) {
        return this["fromWireType"](HEAPF32[pointer >> 2]);
      };
    case 3:
      return function (pointer) {
        return this["fromWireType"](HEAPF64[pointer >> 3]);
      };
    default:
      throw new TypeError("Unknown float type: " + name);
  }
}
function __embind_register_float(rawType, name, size) {
  var shift = getShiftFromSize(size);
  name = readLatin1String(name);
  registerType(rawType, {
    name: name,
    fromWireType: function (value) {
      return value;
    },
    toWireType: function (destructors, value) {
      if (typeof value != "number" && typeof value != "boolean") {
        throw new TypeError(
          `Cannot convert ${embindRepr(value)} to ${this.name}`
        );
      }
      return value;
    },
    argPackAdvance: 8,
    readValueFromPointer: floatReadValueFromPointer(name, shift),
    destructorFunction: null,
  });
}
function integerReadValueFromPointer(name, shift, signed) {
  switch (shift) {
    case 0:
      return signed
        ? function readS8FromPointer(pointer) {
            return HEAP8[pointer];
          }
        : function readU8FromPointer(pointer) {
            return HEAPU8[pointer];
          };
    case 1:
      return signed
        ? function readS16FromPointer(pointer) {
            return HEAP16[pointer >> 1];
          }
        : function readU16FromPointer(pointer) {
            return HEAPU16[pointer >> 1];
          };
    case 2:
      return signed
        ? function readS32FromPointer(pointer) {
            return HEAP32[pointer >> 2];
          }
        : function readU32FromPointer(pointer) {
            return HEAPU32[pointer >> 2];
          };
    default:
      throw new TypeError("Unknown integer type: " + name);
  }
}
function __embind_register_integer(
  primitiveType,
  name,
  size,
  minRange,
  maxRange
) {
  name = readLatin1String(name);
  if (maxRange === -1) {
    maxRange = 4294967295;
  }
  var shift = getShiftFromSize(size);
  var fromWireType = (value) => value;
  if (minRange === 0) {
    var bitshift = 32 - 8 * size;
    fromWireType = (value) => (value << bitshift) >>> bitshift;
  }
  var isUnsignedType = name.includes("unsigned");
  var checkAssertions = (value, toTypeName) => {
    if (typeof value != "number" && typeof value != "boolean") {
      throw new TypeError(
        `Cannot convert "${embindRepr(value)}" to ${toTypeName}`
      );
    }
    if (value < minRange || value > maxRange) {
      throw new TypeError(
        `Passing a number "${embindRepr(
          value
        )}" from JS side to C/C++ side to an argument of type "${name}", which is outside the valid range [${minRange}, ${maxRange}]!`
      );
    }
  };
  var toWireType;
  if (isUnsignedType) {
    toWireType = function (destructors, value) {
      checkAssertions(value, this.name);
      return value >>> 0;
    };
  } else {
    toWireType = function (destructors, value) {
      checkAssertions(value, this.name);
      return value;
    };
  }
  registerType(primitiveType, {
    name: name,
    fromWireType: fromWireType,
    toWireType: toWireType,
    argPackAdvance: 8,
    readValueFromPointer: integerReadValueFromPointer(
      name,
      shift,
      minRange !== 0
    ),
    destructorFunction: null,
  });
}
function __embind_register_memory_view(rawType, dataTypeIndex, name) {
  var typeMapping = [
    Int8Array,
    Uint8Array,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array,
  ];
  var TA = typeMapping[dataTypeIndex];
  function decodeMemoryView(handle) {
    handle = handle >> 2;
    var heap = HEAPU32;
    var size = heap[handle];
    var data = heap[handle + 1];
    return new TA(heap.buffer, data, size);
  }
  name = readLatin1String(name);
  registerType(
    rawType,
    {
      name: name,
      fromWireType: decodeMemoryView,
      argPackAdvance: 8,
      readValueFromPointer: decodeMemoryView,
    },
    { ignoreDuplicateRegistrations: true }
  );
}
function __embind_register_smart_ptr(
  rawType,
  rawPointeeType,
  name,
  sharingPolicy,
  getPointeeSignature,
  rawGetPointee,
  constructorSignature,
  rawConstructor,
  shareSignature,
  rawShare,
  destructorSignature,
  rawDestructor
) {
  name = readLatin1String(name);
  rawGetPointee = embind__requireFunction(getPointeeSignature, rawGetPointee);
  rawConstructor = embind__requireFunction(
    constructorSignature,
    rawConstructor
  );
  rawShare = embind__requireFunction(shareSignature, rawShare);
  rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
  whenDependentTypesAreResolved(
    [rawType],
    [rawPointeeType],
    function (pointeeType) {
      pointeeType = pointeeType[0];
      var registeredPointer = new RegisteredPointer(
        name,
        pointeeType.registeredClass,
        false,
        false,
        true,
        pointeeType,
        sharingPolicy,
        rawGetPointee,
        rawConstructor,
        rawShare,
        rawDestructor
      );
      return [registeredPointer];
    }
  );
}
function __embind_register_std_string(rawType, name) {
  name = readLatin1String(name);
  var stdStringIsUTF8 = name === "std::string";
  registerType(rawType, {
    name: name,
    fromWireType: function (value) {
      var length = HEAPU32[value >> 2];
      var payload = value + 4;
      var str;
      if (stdStringIsUTF8) {
        var decodeStartPtr = payload;
        for (var i = 0; i <= length; ++i) {
          var currentBytePtr = payload + i;
          if (i == length || HEAPU8[currentBytePtr] == 0) {
            var maxRead = currentBytePtr - decodeStartPtr;
            var stringSegment = UTF8ToString(decodeStartPtr, maxRead);
            if (str === undefined) {
              str = stringSegment;
            } else {
              str += String.fromCharCode(0);
              str += stringSegment;
            }
            decodeStartPtr = currentBytePtr + 1;
          }
        }
      } else {
        var a = new Array(length);
        for (var i = 0; i < length; ++i) {
          a[i] = String.fromCharCode(HEAPU8[payload + i]);
        }
        str = a.join("");
      }
      _free(value);
      return str;
    },
    toWireType: function (destructors, value) {
      if (value instanceof ArrayBuffer) {
        value = new Uint8Array(value);
      }
      var length;
      var valueIsOfTypeString = typeof value == "string";
      if (
        !(
          valueIsOfTypeString ||
          value instanceof Uint8Array ||
          value instanceof Uint8ClampedArray ||
          value instanceof Int8Array
        )
      ) {
        throwBindingError("Cannot pass non-string to std::string");
      }
      if (stdStringIsUTF8 && valueIsOfTypeString) {
        length = lengthBytesUTF8(value);
      } else {
        length = value.length;
      }
      var base = _malloc(4 + length + 1);
      var ptr = base + 4;
      HEAPU32[base >> 2] = length;
      checkInt32(length);
      if (stdStringIsUTF8 && valueIsOfTypeString) {
        stringToUTF8(value, ptr, length + 1);
      } else {
        if (valueIsOfTypeString) {
          for (var i = 0; i < length; ++i) {
            var charCode = value.charCodeAt(i);
            if (charCode > 255) {
              _free(ptr);
              throwBindingError(
                "String has UTF-16 code units that do not fit in 8 bits"
              );
            }
            HEAPU8[ptr + i] = charCode;
          }
        } else {
          for (var i = 0; i < length; ++i) {
            HEAPU8[ptr + i] = value[i];
          }
        }
      }
      if (destructors !== null) {
        destructors.push(_free, base);
      }
      return base;
    },
    argPackAdvance: 8,
    readValueFromPointer: simpleReadValueFromPointer,
    destructorFunction: function (ptr) {
      _free(ptr);
    },
  });
}
var UTF16Decoder =
  typeof TextDecoder != "undefined" ? new TextDecoder("utf-16le") : undefined;
function UTF16ToString(ptr, maxBytesToRead) {
  assert(
    ptr % 2 == 0,
    "Pointer passed to UTF16ToString must be aligned to two bytes!"
  );
  var endPtr = ptr;
  var idx = endPtr >> 1;
  var maxIdx = idx + maxBytesToRead / 2;
  while (!(idx >= maxIdx) && HEAPU16[idx]) ++idx;
  endPtr = idx << 1;
  if (endPtr - ptr > 32 && UTF16Decoder)
    return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
  var str = "";
  for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
    var codeUnit = HEAP16[(ptr + i * 2) >> 1];
    if (codeUnit == 0) break;
    str += String.fromCharCode(codeUnit);
  }
  return str;
}
function stringToUTF16(str, outPtr, maxBytesToWrite) {
  assert(
    outPtr % 2 == 0,
    "Pointer passed to stringToUTF16 must be aligned to two bytes!"
  );
  assert(
    typeof maxBytesToWrite == "number",
    "stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!"
  );
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 2147483647;
  }
  if (maxBytesToWrite < 2) return 0;
  maxBytesToWrite -= 2;
  var startPtr = outPtr;
  var numCharsToWrite =
    maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
  for (var i = 0; i < numCharsToWrite; ++i) {
    var codeUnit = str.charCodeAt(i);
    HEAP16[outPtr >> 1] = codeUnit;
    checkInt16(codeUnit);
    outPtr += 2;
  }
  HEAP16[outPtr >> 1] = 0;
  checkInt16(0);
  return outPtr - startPtr;
}
function lengthBytesUTF16(str) {
  return str.length * 2;
}
function UTF32ToString(ptr, maxBytesToRead) {
  assert(
    ptr % 4 == 0,
    "Pointer passed to UTF32ToString must be aligned to four bytes!"
  );
  var i = 0;
  var str = "";
  while (!(i >= maxBytesToRead / 4)) {
    var utf32 = HEAP32[(ptr + i * 4) >> 2];
    if (utf32 == 0) break;
    ++i;
    if (utf32 >= 65536) {
      var ch = utf32 - 65536;
      str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
  return str;
}
function stringToUTF32(str, outPtr, maxBytesToWrite) {
  assert(
    outPtr % 4 == 0,
    "Pointer passed to stringToUTF32 must be aligned to four bytes!"
  );
  assert(
    typeof maxBytesToWrite == "number",
    "stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!"
  );
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 2147483647;
  }
  if (maxBytesToWrite < 4) return 0;
  var startPtr = outPtr;
  var endPtr = startPtr + maxBytesToWrite - 4;
  for (var i = 0; i < str.length; ++i) {
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 55296 && codeUnit <= 57343) {
      var trailSurrogate = str.charCodeAt(++i);
      codeUnit = (65536 + ((codeUnit & 1023) << 10)) | (trailSurrogate & 1023);
    }
    HEAP32[outPtr >> 2] = codeUnit;
    checkInt32(codeUnit);
    outPtr += 4;
    if (outPtr + 4 > endPtr) break;
  }
  HEAP32[outPtr >> 2] = 0;
  checkInt32(0);
  return outPtr - startPtr;
}
function lengthBytesUTF32(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 55296 && codeUnit <= 57343) ++i;
    len += 4;
  }
  return len;
}
function __embind_register_std_wstring(rawType, charSize, name) {
  name = readLatin1String(name);
  var decodeString, encodeString, getHeap, lengthBytesUTF, shift;
  if (charSize === 2) {
    decodeString = UTF16ToString;
    encodeString = stringToUTF16;
    lengthBytesUTF = lengthBytesUTF16;
    getHeap = () => HEAPU16;
    shift = 1;
  } else if (charSize === 4) {
    decodeString = UTF32ToString;
    encodeString = stringToUTF32;
    lengthBytesUTF = lengthBytesUTF32;
    getHeap = () => HEAPU32;
    shift = 2;
  }
  registerType(rawType, {
    name: name,
    fromWireType: function (value) {
      var length = HEAPU32[value >> 2];
      var HEAP = getHeap();
      var str;
      var decodeStartPtr = value + 4;
      for (var i = 0; i <= length; ++i) {
        var currentBytePtr = value + 4 + i * charSize;
        if (i == length || HEAP[currentBytePtr >> shift] == 0) {
          var maxReadBytes = currentBytePtr - decodeStartPtr;
          var stringSegment = decodeString(decodeStartPtr, maxReadBytes);
          if (str === undefined) {
            str = stringSegment;
          } else {
            str += String.fromCharCode(0);
            str += stringSegment;
          }
          decodeStartPtr = currentBytePtr + charSize;
        }
      }
      _free(value);
      return str;
    },
    toWireType: function (destructors, value) {
      if (!(typeof value == "string")) {
        throwBindingError(`Cannot pass non-string to C++ string type ${name}`);
      }
      var length = lengthBytesUTF(value);
      var ptr = _malloc(4 + length + charSize);
      HEAPU32[ptr >> 2] = length >> shift;
      encodeString(value, ptr + 4, length + charSize);
      if (destructors !== null) {
        destructors.push(_free, ptr);
      }
      return ptr;
    },
    argPackAdvance: 8,
    readValueFromPointer: simpleReadValueFromPointer,
    destructorFunction: function (ptr) {
      _free(ptr);
    },
  });
}
function __embind_register_value_object(
  rawType,
  name,
  constructorSignature,
  rawConstructor,
  destructorSignature,
  rawDestructor
) {
  structRegistrations[rawType] = {
    name: readLatin1String(name),
    rawConstructor: embind__requireFunction(
      constructorSignature,
      rawConstructor
    ),
    rawDestructor: embind__requireFunction(destructorSignature, rawDestructor),
    fields: [],
  };
}
function __embind_register_value_object_field(
  structType,
  fieldName,
  getterReturnType,
  getterSignature,
  getter,
  getterContext,
  setterArgumentType,
  setterSignature,
  setter,
  setterContext
) {
  structRegistrations[structType].fields.push({
    fieldName: readLatin1String(fieldName),
    getterReturnType: getterReturnType,
    getter: embind__requireFunction(getterSignature, getter),
    getterContext: getterContext,
    setterArgumentType: setterArgumentType,
    setter: embind__requireFunction(setterSignature, setter),
    setterContext: setterContext,
  });
}
function __embind_register_void(rawType, name) {
  name = readLatin1String(name);
  registerType(rawType, {
    isVoid: true,
    name: name,
    argPackAdvance: 0,
    fromWireType: function () {
      return undefined;
    },
    toWireType: function (destructors, o) {
      return undefined;
    },
  });
}
function __emscripten_fetch_free(id) {
  if (Fetch.xhrs.has(id)) {
    var xhr = Fetch.xhrs.get(id);
    Fetch.xhrs.free(id);
    if (xhr.readyState > 0 && xhr.readyState < 4) {
      xhr.abort();
    }
  }
}
function __emscripten_fetch_get_response_headers(id, dst, dstSizeBytes) {
  var responseHeaders = Fetch.xhrs.get(id).getAllResponseHeaders();
  var lengthBytes = lengthBytesUTF8(responseHeaders) + 1;
  stringToUTF8(responseHeaders, dst, dstSizeBytes);
  return Math.min(lengthBytes, dstSizeBytes);
}
function __emscripten_fetch_get_response_headers_length(id) {
  return lengthBytesUTF8(Fetch.xhrs.get(id).getAllResponseHeaders()) + 1;
}
var nowIsMonotonic = true;
function __emscripten_get_now_is_monotonic() {
  return nowIsMonotonic;
}
function emval_lookupTypes(argCount, argTypes) {
  var a = new Array(argCount);
  for (var i = 0; i < argCount; ++i) {
    a[i] = requireRegisteredType(
      HEAPU32[(argTypes + i * 4) >> 2],
      "parameter " + i
    );
  }
  return a;
}
function __emval_call(handle, argCount, argTypes, argv) {
  handle = Emval.toValue(handle);
  var types = emval_lookupTypes(argCount, argTypes);
  var args = new Array(argCount);
  for (var i = 0; i < argCount; ++i) {
    var type = types[i];
    args[i] = type["readValueFromPointer"](argv);
    argv += type["argPackAdvance"];
  }
  var rv = handle.apply(undefined, args);
  return Emval.toHandle(rv);
}
function __emval_incref(handle) {
  if (handle > 4) {
    emval_handles.get(handle).refcount += 1;
  }
}
function __emval_take_value(type, arg) {
  type = requireRegisteredType(type, "_emval_take_value");
  var v = type["readValueFromPointer"](arg);
  return Emval.toHandle(v);
}
function readI53FromI64(ptr) {
  return HEAPU32[ptr >> 2] + HEAP32[(ptr + 4) >> 2] * 4294967296;
}
function __gmtime_js(time, tmPtr) {
  var date = new Date(readI53FromI64(time) * 1e3);
  HEAP32[tmPtr >> 2] = date.getUTCSeconds();
  checkInt32(date.getUTCSeconds());
  HEAP32[(tmPtr + 4) >> 2] = date.getUTCMinutes();
  checkInt32(date.getUTCMinutes());
  HEAP32[(tmPtr + 8) >> 2] = date.getUTCHours();
  checkInt32(date.getUTCHours());
  HEAP32[(tmPtr + 12) >> 2] = date.getUTCDate();
  checkInt32(date.getUTCDate());
  HEAP32[(tmPtr + 16) >> 2] = date.getUTCMonth();
  checkInt32(date.getUTCMonth());
  HEAP32[(tmPtr + 20) >> 2] = date.getUTCFullYear() - 1900;
  checkInt32(date.getUTCFullYear() - 1900);
  HEAP32[(tmPtr + 24) >> 2] = date.getUTCDay();
  checkInt32(date.getUTCDay());
  var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
  var yday = ((date.getTime() - start) / (1e3 * 60 * 60 * 24)) | 0;
  HEAP32[(tmPtr + 28) >> 2] = yday;
  checkInt32(yday);
}
function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
var MONTH_DAYS_LEAP_CUMULATIVE = [
  0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335,
];
var MONTH_DAYS_REGULAR_CUMULATIVE = [
  0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334,
];
function ydayFromDate(date) {
  var leap = isLeapYear(date.getFullYear());
  var monthDaysCumulative = leap
    ? MONTH_DAYS_LEAP_CUMULATIVE
    : MONTH_DAYS_REGULAR_CUMULATIVE;
  var yday = monthDaysCumulative[date.getMonth()] + date.getDate() - 1;
  return yday;
}
function __localtime_js(time, tmPtr) {
  var date = new Date(readI53FromI64(time) * 1e3);
  HEAP32[tmPtr >> 2] = date.getSeconds();
  checkInt32(date.getSeconds());
  HEAP32[(tmPtr + 4) >> 2] = date.getMinutes();
  checkInt32(date.getMinutes());
  HEAP32[(tmPtr + 8) >> 2] = date.getHours();
  checkInt32(date.getHours());
  HEAP32[(tmPtr + 12) >> 2] = date.getDate();
  checkInt32(date.getDate());
  HEAP32[(tmPtr + 16) >> 2] = date.getMonth();
  checkInt32(date.getMonth());
  HEAP32[(tmPtr + 20) >> 2] = date.getFullYear() - 1900;
  checkInt32(date.getFullYear() - 1900);
  HEAP32[(tmPtr + 24) >> 2] = date.getDay();
  checkInt32(date.getDay());
  var yday = ydayFromDate(date) | 0;
  HEAP32[(tmPtr + 28) >> 2] = yday;
  checkInt32(yday);
  HEAP32[(tmPtr + 36) >> 2] = -(date.getTimezoneOffset() * 60);
  checkInt32(-(date.getTimezoneOffset() * 60));
  var start = new Date(date.getFullYear(), 0, 1);
  var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
  var winterOffset = start.getTimezoneOffset();
  var dst =
    (summerOffset != winterOffset &&
      date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
  HEAP32[(tmPtr + 32) >> 2] = dst;
  checkInt32(dst);
}
function __mktime_js(tmPtr) {
  var date = new Date(
    HEAP32[(tmPtr + 20) >> 2] + 1900,
    HEAP32[(tmPtr + 16) >> 2],
    HEAP32[(tmPtr + 12) >> 2],
    HEAP32[(tmPtr + 8) >> 2],
    HEAP32[(tmPtr + 4) >> 2],
    HEAP32[tmPtr >> 2],
    0
  );
  var dst = HEAP32[(tmPtr + 32) >> 2];
  var guessedOffset = date.getTimezoneOffset();
  var start = new Date(date.getFullYear(), 0, 1);
  var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
  var winterOffset = start.getTimezoneOffset();
  var dstOffset = Math.min(winterOffset, summerOffset);
  if (dst < 0) {
    HEAP32[(tmPtr + 32) >> 2] = Number(
      summerOffset != winterOffset && dstOffset == guessedOffset
    );
    checkInt32(
      Number(summerOffset != winterOffset && dstOffset == guessedOffset)
    );
  } else if (dst > 0 != (dstOffset == guessedOffset)) {
    var nonDstOffset = Math.max(winterOffset, summerOffset);
    var trueOffset = dst > 0 ? dstOffset : nonDstOffset;
    date.setTime(date.getTime() + (trueOffset - guessedOffset) * 6e4);
  }
  HEAP32[(tmPtr + 24) >> 2] = date.getDay();
  checkInt32(date.getDay());
  var yday = ydayFromDate(date) | 0;
  HEAP32[(tmPtr + 28) >> 2] = yday;
  checkInt32(yday);
  HEAP32[tmPtr >> 2] = date.getSeconds();
  checkInt32(date.getSeconds());
  HEAP32[(tmPtr + 4) >> 2] = date.getMinutes();
  checkInt32(date.getMinutes());
  HEAP32[(tmPtr + 8) >> 2] = date.getHours();
  checkInt32(date.getHours());
  HEAP32[(tmPtr + 12) >> 2] = date.getDate();
  checkInt32(date.getDate());
  HEAP32[(tmPtr + 16) >> 2] = date.getMonth();
  checkInt32(date.getMonth());
  HEAP32[(tmPtr + 20) >> 2] = date.getYear();
  checkInt32(date.getYear());
  return (date.getTime() / 1e3) | 0;
}
function __mmap_js(len, prot, flags, fd, off, allocated, addr) {
  return -52;
}
function __munmap_js(addr, len, prot, flags, fd, offset) {}
function stringToNewUTF8(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = _malloc(size);
  if (ret) stringToUTF8(str, ret, size);
  return ret;
}
function __tzset_js(timezone, daylight, tzname) {
  var currentYear = new Date().getFullYear();
  var winter = new Date(currentYear, 0, 1);
  var summer = new Date(currentYear, 6, 1);
  var winterOffset = winter.getTimezoneOffset();
  var summerOffset = summer.getTimezoneOffset();
  var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
  HEAPU32[timezone >> 2] = stdTimezoneOffset * 60;
  checkInt32(stdTimezoneOffset * 60);
  HEAP32[daylight >> 2] = Number(winterOffset != summerOffset);
  checkInt32(Number(winterOffset != summerOffset));
  function extractZone(date) {
    var match = date.toTimeString().match(/\(([A-Za-z ]+)\)$/);
    return match ? match[1] : "GMT";
  }
  var winterName = extractZone(winter);
  var summerName = extractZone(summer);
  var winterNamePtr = stringToNewUTF8(winterName);
  var summerNamePtr = stringToNewUTF8(summerName);
  if (summerOffset < winterOffset) {
    HEAPU32[tzname >> 2] = winterNamePtr;
    checkInt32(winterNamePtr);
    HEAPU32[(tzname + 4) >> 2] = summerNamePtr;
    checkInt32(summerNamePtr);
  } else {
    HEAPU32[tzname >> 2] = summerNamePtr;
    checkInt32(summerNamePtr);
    HEAPU32[(tzname + 4) >> 2] = winterNamePtr;
    checkInt32(winterNamePtr);
  }
}
function _abort() {
  abort("native code called abort()");
}
function _dlopen(filename, flags) {
  abort(dlopenMissingError);
}
var readEmAsmArgsArray = [];
function readEmAsmArgs(sigPtr, buf) {
  assert(Array.isArray(readEmAsmArgsArray));
  assert(buf % 16 == 0);
  readEmAsmArgsArray.length = 0;
  var ch;
  buf >>= 2;
  while ((ch = HEAPU8[sigPtr++])) {
    var chr = String.fromCharCode(ch);
    var validChars = ["d", "f", "i"];
    assert(
      validChars.includes(chr),
      `Invalid character ${ch}("${chr}") in readEmAsmArgs! Use only [${validChars}], and do not specify "v" for void return argument.`
    );
    buf += (ch != 105) & buf;
    readEmAsmArgsArray.push(ch == 105 ? HEAP32[buf] : HEAPF64[buf++ >> 1]);
    ++buf;
  }
  return readEmAsmArgsArray;
}
function runEmAsmFunction(code, sigPtr, argbuf) {
  var args = readEmAsmArgs(sigPtr, argbuf);
  if (!ASM_CONSTS.hasOwnProperty(code))
    abort(`No EM_ASM constant found at address ${code}`);
  return ASM_CONSTS[code].apply(null, args);
}
function _emscripten_asm_const_int(code, sigPtr, argbuf) {
  return runEmAsmFunction(code, sigPtr, argbuf);
}
function runMainThreadEmAsm(code, sigPtr, argbuf, sync) {
  var args = readEmAsmArgs(sigPtr, argbuf);
  if (!ASM_CONSTS.hasOwnProperty(code))
    abort(`No EM_ASM constant found at address ${code}`);
  return ASM_CONSTS[code].apply(null, args);
}
function _emscripten_asm_const_int_sync_on_main_thread(code, sigPtr, argbuf) {
  return runMainThreadEmAsm(code, sigPtr, argbuf, 1);
}
function _emscripten_asm_const_ptr(code, sigPtr, argbuf) {
  return runEmAsmFunction(code, sigPtr, argbuf);
}
function _emscripten_date_now() {
  return Date.now();
}
function getHeapMax() {
  return HEAPU8.length;
}
function _emscripten_get_heap_max() {
  return getHeapMax();
}
var _emscripten_get_now;
if (ENVIRONMENT_IS_NODE) {
  global.performance = require("perf_hooks").performance;
}
_emscripten_get_now = () => performance.now();
function _emscripten_is_main_browser_thread() {
  return !ENVIRONMENT_IS_WORKER;
}
function _emscripten_memcpy_big(dest, src, num) {
  HEAPU8.copyWithin(dest, src, src + num);
}
function abortOnCannotGrowMemory(requestedSize) {
  abort(
    `Cannot enlarge memory arrays to size ${requestedSize} bytes (OOM). Either (1) compile with -sINITIAL_MEMORY=X with X higher than the current value ${HEAP8.length}, (2) compile with -sALLOW_MEMORY_GROWTH which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with -sABORTING_MALLOC=0`
  );
}
function _emscripten_resize_heap(requestedSize) {
  var oldSize = HEAPU8.length;
  requestedSize = requestedSize >>> 0;
  abortOnCannotGrowMemory(requestedSize);
}
var Fetch = {
  openDatabase: function (dbname, dbversion, onsuccess, onerror) {
    try {
      var openRequest = indexedDB.open(dbname, dbversion);
    } catch (e) {
      return onerror(e);
    }
    openRequest.onupgradeneeded = (event) => {
      var db = event.target.result;
      if (db.objectStoreNames.contains("FILES")) {
        db.deleteObjectStore("FILES");
      }
      db.createObjectStore("FILES");
    };
    openRequest.onsuccess = (event) => onsuccess(event.target.result);
    openRequest.onerror = (error) => onerror(error);
  },
  init: function () {
    Fetch.xhrs = new HandleAllocator();
    var onsuccess = (db) => {
      Fetch.dbInstance = db;
      removeRunDependency("library_fetch_init");
    };
    var onerror = () => {
      Fetch.dbInstance = false;
      removeRunDependency("library_fetch_init");
    };
    addRunDependency("library_fetch_init");
    Fetch.openDatabase("emscripten_filesystem", 1, onsuccess, onerror);
  },
};
function fetchXHR(fetch, onsuccess, onerror, onprogress, onreadystatechange) {
  var url = HEAPU32[(fetch + 8) >> 2];
  if (!url) {
    onerror(fetch, 0, "no url specified!");
    return;
  }
  var url_ = UTF8ToString(url);
  var fetch_attr = fetch + 112;
  var requestMethod = UTF8ToString(fetch_attr + 0);
  if (!requestMethod) requestMethod = "GET";
  var timeoutMsecs = HEAPU32[(fetch_attr + 56) >> 2];
  var userName = HEAPU32[(fetch_attr + 68) >> 2];
  var password = HEAPU32[(fetch_attr + 72) >> 2];
  var requestHeaders = HEAPU32[(fetch_attr + 76) >> 2];
  var overriddenMimeType = HEAPU32[(fetch_attr + 80) >> 2];
  var dataPtr = HEAPU32[(fetch_attr + 84) >> 2];
  var dataLength = HEAPU32[(fetch_attr + 88) >> 2];
  var fetchAttributes = HEAPU32[(fetch_attr + 52) >> 2];
  var fetchAttrLoadToMemory = !!(fetchAttributes & 1);
  var fetchAttrStreamData = !!(fetchAttributes & 2);
  var fetchAttrSynchronous = !!(fetchAttributes & 64);
  var userNameStr = userName ? UTF8ToString(userName) : undefined;
  var passwordStr = password ? UTF8ToString(password) : undefined;
  var xhr = new XMLHttpRequest();
  xhr.withCredentials = !!HEAPU8[(fetch_attr + 60) >> 0];
  xhr.open(
    requestMethod,
    url_,
    !fetchAttrSynchronous,
    userNameStr,
    passwordStr
  );
  if (!fetchAttrSynchronous) xhr.timeout = timeoutMsecs;
  xhr.url_ = url_;
  assert(
    !fetchAttrStreamData,
    "streaming uses moz-chunked-arraybuffer which is no longer supported; TODO: rewrite using fetch()"
  );
  xhr.responseType = "arraybuffer";
  if (overriddenMimeType) {
    var overriddenMimeTypeStr = UTF8ToString(overriddenMimeType);
    xhr.overrideMimeType(overriddenMimeTypeStr);
  }
  if (requestHeaders) {
    for (;;) {
      var key = HEAPU32[requestHeaders >> 2];
      if (!key) break;
      var value = HEAPU32[(requestHeaders + 4) >> 2];
      if (!value) break;
      requestHeaders += 8;
      var keyStr = UTF8ToString(key);
      var valueStr = UTF8ToString(value);
      xhr.setRequestHeader(keyStr, valueStr);
    }
  }
  var id = Fetch.xhrs.allocate(xhr);
  HEAPU32[fetch >> 2] = id;
  checkInt32(id);
  var data =
    dataPtr && dataLength ? HEAPU8.slice(dataPtr, dataPtr + dataLength) : null;
  function saveResponseAndStatus() {
    var ptr = 0;
    var ptrLen = 0;
    if (
      xhr.response &&
      fetchAttrLoadToMemory &&
      HEAPU32[(fetch + 12) >> 2] === 0
    ) {
      ptrLen = xhr.response.byteLength;
    }
    if (ptrLen > 0) {
      ptr = _malloc(ptrLen);
      HEAPU8.set(new Uint8Array(xhr.response), ptr);
    }
    HEAPU32[(fetch + 12) >> 2] = ptr;
    writeI53ToI64(fetch + 16, ptrLen);
    writeI53ToI64(fetch + 24, 0);
    var len = xhr.response ? xhr.response.byteLength : 0;
    if (len) {
      writeI53ToI64(fetch + 32, len);
    }
    HEAPU16[(fetch + 40) >> 1] = xhr.readyState;
    HEAPU16[(fetch + 42) >> 1] = xhr.status;
    if (xhr.statusText) stringToUTF8(xhr.statusText, fetch + 44, 64);
  }
  xhr.onload = (e) => {
    if (!Fetch.xhrs.has(id)) {
      return;
    }
    saveResponseAndStatus();
    if (xhr.status >= 200 && xhr.status < 300) {
      if (onsuccess) onsuccess(fetch, xhr, e);
    } else {
      if (onerror) onerror(fetch, xhr, e);
    }
  };
  xhr.onerror = (e) => {
    if (!Fetch.xhrs.has(id)) {
      return;
    }
    saveResponseAndStatus();
    if (onerror) onerror(fetch, xhr, e);
  };
  xhr.ontimeout = (e) => {
    if (!Fetch.xhrs.has(id)) {
      return;
    }
    if (onerror) onerror(fetch, xhr, e);
  };
  xhr.onprogress = (e) => {
    if (!Fetch.xhrs.has(id)) {
      return;
    }
    var ptrLen =
      fetchAttrLoadToMemory && fetchAttrStreamData && xhr.response
        ? xhr.response.byteLength
        : 0;
    var ptr = 0;
    if (ptrLen > 0 && fetchAttrLoadToMemory && fetchAttrStreamData) {
      assert(
        onprogress,
        "When doing a streaming fetch, you should have an onprogress handler registered to receive the chunks!"
      );
      ptr = _malloc(ptrLen);
      HEAPU8.set(new Uint8Array(xhr.response), ptr);
    }
    HEAPU32[(fetch + 12) >> 2] = ptr;
    writeI53ToI64(fetch + 16, ptrLen);
    writeI53ToI64(fetch + 24, e.loaded - ptrLen);
    writeI53ToI64(fetch + 32, e.total);
    HEAPU16[(fetch + 40) >> 1] = xhr.readyState;
    if (xhr.readyState >= 3 && xhr.status === 0 && e.loaded > 0)
      xhr.status = 200;
    HEAPU16[(fetch + 42) >> 1] = xhr.status;
    if (xhr.statusText) stringToUTF8(xhr.statusText, fetch + 44, 64);
    if (onprogress) onprogress(fetch, xhr, e);
    if (ptr) {
      _free(ptr);
    }
  };
  xhr.onreadystatechange = (e) => {
    if (!Fetch.xhrs.has(id)) {
      return;
    }
    HEAPU16[(fetch + 40) >> 1] = xhr.readyState;
    if (xhr.readyState >= 2) {
      HEAPU16[(fetch + 42) >> 1] = xhr.status;
    }
    if (onreadystatechange) onreadystatechange(fetch, xhr, e);
  };
  try {
    xhr.send(data);
  } catch (e) {
    if (onerror) onerror(fetch, xhr, e);
  }
}
function handleException(e) {
  if (e instanceof ExitStatus || e == "unwind") {
    return EXITSTATUS;
  }
  checkStackCookie();
  if (e instanceof WebAssembly.RuntimeError) {
    if (_emscripten_stack_get_current() <= 0) {
      err(
        "Stack overflow detected.  You can try increasing -sSTACK_SIZE (currently set to 100000)"
      );
    }
  }
  quit_(1, e);
}
function _proc_exit(code) {
  EXITSTATUS = code;
  if (!keepRuntimeAlive()) {
    if (Module["onExit"]) Module["onExit"](code);
    ABORT = true;
  }
  quit_(code, new ExitStatus(code));
}
function exitJS(status, implicit) {
  EXITSTATUS = status;
  checkUnflushedContent();
  if (keepRuntimeAlive() && !implicit) {
    var msg = `program exited (with status: ${status}), but keepRuntimeAlive() is set (counter=${runtimeKeepaliveCounter}) due to an async operation, so halting execution but not exiting the runtime or preventing further async execution (you can use emscripten_force_exit, if you want to force a true shutdown)`;
    err(msg);
  }
  _proc_exit(status);
}
var _exit = exitJS;
function maybeExit() {
  if (!keepRuntimeAlive()) {
    try {
      _exit(EXITSTATUS);
    } catch (e) {
      handleException(e);
    }
  }
}
function callUserCallback(func) {
  if (ABORT) {
    err(
      "user callback triggered after runtime exited or application aborted.  Ignoring."
    );
    return;
  }
  try {
    func();
    maybeExit();
  } catch (e) {
    handleException(e);
  }
}
function readI53FromU64(ptr) {
  return HEAPU32[ptr >> 2] + HEAPU32[(ptr + 4) >> 2] * 4294967296;
}
function writeI53ToI64(ptr, num) {
  HEAPU32[ptr >> 2] = num;
  HEAPU32[(ptr + 4) >> 2] = (num - HEAPU32[ptr >> 2]) / 4294967296;
  var deserialized = num >= 0 ? readI53FromU64(ptr) : readI53FromI64(ptr);
  if (deserialized != num)
    warnOnce(
      "writeI53ToI64() out of range: serialized JS Number " +
        num +
        " to Wasm heap as bytes lo=" +
        ptrToString(HEAPU32[ptr >> 2]) +
        ", hi=" +
        ptrToString(HEAPU32[(ptr + 4) >> 2]) +
        ", which deserializes back to " +
        deserialized +
        " instead!"
    );
}
function fetchCacheData(db, fetch, data, onsuccess, onerror) {
  if (!db) {
    onerror(fetch, 0, "IndexedDB not available!");
    return;
  }
  var fetch_attr = fetch + 112;
  var destinationPath = HEAPU32[(fetch_attr + 64) >> 2];
  if (!destinationPath) destinationPath = HEAPU32[(fetch + 8) >> 2];
  var destinationPathStr = UTF8ToString(destinationPath);
  try {
    var transaction = db.transaction(["FILES"], "readwrite");
    var packages = transaction.objectStore("FILES");
    var putRequest = packages.put(data, destinationPathStr);
    putRequest.onsuccess = (event) => {
      HEAPU16[(fetch + 40) >> 1] = 4;
      HEAPU16[(fetch + 42) >> 1] = 200;
      stringToUTF8("OK", fetch + 44, 64);
      onsuccess(fetch, 0, destinationPathStr);
    };
    putRequest.onerror = (error) => {
      HEAPU16[(fetch + 40) >> 1] = 4;
      HEAPU16[(fetch + 42) >> 1] = 413;
      stringToUTF8("Payload Too Large", fetch + 44, 64);
      onerror(fetch, 0, error);
    };
  } catch (e) {
    onerror(fetch, 0, e);
  }
}
function fetchLoadCachedData(db, fetch, onsuccess, onerror) {
  if (!db) {
    onerror(fetch, 0, "IndexedDB not available!");
    return;
  }
  var fetch_attr = fetch + 112;
  var path = HEAPU32[(fetch_attr + 64) >> 2];
  if (!path) path = HEAPU32[(fetch + 8) >> 2];
  var pathStr = UTF8ToString(path);
  try {
    var transaction = db.transaction(["FILES"], "readonly");
    var packages = transaction.objectStore("FILES");
    var getRequest = packages.get(pathStr);
    getRequest.onsuccess = (event) => {
      if (event.target.result) {
        var value = event.target.result;
        var len = value.byteLength || value.length;
        var ptr = _malloc(len);
        HEAPU8.set(new Uint8Array(value), ptr);
        HEAPU32[(fetch + 12) >> 2] = ptr;
        writeI53ToI64(fetch + 16, len);
        writeI53ToI64(fetch + 24, 0);
        writeI53ToI64(fetch + 32, len);
        HEAPU16[(fetch + 40) >> 1] = 4;
        HEAPU16[(fetch + 42) >> 1] = 200;
        stringToUTF8("OK", fetch + 44, 64);
        onsuccess(fetch, 0, value);
      } else {
        HEAPU16[(fetch + 40) >> 1] = 4;
        HEAPU16[(fetch + 42) >> 1] = 404;
        stringToUTF8("Not Found", fetch + 44, 64);
        onerror(fetch, 0, "no data");
      }
    };
    getRequest.onerror = (error) => {
      HEAPU16[(fetch + 40) >> 1] = 4;
      HEAPU16[(fetch + 42) >> 1] = 404;
      stringToUTF8("Not Found", fetch + 44, 64);
      onerror(fetch, 0, error);
    };
  } catch (e) {
    onerror(fetch, 0, e);
  }
}
function fetchDeleteCachedData(db, fetch, onsuccess, onerror) {
  if (!db) {
    onerror(fetch, 0, "IndexedDB not available!");
    return;
  }
  var fetch_attr = fetch + 112;
  var path = HEAPU32[(fetch_attr + 64) >> 2];
  if (!path) path = HEAPU32[(fetch + 8) >> 2];
  var pathStr = UTF8ToString(path);
  try {
    var transaction = db.transaction(["FILES"], "readwrite");
    var packages = transaction.objectStore("FILES");
    var request = packages.delete(pathStr);
    request.onsuccess = (event) => {
      var value = event.target.result;
      HEAPU32[(fetch + 12) >> 2] = 0;
      writeI53ToI64(fetch + 16, 0);
      writeI53ToI64(fetch + 24, 0);
      writeI53ToI64(fetch + 32, 0);
      HEAPU16[(fetch + 40) >> 1] = 4;
      HEAPU16[(fetch + 42) >> 1] = 200;
      stringToUTF8("OK", fetch + 44, 64);
      onsuccess(fetch, 0, value);
    };
    request.onerror = (error) => {
      HEAPU16[(fetch + 40) >> 1] = 4;
      HEAPU16[(fetch + 42) >> 1] = 404;
      stringToUTF8("Not Found", fetch + 44, 64);
      onerror(fetch, 0, error);
    };
  } catch (e) {
    onerror(fetch, 0, e);
  }
}
function _emscripten_start_fetch(
  fetch,
  successcb,
  errorcb,
  progresscb,
  readystatechangecb
) {
  var fetch_attr = fetch + 112;
  var onsuccess = HEAPU32[(fetch_attr + 36) >> 2];
  var onerror = HEAPU32[(fetch_attr + 40) >> 2];
  var onprogress = HEAPU32[(fetch_attr + 44) >> 2];
  var onreadystatechange = HEAPU32[(fetch_attr + 48) >> 2];
  var fetchAttributes = HEAPU32[(fetch_attr + 52) >> 2];
  var fetchAttrSynchronous = !!(fetchAttributes & 64);
  function doCallback(f) {
    if (fetchAttrSynchronous) {
      f();
    } else {
      callUserCallback(f);
    }
  }
  var reportSuccess = (fetch, xhr, e) => {
    doCallback(() => {
      if (onsuccess) getWasmTableEntry(onsuccess)(fetch);
      else if (successcb) successcb(fetch);
    });
  };
  var reportProgress = (fetch, xhr, e) => {
    doCallback(() => {
      if (onprogress) getWasmTableEntry(onprogress)(fetch);
      else if (progresscb) progresscb(fetch);
    });
  };
  var reportError = (fetch, xhr, e) => {
    doCallback(() => {
      if (onerror) getWasmTableEntry(onerror)(fetch);
      else if (errorcb) errorcb(fetch);
    });
  };
  var reportReadyStateChange = (fetch, xhr, e) => {
    doCallback(() => {
      if (onreadystatechange) getWasmTableEntry(onreadystatechange)(fetch);
      else if (readystatechangecb) readystatechangecb(fetch);
    });
  };
  var performUncachedXhr = (fetch, xhr, e) => {
    fetchXHR(
      fetch,
      reportSuccess,
      reportError,
      reportProgress,
      reportReadyStateChange
    );
  };
  var cacheResultAndReportSuccess = (fetch, xhr, e) => {
    var storeSuccess = (fetch, xhr, e) => {
      doCallback(() => {
        if (onsuccess) getWasmTableEntry(onsuccess)(fetch);
        else if (successcb) successcb(fetch);
      });
    };
    var storeError = (fetch, xhr, e) => {
      doCallback(() => {
        if (onsuccess) getWasmTableEntry(onsuccess)(fetch);
        else if (successcb) successcb(fetch);
      });
    };
    fetchCacheData(
      Fetch.dbInstance,
      fetch,
      xhr.response,
      storeSuccess,
      storeError
    );
  };
  var performCachedXhr = (fetch, xhr, e) => {
    fetchXHR(
      fetch,
      cacheResultAndReportSuccess,
      reportError,
      reportProgress,
      reportReadyStateChange
    );
  };
  var requestMethod = UTF8ToString(fetch_attr + 0);
  var fetchAttrReplace = !!(fetchAttributes & 16);
  var fetchAttrPersistFile = !!(fetchAttributes & 4);
  var fetchAttrNoDownload = !!(fetchAttributes & 32);
  if (requestMethod === "EM_IDB_STORE") {
    var ptr = HEAPU32[(fetch_attr + 84) >> 2];
    var size = HEAPU32[(fetch_attr + 88) >> 2];
    fetchCacheData(
      Fetch.dbInstance,
      fetch,
      HEAPU8.slice(ptr, ptr + size),
      reportSuccess,
      reportError
    );
  } else if (requestMethod === "EM_IDB_DELETE") {
    fetchDeleteCachedData(Fetch.dbInstance, fetch, reportSuccess, reportError);
  } else if (!fetchAttrReplace) {
    fetchLoadCachedData(
      Fetch.dbInstance,
      fetch,
      reportSuccess,
      fetchAttrNoDownload
        ? reportError
        : fetchAttrPersistFile
        ? performCachedXhr
        : performUncachedXhr
    );
  } else if (!fetchAttrNoDownload) {
    fetchXHR(
      fetch,
      fetchAttrPersistFile ? cacheResultAndReportSuccess : reportSuccess,
      reportError,
      reportProgress,
      reportReadyStateChange
    );
  } else {
    return 0;
  }
  return fetch;
}
var ENV = {};
function getExecutableName() {
  return thisProgram || "./this.program";
}
function getEnvStrings() {
  if (!getEnvStrings.strings) {
    var lang =
      (
        (typeof navigator == "object" &&
          navigator.languages &&
          navigator.languages[0]) ||
        "C"
      ).replace("-", "_") + ".UTF-8";
    var env = {
      USER: "web_user",
      LOGNAME: "web_user",
      PATH: "/",
      PWD: "/",
      HOME: "/home/web_user",
      LANG: lang,
      _: getExecutableName(),
    };
    for (var x in ENV) {
      if (ENV[x] === undefined) delete env[x];
      else env[x] = ENV[x];
    }
    var strings = [];
    for (var x in env) {
      strings.push(`${x}=${env[x]}`);
    }
    getEnvStrings.strings = strings;
  }
  return getEnvStrings.strings;
}
function stringToAscii(str, buffer) {
  for (var i = 0; i < str.length; ++i) {
    assert(str.charCodeAt(i) === (str.charCodeAt(i) & 255));
    HEAP8[buffer++ >> 0] = str.charCodeAt(i);
    checkInt8(str.charCodeAt(i));
  }
  HEAP8[buffer >> 0] = 0;
  checkInt8(0);
}
function _environ_get(__environ, environ_buf) {
  var bufSize = 0;
  getEnvStrings().forEach(function (string, i) {
    var ptr = environ_buf + bufSize;
    HEAPU32[(__environ + i * 4) >> 2] = ptr;
    checkInt32(ptr);
    stringToAscii(string, ptr);
    bufSize += string.length + 1;
  });
  return 0;
}
function _environ_sizes_get(penviron_count, penviron_buf_size) {
  var strings = getEnvStrings();
  HEAPU32[penviron_count >> 2] = strings.length;
  checkInt32(strings.length);
  var bufSize = 0;
  strings.forEach(function (string) {
    bufSize += string.length + 1;
  });
  HEAPU32[penviron_buf_size >> 2] = bufSize;
  checkInt32(bufSize);
  return 0;
}
function _fd_close(fd) {
  abort("fd_close called without SYSCALLS_REQUIRE_FILESYSTEM");
}
function _fd_read(fd, iov, iovcnt, pnum) {
  abort("fd_read called without SYSCALLS_REQUIRE_FILESYSTEM");
}
function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
  return 70;
}
var printCharBuffers = [null, [], []];
function printChar(stream, curr) {
  var buffer = printCharBuffers[stream];
  assert(buffer);
  if (curr === 0 || curr === 10) {
    (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
    buffer.length = 0;
  } else {
    buffer.push(curr);
  }
}
function flush_NO_FILESYSTEM() {
  _fflush(0);
  if (printCharBuffers[1].length) printChar(1, 10);
  if (printCharBuffers[2].length) printChar(2, 10);
}
function _fd_write(fd, iov, iovcnt, pnum) {
  var num = 0;
  for (var i = 0; i < iovcnt; i++) {
    var ptr = HEAPU32[iov >> 2];
    var len = HEAPU32[(iov + 4) >> 2];
    iov += 8;
    for (var j = 0; j < len; j++) {
      printChar(fd, HEAPU8[ptr + j]);
    }
    num += len;
  }
  HEAPU32[pnum >> 2] = num;
  checkInt32(num);
  return 0;
}
function initRandomFill() {
  if (
    typeof crypto == "object" &&
    typeof crypto["getRandomValues"] == "function"
  ) {
    return (view) => crypto.getRandomValues(view);
  } else if (ENVIRONMENT_IS_NODE) {
    try {
      var crypto_module = require("crypto");
      var randomFillSync = crypto_module["randomFillSync"];
      if (randomFillSync) {
        return (view) => crypto_module["randomFillSync"](view);
      }
      var randomBytes = crypto_module["randomBytes"];
      return (view) => (view.set(randomBytes(view.byteLength)), view);
    } catch (e) {}
  }
  abort(
    "no cryptographic support found for randomDevice. consider polyfilling it if you want to use something insecure like Math.random(), e.g. put this in a --pre-js: var crypto = { getRandomValues: function(array) { for (var i = 0; i < array.length; i++) array[i] = (Math.random()*256)|0 } };"
  );
}
function randomFill(view) {
  return (randomFill = initRandomFill())(view);
}
function _getentropy(buffer, size) {
  randomFill(HEAPU8.subarray(buffer, buffer + size));
  return 0;
}
function arraySum(array, index) {
  var sum = 0;
  for (var i = 0; i <= index; sum += array[i++]) {}
  return sum;
}
var MONTH_DAYS_LEAP = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var MONTH_DAYS_REGULAR = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function addDays(date, days) {
  var newDate = new Date(date.getTime());
  while (days > 0) {
    var leap = isLeapYear(newDate.getFullYear());
    var currentMonth = newDate.getMonth();
    var daysInCurrentMonth = (leap ? MONTH_DAYS_LEAP : MONTH_DAYS_REGULAR)[
      currentMonth
    ];
    if (days > daysInCurrentMonth - newDate.getDate()) {
      days -= daysInCurrentMonth - newDate.getDate() + 1;
      newDate.setDate(1);
      if (currentMonth < 11) {
        newDate.setMonth(currentMonth + 1);
      } else {
        newDate.setMonth(0);
        newDate.setFullYear(newDate.getFullYear() + 1);
      }
    } else {
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    }
  }
  return newDate;
}
function intArrayFromString(stringy, dontAddNull, length) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
}
function writeArrayToMemory(array, buffer) {
  assert(
    array.length >= 0,
    "writeArrayToMemory array must have a length (should be an array or typed array)"
  );
  HEAP8.set(array, buffer);
}
function _strftime(s, maxsize, format, tm) {
  var tm_zone = HEAP32[(tm + 40) >> 2];
  var date = {
    tm_sec: HEAP32[tm >> 2],
    tm_min: HEAP32[(tm + 4) >> 2],
    tm_hour: HEAP32[(tm + 8) >> 2],
    tm_mday: HEAP32[(tm + 12) >> 2],
    tm_mon: HEAP32[(tm + 16) >> 2],
    tm_year: HEAP32[(tm + 20) >> 2],
    tm_wday: HEAP32[(tm + 24) >> 2],
    tm_yday: HEAP32[(tm + 28) >> 2],
    tm_isdst: HEAP32[(tm + 32) >> 2],
    tm_gmtoff: HEAP32[(tm + 36) >> 2],
    tm_zone: tm_zone ? UTF8ToString(tm_zone) : "",
  };
  var pattern = UTF8ToString(format);
  var EXPANSION_RULES_1 = {
    "%c": "%a %b %d %H:%M:%S %Y",
    "%D": "%m/%d/%y",
    "%F": "%Y-%m-%d",
    "%h": "%b",
    "%r": "%I:%M:%S %p",
    "%R": "%H:%M",
    "%T": "%H:%M:%S",
    "%x": "%m/%d/%y",
    "%X": "%H:%M:%S",
    "%Ec": "%c",
    "%EC": "%C",
    "%Ex": "%m/%d/%y",
    "%EX": "%H:%M:%S",
    "%Ey": "%y",
    "%EY": "%Y",
    "%Od": "%d",
    "%Oe": "%e",
    "%OH": "%H",
    "%OI": "%I",
    "%Om": "%m",
    "%OM": "%M",
    "%OS": "%S",
    "%Ou": "%u",
    "%OU": "%U",
    "%OV": "%V",
    "%Ow": "%w",
    "%OW": "%W",
    "%Oy": "%y",
  };
  for (var rule in EXPANSION_RULES_1) {
    pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_1[rule]);
  }
  var WEEKDAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  var MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  function leadingSomething(value, digits, character) {
    var str = typeof value == "number" ? value.toString() : value || "";
    while (str.length < digits) {
      str = character[0] + str;
    }
    return str;
  }
  function leadingNulls(value, digits) {
    return leadingSomething(value, digits, "0");
  }
  function compareByDay(date1, date2) {
    function sgn(value) {
      return value < 0 ? -1 : value > 0 ? 1 : 0;
    }
    var compare;
    if ((compare = sgn(date1.getFullYear() - date2.getFullYear())) === 0) {
      if ((compare = sgn(date1.getMonth() - date2.getMonth())) === 0) {
        compare = sgn(date1.getDate() - date2.getDate());
      }
    }
    return compare;
  }
  function getFirstWeekStartDate(janFourth) {
    switch (janFourth.getDay()) {
      case 0:
        return new Date(janFourth.getFullYear() - 1, 11, 29);
      case 1:
        return janFourth;
      case 2:
        return new Date(janFourth.getFullYear(), 0, 3);
      case 3:
        return new Date(janFourth.getFullYear(), 0, 2);
      case 4:
        return new Date(janFourth.getFullYear(), 0, 1);
      case 5:
        return new Date(janFourth.getFullYear() - 1, 11, 31);
      case 6:
        return new Date(janFourth.getFullYear() - 1, 11, 30);
    }
  }
  function getWeekBasedYear(date) {
    var thisDate = addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
    var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
    var janFourthNextYear = new Date(thisDate.getFullYear() + 1, 0, 4);
    var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
    var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
    if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
      if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
        return thisDate.getFullYear() + 1;
      }
      return thisDate.getFullYear();
    }
    return thisDate.getFullYear() - 1;
  }
  var EXPANSION_RULES_2 = {
    "%a": function (date) {
      return WEEKDAYS[date.tm_wday].substring(0, 3);
    },
    "%A": function (date) {
      return WEEKDAYS[date.tm_wday];
    },
    "%b": function (date) {
      return MONTHS[date.tm_mon].substring(0, 3);
    },
    "%B": function (date) {
      return MONTHS[date.tm_mon];
    },
    "%C": function (date) {
      var year = date.tm_year + 1900;
      return leadingNulls((year / 100) | 0, 2);
    },
    "%d": function (date) {
      return leadingNulls(date.tm_mday, 2);
    },
    "%e": function (date) {
      return leadingSomething(date.tm_mday, 2, " ");
    },
    "%g": function (date) {
      return getWeekBasedYear(date).toString().substring(2);
    },
    "%G": function (date) {
      return getWeekBasedYear(date);
    },
    "%H": function (date) {
      return leadingNulls(date.tm_hour, 2);
    },
    "%I": function (date) {
      var twelveHour = date.tm_hour;
      if (twelveHour == 0) twelveHour = 12;
      else if (twelveHour > 12) twelveHour -= 12;
      return leadingNulls(twelveHour, 2);
    },
    "%j": function (date) {
      return leadingNulls(
        date.tm_mday +
          arraySum(
            isLeapYear(date.tm_year + 1900)
              ? MONTH_DAYS_LEAP
              : MONTH_DAYS_REGULAR,
            date.tm_mon - 1
          ),
        3
      );
    },
    "%m": function (date) {
      return leadingNulls(date.tm_mon + 1, 2);
    },
    "%M": function (date) {
      return leadingNulls(date.tm_min, 2);
    },
    "%n": function () {
      return "\n";
    },
    "%p": function (date) {
      if (date.tm_hour >= 0 && date.tm_hour < 12) {
        return "AM";
      }
      return "PM";
    },
    "%S": function (date) {
      return leadingNulls(date.tm_sec, 2);
    },
    "%t": function () {
      return "\t";
    },
    "%u": function (date) {
      return date.tm_wday || 7;
    },
    "%U": function (date) {
      var days = date.tm_yday + 7 - date.tm_wday;
      return leadingNulls(Math.floor(days / 7), 2);
    },
    "%V": function (date) {
      var val = Math.floor((date.tm_yday + 7 - ((date.tm_wday + 6) % 7)) / 7);
      if ((date.tm_wday + 371 - date.tm_yday - 2) % 7 <= 2) {
        val++;
      }
      if (!val) {
        val = 52;
        var dec31 = (date.tm_wday + 7 - date.tm_yday - 1) % 7;
        if (
          dec31 == 4 ||
          (dec31 == 5 && isLeapYear((date.tm_year % 400) - 1))
        ) {
          val++;
        }
      } else if (val == 53) {
        var jan1 = (date.tm_wday + 371 - date.tm_yday) % 7;
        if (jan1 != 4 && (jan1 != 3 || !isLeapYear(date.tm_year))) val = 1;
      }
      return leadingNulls(val, 2);
    },
    "%w": function (date) {
      return date.tm_wday;
    },
    "%W": function (date) {
      var days = date.tm_yday + 7 - ((date.tm_wday + 6) % 7);
      return leadingNulls(Math.floor(days / 7), 2);
    },
    "%y": function (date) {
      return (date.tm_year + 1900).toString().substring(2);
    },
    "%Y": function (date) {
      return date.tm_year + 1900;
    },
    "%z": function (date) {
      var off = date.tm_gmtoff;
      var ahead = off >= 0;
      off = Math.abs(off) / 60;
      off = (off / 60) * 100 + (off % 60);
      return (ahead ? "+" : "-") + String("0000" + off).slice(-4);
    },
    "%Z": function (date) {
      return date.tm_zone;
    },
    "%%": function () {
      return "%";
    },
  };
  pattern = pattern.replace(/%%/g, "\0\0");
  for (var rule in EXPANSION_RULES_2) {
    if (pattern.includes(rule)) {
      pattern = pattern.replace(
        new RegExp(rule, "g"),
        EXPANSION_RULES_2[rule](date)
      );
    }
  }
  pattern = pattern.replace(/\0\0/g, "%");
  var bytes = intArrayFromString(pattern, false);
  if (bytes.length > maxsize) {
    return 0;
  }
  writeArrayToMemory(bytes, s);
  return bytes.length - 1;
}
function _strftime_l(s, maxsize, format, tm, loc) {
  return _strftime(s, maxsize, format, tm);
}
function getCFunc(ident) {
  var func = Module["_" + ident];
  assert(
    func,
    "Cannot call unknown function " + ident + ", make sure it is exported"
  );
  return func;
}
function stringToUTF8OnStack(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = stackAlloc(size);
  stringToUTF8(str, ret, size);
  return ret;
}
function ccall(ident, returnType, argTypes, args, opts) {
  var toC = {
    string: (str) => {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) {
        ret = stringToUTF8OnStack(str);
      }
      return ret;
    },
    array: (arr) => {
      var ret = stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret;
    },
  };
  function convertReturnValue(ret) {
    if (returnType === "string") {
      return UTF8ToString(ret);
    }
    if (returnType === "boolean") return Boolean(ret);
    return ret;
  }
  var func = getCFunc(ident);
  var cArgs = [];
  var stack = 0;
  assert(returnType !== "array", 'Return type should not be "array".');
  if (args) {
    for (var i = 0; i < args.length; i++) {
      var converter = toC[argTypes[i]];
      if (converter) {
        if (stack === 0) stack = stackSave();
        cArgs[i] = converter(args[i]);
      } else {
        cArgs[i] = args[i];
      }
    }
  }
  var ret = func.apply(null, cArgs);
  function onDone(ret) {
    if (stack !== 0) stackRestore(stack);
    return convertReturnValue(ret);
  }
  ret = onDone(ret);
  return ret;
}
function cwrap(ident, returnType, argTypes, opts) {
  return function () {
    return ccall(ident, returnType, argTypes, arguments, opts);
  };
}
function uleb128Encode(n, target) {
  assert(n < 16384);
  if (n < 128) {
    target.push(n);
  } else {
    target.push(n % 128 | 128, n >> 7);
  }
}
function sigToWasmTypes(sig) {
  assert(
    !sig.includes("j"),
    "i64 not permitted in function signatures when WASM_BIGINT is disabled"
  );
  var typeNames = { i: "i32", j: "i64", f: "f32", d: "f64", p: "i32" };
  var type = {
    parameters: [],
    results: sig[0] == "v" ? [] : [typeNames[sig[0]]],
  };
  for (var i = 1; i < sig.length; ++i) {
    assert(sig[i] in typeNames, "invalid signature char: " + sig[i]);
    type.parameters.push(typeNames[sig[i]]);
  }
  return type;
}
function generateFuncType(sig, target) {
  var sigRet = sig.slice(0, 1);
  var sigParam = sig.slice(1);
  var typeCodes = { i: 127, p: 127, j: 126, f: 125, d: 124 };
  target.push(96);
  uleb128Encode(sigParam.length, target);
  for (var i = 0; i < sigParam.length; ++i) {
    assert(sigParam[i] in typeCodes, "invalid signature char: " + sigParam[i]);
    target.push(typeCodes[sigParam[i]]);
  }
  if (sigRet == "v") {
    target.push(0);
  } else {
    target.push(1, typeCodes[sigRet]);
  }
}
function convertJsFunctionToWasm(func, sig) {
  assert(
    !sig.includes("j"),
    "i64 not permitted in function signatures when WASM_BIGINT is disabled"
  );
  if (typeof WebAssembly.Function == "function") {
    return new WebAssembly.Function(sigToWasmTypes(sig), func);
  }
  var typeSectionBody = [1];
  generateFuncType(sig, typeSectionBody);
  var bytes = [0, 97, 115, 109, 1, 0, 0, 0, 1];
  uleb128Encode(typeSectionBody.length, bytes);
  bytes.push.apply(bytes, typeSectionBody);
  bytes.push(2, 7, 1, 1, 101, 1, 102, 0, 0, 7, 5, 1, 1, 102, 0, 0);
  var module = new WebAssembly.Module(new Uint8Array(bytes));
  var instance = new WebAssembly.Instance(module, { e: { f: func } });
  var wrappedFunc = instance.exports["f"];
  return wrappedFunc;
}
function updateTableMap(offset, count) {
  if (functionsInTableMap) {
    for (var i = offset; i < offset + count; i++) {
      var item = getWasmTableEntry(i);
      if (item) {
        functionsInTableMap.set(item, i);
      }
    }
  }
}
var functionsInTableMap = undefined;
function getFunctionAddress(func) {
  if (!functionsInTableMap) {
    functionsInTableMap = new WeakMap();
    updateTableMap(0, wasmTable.length);
  }
  return functionsInTableMap.get(func) || 0;
}
var freeTableIndexes = [];
function getEmptyTableSlot() {
  if (freeTableIndexes.length) {
    return freeTableIndexes.pop();
  }
  try {
    wasmTable.grow(1);
  } catch (err) {
    if (!(err instanceof RangeError)) {
      throw err;
    }
    throw "Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.";
  }
  return wasmTable.length - 1;
}
function setWasmTableEntry(idx, func) {
  wasmTable.set(idx, func);
  wasmTableMirror[idx] = wasmTable.get(idx);
}
function addFunction(func, sig) {
  assert(typeof func != "undefined");
  var rtn = getFunctionAddress(func);
  if (rtn) {
    return rtn;
  }
  for (var i = 0; i < wasmTable.length; i++) {
    assert(
      getWasmTableEntry(i) != func,
      "function in Table but not functionsInTableMap"
    );
  }
  var ret = getEmptyTableSlot();
  try {
    setWasmTableEntry(ret, func);
  } catch (err) {
    if (!(err instanceof TypeError)) {
      throw err;
    }
    assert(
      typeof sig != "undefined",
      "Missing signature argument to addFunction: " + func
    );
    var wrapped = convertJsFunctionToWasm(func, sig);
    setWasmTableEntry(ret, wrapped);
  }
  functionsInTableMap.set(func, ret);
  return ret;
}
function removeFunction(index) {
  functionsInTableMap.delete(getWasmTableEntry(index));
  freeTableIndexes.push(index);
}
InternalError = Module["InternalError"] = extendError(Error, "InternalError");
embind_init_charCodes();
BindingError = Module["BindingError"] = extendError(Error, "BindingError");
init_ClassHandle();
init_embind();
init_RegisteredPointer();
UnboundTypeError = Module["UnboundTypeError"] = extendError(
  Error,
  "UnboundTypeError"
);
init_emval();
Fetch.init();
function checkIncomingModuleAPI() {
  ignoredModuleProp("fetchSettings");
}
var wasmImports = {
  __assert_fail: ___assert_fail,
  __cxa_throw: ___cxa_throw,
  __dlsym: ___dlsym,
  __handle_stack_overflow: ___handle_stack_overflow,
  __syscall_faccessat: ___syscall_faccessat,
  __syscall_fcntl64: ___syscall_fcntl64,
  __syscall_fstat64: ___syscall_fstat64,
  __syscall_getcwd: ___syscall_getcwd,
  __syscall_getdents64: ___syscall_getdents64,
  __syscall_ioctl: ___syscall_ioctl,
  __syscall_lstat64: ___syscall_lstat64,
  __syscall_mkdirat: ___syscall_mkdirat,
  __syscall_newfstatat: ___syscall_newfstatat,
  __syscall_openat: ___syscall_openat,
  __syscall_readlinkat: ___syscall_readlinkat,
  __syscall_rmdir: ___syscall_rmdir,
  __syscall_stat64: ___syscall_stat64,
  __syscall_unlinkat: ___syscall_unlinkat,
  _embind_finalize_value_object: __embind_finalize_value_object,
  _embind_register_bigint: __embind_register_bigint,
  _embind_register_bool: __embind_register_bool,
  _embind_register_class: __embind_register_class,
  _embind_register_class_constructor: __embind_register_class_constructor,
  _embind_register_class_function: __embind_register_class_function,
  _embind_register_emval: __embind_register_emval,
  _embind_register_enum: __embind_register_enum,
  _embind_register_enum_value: __embind_register_enum_value,
  _embind_register_float: __embind_register_float,
  _embind_register_integer: __embind_register_integer,
  _embind_register_memory_view: __embind_register_memory_view,
  _embind_register_smart_ptr: __embind_register_smart_ptr,
  _embind_register_std_string: __embind_register_std_string,
  _embind_register_std_wstring: __embind_register_std_wstring,
  _embind_register_value_object: __embind_register_value_object,
  _embind_register_value_object_field: __embind_register_value_object_field,
  _embind_register_void: __embind_register_void,
  _emscripten_fetch_free: __emscripten_fetch_free,
  _emscripten_fetch_get_response_headers:
    __emscripten_fetch_get_response_headers,
  _emscripten_fetch_get_response_headers_length:
    __emscripten_fetch_get_response_headers_length,
  _emscripten_get_now_is_monotonic: __emscripten_get_now_is_monotonic,
  _emval_call: __emval_call,
  _emval_decref: __emval_decref,
  _emval_incref: __emval_incref,
  _emval_take_value: __emval_take_value,
  _gmtime_js: __gmtime_js,
  _localtime_js: __localtime_js,
  _mktime_js: __mktime_js,
  _mmap_js: __mmap_js,
  _munmap_js: __munmap_js,
  _tzset_js: __tzset_js,
  abort: _abort,
  dlopen: _dlopen,
  emscripten_asm_const_int: _emscripten_asm_const_int,
  emscripten_asm_const_int_sync_on_main_thread:
    _emscripten_asm_const_int_sync_on_main_thread,
  emscripten_asm_const_ptr: _emscripten_asm_const_ptr,
  emscripten_date_now: _emscripten_date_now,
  emscripten_get_heap_max: _emscripten_get_heap_max,
  emscripten_get_now: _emscripten_get_now,
  emscripten_is_main_browser_thread: _emscripten_is_main_browser_thread,
  emscripten_memcpy_big: _emscripten_memcpy_big,
  emscripten_resize_heap: _emscripten_resize_heap,
  emscripten_start_fetch: _emscripten_start_fetch,
  environ_get: _environ_get,
  environ_sizes_get: _environ_sizes_get,
  fd_close: _fd_close,
  fd_read: _fd_read,
  fd_seek: _fd_seek,
  fd_write: _fd_write,
  getentropy: _getentropy,
  strftime: _strftime,
  strftime_l: _strftime_l,
};
var asm = createWasm();
var ___wasm_call_ctors = createExportWrapper("__wasm_call_ctors");
var _malloc = (Module["_malloc"] = createExportWrapper("malloc"));
var _free = (Module["_free"] = createExportWrapper("free"));
var ___errno_location = createExportWrapper("__errno_location");
var _fflush = (Module["_fflush"] = createExportWrapper("fflush"));
var ___getTypeName = createExportWrapper("__getTypeName");
var __embind_initialize_bindings = (Module["__embind_initialize_bindings"] =
  createExportWrapper("_embind_initialize_bindings"));
var _emscripten_stack_init = function () {
  return (_emscripten_stack_init =
    Module["asm"]["emscripten_stack_init"]).apply(null, arguments);
};
var _emscripten_stack_get_free = function () {
  return (_emscripten_stack_get_free =
    Module["asm"]["emscripten_stack_get_free"]).apply(null, arguments);
};
var _emscripten_stack_get_base = function () {
  return (_emscripten_stack_get_base =
    Module["asm"]["emscripten_stack_get_base"]).apply(null, arguments);
};
var _emscripten_stack_get_end = function () {
  return (_emscripten_stack_get_end =
    Module["asm"]["emscripten_stack_get_end"]).apply(null, arguments);
};
var stackSave = createExportWrapper("stackSave");
var stackRestore = createExportWrapper("stackRestore");
var stackAlloc = createExportWrapper("stackAlloc");
var _emscripten_stack_get_current = function () {
  return (_emscripten_stack_get_current =
    Module["asm"]["emscripten_stack_get_current"]).apply(null, arguments);
};
var ___cxa_is_pointer_type = createExportWrapper("__cxa_is_pointer_type");
var ___set_stack_limits = (Module["___set_stack_limits"] =
  createExportWrapper("__set_stack_limits"));
var dynCall_jii = (Module["dynCall_jii"] = createExportWrapper("dynCall_jii"));
var dynCall_iiijii = (Module["dynCall_iiijii"] =
  createExportWrapper("dynCall_iiijii"));
var dynCall_iiijiii = (Module["dynCall_iiijiii"] =
  createExportWrapper("dynCall_iiijiii"));
var dynCall_ji = (Module["dynCall_ji"] = createExportWrapper("dynCall_ji"));
var dynCall_iij = (Module["dynCall_iij"] = createExportWrapper("dynCall_iij"));
var dynCall_iiijj = (Module["dynCall_iiijj"] =
  createExportWrapper("dynCall_iiijj"));
var dynCall_jiii = (Module["dynCall_jiii"] =
  createExportWrapper("dynCall_jiii"));
var dynCall_vij = (Module["dynCall_vij"] = createExportWrapper("dynCall_vij"));
var dynCall_jiiiii = (Module["dynCall_jiiiii"] =
  createExportWrapper("dynCall_jiiiii"));
var dynCall_jiji = (Module["dynCall_jiji"] =
  createExportWrapper("dynCall_jiji"));
var dynCall_viijii = (Module["dynCall_viijii"] =
  createExportWrapper("dynCall_viijii"));
var dynCall_iiiiij = (Module["dynCall_iiiiij"] =
  createExportWrapper("dynCall_iiiiij"));
var dynCall_iiiiijj = (Module["dynCall_iiiiijj"] =
  createExportWrapper("dynCall_iiiiijj"));
var dynCall_iiiiiijj = (Module["dynCall_iiiiiijj"] =
  createExportWrapper("dynCall_iiiiiijj"));
var dynCall_viiijii = (Module["dynCall_viiijii"] =
  createExportWrapper("dynCall_viiijii"));
var dynCall_viijiiiiiiiii = (Module["dynCall_viijiiiiiiiii"] =
  createExportWrapper("dynCall_viijiiiiiiiii"));
var dynCall_viiij = (Module["dynCall_viiij"] =
  createExportWrapper("dynCall_viiij"));
var dynCall_iiij = (Module["dynCall_iiij"] =
  createExportWrapper("dynCall_iiij"));
Module["ccall"] = ccall;
Module["cwrap"] = cwrap;
Module["addFunction"] = addFunction;
Module["removeFunction"] = removeFunction;
Module["setValue"] = setValue;
Module["getValue"] = getValue;
var missingLibrarySymbols = [
  "zeroMemory",
  "emscripten_realloc_buffer",
  "inetPton4",
  "inetNtop4",
  "inetPton6",
  "inetNtop6",
  "readSockaddr",
  "writeSockaddr",
  "getHostByName",
  "traverseStack",
  "getCallstack",
  "emscriptenLog",
  "convertPCtoSourceLocation",
  "jstoi_q",
  "jstoi_s",
  "listenOnce",
  "autoResumeAudioContext",
  "runtimeKeepalivePush",
  "runtimeKeepalivePop",
  "safeSetTimeout",
  "asmjsMangle",
  "asyncLoad",
  "alignMemory",
  "mmapAlloc",
  "getNativeTypeSize",
  "STACK_SIZE",
  "STACK_ALIGN",
  "POINTER_SIZE",
  "ASSERTIONS",
  "writeI53ToI64Clamped",
  "writeI53ToI64Signaling",
  "writeI53ToU64Clamped",
  "writeI53ToU64Signaling",
  "convertI32PairToI53",
  "convertU32PairToI53",
  "reallyNegative",
  "unSign",
  "strLen",
  "reSign",
  "formatString",
  "intArrayToString",
  "AsciiToString",
  "registerKeyEventCallback",
  "maybeCStringToJsString",
  "findEventTarget",
  "findCanvasEventTarget",
  "getBoundingClientRect",
  "fillMouseEventData",
  "registerMouseEventCallback",
  "registerWheelEventCallback",
  "registerUiEventCallback",
  "registerFocusEventCallback",
  "fillDeviceOrientationEventData",
  "registerDeviceOrientationEventCallback",
  "fillDeviceMotionEventData",
  "registerDeviceMotionEventCallback",
  "screenOrientation",
  "fillOrientationChangeEventData",
  "registerOrientationChangeEventCallback",
  "fillFullscreenChangeEventData",
  "registerFullscreenChangeEventCallback",
  "JSEvents_requestFullscreen",
  "JSEvents_resizeCanvasForFullscreen",
  "registerRestoreOldStyle",
  "hideEverythingExceptGivenElement",
  "restoreHiddenElements",
  "setLetterbox",
  "softFullscreenResizeWebGLRenderTarget",
  "doRequestFullscreen",
  "fillPointerlockChangeEventData",
  "registerPointerlockChangeEventCallback",
  "registerPointerlockErrorEventCallback",
  "requestPointerLock",
  "fillVisibilityChangeEventData",
  "registerVisibilityChangeEventCallback",
  "registerTouchEventCallback",
  "fillGamepadEventData",
  "registerGamepadEventCallback",
  "registerBeforeUnloadEventCallback",
  "fillBatteryEventData",
  "battery",
  "registerBatteryEventCallback",
  "setCanvasElementSize",
  "getCanvasElementSize",
  "demangle",
  "demangleAll",
  "jsStackTrace",
  "stackTrace",
  "checkWasiClock",
  "wasiRightsToMuslOFlags",
  "wasiOFlagsToMuslOFlags",
  "createDyncallWrapper",
  "setImmediateWrapped",
  "clearImmediateWrapped",
  "polyfillSetImmediate",
  "getPromise",
  "makePromise",
  "idsToPromises",
  "makePromiseCallback",
  "setMainLoop",
  "getSocketFromFD",
  "getSocketAddress",
  "heapObjectForWebGLType",
  "heapAccessShiftForWebGLHeap",
  "webgl_enable_ANGLE_instanced_arrays",
  "webgl_enable_OES_vertex_array_object",
  "webgl_enable_WEBGL_draw_buffers",
  "webgl_enable_WEBGL_multi_draw",
  "emscriptenWebGLGet",
  "computeUnpackAlignedImageSize",
  "colorChannelsInGlTextureFormat",
  "emscriptenWebGLGetTexPixelData",
  "__glGenObject",
  "emscriptenWebGLGetUniform",
  "webglGetUniformLocation",
  "webglPrepareUniformLocationsBeforeFirstUse",
  "webglGetLeftBracePos",
  "emscriptenWebGLGetVertexAttrib",
  "__glGetActiveAttribOrUniform",
  "writeGLArray",
  "registerWebGlEventCallback",
  "runAndAbortIfError",
  "SDL_unicode",
  "SDL_ttfContext",
  "SDL_audio",
  "GLFW_Window",
  "ALLOC_NORMAL",
  "ALLOC_STACK",
  "allocate",
  "writeStringToMemory",
  "writeAsciiToMemory",
  "registerInheritedInstance",
  "unregisterInheritedInstance",
  "validateThis",
  "getStringOrSymbol",
  "craftEmvalAllocator",
  "emval_get_global",
  "emval_allocateDestructors",
  "emval_addMethodCaller",
];
missingLibrarySymbols.forEach(missingLibrarySymbol);
var unexportedSymbols = [
  "run",
  "addOnPreRun",
  "addOnInit",
  "addOnPreMain",
  "addOnExit",
  "addOnPostRun",
  "addRunDependency",
  "removeRunDependency",
  "FS_createFolder",
  "FS_createPath",
  "FS_createDataFile",
  "FS_createLazyFile",
  "FS_createLink",
  "FS_createDevice",
  "FS_unlink",
  "out",
  "err",
  "callMain",
  "abort",
  "keepRuntimeAlive",
  "wasmMemory",
  "stackAlloc",
  "stackSave",
  "stackRestore",
  "getTempRet0",
  "setTempRet0",
  "writeStackCookie",
  "checkStackCookie",
  "ptrToString",
  "exitJS",
  "getHeapMax",
  "abortOnCannotGrowMemory",
  "ENV",
  "setStackLimits",
  "MONTH_DAYS_REGULAR",
  "MONTH_DAYS_LEAP",
  "MONTH_DAYS_REGULAR_CUMULATIVE",
  "MONTH_DAYS_LEAP_CUMULATIVE",
  "isLeapYear",
  "ydayFromDate",
  "arraySum",
  "addDays",
  "ERRNO_CODES",
  "ERRNO_MESSAGES",
  "setErrNo",
  "DNS",
  "Protocols",
  "Sockets",
  "initRandomFill",
  "randomFill",
  "timers",
  "warnOnce",
  "UNWIND_CACHE",
  "readEmAsmArgsArray",
  "readEmAsmArgs",
  "runEmAsmFunction",
  "runMainThreadEmAsm",
  "getExecutableName",
  "dynCallLegacy",
  "getDynCaller",
  "dynCall",
  "handleException",
  "callUserCallback",
  "maybeExit",
  "HandleAllocator",
  "writeI53ToI64",
  "readI53FromI64",
  "readI53FromU64",
  "convertI32PairToI53Checked",
  "getCFunc",
  "uleb128Encode",
  "sigToWasmTypes",
  "generateFuncType",
  "convertJsFunctionToWasm",
  "freeTableIndexes",
  "functionsInTableMap",
  "getEmptyTableSlot",
  "updateTableMap",
  "getFunctionAddress",
  "PATH",
  "PATH_FS",
  "UTF8Decoder",
  "UTF8ArrayToString",
  "UTF8ToString",
  "stringToUTF8Array",
  "stringToUTF8",
  "lengthBytesUTF8",
  "intArrayFromString",
  "stringToAscii",
  "UTF16Decoder",
  "UTF16ToString",
  "stringToUTF16",
  "lengthBytesUTF16",
  "UTF32ToString",
  "stringToUTF32",
  "lengthBytesUTF32",
  "stringToNewUTF8",
  "stringToUTF8OnStack",
  "writeArrayToMemory",
  "JSEvents",
  "specialHTMLTargets",
  "currentFullscreenStrategy",
  "restoreOldWindowedStyle",
  "ExitStatus",
  "getEnvStrings",
  "flush_NO_FILESYSTEM",
  "dlopenMissingError",
  "promiseMap",
  "uncaughtExceptionCount",
  "exceptionLast",
  "exceptionCaught",
  "ExceptionInfo",
  "Browser",
  "wget",
  "SYSCALLS",
  "tempFixedLengthArray",
  "miniTempWebGLFloatBuffers",
  "miniTempWebGLIntBuffers",
  "GL",
  "emscripten_webgl_power_preferences",
  "AL",
  "GLUT",
  "EGL",
  "GLEW",
  "IDBStore",
  "SDL",
  "SDL_gfx",
  "GLFW",
  "allocateUTF8",
  "allocateUTF8OnStack",
  "Fetch",
  "fetchDeleteCachedData",
  "fetchLoadCachedData",
  "fetchCacheData",
  "fetchXHR",
  "InternalError",
  "BindingError",
  "UnboundTypeError",
  "PureVirtualError",
  "init_embind",
  "throwInternalError",
  "throwBindingError",
  "throwUnboundTypeError",
  "ensureOverloadTable",
  "exposePublicSymbol",
  "replacePublicSymbol",
  "extendError",
  "createNamedFunction",
  "embindRepr",
  "registeredInstances",
  "getBasestPointer",
  "getInheritedInstance",
  "getInheritedInstanceCount",
  "getLiveInheritedInstances",
  "registeredTypes",
  "awaitingDependencies",
  "typeDependencies",
  "registeredPointers",
  "registerType",
  "whenDependentTypesAreResolved",
  "embind_charCodes",
  "embind_init_charCodes",
  "readLatin1String",
  "getTypeName",
  "heap32VectorToArray",
  "requireRegisteredType",
  "getShiftFromSize",
  "integerReadValueFromPointer",
  "enumReadValueFromPointer",
  "floatReadValueFromPointer",
  "simpleReadValueFromPointer",
  "runDestructors",
  "newFunc",
  "craftInvokerFunction",
  "embind__requireFunction",
  "tupleRegistrations",
  "structRegistrations",
  "genericPointerToWireType",
  "constNoSmartPtrRawPointerToWireType",
  "nonConstNoSmartPtrRawPointerToWireType",
  "init_RegisteredPointer",
  "RegisteredPointer",
  "RegisteredPointer_getPointee",
  "RegisteredPointer_destructor",
  "RegisteredPointer_deleteObject",
  "RegisteredPointer_fromWireType",
  "runDestructor",
  "releaseClassHandle",
  "finalizationRegistry",
  "detachFinalizer_deps",
  "detachFinalizer",
  "attachFinalizer",
  "makeClassHandle",
  "init_ClassHandle",
  "ClassHandle",
  "ClassHandle_isAliasOf",
  "throwInstanceAlreadyDeleted",
  "ClassHandle_clone",
  "ClassHandle_delete",
  "deletionQueue",
  "ClassHandle_isDeleted",
  "ClassHandle_deleteLater",
  "flushPendingDeletes",
  "delayFunction",
  "setDelayFunction",
  "RegisteredClass",
  "shallowCopyInternalPointer",
  "downcastPointer",
  "upcastPointer",
  "char_0",
  "char_9",
  "makeLegalFunctionName",
  "emval_handles",
  "emval_symbols",
  "init_emval",
  "count_emval_handles",
  "Emval",
  "emval_newers",
  "emval_lookupTypes",
  "emval_methodCallers",
  "emval_registeredMethods",
];
unexportedSymbols.forEach(unexportedRuntimeSymbol);
var calledRun;
dependenciesFulfilled = function runCaller() {
  if (!calledRun) run();
  if (!calledRun) dependenciesFulfilled = runCaller;
};
function stackCheckInit() {
  _emscripten_stack_init();
  writeStackCookie();
}
function run() {
  if (runDependencies > 0) {
    return;
  }
  stackCheckInit();
  preRun();
  if (runDependencies > 0) {
    return;
  }
  function doRun() {
    if (calledRun) return;
    calledRun = true;
    Module["calledRun"] = true;
    if (ABORT) return;
    initRuntime();
    if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
    assert(
      !Module["_main"],
      'compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]'
    );
    postRun();
  }
  if (Module["setStatus"]) {
    Module["setStatus"]("Running...");
    setTimeout(function () {
      setTimeout(function () {
        Module["setStatus"]("");
      }, 1);
      doRun();
    }, 1);
  } else {
    doRun();
  }
  checkStackCookie();
}
function checkUnflushedContent() {
  var oldOut = out;
  var oldErr = err;
  var has = false;
  out = err = (x) => {
    has = true;
  };
  try {
    flush_NO_FILESYSTEM();
  } catch (e) {}
  out = oldOut;
  err = oldErr;
  if (has) {
    warnOnce(
      "stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the FAQ), or make sure to emit a newline when you printf etc."
    );
    warnOnce(
      "(this may also be due to not including full filesystem support - try building with -sFORCE_FILESYSTEM)"
    );
  }
}
if (Module["preInit"]) {
  if (typeof Module["preInit"] == "function")
    Module["preInit"] = [Module["preInit"]];
  while (Module["preInit"].length > 0) {
    Module["preInit"].pop()();
  }
}
run();
