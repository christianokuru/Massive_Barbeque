# Kylva Agency Website - Product Requirements Document

## Project Overview
**Agency Name:** Kylva  
**Website URL:** kylva.com  
**Project Type:** Fashion & Beauty E-commerce Agency Website  
**Niche:** Custom e-commerce websites for fashion and beauty brands  
**Timeline:** 1 week  
**Goal:** Attract international fashion and beauty brand clients (US, UK, Canada) and generate leads

---

## Agency Positioning

**Tagline Options:**
- "E-commerce websites that help fashion & beauty brands sell more"
- "Custom online stores for fashion and beauty brands—without platform fees"
- "High-performance e-commerce for fashion and beauty brands"

**Value Proposition:**
- Custom e-commerce design and development
- No monthly platform fees (Medusa.js based)
- Mobile-optimized for fashion's 81% mobile traffic
- Social commerce integration (Instagram, TikTok)
- International payment support (Stripe/Paystack)
- Faster and more affordable than US agencies

**Target Clients:**
- Direct-to-consumer (DTC) fashion brands
- Clothing and apparel companies
- Beauty and cosmetics brands
- Accessory and footwear brands
- Subscription-based fashion/beauty boxes
- Brands looking to migrate from Shopify or other platforms

---

## Technical Stack
- **Framework:** Nuxt 4
- **Styling:** Tailwind CSS
- **Backend:** Nuxt Nitro
- **Database:** PostgreSQL (AWS RDS)
- **ORM:** Prisma or node-postgres
- **E-commerce Backend:** Medusa.js (headless e-commerce)
- **Hosting:** AWS Amplify (Frontend + Backend)
- **Storage:** AWS S3 (images/assets)
- **Email:** Amazon SES
- **CDN:** CloudFront (automatic with Amplify)
- **Language:** JavaScript (No TypeScript)

---

## Site Structure

### Pages (5 Total)
1. **Home** (`/`)
2. **About** (`/about`)
3. **Services** (`/services`)
4. **Portfolio** (`/portfolio`)
5. **Contact** (`/contact`)

### Navigation
- Fixed/sticky header on all pages
- Mobile-responsive hamburger menu
- Navigation items: Home | About | Services | Portfolio | Contact
- CTA button in header: "Get Started" or "Start Your Project"

---

## Design System

### Color Palette

**Light Mode (Default):**
- Background: `#F8F8F8` (Soft gray - makes gold pop)
- Surface/Cards: `#FFFFFF` (White)
- Text Primary: `#0A0A0A` (Soft Black)
- Text Secondary: `#6B7280` (Gray)
- Accent Gold: `#D4AF37` (Rich Gold - luxury feel for fashion/beauty)
- Accent Gold Bright: `#FFD700` (Hover/highlights - glittering effect)
- Border/Divider: `#E5E7EB` (Light Gray)

**Dark Mode:**
- Background: `#0A0A0A` (Soft Black)
- Surface/Cards: `#1A1A1A` (Charcoal)
- Text Primary: `#FFFFFF` (White)
- Text Secondary: `#9CA3AF` (Light Gray)
- Accent Gold: `#FFD700` (Bright Gold - pops on dark)
- Accent Gold Hover: `#FFC700` (Extra bright for hover)
- Border/Divider: `#262626` (Dark Gray)

### Typography

**Primary Font:** Space Grotesk
- Usage: Headings (H1, H2, H3, H4, H5, H6)
- Weights: 400 (Regular), 500 (Medium), 600 (Semi-Bold), 700 (Bold)

**Secondary Font:** Poppins
- Usage: Body text, paragraphs, captions, buttons
- Weights: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semi-Bold)

**Font Sizes (Tailwind classes):**
- H1: `text-5xl md:text-6xl lg:text-7xl` (Hero headings)
- H2: `text-4xl md:text-5xl` (Section headings)
- H3: `text-3xl md:text-4xl` (Sub-section headings)
- H4: `text-2xl md:text-3xl`
- Body Large: `text-lg md:text-xl`
- Body Regular: `text-base`
- Body Small: `text-sm`
- Caption: `text-xs`

### Spacing & Layout

**Container:**
- Max width: `max-w-7xl` (1280px)
- Padding: `px-4 md:px-6 lg:px-8`
- Margin: `mx-auto`

**Section Spacing:**
- Top/Bottom padding: `py-16 md:py-24 lg:py-32`
- Between elements: `space-y-8 md:space-y-12`

**Grid System:**
- Portfolio grid: 2 columns (mobile), 3 columns (desktop)
- Services grid: 1 column (mobile), 2-3 columns (desktop)

---

## Page-by-Page Content Requirements

### 1. Home Page

#### Hero Section
**Content:**
- Main Heading: "E-commerce Websites for Fashion & Beauty Brands" (or similar)
- Subheading: "Custom online stores that drive sales—without platform fees. Built for mobile, optimized for conversions."
- Two CTAs: 
  - Primary: "Start Your Project" (links to /contact)
  - Secondary: "View Our Work" (links to /portfolio)
- Visual: Hero image/video of fashion e-commerce site or animated background

#### Services Overview Section
**Content:**
- Section heading: "What We Build"
- Brief intro: "We specialize in custom e-commerce solutions for fashion and beauty brands"
- 3-4 service cards with icons:
  1. **Custom E-commerce Design** - "Beautiful, brand-focused storefronts that convert"
  2. **Mobile-First Development** - "81% of fashion traffic is mobile—we optimize for it"
  3. **Social Commerce Integration** - "Sell on Instagram, TikTok, and your website"
  4. **No Platform Fees** - "Keep more of your revenue with custom solutions"
