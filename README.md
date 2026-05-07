# Human Nature Storefront 🌿

A premium, high-performance e-commerce storefront built with **Next.js 15**, **Tailwind CSS v4**, and **Firebase**. This project is part of the Human Nature ecosystem, designed for seamless product discovery and secure ordering.

## 🚀 Features

- **Blazing Fast Performance**: Leveraging Next.js 15 App Router and Server-Side Rendering (SSR).
- **Modern UI/UX**: Styled with Tailwind CSS v4 and Framer Motion for smooth animations and a premium feel.
- **Real-time Data**: Integrated with Firebase Firestore for live product updates and order management.
- **SSR-Safe Firebase**: Robust singleton pattern for Firebase Admin and Client SDKs, optimized for Cloud Run and App Hosting.
- **Responsive Design**: Fully optimized for Mobile, Tablet, and Desktop.
- **PWA Ready**: Installable web application with offline capabilities.

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database & Auth**: [Firebase](https://firebase.google.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

## 📦 Getting Started

### Prerequisites

- Node.js 20 or later
- npm or pnpm
- A Firebase project

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/shawzalbetar-a11y/humannatureFirebase.git
   cd humannatureFirebase
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Copy `.env.example` to `.env.local` and fill in your Firebase credentials.
   ```bash
   cp .env.example .env.local
   ```

### Development

Run the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

## 🚀 Deployment

### Firebase App Hosting

This project is optimized for **Firebase App Hosting**. 

1. Ensure your project is linked to GitHub.
2. Configure your secrets in the Firebase Console:
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`

3. Deploy:
   ```bash
   npm run firebase:deploy
   ```

### Netlify Deployment

This project is fully compatible with **Netlify**.

1. Connect your GitHub repository to Netlify.
2. The `netlify.toml` file will automatically configure the build settings.
3. Configure the **Environment Variables** in the Netlify Dashboard:
   - All variables listed in `.env.example`.
   - Ensure `FIREBASE_PRIVATE_KEY` is pasted with literal `\n` characters if using a single-line input.

**Note**: Netlify will use the Essential Next.js plugin automatically for Next.js 15/16.

## 🛡 Security Rules

The project includes pre-configured security rules for Firestore and Storage:
- `firestore.rules`: Secures customer orders and product data.
- `storage.rules`: Manages access to product images and assets.

## 📄 License

Private - All rights reserved.
