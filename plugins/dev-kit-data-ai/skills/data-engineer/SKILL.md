---
name: data-engineer
description: Use when the task involves data engineering — data pipelines, ETL/ELT, orchestration (Airflow, Prefect, Dagster), stream processing (Kafka, Flink), data lakes/warehouses (Snowflake, BigQuery, Databricks, Delta Lake), data quality, pipeline cost optimization.
---

# Data Engineer

Knowledge pack for designing and implementing comprehensive data platforms — pipeline architecture, ETL/ELT development, data lake/warehouse design, and stream processing with emphasis on scalability, reliability, and cost optimization.

## Data Engineering Checklist

- Pipeline SLA 99.9% maintained
- Data freshness < 1 hour achieved
- Zero data loss guaranteed
- Quality checks passed consistently
- Cost per TB optimized thoroughly
- Documentation complete accurately
- Monitoring enabled comprehensively
- Governance established properly

## Pipeline Architecture

- Source system analysis
- Data flow design
- Processing patterns
- Storage strategy
- Consumption layer
- Orchestration design
- Monitoring approach
- Disaster recovery

## ETL/ELT Development

- Extract strategies
- Transform logic
- Load patterns
- Error handling
- Retry mechanisms
- Data validation
- Performance tuning
- Incremental processing

## Data Lake Design

- Storage architecture
- File formats
- Partitioning strategy
- Compaction policies
- Metadata management
- Access patterns
- Cost optimization
- Lifecycle policies

## Stream Processing

- Event sourcing
- Real-time pipelines
- Windowing strategies
- State management
- Exactly-once processing
- Backpressure handling
- Schema evolution
- Monitoring setup

## Big Data Tools

- Apache Spark 4.x (ANSI SQL mode on by default — overflow/invalid casts now raise instead of silently nulling; Java 17 default runtime)
- Apache Kafka
- Apache Flink
- Apache Beam
- Databricks
- EMR/Dataproc
- Presto/Trino
- Apache Hudi/Iceberg

## Cloud Platforms

- Snowflake architecture
- BigQuery optimization
- Redshift patterns
- Azure Synapse
- Databricks lakehouse
- AWS Glue
- Delta Lake
- Data mesh

## Orchestration

- Apache Airflow 3.x (asset-based, event-driven scheduling over cron-only DAGs)
- Prefect patterns
- Dagster workflows
- Luigi pipelines
- Kubernetes jobs
- Step Functions
- Cloud Composer
- Azure Data Factory

## Data Modeling

- Dimensional modeling
- Data vault
- Star schema
- Snowflake schema
- Slowly changing dimensions
- Fact tables
- Aggregate design
- Performance optimization

## Data Quality

- Validation rules
- Completeness checks
- Consistency validation
- Accuracy verification
- Timeliness monitoring
- Uniqueness constraints
- Referential integrity
- Anomaly detection

## Cost Optimization

- Storage tiering
- Compute optimization
- Data compression
- Partition pruning
- Query optimization
- Resource scheduling
- Spot instances
- Reserved capacity

## Architecture Analysis

Design scalable data architecture before building.

Analysis priorities:
- Source assessment
- Volume estimation
- Velocity requirements
- Variety handling
- Quality needs
- SLA definition
- Cost targets
- Growth planning

Architecture evaluation:
- Review sources
- Analyze patterns
- Design pipelines
- Plan storage
- Define processing
- Establish monitoring
- Document design
- Validate approach

## Implementation Guidance

Implementation approach:
- Develop pipelines
- Configure orchestration
- Implement quality checks
- Setup monitoring
- Optimize performance
- Enable governance
- Document processes
- Deploy solutions

Engineering patterns:
- Build incrementally
- Test thoroughly
- Monitor continuously
- Optimize regularly
- Document clearly
- Automate everything
- Handle failures gracefully
- Scale efficiently

## Data Excellence

Verify the platform meets world-class standards:
- Pipelines reliable
- Performance optimal
- Costs minimized
- Quality assured
- Monitoring comprehensive
- Documentation complete
- Team enabled
- Value delivered

## Pipeline Patterns

- Idempotent design
- Checkpoint recovery
- Schema evolution
- Partition optimization
- Broadcast joins
- Cache strategies
- Parallel processing
- Resource pooling

## Data Architecture

- Lambda architecture
- Kappa architecture
- Data mesh
- Lakehouse pattern
- Medallion architecture
- Hub and spoke
- Event-driven
- Microservices

## Performance Tuning

- Query optimization
- Index strategies
- Partition design
- File formats
- Compression selection
- Cluster sizing
- Memory tuning
- I/O optimization

## Monitoring Strategies

- Pipeline metrics
- Data quality scores
- Resource utilization
- Cost tracking
- SLA monitoring
- Anomaly detection
- Alert configuration
- Dashboard design

## Governance Implementation

- Data lineage
- Access control
- Audit logging
- Compliance tracking
- Retention policies
- Privacy controls
- Change management
- Documentation standards

## Priorities

- Prioritize reliability, scalability, and cost-efficiency while building data platforms that enable analytics and drive business value through timely, quality data.
