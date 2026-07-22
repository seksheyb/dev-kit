# Device Management

Fleet-scale IoT lives or dies on device management: how devices get onboarded,
kept up to date, monitored, and retired. These patterns apply across AWS IoT
Core, Azure IoT Hub, and self-hosted platforms (ThingsBoard, EMQX Cloud), though
exact API names differ per platform.

## Provisioning

- **Zero-touch provisioning:** devices carry a factory-installed identity
  (X.509 certificate or hardware secure element key) and self-register with the
  cloud platform on first boot, without a human typing in credentials per
  device. Both AWS IoT Core (fleet provisioning) and Azure IoT Hub (Device
  Provisioning Service) support this pattern; use it for anything shipping at
  volume.
- **Bootstrap credentials vs operational credentials:** a device's first-boot
  credential should be scoped narrowly (register-only) and exchanged for
  operational, least-privilege credentials as part of provisioning — never ship
  full operational permissions in the factory image.
- **Per-device identity, never shared secrets:** every device gets its own
  certificate/key so a single compromised device can be revoked without
  affecting the fleet. Shared fleet-wide secrets are a recurring root cause of
  mass-recall-scale security incidents.
- **Claiming/binding flow:** for consumer devices, separate "device is
  provisioned on the network" from "device is claimed by a specific user
  account" — these are different trust boundaries and should be different steps.

## Device Shadows / Digital Twins

A device shadow (AWS term) / device twin (Azure term) is a cloud-side JSON
document representing a device's last-known state, independent of whether the
device is currently connected.

- **Reported vs desired state:** the device publishes its `reported` state;
  applications write to `desired` state; the platform diffs the two and
  delivers only the delta to the device when it reconnects — this is what makes
  shadows useful for intermittently-connected devices.
- **Use shadows for configuration and command intent, not high-rate
  telemetry** — shadows represent current state, not a time series; send
  telemetry through the normal ingestion pipeline instead.
- **Version/ETag on updates** to avoid lost updates when both the device and an
  application race to update the same shadow.

## Firmware / OTA Updates

- **Staged rollout, never fleet-wide at once:** push to a small canary
  percentage first (1-5%), watch health signals (crash rate, connectivity,
  rollback rate), then widen in stages. A bad firmware push to 100% of a fleet
  simultaneously is one of the most common causes of large-scale IoT outages.
- **Signed images, verified before flashing:** the device must verify a
  cryptographic signature on the firmware image before applying it — otherwise
  OTA becomes an attack vector for pushing malicious firmware.
- **A/B (dual-bank) partitioning with automatic rollback:** flash the new image
  to the inactive bank, boot into it, and have a watchdog/health-check
  automatically revert to the last-known-good bank if the new image fails to
  come up healthy within a bounded time. Never overwrite the only working image
  in place.
- **Bandwidth-aware delivery:** for large fleets on constrained links, use delta
  patches (only the changed bytes) rather than full-image downloads, and
  throttle/schedule downloads so a rollout doesn't saturate shared uplink
  capacity (especially relevant on cellular/LoRaWAN gateways).
- **Update the update mechanism last:** treat the OTA client itself as the
  highest-risk component to update — a bug there can brick a device's ability to
  ever receive a fix. Roll those changes out even more conservatively than
  regular application firmware.

## Configuration Management

- **Desired-state configuration**, delivered the same way as commands (via
  shadow/twin desired state), rather than bespoke per-feature config channels —
  keeps the reconciliation model consistent across the fleet.
- **Versioned configs** so a device can report which config version it's
  running, enabling fleet-wide auditing of configuration drift.
- **Group-based configuration:** organize devices into groups (by type, site,
  firmware cohort) so config and OTA rollout targeting doesn't require
  per-device scripting.

## Monitoring, Diagnostics, and Commands

- **Health telemetry as a first-class stream:** connectivity state, signal
  strength, battery level, memory/storage headroom, and last-seen timestamp
  should be collected as routine telemetry, not only pulled on-demand during an
  incident.
- **Remote diagnostics commands:** support a small, well-audited set of remote
  commands (reboot, log pull, factory reset, remote shell/debug session) gated
  behind strict authorization — these are high-blast-radius operations if
  exposed insecurely.
- **Command acknowledgement and timeout:** every command sent to a device should
  have an expected ack/response with a timeout, so the fleet management system
  can distinguish "command delivered and executed," "device offline," and
  "command failed" rather than treating silence as success.
- **Audit logging:** log who issued which command/config change to which device
  and when — this is often a compliance requirement (SOC 2, ISO 27001) as well
  as an operational necessity for incident investigation.

## Lifecycle and Fleet Organization

- **Full lifecycle states:** provisioned → active → (suspended) → decommissioned
  — model these explicitly rather than only tracking "connected/disconnected,"
  so billing, support, and security posture can key off lifecycle state.
- **Decommissioning must revoke, not just delete:** revoke the device's
  certificate/credentials at the platform level (not just remove its DB record)
  so a decommissioned device — or an attacker who extracted its key — can't
  keep authenticating.
- **Fleet segmentation:** group devices by type, firmware cohort, site, and
  customer/tenant so queries, rollouts, and access policies can target a
  meaningful subset instead of "all devices" or "one device" as the only
  granularities.
- **Inventory as source of truth:** reconcile the platform's device registry
  against physical/logistics inventory periodically — "phantom" devices
  (provisioned but never shipped, or shipped but never activated) are a common
  source of stale security exposure and inaccurate fleet counts.
