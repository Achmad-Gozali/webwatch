# 🌐 WebWatch — Website Monitoring Dashboard

> Real-time website monitoring with AI-powered insights, uptime tracking, and performance analysis.

![Next.js](https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-black?style=for-the-badge&logo=vercel)

---

## ✨ Features

- 📡 **Real-time Monitoring** — Cek uptime & response time semua website secara live
- 🤖 **AI Insights** — Analisis performa otomatis menggunakan Groq (Llama-3)
- 🔒 **SSL & Security Check** — Validasi sertifikat SSL dan security headers
- ⚡ **PageSpeed Integration** — Lighthouse score via Google PageSpeed API
- 🔔 **Instant Notifications** — Alert otomatis saat website down atau degraded
- 📊 **Response Time Chart** — Visualisasi history response time secara grafis
- 📱 **Fully Responsive** — Optimal di desktop maupun mobile

---

## 🛠 Tech Stack

| Category | Tech |
|----------|------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Charts | Recharts |
| AI | Groq API (Llama-3) |
| Database | Supabase |
| Performance | Google PageSpeed API |
| Deployment | Vercel |

---

## 🚀 Run Locally

**Prerequisites:** Node.js 18+

1. Clone repository:
   ```bash
   git clone https://github.com/Achmad-Gozali/webwatch.git
   cd webwatch
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup environment variables — buat file `.env.local`:
   ```env
   GROQ_API_KEY=your_groq_api_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   PAGESPEED_API_KEY=your_pagespeed_api_key
   ```

4. Jalankan development server:
   ```bash
   npm run dev
   ```

5. Buka [http://localhost:3000](http://localhost:3000)

---

## 📦 Environment Variables

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | API key dari [console.groq.com](https://console.groq.com) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key dari Supabase |
| `PAGESPEED_API_KEY` | API key dari [Google Cloud Console](https://console.cloud.google.com) |

---

## 📸 Preview

> Dashboard · Monitoring · Performance · Security · AI Insights

---

## 👤 Author

**Achmad Gozali**  
[![GitHub](https://img.shields.io/badge/GitHub-Achmad--Gozali-181717?style=flat&logo=github)](https://github.com/Achmad-Gozali)
