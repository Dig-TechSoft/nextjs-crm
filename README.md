# MT5 CRM Backend System

A comprehensive CRM backend system for managing MT5 trading clients, built with Next.js and designed for scalability and maintainability.

## Features

- **Client Management**: Manage trading client accounts, balances, and profiles
- **Dashboard**: Real-time overview of key metrics and system status
- **Operations**: Handle applications, withdraw requests, and deposit requests
- **Authentication**: Secure login system with session management
- **Responsive Design**: Modern UI that works on all devices

## Tech Stack

- **Frontend**: Next.js 16 (React 19)
- **Styling**: SCSS with custom design system
- **Authentication**: JWT-based authentication
- **Icons**: Remix Icon library

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nextjs-crm
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # Reusable React components
├── styles/           # SCSS stylesheets
└── utils/            # Utility functions and API clients
```

## Future Enhancements

This project is designed to integrate with:
- MetaQuotes MT5 WebAPI for real-time trading data
- PostgreSQL database for CRM data storage
- Advanced reporting and analytics features
- Multi-language support

## License

Private project - All rights reserved
