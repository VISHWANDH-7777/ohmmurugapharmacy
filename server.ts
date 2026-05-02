import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import crypto from 'crypto';
import {
  initializeDatabase,
  createUser,
  authenticateUser,
  getUserById,
  updateUser,
  deleteUser,
  getAllUsers,
  getUsersByRole,
  updateCustomerStats,
  getCustomerStats,
  searchUsers,
  hashPassword,
  addProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  searchProducts,
  getProductsByCategory,
  initializeCategories,
  getAllCategories,
  addCategory,
  deleteCategory
} from './src/database';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();
const PORT = process.env.PORT || 5002;

const formatUserForClient = (user: any) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  phone: user.phone,
  address: user.address,
  created_at: user.created_at,
  updated_at: user.updated_at
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize database
initializeDatabase().catch((error) => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

// Initialize categories
initializeCategories().catch((error) => {
  console.error('Failed to initialize categories:', error);
});

// ============ USER AUTHENTICATION ============

// Register new user
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, avatar } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const validRoles = ['customer', 'admin', 'owner'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await createUser(name, email, password, role, avatar);
    res.status(201).json({ success: true, user });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Login user
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await authenticateUser(email, password);

    // Generate token
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

// ============ USER MANAGEMENT ============

// Get all users (with optional role filter)
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const { role } = req.query;
    let users;

    if (role && typeof role === 'string') {
      const validRoles = ['customer', 'admin', 'owner'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      users = await getUsersByRole(role as 'customer' | 'admin' | 'owner');
    } else {
      users = await getAllUsers();
    }

    res.json({ success: true, users: users.map(formatUserForClient) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await getUserById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user: formatUserForClient(user) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
app.put('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const { name, phone, address, avatar } = req.body;

    await updateUser(req.params.id, { name, phone, address, avatar });

    const updatedUser = await getUserById(req.params.id);
    res.json({ success: true, user: updatedUser ? formatUserForClient(updatedUser) : null });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
app.delete('/api/users/:id', async (req: Request, res: Response) => {
  try {
    await deleteUser(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Search users
app.get('/api/users/search/:query', async (req: Request, res: Response) => {
  try {
    const users = await searchUsers(req.params.query);
    res.json({ success: true, users: users.map(formatUserForClient) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ CUSTOMER STATS ============

// Get customer stats
app.get('/api/customers/:userId/stats', async (req: Request, res: Response) => {
  try {
    const stats = await getCustomerStats(req.params.userId);

    if (!stats) {
      return res.status(404).json({ error: 'Customer stats not found' });
    }

    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update customer stats
app.put('/api/customers/:userId/stats', async (req: Request, res: Response) => {
  try {
    const { orderCount, totalSpent, loyaltyPoints } = req.body;

    await updateCustomerStats(req.params.userId, orderCount, totalSpent, loyaltyPoints);

    const stats = await getCustomerStats(req.params.userId);
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ PRODUCT MANAGEMENT ============

// Get all products
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    console.log(`\n📥 [GET /api/products] Fetching all products...`);
    const products = await getAllProducts();
    console.log(`   ✅ Found ${products.length} products`);
    if (products.length > 0) {
      console.log(`   📋 Product IDs:`, products.map(p => p._id).join(', '));
    } else {
      console.log(`   ⚠️  No products found in database!`);
    }
    // Map _id to id for frontend compatibility
    const formattedProducts = products.map(p => ({
      ...p,
      id: p._id
    }));
    res.json({ success: true, products: formattedProducts });
  } catch (error: any) {
    console.error(`   ❌ Error fetching products:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get product by ID
app.get('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    // Map _id to id for frontend compatibility
    const formattedProduct = { ...product, id: product._id };
    res.json({ success: true, product: formattedProduct });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get products by category
app.get('/api/products/category/:category', async (req: Request, res: Response) => {
  try {
    const products = await getProductsByCategory(req.params.category);
    // Map _id to id for frontend compatibility
    const formattedProducts = products.map(p => ({
      ...p,
      id: p._id
    }));
    res.json({ success: true, products: formattedProducts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Search products
app.get('/api/search/products/:query', async (req: Request, res: Response) => {
  try {
    const products = await searchProducts(req.params.query);
    // Map _id to id for frontend compatibility
    const formattedProducts = products.map(p => ({
      ...p,
      id: p._id
    }));
    res.json({ success: true, products: formattedProducts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add new product (POST)
app.post('/api/products', async (req: Request, res: Response) => {
  try {
    const { name, category, price, description, image, requiresPrescription, dosage } = req.body;

    console.log(`\n✅ [POST /api/products] Received new product:`);
    console.log(`   Name: ${name}`);
    console.log(`   Category: ${category}`);
    console.log(`   Price: $${price}`);
    console.log(`   Has image: ${!!image}`);

    if (!name || !category || !price || !description || !image) {
      console.warn(`   ❌ Missing required fields`);
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`   📝 Creating product in database...`);
    const product = await addProduct(
      name,
      category,
      Number(price),
      description,
      image,
      false,
      dosage
    );

    console.log(`   ✅ Product created successfully!`);
    console.log(`   Product ID: ${product._id}`);
    // Map _id to id for frontend compatibility
    const formattedProduct = { ...product, id: product._id };
    res.status(201).json({ success: true, product: formattedProduct });
  } catch (error: any) {
    console.error(`   ❌ Error creating product: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
});

// Update product
app.put('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const { name, category, price, description, image, requiresPrescription, dosage } = req.body;

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

    // Map _id to id for frontend compatibility
    const formattedProduct = { ...product, id: product._id };
    res.json({ success: true, product: formattedProduct });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product (DELETE)
app.delete('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const productId = req.params.id;
    console.log(`\n🗑️ [DELETE /api/products] Received delete request`);
    console.log(`   Product ID: ${productId}`);
    
    const product = await deleteProduct(productId);
    
    if (!product) {
      console.error(`   ❌ Product not found`);
      return res.status(404).json({ error: 'Product not found' });
    }
    
    console.log(`   ✅ Product deleted from database`);
    console.log(`   📊 Remaining products: ${await getAllProducts().then(p => p.length)}`);
    
    res.json({ success: true, message: 'Product deleted', deletedId: productId });
  } catch (error: any) {
    console.error(`   ❌ [DELETE /api/products] Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// ============ CATEGORY ROUTES ============

// Get all categories
app.get('/api/categories', async (req: Request, res: Response) => {
  try {
    const categories = await getAllCategories();
    res.json({ success: true, categories });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Add new category (admin/owner only)
app.post('/api/categories', async (req: Request, res: Response) => {
  try {
    const { name, user_id, user_role } = req.body;

    // Check if user is admin or owner
    if (user_role !== 'admin' && user_role !== 'owner') {
      return res.status(403).json({ error: 'Only admin and owner can create categories' });
    }

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const category = await addCategory(name.trim(), user_id);
    res.status(201).json({ success: true, category });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Reseed categories (admin only) - reload all default categories
app.post('/api/categories/reseed', async (req: Request, res: Response) => {
  try {
    const { user_role } = req.body;
    
    // Check if user is admin or owner
    if (user_role !== 'admin' && user_role !== 'owner') {
      return res.status(403).json({ error: 'Only admin and owner can reseed categories' });
    }

    // Reinitialize categories
    await initializeCategories();
    
    const categories = await getAllCategories();
    res.json({ success: true, message: 'Categories has been reseeded', categories });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete category (admin/owner only)
app.delete('/api/categories/:name', async (req: Request, res: Response) => {
  try {
    const categoryName = decodeURIComponent(req.params.name);
    const { user_role } = req.body;

    console.log(`\n🗑️ [DELETE /api/categories] Received delete request`);
    console.log(`   Category: "${categoryName}"`);
    console.log(`   User role: ${user_role}`);

    // Check authorization
    if (user_role !== 'admin' && user_role !== 'owner') {
      console.warn(`   ❌ Unauthorized: ${user_role} cannot delete categories`);
      return res.status(403).json({ 
        success: false, 
        error: 'Only admin and owner can delete categories' 
      });
    }

    // Delete the category
    let deletedCategory;
    try {
      deletedCategory = await deleteCategory(categoryName);
      console.log(`   ✅ Category deleted: ${deletedCategory.name}`);
    } catch (err: any) {
      console.error(`   ❌ Delete failed: ${err.message}`);
      return res.status(404).json({ 
        success: false, 
        error: err.message 
      });
    }
    
    // Get updated categories list
    const categories = await getAllCategories();
    console.log(`   📋 Updated categories count: ${categories.length}`);
    
    res.json({ 
      success: true, 
      message: 'Category deleted successfully', 
      categories 
    });
    
  } catch (error: any) {
    console.error(`❌ [DELETE /api/categories] Unexpected error: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============ HEALTH CHECK ============

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Server is running' });
});

// Diagnostic endpoint for debugging
app.get('/api/diagnostic', async (req: Request, res: Response) => {
  try {
    const mongoose = require('mongoose');
    const productCount = await mongoose.connection.collection('products').countDocuments();
    const categoryCount = await mongoose.connection.collection('categories').countDocuments();
    const userCount = await mongoose.connection.collection('users').countDocuments();
    
    // Get all products for debugging
    const allProducts = await getAllProducts();
    const allCategories = await getAllCategories();
    
    res.json({ 
      success: true, 
      database: {
        status: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        collections: {
          products: productCount,
          categories: categoryCount,
          users: userCount
        }
      },
      products: allProducts.map(p => ({ _id: p._id, name: p.name, category: p.category })),
      categories: allCategories
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🌍 MongoDB connected to ${process.env.MONGODB_URI || 'mongodb://localhost:27017/design_project?compressors=zlib'}`);
  console.log(`📦 Database compression: zlib enabled`);
  console.log(`⚡ Connection optimizations: Compression level 6, timeout 45s`);
});
