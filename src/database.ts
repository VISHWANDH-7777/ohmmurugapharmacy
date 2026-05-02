import mongoose, { Schema, Document, Model } from 'mongoose';
import crypto from 'crypto';

// MongoDB Connection URI with compression enabled
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/design_project?compressors=zlib&serverSelectionTimeoutMS=5000';

// Hash password function
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// ============ MONGODB SCHEMAS ============

// User Interface
export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: 'customer' | 'admin' | 'owner';
  avatar?: string;
  phone?: string;
  address?: string;
  created_at: Date;
  updated_at: Date;
}

// User Schema
const userSchema = new Schema<IUser>({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['customer', 'admin', 'owner'],
    required: true
  },
  avatar: { type: String },
  phone: { type: String },
  address: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Customer Interface
export interface ICustomer extends Document {
  _id: string;
  user_id: string;
  loyalty_points: number;
  order_count: number;
  total_spent: number;
}

// Customer Schema
const customerSchema = new Schema<ICustomer>({
  _id: { type: String, required: true },
  user_id: { type: String, unique: true, required: true },
  loyalty_points: { type: Number, default: 0 },
  order_count: { type: Number, default: 0 },
  total_spent: { type: Number, default: 0 }
});

// Admin Interface
export interface IAdmin extends Document {
  _id: string;
  user_id: string;
  permissions?: string;
  department?: string;
}

// Admin Schema
const adminSchema = new Schema<IAdmin>({
  _id: { type: String, required: true },
  user_id: { type: String, unique: true, required: true },
  permissions: { type: String },
  department: { type: String }
});

// Owner Interface
export interface IOwner extends Document {
  _id: string;
  user_id: string;
  business_name?: string;
  business_license?: string;
  company_registration?: string;
}

// Owner Schema
const ownerSchema = new Schema<IOwner>({
  _id: { type: String, required: true },
  user_id: { type: String, unique: true, required: true },
  business_name: { type: String },
  business_license: { type: String },
  company_registration: { type: String }
});

// Create Models
const UserModel: Model<IUser> = mongoose.model<IUser>('User', userSchema, 'users');
const CustomerModel: Model<ICustomer> = mongoose.model<ICustomer>('Customer', customerSchema, 'customers');
const AdminModel: Model<IAdmin> = mongoose.model<IAdmin>('Admin', adminSchema, 'admins');
const OwnerModel: Model<IOwner> = mongoose.model<IOwner>('Owner', ownerSchema, 'owners');

// ============ DATABASE INITIALIZATION ============

export async function initializeDatabase() {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI, {
        compressors: ['zlib'],
        zlibCompressionLevel: 6,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000
      });
      console.log('✅ MongoDB connected successfully with compression enabled');
      console.log('📦 Compression: zlib (level 6)');
      console.log('🌍 Connection URI:', MONGODB_URI);
    } else {
      console.log('✅ MongoDB already connected');
    }
  } catch (error: any) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    throw error;
  }
}

// ============ USER MANAGEMENT FUNCTIONS ============

export async function createUser(
  name: string,
  email: string,
  password: string,
  role: 'customer' | 'admin' | 'owner',
  avatar?: string
) {
  try {
    const id = 'user_' + crypto.randomBytes(8).toString('hex');
    const hashedPassword = hashPassword(password);

    // Create user
    const user = await UserModel.create({
      _id: id,
      name,
      email,
      password: hashedPassword,
      role,
      avatar
    });

    // Create role-specific record
    if (role === 'customer') {
      await CustomerModel.create({
        _id: 'cust_' + crypto.randomBytes(8).toString('hex'),
        user_id: id
      });
    } else if (role === 'admin') {
      await AdminModel.create({
        _id: 'admin_' + crypto.randomBytes(8).toString('hex'),
        user_id: id
      });
    } else if (role === 'owner') {
      await OwnerModel.create({
        _id: 'owner_' + crypto.randomBytes(8).toString('hex'),
        user_id: id
      });
    }

    return { id, name, email, role };
  } catch (error: any) {
    throw new Error(`Failed to create user: ${error.message}`);
  }
}

