/*:
 * @target MV
 * @plugindesc Name Input+: hybrid keyboard/grid name entry.
 * @author Charlie's Boyfriend
 *
 * @help
 * ────────────────────────────────────────────────────────────────────────────
 *  This plugin allows players to enter character names freely using the
 *  physical keyboard (**Keyboard Mode**) or switch to a classic character
 *  grid (**Grid Mode**, similar to Pokémon) using the arrow keys.
 *
 *  » Default Controls
 *     • Keyboard Mode:  [ENTER] to confirm | [BACKSPACE] to delete | Arrow keys/←↑↓→ to switch to grid
 *     • Grid Mode:      Use arrow keys to select | [ESC] to return to keyboard
 *
 *  » Parameters
 *     • KeyboardMsg   : Help message shown in keyboard mode (supports control codes)
 *     • QwertyLayout  : Reorder LATIN1 characters into QWERTY layout?
 *     • StartMode     : Choose default input mode: "keyboard" or "grid"
 *     • RememberMode  : Remembers the last used mode (persists across saves)
 *
 *  No plugin commands. 100% plug-and-play.
 * ────────────────────────────────────────────────────────────────────────────
 *  Changelog
 * ────────────────────────────────────────────────────────────────────────────
 *  • v1.00 - Initial stable release
 *
 * @param KeyboardMsg
 * @text Keyboard Help Message
 * @type note
 * @desc Message displayed during keyboard mode. Supports \C[n], etc.
 * @default "Type in this character's name.\nPress \\c[6]ENTER\\c[0] when you're done.\n\n-or-\n\nPress the \\c[6]arrow keys\\c[0] to switch\nto manual character entry.\nPress \\c[6]ESC\\c[0] to use the keyboard."
 *
 * @param QwertyLayout
 * @text QWERTY Layout
 * @type boolean
 * @on  YES
 * @off NO
 * @desc Reorder LATIN1 characters into a QWERTY layout?
 * @default false
 *
 * @param StartMode
 * @text Starting Mode
 * @type select
 * @option Keyboard
 * @value keyboard
 * @option Grid
 * @value grid
 * @desc Which mode should the name input scene start with?
 * @default keyboard
 *
 * @param RememberMode
 * @text Remember Last Mode
 * @type boolean
 * @on  YES
 * @off NO
 * @desc If enabled, remembers the last used input mode across saves.
 * @default false
 *
 */


