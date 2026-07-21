# Data / AI Engineer

## Data Engineering & Analysis

#### `data-analyst` (skill)

- **Why needed:** Business stakeholders need SQL analysis, BI dashboards, and clear metric definitions translated into decisions — a business-facing discipline distinct from ML model-building.
- **What it does:** Covers SQL query optimization (window functions, CTEs, query plans), BI dashboard development (Tableau, Power BI, Looker), KPI/metric standardization, statistical analysis (hypothesis testing, regression, confidence intervals), cohort/funnel/retention analysis, A/B test evaluation, and data storytelling for executive audiences.
- **Why not vanilla Claude Code:** Encodes concrete quality bars (query performance <30s, statistical significance verification) and BI-specific patterns (star schema, slowly changing dimensions) that a generic answer tends to skip or handle inconsistently.
- **When to use:** "business data analysis — SQL queries, BI dashboards (Tableau, Power BI, Looker), KPI/metric definition, cohort/funnel/retention analysis, A/B test evaluation, reporting, data storytelling."
- **Then what:** Findings often route to `data-scientist` for deeper modeling, or `data-engineer` if the underlying data pipeline needs work.
- **Notes:** Distinguish from `data-scientist` — data-analyst stays in reporting/BI/stakeholder communication; data-scientist goes into predictive modeling and causal inference.

#### `data-engineer` (skill)

- **Why needed:** Reliable, cost-efficient data pipelines and warehouses are the foundation every downstream analyst, scientist, or ML engineer depends on.
- **What it does:** Pipeline architecture, ETL/ELT development, stream processing (Kafka, Flink), data lake/warehouse design (Snowflake, BigQuery, Databricks, Delta Lake), orchestration (Airflow, Prefect, Dagster), data modeling (star schema, data vault), data quality checks, and cost optimization.
- **Why not vanilla Claude Code:** Bakes in SLA-driven targets (99.9% pipeline uptime, <1hr freshness, zero data loss) and architecture pattern tradeoffs (medallion, lambda/kappa, data mesh) that require deliberate cross-tool decisions rather than a one-off script.
- **When to use:** "data engineering — data pipelines, ETL/ELT, orchestration (Airflow, Prefect, Dagster), stream processing (Kafka, Flink), data lakes/warehouses (Snowflake, BigQuery, Databricks, Delta Lake), data quality, pipeline cost optimization."
- **Then what:** Delivers curated, reliable data that `data-analyst`, `data-scientist`, and `ml-engineer` build on.
- **Notes:** Distinct from `ml-pipeline` — data-engineer moves and transforms general business data; ml-pipeline is specifically the ML training/experiment lifecycle infrastructure (MLflow, feature stores, Kubeflow).

#### `data-scientist` (skill)

- **Why needed:** Answering "why did this happen" and "what will happen" requires statistical rigor and predictive modeling beyond dashboarding.
- **What it does:** Exploratory data analysis, hypothesis testing, feature engineering, ML model development (scikit-learn, XGBoost, LightGBM), time series forecasting, causal inference (propensity scoring, instrumental variables, difference-in-differences), and experimental design with power analysis.
- **Why not vanilla Claude Code:** Applies a statistical-rigor checklist (p<0.05 significance, cross-validation, bias detection, reproducibility) and causal-inference methodology that ad hoc prompting frequently gets wrong or skips entirely.
- **When to use:** "data science — exploratory data analysis, hypothesis testing, predictive modeling, machine learning (scikit-learn, XGBoost, LightGBM), feature engineering, time series forecasting, causal inference, experimental design, A/B testing."
- **Then what:** Validated models hand off to `ml-engineer` for productionization; insights hand off to `data-analyst` for stakeholder-facing dashboards.
- **Notes:** Overlaps with `data-analyst` on A/B testing but goes further into causal inference and model-building; overlaps with `ml-engineer` but stops at experimentation rather than production deployment.

#### `pandas-pro` (skill)

