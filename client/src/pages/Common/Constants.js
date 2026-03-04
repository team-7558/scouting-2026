export const COMPRESS_DATA_MAP = {
    AUTO_MOVEMENT: "am",
    reportId: "rid",
}

export let DECOMPRESS_DATA_MAP = {}

for (const key in DECOMPRESS_DATA_MAP) {
    const value = DECOMPRESS_DATA_MAP[key];
    DECOMPRESS_DATA_MAP[value] = key;
}

const compressDecompressData = (data, map) => {
    Object.keys(data).forEach(key => {
    const val = data[key];
    //if value is an object, compress it
    if (typeof val === "object") {
      compressData(val);
      return ;
    }
    //otherwise, try to compress the key and the value
    if (map[val]){
      data[key] = COMPRESS_DATA_MAP[val];
    }
    
    if (map[key]) {
      data[map[key]] = data[key];
      delete data[key];
    }
  })
}

export const compressData = (data) => {
  compressDecompressData(data, COMPRESS_DATA_MAP);
}

export const decompressData = (data) => {
    compressDecompressData(data, DECOMPRESS_DATA_MAP);
}