# 🚀 OrangeHRM Enterprise Automation Framework

An advanced, enterprise-grade E2E and API automation testing framework built with **Playwright**, **TypeScript**, and **Allure Report**. 

This project goes beyond basic automation by implementing a highly scalable hybrid architecture (combining UI and API testing), an intelligent 3-tier reporting system, and robust data-driven methodologies.

## 🌟 Key Features

1. **Hybrid Architecture (POM & AOM):** Encapsulates UI interactions using the Page Object Model (POM) and bypasses UI for backend validations using the API Object Model (AOM). Covers everything from basic CRUD operations to advanced security guardrails (SQLi, XSS, CSRF).
2. **Enterprise Allure Reporting:** Implements a strict 3-tier hierarchy (`parentSuite`, `suite`, `subSuite`) for the Suites tab. Features an innovative **Auto-Mapping Fixture** that dynamically reads physical folder paths to generate a 100% accurate `Packages` tab without hardcoding.
3. **Data-Driven & State Resilience:** Utilizes external JSON files for test data. Includes self-healing logic for UI states (e.g., Punch In/Out synchronization) and robust handling of asynchronous components like transient Toast messages and Calendar widgets.

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [Java JDK](https://www.oracle.com/java/technologies/downloads/) (Required for generating Allure HTML reports)
* Git

### 1. Clone the Repository
```bash
git clone [https://github.com/your-username/orangehrm-automation.git](https://github.com/your-username/orangehrm-automation.git)
cd orangehrm-automation