export async function authenticateUser(email: string, password: string) {
  try {
    const hashedPassword = hashPassword(password);
    const user = await UserModel.findOne({ email, password: hashedPassword });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    return user.toObject();
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function getUserById(id: string) {
  try {
    return await UserModel.findById(id).lean();
  } catch (error: any) {
    throw new Error(`Failed to get user: ${error.message}`);
  }
}

export async function updateUser(
  id: string,
  updates: { name?: string; phone?: string; address?: string; avatar?: string }
) {
  try {
    const updateData = {
      ...updates,
      updated_at: new Date()
    };
    return await UserModel.findByIdAndUpdate(id, updateData, { new: true }).lean();
  } catch (error: any) {
    throw new Error(`Failed to update user: ${error.message}`);
  }
}

export async function deleteUser(id: string) {
  try {
    await UserModel.findByIdAndDelete(id);
    // Also delete role-specific records
    await CustomerModel.deleteMany({ user_id: id });
    await AdminModel.deleteMany({ user_id: id });
    await OwnerModel.deleteMany({ user_id: id });
  } catch (error: any) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}

export async function getAllUsers(role?: string) {
  try {
    const query = role ? { role } : {};
    return await UserModel.find(query).sort({ created_at: -1 }).lean();
  } catch (error: any) {
    throw new Error(`Failed to get users: ${error.message}`);
  }
}

export async function getUsersByRole(role: 'customer' | 'admin' | 'owner') {
  try {
    return await UserModel.find({ role }).lean();
  } catch (error: any) {
    throw new Error(`Failed to get users by role: ${error.message}`);
  }
}

export async function updateCustomerStats(
  userId: string,
  orderCount: number,
  totalSpent: number,
  loyaltyPoints: number
) {
  try {
    return await CustomerModel.findOneAndUpdate(
      { user_id: userId },
      { order_count: orderCount, total_spent: totalSpent, loyalty_points: loyaltyPoints },
      { new: true }
    ).lean();
  } catch (error: any) {
    throw new Error(`Failed to update customer stats: ${error.message}`);
  }
}

export async function getCustomerStats(userId: string) {
  try {
    return await CustomerModel.findOne({ user_id: userId }).lean();
  } catch (error: any) {
    throw new Error(`Failed to get customer stats: ${error.message}`);
  }
}

export async function searchUsers(query: string) {
  try {
    return await UserModel.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } }
      ]
    })
      .sort({ created_at: -1 })
      .lean();
  } catch (error: any) {
    throw new Error(`Failed to search users: ${error.message}`);
  }
}

// ============ PRODUCT SCHEMA & FUNCTIONS ============

export interface IProduct extends Document {
  _id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  requiresPrescription: boolean;
  dosage?: string;
  created_at: Date;
  updated_at: Date;
}

const productSchema = new Schema<IProduct>({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  description: { type: String, required: true },
  image: { type: String, required: true },
  requiresPrescription: { type: Boolean, default: false },
  dosage: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const ProductModel: Model<IProduct> = mongoose.model<IProduct>('Product', productSchema, 'products');

export async function addProduct(
  name: string,
  category: string,
  price: number,
  description: string,
  image: string,
  requiresPrescription: boolean = false,
  dosage?: string
) {
  try {
    const id = 'prod_' + crypto.randomBytes(8).toString('hex');
    console.log(`\n📦 [addProduct] Creating product in MongoDB:`);
    console.log(`   ID: ${id}`);
    console.log(`   Name: ${name}`);
    console.log(`   Category: ${category}`);
    console.log(`   Price: $${price}`);
    
    const product = await ProductModel.create({
      _id: id,
      name,
      category,
      price,
      description,
      image,
      requiresPrescription,
      dosage
    });
    
    console.log(`   ✅ Product saved to database!`);
    console.log(`   Saved document: ${JSON.stringify(product.toObject())}`);
    console.log(`   \n📊 Total products in DB: ${await ProductModel.countDocuments()}`);
    
    return product.toObject();
  } catch (error: any) {
    console.error(`   ❌ [addProduct] Error: ${error.message}`);
    throw new Error(`Failed to add product: ${error.message}`);
  }
}

export async function getAllProducts() {
  try {
    console.log(`\n📚 [getAllProducts] Querying database...`);
    const products = await ProductModel.find().sort({ created_at: -1 }).lean();
    console.log(`   ✅ Query successful`);
    console.log(`   📦 Products count: ${products.length}`);
    if (products.length > 0) {
      console.log(`   🔍 First product:`, JSON.stringify(products[0]).substring(0, 100) + '...');
    }
    return products;
  } catch (error: any) {
    console.error(`   ❌ [getAllProducts] Error: ${error.message}`);
    throw new Error(`Failed to get products: ${error.message}`);
  }
}

export async function getProductById(id: string) {
  try {
    return await ProductModel.findById(id).lean();
  } catch (error: any) {
    throw new Error(`Failed to get product: ${error.message}`);
  }
}

export async function updateProduct(
  id: string,
  updates: {
    name?: string;
    category?: string;
    price?: number;
    description?: string;
    image?: string;
    requiresPrescription?: boolean;
    dosage?: string;
  }
) {
  try {
    const updateData = {
      ...Object.fromEntries(
        Object.entries(updates).filter(([, value]) => value !== undefined)
      ),
      updated_at: new Date()
    };
    return await ProductModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).lean();
  } catch (error: any) {
    throw new Error(`Failed to update product: ${error.message}`);
  }
}

export async function deleteProduct(id: string) {
  try {
    console.log(`\n🗑️ [deleteProduct] Attempting to delete product: ${id}`);
    
    // First find the product to get its details
    const product = await ProductModel.findById(id);
    if (!product) {
      console.error(`   ❌ Product not found with ID: ${id}`);
      throw new Error(`Product with ID "${id}" not found`);
    }
    
    console.log(`   📍 Found product: ${product.name}`);
    
    // Delete the product
    const deletedProduct = await ProductModel.findByIdAndDelete(id);
    
    if (!deletedProduct) {
      console.error(`   ❌ Failed to delete product`);
      throw new Error(`Failed to delete product`);
    }
    
    console.log(`   ✅ Product deleted successfully!`);
    console.log(`   📊 [deleteProduct] Product count after deletion: ${await ProductModel.countDocuments()}`);
    
    return deletedProduct;
  } catch (error: any) {
    console.error(`   ❌ [deleteProduct] Error: ${error.message}`);
    throw new Error(`Failed to delete product: ${error.message}`);
  }
}

export async function searchProducts(query: string) {
  try {
    return await ProductModel.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ]
    })
      .sort({ created_at: -1 })
      .lean();
  } catch (error: any) {
    throw new Error(`Failed to search products: ${error.message}`);
  }
}

