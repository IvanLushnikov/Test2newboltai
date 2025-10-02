# AI Procurement Assistant Setup

This application is an AI-powered assistant for creating procurement documentation in accordance with Russian Federal Law 44-FZ.

## Database Setup

The application uses Supabase for data persistence. The database schema has been created in `supabase/migrations/001_create_procurement_tables.sql`.

### To apply the migration:

The migration file creates three tables:
1. `procurement_sessions` - Stores conversation sessions
2. `ktru_codes` - Stores KTRU classification codes with characteristics
3. `generated_documents` - Stores generated procurement documents

The migration includes sample data for server procurement (KTRU code 26.20.14.000-00000190).

## Running the Application

1. Ensure environment variables are set in `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Features

- Interactive AI chat interface for procurement planning
- Automatic KTRU code selection based on user requirements
- Characteristic collection through natural conversation
- Document generation (technical specifications, contracts, NMCK calculation)
- Results view with all generated documents

## Usage Flow

1. Click "Сделать закупку с ИИ" button on the planning page
2. Answer AI questions about what you need to purchase
3. AI collects requirements and selects appropriate KTRU codes
4. Review generated documents and characteristics
5. Download or publish the procurement package
