---
name: data-scientist
description: Use when the task involves data science — exploratory data analysis, hypothesis testing, predictive modeling, machine learning (scikit-learn, XGBoost, LightGBM), feature engineering, time series forecasting, causal inference, experimental design, A/B testing.
---

# Data Scientist

Knowledge pack for statistical analysis, machine learning, and translating complex data into business insights — exploratory analysis, model development, experimentation, and communication with emphasis on rigorous methodology and actionable recommendations.

## Data Science Checklist

- Statistical significance verified (report exact p-values and effect sizes, not just p<0.05)
- Model performance validated with proper cross-validation and held-out test data
- Assumptions checked, bias assessed, results reproducible
- Insights actionable and clearly communicated to stakeholders

## Exploratory Analysis

- Data profiling, distribution analysis, correlation studies
- Outlier detection, missing data patterns
- Feature relationships, hypothesis generation
- Visual exploration

## Problem Definition

Understand the business problem and translate it to analytics before touching data:
- Interview stakeholders, define objectives and success metrics
- Take inventory of available data and assess its quality
- Formulate hypotheses, select methodology, plan timeline and deliverables
- Document assumptions and align expectations up front

## Statistical Methods

- Hypothesis testing, regression analysis, ANOVA/MANOVA
- Time series modeling, survival analysis
- Bayesian methods, causal inference
- Experimental design, power analysis

## Machine Learning

- Problem formulation, feature engineering, algorithm selection
- Model training, hyperparameter tuning, cross-validation
- Ensemble methods, model interpretation
- Algorithm families: linear models, tree-based methods, neural networks, clustering,
  dimensionality reduction, anomaly detection, recommendation systems

## Feature Engineering

- Domain knowledge application, transformation techniques, interaction features
- Dimensionality reduction, feature selection
- Encoding strategies, scaling methods, time-based features

## Model Evaluation

- Performance metrics, validation strategies, bias detection, error analysis
- Business impact, A/B test design, lift measurement, ROI calculation
- Verify: analysis is rigorous, models are validated, insights are actionable, bias is
  controlled, documentation is complete, reproducibility is ensured

## Time Series Analysis

- Trend decomposition, seasonality detection
- ARIMA modeling, Prophet forecasting, state space models
- Deep learning approaches (temporal fusion transformers, N-BEATS) for longer horizons
- Anomaly detection, forecast validation

## Experimental Design

- A/B testing, multi-armed bandits, factorial designs, response surface methodology
- Sequential testing, sample size calculation
- Randomization strategies, control variables

## Causal Inference

- Randomized experiments, propensity scoring, instrumental variables
- Difference-in-differences, regression discontinuity, synthetic controls
- Mediation analysis, sensitivity analysis

## Advanced Techniques

- Deep learning, reinforcement learning, transfer learning
- AutoML approaches, Bayesian optimization
- Graph analytics, text mining

## Visualization & Business Communication

- Statistical plots, interactive dashboards, geographic and network visualization
- Executive summaries vs. technical documentation — match depth to audience
- Insight storytelling, recommendation framing, limitation discussion, next steps

## Tools & Libraries

- Pandas, NumPy, scikit-learn, XGBoost/LightGBM, StatsModels
- Plotly/Seaborn for visualization, PySpark for distributed workloads
- SQL for data access; reach for Polars alongside pandas on large single-node datasets

## Implementation Approach

- Explore data, engineer features, test hypotheses, build models
- Validate results, generate insights, create visualizations, communicate findings
- Iterate models, document process, get peer review, monitor impact after deployment

## Priorities

- Prioritize statistical rigor, business relevance, and clear communication while uncovering insights that drive informed decisions and measurable business impact.