- **Why needed:** Efficient, correct DataFrame code is a shared low-level need across analysis and engineering work — a code-producing skill rather than a strategic knowledge pack.
- **What it does:** Vectorized transformations, safe subsetting with `.copy()`/`.loc`, groupby aggregation, merge validation (`validate='m:1'`, unmatched-row checks), missing-value handling, time series resampling, pivot tables, and memory optimization via categorical dtypes and downcasting.
- **Why not vanilla Claude Code:** Enforces specific anti-patterns (never `.iterrows()`, never chained indexing, always `.copy()` before mutating a subset) that Claude's default pandas code often violates, producing `SettingWithCopyWarning` or silent bugs.
- **When to use:** "pandas DataFrame operations, data cleaning, aggregation, merging, or time series analysis... joining DataFrames on multiple keys, pivoting tables, resampling time series, handling NaN values, groupby aggregations, type conversion, or performance optimization of large datasets."
- **Then what:** Produces code with built-in validation asserts (row counts, null counts, column sets) ready to drop into a larger analysis.
- **Notes:** Narrower and more implementation-focused than `data-analyst`/`data-scientist` — a tool both of those roles reach for directly.

#### `spark-engineer` (skill)

- **Why needed:** Distributed processing is needed once data volume exceeds what a single machine or pandas can handle.
- **What it does:** PySpark DataFrame API and Spark SQL, RDD operations, partitioning and broadcast joins, shuffle tuning, salting to fix data skew, structured streaming with watermarks, and explicit schema definition for production jobs.
- **Why not vanilla Claude Code:** Codifies distributed-systems pitfalls that only surface under real cluster load — never `collect()` on large datasets, the default 200 shuffle partitions is usually wrong, UDFs run 10-100x slower than built-ins.
- **When to use:** "writing Spark jobs, debugging performance issues, or configuring cluster settings for Apache Spark applications... DataFrame transformations, optimize Spark SQL queries, implement RDD pipelines, tune shuffle operations, configure executor memory, process .parquet files, handle data partitioning, or build structured streaming analytics."
- **Then what:** Delivers code plus configuration recommendations (executor memory, shuffle partitions) and Spark UI metrics to monitor.
- **Notes:** Complements `data-engineer` for the specific case of Spark-based large-scale processing rather than general pipeline architecture.

## ML/LLM Engineering

#### `ml-engineer` (skill)

- **Why needed:** Getting a model into reliable production — training pipelines through serving at scale — is a distinct lifecycle from building the model itself.
- **What it does:** Feature engineering and feature stores, hyperparameter tuning (MLflow, Kubeflow, Ray, Optuna), model deployment strategies (blue-green, canary, shadow mode), inference optimization (quantization, pruning, ONNX, TensorRT), auto-scaling, drift detection, automated retraining, and production A/B testing.
- **Why not vanilla Claude Code:** Encodes production reliability patterns (circuit breakers, graceful degradation, train/serve feature consistency checks) and hard latency/throughput targets (<100ms inference, >1000 RPS) that go beyond model-fitting code.
- **When to use:** "machine learning engineering — model training pipelines, feature engineering, feature stores, hyperparameter tuning, MLflow/Kubeflow/Ray/Optuna, model deployment and serving, inference optimization (quantization, pruning, ONNX, TensorRT), batch and real-time prediction, auto-scaling, drift detection, automated retraining, A/B testing, edge deployment."
- **Then what:** Works with `ml-pipeline` for the underlying orchestration infrastructure, and with `data-scientist` upstream for the model itself.
- **Notes:** `ml-engineer` is the broad lifecycle knowledge pack (checklists, targets, strategy); `ml-pipeline` is the narrower code-generating skill for the pipeline infrastructure itself.

#### `ml-pipeline` (skill)

- **Why needed:** Someone has to actually build the MLOps infrastructure — orchestration, experiment tracking, feature stores — not just reason about lifecycle strategy.
- **What it does:** Configures experiment tracking (MLflow, Weights & Biases), builds Kubeflow/Airflow DAGs, Feast feature store schemas, model registries, DVC data versioning, Great Expectations data validation gates, and automated retraining/validation workflows.
- **Why not vanilla Claude Code:** Enforces hard constraints (never train without experiment tracking, never deploy without recorded validation metrics, pin random seeds) and ships runnable templates (MLflow logging block, Kubeflow component, Great-Expectations-style validation checkpoint) that vanilla Claude would improvise inconsistently.
- **When to use:** "building ML pipelines, orchestrating training workflows, automating model lifecycle, implementing feature stores, managing experiment tracking systems, setting up DVC for data versioning, tuning hyperparameters, or configuring MLOps tooling like Kubeflow, Airflow, MLflow, or Prefect."
- **Then what:** Produces a pipeline DAG, training script, evaluation gate, and deployment config as one bundle.
- **Notes:** Pairs with `ml-engineer` — ml-engineer is the "what and why" lifecycle knowledge, ml-pipeline is the "how" implementation with runnable code templates.

