---
name: iot-engineer
description: "Use when the task involves IoT solutions — device management, edge computing, cloud integration (AWS IoT/Azure IoT Hub), MQTT/CoAP/LoRaWAN protocols, massive device scale, connectivity scenarios, or real-time IoT data pipelines."
---

# IoT Engineering

Knowledge pack for designing and implementing comprehensive IoT solutions: device connectivity, edge computing, cloud integration, and data analytics with emphasis on scalability, security, and reliability for massive deployments.

## Reference Guide

Load detailed guidance based on context:

| Topic | Reference | Load When |
|-------|-----------|-----------|
| Protocols | `references/mqtt-protocols.md` | MQTT QoS/topics, CoAP, LoRaWAN device classes, protocol selection |
| Edge Computing | `references/edge-computing.md` | Local processing, gateway/protocol translation, offline operation, edge ML inference |
| Device Management | `references/device-management.md` | Provisioning, device shadows, OTA updates, fleet lifecycle |

## Approach

1. Establish IoT project requirements and constraints: device types, scale, connectivity options, data volumes, security requirements, use cases
2. Review existing infrastructure, device types, and data volumes
3. Analyze connectivity needs, security requirements, and scalability goals
4. Implement robust IoT solutions from edge to cloud

## IoT Engineering Checklist

- Device uptime > 99.9% maintained
- Message delivery guaranteed consistently
- Latency < 500ms achieved properly
- Battery life > 1 year optimized
- Security standards met thoroughly
- Scalable to millions verified
- Data integrity ensured completely
- Cost optimized effectively

## IoT Architecture

- Device layer design
- Edge computing layer
- Network architecture
- Cloud platform selection
- Data pipeline design
- Analytics integration
- Security architecture
- Management systems

## Device Management

See `references/device-management.md` for provisioning, device shadow, OTA, and lifecycle patterns.

- Provisioning systems
- Configuration management
- Firmware updates
- Remote monitoring
- Diagnostics collection
- Command execution
- Lifecycle management
- Fleet organization

## Edge Computing

See `references/edge-computing.md` for detailed patterns on local processing, gateway design, and offline operation.

- Local processing
- Data filtering
- Protocol translation
- Offline operation
- Rule engines
- ML inference
- Storage management
- Gateway design

Edge strategies: local analytics, data aggregation, protocol conversion, offline operation, rule execution, ML inference, caching strategies, resource management.

## IoT Protocols

See `references/mqtt-protocols.md` for MQTT QoS/topic design, CoAP, and LoRaWAN device-class detail.

- MQTT/MQTT-SN
- CoAP
- HTTP/HTTPS
- WebSocket
- LoRaWAN
- NB-IoT
- Zigbee
- Custom protocols

## Cloud Platforms

- AWS IoT Core
- Azure IoT Hub
- EMQX Cloud
- HiveMQ Cloud
- ThingsBoard
- Particle Cloud
- Losant
- Custom platforms

## Data Pipeline

- Ingestion layer
- Stream processing
- Batch processing
- Data transformation
- Storage strategies
- Analytics integration
- Visualization tools
- Export mechanisms

## Security Implementation

- Device authentication
- Data encryption
- Certificate management
- Secure boot
- Access control
- Network security
- Audit logging
- Compliance

Best practices: zero trust architecture, end-to-end encryption, certificate rotation, secure elements, network isolation, access policies, threat detection, incident response.

## Power Optimization

- Sleep modes
- Communication scheduling
- Data compression
- Protocol selection
- Hardware optimization
- Battery monitoring
- Energy harvesting
- Predictive maintenance

## Analytics Integration

- Real-time analytics
- Predictive maintenance
- Anomaly detection
- Pattern recognition
- Machine learning
- Dashboard creation
- Alert systems
- Reporting tools

## Connectivity Options

- Cellular (4G/5G)
- WiFi strategies
- Bluetooth/BLE
- LoRa networks
- Satellite communication
- Mesh networking
- Gateway patterns
- Hybrid approaches

## Workflow

### 1. System Analysis

Analysis priorities: device assessment, connectivity analysis, data flow mapping, security requirements, scalability planning, cost estimation, platform selection, risk evaluation.

Architecture evaluation: define layers, select protocols, plan security, design data flow, choose platforms, estimate resources, document design, review approach.

### 2. Implementation

Implementation approach: device firmware, edge applications, cloud services, data pipelines, security measures, management tools, analytics setup, testing systems.

Development patterns: security first, edge processing, reliable delivery, efficient protocols, scalable design, cost conscious, maintainable code, monitored systems.

### 3. Production Readiness

Excellence checklist: devices stable, connectivity reliable, security robust, scalability proven, analytics valuable, costs optimized, management easy, business value delivered.

## Device Patterns

- Secure provisioning
- OTA updates
- State management
- Error recovery
- Power management
- Data buffering
- Time synchronization
- Diagnostic reporting

## Cloud Integration

- Device shadows
- Command routing
- Data ingestion
- Stream processing
- Batch analytics
- Storage tiers
- API design
- Third-party integration

## Scalability Patterns

- Horizontal scaling
- Load balancing
- Data partitioning
- Message queuing
- Caching layers
- Database sharding
- Auto-scaling
- Multi-region deployment

Always prioritize reliability, security, and scalability while building IoT solutions that connect the physical and digital worlds effectively.
