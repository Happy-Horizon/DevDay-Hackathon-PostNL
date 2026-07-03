# Preview — Agentic Commerce × PostNL (offline)

A **fully runnable, offline** reference of the Track 2 order flow. No OpenClaw,
no Gemini, no credentials, no network — pure Python stdlib. It exists so we (as
facilitators) can verify the flow logic end-to-end *before* the day, and so
teams have a working shape to copy.

The whole point of the challenge — *an agent completes an order without ever
opening a webshop UI, and the human approves in a way they trust* — runs here in
one command.

**The model it argues for:** the agent runs fully autonomously up to the money.
There is exactly **one** unavoidable human action — completing **PostNL
Checkout**, where a single tap is *both* the approval *and* the payment. The
address comes from a saved profile, so the agent only asks when it genuinely
doesn't know. Strip everything optional away and one moment remains: the tap.

```bash
cd preview
python3 agent.py            # interactive: confirm on your (simulated) Garmin
python3 smoke_test.py       # proves every piece works — 17 checks, all green
```

## What's inside

| File | Role | Maps to (on the day) |
|---|---|---|
| `store/catalog.json` | Fake gift catalog w/ variants + stock | The commerce backend + test catalog |
| `store/profile.json` | Saved user profile (address auto-fill) | The user's stored details on the gateway |
| `store_backend.py` | Cart / draft-order / checkout logic | Commerce backend internals |
| `commerce.py` | CLI: `search / get / add-cart / cart / create-order / checkout / profile` | The real **Agent Commerce Engine** `commerce.py` |
| `agent.py` | The agent loop (intent → … → one tap) | Your **OpenClaw + Gemini** system prompt & flow |
| `garmin.py` | **GarminConfirm™** — PostNL Checkout on the wrist | Your **user-in-the-loop** (PostNL Checkout / WhatsApp / voice) |
| `smoke_test.py` | 19 assertions over CLI + agent paths | Your "does it still work" harness |

The agent talks to the store **only through `commerce.py` via subprocess** —
exactly how the OpenClaw skill invokes the real CLI. Swap `commerce.py` for the
real engine and `garmin.py` for a real channel, and `agent.py` barely changes.

## The four things it deliberately demonstrates

1. **No UI.** The agent only ever calls the CLI. A webshop is never opened.
2. **One human moment = approval + payment.** The agent creates a *non-binding
   draft* order autonomously, then `create-order` returns a **PostNL Checkout
   URL**. One tap in the PostNL app is both the "yes" and the payment. The agent
   literally cannot pay for you — that's the trust model, not a bug (briefing
   line 165).
3. **Autonomous up to the money.** Address comes from the profile; the agent
   only asks when it doesn't know. In steady state the human does exactly one
   thing: tap. GarminConfirm™ is a joke wrapper, but the lesson is real — put
   that one moment on a device the user already carries. Swap `garmin.py` for a
   real WhatsApp button / voice confirm / PostNL app push without touching the flow.
4. **Guardrails visible.** Out-of-stock, unknown variant, empty cart, expired
   checkout link, missing address, and a dismissed checkout all have explicit,
   demoable paths.

## Try the paths

```bash
python3 agent.py --auto                        # happy path (address from profile)
python3 agent.py --auto --decline              # human dismisses checkout → clean abort, nothing charged
python3 agent.py --auto --scenario oos         # out-of-stock guardrail fires
python3 agent.py --auto --unknown-address      # the ONE extra question, when address is unknown
python3 agent.py --intent "iets met thee" --budget 25   # different intent + budget
python3 garmin.py                              # just the watch UI
```

Every path returns a distinct exit code (`0` ok, `10` declined, `3` guardrail),
so it's easy to assert on — see `smoke_test.py`.

---

## Facilitator note — hints to drop, by phase

**Kickoff.** Ask each team one question: *"At which moment, through which
channel, does the human say yes — and why do they trust it?"* Teams that answer
this early build the winning thing; teams that defer it get stuck after lunch.

**After discovery works.** Push them onto the unhappy paths (extension point 7).
A demo where the agent refuses ("bedrag klopt niet, ik bestel niet") beats a
glossy happy path. This preview shows five such paths — point them at it.

**Voice is a trap.** Gemini Live Talk demos great but function-calling over
WebSocket is fragile under time pressure. Advise: get the flow rock-solid in
text/Slack first, add voice last.

**Scope discipline.** One scenario fully working > three at 60%. "Snel cadeau in
< 2 min, geen UI" complete is a better 5-minute pitch than multi-channel
orchestration that flakes.

**PostNL Checkout is the trust link, not a payment link.** The strong framing:
the agent does discovery/choice, but confirmation in the PostNL app is the
deliberate moment the human takes control back. That's a story, not an integration.

## Honest limits (what this does *not* do)

- No real LLM — the agent reasoning is deterministic/scripted so the demo is
  reproducible. On the day, Gemini does this.
- No real payment, shipping, or PostNL MCP calls — all mocked locally.
- Delivery dates / ServicePunten are cosmetic strings, not `postnl-mcp` output.

For production you'd need: real auth on the commerce backend, a real approval
channel with signed/expiring links, idempotent order creation, and error
handling on every external call.
