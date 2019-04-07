const _ = require('@keyring/util');

const Script = require('./script');

class Input {
  get _chain() { return false; }
  get _scriptClass() { return Script; }

  constructor(raw={}, subscript, amount) {
    if (_.r.is(Input, raw)) { raw = raw.buf; }
    if (_.r.is(Buffer, raw) || typeof raw === 'string') {
      return new _.Parser(Input).parse(raw);
    }

    this.raw = raw;
    this.raw.amount = amount;
    this.raw.subscript = subscript;

    if (!_.r.isNil(subscript)) { this.subscript = new this._scriptClass(subscript); }
    if (!_.r.isNil(amount)) { this.amount = new _.bn(amount); }

    this.txid = this.raw.txid;
    this.index = this.raw.index;
    this.script = new this._scriptClass(this.raw.script);

    return this;
  }

  get sequence() { return _.r.isNil(this.raw.sequence) ? 0xffffffff : this.raw.sequence; }
  get complete() { return !_.r.isNil(this.subscript) && !_.r.isNil(this.amount); }

  get buf() {
    return new _.Writer()
      .reverse(this.txid)
      .uint32le(this.index)
      .vardata(this.script.buf)
      .uint32le(this.sequence)
      .buf;
  }

  get hex() { return this.buf.toString('hex'); }

  get source() { return _.r.isNil(this.subscript) ? [] : this.subscript.destination; }

  blank() { this.script = new this._scriptClass(); }

  static template() {
    return [
      ['txid', 'reverse:32'],
      ['index', 'uint32le'],
      ['script', 'vardata'],
      ['sequence', 'uint32le']
    ];
  }

  static for(chain) {
    const ScriptClass = Script.for(chain.templates('input'));

    class InputClass extends Input {
      get _chain() { return chain; }
      get _scriptClass() { return ScriptClass; }
    }

    InputClass.chain = chain;
    InputClass.Script = ScriptClass;

    return InputClass;
  }
}

Input.chain = false;
Input.Script = Script;

module.exports = Input;