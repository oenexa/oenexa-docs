# Chapter 2: What Is ONXC Coin & Tokenomics?

## 1. Meet ONXC — Open Network for the Next Generation Coin

Every sovereign blockchain needs a native currency to reward validators who secure the network and to prevent spam by charging tiny transaction fees. On OENEXA, that currency is **ONXC** (*Open Network for the Next Generation Coin*).

Just as 1 Dollar divides into 100 Cents, **1 ONXC divides into 1,000,000,000 (`10^9`) smaller units called `nano-ONXC`**.

| Unit Name | Code Constant (`internal/core/types.go`) | Value in `nano-ONXC` | Analogy |
| :--- | :--- | :--- | :--- |
| **`nano-ONXC`** | `NanoONXC = 1` | `1` (`0.000000001 ONXC`) | Like a millimeter — computers store all integer balances in `nano-ONXC` to avoid floating-point rounding bugs! |
| **`ONXC`** | `OneONXC = 1_000_000_000` | `1,000,000,000` (`10^9`) | The human-readable unit shown in wallets and explorers. |

> **Why Store Integer `nano-ONXC` Instead of Decimals Like `1.5`?**  
> Computers represent floating-point decimals (`0.1 + 0.2 = 0.30000000000000004`) inaccurately. In banking and blockchains, even a tiny rounding discrepancy across nodes would cause disagreement on the State Root! By storing balances strictly as `uint64` integers in `nano-ONXC`, arithmetic is 100% exact across every machine on Earth. And `MaxSupply = 100,000,000 * 10^9 = 10^17` fits comfortably inside a 64-bit unsigned integer (`uint64` holds up to ~`1.84 × 10^19`).

---

## 2. Genesis Allocation vs. Ongoing Emission

When OENEXA launches at **Height `0` (Genesis)**, not all 100 million ONXC exist yet. Instead, the supply is split cleanly into two phases defined in `internal/core/tokenomics.go`:

```text
Total Maximum Supply = 100,000,000 ONXC (Hard Cap — Never Exceeded)
│
├── 1. Genesis Premine = 10,000,000 ONXC (10% minted at Block 0)
│     ├── Treasury Allocation : 5,000,000 ONXC (ecosystem grants & protocol reserve)
│     ├── Liquidity Reserve   : 3,000,000 ONXC (exchange & market liquidity)
│     └── Staking Bootstrap   : 2,000,000 ONXC (initial validator security bond)
│
└── 2. Future Validator Block Rewards = up to 90,000,000 ONXC (90% earned block by block)
```

Note how simple and transparent the numbers are: `5M + 3M + 2M = 10M ONXC` at genesis, leaving `90M ONXC` to be emitted over time via block rewards (plus fee burns reducing net circulating growth).

---

## 3. Block Rewards & The Halving Schedule

Whenever a block is finalized (every 2 seconds), the protocol mints a **Block Reward** (`BlockReward(height)`) to reward the proposer/validator securing that block.

- **Genesis block (`height == 0`)**: Reward is `0` (genesis accounts are funded by the genesis allocation).
- **Era 0 (`height` `1` to `1,000,000`)**: Each block mints **`45 ONXC`** (`InitialBlockReward = 45 * OneONXC`).
- **Halving Interval**: Every **`1,000,000` blocks** (`HalvingInterval = 1_000_000`), the block reward cuts in **half** (`>> 1`, integer right-shift by 1 bit)!

At 2 seconds per block (`BlockIntervalSec = 2`), how long is one Halving Era?
$$\text{1 Era} = 1,000,000\text{ blocks} \times 2\text{ seconds/block} = 2,000,000\text{ seconds} \approx 23.15\text{ days}$$

Let's trace the first few eras:

| Era | Block Heights | Formula | Reward per Block | Coins Minted in This Era |
| :--- | :--- | :--- | :--- | :--- |
| **Era 0** | `1` to `1,000,000` | `45 ONXC` | `45.000000000 ONXC` | `45,000,000 ONXC` |
| **Era 1** | `1,000,001` to `2,000,000` | `45 / 2` | `22.500000000 ONXC` | `22,500,000 ONXC` |
| **Era 2** | `2,000,001` to `3,000,000` | `45 / 4` | `11.250000000 ONXC` | `11,250,000 ONXC` |
| **Era 3** | `3,000,001` to `4,000,000` | `45 / 8` | `5.625000000 ONXC` | `5,625,000 ONXC` |
| ... | ... | halves every 1M | ... | shrinks toward `0` |

After 64 eras (`era >= 64`), integer division makes the reward `0`, so minting stops completely forever.

---

## 4. Mathematical Proof: Why Supply Can NEVER Exceed 100,000,000 ONXC

Students often wonder: *"If rewards continue for dozens of eras, couldn't total coins eventually blow past 100 million?"*

Let's prove using middle/high-school math (a geometric series) why that is impossible:

$$\text{Total Minted Rewards} < \sum_{k=0}^{\infty} \left(1,000,000 \times \frac{45\text{ ONXC}}{2^k}\right)$$

Notice that adding $1 + \frac{1}{2} + \frac{1}{4} + \frac{1}{8} + \dots$ infinitely gets closer and closer to **$2$**, never exceeding $2$!

Therefore:
$$\text{Total Minted Rewards} < 45,000,000\text{ ONXC} \times 2 = 90,000,000\text{ ONXC}$$

Now add the Genesis Premine:
$$\text{Total Possible Supply} \le \text{Genesis Premine} + \text{Total Minted Rewards} = 10,000,000 + 90,000,000 = 100,000,000\text{ ONXC}$$

In fact, because `nano-ONXC` division rounds down (`>> era`) in the later eras, the exact total emission in code (`TotalEmissionAt`) converges strictly **below** `90,000,000 ONXC`, and `CirculatingSupply(height)` clamps at `MaxSupply` (`100,000,000 ONXC`) as an ironclad safety check.

---

## 5. Deflationary Force: Base-Fee Burning

ONXC also destroys (**burns**) part of every transaction fee (`BaseFee * GasUsed`). That means:
- When network usage is low, new ONXC enters circulation through validator block rewards.
- When network usage is very high, burnt base fees offset new issuance, making ONXC scarcer over time.

Meanwhile, **Priority Tips** are never burned — they go straight to the block validator as an incentive to include your transaction quickly.

---

## 6. Estimating Staking Yield (`StakingYieldEstimate`)

If you lock (stake) your ONXC with a validator, what APR do you earn from block rewards? In `internal/core/tokenomics.go`:

$$\text{Annual Emission} = \text{BlockReward}(h) \times \text{BlocksPerYear}$$
where $\text{BlocksPerYear} = \frac{365.25 \times 86,400\text{ s}}{2\text{ s/block}} = 15,778,800\text{ blocks/year}$.

If a fraction $r$ (for example `0.67`, meaning 67%) of the current circulating supply is staked:
$$\text{Estimated APY (\%)} = \frac{\text{Annual Emission}}{\text{CirculatingSupply}(h) \times r} \times 100$$

---

## Check Your Understanding

1. **You have `2.5 ONXC`. How many `nano-ONXC` is that inside OENEXA's StateDB?**  
   *Answer:* $2.5 \times 1,000,000,000 = 2,500,000,000\text{ nano-ONXC}$.

2. **What is the block reward at height `2,500,000`?**  
   *Answer:* Era is `(2,500,000 - 1) / 1,000,000 = 2`. So `reward = 45 ONXC >> 2 = 11.25 ONXC` (`11,250,000,000 nano-ONXC`).

3. **Why does OENEXA split fees into `BaseFee` (burned) and `PriorityTip` (paid to validator)?**  
   *Answer:* Burning `BaseFee` prevents validators from stuffing fake spam transactions to collect their own fees for free, while keeping ONXC disinflationary as usage scales.
