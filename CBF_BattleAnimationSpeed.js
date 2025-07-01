//=============================================================================
// CBF_BattleAnimationSpeed.js
// ----------------------------------------------------------------------------
//  Versão: 1.1.0  (2025‑07‑01)
//  Autor:  Comunidade Open‑Helpers  |  Licença: MIT
// ----------------------------------------------------------------------------
// Descrição:
//   • Replica (de forma independente) a funcionalidade do plugin pago
//     YEP_BattleAniSpeedOpt, permitindo ao jogador escolher a velocidade
//     das animações de batalha através do menu de Opções.
//   • Compatível tanto com o Options Core do Yanfly (caso esteja presente)
//     quanto com o menu Window_Options padrão do RPG Maker MV.
//   • Não requer nenhum outro plugin [mais ou menos] – apenas insira‑o na lista de plugins.
//
//
//=============================================================================
/*:
 * @plugindesc v1.1.0  –  Allow players to set battle‑animation speed (free alternative to YEP_BattleAniSpeedOpt).
 * @author Open‑Helpers
 * @help
 * ----------------------------------------------------------------------------
 *  Mapeamento de velocidades
 *  -------------------------
 *    1  →  Muito rápido   (1 frame de animação a cada 1 frame real)
 *    2  →  Rápido         (1/2)
 *    3  →  Normal+        (1/3)
 *    4  →  Padrão MV      (1/4)  ← valor padrão do motor
 *
 *  Alterar a opção durante a batalha afeta apenas novas animações criadas a
 *  partir da mudança (assim como no plugin original).
 *
 * ----------------------------------------------------------------------------
 * @plugindesc v1.1.0  –  Allow players to set battle-animation speed (free alternative to YEP_BattleAniSpeedOpt).
 * @author Open‑Helpers
 *
 * @param ---General---
 *
 * @param Option Name
 * @desc The option command text used in-game.
 * @default Battle Animation Speed
 *
 * @param Default Speed
 * @type number
 * @min 1
 * @max 4
 * @desc Default animation speed (1 = fastest, 4 = default).
 * @default 4
 *
 * @param Affect Movement?
 * @type boolean
 * @on YES
 * @off NO
 * @desc Also affect movement animation speed?
 * @default true
 *
 * @param Affect Waiting?
 * @type boolean
 * @on YES
 * @off NO
 * @desc Also reduce wait times for animations/events?
 * @default true
 *
 * @param ---Vocabulary---
 *
 * @param Speed 1
 * @desc Text shown for speed 1.
 * @default »»»
 *
 * @param Speed 2
 * @desc Text shown for speed 2.
 * @default »»
 *
 * @param Speed 3
 * @desc Text shown for speed 3.
 * @default »
 *
 * @param Speed 4
 * @desc Text shown for speed 4.
 * @default ×
 */
