# Edge Computing Patterns

Edge computing pushes processing toward the device/gateway layer instead of
sending every raw reading to the cloud — reducing bandwidth cost, cutting
latency, and keeping the system functional when connectivity drops.

## When to Push Logic to the Edge

- **Latency-critical control loops** (< 100ms response needed) can't tolerate a
  cloud round trip — keep the control decision local, send only the outcome
  upstream.
- **Bandwidth-constrained links** (cellular data caps, LoRaWAN duty cycles)
  reward aggregating/filtering locally rather than streaming raw samples.
- **Intermittent connectivity** requires the device/gateway to keep functioning
  (buffer, apply local rules) during an outage and reconcile once reconnected.
- **Data reduction for cost:** cloud ingestion and storage costs scale with
  message volume — pre-aggregation and filtering at the edge directly reduces
  cloud spend.

Keep raw-data forwarding for anything that feeds retraining pipelines, audits, or
anomaly investigation — over-filtering at the edge can silently destroy the
signal a data science team needs later.

## Local Processing Patterns

- **Data filtering/deduplication:** drop out-of-range or duplicate readings
  before they leave the device; apply deadband filtering (only send a value if
  it changed by more than a threshold) for slow-moving sensors like temperature.
- **Aggregation windows:** compute rolling min/max/average/count locally and
  publish one summary message per window instead of every raw sample — a common
  10-100x reduction in message volume.
- **Rule engines:** evaluate simple threshold/condition rules on-device
  (`if temp > 80 for 30s → trigger alert + local shutoff`) so safety-critical
  reactions don't depend on cloud round-trip availability.
- **ML inference at the edge:** run a pre-trained, quantized model on-device
  (anomaly detection, predictive maintenance scoring, image classification) so
  only the inference result — not the raw sensor stream or camera feed — needs
  to reach the cloud. Retraining still happens centrally on aggregated data.

## Protocol Translation (Gateway Role)

Gateways commonly sit between constrained field devices and the cloud, and are
the natural place to:

- Translate a local/legacy protocol (Modbus, BACnet, Zigbee, proprietary serial)
  into MQTT/HTTPS for cloud ingestion.
- Terminate short-range or low-power links (BLE, Zigbee, LoRa) and re-publish
  over a single cloud-facing connection, so individual devices don't each need
  their own internet-capable radio and credential set.
- Apply a device-identity mapping layer so downstream cloud services see stable
  logical device IDs regardless of which physical radio/protocol a device uses.

## Offline Operation

- **Local buffering with bounded storage:** persist unsent messages to local
  flash/disk with a size or age cap and an eviction policy (drop oldest, or drop
  lowest-priority class) so a long outage can't fill the disk or lose the most
  recent, most relevant readings.
- **Store-and-forward reconciliation:** on reconnect, replay buffered messages
  in order, tagged with original timestamps, so cloud-side time-series ordering
  stays correct despite late arrival.
- **Local decision continuity:** rule engines and safety interlocks must keep
  functioning without the cloud — never make baseline safety behavior depend on
  a live connection.
- **Conflict resolution:** if the edge takes local actions during an outage that
  also have a cloud-desired-state counterpart (device shadow), define an explicit
  reconciliation rule (last-writer-wins, edge-wins-for-safety, or manual review)
  rather than leaving it to arrive-order accident.

## Gateway Design Considerations

- **Fleet of gateways vs single gateway per site:** redundant gateways avoid a
  single point of failure for an entire site's connectivity; balance against the
  added device-affinity/failover complexity.
- **Resource management:** gateways are shared infrastructure — apply
  backpressure/rate limiting per downstream device so one noisy device can't
  starve the gateway's uplink for the rest of the site.
- **Local storage tiers:** hot buffer (recent, unsent) vs. cold local archive
  (compliance/audit retention) have different size and durability requirements —
  don't conflate them in one unbounded store.
- **Security boundary:** the gateway is a natural place to terminate device
  mutual-TLS/certificate auth and re-authenticate upstream to the cloud with its
  own gateway identity — never let a compromised leaf device's credentials
  double as cloud-wide credentials.
- **Remote manageability:** gateways need the same OTA update, monitoring, and
  diagnostics story as end devices (see `references/device-management.md`) —
  plus their own health telemetry (uplink status, local buffer depth, translated
  device count) since they're a concentration point for failure impact.

## Choosing Edge Compute Footprint

| Constraint | Typical Footprint |
|---|---|
| Microcontroller-class sensor node | Threshold rules, deadband filtering only — no ML runtime |
| Gateway/single-board computer (Raspberry Pi-class) | Aggregation, protocol translation, lightweight quantized ML inference (TensorFlow Lite / ONNX Runtime-class runtimes) |
| Industrial edge server / on-prem rack | Heavier stream processing, local dashboards, multi-site rollups before cloud sync |

Match the processing tier to the hardware's real constraints (RAM, storage,
power budget) rather than defaulting every deployment to the same footprint —
over-provisioning edge compute is a recurring source of unnecessary cost in IoT
architectures just as under-provisioning is a recurring source of unreliability.
