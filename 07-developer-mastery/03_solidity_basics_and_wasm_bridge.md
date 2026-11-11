# Stage 5: Solidity Smart Contracts & How They Map to `OenexaVM`

> **Where You Are in the Blockchain Developer Path**
> Programming Languages $\to$ Cryptography $\to$ Bitcoin Basics $\to$ Ethereum $\to$ **`[5. Solidity]`** $\to$ Smart Contracts $\to$ Web3 Projects $\to$ Security $\to$ DeFi $\to$ Blockchain Core $\to$ Build Your Own Blockchain

---

## 1. Everyday Analogy: Writing Rules in High-Level English Before Compiling to Machine Gear

Solidity is the world's most popular high-level language for learning **smart contract mental models**. Even when you deploy WebAssembly (`OenexaVM`) contracts written in Rust/TinyGo/WAT, every core Solidity design pattern maps 1-to-1 onto OENEXA's VM host functions!

---

## 2. Walkthrough: Your First Complete Smart Contract (Club Piggy Bank)

Read every line of this annotated Solidity contract (`ClubVault.sol`):

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ClubVault {
    // 1. PERSISTENT ON-CHAIN STORAGE (Committed into StateDB StorageRoot!)
    address public owner;
    mapping(address => uint256) public deposits;
    uint256 public totalVault;

    // 2. EVENT LOG (Indexed by explorers and dApp frontends)
    event Deposited(address indexed member, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    // 3. CONSTRUCTOR (Runs ONCE during TxDeploy!)
    constructor() {
        owner = msg.sender; // Whoever deployed this contract owns it
    }

    // 4. MODIFIER (Reusable gatekeeper check)
    modifier onlyOwner() {
        require(msg.sender == owner, "Not club owner");
        _;
    }

    // 5. PAYABLE FUNCTION (Receives native coin via msg.value)
    function deposit() external payable {
        require(msg.value > 0, "Must send > 0");
        deposits[msg.sender] += msg.value;
        totalVault += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    // 6. VIEW FUNCTION (Read-only dry run — zero state mutation!)
    function getMemberDeposit(address member) external view returns (uint256) {
        return deposits[member];
    }

    // 7. PRIVILEGED PAYOUT
    function withdrawAll(address payable recipient) external onlyOwner {
        uint256 amount = totalVault;
        require(amount > 0, "Empty vault");
        totalVault = 0; // Update state BEFORE transfer (reentrancy defense!)
        (bool ok, ) = recipient.call{value: amount}("");
        require(ok, "Transfer failed");
        emit Withdrawn(recipient, amount);
    }
}
```

### Concrete Worked Trace of `ClubVault`
1. **Deploy (`TxDeploy`)**: Alice deploys `ClubVault`. Constructor sets `owner = Alice`. `totalVault = 0`.
2. **Alice calls `deposit()` attaching `50 ONXC`**:
   - `msg.sender = Alice`, `msg.value = 50`.
   - `deposits[Alice]` becomes `50`, `totalVault` becomes `50`, event `Deposited(Alice, 50)` fires.
3. **Bob calls `withdrawAll(Bob)`**:
   - `onlyOwner` checks `msg.sender (Bob) == owner (Alice)` $\implies$ **FAILS (`"Not club owner"`) and reverts!**
4. **Alice calls `withdrawAll(Carol)`**:
   - `onlyOwner` passes! `totalVault` zeros to `0`, `50 ONXC` transfers cleanly to Carol!

---

## 3. Side-by-Side: Solidity Concepts $\leftrightarrow$ `OenexaVM` WASM Host ABI

Notice that Solidity's globals are not magic — every single one translates directly into an **`OenexaVM` `"env"` host call** inside `internal/vm/vm.go`:

| Solidity Construct | What It Means | Equivalent `OenexaVM` Host Call (`internal/vm`) |
| :--- | :--- | :--- |
| State variable read (`totalVault`) | Read persistent storage slot | `env.oen_get(slot i32) -> i64` |
| State variable write (`totalVault = 0`) | Mutate persistent storage slot | `env.oen_set(slot i32, value i64)` |
| `msg.sender` | Address calling the contract | `env.oen_caller() -> i64` (`CallerAddr`) |
| `msg.value` | Native coin attached to the call | `env.oen_value() -> i64` (`ExecutionContext.Value`) |
| `block.number` | Current chain block height | `env.oen_block_height() -> i64` |
| `address(x).balance` | Query coin balance of address `x` | `env.oen_balance(addr_ptr i32) -> i64` |
| `payable(to).transfer(amt)` | Transfer native `nano-ONXC` from contract | `env.oen_transfer(to_ptr i32, amt i64) -> i64` |
| `emit Deposited(...)` | Record verifiable event log | `env.oen_log(ptr i32, len i32)` |
| `revert(...)` / `require(...)` | Abort & undo all writes cleanly | Returns non-zero exit / atomic StateDB rollback |

Look at `CounterContractWASM` inside `internal/vm/contract.go` — its WAT implementation of `increment()` literally runs:
```wat
(func (export "increment")
  i32.const 0
  i32.const 0
  call $get        ;; env.oen_get(0) -> reads uint256 slot equivalent
  i64.const 1
  i64.add
  call $set        ;; env.oen_set(0, count + 1)
)
```
Once you understand Solidity's storage/caller/value/revert rules, you already understand **100% of the mental model** behind `OenexaVM`, Move, CosmWasm, and Anchor/Rust contracts!

---

## Student Practice Exercises (With Answers)

1. **Exercise 1 (`msg.value` vs. `balance`):** In `ClubVault`, why did we track `totalVault` carefully and check `onlyOwner` before letting `withdrawAll` send coins?  
   <details><summary>Show Answer</summary>
   Without `onlyOwner`, *any* anonymous account on the internet could call `withdrawAll(theirOwnAddress)` and drain the entire club treasury on the next block!
   </details>

2. **Exercise 2 (`OenexaVM` Translation):** Which `OenexaVM` host function corresponds to Solidity's `block.number`?  
   <details><summary>Show Answer</summary>
   `env.oen_block_height()`.
   </details>