(function() {
  "use strict";
  //===========================================================================================================
    // Constants
  //===========================================================================================================
  /*-------------------------------------------Default Values-------------------------------------------*/
  const 𝕺𝖕𝖙𝖎𝖔𝖓_𝕹𝖆𝖒𝖊    = "Battle Speed"
  const 𝕬𝖋𝖋𝖊𝖈𝖙_𝕸𝖔𝖛𝖊𝖒𝖊𝖓𝖙 = true
  const 𝕬𝖋𝖋𝖊𝖈𝖙_𝖂𝖆𝖎𝖙𝖎𝖓𝖌   = true
  const 𝕯𝖊𝖋𝖆𝖚𝖑𝖙_𝕽𝖆𝖙𝖊     = 4

  const 𝕾𝖕𝖊𝖊𝖉 = [
    null,
    "»»»",
    "»»",
    "»",
    "×",
  ]

  const 𝖘𝖞𝖒𝖇𝖔𝖑 = "battleAniSpeed"

  /*-------------------------------------------Parameters-------------------------------------------*/
  const 𝖕𝖆𝖗𝖆𝖒   = PluginManager.parameters("CBF_BattleAnimationSpeed");


  const NAME       = String(𝖕𝖆𝖗𝖆𝖒["Option Name"     ])             || 𝕺𝖕𝖙𝖎𝖔𝖓_𝕹𝖆𝖒𝖊
  const MOVEMENT   = eval(  𝖕𝖆𝖗𝖆𝖒["Affect Movement?"])             || 𝕬𝖋𝖋𝖊𝖈𝖙_𝕸𝖔𝖛𝖊𝖒𝖊𝖓𝖙
  const WAITING    = eval(  𝖕𝖆𝖗𝖆𝖒["Affect Waiting?" ])             || 𝕬𝖋𝖋𝖊𝖈𝖙_𝖂𝖆𝖎𝖙𝖎𝖓𝖌
  const RATE       = Number( 𝖕𝖆𝖗𝖆𝖒["Default Speed"  ]).clamp(1, 4) || 𝕯𝖊𝖋𝖆𝖚𝖑𝖙_𝕽𝖆𝖙𝖊

  const Speed = [
    "null",
    String(𝖕𝖆𝖗𝖆𝖒["Speed 1"]) || 𝕾𝖕𝖊𝖊𝖉[1],
    String(𝖕𝖆𝖗𝖆𝖒["Speed 2"]) || 𝕾𝖕𝖊𝖊𝖉[2],
    String(𝖕𝖆𝖗𝖆𝖒["Speed 3"]) || 𝕾𝖕𝖊𝖊𝖉[3],
    String(𝖕𝖆𝖗𝖆𝖒["Speed 4"]) || 𝕾𝖕𝖊𝖊𝖉[4],
  ]


  const USING_YEP_OPTIONS_CORE = (typeof Imported !== 'undefined' && Imported.YEP_OptionsCore);

  //===========================================================================================================
    // Code
  //===========================================================================================================

  //===========================================================================================================
    // Movement
  //===========================================================================================================
  if (MOVEMENT) {
    const startMove = Sprite_Battler.prototype.startMove;
    Sprite_Battler.prototype.startMove = function (x, y, duration) {
      duration = (duration / (5 - ConfigManager.battleAniSpeed));
      startMove.call(this, x, y, duration);
    };
  }

  //===========================================================================================================
    // WAITING
  //===========================================================================================================
  if (WAITING) {
    //This function is from Yanfly's plugin, and aren't a native function..........
    //I don't even know if its right and its functional, I will just let this here than done.
    //I searched too much in the native's file just for finding nothing.
  const BattleManager_actionWait = BattleManager.actionWait
  BattleManager.actionWait = function(frames) {
      frames = (frames / (5 - ConfigManager.battleAniSpeed));
      BattleManager_actionWait.call(this, frames)
  };
  }
  //===========================================================================================================
    // Generated
  //===========================================================================================================
  // ConfigManager – nova chave --------------------------
  const _CM_makeData = ConfigManager.makeData;
  ConfigManager.makeData = function() {
    const config = _CM_makeData.call(this);
    config.battleAniSpeed = this.battleAniSpeed;
    return config;
  };

  const _CM_applyData = ConfigManager.applyData;
  ConfigManager.applyData = function(config) {
    _CM_applyData.call(this, config);
    this.battleAniSpeed = this.readBattleAniSpeed(config, 𝖘𝖞𝖒𝖇𝖔𝖑);
  };

  ConfigManager.readBattleAniSpeed = function(config, name) {
    const value = config[name];
    if (value !== undefined) {
      return Number(value).clamp(1, 4);
    } else {
      return RATE;
    }
  };

  ConfigManager.battleAniSpeed = ConfigManager.battleAniSpeed || RATE;

  // Sprite_Animation – usa ConfigManager ----------------
  const _SA_setupRate = Sprite_Animation.prototype.setupRate;
  Sprite_Animation.prototype.setupRate = function() {
    if (ConfigManager && ConfigManager.battleAniSpeed) {
      this._rate = ConfigManager.battleAniSpeed;
    } else {
      _SA_setupRate.call(this);
    }
  };

  // Helper: texto visual --------------------------------
  Window_Base.prototype.battleAnimationSpeedText = function(value) {
    switch (Number(value)) {
      case 1:  return Speed[1];  // »»»
      case 2:  return Speed[2];  // »»
      case 3:  return Speed[3];  // »
      default: return Speed[4];  // ×
    }
  };

  // Integração com menu padrão (somente se NÃO usar OptionsCore)
  //-------------------------------------------------------------
  if (!USING_YEP_OPTIONS_CORE) {
    let addedToOptions = false;

    function insertOptionCommand(win) {
      if (addedToOptions) return;
      win.addCommand(NAME, 𝖘𝖞𝖒𝖇𝖔𝖑);
      addedToOptions = true;
    }

    // --- Criação da lista -----------------------------------
    const _WO_makeCommandList = Window_Options.prototype.makeCommandList;
    Window_Options.prototype.makeCommandList = function() {
      _WO_makeCommandList.call(this);
      insertOptionCommand(this);
    };

    // --- StatusText -----------------------------------------
    const _WO_statusText = Window_Options.prototype.statusText;
    Window_Options.prototype.statusText = function(index) {
      const symbol = this.commandSymbol(index);
      if (symbol === 𝖘𝖞𝖒𝖇𝖔𝖑) {
        return this.battleAnimationSpeedText(this.getConfigValue(symbol));
      }
      return _WO_statusText.call(this, index);
    };

    // --- Manipulação de valor ------------------------------
    function cycle(value, delta) {
      let v = value + delta;
      if (v < 1) v = 4;
      if (v > 4) v = 1;
      return v;
    }

    const _WO_processOk = Window_Options.prototype.processOk;
    Window_Options.prototype.processOk = function() {
      const symbol = this.commandSymbol(this.index());
      if (symbol === 𝖘𝖞𝖒𝖇𝖔𝖑) {
        const value = cycle(this.getConfigValue(symbol), -1);
        this.changeValue(symbol, value);
      } else {
        _WO_processOk.call(this);
      }
    };

    const _WO_cursorRight = Window_Options.prototype.cursorRight;
    Window_Options.prototype.cursorRight = function(wrap) {
      const symbol = this.commandSymbol(this.index());
      if (symbol === 𝖘𝖞𝖒𝖇𝖔𝖑) {
        const value = cycle(this.getConfigValue(symbol), -1);
        this.changeValue(symbol, value);
      } else {
        _WO_cursorRight.call(this, wrap);
      }
    };

    const _WO_cursorLeft = Window_Options.prototype.cursorLeft;
    Window_Options.prototype.cursorLeft = function(wrap) {
      const symbol = this.commandSymbol(this.index());
      if (symbol === 𝖘𝖞𝖒𝖇𝖔𝖑) {
        const value = cycle(this.getConfigValue(symbol), +1);
        this.changeValue(symbol, value);
      } else {
        _WO_cursorLeft.call(this, wrap);
      }
    };
  }

})();
