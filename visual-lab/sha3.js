// Pure-JS FIPS 202 SHA-3-256 implementation (matches Go crypto.Hash256 and Python hashlib.sha3_256).
// Safe for offline file:// usage with zero external dependencies.
(function (globalScope) {
  "use strict";

  const KECCAK_ROUNDS = 24;
  const MASK64 = (1n << 64n) - 1n;

  const RC = [
    0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
    0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
    0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
    0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
    0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
    0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
  ];

  const ROTC = [
    [0, 36, 3, 41, 18],
    [1, 44, 10, 45, 2],
    [62, 6, 43, 15, 61],
    [28, 55, 25, 21, 56],
    [27, 20, 39, 8, 14],
  ];

  function rotl64(x, n) {
    if (n === 0) return x;
    return ((x << BigInt(n)) | (x >> BigInt(64 - n))) & MASK64;
  }

  function keccakF1600(state) {
    for (let round = 0; round < KECCAK_ROUNDS; round++) {
      // Theta
      const C = new Array(5);
      for (let x = 0; x < 5; x++) {
        C[x] = state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20];
      }
      const D = new Array(5);
      for (let x = 0; x < 5; x++) {
        D[x] = C[(x + 4) % 5] ^ rotl64(C[(x + 1) % 5], 1);
      }
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          state[x + 5 * y] ^= D[x];
        }
      }

      // Rho + Pi
      const B = new Array(25);
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          const newX = y;
          const newY = (2 * x + 3 * y) % 5;
          B[newX + 5 * newY] = rotl64(state[x + 5 * y], ROTC[x][y]);
        }
      }

      // Chi
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const t = B[x + 5 * y];
          const u = (~B[((x + 1) % 5) + 5 * y]) & MASK64;
          const v = B[((x + 2) % 5) + 5 * y];
          state[x + 5 * y] = t ^ (u & v);
        }
      }

      // Iota
      state[0] ^= RC[round];
    }
  }

  function toUtf8Bytes(input) {
    if (input instanceof Uint8Array) return input;
    return new TextEncoder().encode(String(input));
  }

  function sha3_256Bytes(input) {
    const msg = toUtf8Bytes(input);
    const rateBytes = 136; // SHA-3-256: r = 1088 bits = 136 bytes, c = 512 bits
    const state = new Array(25).fill(0n);

    // Pad with FIPS 202 domain separator 0x06 ... 0x80
    const rem = msg.length % rateBytes;
    const padLen = rateBytes - rem;
    const padded = new Uint8Array(msg.length + padLen);
    padded.set(msg);
    padded[msg.length] ^= 0x06;
    padded[padded.length - 1] ^= 0x80;

    for (let offset = 0; offset < padded.length; offset += rateBytes) {
      for (let lane = 0; lane < rateBytes / 8; lane++) {
        let word = 0n;
        const base = offset + lane * 8;
        for (let b = 0; b < 8; b++) {
          word |= BigInt(padded[base + b]) << BigInt(b * 8);
        }
        state[lane] ^= word;
      }
      keccakF1600(state);
    }

    const out = new Uint8Array(32);
    for (let lane = 0; lane < 4; lane++) {
      let word = state[lane];
      for (let b = 0; b < 8; b++) {
        out[lane * 8 + b] = Number((word >> BigInt(b * 8)) & 0xffn);
      }
    }
    return out;
  }

  function bytesToHex(bytes) {
    let hex = "";
    for (let i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, "0");
    }
    return hex;
  }

  function sha3_256Hex(input) {
    return bytesToHex(sha3_256Bytes(input));
  }

  const api = { sha3_256Bytes, sha3_256Hex, bytesToHex };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    globalScope.OenexaSHA3 = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
