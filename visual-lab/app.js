(function () {
  "use strict";

  const { sha3_256Hex } = window.OenexaSHA3;

  // Helpers
  const $ = (id) => document.getElementById(id);
  const shortHex = (h, n = 10) => (h.length > n * 2 ? h.slice(0, n) + "..." + h.slice(-n) : h);
  const fmtInt = (n) => Number(n).toLocaleString("en-US");

  // ── TAB NAVIGATION & DEEP LINKS ───────────────────────────────────────────
  const tabButtons = document.querySelectorAll("#nav-tabs .tab-btn");
  const panels = document.querySelectorAll(".panel");

  function switchTab(tabName) {
    tabButtons.forEach((b) => b.classList.toggle("active", b.dataset.tab === tabName));
    panels.forEach((p) => p.classList.toggle("active", p.id === "tab-" + tabName));
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      switchTab(btn.dataset.tab);
      history.replaceState(null, "", "#" + btn.dataset.tab);
    });
  });

  if (location.hash) {
    const target = location.hash.replace("#", "");
    if (document.getElementById("tab-" + target)) switchTab(target);
  }

  // ── 1. BLOCKCHAIN & SHA-3-256 AVALANCHE LAB ───────────────────────────────
  const initialBlocks = () => [
    { height: 0, data: "Genesis: 10,000,000 ONXC (Treasury 5M | Liq 3M | Stake 2M)", prev: "0".repeat(64) },
    { height: 1, data: "Alice -> Bob: 250 ONXC (Nonce 0, Fee 210 nano-ONXC)", prev: "" },
    { height: 2, data: "Carol stakes 1,000 ONXC to Validator-1", prev: "" },
    { height: 3, data: "Dave deploys WASM Multisig Contract (5,000 gas)", prev: "" },
  ];

  let blocks = [];
  function sealChain() {
    for (let i = 0; i < blocks.length; i++) {
      if (i > 0) blocks[i].prev = blocks[i - 1].storedHash;
      blocks[i].storedHash = sha3_256Hex(`${blocks[i].height}|${blocks[i].prev}|${blocks[i].data}`);
    }
  }

  function resetChain() {
    blocks = initialBlocks();
    sealChain();
    renderChain();
  }

  function renderChain() {
    const container = $("chain-container");
    container.innerHTML = "";
    let upstreamBroken = false;
    blocks.forEach((blk, idx) => {
      const actualHash = sha3_256Hex(`${blk.height}|${blk.prev}|${blk.data}`);
      const prevMismatch = idx > 0 && blk.prev !== sha3_256Hex(`${blocks[idx - 1].height}|${blocks[idx - 1].prev}|${blocks[idx - 1].data}`);
      const selfTampered = actualHash !== blk.storedHash;
      const isBroken = upstreamBroken || selfTampered || prevMismatch;
      if (isBroken) upstreamBroken = true;

      const card = document.createElement("div");
      card.className = "block-card" + (isBroken ? " broken" : "");
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <strong>Block #${blk.height}</strong>
          <span class="badge ${isBroken ? "bad" : "ok"}">${isBroken ? "BROKEN" : "VALID"}</span>
        </div>
        <label>Transactions / Data</label>
        <textarea rows="2" data-idx="${idx}">${blk.data}</textarea>
        <label style="margin-top:8px;">PrevHash</label>
        <div class="mono-box">${shortHex(blk.prev, 8)}</div>
        <label style="margin-top:8px;">Live Computed Hash</label>
        <div class="mono-box">${shortHex(actualHash, 8)}</div>
      `;
      container.appendChild(card);

      if (idx < blocks.length - 1) {
        const arrow = document.createElement("div");
        arrow.className = "chain-arrow" + (isBroken ? " broken" : "");
        arrow.textContent = isBroken ? "✕" : "→";
        container.appendChild(arrow);
      }
    });

    container.querySelectorAll("textarea").forEach((ta) => {
      ta.addEventListener("input", (e) => {
        const i = Number(e.target.dataset.idx);
        blocks[i].data = e.target.value;
        renderChain();
      });
    });
  }

  $("btn-reseal-chain").addEventListener("click", () => {
    sealChain();
    renderChain();
  });
  $("btn-reset-chain").addEventListener("click", resetChain);

  function renderAvalanche() {
    const ha = sha3_256Hex($("av-a").value);
    const hb = sha3_256Hex($("av-b").value);
    $("av-hash-a").textContent = ha;
    $("av-hash-b").textContent = hb;

    const strip = $("av-bit-strip");
    strip.innerHTML = "";
    let diffBits = 0;
    for (let i = 0; i < 64; i++) {
      const xorNibble = parseInt(ha[i], 16) ^ parseInt(hb[i], 16);
      for (let bit = 3; bit >= 0; bit--) {
        const flipped = ((xorNibble >> bit) & 1) === 1;
        if (flipped) diffBits++;
        const cell = document.createElement("div");
        cell.className = "bit-cell" + (flipped ? " diff" : "");
        strip.appendChild(cell);
      }
    }
    $("av-diff-count").textContent = diffBits;
    $("av-diff-pct").textContent = ((diffBits / 256) * 100).toFixed(1) + "%";
  }

  $("av-a").addEventListener("input", renderAvalanche);
  $("av-b").addEventListener("input", renderAvalanche);

  function renderAddress() {
    const digest = sha3_256Hex($("pk-seed").value);
    $("addr-onxc").textContent = "onxc" + digest;
    $("addr-0x").textContent = "0x" + digest;
    $("addr-bare").textContent = digest;
  }
  $("pk-seed").addEventListener("input", renderAddress);

  // ── 2. ONXC TOKENOMICS & HALVING LAB ──────────────────────────────────────
  const HALVING_INTERVAL = 1_000_000;
  const INITIAL_REWARD = 45; // in ONXC for clean chart readability (9 decimals exact in nano-ONXC)
  const GENESIS_PREMINE = 10_000_000;
  const MAX_SUPPLY = 100_000_000;
  const BLOCKS_PER_YEAR = 15_778_800;

  function blockRewardONXC(h) {
    if (h === 0) return 0;
    const era = Math.floor((h - 1) / HALVING_INTERVAL);
    if (era >= 32) return 0;
    return INITIAL_REWARD / Math.pow(2, era);
  }

  function totalEmissionONXC(h) {
    if (h === 0) return 0;
    let total = 0;
    for (let era = 0; era < 32; era++) {
      const start = era * HALVING_INTERVAL + 1;
      let end = start + HALVING_INTERVAL - 1;
      if (start > h) break;
      if (end > h) end = h;
      total += (INITIAL_REWARD / Math.pow(2, era)) * (end - start + 1);
    }
    return total;
  }

  function renderTokenomics(overrideHeight) {
    const h = overrideHeight !== undefined ? overrideHeight : Number($("height-slider").value);
    if (h <= 8_000_000) $("height-slider").value = h;
    $("tok-height-label").textContent = fmtInt(h);

    const era = h === 0 ? 0 : Math.floor((h - 1) / HALVING_INTERVAL);
    const rew = blockRewardONXC(h);
    const emitted = totalEmissionONXC(h);
    const circ = Math.min(MAX_SUPPLY, GENESIS_PREMINE + emitted);
    const secs = h * 2;
    const days = secs / 86400;

    $("tok-era").textContent = era >= 32 ? era + " (0 emission)" : era;
    $("tok-reward").textContent = rew.toFixed(4).replace(/\.?0+$/, "") + " ONXC";
    $("tok-emitted").textContent = fmtInt(Math.round(emitted)) + " ONXC";
    $("tok-circ").textContent = fmtInt(Math.round(circ)) + " ONXC";
    $("tok-days").textContent = h < 100 ? fmtInt(secs) + " sec" : days.toFixed(1) + " days";
    $("bar-emitted").style.width = ((emitted / MAX_SUPPLY) * 100).toFixed(2) + "%";

    // Draw SVG supply curve
    const svg = $("tok-svg");
    const W = 720, H = 180, pad = 34;
    let pts = [];
    for (let xh = 0; xh <= 8_000_000; xh += 250_000) {
      const s = Math.min(MAX_SUPPLY, GENESIS_PREMINE + totalEmissionONXC(xh));
      const x = pad + (xh / 8_000_000) * (W - pad * 2);
      const y = H - pad - (s / MAX_SUPPLY) * (H - pad * 2);
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    const clampedH = Math.min(h, 8_000_000);
    const curS = Math.min(MAX_SUPPLY, GENESIS_PREMINE + totalEmissionONXC(clampedH));
    const cx = pad + (clampedH / 8_000_000) * (W - pad * 2);
    const cy = H - pad - (curS / MAX_SUPPLY) * (H - pad * 2);
    const capY = H - pad - 1 * (H - pad * 2);

    svg.innerHTML = `
      <line x1="${pad}" y1="${capY}" x2="${W - pad}" y2="${capY}" stroke="#ef4444" stroke-dasharray="5,5" />
      <text x="${pad + 4}" y="${capY - 6}" fill="#fca5a5" font-size="11" font-family="monospace">100,000,000 ONXC Hard Cap (Asymptote)</text>
      <line x1="${pad}" y1="${H - pad}" x2="${W - pad}" y2="${H - pad}" stroke="#334155" />
      <polyline fill="none" stroke="#22c55e" stroke-width="3" points="${pts.join(" ")}" />
      <circle cx="${cx}" cy="${cy}" r="6" fill="#38bdf8" stroke="#fff" stroke-width="2" />
      <text x="${pad}" y="${H - 10}" fill="#9fb0d4" font-size="11" font-family="monospace">Height 0 (10M Genesis)</text>
      <text x="${W - 140}" y="${H - 10}" fill="#9fb0d4" font-size="11" font-family="monospace">Height 8,000,000</text>
    `;

    // Staking APY update
    const ratioPct = Number($("stake-ratio").value);
    $("stake-ratio-lbl").textContent = ratioPct + "%";
    const annualEmission = rew * BLOCKS_PER_YEAR;
    const staked = circ * (ratioPct / 100);
    const apy = staked > 0 ? (annualEmission / staked) * 100 : 0;
    $("apy-annual").textContent = fmtInt(Math.round(annualEmission)) + " ONXC";
    $("apy-staked").textContent = fmtInt(Math.round(staked)) + " ONXC";
    $("apy-pct").textContent = apy.toFixed(2) + "%";
  }

  $("height-slider").addEventListener("input", () => renderTokenomics());
  $("stake-ratio").addEventListener("input", () => renderTokenomics());
  document.querySelectorAll(".preset-h").forEach((b) =>
    b.addEventListener("click", () => renderTokenomics(Number(b.dataset.h)))
  );

  $("conv-onxc").addEventListener("input", () => {
    const v = parseFloat($("conv-onxc").value);
    if (!Number.isNaN(v) && v >= 0) {
      $("conv-nano").value = String(Math.round(v * 1_000_000_000));
    }
  });
  $("conv-nano").addEventListener("input", () => {
    const v = parseFloat($("conv-nano").value);
    if (!Number.isNaN(v) && v >= 0) {
      $("conv-onxc").value = (v / 1_000_000_000).toFixed(9).replace(/\.?0+$/, "");
    }
  });
  $("float-bug").textContent = String(0.1 + 0.2);

  // ── 3. MEMPOOL & EIP-1559 FEES LAB ────────────────────────────────────────
  const BLOCK_GAS_LIMIT = 500_000_000;
  const TARGET_GAS = 250_000_000;
  let currentBaseFee = 10;

  function computeNextBaseFee(cur, gasUsed) {
    if (gasUsed === TARGET_GAS) return cur;
    let maxDelta = Math.floor(cur / 8);
    if (maxDelta === 0) maxDelta = 1;
    if (gasUsed > TARGET_GAS) {
      const over = gasUsed - TARGET_GAS;
      let delta = Math.floor((cur * over) / TARGET_GAS / 8);
      if (delta === 0) delta = 1;
      if (delta > maxDelta) delta = maxDelta;
      return cur + delta;
    } else {
      const under = TARGET_GAS - gasUsed;
      const delta = Math.floor((cur * under) / TARGET_GAS / 8);
      if (delta >= cur - 1) return 1;
      return cur - delta;
    }
  }

  function renderFeeSim() {
    const gasUsed = Number($("gas-used-slider").value);
    const pct = ((gasUsed / BLOCK_GAS_LIMIT) * 100).toFixed(0);
    $("gas-used-lbl").textContent = `${fmtInt(gasUsed)} (${pct}%)`;
    const bar = $("gas-util-bar");
    bar.style.width = pct + "%";
    bar.style.background = gasUsed > TARGET_GAS ? "#ef4444" : gasUsed === TARGET_GAS ? "#38bdf8" : "#22c55e";

    const next = computeNextBaseFee(currentBaseFee, gasUsed);
    const diff = next - currentBaseFee;
    const diffPct = ((diff / currentBaseFee) * 100).toFixed(1);
    $("fee-cur").textContent = currentBaseFee;
    $("fee-next").textContent = next;
    $("fee-delta").textContent = (diff >= 0 ? "+" : "") + diff + ` (${diff >= 0 ? "+" : ""}${diffPct}%)`;

    // Breakdown calc
    const gas = Number($("tx-type-select").value);
    const tier = $("fee-tier-select").value;
    let tipPerGas = 0;
    if (tier === "standard") tipPerGas = Math.max(1, Math.floor(currentBaseFee / 10));
    if (tier === "fast") tipPerGas = Math.max(1, Math.floor(currentBaseFee / 2));

    const burned = gas * currentBaseFee;
    const tip = gas * tipPerGas;
    const totalNano = burned + tip;
    const totalONXC = totalNano / 1_000_000_000;
    $("calc-burn").textContent = fmtInt(burned) + " nano-ONXC";
    $("calc-tip").textContent = fmtInt(tip) + " nano-ONXC";
    $("calc-total").textContent = totalONXC.toFixed(9) + " ($" + totalONXC.toFixed(9) + ")";
  }

  $("gas-used-slider").addEventListener("input", renderFeeSim);
  $("tx-type-select").addEventListener("change", renderFeeSim);
  $("fee-tier-select").addEventListener("change", renderFeeSim);
  $("btn-apply-block").addEventListener("click", () => {
    currentBaseFee = computeNextBaseFee(currentBaseFee, Number($("gas-used-slider").value));
    renderFeeSim();
  });
  $("btn-spam-5").addEventListener("click", () => {
    $("gas-used-slider").value = BLOCK_GAS_LIMIT;
    for (let i = 0; i < 5; i++) currentBaseFee = computeNextBaseFee(currentBaseFee, BLOCK_GAS_LIMIT);
    renderFeeSim();
  });
  $("btn-fee-reset").addEventListener("click", () => {
    currentBaseFee = 10;
    $("gas-used-slider").value = TARGET_GAS;
    renderFeeSim();
  });

  // Mempool Priority Queue
  let mpSeq = 1;
  let mempool = [];
  function resetMempool() {
    mpSeq = 1;
    mempool = [
      { sender: "Bob", gasPrice: 12, gas: 21, ts: mpSeq++ },
      { sender: "Alice", gasPrice: 20, gas: 21, ts: mpSeq++ },
      { sender: "Carol", gasPrice: 12, gas: 500, ts: mpSeq++ },
      { sender: "Dave", gasPrice: 10, gas: 50, ts: mpSeq++ },
    ];
    $("mp-msg").textContent = "Note how Bob (ts=1) beats Carol (ts=3) on tie at GasPrice=12 (FIFO fairness!).";
    renderMempool();
  }

  function sortMempool() {
    mempool.sort((a, b) => (b.gasPrice !== a.gasPrice ? b.gasPrice - a.gasPrice : a.ts - b.ts));
  }

  function renderMempool() {
    sortMempool();
    const box = $("mp-queue");
    box.innerHTML = "";
    if (mempool.length === 0) {
      box.innerHTML = '<div class="queue-item">Mempool is empty — add transactions on the left!</div>';
      return;
    }
    mempool.forEach((tx, idx) => {
      const el = document.createElement("div");
      el.className = "queue-item";
      el.innerHTML = `<span>#${idx + 1} <strong>${tx.sender}</strong> | gas=${tx.gas}</span><span><strong>${tx.gasPrice}</strong> nano/gas (ts=${tx.ts})</span>`;
      box.appendChild(el);
    });
  }

  $("btn-mp-add").addEventListener("click", () => {
    const sender = $("mp-sender").value;
    const gasPrice = Math.max(1, Number($("mp-price").value) || 1);
    const gas = Math.max(21, Number($("mp-gas").value) || 21);
    mempool.push({ sender, gasPrice, gas, ts: mpSeq++ });
    $("mp-msg").textContent = `Admitted ${sender} tx at ${gasPrice} nano-ONXC/gas (ts=${mpSeq - 1}).`;
    renderMempool();
  });

  $("btn-mp-block").addEventListener("click", () => {
    sortMempool();
    if (mempool.length === 0) return;
    const packed = mempool.splice(0, Math.min(2, mempool.length));
    $("mp-msg").textContent = "Proposer packed & purged top " + packed.map((t) => `${t.sender}(${t.gasPrice})`).join(", ") + "!";
    renderMempool();
  });
  $("btn-mp-reset").addEventListener("click", resetMempool);

  // ── 4. SPARSE MERKLE TRIE LAB ─────────────────────────────────────────────
  let selectedProofTarget = "alice";
  function leafHash(label, bal) {
    if (bal === 0 && label === "Dave") return "000000000000...ZERO";
    return sha3_256Hex(`0x01|${label}|${bal}`).slice(0, 12);
  }
  function branchHash(left, right) {
    return sha3_256Hex(`0x02|${left}|${right}`).slice(0, 12);
  }

  function renderTrie() {
    const a = Number($("smt-alice").value) || 0;
    const b = Number($("smt-bob").value) || 0;
    const c = Number($("smt-carol").value) || 0;
    const d = Number($("smt-dave").value) || 0;

    const lA = leafHash("Alice", a);
    const lB = leafHash("Bob", b);
    const lC = leafHash("Carol", c);
    const lD = leafHash("Dave", d);

    const br0 = branchHash(lA, lB);
    const br1 = branchHash(lC, lD);
    const root = branchHash(br0, br1);

    const t = selectedProofTarget;
    const colorOf = (node) => {
      if (node === "root") return "#38bdf8";
      if (t === "alice") return node === "A" ? "#22c55e" : node === "B" || node === "br1" ? "#f59e0b" : node === "br0" ? "#38bdf8" : "#334155";
      if (t === "bob") return node === "B" ? "#22c55e" : node === "A" || node === "br1" ? "#f59e0b" : node === "br0" ? "#38bdf8" : "#334155";
      if (t === "dave") return node === "D" ? "#22c55e" : node === "C" || node === "br0" ? "#f59e0b" : node === "br1" ? "#38bdf8" : "#334155";
      return "#334155";
    };

    $("smt-svg").innerHTML = `
      <line x1="320" y1="54" x2="170" y2="132" stroke="#475569" stroke-width="2" />
      <line x1="320" y1="54" x2="470" y2="132" stroke="#475569" stroke-width="2" />
      <line x1="170" y1="168" x2="90" y2="242" stroke="#475569" stroke-width="2" />
      <line x1="170" y1="168" x2="250" y2="242" stroke="#475569" stroke-width="2" />
      <line x1="470" y1="168" x2="390" y2="242" stroke="#475569" stroke-width="2" />
      <line x1="470" y1="168" x2="550" y2="242" stroke="#475569" stroke-width="2" />

      <rect x="230" y="14" width="180" height="44" rx="8" fill="#18233d" stroke="${colorOf("root")}" stroke-width="2.5"/>
      <text x="320" y="33" text-anchor="middle" fill="#eef3ff" font-size="12" font-weight="bold">StateRoot</text>
      <text x="320" y="49" text-anchor="middle" fill="#38bdf8" font-size="11" font-family="monospace">${root}</text>

      <rect x="90" y="128" width="160" height="42" rx="8" fill="#18233d" stroke="${colorOf("br0")}" stroke-width="2.5"/>
      <text x="170" y="146" text-anchor="middle" fill="#eef3ff" font-size="11">Branch 0 (bit 0)</text>
      <text x="170" y="161" text-anchor="middle" fill="#cbd5e1" font-size="11" font-family="monospace">${br0}</text>

      <rect x="390" y="128" width="160" height="42" rx="8" fill="#18233d" stroke="${colorOf("br1")}" stroke-width="2.5"/>
      <text x="470" y="146" text-anchor="middle" fill="#eef3ff" font-size="11">Branch 1 (bit 1)</text>
      <text x="470" y="161" text-anchor="middle" fill="#cbd5e1" font-size="11" font-family="monospace">${br1}</text>

      <rect x="22" y="242" width="136" height="50" rx="8" fill="#18233d" stroke="${colorOf("A")}" stroke-width="2.5"/>
      <text x="90" y="261" text-anchor="middle" fill="#eef3ff" font-size="11">Alice (${a})</text>
      <text x="90" y="279" text-anchor="middle" fill="#9fb0d4" font-size="10" font-family="monospace">${lA}</text>

      <rect x="182" y="242" width="136" height="50" rx="8" fill="#18233d" stroke="${colorOf("B")}" stroke-width="2.5"/>
      <text x="250" y="261" text-anchor="middle" fill="#eef3ff" font-size="11">Bob (${b})</text>
      <text x="250" y="279" text-anchor="middle" fill="#9fb0d4" font-size="10" font-family="monospace">${lB}</text>

      <rect x="322" y="242" width="136" height="50" rx="8" fill="#18233d" stroke="${colorOf("C")}" stroke-width="2.5"/>
      <text x="390" y="261" text-anchor="middle" fill="#eef3ff" font-size="11">Carol (${c})</text>
      <text x="390" y="279" text-anchor="middle" fill="#9fb0d4" font-size="10" font-family="monospace">${lC}</text>

      <rect x="482" y="242" width="136" height="50" rx="8" fill="#18233d" stroke="${colorOf("D")}" stroke-width="2.5"/>
      <text x="550" y="261" text-anchor="middle" fill="#eef3ff" font-size="11">${d === 0 ? "Dave (Empty)" : "Dave (" + d + ")"}</text>
      <text x="550" y="279" text-anchor="middle" fill="#9fb0d4" font-size="10" font-family="monospace">${lD.slice(0, 14)}</text>
    `;

    if (t === "alice") {
      $("smt-proof-out").innerHTML = `<strong>Merkle Proof for Alice (only 2 siblings needed!):</strong><br/>1) Leaf(Alice=${a}) = ${lA}<br/>2) Sibling #1 (Leaf Bob) = ${lB} &rarr; Branch0 = ${br0}<br/>3) Sibling #2 (Branch 1) = ${br1} &rarr; StateRoot = ${root} (MATCHES!)`;
    } else if (t === "bob") {
      $("smt-proof-out").innerHTML = `<strong>Merkle Proof for Bob:</strong><br/>1) Leaf(Bob=${b}) = ${lB}<br/>2) Sibling #1 (Leaf Alice) = ${lA} &rarr; Branch0 = ${br0}<br/>3) Sibling #2 (Branch 1) = ${br1} &rarr; StateRoot = ${root} (MATCHES!)`;
    } else {
      $("smt-proof-out").innerHTML = `<strong>Proof for Dave (${d === 0 ? "Non-Membership via zeroHash" : "Active Account"}):</strong><br/>1) Leaf(Dave) = ${lD}<br/>2) Sibling #1 (Leaf Carol) = ${lC} &rarr; Branch1 = ${br1}<br/>3) Sibling #2 (Branch 0) = ${br0} &rarr; StateRoot = ${root}`;
    }
  }

  ["smt-alice", "smt-bob", "smt-carol", "smt-dave"].forEach((id) => $(id).addEventListener("input", renderTrie));
  document.querySelectorAll("[data-proof]").forEach((b) =>
    b.addEventListener("click", () => {
      selectedProofTarget = b.dataset.proof;
      renderTrie();
    })
  );
  $("btn-smt-order").addEventListener("click", () => {
    const r = branchHash(
      branchHash(leafHash("Alice", Number($("smt-alice").value)), leafHash("Bob", Number($("smt-bob").value))),
      branchHash(leafHash("Carol", Number($("smt-carol").value)), leafHash("Dave", Number($("smt-dave").value)))
    );
    $("smt-proof-out").innerHTML = `<strong>Order-Independence Proof:</strong><br/>Order A (Alice &rarr; Bob &rarr; Carol) StateRoot = <code>${r}</code><br/>Order B (Carol &rarr; Bob &rarr; Alice) StateRoot = <code>${r}</code><br/>Identical! Bit-path of address decides tree position.`;
  });

  // ── 5. BFT CONSENSUS & DELEGATION LAB ─────────────────────────────────────
  let bftHeight = 10;
  let bftStepIdx = 0; // 0=Ready, 1=Propose, 2=Prevote, 3=Precommit, 4=Commit
  let validators = [];

  function initValidators() {
    const n = Number($("bft-n").value);
    validators = [];
    for (let i = 0; i < n; i++) {
      validators.push({ id: i, mode: "honest", stake: 10000 });
    }
    bftStepIdx = 0;
    renderBFT();
  }

  function renderBFT() {
    const n = validators.length;
    const fMax = Math.floor((n - 1) / 3);
    const q = Math.floor((2 * n) / 3) + 1;
    const proposerId = bftHeight % n;

    $("bft-n-lbl").textContent = n;
    $("bft-h").textContent = bftHeight;
    $("bft-q").textContent = `${q} / ${n}`;
    $("bft-f").textContent = `${fMax} (since N >= 3f+1)`;

    const grid = $("bft-vals");
    grid.innerHTML = "";
    validators.forEach((v) => {
      const card = document.createElement("div");
      card.className = "val-node " + (v.mode !== "honest" ? v.mode + " " : "") + (v.id === proposerId ? "proposer" : "");
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between;">
          <strong>Val #${v.id}</strong>
          ${v.id === proposerId ? '<span class="badge ok">Proposer</span>' : ""}
        </div>
        <div class="muted">Stake: ${fmtInt(v.stake)} ONXC</div>
        <div style="margin-top:6px;"><span class="badge ${v.mode === "honest" ? "ok" : v.mode === "offline" ? "warn" : "bad"}">${v.mode.toUpperCase()}</span></div>
      `;
      card.addEventListener("click", () => {
        v.mode = v.mode === "honest" ? "offline" : v.mode === "offline" ? "byzantine" : "honest";
        renderBFT();
      });
      grid.appendChild(card);
    });

    const stepNames = ["Ready", "1. StepPropose", "2. StepPrevote", "3. StepPrecommit", "4. StepCommit"];
    $("bft-step").textContent = stepNames[bftStepIdx];

    const honestCount = validators.filter((v) => v.mode === "honest").length;
    const byzCount = validators.filter((v) => v.mode === "byzantine").length;

    const pv = bftStepIdx >= 2 ? honestCount : 0;
    const pc = bftStepIdx >= 3 && pv >= q ? honestCount : 0;
    $("bft-pv").textContent = `${pv} / ${q} needed`;
    $("bft-pc").textContent = `${pc} / ${q} needed`;

    let statusText = "In Progress";
    let logText = `Proposer for height ${bftHeight}: Val #${proposerId} (rule: ${bftHeight} % ${n} = ${proposerId}).`;

    if (bftStepIdx >= 2 && pv < q) {
      statusText = "ROUND TIMEOUT (No Quorum)";
      logText = `Only ${pv} Prevotes reached (need ${q}). RoundTimeout triggers new round!`;
    } else if (bftStepIdx === 4 && pc >= q) {
      statusText = "FINALIZED (Zero Reorgs!)";
      logText = `Block #${bftHeight} committed permanently with ${pc} >= ${q} Precommits in ~2s!`;
    }

    if (byzCount > 0 && bftStepIdx >= 2) {
      const slashedNames = validators.filter((v) => v.mode === "byzantine").map((v) => `Val #${v.id} (-${Math.floor(v.stake / 10)} ONXC)`).join(", ");
      logText += ` | EQUIVOCATION DETECTED: Slashing 10% on ${slashedNames}!`;
    }

    $("bft-status").textContent = statusText;
    $("bft-log").textContent = logText;
  }

  $("bft-n").addEventListener("input", initValidators);
  $("btn-bft-next").addEventListener("click", () => {
    if (bftStepIdx < 4) bftStepIdx++;
    if (bftStepIdx === 2) {
      validators.forEach((v) => {
        if (v.mode === "byzantine" && v.stake >= 10) v.stake -= Math.floor(v.stake / 10);
      });
    }
    renderBFT();
  });
  $("btn-bft-reset").addEventListener("click", () => {
    bftHeight++;
    bftStepIdx = 0;
    renderBFT();
  });

  // Delegated Staking Math
  function calcDelegation(slash) {
    const sSelf = Math.max(0, Number($("del-self").value) || 0);
    const sA = Math.max(0, Number($("del-a").value) || 0);
    const sB = Math.max(0, Number($("del-b").value) || 0);
    const totalStake = sSelf + sA + sB;
    if (totalStake === 0) {
      $("del-out").textContent = "Total stake must be > 0.";
      return;
    }
    if (slash) {
      const slSelf = Math.floor(sSelf / 10);
      const slA = Math.floor(sA / 10);
      const slB = Math.floor(sB / 10);
      $("del-self").value = sSelf - slSelf;
      $("del-a").value = sA - slA;
      $("del-b").value = sB - slB;
      $("del-out").innerHTML = `<strong>10% Equivocation Slash Applied Proportionally:</strong><br/>Total Slashed: ${fmtInt(slSelf + slA + slB)} ONXC<br/>Validator loses -${fmtInt(slSelf)} | Alice loses -${fmtInt(slA)} | Bob loses -${fmtInt(slB)}`;
      return;
    }
    const bps = Math.min(10000, Math.max(0, Number($("del-bps").value) || 0));
    const gross = Math.max(0, Number($("del-rew").value) || 0);
    const comm = Math.floor((gross * bps) / 10000);
    const net = gross - comm;
    const rSelf = Math.floor((net * sSelf) / totalStake);
    const rA = Math.floor((net * sA) / totalStake);
    const rB = Math.floor((net * sB) / totalStake);
    $("del-out").innerHTML = `<strong>Pool Total Stake: ${fmtInt(totalStake)} ONXC | Commission (${(bps / 100).toFixed(2)}%): ${comm} ONXC</strong><br/>Net Delegator Pool: ${net} ONXC &rarr; Validator gets ${comm} + ${rSelf} = <strong>${comm + rSelf} ONXC</strong> | Alice gets <strong>${rA} ONXC</strong> | Bob gets <strong>${rB} ONXC</strong>`;
  }
  $("btn-del-reward").addEventListener("click", () => calcDelegation(false));
  $("btn-del-slash").addEventListener("click", () => calcDelegation(true));

  // ── 6. TURNSTILE PRIVACY POOL & OENEXAVM ──────────────────────────────────
  const TOTAL_POOL = 1000;
  let transPool = 1000;
  let shieldPool = 0;
  let notes = [];
  let nullifiers = [];
  let noteCounter = 1;

  function renderPrivacy() {
    $("priv-trans").textContent = fmtInt(transPool) + " ONXC";
    $("priv-shield").textContent = fmtInt(shieldPool) + " ONXC";
    $("priv-total").textContent = fmtInt(transPool + shieldPool) + " ONXC";
    const ok = transPool + shieldPool === TOTAL_POOL;
    $("priv-inv").innerHTML = ok ? '<span class="badge ok">CONSERVED</span>' : '<span class="badge bad">VIOLATION</span>';

    const list = $("priv-notes");
    list.innerHTML = "";
    notes.forEach((n) => {
      const el = document.createElement("div");
      el.className = "queue-item";
      el.innerHTML = `<span><strong>${n.id}</strong> (${n.val} ONXC) cm=${n.cm.slice(0, 10)}...</span><span class="badge ${n.spent ? "warn" : "ok"}">${n.spent ? "SPENT nf=" + n.nf.slice(0, 8) : "UNSPENT"}</span>`;
      list.appendChild(el);
    });
    if (notes.length === 0) list.innerHTML = '<div class="queue-item">No shielded notes yet. Click TxShield!</div>';
  }

  $("btn-tx-shield").addEventListener("click", () => {
    const amt = Math.max(1, Number($("priv-amt").value) || 0);
    if (amt > transPool) {
      $("priv-event").textContent = `Rejected: Insufficient transparent supply (${transPool} < ${amt}).`;
      return;
    }
    transPool -= amt;
    shieldPool += amt;
    const cm = sha3_256Hex(`OENEXA_NOTE_CM|${amt}|${noteCounter}`);
    const nf = sha3_256Hex(`OENEXA_NULLIFIER|${cm}`);
    notes.push({ id: "Note #" + noteCounter++, val: amt, cm, nf, spent: false });
    $("priv-event").textContent = `TxShield(${amt} ONXC) succeeded! Transparent=${transPool}, Shielded=${shieldPool}. Sum=${transPool + shieldPool}.`;
    renderPrivacy();
  });

  $("btn-tx-priv").addEventListener("click", () => {
    const active = notes.find((n) => !n.spent);
    if (!active) {
      $("priv-event").textContent = "No unspent shielded note available — run TxShield first!";
      return;
    }
    active.spent = true;
    nullifiers.push(active.nf);
    const cm = sha3_256Hex(`OENEXA_NOTE_CM|${active.val}|${noteCounter}`);
    const nf = sha3_256Hex(`OENEXA_NULLIFIER|${cm}`);
    notes.push({ id: "Note #" + noteCounter++, val: active.val, cm, nf, spent: false });
    $("priv-event").textContent = `TxShieldedTransfer consumed ${active.id} (published nf=${active.nf.slice(0, 12)}...) & created Note #${noteCounter - 1}. Zero supply change!`;
    renderPrivacy();
  });

  $("btn-tx-unshield").addEventListener("click", () => {
    const active = notes.find((n) => !n.spent);
    if (!active) {
      $("priv-event").textContent = "No unspent shielded note to withdraw!";
      return;
    }
    active.spent = true;
    nullifiers.push(active.nf);
    shieldPool -= active.val;
    transPool += active.val;
    $("priv-event").textContent = `TxUnshield(${active.val} ONXC) returned funds to transparent pool! Nullifier recorded.`;
    renderPrivacy();
  });

  $("btn-tx-doublespend").addEventListener("click", () => {
    if (nullifiers.length === 0) {
      $("priv-event").textContent = "Spend or unshield a note first so a Nullifier exists in NullifierSet to replay!";
      return;
    }
    $("priv-event").textContent = `BLOCKED BY CONSENSUS: "double spend detected, nullifier ${nullifiers[0].slice(0, 14)}... already exists in NullifierSet!"`;
  });

  $("btn-priv-reset").addEventListener("click", () => {
    transPool = 1000;
    shieldPool = 0;
    notes = [];
    nullifiers = [];
    noteCounter = 1;
    $("priv-event").textContent = "Turnstile reset cleanly to 1,000 ONXC Transparent / 0 Shielded.";
    renderPrivacy();
  });

  // OenexaVM Stepper
  let vmCommittedSlot = 5;
  $("btn-vm-run").addEventListener("click", () => {
    const mode = $("vm-mode").value;
    const limit = Math.max(100, Number($("vm-gaslimit").value) || 1000);
    const action = $("vm-action").value;

    if (action === "loop" && limit < 1500) {
      $("vm-out").innerHTML = `<span class="badge bad">OUT OF GAS</span> Need 1,500 gas, limit=${limit}. Execution halted &amp; reverted! Committed Slot #0 remains <strong>${vmCommittedSlot}</strong>.`;
      return;
    }
    const cost = action === "loop" ? 1500 : 450;
    if (mode === "readonly") {
      $("vm-out").innerHTML = `<span class="badge warn">READ-ONLY DRY RUN</span> Read Slot #0 = ${vmCommittedSlot} (would become ${vmCommittedSlot + 1}), gas=${cost}. <code>oen_set</code> skipped! Committed Slot #0 stays <strong>${vmCommittedSlot}</strong>.`;
      return;
    }
    vmCommittedSlot += 1;
    $("vm-out").innerHTML = `<span class="badge ok">COMMITTED</span> <code>oen_get(0)</code>=${vmCommittedSlot - 1} &rarr; <code>oen_set(0, ${vmCommittedSlot})</code>, GasUsed=${cost}/${limit}. Committed Slot #0 is now <strong>${vmCommittedSlot}</strong>.`;
  });

  // Boot all panels
  resetChain();
  renderAvalanche();
  renderAddress();
  renderTokenomics(1);
  renderFeeSim();
  resetMempool();
  renderTrie();
  initValidators();
  calcDelegation(false);
  renderPrivacy();
})();
