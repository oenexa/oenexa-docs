# Chapter 6: The Mempool (Waiting Room) & Dynamic Fees (EIP-1559)

## 1. What Is the Mempool?

Think of the **Mempool** (*Memory Pool*, implemented in `internal/mempool/`) as the **airport boarding lounge** for valid transactions waiting to board the next block.

Whenever a transaction arrives via JSON-RPC (`onxc_sendRawTransaction`) or P2P gossip (`/oenexa/tx/1.0.0`), the node checks:
1. Is the transaction structurally valid (`BasicValidate`)?
   - `Data` size $\le 1\text{ MiB}$ (`MaxTxDataSize = 1 << 20`)
   - `GasLimit` $\ge$ minimum gas required for its `TxType` and $\le \text{BlockGasLimit}$ (`500,000,000`)
   - `GasPrice` $\ge \text{MinGasPrice}$ (`1` nano-ONXC)
2. Is its `ML-DSA-65` signature valid and does `SHA-3-256(PublicKey) == From`?
3. Does the mempool already hold this transaction hash (`seen` deduplication)?

If valid, the transaction enters the mempool waiting room.

---

## 2. How Transactions Are Prioritized & Protected From Spam

What if thousands of users send transactions at the same instant? OENEXA's mempool uses two data structures working together (`internal/mempool/mempool.go` & `priorityqueue.go`):

1. **Priority Max-Heap**: Transactions are sorted first by **highest `GasPrice`** (so urgent transactions willing to tip slightly more board first), and ties are broken by **earliest `Timestamp`** (FIFO fairness!).
2. **Capacity & Flood Protection**:
   - **`DefaultMaxSize = 100,000`**: Maximum pending transactions stored in memory at once. If full, the lowest-priority (`GasPrice`) transaction can be evicted when a higher-fee transaction arrives (`ReplaceByFee`).
   - **`MaxSenderQueueLen = 10,000`**: No single sender address can flood the entire waiting room and crowd out other students/users.

When the Block Proposer builds a new block every 2 seconds (`Consensus`), it pops up to `MaxTxPerBlock = 10,000` transactions from the top of the priority queue within `BlockGasLimit = 500,000,000`, executes them, and **purges** them from the mempool once the block commits.

---

## 3. What Is "Gas" and Why Does It Exist?

Suppose anyone could deploy an infinite `while (true) {}` loop inside a smart contract for free. Every node on Earth running that contract would hang forever!

**Gas** is the unit of computational work (`internal/core/types.go`):
- Simple ONXC transfer: **`21` gas**
- Deposit into Shielded Pool: **`50` gas**
- Withdraw from Shielded Pool: **`100` gas**
- Shielded-to-shielded transfer: **`150` gas**
- Call a smart contract: **`500` gas** (plus WebAssembly instruction metering)
- Deploy a smart contract: **`5,000` gas**

Because every unit of gas costs at least `1 nano-ONXC` (`MinBaseFee = 1`), infinite loops and spam attacks hit the caller's `GasLimit` or run out of money immediately.

---

## 4. OENEXA's Dynamic Fee Model (EIP-1559 Style)

Instead of making users blindly guess an auction price when the network gets busy, OENEXA adjusts a transparent, automatic **Base Fee** every block (`internal/core/fee.go`):

### Key Parameters
- **`BlockGasLimit`**: `500,000,000` gas max per block.
- **`TargetBlockGas()`**: `BlockGasLimit / 2 = 250,000,000` gas (`50%` full is the "Goldilocks" ideal!).
- **`InitialBaseFee`**: `10 nano-ONXC/gas` at genesis.
- **`MinBaseFee`**: `1 nano-ONXC/gas` (can never go to `0` — zero-cost spam is impossible).
- **`MaxBaseFeeChangeDenom`**: `8` $\implies$ base fee can move by **at most `±12.5%` per block**.

### How `NextBaseFee` Adjusts Automatically

```text
  Block is > 50% full (> 250M gas)  --->  BaseFee increases (up to +12.5%)
  Block is == 50% full (250M gas)   --->  BaseFee stays unchanged
  Block is < 50% full (< 250M gas)  --->  BaseFee decreases (down to -12.5%, min 1)
```

Exact formula:
- When busy (`gasUsed > target`):
  $$\Delta = \max\left(1,\; \frac{\text{current} \times (\text{gasUsed} - \text{target})}{\text{target} \times 8}\right)$$
- When quiet (`gasUsed < target`):
  $$\Delta = \max\left(1,\; \frac{\text{current} \times (\text{target} - \text{gasUsed})}{\text{target} \times 8}\right)$$
  (clamped so it never drops below `MinBaseFee = 1`).

---

## 5. How Ultra-Cheap Is an ONXC Transfer?

Using `TransferCostNanoONXC(baseFee, tip) = 21 * (baseFee + tip)`:

- **At Genesis (`InitialBaseFee = 10`, `tip = 0`)**:
  $$21 \times 10 = 210\text{ nano-ONXC} = 0.00000021\text{ ONXC}$$
  Even if `1 ONXC = $1.00`, a transfer costs **`$0.00000021`** — less than one thousandth of a cent!
- **At Quiet Network Floor (`MinBaseFee = 1`, `tip = 0`)**:
  $$21 \times 1 = 21\text{ nano-ONXC} = 0.000000021\text{ ONXC}$$

Wallets can also call `onxc_feeEstimate` to choose one of 3 convenience tiers (`FeeTierUltraLow`, `FeeTierStandard`, `FeeTierFast`).

---

## Check Your Understanding

1. **If a block uses `500,000,000` gas (`100%` of `BlockGasLimit`) while `currentBaseFee = 16`, what is the next block's `BaseFee`?**  
   *Answer:* Excess gas over `250M` target equals `250M`, so the increase is `16 * 250M / (250M * 8) = +2` (`+12.5%`). `NextBaseFee = 18 nano-ONXC/gas`.

2. **Why does OENEXA cap each sender to `MaxSenderQueueLen = 10,000` in the mempool?**  
   *Answer:* To stop one noisy address from filling all `100,000` mempool slots and blocking legitimate users.