- CTA: "See All Services" (links to /services)

#### Why Choose Us Section
**Content:**
- Section heading: "Why Fashion & Beauty Brands Choose Kylva"
- 3-4 benefit cards:
  1. **E-commerce Specialists** - "We focus exclusively on fashion and beauty e-commerce"
  2. **International Quality, Competitive Pricing** - "US-level quality without US prices"
  3. **Fast & Mobile-Optimized** - "Built for performance and conversions"
  4. **Complete Control** - "No monthly platform fees or limitations"

#### Social Proof Section (if available)
**Content:**
- Client logos or "Trusted By" section
- Stats: "X fashion brands served" or "Average X% increase in conversions"
- Testimonial quotes (if available)

#### Portfolio Preview
**Content:**
- Section heading: "Recent Projects"
- Show 3-6 most recent fashion/beauty e-commerce projects
- Each with: Image, brand name, category (Fashion/Beauty), brief description
- CTA: "View All Projects" (links to /portfolio)

#### CTA Section
**Content:**
- Heading: "Ready to Build Your E-commerce Store?"
- Subtext: "Let's create a custom online store that drives sales for your fashion or beauty brand"
- Button: "Get Started" (links to /contact)

---

### 2. About Page

#### About Kylva Section
**Content:**
- Heading: "About Kylva"
- Content: 
  - Who you are
  - Why you specialize in fashion & beauty e-commerce
  - Your understanding of the industry (mobile-first, social commerce, sustainability trends)
  - Your commitment to custom solutions without platform fees
- Optional: Team photo or founder photo

#### Our Approach Section
**Content:**
- Heading: "Our Process"
- 4-5 steps in your e-commerce development process:
  1. **Discovery** - Understanding your brand, products, and goals
  2. **Design** - Creating custom designs or working with your existing designs
  3. **Development** - Building with modern tech (Nuxt, Medusa.js, etc.)
  4. **Testing** - Ensuring mobile optimization and performance
  5. **Launch & Support** - Going live and ongoing support

#### Why Fashion & Beauty Section
**Content:**
- Heading: "Why We Specialize in Fashion & Beauty"
- Content:
  - Fashion e-commerce is $974B+ market growing 11.5% annually
  - Beauty e-commerce is $257B+ market
  - These industries need: mobile-first design, social commerce, fast sites, visual-focused experiences
  - You understand these specific needs

#### Values Section (Optional)
**Content:**
- Quality over quantity
- Transparency in pricing
- Client success focus
- No platform lock-in

---

### 3. Services Page

#### Services Overview
**Content:**
- Heading: "Our E-commerce Services"
- Intro: "We offer two service tiers to meet your needs—whether you have designs ready or need the full package"

#### Service Tier 1: Development Only
**Content:**
- Heading: "Development Only"
- **Starting at $1,000**
- Description: "Perfect for brands with existing designs who need expert development"
- What's Included:
  - Nuxt 4 frontend development
  - Medusa.js backend integration
  - Stripe/Paystack payment setup
  - Mobile-responsive implementation
  - Product catalog setup
  - Shopping cart & checkout
  - Basic SEO optimization
  - 30 days post-launch support
- Ideal For: "Brands with in-house designers or existing Figma/design files"
- CTA: "Request Quote"

#### Service Tier 2: Design + Development
**Content:**
- Heading: "Design + Development"
- **Starting at $3,000**
- Description: "Complete e-commerce solution from concept to launch"
- What's Included:
  - Everything in Development Only, PLUS:
  - Custom e-commerce design (desktop + mobile)
  - Brand-focused user experience
  - Product page layouts
  - Lookbook/collection pages
  - Social commerce integration (Instagram Shop, TikTok)
  - Advanced filtering & search
  - Subscription functionality (if needed)
  - Conversion optimization
  - 60 days post-launch support
- Ideal For: "Brands who need complete e-commerce design and development"
- CTA: "Start Your Project"

#### Additional Services (Optional)
**Content:**
- Platform Migration (Shopify to custom)
- E-commerce Consulting
- Performance Optimization
- Feature Additions

#### Pricing Note
**Content:**
"Final pricing depends on project scope, features, and timeline. All projects include mobile optimization, secure payments, and modern tech stack. Book a free consultation to get a custom quote based on your needs."

#### Technologies We Use
**Content:**
- Brief section showing: Nuxt 4, Medusa.js, Stripe, Tailwind, PostgreSQL, AWS
- Why these technologies benefit fashion/beauty brands (performance, scalability, no platform fees)

---

### 4. Portfolio Page

#### Portfolio Grid
**Content:**
- Heading: "Our Work"
- Subheading: "E-commerce websites we've built for fashion and beauty brands"
- Filter buttons: All | Fashion | Beauty
- Portfolio grid showing projects
- Each project card includes:
  - Project image (hero shot of site)
  - Brand name
  - Category tag (Fashion/Beauty)
  - Brief description
  - Tech used (optional)
  - "View Project" button (opens modal or detail page)

#### Project Details (Modal or Separate Page)
**Content for each project:**
- Multiple screenshots (desktop + mobile)
- Client name and industry
- Project brief
- Challenges & solutions
- Features built
- Technologies used
- Results (if available): traffic increase, conversion rate, etc.
- Link to live site (if client approves)

#### Placeholder Content (Until More Projects)
- For now: Show 1 real project prominently
- Add 2-3 "Coming Soon" placeholder cards with text like:
  - "More fashion e-commerce projects launching soon"
  - Or show demo projects you build