#### `fine-tuning-expert` (skill)

- **Why needed:** Adapting a foundation model to a specific task requires careful method selection (LoRA vs. QLoRA vs. full fine-tune) and hyperparameter discipline that generic guidance gets wrong.
- **What it does:** Dataset preparation and validation, PEFT method selection (LoRA for most tasks, QLoRA when GPU memory is constrained), hyperparameter configuration (rank, alpha, warmup, cosine schedule), training via Hugging Face PEFT/TRL SFTTrainer, adapter merging, quantization, and deployment benchmarking.
- **Why not vanilla Claude Code:** Ships a complete working LoRA/QLoRA example with specific gotchas (rank-to-alpha ratio, mandatory warmup, adapter-compatibility checks before merging) and requires perplexity/task-metric/latency evaluation before deployment, rather than treating training as a black-box `trainer.fit()` call.
- **When to use:** "fine-tuning LLMs, training custom models, or adapting foundation models for specific tasks... configuring LoRA/QLoRA adapters, preparing JSONL training datasets, setting hyperparameters for fine-tuning runs, adapter training, transfer learning... instruction tuning, RLHF, DPO, or quantizing and deploying fine-tuned models."
- **Then what:** Hands the merged/quantized model to `ml-engineer` or `llm-architect` for serving.
- **Notes:** Overlaps with `llm-architect`'s "Fine-Tuning Strategies" section but is the hands-on, code-producing implementer; `llm-architect` stays at system-architecture altitude.

#### `nlp-engineer` (skill)

- **Why needed:** Classic NLP tasks — NER, classification, translation, QA, sentiment — often need task-specific training and multilingual handling distinct from general LLM prompting.
- **What it does:** Text preprocessing pipelines, named entity recognition, text classification (zero/few-shot, multi-label, hierarchical), machine translation, extractive/generative question answering, sentiment analysis, information extraction, conversational AI (dialogue management, slot filling), and model optimization (distillation, ONNX) for edge/production NLP.
- **Why not vanilla Claude Code:** Applies task-specific accuracy/latency targets (F1 > 0.85, <100ms, model <1GB) and multilingual/domain-adaptation discipline (low-resource languages, code-switching) that generic LLM prompting doesn't address.
- **When to use:** "natural language processing — text processing pipelines, transformer models, named entity recognition, text classification, sentiment analysis, machine translation, question answering, language model fine-tuning, multilingual NLP."
- **Then what:** Often uses `fine-tuning-expert` for the actual adapter/model training step.
- **Notes:** Differs from `prompt-engineer`/`llm-architect` — nlp-engineer covers traditional supervised/transformer NLP tasks and non-LLM pipelines, not just LLM prompting.

#### `reinforcement-learning-engineer` (skill)

- **Why needed:** RL is a fundamentally different paradigm — reward-driven, sequential decision-making — requiring environment design and policy-training expertise no other skill in this set covers.
- **What it does:** RL environment/state/action space design, reward engineering (shaping, sparse rewards, curiosity-driven exploration), policy optimization algorithms (PPO, SAC, DQN, TD3), multi-agent RL (self-play, cooperative/competitive training), sim-to-real transfer (domain randomization), and tooling (Gymnasium, Stable-Baselines3, RLlib).
- **Why not vanilla Claude Code:** Encodes RL-specific failure modes (reward hacking, training instability, sample inefficiency) and safety practices (bounded actions, fallback policies) that require specialized algorithm knowledge well beyond typical supervised-ML guidance.
- **When to use:** "reinforcement learning — RL environment design, reward engineering, policy optimization (PPO, SAC, DQN, TD3), multi-agent RL, sim-to-real transfer, Gymnasium/Stable-Baselines3/RLlib, training RL agents for robotics, gaming, or autonomous decision-making."
- **Then what:** Hands the trained policy to `ml-engineer` for deployment, serving, and monitoring.
- **Notes:** A standalone specialty — no other skill in this catalog covers reward design or policy-gradient methods.

#### `llm-architect` (skill)

