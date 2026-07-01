# CLAUDE.md

# Finance AI Development Guide

## Project Overview

Project Name:
Finance AI

Purpose:
Finance AI is an AI-powered personal finance management platform that helps users manage expenses, income, repayments, and financial planning using bank statements, OCR, and AI.

This project is intended for long-term development and production use.

---

# Tech Stack

Frontend
- HTML5
- CSS3
- Vanilla JavaScript (Phase 1)

Backend
- Supabase

Database
- PostgreSQL (Supabase)

Deployment
- GitHub
- Vercel

Charts
- Chart.js

PDF Reader
- PDF.js

OCR
- Tesseract.js

Future AI
- OpenAI API
- Google Gemini API

---

# Current Phase

Current Stage:

Phase 1

Focus only on:

- Beautiful UI
- Dashboard Layout
- Upload Page
- Navigation
- Responsive Design

Do NOT implement AI yet.

Do NOT implement OCR yet.

Do NOT implement authentication yet unless requested.

---

# Future Roadmap

Phase 1
UI Foundation

Phase 2
Supabase Integration

Phase 3
PDF Upload

Phase 4
OCR

Phase 5
Transaction Management

Phase 6
Dashboard Analytics

Phase 7
AI Categorization

Phase 8
Financial Reports

Phase 9
Budget Planner

Phase 10
Cashflow Prediction

Phase 11
Investment Tracking

Phase 12
Production Release

---

# Features

The system will eventually support:

- PDF Upload
- JPEG Upload
- PNG Upload
- OCR
- AI Transaction Categorization
- Dashboard
- Monthly Report
- Yearly Report
- Budget Planning
- Cashflow Forecast
- Credit Card Analysis
- Loan Tracking
- Subscription Tracking
- Multi-bank Support
- Multi-currency Support
- AI Chat Assistant

---

# Supported Banks

Design the system to support future expansion.

Current target:

Singapore

- DBS
- UOB
- OCBC
- Standard Chartered
- HSBC

Malaysia

- Maybank
- CIMB
- Public Bank
- Hong Leong
- RHB

Never hardcode for only one bank.

---

# Coding Standards

Always:

- Write clean code
- Write reusable code
- Modular architecture
- Mobile First
- Responsive Design
- Use async/await
- Separate concerns
- Write readable code

Never:

- Duplicate code
- Inline CSS
- Inline JavaScript
- Hardcode values
- Rewrite unrelated files
- Remove existing features without approval

---

# Folder Structure

finance-ai/

index.html

dashboard.html

upload.html

reports.html

settings.html

css/

js/

assets/

components/

docs/

---

# UI Design

Theme

Modern

Minimal

Professional

Inspired by:

- Apple
- Notion
- Stripe Dashboard

Requirements

- Rounded cards
- Soft shadows
- Smooth animation
- Blue accent color
- Dark mode ready
- Clean typography
- Desktop & Mobile responsive

---

# Dashboard

Dashboard should eventually contain

- Total Balance
- Monthly Income
- Monthly Expense
- Savings
- Cashflow
- Expense Trend
- Category Pie Chart
- Top Spending
- Upcoming Bills
- Credit Card Summary
- Repayment Status

---

# Upload Module

Supported formats

- PDF
- JPG
- JPEG
- PNG

Future

- Drag & Drop
- Multiple File Upload
- Batch Processing

---

# OCR Module

Future OCR engine

Tesseract.js

Extract:

- Date
- Description
- Amount
- Balance
- Reference Number

Should support different bank statement layouts.

---

# Database Design

Use Supabase.

Design database for scalability.

Prepare tables for

Users

Transactions

Accounts

Bank Statements

Categories

Budgets

Loans

Investments

Subscriptions

Reports

Settings

Never design database for a single user only.

Future multi-user support is required.

---

# AI Rules

AI should classify transactions into

Food

Transport

Shopping

Bills

Salary

Investment

Transfer

Insurance

Healthcare

Entertainment

Travel

Education

Others

Users must always be able to edit AI results.

---

# Development Workflow

Before coding

1. Read CLAUDE.md

2. Explain implementation plan.

3. List files to create.

4. List files to modify.

5. Wait if clarification is needed.

After coding

Always provide

- Summary
- Files Created
- Files Modified
- Next Suggested Step
- Git Commit Message

---

# Git Rules

Keep commits small.

One feature per commit.

Example

feat: add dashboard layout

feat: add upload page

fix: correct transaction parser

Never combine unrelated changes.

---

# Performance

Prefer lightweight solutions.

Avoid unnecessary libraries.

Optimize for fast loading.

Write maintainable code.

---

# Security

Never expose

- API Keys
- Database Passwords
- Service Role Keys

Environment variables must be used whenever secrets are required.

---

# Important

This project is expected to become a production-ready personal finance platform.

Every implementation should prioritize:

- Scalability
- Maintainability
- Reusability
- Clean Architecture
- Long-term development