#### CTA Section
**Content:**
- Heading: "Want Your Brand Featured Here?"
- Subtext: "Let's build a custom e-commerce store for your fashion or beauty brand"
- Button: "Start Your Project"

---

### 5. Contact Page

#### Contact Form
**Fields:**
- Name (required)
- Email (required)
- Phone (optional)
- **Service Interest (dropdown, required):**
  - Design + Development (New Store)
  - Development Only (I have designs)
  - Platform Migration (Shopify/other to custom)
  - Add Features to Existing Store
  - Consultation
  - Other
- **Brand Type (dropdown, required):**
  - Fashion/Clothing
  - Beauty/Cosmetics
  - Both
  - Accessories
  - Other
- **Budget Range (dropdown, optional):**
  - $1,000 - $2,999
  - $3,000 - $4,999
  - $5,000 - $9,999
  - $10,000+
  - Not sure yet
- Message (required)
- Submit button: "Send Message" with loading state

**Success Message:**
"Thank you for reaching out! We'll review your inquiry and get back to you within 24-48 hours."

**Error Message:**
"Something went wrong. Please try again or email us directly at hello@kylva.com"

#### Contact Information Section
**Content:**
- Email: hello@kylva.com (or your actual email)
- Instagram: @kylva (link to profile)
- Location: "Serving fashion and beauty brands globally"
- Response time: "We typically respond within 24-48 hours"

#### FAQ Section (Optional)
**Questions:**
1. **How long does a project take?**
   - Development only: 2-4 weeks
   - Design + Development: 4-8 weeks
   - Depends on scope and complexity

2. **Do you work with clients outside Nigeria?**
   - Yes! We primarily serve US, UK, and Canada-based fashion and beauty brands.

3. **What if I don't have designs?**
   - Our Design + Development service includes custom design work.

4. **Do you charge monthly fees?**
   - No platform fees. Just a one-time project cost, then your store is yours.

5. **What platforms do you use?**
   - We build custom solutions with Medusa.js (headless e-commerce) and Nuxt, giving you complete control.

---

## Component Specifications

### 1. Header/Navigation
**Requirements:**
- Sticky positioned (`sticky top-0`)
- Backdrop blur: `backdrop-blur-md bg-white/80 dark:bg-slate-900/80`
- Logo (left): "Kylva" in Space Grotesk, bold
- Nav links (center/right): Home, About, Services, Portfolio, Contact
- CTA button (right): Primary gold button - "Start Your Project"
- Dark mode toggle (icon)
- Mobile: Hamburger menu with slide-in drawer
- Z-index: `z-50`

### 2. Footer
**Requirements:**
- Dark background in both modes
- 3 column layout (desktop), stacked (mobile)
- **Column 1: About Kylva**
  - Brief tagline
  - "E-commerce websites for fashion and beauty brands"
- **Column 2: Quick Links**
  - Home, About, Services, Portfolio, Contact
- **Column 3: Services**
  - Development Only
  - Design + Development
  - Platform Migration
- **Column 4: Connect**
  - Email: hello@kylva.com
  - Instagram icon/link
  - "Serving brands globally"
- Copyright: "© 2025 Kylva. All rights reserved."
- Links hover: Gold accent color

### 3. Hero Section (Home Page)
**Requirements:**
- Min height: `min-h-[80vh]` or `min-h-screen`
- Large heading with fashion/beauty focus
- Subheading emphasizing mobile-first, no platform fees
- Two CTAs: "Start Your Project" (primary) + "View Our Work" (secondary)
- Background: Subtle gradient or fashion-related imagery
- Optional: Animated elements or gold glitter effects
- Mobile optimized

### 4. Service Cards
**Requirements:**
- Card layout with hover effects
- Gold accent borders or highlights
- Each card contains:
  - Icon (lucide-react)
  - Service title
  - Brief description
  - "Learn More" link
- Hover: Lift effect (`transform hover:-translate-y-2`)
- Gold glitter animation on hover
- Transition: `transition-all duration-300`

### 5. Portfolio Grid
**Requirements:**
- Responsive grid: 1 col (mobile), 2 cols (tablet), 3 cols (desktop)
- Filter buttons: All | Fashion | Beauty (styled with gold active state)
- Each project card:
  - Project image (aspect ratio 16:9)
  - Brand name overlay
  - Category tag (Fashion/Beauty)
  - Hover: Image scale + gold overlay fade-in
  - Click: Opens modal or detail page
- Image lazy loading
- If only 1 project: Make it featured/large, add "More coming soon" cards

### 6. Pricing Display (Services Page)
**Requirements:**
- Two clear service tiers side by side (desktop), stacked (mobile)
- Each tier shows:
  - Service name
  - **"Starting at $X,XXX"** prominently displayed
  - Description
  - What's included (bulleted list)
  - "Ideal for" section
  - CTA button
- Highlight Design + Development tier with gold accent
- Note below: "Final pricing based on project scope. Request custom quote."

### 7. Contact Form
**Requirements:**
- Fields: Name, Email, Phone, Service Interest dropdown, Brand Type dropdown, Budget Range dropdown, Message
- Fashion/beauty-specific dropdown options
- Client-side validation + server-side validation
- Submit button with loading spinner
- Success/error messages
- Accessible labels and ARIA attributes
- API endpoint: `/api/contact`
- Store in PostgreSQL

### 8. CTA Sections
**Requirements:**
- Multiple CTAs throughout site
- Gold gradient or solid gold background
- Large heading + subtext in white
- Primary button (contrasting color for visibility)
- Fashion/beauty-focused copy
- Example: "Ready to build your fashion e-commerce store?"

