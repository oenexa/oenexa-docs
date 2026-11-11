# Chapter 4: Post-Quantum Signatures (`ML-DSA-65`) & Encrypted Keystores

## 1. The Quantum Threat (Why Legacy Blockchains Have a Problem)

In most classical blockchains built years ago, ownership relies on **Elliptic Curve Cryptography** (such as ECDSA or Ed25519) or **RSA**. Their security assumes a computer cannot quickly factor huge numbers or solve discrete logarithms.

In 1994, mathematician Peter Shor discovered **Shor's Algorithm**. A sufficiently large **quantum computer** running Shor's algorithm solves those classical problems exponentially faster — meaning it could compute a user's **Private Key** directly from their **Public Key** in hours and drain wallets!

Rather than waiting for quantum computers to break wallets and then rushing an emergency hard fork, **OENEXA builds post-quantum cryptography directly into Day 1.**

---

## 2. How `ML-DSA-65` (FIPS 204) Protects Every ONXC Wallet

OENEXA signs every transaction and every consensus block vote using **NIST FIPS 204 `ML-DSA-65`** (formerly known as CRYSTALS-Dilithium, implemented via Cloudflare's `circl/sign/mldsa/mldsa65`).

### Intuitively: What Is Lattice Cryptography?
Instead of multiplying prime numbers or jumping around elliptic curves, `ML-DSA-65` hides your secret inside a **high-dimensional geometric grid (a Euclidean lattice)** with intentional mathematical noise:
- Problems called **Module Learning With Errors (M-LWE)** and **Module Short Integer Solution (M-SIS)** ask you to find the shortest vector or undo noisy matrix equations in hundreds of dimensions.
- Even **quantum computers** have no known fast algorithm to solve `M-LWE` / `M-SIS`!

### Exact Key & Signature Sizes in `internal/crypto/wallet.go`

Post-quantum signatures are larger than classical ones, which is why OENEXA gives each block plenty of capacity:

| Item | Size in Bytes | Security Level |
| :--- | :--- | :--- |
| **Public Key** (`PublicKeySize`) | `1,952` bytes | NIST Security Category 3 (~192-bit equivalent to AES-192) |
| **Private Key** (`PrivateKeySize`) | `4,032` bytes | Post-quantum lattice secret vectors |
| **Signature** (`SignatureSize`) | `3,309` bytes | Unforgeable proof that owner approved the message |
| **Address** (`AddressSize`) | `32` bytes | `SHA-3-256(PublicKey)` |

Verification is blazingly fast — roughly **77 microseconds (`0.077 ms`)** per signature — allowing OENEXA nodes to verify thousands of transactions per second.

### Memory Zeroization
When a wallet (`Wallet`) finishes running or shuts down (`wallet.Zeroize()`), OENEXA overwrites the private key bytes in RAM with zeros so memory dumps or OS swap files cannot leak secrets.

---

## 3. Protecting Keys on Disk: The Encrypted Keystore (`internal/keystore`)

Never leave a raw `4,032`-byte private key sitting in plain text on your hard drive! OENEXA encrypts your wallet inside a JSON **keystore file** (`keystore.json`) using two heavy-duty defense layers:

```text
  Your Password ("MyStrongPass!") + 16-byte Random Salt
               |
        Argon2id Key Derivation
        (64 MiB RAM, 3 rounds, 4 threads)
               v
     32-byte AES Encryption Key
               |
     AES-256-GCM Authenticated Encryption (+ 12-byte IV)
               v
  Encrypted Private Key + Integrity Tag stored in keystore.json
```

### Why `Argon2id` + `AES-256-GCM`?
1. **`Argon2id` (Password Hardening)**: Instead of using your typed password directly as an encryption key (which hackers could guess millions of times per second), `Argon2id` requires **`65,536 KiB` (`64 MiB`) of RAM** and **`3` iterations** across **`4` threads** for every single password guess. That slows brute-force cracking tools down dramatically.
2. **`AES-256-GCM` (Symmetric Quantum-Safe AEAD)**: Symmetric ciphers are NOT broken by Shor's algorithm (`Grover's algorithm` only halves key strength, leaving `AES-256` with an ultra-strong `128-bit` quantum security margin). `GCM` mode also attaches an authentication tag so if anyone tampers with 1 bit of `keystore.json`, decryption fails immediately.

### Inside a Real `keystore.json` File
```json
{
  "version": 1,
  "address": "<64-char hex SHA-3-256(pubKey)>",
  "kdf": "argon2id",
  "kdf_params": { "memory": 65536, "time": 3, "threads": 4, "salt": "<base64>" },
  "cipher": "aes256gcm",
  "cipher_params": { "iv": "<base64>", "ciphertext": "<base64>" },
  "public_key": "<base64 ML-DSA-65 public key>"
}
```
Notice `"address"` and `"public_key"` are readable without your password (so `oenexa-node wallet show` can tell you your receiving address safely), while the Private Key stays locked inside `"ciphertext"`.

---

## Check Your Understanding

1. **Why is `ML-DSA-65` safe against quantum computers while older elliptic-curve signatures are vulnerable?**  
   *Answer:* Shor's algorithm breaks factoring and elliptic-curve discrete logs in polynomial time on a quantum computer, whereas `ML-DSA-65` relies on high-dimensional lattice problems (`M-LWE` and `M-SIS`) for which no efficient quantum algorithm is known.

2. **Why does OENEXA put `Argon2id` in front of `AES-256-GCM` when saving `keystore.json`?**  
   *Answer:* Human passwords have low entropy and can be guessed quickly with GPUs/ASICs. Requiring `64 MiB` of memory per attempt via `Argon2id` makes offline password guessing enormously expensive, while `AES-256-GCM` encrypts and tamper-protects the `4,032`-byte private key.