(function() {

    //Default Values
    const KeyboardMsg  = "Type in this character's name.\nPress \\c[6]ENTER\\c[0] when you're done.\n\n-or-\n\nPress the \\c[6]arrow keys\\c[0] to switch\nto manual character entry.\nPress \\c[6]ESC\\c[0] to use the keyboard."
    const QwertyLayout = false
    const StartMode    = "keyboard"
    const RememberMode = false

  "use strict";

  const PLUGIN_NAME = "CBF_NameInput+";
  const PARAMS      = PluginManager.parameters(PLUGIN_NAME);

    function paramEval(key, def) {
        const raw = PARAMS.hasOwnProperty(key) ? PARAMS[key] : "";
        try {
            const wrapped = /^\s*['"]/.test(raw) ? raw : `"${raw}"`;
            return new Function("return (" + wrapped + ")")();
        } catch (e) {
            console.warn(`[FreeKeyNameEntry] Erro ao interpretar parâmetro "${key}":`, e);
            return def;
        }
    }

  function splitLines(text) {
      return text.replace(/\\n/g, "\n").split(/\n/);
  }

  const DEFAULT_LATIN1 = Window_NameInput.LATIN1.slice();

  const QWERTY_LATIN1 = [
      'Q','W','E','R','T',  'Y','U','I','O','P',
      'A','S','D','F','G',  'H','J','K','L','"',
      '`','Z','X','C','V',  'B','N','M',',','.',
      'q','w','e','r','t',  'y','u','i','o','p',
      'a','s','d','f','g',  'h','j','k','l',':',
      '~','z','x','c','v',  'b','n','m','"',';',
      '1','2','3','4','5',  '6','7','8','9','0',
      '!','@','#','$','%',  '^','&','*','(',')',
      '<','>','[',']','-',  '_','/',' ','Page','OK'
  ];

  function applyQwerty(active) {
      if (active) {
          Window_NameInput.LATIN1 = QWERTY_LATIN1.slice();
      } else {
          Window_NameInput.LATIN1 = DEFAULT_LATIN1.slice();
      }
  }

  function Window_KeyNameFree() {
      this.initialize.apply(this, arguments);
  }
  Window_KeyNameFree.prototype = Object.create(Window_Base.prototype);
  Window_KeyNameFree.prototype.constructor = Window_KeyNameFree;

  Window_KeyNameFree.prototype.initialize = function(editWindow, baseWindow) {
      const x = editWindow.x;
      const y = editWindow.y + editWindow.height + 8;
      const w = editWindow.width;
      const h = baseWindow.height;
      Window_Base.prototype.initialize.call(this, x, y, w, h);
      this._editWindow = editWindow;
      this._listening  = false;
      this.refresh();
  };

    Window_KeyNameFree.prototype.refresh = function() {
        this.contents.clear();
        const msg = String(paramEval("KeyboardMsg", KeyboardMsg));
        const lines = splitLines(msg);
        const totalHeight = lines.length * this.lineHeight();
        let y = Math.floor((this.contents.height - totalHeight) / 2);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const width = this.textWidthEx(line);
            const x = Math.floor((this.contents.width - width) / 2);
            this.drawTextEx(line, x, y);
            y += this.lineHeight();
        }
    };

  Window_KeyNameFree.prototype.startListening = function() {
      if (this._listening) return;
      this._handler = this.onKeyDown.bind(this);
      document.addEventListener("keydown", this._handler);
      this._listening = true;
      this.activate();
  };

  Window_KeyNameFree.prototype.stopListening = function() {
      if (!this._listening) return;
      document.removeEventListener("keydown", this._handler);
      this._listening = false;
      this.deactivate();
  };

  Window_KeyNameFree.prototype.onKeyDown = function(e) {
      if (e.key === "Escape" || e.key.startsWith("Arrow")) {
          this.callModeChange("grid");
          e.preventDefault();
          return;
      }
      if (e.key === "Enter") {
          this.callOkHandler();
          e.preventDefault();
          return;
      }
      if (e.key === "Backspace") {
          if (this._editWindow.back()) SoundManager.playCancel();
          e.preventDefault();
          return;
      }
      if (e.key.length === 1) {
          if (this._editWindow.add(e.key)) {
              SoundManager.playOk();
          } else {
              SoundManager.playBuzzer();
          }
          e.preventDefault();
      }
  };

  Window_KeyNameFree.prototype.setHandler = function(symbol, method) {
      this._handlers = this._handlers || {};
      this._handlers[symbol] = method;
  };
  Window_KeyNameFree.prototype.callOkHandler = function() {
      if (this._handlers && this._handlers["ok"]) this._handlers["ok"]();
  };
  Window_KeyNameFree.prototype.callModeChange = function(mode) {
      if (this._handlers && this._handlers["modechange"]) this._handlers["modechange"](mode);
  };

  const _Scene_Name_initialize = Scene_Name.prototype.initialize;
  Scene_Name.prototype.initialize = function() {
      _Scene_Name_initialize.call(this);
      this._keyboardMode = true;
  };

  const _Scene_Name_createInputWindow = Scene_Name.prototype.createInputWindow;
  Scene_Name.prototype.createInputWindow = function() {
      applyQwerty(paramEval("QwertyLayout", QwertyLayout));

      _Scene_Name_createInputWindow.call(this);
      this._gridWindow = this._inputWindow;
      this._freeWindow = new Window_KeyNameFree(this._editWindow, this._gridWindow);
      this.addWindow(this._freeWindow);

      this._gridWindow.setHandler("ok",  this.onInputOk.bind(this));
      this._freeWindow.setHandler("ok",  this.onInputOk.bind(this));
      this._freeWindow.setHandler("modechange", this.switchToGrid.bind(this));

      const remember = paramEval("RememberMode", RememberMode);
      const stored   = $gameSystem.CB_NameInput_LastMode;
      const start    = remember && stored ? stored
                                          : String(paramEval("StartMode", StartMode)).toLowerCase();

      if (start === "grid") this.switchToGrid();
      else                   this.switchToFree();
  };

  const _Scene_Name_update = Scene_Name.prototype.update;
  Scene_Name.prototype.update = function() {
      _Scene_Name_update.call(this);
      if (this._keyboardMode) {
          if (Input.isTriggered("left") || Input.isTriggered("right") ||
              Input.isTriggered("up")   || Input.isTriggered("down")) {
              this.switchToGrid();
              SoundManager.playCursor();
          }
      } else {
          if (Input.isTriggered("escape")) {
              this.switchToFree();
              SoundManager.playCursor();
          }
      }
  };

  Scene_Name.prototype.switchToFree = function() {
      this._keyboardMode = true;
      this._gridWindow.deactivate();
      this._gridWindow.hide();
      this._freeWindow.show();
      this._freeWindow.startListening();
      if (paramEval("RememberMode", RememberMode)) $gameSystem.CB_NameInput_LastMode = "keyboard";
  };

  Scene_Name.prototype.switchToGrid = function() {
      this._keyboardMode = false;
      this._freeWindow.stopListening();
      this._freeWindow.hide();
      this._gridWindow.show();
      this._gridWindow.activate();
      if (paramEval("RememberMode", RememberMode)) $gameSystem.CB_NameInput_LastMode = "grid";
  };

  const _Scene_Name_terminate = Scene_Name.prototype.terminate;
  Scene_Name.prototype.terminate = function() {
      if (this._freeWindow) this._freeWindow.stopListening();
      _Scene_Name_terminate.call(this);
  };

  const _Scene_Name_onInputOk = Scene_Name.prototype.onInputOk;
  Scene_Name.prototype.onInputOk = function() {
      if (this._inputProcessed) return;
      this._inputProcessed = true;
      if (this._freeWindow) this._freeWindow.stopListening();
      _Scene_Name_onInputOk.call(this);
  };

  const _Window_NameInput_processOk = Window_NameInput.prototype.processOk;
  Window_NameInput.prototype.processOk = function() {
      if (SceneManager._scene && SceneManager._scene._keyboardMode) return;
      _Window_NameInput_processOk.call(this);
  };

})();
