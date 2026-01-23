# ML Training Guide

This guide explains how to use the ML Training feature, including data requirements, model types, and performance metrics.

---

## Table of Contents

- [Current Database Status](#current-database-status)
- [Data Requirements by Model](#data-requirements-by-model)
- [How to Add More Data](#how-to-add-more-data)
- [Understanding ML Metrics](#understanding-ml-metrics)
- [Troubleshooting](#troubleshooting)

---

## Current Database Status

### Available Data

- **Revenue**: 10 total entries (7 approved)
- **Expenses**: 11 total entries (8 approved)
- **Sales History**: 6 total records

### Why This Isn't Enough

> [!WARNING]
> Most ML models require significantly more data to produce reliable forecasts.

- **Prophet/LSTM**: Need at least **36 data points** to identify reliable trends
- **ARIMA**: Need at least **10 approved entries** (you're close!)
- **Inventory SARIMA**: Needs significantly more sales history to reconstruct past inventory levels

> [!TIP]
> If you approve the remaining 3 revenue entries and 3 expense entries, basic ARIMA models should start working.

---

## Data Requirements by Model

| Model | Minimum Data Points | Best For |
|-------|---------------------|----------|
| **Linear Regression** | 5 | Simple trends, quick baseline |
| **ARIMA** | 10 | Short-term forecasting, stationary data |
| **XGBoost** | 12 | Non-linear patterns, feature-rich data |
| **LSTM** | 12 | Sequential patterns, time dependencies |
| **Prophet** | 36 | Seasonal trends, holidays, long-term forecasts |
| **SARIMA** | 36+ | Inventory with seasonal patterns |

---

## How to Add More Data

### Option 1: Update CSV Files Manually

1. Navigate to `backend/data/` directory
2. Edit the CSV files to add historical data:
   - `revenue.csv` - Add rows for past income (Date, Amount, Category)
   - `expenses.csv` - Add rows for past spending (Date, Amount, Category)
   - `inventory.csv` - Add rows for products and stock levels

> [!IMPORTANT]
> Use ISO Date Format: `YYYY-MM-DD` (e.g., `2023-12-31`)

### Option 2: Run the Import Script

Once you've updated the CSV files, load them into the database:

```bash
cd backend
python import_csv_data.py --all
```

> [!NOTE]
> Imported data is automatically marked as **Approved**, so you can immediately train models.

### Option 3: Generate Sample Data

For testing purposes, you can generate realistic sample data covering 2 years of Revenue, Expenses, and Sales.

---

## Understanding ML Metrics

### MAE (Mean Absolute Error)

**What it means**: Measures how far predictions are from actual values on average, without caring about direction.

**Formula**:

```
MAE = (1/n) × Σ|yᵢ - ŷᵢ|
```

Where:
- `yᵢ` = actual (true) value
- `ŷᵢ` = predicted value
- `n` = number of samples
- `|·|` = absolute value

**Example**:

| Actual | Predicted | Error |
|--------|-----------|-------|
| 10 | 12 | 2 |
| 20 | 18 | 2 |
| 30 | 25 | 5 |

```
MAE = (2 + 2 + 5) / 3 = 3
```

**Interpretation**: On average, the model is off by 3 units.

**When to use**:
- ✅ Easy to understand (same unit as target)
- ✅ Treats all errors equally
- ✅ Less sensitive to outliers than RMSE

---

### RMSE (Root Mean Squared Error)

**What it means**: Measures the average size of prediction errors, but penalizes large errors more heavily than MAE.

**Formula**:

```
RMSE = √[(1/n) × Σ(yᵢ - ŷᵢ)²]
```

**Example** (same data as above):

| Actual | Predicted | Squared Error |
|--------|-----------|---------------|
| 10 | 12 | 4 |
| 20 | 18 | 4 |
| 30 | 25 | 25 |

```
MSE = (4 + 4 + 25) / 3 = 11
RMSE = √11 ≈ 3.32
```

**When to use**:
- ✅ Same unit as target variable
- ✅ Penalizes large errors strongly
- ⚠️ More sensitive to outliers

---

### MAE vs RMSE Comparison

| Metric | Penalizes Large Errors | Sensitive to Outliers | Easy to Interpret |
|--------|------------------------|----------------------|-------------------|
| **MAE** | ❌ No (linear) | Low | ✅ Yes |
| **RMSE** | ✅ Yes (squared) | High | ✅ Yes |

> [!TIP]
> Use **MAE** when all errors matter equally. Use **RMSE** when you want to heavily penalize large prediction errors.

---

## Troubleshooting

### Common Issues

#### "Insufficient data" Errors

If you see logs like:
```
DEBUG - expense arima skipped: Insufficient data: need at least 10 data points, got 1
```

**Solution**: Add more approved entries to your database (see [How to Add More Data](#how-to-add-more-data))

#### UnicodeEncodeError in Logs

If you see:
```
UnicodeEncodeError: 'charmap' codec can't encode characters
```

**Cause**: Emoji characters in log messages on Windows systems with CP1252 encoding.

**Solution**: This is a known issue and doesn't affect functionality. The models still train correctly.

#### "No models successfully trained"

**Cause**: None of the models have enough data to train.

**Solution**: 
1. Check the minimum data requirements table above
2. Add more historical data
3. Approve pending entries in the database

---

## Next Steps

After adding sufficient data:

1. Navigate to the **ML Training** page in the frontend
2. Click **"Train All Models"**
3. Wait for training to complete
4. View forecasts and model performance metrics
5. Compare different models to find the best fit for your data

> [!NOTE]
> Training may take several minutes depending on the amount of data and number of models.



how all this works in ai 

Great question — this is where the pieces click together 🔗🤖
Let’s connect MAE, RMSE, and AI in a simple, exam-friendly way.

1️⃣ Where MAE & RMSE fit in AI

In AI / Machine Learning, especially regression problems, the workflow is:

Data → Model → Predictions → Error → Learning

MAE and RMSE are error metrics that tell the AI how wrong it is.

2️⃣ Step-by-step: how it works
🧠 Step 1: AI makes predictions

You train a model (Linear Regression, Neural Network, etc.).

Example:

Input: house size

Output: predicted house price

The model predicts:

𝑦
^
=
model
(
𝑥
)
y
^
	​

=model(x)
📊 Step 2: Compare prediction with reality

You compare:

Actual value 
𝑦
y

Predicted value 
𝑦
^
y
^
	​


This difference is called error:

Error
=
𝑦
−
𝑦
^
Error=y−
y
^
	​

📐 Step 3: Calculate error using MAE or RMSE
MAE (Mean Absolute Error)
∣
𝑦
−
𝑦
^
∣
∣y−
y
^
	​

∣

Measures average mistake

All errors treated equally

RMSE (Root Mean Squared Error)
(
𝑦
−
𝑦
^
)
2
(y−
y
^
	​

)
2
	​


Large errors matter more

Punishes bad predictions

3️⃣ Step 4: AI learns from the error (VERY IMPORTANT)

This is where AI becomes intelligent 👇

Error is passed to a loss function

The model adjusts its parameters (weights)

Uses optimization algorithms (Gradient Descent)

Repeats until error is minimized

📌 In neural networks:

Squared error (used in RMSE) is common because it works well with backpropagation

4️⃣ Simple visual idea
Actual Value ──┐
               ├── Error → MAE / RMSE → Weight Update → Better Model
Prediction  ───┘

5️⃣ Why AI uses different metrics
Situation	Better Metric
All errors equally bad	MAE
Large errors very dangerous	RMSE
Outliers important	RMSE
Robust evaluation	MAE

Example:

Medical dosage → RMSE (big mistakes are dangerous)

Weather prediction → MAE (average error matters)

6️⃣ Exam-ready one-liner 📝

MAE and RMSE are evaluation metrics used in AI to measure prediction error in regression models and guide learning by minimizing error during training.

If you want, I can also explain:

🔹 MAE vs RMSE vs MSE in one diagram

🔹 How loss function ≠ evaluation metric

🔹 How this appears in deep learning exams

Just tell me 👍

MAE vs RMSE vs MSE in one diagram

🔹 How loss function ≠ evaluation metric

🔹 How this appears in deep learning exams

Perfect — this is exam-gold material 🧠✨
I’ll keep it visual, clear, and exactly how examiners expect it.

1️⃣ MAE vs RMSE vs MSE — one diagram
                Prediction Error (y − ŷ)
                          │
            ┌─────────────┼─────────────┐
            │             │             │
           MAE            MSE           RMSE
            │              │              │
        |y − ŷ|       (y − ŷ)²        √(MSE)
            │              │              │
   Linear penalty     Squared penalty   Same unit
   All errors equal   Big errors HUGE   Big errors matter

Key intuition (VERY IMPORTANT)

MAE → straight line (robust)

MSE → parabola (harsh punishment)

RMSE → square root of MSE (interpretable)

2️⃣ Quick comparison table (exam-friendly)
Metric	Formula	Penalizes big errors	Unit	Sensitive to outliers
MAE	(\frac{1}{n}\sum	y-\hat y	)	❌ No
MSE	
1
𝑛
∑
(
𝑦
−
𝑦
^
)
2
n
1
	​

∑(y−
y
^
	​

)
2
	✅ Yes (strong)	Squared	High
RMSE	
𝑀
𝑆
𝐸
MSE
	​

	✅ Yes	Same	High
3️⃣ Loss function ≠ Evaluation metric (CRUCIAL)
🔹 Loss Function

Used during training

Guides learning

Used by optimizer (Gradient Descent)

Must be differentiable

📌 Examples:

MSE (very common)

Cross-Entropy

Hinge Loss

🔹 Evaluation Metric

Used after or during evaluation

Measures model performance

For humans, reports, comparison

Doesn’t need to be differentiable

📌 Examples:

MAE

RMSE

Accuracy

F1-score

🔁 Key difference diagram
Training Phase:
Model → Loss Function → Gradient Descent → Updated Weights

Evaluation Phase:
Model → Evaluation Metric → Performance Score

⚠️ Important exam trick

RMSE is often an evaluation metric, while MSE is commonly used as a loss function

4️⃣ How this appears in deep learning exams 📝
🔹 Typical exam questions
Q1: Why is MSE preferred over MAE as a loss function?

✅ Answer:

Because MSE is differentiable everywhere and works well with gradient-based optimization, while MAE has non-differentiable points.

Q2: Why use RMSE instead of MSE for reporting results?

✅ Answer:

RMSE has the same unit as the target variable, making it easier to interpret.

Q3: Which metric is more sensitive to outliers and why?

✅ Answer:

MSE and RMSE because squaring the error increases the impact of large errors.

Q4: Can MAE be used as a loss function?

✅ Answer:

Yes, but it is less common because it is not smooth at zero, making optimization harder.

5️⃣ One-paragraph perfect exam answer

MAE, MSE, and RMSE are error metrics used in regression models. MAE measures average absolute error and treats all errors equally. MSE squares the errors, heavily penalizing large deviations, and is commonly used as a loss function in deep learning due to its differentiability. RMSE is the square root of MSE and is mainly used as an evaluation metric because it is in the same unit as the target variable. Loss functions guide model training, while evaluation metrics assess final model performance.