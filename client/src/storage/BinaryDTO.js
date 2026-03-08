const BASE45_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";

export class BinaryDTO {
  constructor(schema) {
    this.schema = schema;
  }

  pack(jsObject) {
    const bytes = [];
    this.schema.forEach((field) => {
      this._serializeField(field, jsObject[field.key], bytes);
    });
    return this._toBase45(new Uint8Array(bytes));
  }

  unpack(base45String) {
    const bytes = this._fromBase45(base45String);
    const result = {};
    let offset = 0;

    const decode = (schemaSlice, targetObj) => {
      schemaSlice.forEach((field) => {
        const { value, newOffset } = this._deserializeField(field, bytes, offset);
        targetObj[field.key] = value;
        offset = newOffset;
      });
    };

    decode(this.schema, result);
    return result;
  }

  _serializeField(field, value, bytes) {
    if (field.type === "uint16") {
      bytes.push((value >> 8) & 0xff, value & 0xff);
    } else if (field.type === "uint8") {
      const val = field.map ? field.map.indexOf(value) : value;
      bytes.push((val === -1 ? 0 : val) & 0xff);
    } else if (field.type === "bool") {
      bytes.push(value ? 1 : 0);
    } else if (field.type === "string") {
      const str = String(value || "");
      bytes.push(Math.min(str.length, 255)); // Length prefix
      for (let i = 0; i < Math.min(str.length, 255); i++) {
        bytes.push(str.charCodeAt(i) & 0xff);
      }
    } else if (field.type === "array") {
      const arr = value || [];
      bytes.push(arr.length & 0xff);
      arr.forEach((item) => {
        field.itemSchema.forEach((subField) => {
          this._serializeField(subField, item[subField.key], bytes);
        });
      });
    }
  }

  _deserializeField(field, bytes, offset) {
    let value, newOffset = offset;
    if (field.type === "uint16") {
      value = (bytes[offset] << 8) | bytes[offset + 1];
      newOffset += 2;
    } else if (field.type === "uint8") {
      value = field.map ? field.map[bytes[offset]] : bytes[offset];
      newOffset += 1;
    } else if (field.type === "bool") {
      value = bytes[offset] === 1;
      newOffset += 1;
    } else if (field.type === "string") {
      const len = bytes[offset];
      newOffset += 1;
      value = "";
      for (let i = 0; i < len; i++) {
        value += String.fromCharCode(bytes[newOffset + i]);
      }
      newOffset += len;
    } else if (field.type === "array") {
      const count = bytes[offset];
      newOffset += 1;
      value = [];
      for (let i = 0; i < count; i++) {
        const item = {};
        field.itemSchema.forEach((subField) => {
          const res = this._deserializeField(subField, bytes, newOffset);
          item[subField.key] = res.value;
          newOffset = res.newOffset;
        });
        value.push(item);
      }
    }
    return { value, newOffset };
  }
  // --- Base45 Encoding/Decoding ---

  _toBase45(uint8Array) {
    let res = "";
    for (let i = 0; i < uint8Array.length; i += 2) {
      if (uint8Array.length - i > 1) {
        let x = (uint8Array[i] << 8) + uint8Array[i + 1];
        res += BASE45_CHARSET[x % 45] + BASE45_CHARSET[Math.floor(x / 45) % 45] + BASE45_CHARSET[Math.floor(x / 2025)];
      } else {
        let x = uint8Array[i];
        res += BASE45_CHARSET[x % 45] + BASE45_CHARSET[Math.floor(x / 45)];
      }
    }
    return res;
  }

  _fromBase45(str) {
    const output = [];
    // Use a while loop to handle the variable increment (3 or 2)
    let i = 0;
    while (i < str.length) {
      const remaining = str.length - i;
      let x = BASE45_CHARSET.indexOf(str[i]) +
        BASE45_CHARSET.indexOf(str[i + 1]) * 45;

      if (remaining >= 3) {
        // Standard group: 3 chars -> 2 bytes
        x += BASE45_CHARSET.indexOf(str[i + 2]) * 2025;
        output.push((x >> 8) & 0xff);
        output.push(x & 0xff);
        i += 3;
      } else {
        // Short group: 2 chars -> 1 byte
        output.push(x & 0xff);
        i += 2;
      }
    }
    return new Uint8Array(output);
  }
}