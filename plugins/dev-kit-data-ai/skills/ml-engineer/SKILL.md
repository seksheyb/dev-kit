---
name: ml-engineer
description: Use when the task involves machine learning engineering — model training pipelines, feature engineering, feature stores, hyperparameter tuning, MLflow/Kubeflow/Ray/Optuna, model deployment and serving, inference optimization (quantization, pruning, ONNX, TensorRT), batch and real-time prediction, auto-scaling, drift detection, automated retraining, A/B testing, edge deployment.
---

# ML Engineer

Knowledge pack covering the complete machine learning lifecycle: pipeline development, model training, validation, and automated retraining, plus deploying, optimizing, and serving models at scale in production with reliable, performant inference infrastructure.

## ML Engineering Targets

- Model accuracy targets met
- Training time < 4 hours
- Inference latency < 100ms (aim for < 50ms)
- Throughput > 1000 RPS supported
- Model size optimized for deployment; GPU utilization > 80%
- Model drift detected automatically; retraining automated
- Versioning enabled systematically; rollback procedures ready
- Auto-scaling configured; monitoring comprehensive

## ML Pipeline Development

- Data validation first
- Feature pipeline and feature engineering
- Model selection and training orchestration
- Hyperparameter tuning and cross-validation
- Model validation and evaluation
- Deployment automation
- Monitoring setup and performance monitoring
- Retraining triggers and rollback procedures

## Feature Engineering

- Feature extraction
- Transformation pipelines
- Feature stores (online and offline features)
- Feature versioning
- Schema management
- Consistency checks between training and serving

## Model Training

- Algorithm selection
- Hyperparameter search
- Distributed training
- Resource optimization
- Checkpointing and early stopping
- Ensemble strategies
- Transfer learning

## Hyperparameter Optimization

- Search strategies: Bayesian optimization, grid search, random search
- Optuna integration
- Parallel trials
- Resource allocation
- Result tracking

## Model Validation

- Performance metrics and business metrics
- Statistical tests
- A/B testing
- Bias detection
- Explainability
- Edge cases and robustness testing

## A/B Testing

- Experiment design
- Traffic splitting
- Metric definition
- Statistical significance
- Result analysis and decision framework
- Rollout strategy
- Documentation

## Model Deployment Pipelines

- CI/CD integration
- Automated testing and model validation
- Performance benchmarking
- Security scanning
- Container building and registry management
- Progressive rollout

## Serving Infrastructure

- Load balancer setup and request routing
- Model caching and connection pooling
- Health checking and graceful shutdown
- Resource allocation
- Multi-region deployment

## Deployment Strategies

- REST endpoints and gRPC services
- Batch processing and stream processing
- Edge deployment
- Serverless functions
- Container orchestration
- Model serving frameworks

## Deployment and Release Patterns

- Blue-green deployment
- Canary releases
- Shadow mode testing
- Feature flags
- Multi-armed bandits
- Online learning
- Gradual rollouts with fallback models
- Circuit breakers, bulkhead isolation, timeout handling, retry mechanisms

## Model Optimization

- Quantization strategies
- Pruning techniques
- Knowledge distillation
- ONNX conversion
- TensorRT optimization
- Graph optimization and operator fusion
- Memory optimization

## Real-Time Inference

- Request preprocessing and response formatting
- Timeout management and circuit breaking
- Request batching and response caching
- Error handling

## Batch Prediction Systems

- Job scheduling
- Data partitioning and parallel processing
- Progress tracking and error handling
- Result aggregation
- Cost optimization and resource management

## Inference Optimization Techniques

- Dynamic batching, adaptive batching, and request coalescing
- Priority queuing
- Speculative execution
- Prefetching strategies
- Cache warming and precomputation

## Performance Tuning

- Profiling analysis and bottleneck identification
- Latency optimization and throughput maximization
- Memory management
- GPU optimization and CPU utilization
- Network optimization

## Scaling Techniques

- Horizontal scaling and load balancing
- Model sharding
- Request batching and caching predictions
- Async processing
- Resource pooling
- Auto-scaling

## Auto-Scaling Strategies

- Metric selection and threshold tuning
- Scale-up policies and scale-down rules
- Warm-up periods
- Cost controls
- Regional distribution
- Traffic prediction

## Multi-Model Serving

- Model routing and version management
- A/B testing setup and traffic splitting
- Ensemble serving and model cascading
- Fallback strategies
- Performance isolation
- Advanced serving: model composition, pipeline orchestration, conditional routing, dynamic loading, hot swapping, experiment tracking

## Edge Deployment

- Model compression
- Hardware optimization and power efficiency
- Offline capability
- Update mechanisms
- Telemetry collection
- Security hardening under resource constraints

## Monitoring and Observability

- Prediction drift and feature drift detection
- Performance decay and data quality checks
- Latency tracking and throughput monitoring
- Error rate alerts and error analysis
- Resource utilization
- Business metrics and cost tracking
- Alert configuration

## Reliability Practices

- Health checks
- Circuit breakers and retry logic
- Graceful degradation with backup models
- Disaster recovery
- SLA monitoring
- Incident response

## Container Orchestration

- Kubernetes operators
- Pod autoscaling and resource limits
- Health probes
- Service mesh and ingress control
- Secret management
- Network policies

## Tooling Ecosystem

- MLflow for tracking
- Kubeflow pipelines
- Ray for scaling
- Optuna for hyperparameter optimization
- DVC for versioning
- BentoML for serving
- Seldon for deployment
- Feature stores

## Advanced Techniques

- Online learning
- Transfer learning and multi-task learning
- Federated learning
- Active learning and semi-supervised learning
- Reinforcement learning
- Meta-learning

## Workflow Guidance

- Define the problem, assess data quality, and review infrastructure before designing pipelines.
- Start with a performance baseline; optimize the model before scaling the infrastructure.
- Use modular design and version everything: data, features, models, and configurations.
- Ensure feature consistency between training and serving.
- Deploy gradually with fallback models; handle failures gracefully; keep rollback fast.
- Monitor continuously; enable drift detection to trigger automated retraining.
- Test thoroughly, document processes, and automate wherever possible.

## Priorities

- Reliability, inference performance, and cost efficiency — while maintaining model accuracy and delivering consistent value through automated, monitored, and continuously improving ML pipelines.
