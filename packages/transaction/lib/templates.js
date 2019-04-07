const _ = require('@keyring/util');
_.ecc = require('ecc-tools');

const Templates = [
  {
    id: 'p2pkh',
    fingerprint: 'OP_DUP OP_HASH160 <data> OP_EQUALVERIFY OP_CHECKSIG',
    destination(script) { return [script.opcodes[2].data]; },
    init(hash) {
      hash = _.r.is(Buffer, hash) ? hash.toString('hex') : hash;
      return new _.Writer('76a914' + hash + '88ac').buf;
    }
  },
  {
    id: 'p2pkhm',
    fingerprint: 'OP_DUP OP_HASH160 <data> OP_EQUALVERIFY OP_CHECKSIG <data> OP_DROP',
    destination: (script) => { return [script.opcodes[2].data]; },
    meta: (script) => {
      let data = new _.Reader(script.opcodes[5].data);
      let identifier = data.read(4).toString();
      if (identifier === 'spkq') {
        let assets = {};
        while (!data.eof) {
          assets[data.reverse(16).toString('hex')] = data.uint64le().toNumber();
        }
        return {type: 'mc-asset', id: identifier, assets: assets, data: data.buf};
      } else if (identifier === 'spkg') {
        return { type: 'mc-issuance-quantity', id: identifier, quantity: data.uint64le() };
      } else { return {type: 'raw', data: data.buf}; }
    }
  },
  {
    id: 'blank',
    fingerprint: '',
    init() { return Buffer.alloc(0); }
  },
  {
    id: 'signature',
    fingerprint: '<data> <data>',
    init(key, sighash, type) {
      key = _.r.is(String, key) ? Buffer.from(key, 'hex') : key;

      let _type = Buffer.alloc(1);
      _type.writeUInt8(type, 0);

      console.log('type  >>>', _type, type);
      let pub = _.ecc.publicKey(key, true);
      let signature = Buffer.concat([_.ecc.sign(sighash, key), _type]);
      return signature.length.toString(16) + signature.toString('hex') + '21' + pub.toString('hex');
    }
  }
];

module.exports = Templates;