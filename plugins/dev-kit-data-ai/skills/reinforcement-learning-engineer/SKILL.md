---
name: reinforcement-learning-engineer
description: Use when the task involves reinforcement learning — RL environment design, reward engineering, policy optimization (PPO, SAC, DQN, TD3, GRPO), multi-agent RL, sim-to-real transfer, Gymnasium/Stable-Baselines3/RLlib, training RL agents for robotics, gaming, or autonomous decision-making.
---

# Reinforcement Learning Engineer

Knowledge pack for designing, training, and deploying RL agents for complex decision-making tasks — environment design, reward engineering, policy optimization algorithms, and sim-to-real transfer, with emphasis on RL systems that learn optimal strategies through interaction and generalize to real-world applications.

## RL Engineering Checklist

- Environment validated and reproducible
- Reward function designed properly
- Algorithm selected appropriately
- Training stability verified consistently
- Hyperparameters tuned thoroughly
- Evaluation metrics tracked completely
- Policy deployed successfully
- Safety constraints enforced effectively

## Environment Design

- State space definition
- Action space modeling
- Reward shaping
- Episode termination
- Observation normalization
- Multi-agent setup
- Procedural generation
- Domain randomization

## Algorithm Expertise

- Deep Q-Networks (DQN)
- Proximal Policy Optimization (PPO)
- Soft Actor-Critic (SAC)
- Twin Delayed DDPG (TD3)
- Advantage Actor-Critic (A2C/A3C)
- REINFORCE variants
- Model-based methods (Dreamer/MuZero)
- Offline RL (CQL/IQL)
- GRPO/DAPO with verifiable rewards (LLM reasoning post-training — the 2026 default for that domain, ahead of PPO-based RLHF)

## Reward Engineering

- Reward shaping strategies
- Intrinsic motivation
- Curiosity-driven exploration
- Sparse reward handling
- Multi-objective rewards
- Reward normalization
- Hindsight experience replay
- Inverse RL techniques

## Policy Optimization

- Policy gradient methods
- Value function approximation
- Actor-critic architectures
- Trust region methods
- Entropy regularization
- Gradient clipping
- Learning rate schedules
- Batch size strategies

## Training Infrastructure

- Vectorized environments
- Parallel rollout collection
- Distributed training
- GPU acceleration
- Experience replay buffers
- Prioritized sampling
- Checkpoint management
- Experiment tracking

## Exploration Strategies

- Epsilon-greedy methods
- Boltzmann exploration
- Noise injection (OU/Gaussian)
- Count-based exploration
- Random network distillation
- Go-Explore techniques
- Upper confidence bounds
- Thompson sampling

## Multi-Agent RL

- Cooperative strategies
- Competitive training
- Self-play methods
- Communication protocols
- Centralized training
- Decentralized execution
- Emergent behaviors
- Population-based training

## Sim-to-Real Transfer

- Domain randomization
- System identification
- Progressive networks
- Transfer learning
- Reality gap analysis
- Calibration methods
- Safety validation
- Deployment monitoring

## Framework Ecosystem

- Stable-Baselines3 (~v2.9, requires Python 3.10+ and Gymnasium v1.0+)
- RLlib / Ray
- Gymnasium / Farama (successor to OpenAI Gym — target this, not the archived `gym` package)
- CleanRL
- TorchRL
- JAX-based (PureJaxRL)
- Unity ML-Agents
- Isaac Gym / Sim

## Problem Formulation

Design the RL problem and environment before training.

Formulation priorities:
- MDP definition
- State representation
- Action space design
- Reward function
- Episode structure
- Safety constraints
- Evaluation protocol
- Success criteria

Environment design steps:
- Define observations
- Model dynamics
- Shape rewards
- Set terminations
- Validate physics
- Benchmark baselines
- Test edge cases
- Document interfaces

## Implementation Guidance

Implementation approach:
- Create environment
- Implement agent architecture
- Configure training loop
- Tune hyperparameters
- Monitor convergence
- Evaluate performance
- Optimize efficiency
- Deploy policy

RL patterns:
- Curriculum learning
- Reward curriculum
- Self-play training
- Imitation pretraining
- Offline-to-online
- Hierarchical policies
- Goal-conditioned agents
- Ensemble methods

## Training Excellence

- Convergence stable
- Sample efficiency high
- Reward maximized
- Variance controlled
- Exploration balanced
- Overfitting prevented
- Resources optimized
- Reproducibility ensured

## Evaluation Excellence

- Multiple seeds tested
- Statistical significance
- Out-of-distribution tested
- Adversarial evaluation
- Human baselines compared
- Ablation studies done
- Failure modes analyzed
- Reports generated

## Safety Excellence

- Constraints enforced
- Reward hacking prevented
- Safe exploration
- Bounded actions
- Fallback policies
- Monitoring active
- Anomaly detection
- Human oversight

## Deployment Excellence

- Policy exported
- Inference optimized
- Latency acceptable
- Monitoring active
- Rollback ready
- A/B testing enabled
- Scaling configured
- Alerts established

## Best Practices

- Reproducible experiments
- Seed management
- Hyperparameter logging
- Tensorboard monitoring
- Weights & Biases tracking
- Version control
- Modular codebase
- Thorough documentation

## Priorities

- Prioritize training stability, sample efficiency, and safety while building RL systems that learn robust policies through principled exploration and deliver reliable decision-making in production environments.
