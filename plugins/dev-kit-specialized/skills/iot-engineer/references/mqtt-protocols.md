# IoT Protocols: MQTT, CoAP, and LoRaWAN

## MQTT

MQTT is a lightweight publish/subscribe protocol over TCP, the default choice for
device-to-cloud messaging on AWS IoT Core, Azure IoT Hub, and most managed brokers
(EMQX, HiveMQ, Mosquitto).

### QoS Levels

| QoS | Guarantee | Use When |
|-----|-----------|----------|
| 0 | At most once, fire-and-forget | High-frequency telemetry where occasional loss is fine (sensor readings every second) |
| 1 | At least once, duplicates possible | Commands/state changes that must arrive, idempotent handlers |
| 2 | Exactly once, higher handshake cost | Billing-relevant events, firmware update triggers — use sparingly, it doubles round trips |

Design handlers to be idempotent so QoS 1 (the common default) never causes double
processing on retry.

### Topic Design

Use a hierarchical, device-scoped structure so ACLs and rules can filter by wildcard:

```
<tenant>/<device-type>/<device-id>/telemetry
<tenant>/<device-type>/<device-id>/state/reported
<tenant>/<device-type>/<device-id>/state/desired
<tenant>/<device-type>/<device-id>/cmd/<command-name>
```

- `+` matches a single level, `#` matches everything below — scope broker ACLs so a
  device can only subscribe/publish under its own `device-id` branch.
- Keep topic depth shallow (4-6 levels) — deep hierarchies slow broker-side matching
  at scale.
- Avoid embedding mutable data (timestamps, sequence numbers) in the topic string;
  put it in the payload.

### Connection Patterns

- **Last Will and Testament (LWT):** register an LWT message on connect so the
  broker publishes a "device offline" event if the device disconnects
  ungracefully — essential for accurate online/offline dashboards at scale.
- **Persistent sessions / clean start:** use persistent sessions for devices that
  need queued messages delivered after a reconnect (QoS 1/2); use clean sessions
  for stateless high-churn devices to avoid broker-side session buildup.
- **Keep-alive tuning:** set keep-alive intervals against real network conditions
  — too short drains battery on cellular/LoRa backhaul, too long delays LWT
  firing after a silent failure.
- **TLS everywhere:** mutual TLS (device certificate + broker certificate) is the
  baseline for production fleets; avoid username/password-only auth except for
  constrained bootstrap flows that immediately provision a certificate.

### MQTT-SN

MQTT-SN adapts the same pub/sub model for non-TCP/IP transports (Zigbee, 6LoWPAN,
low-power RF) via a gateway that bridges to full MQTT on the broker side. Use it
when devices can't carry a TCP/IP stack; the topic and QoS semantics carry over,
but topic names are typically registered once and referenced by numeric ID
afterward to save airtime.

## CoAP

CoAP is a request/response protocol over UDP modeled on REST semantics (GET/POST/
PUT/DELETE), designed for constrained devices and networks.

- **Confirmable vs non-confirmable messages:** CONs get an ACK and automatic
  retransmission with back-off; NONs are fire-and-forget — pick CON for commands,
  NON for high-rate telemetry where occasional loss is acceptable.
- **Observe option:** CoAP's Observe extension gives a pub/sub-like model over a
  request/response protocol — a client GETs a resource with the Observe option
  and receives subsequent updates without re-polling.
- **DTLS:** use DTLS (UDP's TLS equivalent) for transport security; on very
  constrained links, consider OSCORE (object security for CoAP) which secures the
  message itself rather than the transport, so it survives translation through
  proxies/gateways.
- **When to pick CoAP over MQTT:** UDP-only or highly lossy links, devices already
  doing RESTful HTTP-style integration, or when a broker hop isn't available and
  devices talk more directly to a small number of peers/gateways.

## LoRaWAN

LoRaWAN is a long-range, low-power wide-area network (LPWAN) protocol layered on
top of the LoRa radio modulation, coordinated by a network server.

### Device Classes

| Class | Behavior | Trade-off |
|-------|----------|-----------|
| A | Uplink whenever, two short downlink windows after each uplink | Lowest power, downlink only right after an uplink |
| B | Class A plus scheduled beacon-synced downlink windows | Predictable downlink latency, more power than A |
| C | Downlink windows almost always open | Lowest downlink latency, highest power draw (mains-powered devices) |

Most battery-powered sensors should default to Class A; use Class C only for
devices with reliable external power that need near-real-time commands.

### Architecture

- **End device → Gateway → Network Server → Application Server.** Gateways are
  simple packet forwarders; all MAC-layer logic (adaptive data rate, duplicate
  de-dup across gateways, session keys) lives in the network server.
- **Adaptive Data Rate (ADR):** let the network server manage spreading
  factor/data rate for static devices with good signal — it trades range for
  throughput and battery life automatically. Disable ADR for genuinely mobile
  devices where the server can't reliably infer link quality.
- **OTAA vs ABP activation:** Over-The-Air Activation (OTAA) derives session keys
  per join and should be the default — it supports key rotation and is far more
  secure. Activation By Personalization (ABP) hardcodes session keys and should
  only be used where OTAA genuinely isn't feasible.
- **Duty cycle / fair access limits:** regional regulations (e.g., sub-GHz ISM
  bands) cap transmit duty cycle — design payload size and send frequency against
  the regional limit, not just battery budget.

### Choosing Between Protocols

| Need | Reach for |
|------|-----------|
| Cloud-native pub/sub, existing broker ecosystem, moderate power budget | MQTT |
| Constrained device, UDP-only, REST-like semantics, needs proxy-safe security | CoAP (+ DTLS/OSCORE) |
| Multi-km range, years of battery life, tiny/infrequent payloads | LoRaWAN |
| Constrained mesh transport (Zigbee/6LoWPAN) still wanting pub/sub semantics | MQTT-SN |
| Carrier-grade wide-area with SIM-based provisioning | Cellular IoT (NB-IoT/LTE-M) + MQTT/CoAP on top |

Cellular IoT (NB-IoT, LTE-M) is a network-layer choice, not a competing
application protocol — it typically still carries MQTT or CoAP on top, chosen
over LoRaWAN/Zigbee when carrier SIM provisioning and wide existing coverage
outweigh LoRaWAN's lower per-message cost.
