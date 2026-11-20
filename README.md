# 🌾 AgriLens — Automated Agricultural Data-to-Insight Analytics Platform

**Transforming raw agricultural data into meaningful, data-driven insights.**

AgriLens is a web-based agricultural analytics platform designed to simplify the process of analysing agricultural datasets. It automates data validation, profiling, cleaning, exploratory data analysis (EDA), agricultural visualisation and report generation through a unified data-to-insight pipeline.

The platform provides two user-oriented interfaces — **Farmer Mode** and **Officer Mode** — making agricultural data analysis more accessible to users with different levels of technical expertise.

🌐 **Live Application:** https://agri-lens-five.vercel.app

⚙️ **Backend API:** https://agrilens-api-eeoq.onrender.com

📂 **GitHub Repository:** https://github.com/RutujaAr/AgriLens

---

## 📌 Problem Statement

Agricultural datasets contain valuable information about crop production, yield, rainfall and regional agricultural patterns. However, these datasets often contain missing values, duplicate records, inconsistent column names and mixed data types.

Preparing and analysing such data typically requires programming and statistical knowledge, making it difficult for non-technical users to extract meaningful insights.

AgriLens addresses this challenge by automating the journey from raw agricultural data to structured analysis and understandable reports.

## 🎯 Project Objectives

- Develop an accessible web-based agricultural analytics platform.
- Support agricultural data ingestion in CSV, Excel and JSON formats.
- Automate dataset validation, profiling and cleaning.
- Perform exploratory data analysis and statistical analysis.
- Generate agricultural visualisations and meaningful insights.
- Provide simplified and detailed analytical views for different user roles.
- Generate comprehensive agricultural analysis reports.

## ✨ Key Features

### 1. Role-Based User Modes

**👨‍🌾 Farmer Mode**
- Simplified agricultural dashboard.
- Easy-to-understand visualisations.
- Plain-language analytical insights.
- Farm-focused summaries.

**👨‍💼 Officer Mode**
- Detailed analytical dashboard.
- Dataset inspection and cleaning information.
- Statistical findings and correlations.
- Research-oriented analysis and verification reports.

Both modes use the same underlying analytics engine, ensuring consistency in analytical results.

### 2. Multiple Data Upload Options

- CSV files
- Excel files
- JSON files
- Built-in demonstration dataset

### 3. Automated Data Profiling

Automatically examines uploaded datasets to identify:

- Number of rows and columns.
- Column names and data types.
- Missing values.
- Duplicate records.
- Overall dataset quality.

### 4. Data Cleaning and Preprocessing

- Identify missing values.
- Handle duplicate records.
- Prepare datasets for analysis.
- Compare raw and cleaned datasets.

### 5. Exploratory Data Analysis (EDA)

- Descriptive statistical summaries.
- Numerical and categorical data exploration.
- Distribution analysis.
- Correlation analysis.

### 6. Agricultural Analytics

- Crop-related visualisations.
- Rainfall versus crop yield analysis.
- State-wise agricultural comparisons.
- Automatically generated analytical insights.

### 7. Automated Report Generation

Generates a consolidated analysis report containing dataset quality information, visualisations, statistical findings and agricultural insights.

## 🔄 System Workflow

AgriLens follows an automated data-to-insight pipeline:

1. **User Access:** Open the application and select Farmer Mode or Officer Mode.
2. **Data Ingestion:** Upload a CSV, Excel or JSON file, or explore the demonstration dataset.
3. **Data Validation:** Validate the uploaded file and identify available columns.
4. **Data Profiling:** Examine dataset structure, data types, missing values and duplicates.
5. **Data Cleaning:** Handle missing values and duplicate records.
6. **Exploratory Analysis:** Generate statistical summaries, distributions and correlations.
7. **Agricultural Analysis:** Perform crop visualisation, rainfall–yield analysis and state-wise comparisons where supported by the available data.
8. **Insight Generation:** Present findings in an understandable format.
9. **Report Generation:** Consolidate analytical results into a final report.

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js, Vite |
| Backend | Python, FastAPI |
| Data Processing | Pandas |
| Database | Supabase PostgreSQL (intended configuration) |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |

## 🏗️ System Architecture

AgriLens follows a client-server architecture.

**Frontend — React + Vite**
- Provides the interactive user interface.
- Handles data upload and role-based dashboards.
- Displays visualisations and analytical reports.
- Communicates with the backend through APIs.

**Backend — FastAPI + Pandas**
- Handles file validation and data processing.
- Performs dataset profiling and cleaning.
- Executes statistical and agricultural analysis.
- Generates analytical insights and report data.

**Database Layer**
- Supabase PostgreSQL is the intended persistent storage configuration.
- The latest project audit identified an SQLite fallback, so PostgreSQL persistence requires further verification.

**Deployment**
- Frontend hosted on Vercel.
- Backend hosted on Render.

## 📊 Analytical Approach

AgriLens selects analyses according to the columns available in the uploaded dataset.

For example, when rainfall and crop-yield variables are available, the platform calculates their statistical association using the **Pearson correlation coefficient**.

If the required variables are unavailable, the system communicates that the analysis cannot be performed rather than generating unsupported results.

This approach emphasises transparent and data-dependent analysis.

## 🚀 Future Enhancements

- Confirm and strengthen Supabase PostgreSQL persistence.
- Complete live verification and automated testing of all pipeline stages.
- Introduce additional season-wise and crop-wise agricultural analyses.
- Add regional-language support for improved accessibility.
- Implement user accounts and stored report history.
- Explore optional machine-learning-based crop-yield prediction.

## ⚠️ Scope and Limitations

- AgriLens focuses on structured, tabular agricultural datasets.
- It does not currently collect data directly from agricultural sensors or satellites.
- Rainfall–yield correlation indicates statistical association, not causation.
- The platform does not currently provide predictive crop-yield forecasting.
- Database persistence and individual production features require continued verification.

## 👥 Project Team

Developed as a collaborative academic mini project at:

**Maharashtra Institute of Technology, Chhatrapati Sambhajinagar**

Department: Agricultural Engineering

**Project Guide:** Surekha Dabhade

**Team Members:**
- Rutuja Argade
- Kiran Bhalerao
- Harshada Deshmukh
- Prachi Deshmukh
- Shubhada Shingane

**Academic Year:** 2026–27

---

⭐ If you find this project interesting, consider exploring the repository and sharing your feedback.

**AgriLens — Making Agricultural Data More Accessible, Understandable and Actionable.**
