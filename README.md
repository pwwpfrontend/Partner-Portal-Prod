# Partnership Portal

A modern React-based partnership management system built with Create React App and Tailwind CSS.

## Features

### 🏠 Dashboard
- Overview of partnership statistics
- Quick access to key metrics
- Recent activity tracking

### 📦 Products Management
- **Product Catalog**: View all available products with detailed information
- **Role-Based Pricing**: Different pricing for Professional, Expert, Master, and Admin roles
- **Product Models**: Support for product variants with different SKUs and pricing
- **Search & Filtering**: Find products by name, SKU, category, or role
- **Admin Controls**: Add, edit, and delete products (Admin role only)

### 💬 Quotes Management
- Track customer quotes through the sales pipeline
- Status management (Pending, Approved, In Review, Draft)
- Priority-based organization

### ❓ Support System
- FAQ sections organized by category
- Support ticket management
- Resource downloads and documentation

## Components

### Core Components
- `Sidebar.js` - Navigation sidebar with responsive behavior
- `Header.js` - Top navigation bar with hamburger menu
- `Dashboard.js` - Main dashboard view
- `Products.js` - Comprehensive product management
- `Quotes.js` - Quote management interface
- `Support.js` - Support and help system

### Product Management
- `AddProduct.js` - Form for adding new products
- `EditProduct.js` - Form for editing existing products

## Technical Details

### Tech Stack
- **Frontend**: React 18 with Create React App
- **Styling**: Tailwind CSS with custom utilities
- **Icons**: Lucide React (professional icon library)
- **Font**: Inter (Google Fonts)
- **Routing**: React Router v6

### Key Features
- **Responsive Design**: Mobile-first approach with responsive sidebar
- **Role-Based Access**: Different views and permissions based on user role
- **API Integration**: Ready for backend integration with mock data fallback
- **Modern UI/UX**: Clean, professional interface with smooth animations

### Color Scheme
- **Primary**: #405952 (Dark Green)
- **Background**: Gray scale (100, 200, etc.)
- **Text**: Gray scale (600, 700, 800, 900)
- **Accents**: Blue, Green, Yellow, Red for status indicators

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Install Lucide Icons** (if not already installed)
   ```bash
   npm install lucide-react
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

4. **Access the Application**
   - Open [http://localhost:3000](http://localhost:3000)
   - Navigate to `/login` to access the dashboard
   - Use `/products` to view the product catalog

## API Integration

The application is designed to work with the following API endpoints:

- `GET /webhook/all_products` - Fetch all products
- `POST /add_product` - Add new product
- `PUT /edit_product/:id` - Update existing product
- `DELETE /delete_product/:id` - Delete product

Currently using mock data for development. Replace API calls in the service layer when backend is ready.

## User Roles

### Professional
- View products with MSRP pricing
- Access to basic features

### Expert
- View products with Standard Reseller pricing
- Enhanced access to features

### Master
- View products with Value Add Reseller pricing
- Premium access to features

### Admin
- Full access to all features
- Product management (CRUD operations)
- View all pricing tiers
- Duplicate product detection

## Responsive Behavior

- **Desktop**: Sidebar always visible, full navigation
- **Mobile**: Collapsible sidebar with hamburger menu
- **Tablet**: Adaptive layout with responsive grids

## Customization

### Adding New Product Categories
Update the category options in `AddProduct.js` and `EditProduct.js`:

```javascript
<option value="NewCategory">New Category</option>
```

### Modifying Role-Based Pricing
Update the role pricing logic in `Products.js`:

```javascript
const roles = ['Professional', 'Expert', 'Master', 'NewRole'];
```

### Styling Changes
Modify Tailwind classes or add custom CSS in `src/index.css`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Notes

- Uses React Hooks for state management
- Implements proper error handling and loading states
- Follows React best practices and component composition
- Ready for production deployment with build optimization

## License

This project is proprietary software for partnership management.