- **Why needed:** Production LLM systems require systems-architecture decisions — serving infrastructure, model routing, cost/latency tradeoffs, safety — beyond a single prompt or model call.
- **What it does:** Full production LLM system design: serving/inference at scale (vLLM, TGI, Triton, quantization, continuous batching), RAG implementation, fine-tuning strategy, multi-model routing/orchestration, safety guardrails, token/cost optimization, MLOps integration, and governance.
- **Why not vanilla Claude Code:** Encodes concrete latency/throughput targets (<200ms, >100 tokens/sec) and cross-cutting production concerns (governance, bias/fairness tracking, incident response) that require balancing many subsystems at once — something a single-turn answer wouldn't structure on its own.
- **When to use:** "production LLM and AI systems — LLM architecture, serving and inference at scale (vLLM, TGI, Triton, quantization, KV cache, continuous batching), RAG pipelines, fine-tuning (LoRA/QLoRA, RLHF), prompt engineering, safety guardrails and content filtering, multi-model routing, token/cost optimization, AI training pipelines, model governance and ethical AI."
- **Then what:** Delegates RAG-specific depth to `rag-architect` and prompt-specific depth to `prompt-engineer` while owning the overall system design.
- **Notes:** The broadest and highest-altitude of the three LLM skills — `rag-architect` and `prompt-engineer` are its specialized sub-disciplines with deeper, code-level guidance.

#### `rag-architect` (skill)

- **Why needed:** Retrieval quality — not just LLM output quality — is the primary failure surface in knowledge-grounded AI apps, and it needs its own engineering discipline.
- **What it does:** Chunking strategy (splitter configuration, semantic boundaries, metadata enrichment), embedding model selection, vector store design (Pinecone, Weaviate, Chroma, pgvector, Qdrant), hybrid search (dense + BM25 with reciprocal rank fusion), reranking (Cohere rerank), and retrieval evaluation with RAGAS (context precision/recall, faithfulness, answer relevancy).
- **Why not vanilla Claude Code:** Ships concrete anti-defaults ("never use the default 512 chunk size without evaluation," idempotent ingestion via deterministic IDs, metadata filters for multi-tenancy) and requires measured precision@k/recall@k targets before wiring into an LLM — details vanilla RAG code usually skips.
- **When to use:** "building RAG systems, vector databases, or knowledge-grounded AI applications requiring semantic search, document retrieval, context augmentation, similarity search, or embedding-based indexing."
- **Then what:** Retrieved context feeds into an LLM call designed with `prompt-engineer` or a fine-tuned model from `fine-tuning-expert`.
- **Notes:** Goes far deeper than `llm-architect`'s "RAG Implementation" section — this is the dedicated skill for anyone actually building the retrieval pipeline.

#### `prompt-engineer` (skill)

- **Why needed:** Prompt design and testing is a distinct discipline from system architecture — reliability of any LLM call rests on rigorous, evaluated prompt engineering, not one-off wording.
- **What it does:** Designs prompts across patterns (zero-shot, few-shot, chain-of-thought, ReAct), builds structured output schemas (JSON mode, function calling), writes system prompts with personas/guardrails, develops evaluation and test-suite frameworks, and manages context-window degradation ("lost in the middle").
- **Why not vanilla Claude Code:** Mandates systematic evaluation before deployment (diverse and edge-case test inputs, quantitative accuracy metrics, one change at a time when debugging) rather than the ad hoc single-shot prompt tweaking Claude defaults to.
- **When to use:** "designing prompts for new LLM applications, refactoring existing prompts for better accuracy or token efficiency, implementing chain-of-thought or few-shot learning, creating system prompts with personas and guardrails, building JSON/function-calling schemas, or developing prompt evaluation frameworks."
- **Then what:** Hands off validated prompt templates plus a test suite to whichever system (RAG, agent, chatbot) consumes them.
- **Notes:** The fine-grained, prompt-level counterpart to `llm-architect`'s system-level "Prompt Engineering" section.

## AI System Design & Evaluation

#### `framework-selector` (agent)

