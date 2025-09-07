# Heavy Metal Groundwater Monitoring Dashboard

A comprehensive web application for monitoring and analyzing heavy metal contamination in groundwater across India. Built with Next.js 14, TypeScript, and modern UI components.

## 🌟 Features

### Core Functionality
- **Interactive Map Visualization** - Explore 3×3 km grid cells with contamination data
- **Real-time Analytics** - Monitor heavy metal concentrations and trends
- **Risk Assessment** - Health risk scoring and WHO limit comparisons
- **Data Export** - Export reports and visualizations
- **Comparative Analysis** - Compare contamination levels across regions

### Heavy Metals Monitored
- Arsenic (As)
- Lead (Pb) 
- Chromium (Cr)
- Cadmium (Cd)
- Mercury (Hg)
- Iron (Fe)
- Manganese (Mn)

### Key Components
- **Map Viewer** - Interactive Leaflet-based mapping with layer controls
- **Analytics Dashboard** - Trend charts and statistical analysis
- **Risk Summary Cards** - Quick overview of contamination status
- **Filter Sidebar** - Advanced filtering and search capabilities
- **Data Viewer** - Tabular data exploration with virtualization

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Frontend-web

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

### Development

```bash
# Start development server
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm run start
```

## 🏗️ Project Structure

```
Frontend-web/
├── app/                    # Next.js App Router
│   ├── about/             # About page
│   ├── analytics/         # Analytics dashboard
│   ├── api/               # API routes
│   ├── compare/           # Comparison tools
│   ├── data/              # Data viewer
│   ├── map/               # Interactive map
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # Reusable components
│   ├── ui/                # shadcn/ui components
│   ├── enhanced-map-viewer.tsx
│   ├── risk-summary-cards.tsx
│   ├── trend-chart.tsx
│   └── ...
├── data/                  # Mock data files
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── models/                # Data models
├── public/                # Static assets
├── styles/                # Additional styles
└── types/                 # TypeScript definitions
```

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Modern UI components
- **Radix UI** - Accessible component primitives

### Mapping & Visualization
- **Leaflet** - Interactive maps
- **React Leaflet** - React integration for Leaflet
- **Recharts** - Data visualization charts

### Data & State Management
- **SWR** - Data fetching and caching
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Framer Motion** - Animations

## 📊 Data Structure

The application uses a comprehensive data model for groundwater monitoring:

```typescript
interface RasterData {
  Raster_ID: string;
  Lat_Center: number;
  Lon_Center: number;
  Region_State: string;
  Region_District: string;
  Heavy_Metals: {
    As: number;  // Arsenic
    Pb: number;  // Lead
    Cr: number;  // Chromium
    Cd: number;  // Cadmium
    Hg: number;  // Mercury
    Fe: number;  // Iron
    Mn: number;  // Manganese
  };
  WHO_Limit: Record<string, number>;
  Health_Risk_Score: number;
  Exceedance_Flag: boolean;
  // ... additional fields
}
```

## 🗺️ Map Features

- **Layer Controls** - Toggle different data layers
- **Grid Visualization** - 3×3 km contamination cells
- **Interactive Markers** - Click for detailed information
- **Export Functionality** - Save current map view
- **Responsive Design** - Works on all device sizes

## 📈 Analytics

- **Trend Analysis** - Historical contamination patterns
- **Risk Scoring** - WHO guideline comparisons
- **Statistical Summaries** - Population and geographic insights
- **Predictive Models** - ML-based future projections

## 🎨 UI/UX Features

- **Dark/Light Mode** - Theme switching
- **Responsive Design** - Mobile-first approach
- **Accessibility** - WCAG compliant components
- **Loading States** - Smooth user experience
- **Toast Notifications** - User feedback

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file:

```env
# Add your environment variables here
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
MONGODB_URI=your_mongodb_connection_string
```

### Tailwind Configuration
The project uses Tailwind CSS v4 with custom configurations in `tailwind.config.js`.

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Deploy to Vercel
vercel --prod
```

### Docker
```bash
# Build Docker image
docker build -t groundwater-monitor .

# Run container
docker run -p 3000:3000 groundwater-monitor
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- Real-time data integration
- Advanced ML predictions
- Mobile application
- API documentation
- Multi-language support
- Enhanced export formats

---

Built with ❤️ for groundwater monitoring and public health protection in India.