---

## Functionality Requirements

### Dark Mode Toggle
- Toggle in header (sun/moon icon)
- Store preference in localStorage
- Apply `class="dark"` to `<html>` tag
- Smooth transition: `transition-colors duration-300`
- Default: Light mode
- Gold accent maintains luxury feel in both modes

### Animations & Interactions
- Scroll animations: Fade-in, slide-up on scroll
- Smooth scrolling: `scroll-behavior: smooth`
- Button hover: Scale + **gold glitter/shimmer animation**
- Link hover: Gold color + underline animation
- Image hover: Scale or gold overlay
- **Gold Glitter Effect:**
  - CSS animations with shine sweep
  - Multiple layered shadows for metallic depth
  - Transform + opacity for sparkle
  - Apply to buttons, CTAs, service cards
- Keep animations performant (GPU-accelerated)

### Portfolio Filtering
- Filter buttons: All, Fashion, Beauty
- JavaScript-based filtering (no page reload)
- Active filter styled with gold accent
- Smooth transitions when filtering

### Form Validation
- Real-time validation on blur
- Clear error messages
- Required field indicators
- Email format validation
- Budget/service dropdowns required
- Success message after submission

### Responsive Design
**Breakpoints:**
- Mobile: `< 640px`
- Tablet: `640px - 1024px`
- Desktop: `> 1024px`

**Key Changes:**
- Nav: Full menu → Hamburger
- Grid: 1 col → 2-3 cols
- Pricing tiers: Stacked → Side by side
- Text sizes: Responsive scaling
- Images: Full width → Contained

### Performance Optimization
- Nuxt Image module for optimization
- Lazy loading below fold
- Code splitting (automatic with Nuxt)
- Minify in production
- Font optimization: `font-display: swap`
- Target: < 3s load time
- Lighthouse score: > 90

---

## SEO Requirements

### Schema Markup (JSON-LD)
Must implement these schema types:

#### 1. Organization Schema (app.vue - global)
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Kylva",
  "url": "https://kylva.com",
  "logo": "https://kylva.com/logo.png",
  "description": "Custom e-commerce websites for fashion and beauty brands",
  "sameAs": [
    "https://instagram.com/kylva"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "hello@kylva.com",
    "contactType": "Customer Service"
  }
}
```

#### 2. Service Schema (services page)
```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "E-commerce Development for Fashion Brands",
  "provider": {
    "@type": "Organization",
    "name": "Kylva"
  },
  "areaServed": ["US", "UK", "Canada"],
  "offers": {
    "@type": "Offer",
    "priceSpecification": {
      "@type": "PriceSpecification",
      "minPrice": "1000",
      "priceCurrency": "USD"
    }
  }
}
```

#### 3. WebSite Schema (app.vue - global)
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Kylva",
  "url": "https://kylva.com",
  "description": "E-commerce websites for fashion and beauty brands"
}
```

#### 4. BreadcrumbList Schema (all pages)
Dynamic breadcrumbs for each page

#### 5. FAQPage Schema (contact page, if FAQ exists)
For any FAQ sections

### Meta Tags (Per Page)

**Home Page:**
- Title: "Kylva | E-commerce Websites for Fashion & Beauty Brands"
- Description: "Custom e-commerce development for fashion and beauty brands. Mobile-optimized, no platform fees. Starting at $1,000. Serving US, UK, Canada."
- Keywords: fashion e-commerce, beauty e-commerce, custom online store, Shopify alternative

**Services Page:**
- Title: "E-commerce Services for Fashion & Beauty | Kylva"
- Description: "Development only ($1,000+) or Design + Development ($3,000+). Custom e-commerce for fashion and beauty brands without platform fees."

**Portfolio Page:**
- Title: "Fashion & Beauty E-commerce Portfolio | Kylva"
- Description: "See our custom e-commerce websites for fashion and beauty brands. Mobile-optimized, high-converting online stores."

**About Page:**
- Title: "About Kylva | Fashion & Beauty E-commerce Specialists"
- Description: "We specialize in custom e-commerce for fashion and beauty brands. International quality, competitive pricing."

**Contact Page:**
- Title: "Start Your E-commerce Project | Contact Kylva"
- Description: "Ready to build your fashion or beauty e-commerce store? Get a custom quote. Development from $1,000, Design + Development from $3,000."

### Open Graph Tags
- og:title, og:description, og:image, og:url for each page
- Twitter card tags

### Additional SEO
- Semantic HTML with proper heading hierarchy
- Alt text for all images (descriptive, include keywords)
- Internal linking between pages
- sitemap.xml (auto-generated by Nuxt)
- robots.txt
- Canonical URLs
- Fast load times (<3s)

---

## Database Schema (PostgreSQL)

