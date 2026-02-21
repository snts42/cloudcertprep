# ☁️ CloudCertPrep

**Free AWS Cloud Practitioner (CLF-C02) Practice Exam Platform**

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://cloudcertprep.netlify.app)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A comprehensive exam preparation platform with **588 practice questions** across all AWS Cloud Practitioner certification domains.

**Live Demo:** [cloudcertprep.netlify.app](https://cloudcertprep.netlify.app)

---

## ✨ Features

**Practice Modes**
- **Mock Exam** - Full 65-question timed exam with AWS scaled scoring (100-1000)
- **Domain Practice** - Focus on specific domains with intelligent question repetition
- **Weak Spot Trainer** - Automatically targets previously missed questions
- **Scenario Practice** - Real-world scenario-based questions

**Smart Learning**
- Intelligent repetition algorithm prioritizes weak areas
- Immediate feedback with detailed explanations
- Progress tracking across all four domains
- Complete exam history with performance analytics
- Guest mode available (no account required)

---

## 🏗️ Tech Stack

**Frontend**
- React 18 + TypeScript
- Tailwind CSS
- React Router
- Vite

**Backend**
- Supabase (PostgreSQL + Auth + Real-time)
- Row Level Security

**Deployment**
- Netlify (CI/CD + Hosting)

---

## 📊 Question Bank

- **588 Total Questions**
- Domain 1: Cloud Concepts (24%)
- Domain 2: Security & Compliance (30%)
- Domain 3: Cloud Technology & Services (34%)
- Domain 4: Billing, Pricing & Support (12%)

All questions include multiple choice/multi-select formats with detailed explanations.

---

## 🗄️ Database Schema

**exam_attempts** - Mock exam results and scores  
**domain_progress** - Mastery tracking per domain  
**weak_spots** - Incorrect questions (cleared after 3 correct answers)  
**users** - Authentication and profiles (Supabase Auth)

---

##  License

MIT License - see [LICENSE](LICENSE) file

---

## ⚠️ Disclaimer

Not affiliated with Amazon Web Services (AWS) or Amazon.com, Inc. AWS and the AWS logo are trademarks of Amazon.com, Inc. or its affiliates.

---

## 👨‍💻 Author

**Alex Santonastaso**  
Portfolio: [santonastaso.codes](https://santonastaso.codes)

---

**Happy Studying! 🎓☁️**
