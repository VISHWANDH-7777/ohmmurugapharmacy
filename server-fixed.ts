import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import crypto from 'crypto';
import {
  initializeDatabase,
  addProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  searchProducts,
  getProductsByCategory,
  createUser,
  authenticateUser,
  getAllUsers,
  getUserById
} from './src/database';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();
const PORT = process.env.PORT || 5000;

// ============ MIDDLEWARE ============
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============ DATABASE INITIALIZATION ============
let dbInitialized = false;

async function startServer() {
  try {
    await initializeDatabase();
    dbInitialized = true;
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// ============ PRODUCT ROUTES ============

/**
 * GET /api/products
 * Description: Fetch all products from MongoDB
 * Response: { success: true, products: Product[] }
 */
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    if (!dbInitialized) {
      return res.status(503).json({ error: 'Database not ready' });
    }

    console.log('📦 Fetching all products...');
    const products = await getAllProducts();
    console.log(`✅ Found ${products.length} products`);

    res.json({ 
      success: true,
      message: `Retrieved ${products.length} products`,
      products 
    });
  } catch (error: any) {
    console.error('❌ Error fetching products:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      details: error.stack 
    });
  }
});

/**
 * GET /api/products/:id
 * Description: Get single product by ID
 */
app.get('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (error: any) {
    console.error('❌ Error fetching product:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/products
 * Description: Add new product to MongoDB
 * Body: {
 *   name: string,
 *   category: string,
 *   price: number,
 *   description: string,
 *   image: string (base64 or URL),
 *   requiresPrescription?: boolean,
 *   dosage?: string
 * }
 */
app.post('/api/products', async (req: Request, res: Response) => {
  try {
    const { name, category, price, description, image, requiresPrescription, dosage } = req.body;

    // Validation
    if (!name || !category || price === undefined || !description) {
      return res.status(400).json({ 
        error: 'Validation error',
        missing: {
          name: !name,
          category: !category,
          price: price === undefined,
          description: !description,
          image: !image
        }
      });
    }

    console.log(`📝 Adding product: ${name}`);

    // Convert price to number
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ error: 'Invalid price value' });
    }

    // Add product to database
    const product = await addProduct(
      name,
      category,
      numPrice,
      description,
      image || 'https://images.unsplash.com/photo-1584308666721-bb8bd1f9913d?auto=format&fit=crop&q=80&w=400&h=400',
      requiresPrescription !== false,
      dosage
    );

    console.log(`✅ Product added successfully: ${product._id}`);

    res.status(201).json({ 
      success: true,
      message: 'Product added successfully',
      product 
    });
  } catch (error: any) {
    console.error('❌ Error adding product:', error);
    res.status(400).json({ 
      success: false,
      error: error.message,
      details: error.stack
    });
  }
});

/**
 * PUT /api/products/:id
 * Description: Update product
 */
app.put('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const { name, category, price, description, image, requiresPrescription, dosage } = req.body;

    console.log(`🔄 Updating product: ${req.params.id}`);

    const product = await updateProduct(req.params.id, {
      name,
      category,
      price,
      description,
      image,
      requiresPrescription,
      dosage
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log(`✅ Product updated: ${req.params.id}`);
    res.json({ success: true, message: 'Product updated', product });
  } catch (error: any) {
    console.error('❌ Error updating product:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/products/:id
 * Description: Delete product permanently from MongoDB
 */
app.delete('/api/products/:id', async (req: Request, res: Response) => {
  try {
    console.log(`🗑️  Deleting product: ${req.params.id}`);

    const product = await deleteProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log(`✅ Product deleted: ${req.params.id}`);
    res.json({ 
      success: true, 
      message: 'Product deleted permanently',
      deleted_id: req.params.id 
    });
  } catch (error: any) {
    console.error('❌ Error deleting product:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/products/category/:category
 * Description: Get products by category
 */
app.get('/api/products/category/:category', async (req: Request, res: Response) => {
  try {
    const products = await getProductsByCategory(req.params.category);
    res.json({ success: true, products });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/search/:query
 * Description: Search products
 */
app.get('/api/search/:query', async (req: Request, res: Response) => {
  try {
    const products = await searchProducts(req.params.query);
    res.json({ success: true, products });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ USER ROUTES ============

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, avatar } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = await createUser(name, email, password, role, avatar);
    res.status(201).json({ success: true, user });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await authenticateUser(email, password);
    const token = crypto.randomBytes(32).toString('hex');

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
      token
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    res.json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ HEALTH CHECK ============

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    success: true,
    message: 'Server is running',
    dbReady: dbInitialized,
    timestamp: new Date().toISOString()
  });
});

// ============ CATCH-ALL ROUTES ============

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Error Handler
app.use((err: any, req: Request, res: Response) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// ============ START SERVER ============

async function run() {
  await startServer();
  
  const server = app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 PHARMACY MANAGEMENT SERVER');
    console.log('='.repeat(60));
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`🌍 MongoDB: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/design_project'}`);
    console.log('='.repeat(60));
    console.log('\nAvailable Endpoints:');
    console.log('  GET    /api/products          - Get all products');
    console.log('  POST   /api/products          - Add new product');
    console.log('  GET    /api/products/:id      - Get product');
    console.log('  PUT    /api/products/:id      - Update product');
    console.log('  DELETE /api/products/:id      - Delete product');
    console.log('  POST   /api/auth/register     - Register user');
    console.log('  POST   /api/auth/login        - Login user');
    console.log('  GET    /api/health            - Health check');
    console.log('='.repeat(60) + '\n');
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n⏹️  Shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
}

run().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