### Contact Form Submissions
```sql
CREATE TABLE contact_submissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  service_interest VARCHAR(255) NOT NULL,
  brand_type VARCHAR(100) NOT NULL,
  budget_range VARCHAR(100),
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Portfolio Projects
```sql
CREATE TABLE portfolio_projects (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  brand_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'Fashion' or 'Beauty'
  image_url TEXT NOT NULL,
  additional_images TEXT[], -- Array of image URLs
  project_url TEXT,
  technologies TEXT[],
  features TEXT[],
  results TEXT, -- Performance improvements, conversions, etc.
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## API Endpoints (Nuxt Nitro)

### `/api/contact` (POST)
**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "serviceInterest": "Design + Development (New Store)",
  "brandType": "Fashion/Clothing",
  "budgetRange": "$3,000 - $4,999",
  "message": "I need an e-commerce store for my fashion brand..."
}
```

**Actions:**
- Validate all fields
- Store in PostgreSQL
- Send email notification to admin (Amazon SES)
- Optional: Send confirmation email to client

**Response:**
```json
{
  "success": true,
  "message": "Thank you! We'll get back to you within 24-48 hours."
}
```

### `/api/portfolio` (GET)
**Query Parameters:**
- `category` (optional): "Fashion" | "Beauty" | "All"
- `limit` (optional): Number of projects to return
- `featured` (optional): true/false

**Response:**
```json
{
  "projects": [
    {
      "id": 1,
      "brandName": "StyleCo",
      "category": "Fashion",
      "imageUrl": "https://...",
      "description": "...",
      "technologies": ["Nuxt", "Medusa.js"],
      "featured": true
    }
  ]
}
```

---

## Content Placeholders

### Copy Needed Before Launch

**Hero Section:**
- Main headline (fashion/beauty focused)
- Subheading (emphasize mobile-first, no fees)

**Services:**
- Detailed descriptions for each tier
- What's included lists

**About:**
- Company story
- Why you specialize in fashion/beauty
- Team info (optional)

**Portfolio:**
- At least 1 complete project with:
  - Brand name
  - Project description
  - Features built
  - Images (desktop + mobile)
  - Results (if available)

**Contact:**
- Contact email
- Instagram handle
- Response time expectation

### Images Needed

- Logo (SVG, transparent background)
- Favicon
- Hero background image or video
- Portfolio project screenshots (desktop + mobile)
- Service icon set (or use lucide-react)
- Optional: Team photo, office photo

---

## Browser & Device Support

**Browsers:**
- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

**Mobile:**
- iOS Safari (critical for fashion)
- Chrome Android
- Test on: iPhone, iPad, Android phones/tablets

**Critical:** Fashion e-commerce gets 81% mobile traffic—mobile experience is PRIMARY, desktop is secondary.

---

## Accessibility (WCAG 2.1 AA)

- Keyboard navigation support
- Screen reader friendly (ARIA labels)
- Color contrast: 4.5:1 (normal), 3:1 (large text)
- Focus indicators visible
- Skip to content link
- Form labels and error messages accessible
- Alt text for all images
- Semantic HTML

---

## Testing Checklist

- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness (iPhone, iPad, Android)
- [ ] Dark mode toggle works
- [ ] Portfolio filter works
- [ ] Contact form validation (client + server)
- [ ] Form submission stores in database
- [ ] Email notifications sent (SES)
- [ ] All links work
- [ ] Images load and lazy-load correctly
- [ ] Animations perform smoothly
- [ ] Gold glitter effects work
- [ ] Lighthouse score > 90
- [ ] Accessibility audit (axe DevTools)
- [ ] Schema markup validates (Google Rich Results Test)
- [ ] Meta tags correct on all pages

---

## Deployment Checklist

- [ ] AWS Account created (free tier)
- [ ] RDS PostgreSQL instance created (db.t3.micro)
- [ ] Database tables created (run SQL migrations)
- [ ] S3 bucket for images created
- [ ] AWS Amplify app connected to GitHub
- [ ] Environment variables set in Amplify:
  - Database connection string
  - SES credentials
  - API keys
- [ ] Amazon SES configured for emails
- [ ] Domain DNS configured (kylva.com → Amplify)
- [ ] SSL certificate active (auto by Amplify)
- [ ] Contact form tested end-to-end
- [ ] Portfolio projects added
- [ ] Favicon added
- [ ] Social media OG images configured
- [ ] 404 page designed
- [ ] robots.txt configured
- [ ] sitemap.xml generated

---

## Launch Strategy

### Pre-Launch (Week Before)
- Test all functionality
- Add 1 portfolio project (or placeholder)
- Prepare social media announcement
- Set up Google Analytics / tracking
- Create email signature with website link

### Launch Day
- Deploy to production
- Test live site thoroughly
- Announce on Instagram
- Update LinkedIn/other profiles with link
- Send email to network announcing launch

### Post-Launch (First Month)
- Monitor contact form submissions
- Check analytics (traffic, bounce rate)
- Fix any bugs reported
- Add more portfolio projects as completed
- Start content marketing (if doing SEO)
- Collect client testimonials

---

## Future Enhancements (Post-Launch)

**Phase 2 (1-3 months):**
- [ ] Add more portfolio projects (target: 6-10)
- [ ] Client testimonials section
- [ ] Case study detail pages (full project breakdowns)
- [ ] Performance stats on portfolio projects
- [ ] Email newsletter signup
- [ ] Live chat or chatbot

**Phase 3 (3-6 months):**
- [ ] Blog for SEO (fashion e-commerce trends, tips)
- [ ] Pricing calculator tool
- [ ] Before/after comparisons for migrations
- [ ] Video case studies or demos
- [ ] Partnerships page (payment processors, tools)

**Phase 4 (6-12 months):**
- [ ] Admin dashboard for managing content
- [ ] Multi-language support (if targeting non-English markets)
- [ ] Webinars or workshops
- [ ] Agency resources/guides (lead magnets)
- [ ] Referral program

---

## Key Metrics to Track

**Website Performance:**
- Page load time (<3s goal)
- Lighthouse scores (>90 goal)
- Bounce rate
- Time on site
- Pages per session

**Lead Generation:**
- Contact form submissions per month
- Conversion rate (visitors → inquiries)
- Inquiry quality (budget, fit)
- Response time to inquiries

**Portfolio:**
- Portfolio page views
- Projects showcased
- Click-through on project details

**Marketing:**
- Traffic sources (organic, social, referral)
- Top performing pages
- Instagram engagement
- Referrals from past clients

---

## Success Criteria

**Week 1 (Launch):**
- Site live and fully functional
- All pages optimized and tested
- Contact form working
- 1+ portfolio project showcased

**Month 1:**
- 5-10 quality inquiries
- 1-2 client projects started
- Site ranking for brand name (kylva)

Month 3:

10-20 quality inquiries
3-5 portfolio projects showcased
Starting to rank for "fashion e-commerce" related keywords
1-2 client testimonials
Month 6:

20-30 quality inquiries per month
6-10 portfolio projects
Ranking on page 2-3 for competitive keywords
3-5 testimonials
First referral clients
Year 1:

Consistent pipeline of 30+ qualified inquiries/month
10-15 portfolio projects
Ranking on page 1 for long-tail keywords
Recognized as fashion/beauty e-commerce specialist
50%+ of new clients from referrals or organic search
Marketing & Lead Generation Strategy
Phase 1: Launch (Week 1-4)
Immediate Actions:

Announce launch on Instagram with professional post
Update all social media bios with website link
Add website to email signature
Reach out to personal network announcing the agency
Join fashion/beauty e-commerce communities on Reddit, Facebook, Discord
List agency on relevant directories:
Clutch.co
GoodFirms
UpWork (as backup lead source)
Shopify Experts (even though you don't do Shopify—shows credibility)
Content Creation:

Write 3-5 LinkedIn posts about fashion e-commerce trends
Share portfolio project as case study on social media
Create Instagram posts showcasing your work
Join Twitter/X conversations about e-commerce and headless commerce
Phase 2: Growth (Month 2-6)
Organic SEO:

Publish helpful content targeting:
"How much does a custom e-commerce site cost"
"Shopify vs custom e-commerce for fashion brands"
"Why fashion brands need mobile-first e-commerce"
"How to increase e-commerce conversions"
Build backlinks through:
Guest posting on fashion/e-commerce blogs
Getting featured in web design showcases
Partnerships with complementary agencies (marketing, branding)
Outreach:

Cold email campaigns to fashion/beauty brands with poor mobile sites
LinkedIn outreach to fashion brand founders/marketers
Instagram DM outreach to small fashion brands (be genuine, not spammy)
Attend virtual or in-person fashion/e-commerce events
Paid Advertising (Optional):

Google Ads targeting "fashion e-commerce developer" searches
Instagram/Facebook ads targeting fashion brand owners
Budget: Start small ($200-500/month) and test
Partnerships:

Partner with fashion brand consultants
Partner with fashion photographers/content creators
Partner with fashion marketing agencies who need dev work
Phase 3: Scale (Month 6-12)
Authority Building:

Speak at virtual events about e-commerce development
Publish comprehensive guides (lead magnets)
Host webinars for fashion brands on e-commerce
Create YouTube content showing your process
Launch podcast interviewing fashion brand founders
Advanced SEO:

Create pillar content and topic clusters
Build more high-quality backlinks
Optimize for featured snippets
Create comparison pages (Shopify vs Kylva, etc.)
Referral Program:

Offer incentives for client referrals
Partner with happy clients for testimonial videos
Create case studies with measurable results
Competitive Positioning
Your Advantages vs US/UK Agencies:
Price Competitive:

US agencies charge $5,000-15,000+ for similar work
You charge $1,000-3,000+ starting prices
Savings of 50-70% for clients
Quality On Par:

Same tech stack (Nuxt, Medusa.js)
Modern, fast websites
Mobile-optimized (critical for fashion)
No compromise on quality
Specialized Focus:

You ONLY do fashion/beauty e-commerce
Most agencies are generalists
You understand the industry's specific needs
No Platform Fees:

Shopify charges $29-299/month + transaction fees
BigCommerce charges $29-299/month
Your clients pay once and own their store
Fast Turnaround:

Smaller agency = faster communication
2-8 weeks vs 3-6 months for larger agencies
Your Challenges (And How to Overcome):
Challenge: "Why should we hire an agency in Nigeria?"

Answer: "Our clients are in the US, UK, and Canada. We work in your timezone, deliver US-level quality, and save you 50-70% compared to local agencies. We specialize exclusively in fashion and beauty e-commerce—that's all we do."
Challenge: "Do you have enough experience?"

Answer: Show your portfolio, emphasize your technical expertise, offer guarantees, provide references from satisfied clients.
Challenge: "How do we communicate?"

Answer: "We use Slack/email for async communication, and schedule video calls in your timezone. We provide weekly updates and are responsive during your business hours."
Challenge: Trust and credibility

Answer: Build portfolio quickly, collect testimonials, be transparent about process, offer clear contracts, use escrow payments if needed.
Pricing Strategy Deep Dive
Development Only - $1,000 Starting Price
When to Charge More:

Complex features (subscriptions, memberships, multi-vendor)
Large product catalogs (1000+ products)
Custom integrations (3rd party APIs, shipping calculators)
Tight deadlines
Extensive customization
Pricing Tiers:

Basic: $1,000-1,500 (simple store, <100 products, standard features)
Standard: $1,500-2,500 (medium complexity, <500 products, some custom features)
Advanced: $2,500-4,000 (complex features, large catalog, integrations)
Design + Development - $3,000 Starting Price
When to Charge More:

Custom brand-focused design work
Multiple page templates needed
Lookbooks, editorial layouts
Advanced animations and interactions
Social commerce integration
Subscription functionality
International multi-currency/language
AR/virtual try-on features
Pricing Tiers:

Starter: $3,000-4,000 (small fashion brand, basic design, <100 products)
Professional: $4,000-6,000 (established brand, custom design, <500 products)
Premium: $6,000-10,000 (high-end brand, advanced features, large catalog)
Enterprise: $10,000+ (complex requirements, subscriptions, custom features)
Additional Revenue Streams
Maintenance & Support:

Monthly retainer: $200-500/month
Includes: bug fixes, minor updates, security patches, performance monitoring
Feature Additions:

Charge per feature after launch
Examples: Add subscription, add social commerce, new payment methods
Pricing: $500-2,000 per feature
Platform Migration:

Shopify to custom migration: $2,000-5,000
Includes: data migration, design adaptation, testing
Consulting:

E-commerce strategy consultation: $150-300/hour
Conversion optimization audit: $500-1,500
Performance Optimization:

Speed optimization service: $500-1,500
For existing sites that are slow
Client Onboarding Process
Step 1: Initial Inquiry (Day 0)
Client fills contact form
Auto-response: "Thanks! We'll review and respond within 24-48 hours"
Internal: Review inquiry, assess fit
Step 2: Qualification Call (Day 1-3)
30-minute video call to discuss:
Their brand and products
Their goals and timeline
Technical requirements
Budget expectations
Design needs (existing vs need design)
Determine if they're a good fit
Step 3: Proposal & Quote (Day 4-7)
Send detailed proposal with:
Scope of work
Timeline (milestones)
Pricing breakdown
What's included/not included
Payment terms (50% upfront, 50% on completion)
Terms and conditions
Follow up after 2-3 days if no response
Step 4: Contract & Deposit (Day 8-14)
Client signs contract
Client pays 50% deposit
Project officially starts
Step 5: Discovery & Planning (Week 1-2)
Kick-off call
Gather requirements:
Brand guidelines (logo, colors, fonts)
Product information
Competitor sites they like/dislike
Feature wishlist
Content (copy, images)
If Design + Dev: Create mood board, design direction
Step 6: Design Phase (Week 2-4) - For Design + Dev Only
Create homepage design mockup
Client review and feedback (2 rounds included)
Design key pages (product page, collection, cart, checkout)
Final design approval
Step 7: Development (Week 3-6 for Dev Only, Week 5-8 for Design + Dev)
Set up development environment
Build frontend (Nuxt)
Integrate Medusa.js backend
Add products
Set up payments (Stripe/Paystack)
Weekly progress updates to client
Staging site for client review
Step 8: Testing & Revisions (Week 7-8 for Dev Only, Week 9-10 for Design + Dev)
Cross-browser testing
Mobile responsiveness testing
Client testing and feedback
Bug fixes and adjustments (2 rounds included)
Performance optimization
SEO setup
Step 9: Launch Prep (Final Week)
Domain setup
SSL certificate
Final client approval
Create backup
Launch checklist review
Step 10: Launch (Day 0)
Deploy to production
Final testing on live site
Client pays final 50%
Celebrate! 🎉
Step 11: Post-Launch Support (30-60 days)
Monitor for issues
Fix any bugs
Answer client questions
Optional: Training session on managing products
Request testimonial
Communication Best Practices
Response Times:
Inquiries: Within 24 hours (weekdays)
Client questions during project: Within 4-8 hours (weekdays)
Emergencies: Same day
Weekly Updates:
Every Friday, send project status email:
What was completed this week
What's planned for next week
Any blockers or questions
Screenshots/preview links
Tools:
Project management: Notion, Trello, or Asana
Communication: Email + Slack (for active projects)
Design sharing: Figma
File sharing: Google Drive or Dropbox
Video calls: Zoom or Google Meet
Timezone Management:
Schedule calls during overlap hours (if possible)
Use Calendly for easy scheduling
Be clear about your availability
Respond during their business hours when possible
Legal & Business Setup
Contracts:
Use clear, simple service agreement
Include:
Scope of work
Timeline and milestones
Payment terms
Intellectual property rights (client owns final work)
Revision limits (2 rounds included)
Support period (30-60 days)
Termination clause
What happens if scope changes (change orders)
Payment Terms:
50% deposit to start
50% on completion before launch
For larger projects ($5,000+): Consider 3 payments (33% deposit, 33% at midpoint, 34% on completion)
Accept: Bank transfer, PayPal, Stripe, Payoneer, Wise
Invoicing:
Use professional invoicing software: Wave, FreshBooks, or Invoice Ninja
Invoice immediately after agreement
Include payment instructions and due date
Send reminder if overdue
Insurance (Optional but Recommended):
Professional liability insurance
Protects you if something goes wrong
Required by some larger clients
Business Registration:
Register as proper business entity in Nigeria
Opens doors to corporate clients
Looks more professional
Risk Management
Scope Creep:
Problem: Client keeps asking for "just one more thing"
Solution: Clear scope in contract, change order process for additions, charge for out-of-scope work
Non-Payment:
Problem: Client doesn't pay final 50%
Solution: Don't launch until paid, keep source code until paid, use escrow for large projects
Difficult Clients:
Problem: Client is demanding, rude, or unrealistic
Solution: Set boundaries early, document everything, be willing to fire bad clients
Timeline Delays:
Problem: Project takes longer than expected
Solution: Build buffer into estimates, communicate delays early, manage expectations
Technical Issues:
Problem: Something breaks after launch
Solution: Thorough testing, staging environment, post-launch support period, backups
Competition:
Problem: Client gets cheaper quote elsewhere
Solution: Compete on value and specialization, not just price. Show your expertise in fashion/beauty e-commerce.
Tools & Resources
Development:
Code editor: VS Code
Version control: GitHub
Hosting: AWS Amplify
Database: AWS RDS (PostgreSQL)
Email: Amazon SES
CDN: CloudFront
Design (if doing Design + Dev):
Design tool: Figma
Inspiration: Dribbble, Awwwards, CSS Design Awards
Stock photos: Unsplash, Pexels
Icons: Lucide React, Hero Icons
Project Management:
Tasks: Notion, Trello, Asana
Time tracking: Toggl, Clockify
Invoicing: Wave, FreshBooks
Marketing:
Email: MailChimp (for newsletters)
Social media: Buffer, Later (for scheduling)
Analytics: Google Analytics, Plausible
SEO: Google Search Console, Ahrefs (paid)
Communication:
Email: Professional email (hello@kylva.com)
Chat: Slack
Video: Zoom, Google Meet
Scheduling: Calendly
Learning & Community:
Nuxt Discord
Medusa Discord
r/webdev, r/ecommerce on Reddit
Dev.to community
Fashion e-commerce communities
Common Objections & Responses
"You're too expensive"
Response: "I understand budget is important. Our pricing reflects the value we deliver—a fast, mobile-optimized store that drives sales. Many fashion brands see 20-30% conversion improvements with proper mobile optimization. That can quickly pay for the investment. We can also explore phasing the project to fit your budget."

"Why not just use Shopify?"
Response: "Shopify is great for many brands, but it comes with monthly fees ($29-299+), transaction fees (up to 2%), and limitations on customization. With a custom solution, you pay once, own everything, and have complete control. For growing brands, this can save thousands per year."

"Can you do it cheaper?"
Response: "Our pricing reflects the quality and expertise we bring. However, if budget is tight, we can explore our Development Only service (if you have designs) or phase the project to spread costs. What's most important to you right now?"

"How do I know you won't disappear?"
Response: "Great question. We provide clear contracts, milestone-based payments, and we're building long-term relationships with our clients. We also offer post-launch support and many clients return for additional features. We're invested in your success."

"Do you have experience with [specific feature]?"
Response: (If yes) "Absolutely, we've built [specific feature] for [client/project]." (If no) "While we haven't built that exact feature yet, we have the technical expertise to implement it. We'd research best practices and ensure it's done right."

"Can you start right away?"
Response: "We currently have [X] projects in progress. We can start your project on [date], which allows us to give your project the full attention it deserves. We can begin discovery work earlier if needed."

"We need it in 2 weeks"
Response: "A quality fashion e-commerce site typically takes 4-8 weeks to ensure it's fast, mobile-optimized, and converts well. Rushing can compromise quality. However, we can discuss a phased launch—getting a basic version live quickly, then adding features. What's driving the tight timeline?"

Scaling Your Agency (Future Thinking)
When You're Ready to Grow:
Hire Contractors/Team Members:

When: Consistently have more work than you can handle alone
Who: Other Nuxt developers, designers, project managers
How: Start with project-based contractors, move to part-time, then full-time
Raise Prices:

When: Too much demand, fully booked 2-3 months out
How: Gradually increase prices for new clients
Target: Eventually $5,000-15,000 average project value
Add Services:

Ongoing maintenance and support
Marketing and conversion optimization
Expanded to other industries (keeping fashion/beauty as primary)
White-label services for other agencies
Create Productized Services:

Pre-designed e-commerce templates for fashion brands
Subscription model for maintenance
Training courses for fashion brands on e-commerce
Build SaaS Products:

E-commerce tools for fashion brands
Themes or plugins for popular platforms
Leverage your expertise into passive income
Final Notes
Remember:
Specialize: Fashion & beauty e-commerce is your niche—stay focused
Quality over quantity: 5 great clients > 20 mediocre ones
Build relationships: Happy clients refer more clients
Keep learning: E-commerce evolves—stay current with trends
Document everything: Processes, decisions, communications
Be patient: Building an agency takes time—6-12 months to gain momentum
Stay authentic: Be honest about capabilities and limitations
Deliver value: Your clients' success is your success
When Things Get Tough:
You will get rejections—it's normal
Some projects will be difficult—learn from them
Competition is fierce—but there's room for specialists
Imposter syndrome is real—you know more than you think
Slow months happen—keep marketing during busy times
Celebrate Wins:
First client
First $1,000 project
First $3,000 project
First referral client
First testimonial
First repeat client
Reaching monthly revenue goals
Resources for Continued Learning
Fashion E-commerce Trends:
Vogue Business
Glossy
Modern Retail
WWD (Women's Wear Daily)
E-commerce Development:
Medusa.js documentation
Nuxt documentation
Stripe documentation
Shopify Partners blog (even though you don't use Shopify, they have good insights)
Business & Marketing:
Y Combinator's Startup School
Indie Hackers community
r/entrepreneur
r/smallbusiness
Design Inspiration:
Awwwards (e-commerce category)
Commerce Cream (e-commerce design showcase)
Fashion brand websites (Reformation, Everlane, Glossier, Warby Parker)
Questions to Revisit Quarterly
Are we attracting the right clients (fashion/beauty brands with budgets)?
Are our prices still competitive but profitable?
Do we need to update our portfolio?
Is our website converting visitors to inquiries?
What marketing channels are working best?
Are we delivering on time and on budget?
Are clients happy? (NPS score)
Do we need to hire help?
Should we add or remove services?
Are we still enjoying the work?

This PRD is a living document. Update it as your agency grows and evolves. Good luck building Kylva! 🚀

