---
name: llm-architect
description: Use when the task involves production LLM and AI systems — LLM architecture, serving and inference at scale (vLLM, Triton, quantization, KV cache, continuous batching), RAG pipelines, fine-tuning (LoRA/QLoRA, DPO/GRPO post-training), prompt engineering, safety guardrails and content filtering, multi-model routing, token/cost optimization, AI training pipelines, model governance and ethical AI.
---

# LLM Architect

Knowledge pack for designing and implementing production large language model and AI systems: architecture design, serving and inference at scale, RAG, fine-tuning, prompt engineering, safety mechanisms, and cost optimization — from model selection and training pipelines through deployment, monitoring, and governance.

## LLM Architecture Targets

- Inference latency < 200ms (LLM); < 100ms for standard model inference
- Token throughput > 100 tokens/second maintained
- Context window utilized efficiently
- Safety filters enabled properly
- Cost per token optimized thoroughly
- Accuracy benchmarked rigorously; model size optimized
- Bias metrics tracked; explainability implemented
- A/B testing enabled; monitoring active; scaling ready; governance established

## System Architecture

- Model selection and architecture selection
- Serving infrastructure and inference architecture
- Data pipeline and training infrastructure design
- Load balancing
- Caching strategies
- Fallback mechanisms
- Multi-model routing
- Resource allocation
- Monitoring systems and feedback loops
- Scaling strategies

## Serving Patterns

- vLLM as the primary token-generation engine (paged KV cache, continuous/inflight batching, async scheduling are table stakes; treat TGI as legacy — vLLM and SGLang have taken its mindshare)
- Triton inference server wrapped around vLLM for fleet-level routing, rate-limiting, and metrics
- Model sharding
- Quantization (FP8 on modern accelerators; 4-bit/8-bit for memory-constrained deployments)
- KV cache optimization
- Continuous batching
- Speculative decoding

## Model Optimization

- Quantization methods
- Model pruning
- Knowledge distillation
- Flash attention
- Tensor parallelism and pipeline parallelism
- Graph and compilation optimization
- Hardware acceleration
- Memory optimization and throughput tuning
- Batch processing and caching strategies

## RAG Implementation

- Document processing
- Embedding strategies
- Vector store selection
- Retrieval optimization
- Context management
- Hybrid search
- Reranking methods
- Cache strategies

## Fine-Tuning Strategies

- Dataset preparation
- Training configuration
- LoRA/QLoRA setup
- Hyperparameter tuning
- Validation strategies
- Overfitting prevention
- Model merging
- Deployment preparation

## LLM Techniques

- LoRA/QLoRA tuning
- Instruction tuning
- Preference optimization (DPO/SimPO/KTO) and GRPO/DAPO with verifiable rewards for reasoning — the default post-training pipeline, with vanilla PPO-based RLHF as the heavier legacy option
- Constitutional AI
- Chain-of-thought
- Few-shot learning
- Retrieval augmentation
- Tool use / function calling

## Prompt Engineering

- System prompts
- Few-shot examples
- Chain-of-thought prompting
- Template management
- Version control for prompts
- A/B testing
- Performance tracking

## Training Pipelines

- Data preprocessing and feature engineering
- Augmentation strategies
- Distributed training
- Experiment tracking
- Model versioning
- Resource optimization
- Checkpoint management
- Model compression before deployment

## Safety and Guardrails

- Content filtering
- Prompt injection defense
- Output validation
- Hallucination detection
- Bias detection and mitigation; fairness metrics
- Explainability tools and transparency methods
- Privacy protection and preservation
- Robustness testing
- Compliance checks and validation
- Audit logging

## Multi-Model Orchestration

- Model selection logic
- Routing strategies
- Ensemble methods
- Cascade patterns
- Specialist models
- Fallback handling
- Cost optimization
- Quality assurance

## Token and Cost Optimization

- Context compression
- Prompt optimization
- Output length control
- Batch processing
- Caching strategies
- Streaming responses
- Token counting
- Cost tracking

## AI Frameworks

- TensorFlow/Keras
- PyTorch ecosystem
- JAX for research
- ONNX for deployment
- TensorRT optimization
- Core ML for iOS; TensorFlow Lite
- OpenVINO

## Deployment Patterns

- REST API serving and gRPC endpoints
- Batch processing and stream processing
- Serverless inference
- Model caching
- Load balancing
- Edge deployment: model optimization, hardware selection, power efficiency, offline capabilities, update mechanisms, security measures

## Multi-Modal Systems

- Vision, language, and audio models
- Video analysis
- Sensor fusion
- Cross-modal learning
- Unified architectures
- Integration strategies

## Governance

- Model documentation
- Experiment tracking and version control
- Access management
- Audit trails
- Performance monitoring
- Incident response
- Continuous improvement

## MLOps Integration

- CI/CD pipelines and automated testing
- Model registry and feature stores
- Monitoring dashboards
- Rollback procedures
- Canary deployments
- Shadow mode testing

## Evaluation Methods

- Accuracy metrics
- Latency benchmarks and throughput testing
- Cost analysis
- Safety evaluation
- A/B testing
- User feedback and business metrics
- Benchmark comparison against state of the art

## Production Readiness

- Load and stress testing
- Failure modes and recovery procedures
- Rollback plans
- Monitoring alerts
- Cost controls
- Safety validation
- Documentation and training materials

## Infrastructure Patterns

- Auto-scaling
- Multi-region deployment
- Edge serving
- Hybrid cloud
- GPU optimization
- Cost allocation and resource quotas
- Disaster recovery

## Advanced Techniques

- Mixture of experts and sparse models
- Long context handling
- Multi-modal fusion
- Cross-lingual transfer
- Domain adaptation
- Continual learning
- Federated learning

## Workflow Guidance

- Define use cases, latency needs, throughput, scale, safety requirements, and budget before selecting models or designing architecture.
- Start simple and with baselines; measure everything; optimize iteratively.
- Estimate costs up front and monitor them continuously; enforce cost controls.
- Configure safety filters and validation before exposing the system; validate safety continuously.
- Test thoroughly, including failure modes; scale gradually.
- Track bias and fairness metrics; verify regulatory and compliance requirements.
- Document the system and keep monitoring, alerting, and rollback paths ready.
- Treat OTel-native instrumentation, a prompt registry, and an eval suite in CI as baseline requirements for shipping an LLM system, not optional add-ons.

## Priorities

- Performance, cost efficiency, and safety — building LLM and AI systems that deliver value through intelligent, scalable, and responsible applications while maintaining trust through transparency and reliability.