export async function getProductsByCategory(category: string) {
  try {
    return await ProductModel.find({ category }).sort({ created_at: -1 }).lean();
  } catch (error: any) {
    throw new Error(`Failed to get products by category: ${error.message}`);
  }
}

// ============ CATEGORY SCHEMA & FUNCTIONS ============

export interface ICategory extends Document {
  _id: string;
  name: string;
  created_by?: string;
  created_at: Date;
}

const categorySchema = new Schema<ICategory>({
  _id: { type: String, required: true },
  name: { type: String, required: true, unique: true },
  created_by: { type: String },
  created_at: { type: Date, default: Date.now }
});

const CategoryModel: Model<ICategory> = mongoose.model<ICategory>('Category', categorySchema, 'categories');

// Initialize default categories
export async function initializeCategories() {
  try {
    const count = await CategoryModel.countDocuments();
    if (count === 0) {
      const defaultCategories = [
        'All',
        'Pain Relief',
        'Vitamins & Supplements',
        'First Aid',
        'Personal Care',
        'Baby Care',
        'Cold & Flu',
        'Digestive Health',
        'Medical Devices',
        'Supports & Braces'
      ];
      
      for (const cat of defaultCategories) {
        if (cat !== 'All') {
          await CategoryModel.create({
            _id: 'cat_' + crypto.randomBytes(6).toString('hex'),
            name: cat
          });
        }
      }
    }
  } catch (error: any) {
    console.log('Categories already initialized or error:', error.message);
  }
}

export async function getAllCategories() {
  try {
    const categories = await CategoryModel.find().sort({ created_at: 1 }).lean();
    // Add 'All' at the beginning
    return ['All', ...categories.map(c => c.name)];
  } catch (error: any) {
    throw new Error(`Failed to get categories: ${error.message}`);
  }
}

export async function addCategory(name: string, createdBy?: string) {
  try {
    // Check if category already exists
    const existing = await CategoryModel.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (existing) {
      throw new Error('Category already exists');
    }
    
    const id = 'cat_' + crypto.randomBytes(8).toString('hex');
    const category = await CategoryModel.create({
      _id: id,
      name,
      created_by: createdBy
    });
    return category.toObject();
  } catch (error: any) {
    throw new Error(`Failed to add category: ${error.message}`);
  }
}

export async function deleteCategory(name: string) {
  try {
    const trimmedName = name.trim();
    
    if (trimmedName === 'All') {
      throw new Error('Cannot delete the "All" category');
    }

    console.log(`�️ [deleteCategory] Attempting to delete category: "${trimmedName}"`);
    
    // Find the category first
    const category = await CategoryModel.findOne({ 
      name: { $regex: `^${trimmedName}$`, $options: 'i' } 
    });
    
    if (!category) {
      console.log(`❌ [deleteCategory] Category not found: "${trimmedName}"`);
      // List all available categories for debugging
      const allCategories = await CategoryModel.find().select('name').lean();
      console.log(`📋 Available categories:`, allCategories.map(c => c.name));
      throw new Error(`Category "${trimmedName}" not found`);
    }

    console.log(`✅ [deleteCategory] Found category: "${category.name}" (ID: ${category._id})`);
    
    // Delete the category using deleteOne
    const deleteResult = await CategoryModel.deleteOne({ _id: category._id });
    
    console.log(`📊 [deleteCategory] Delete operation result:`, deleteResult);
    
    if (deleteResult.deletedCount === 0) {
      console.error(`❌ [deleteCategory] Failed to delete category: ${category.name}`);
      throw new Error(`Failed to delete category "${trimmedName}"`);
    }

    console.log(`✅ [deleteCategory] Successfully deleted category: ${category.name}`);
    return category.toObject();
  } catch (error: any) {
    console.error('❌ [deleteCategory] Error:', error.message);
    throw error;
  }
}

export { mongoose };
