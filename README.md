# Kin Canada Events Calendar

A centralized events calendar for Kin clubs across Canada, built with Next.js and Supabase.

## Features

- **Event Management**: Create, edit, and delete events with magic link authentication
- **Filtering**: Filter events by club, zone, district, or view all events
- **Calendar Views**: Both calendar and list views for events
- **Embeddable Widget**: Iframe embeddable calendar for club websites
- **Public/Private Events**: Support for both public and private event visibility
- **Responsive Design**: Mobile-first design that works on all devices

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **UI Components**: Lucide React icons, React Hook Form, Zod validation
- **Calendar**: React Big Calendar
- **Styling**: Tailwind CSS with custom components

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kincal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
   - Get your project URL and anon key from the Supabase dashboard

4. **Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Schema

The application uses the following main tables:

- **districts**: Kin Canada districts
- **zones**: Zones within districts  
- **clubs**: Kin clubs within zones
- **events**: Event information with relationships to clubs/zones/districts
- **magic_link_tokens**: Temporary authentication tokens

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── events/create/     # Event creation page
│   ├── embed/             # Embeddable widget
│   └── page.tsx           # Main calendar page
├── components/            # React components
│   ├── CalendarView.tsx   # Main calendar component
│   ├── EventCard.tsx      # Individual event display
│   ├── EventFilters.tsx   # Filter sidebar
│   └── Header.tsx         # Navigation header
└── lib/                   # Utility functions
    ├── auth.ts            # Magic link authentication
    ├── database.ts        # Database operations
    ├── supabase.ts        # Supabase client and types
    ├── utils.ts           # Helper functions
    └── validations.ts     # Form validation schemas
```

## Key Features

### Event Creation
- Magic link authentication for event creators
- Comprehensive event form with validation
- Support for public/private events
- Optional fields for location, URL, and images

### Calendar Views
- Monthly calendar grid view
- List view with event cards
- Real-time filtering by organization level
- Search functionality

### Embeddable Widget
- Clean iframe embeddable calendar
- Filterable by club, zone, or district
- Copy embed code functionality
- Responsive design

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features

1. **Database Changes**: Update `supabase-schema.sql` and run in Supabase
2. **Types**: Update types in `src/lib/supabase.ts`
3. **Components**: Add new components in `src/components/`
4. **Pages**: Add new pages in `src/app/`

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the GitHub repository.