- **Why needed:** Choosing among LangChain, LangGraph, CrewAI, LlamaIndex, OpenAI Agents SDK, and others up front avoids costly rework; the right choice depends on interacting factors (system type, model provider, team stage, language, constraints).
- **What it does:** Scans the codebase for existing framework signals first, runs a ≤6-question interview via `AskUserQuestion`, eliminates frameworks that fail hard constraints, scores the remainder against a maintained decision matrix, and returns a ranked primary and alternative recommendation with rationale.
- **Why not vanilla Claude Code:** Replaces an ungrounded single-shot opinion with a structured elimination-and-scoring process against a maintained framework-tradeoffs reference (`references/gsd/ai-frameworks.md`), rather than whichever framework happens to be top-of-mind.
- **When to use:** "Presents an interactive decision matrix to surface the right AI/LLM framework for the user's specific use case" — before committing to an AI/LLM stack.
- **Then what:** Its recommendation feeds `ai-researcher` (to research the chosen framework's docs) and `eval-planner` (system type informs eval dimensions).
- **Notes:** The entry point of a three-agent AI-integration pipeline — used before `ai-researcher` and `eval-planner`, not after.

#### `ai-researcher` (agent)

- **Why needed:** Turning a framework choice into implementation-ready guidance requires consulting live official docs rather than relying on a model's possibly-stale training knowledge of fast-moving AI frameworks.
- **What it does:** Fetches 2-4 pages of official docs (via Context7 MCP or CLI fallback) for the chosen framework and system type, extracts install commands, imports, entry-point patterns, and pitfalls, and writes the Framework Quick Reference, Implementation Guidance, and AI Systems Best Practices (structured outputs, async-first design, prompt discipline, context-window management, cost/latency budget) sections of AI-SPEC.md.
- **Why not vanilla Claude Code:** Forces doc-verified specifics (real install commands, actual import paths, no hallucinated API methods) instead of the plausible-but-wrong framework code an unaided answer produces for libraries that change quickly.
- **When to use:** "Researches a chosen AI framework's official docs to produce implementation-ready guidance — best practices, syntax, core patterns, and pitfalls distilled for the specific use case."
- **Then what:** Hands the populated AI-SPEC.md sections to `eval-planner` to design an evaluation strategy against this concrete implementation.
- **Notes:** Runs inside the AI-integration phase pipeline, writing specific numbered sections of a shared AI-SPEC.md document.

#### `eval-planner` (agent)

- **Why needed:** "How will we know this AI system works" must be answered with measurable, tooled criteria before or during implementation, not bolted on afterward.
- **What it does:** Maps the system type (RAG, Multi-Agent, Conversational, Extraction, Autonomous, Content, Code) to required eval dimensions, writes PASS/FAIL rubrics per dimension with a measurement approach (Code / LLM Judge / Human), selects eval tooling (RAGAS, Promptfoo, Arize Phoenix, LangSmith) by detecting what's already in use before defaulting, specifies the reference dataset (size, composition, labeling), and designs online guardrails versus offline flywheel metrics.
- **Why not vanilla Claude Code:** Forces concrete, domain-specific PASS/FAIL rubrics and a detected-not-assumed tooling choice rather than generic "add some tests" advice, and always includes safety and task-completion dimensions even if not explicitly requested.
- **When to use:** "Designs a structured evaluation strategy for an AI phase. Identifies critical failure modes, selects eval dimensions with rubrics, recommends tooling, and specifies the reference dataset."
- **Then what:** The resulting AI-SPEC.md eval plan becomes the benchmark `eval-auditor` checks against after implementation.
- **Notes:** Forms a before/after pair with `eval-auditor` — eval-planner writes the plan pre-implementation, eval-auditor scores actual coverage post-implementation against that same plan.

#### `eval-auditor` (agent)

- **Why needed:** Verifies retroactively that an implemented AI system actually delivers the evaluation coverage that was planned, rather than assuming documentation equals implementation.
- **What it does:** Reads AI-SPEC.md's planned eval strategy plus phase SUMMARY/PLAN files, scans the codebase for eval/test files, tracing setups (Langfuse, LangSmith, Arize/Phoenix, Braintrust, Promptfoo), guardrail implementations, and reference datasets; scores each planned dimension COVERED/PARTIAL/MISSING, audits five infrastructure components, computes a weighted overall score and verdict, and writes a scored EVAL-REVIEW.md.
- **Why not vanilla Claude Code:** Takes an explicitly adversarial "assume not implemented until proven" stance — treating partial coverage of a critical dimension as MISSING/BLOCKER rather than crediting good intentions — catching gaps a self-assessment or vanilla review would soften.
- **When to use:** "Retroactive audit of an implemented AI phase's evaluation coverage. Checks implementation against the AI-SPEC.md evaluation plan."
- **Then what:** Produces a remediation plan (must-fix / should-fix / nice-to-have) that routes back into implementation work.
- **Notes:** The audit counterpart to `eval-planner`; together they close the loop between planned and delivered AI evaluation.
