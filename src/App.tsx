import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  X, 
  MessageSquare, 
  Send, 
  ChevronRight, 
  Heart, 
  ShieldCheck, 
  Truck, 
  Clock,
  Menu,
  User,
  Filter,
  CheckCircle2,
  Check,
  AlertCircle,
  Mail,
  Lock,
  Shield,
  LogOut,
  Plus,
  Tag,
  FileText,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, MOCK_PRODUCTS, CATEGORIES } from './constants';
import { getGeminiResponse } from './services/geminiService';
import {
  getAllUsers as fetchAllUsers,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  saveCurrentUser,
  updateUserProfile,
  type User as PersistedUser
} from './services/databaseService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5002/api' : '/api');

function normalizeProduct(product: Product & { _id?: string }) {
  return {
    ...product,
    id: product.id || product._id || '',
    requiresPrescription: false,
  };
}

async function readJsonSafely(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

type FrontendUserRole = 'admin' | 'owner' | 'user';

type AppUser = {
  id: string;
  name: string;
  email: string;
  role: FrontendUserRole;
  avatar?: string;
  phone?: string;
  address?: string;
};

function mapBackendRoleToFrontend(role: PersistedUser['role']): FrontendUserRole {
  return role === 'customer' ? 'user' : role;
}

function mapFrontendRoleToBackend(role: FrontendUserRole): PersistedUser['role'] {
  return role === 'user' ? 'customer' : role;
}

function toAppUser(user: PersistedUser): AppUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: mapBackendRoleToFrontend(user.role),
    avatar: user.avatar,
    phone: user.phone,
    address: user.address
  };
}

function toPersistedUser(user: AppUser): PersistedUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: mapFrontendRoleToBackend(user.role),
    avatar: user.avatar,
    phone: user.phone,
    address: user.address
  };
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

export default function App() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: 'Hello! I am your E-pharmacy website Health Assistant. How can I help you today?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loginData, setLoginData] = useState({ email: '', password: '', name: '' });
  const [loginError, setLoginError] = useState('');
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editProductImage, setEditProductImage] = useState('');
  const productImageInputRef = useRef<HTMLInputElement>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const [ownerPassword, setOwnerPassword] = useState('owner123');
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [newOwnerPassword, setNewOwnerPassword] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<{ email: string; password: string; name: string }[]>([]);
  const [isShopAvailable, setIsShopAvailable] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const applyLoggedInUser = (persistedUser: PersistedUser) => {
    const nextUser = toAppUser(persistedUser);
    setUser(nextUser);
    setIsLoggedIn(true);
    saveCurrentUser(toPersistedUser(nextUser));
    return nextUser;
  };

  const findPersistedUserByEmail = async (email: string) => {
    const result = await fetchAllUsers();

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch users');
    }

    return result.users.find(
      (existingUser) => existingUser.email.toLowerCase() === email.toLowerCase()
    ) || null;
  };

  const ensurePersistedUser = async ({
    name,
    email,
    password,
    role,
    avatar
  }: {
    name: string;
    email: string;
    password: string;
    role: PersistedUser['role'];
    avatar?: string;
  }) => {
    const existingUser = await findPersistedUserByEmail(email);
    if (existingUser) {
      return existingUser;
    }

    const registration = await registerUser(name, email, password, role, avatar);
    if (!registration.success) {
      throw new Error(registration.error || 'Failed to register user');
    }

    return {
      ...registration.user,
      role,
      avatar: avatar || registration.user.avatar
    } as PersistedUser;
  };
  
  /*
  const handleDeleteProduct = async (productId: string) => {
    if (!productId) {
      alert('Unable to delete product because the product ID is missing.');
      return;
    }

    if (confirm('Are you sure you want to delete this product?')) {
      try {
        console.log(`\n🗑️ [Frontend] Deleting product: ${productId}`);
        
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
          method: 'DELETE'
        });

        
        const data = await readJsonSafely(response);
          console.error('   ❌ Failed to parse response:', jsonError.message);
        }

        // Check if operation was successful
        if (!response.ok) {
          console.error(`   ❌ HTTP Error: ${response.status} - ${data.error}`);
          throw new Error(data.error || `HTTP ${response.status}`);
        }

        if (data.success) {
          console.log(`   ✅ Product deleted from database`);
          // Reload products from backend to ensure consistency
          await loadProducts();
          setSelectedProduct(null);
          alert('✅ Product deleted successfully!');
        } else {
          console.error(`   ❌ Delete failed: ${data.error}`);
          throw new Error(data.error || 'Failed to delete product');
        }
      } catch (error) {
        console.error('❌ Failed to delete product:', error.message);
        alert(`Failed to delete product: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  };
  */

  const handleDeleteProduct = async (productId: string) => {
    if (!productId) {
      alert('Unable to delete product because the product ID is missing.');
      return;
    }

    if (confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
          method: 'DELETE'
        });

        const data = await readJsonSafely(response);

        if (!response.ok) {
          throw new Error(data?.error || data?.message || `HTTP ${response.status}`);
        }

        if (!data?.success) {
          throw new Error(data?.error || 'Failed to delete product');
        }

        setProducts((prev) => prev.filter((product) => product.id !== productId));
        setWishlist((prev) => prev.filter((id) => id !== productId));
        setSelectedProduct((current) => current?.id === productId ? null : current);
        setIsEditingProduct(false);
        setEditProductImage('');
        alert('Product deleted successfully!');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to delete product:', message);
        alert(`Failed to delete product: ${message}`);
      }
    }
  };

  const handleEditProductImage = () => {
    if (selectedProduct) {
      setIsEditingProduct(true);
      setEditProductImage(selectedProduct.image);
    }
  };

  const handleSaveProductImage = async () => {
    if (selectedProduct && editProductImage.trim()) {
      try {
        const nextImage = editProductImage.trim();
        const response = await fetch(`${API_BASE_URL}/products/${selectedProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: selectedProduct.name,
            category: selectedProduct.category,
            price: selectedProduct.price,
            description: selectedProduct.description,
            image: nextImage,
            requiresPrescription: selectedProduct.requiresPrescription,
            dosage: selectedProduct.dosage ?? ''
          })
        });

        const data = await readJsonSafely(response);

        if (!response.ok) {
          throw new Error(data?.error || data?.message || `HTTP ${response.status}`);
        }

        if (data?.success) {
          const updatedProduct = normalizeProduct(data.product || { ...selectedProduct, image: nextImage });
          setProducts((prev) => prev.map((product) => (
            product.id === updatedProduct.id ? updatedProduct : product
          )));
          setSelectedProduct(updatedProduct);
          setIsEditingProduct(false);
          setEditProductImage('');
          alert('Product image updated successfully!');
        } else {
          alert('Error: ' + (data?.error || 'Failed to update product image'));
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to update product image:', message);
        alert(`Failed to update product image: ${message}`);
      }
    }
  };

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditProductImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancelEditProductImage = () => {
    setIsEditingProduct(false);
    setEditProductImage('');
  };
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUser({ ...user, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    category: '',
    price: 0,
    description: '',
    image: '',
    requiresPrescription: false
  });

  // Load products and categories from MongoDB on component mount
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  // Fetch all products from backend API
  const loadProducts = async () => {
    try {
      console.log('\n📦 [loadProducts] Fetching products from server...');
      const response = await fetch(`${API_BASE_URL}/products`);
      const data = await readJsonSafely(response);
      if (!response.ok) {
        throw new Error(data?.error || `HTTP ${response.status}`);
      }
      console.log(`   ✅ Received ${data.products?.length || 0} products`);
      if (data?.success && Array.isArray(data.products)) {
        setProducts(data.products.map(normalizeProduct));
      } else {
        console.warn('   ⚠️ No products in response');
        setProducts(MOCK_PRODUCTS.map(normalizeProduct));
      }
    } catch (error) {
      console.error('   ❌ Failed to load products:', error);
      setProducts(MOCK_PRODUCTS.map(normalizeProduct));
    }
  };

  // Load categories from backend API
  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      const data = await response.json();
      if (data.success && data.categories) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      // Fallback to default categories if API fails
      setCategories(CATEGORIES);
    }
  };

  // Add new category (admin/owner only)
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !user || (user.role !== 'admin' && user.role !== 'owner')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          user_id: user.email,
          user_role: user.role
        })
      });

      const data = await response.json();
      if (data.success) {
        // Reload categories
        await loadCategories();
        // Automatically assign the newly created category to the product
        setNewProduct({...newProduct, category: newCategoryName.trim()});
        setNewCategoryName('');
        setIsAddCategoryOpen(false);
        alert('Category created successfully and assigned to this product!');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to add category:', error);
      alert('Failed to add category. Please try again.');
    }
  };

  // Reseed categories (admin/owner only)
  const handleReseedCategories = async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
      alert('Only admin and owner can reseed categories');
      return;
    }

    if (!confirm('This will reload all default categories. Continue?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/categories/reseed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_role: user.role
        })
      });

      const data = await response.json();
      if (data.success) {
        // Reload categories
        await loadCategories();
        alert('✅ All categories have been loaded! ' + data.categories.length + ' categories available.');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to reseed categories:', error);
      alert('Failed to reseed categories. Please try again.');
    }
  };

  // Delete category (admin/owner only)
  const handleDeleteCategory = async (categoryName: string) => {
    if (categoryName === 'All') {
      alert('Cannot delete the "All" category');
      return;
    }

    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
      alert('Only admin and owner can delete categories');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${categoryName}" category?`)) {
      return;
    }

    try {
      console.log(`\n🗑️ [Frontend] Deleting category: "${categoryName}"`);
      console.log(`   User: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      
      const url = `${API_BASE_URL}/categories/${encodeURIComponent(categoryName)}`;
      console.log(`   API: DELETE ${url}`);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_role: user.role
        })
      });

      console.log(`   Response status: ${response.status} ${response.statusText}`);

      // Check if response is ok
      if (!response.ok) {
        console.error(`   ❌ HTTP Error: ${response.status}`);
      }

      // Try to parse response
      let data;
      try {
        data = await response.json();
        console.log(`   Response data:`, data);
      } catch (jsonError) {
        console.error('   ❌ Response is not valid JSON:', jsonError);
        const text = await response.text();
        console.error('   Response text:', text);
        throw new Error('Server returned invalid response. Check server logs.');
      }
      
      if (data.success) {
        console.log(`   ✅ Category deleted successfully!`);
        // Reload categories and reset to "All" if current category was deleted
        await loadCategories();
        if (activeCategory === categoryName) {
          setActiveCategory('All');
        }
        alert(`✅ Category "${categoryName}" deleted successfully!`);
      } else {
        console.error(`   ❌ Delete failed: ${data.error}`);
        alert(`Error: ${data.error || 'Failed to delete category'}`);
      }
    } catch (error) {
      console.error('❌ [Frontend] Failed to delete category:', error);
      alert(`Failed to delete category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct({ ...newProduct, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const mergedCategories = useMemo(() => {
    const uniqueCategories = new Map<string, string>();

    const addCategory = (value?: string) => {
      if (!value) {
        return;
      }

      const trimmedValue = value.trim();
      if (!trimmedValue) {
        return;
      }

      const key = trimmedValue.toLowerCase();
      if (!uniqueCategories.has(key)) {
        uniqueCategories.set(key, trimmedValue);
      }
    };

    addCategory('All');
    categories.forEach(addCategory);
    products.forEach((product) => addCategory(product.category));

    return Array.from(uniqueCategories.values());
  }, [categories, products]);

  const selectableCategories = useMemo(
    () => mergedCategories.filter((category) => category !== 'All'),
    [mergedCategories]
  );

  // Filter products based on category and search
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery, products]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.description) return;

    try {
      const productData = {
        name: newProduct.name,
        category: newProduct.category || selectableCategories[0] || 'General',
        price: Number(newProduct.price),
        description: newProduct.description,
        image: newProduct.image || 'https://images.unsplash.com/photo-1584308666721-bb8bd1f9913d?auto=format&fit=crop&q=80&w=400&h=400',
        requiresPrescription: false,
        dosage: newProduct.dosage || ''
      };

      console.log('\n📝 [handleAddProduct] Adding new product:');
      console.log('   Name:', productData.name);
      console.log('   Category:', productData.category);
      console.log('   Price:', productData.price);
      console.log('   Has image:', !!productData.image);
      
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });

      console.log('   Response status:', response.status);
      
      let data;
      try {
        data = await response.json();
        console.log('   Response data:', data);
      } catch (jsonError) {
        console.error('   ❌ Failed to parse response:', jsonError.message);
        throw new Error('Invalid server response');
      }
      
      if (data.success && response.ok) {
        console.log('   ✅ Product created with ID:', data.product._id);
        console.log('   📦 Reloading products list...');
        
        // Reload products from backend to ensure consistency
        await loadProducts();
        
        // Close modal and reset form
        setIsAddProductOpen(false);
        setNewProduct({
          name: '',
          category: selectableCategories[0] || '',
          price: 0,
          description: '',
          image: '',
          requiresPrescription: false
        });
        alert('✅ Product added successfully!');
      } else {
        console.error('   ❌ Server error:', data.error);
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('❌ [handleAddProduct] Error:', error.message);
      alert('Failed to add product: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };
  const toggleWishlist = (productId: string) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId]
    );
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    const userMsg = userInput;
    setUserInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    const aiResponse = await getGeminiResponse(userMsg);
    setChatMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    setIsTyping(false);
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isProcessing) return;

    setLoginError('');
    
    // Validate input
    if (!loginData.email || !loginData.password) {
      setLoginError('Email and password are required');
      return;
    }

    if (isSignUp && !loginData.name) {
      setLoginError('Name is required for registration');
      return;
    }

    setIsProcessing(true);
    
    // Simulate login/signup
    setTimeout(() => {
      const emailLower = loginData.email.toLowerCase();
      const nameLower = loginData.name.toLowerCase();

      // =========== REGISTRATION SIGNUP ===========
      if (isSignUp) {
        // Check if email already exists (admin/owner or regular user)
        const emailExists = registeredUsers.some(u => u.email.toLowerCase() === emailLower) ||
                           emailLower === 'admin@ohmsivamuruga.com' || 
                           emailLower === 'admin@gmail.com' ||
                           emailLower === 'owner@ohmsivamuruga.com';

        if (emailExists) {
          setLoginError('Email already registered. Please login instead.');
          setIsProcessing(false);
          return;
        }

        // Prevent regular users from creating admin/owner accounts
        if (nameLower.includes('admin') || emailLower.includes('admin') || 
            nameLower.includes('owner') || emailLower.includes('owner')) {
          setLoginError('Cannot create admin/owner accounts. Use your actual details.');
          setIsProcessing(false);
          return;
        }

        // Register new customer
        setRegisteredUsers(prev => [...prev, {
          email: loginData.email,
          password: loginData.password,
          name: loginData.name
        }]);

        const defaultAvatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200&h=200';
        setUser({ 
          name: loginData.name, 
          email: loginData.email, 
          role: 'user', 
          avatar: defaultAvatar 
        });
        
        setIsLoggedIn(true);
        setOrders([]);
        setIsProcessing(false);
        setIsLoginOpen(false);
        setIsSignUp(false);
        setLoginData({ email: '', password: '', name: '' });
        return;
      }

      // =========== LOGIN VALIDATION ===========
      // Check for ADMIN credentials
      if (emailLower === 'admin@ohmsivamuruga.com' || emailLower === 'admin@gmail.com' || emailLower.includes('admin')) {
        if (loginData.password !== 'admin123') {
          setLoginError('Invalid email or password');
          setIsProcessing(false);
          return;
        }
        
        setIsLoggedIn(true);
        const defaultAvatar = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200&h=200';
        setUser({ 
          name: 'System Admin', 
          email: loginData.email, 
          role: 'admin', 
          avatar: defaultAvatar 
        });
        setOrders([{
          id: 'PH-82734',
          date: '01 Mar 2024',
          items: [MOCK_PRODUCTS[0], MOCK_PRODUCTS[1]],
          total: MOCK_PRODUCTS[0].price + MOCK_PRODUCTS[1].price,
          status: 'Delivered',
          shipping: { name: 'System Admin', city: 'Mumbai' }
        }]);
        setIsProcessing(false);
        setIsLoginOpen(false);
        setIsSignUp(false);
        setLoginData({ email: '', password: '', name: '' });
        return;
      }

      // Check for OWNER credentials
      if (emailLower === 'owner@ohmsivamuruga.com' || emailLower.includes('owner')) {
        if (loginData.password !== ownerPassword) {
          setLoginError('Invalid email or password');
          setIsProcessing(false);
          return;
        }
        
        setIsLoggedIn(true);
        const defaultAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200';
        setUser({ 
          name: 'Store Owner', 
          email: loginData.email, 
          role: 'owner', 
          avatar: defaultAvatar 
        });
        setOrders([{
          id: 'PH-82734',
          date: '01 Mar 2024',
          items: [MOCK_PRODUCTS[0], MOCK_PRODUCTS[1]],
          total: MOCK_PRODUCTS[0].price + MOCK_PRODUCTS[1].price,
          status: 'Delivered',
          shipping: { name: 'Store Owner', city: 'Mumbai' }
        }]);
        setIsProcessing(false);
        setIsLoginOpen(false);
        setIsSignUp(false);
        setLoginData({ email: '', password: '', name: '' });
        return;
      }

      // Check for REGISTERED CUSTOMER
      const registeredUser = registeredUsers.find(u => u.email.toLowerCase() === emailLower);
      
      if (!registeredUser) {
        setLoginError('Account not found. Please sign up first.');
        setIsProcessing(false);
        return;
      }

      // Verify password for registered customer
      if (registeredUser.password !== loginData.password) {
        setLoginError('Invalid email or password');
        setIsProcessing(false);
        return;
      }

      // Login successful for registered customer
      setIsLoggedIn(true);
      const defaultAvatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200&h=200';
      setUser({ 
        name: registeredUser.name, 
        email: registeredUser.email, 
        role: 'user', 
        avatar: defaultAvatar 
      });
      setOrders([{
        id: 'PH-82734',
        date: '01 Mar 2024',
        items: [MOCK_PRODUCTS[0], MOCK_PRODUCTS[1]],
        total: MOCK_PRODUCTS[0].price + MOCK_PRODUCTS[1].price,
        status: 'Delivered',
        shipping: { name: registeredUser.name, city: 'Mumbai' }
      }]);
      
      setIsProcessing(false);
      setIsLoginOpen(false);
      setIsSignUp(false);
      setLoginData({ email: '', password: '', name: '' });
    }, 1500);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setLoginData({ email: '', password: '', name: '' });
    setLoginError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shadow-sm border border-slate-200">
            <img src="/new-symbol.png" alt="OHM Sivamuruga Medicals Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
            OHM SIVAMURUGA MEDICALS
          </h1>
        </div>

        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search medicines, vitamins, health products..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {(user?.role === 'admin' || user?.role === 'owner') && (
            <motion.button 
              onClick={() => setIsAddProductOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all text-xs md:text-sm"
            >
              <Plus size={16} className="md:w-[18px] md:h-[18px]" /> Add Product
            </motion.button>
          )}
          <motion.button 
            onClick={() => setIsLoginOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative group"
          >
            {isLoggedIn && user?.avatar ? (
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-slate-200 flex items-center justify-center bg-emerald-100">
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <User size={22} />
            )}
            <span className="hidden md:block text-sm font-semibold">
              {isLoggedIn ? user?.name : 'Sign In'}
            </span>
            {isLoggedIn && (
              <span className="absolute top-1 left-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
            )}
          </motion.button>
          <button className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <Menu size={22} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="bg-white px-4 md:px-8 py-12 md:py-20 flex flex-col md:flex-row items-center gap-12 overflow-hidden">
        <div className="flex-1 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-light text-primary-dark rounded-full text-sm font-semibold">
              <Truck size={14} /> Free delivery on orders over ₹500
            </div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
              isShopAvailable 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              <CheckCircle2 size={14} /> {isShopAvailable ? 'Shop Open' : 'Shop Closed'}
            </div>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold leading-tight">
            Your Trusted Online <span className="text-primary">Health Partner</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-lg">
            Get authentic medicines, wellness products, and expert health advice delivered right to your doorstep. Fast, reliable, and secure.
          </p>
          <div className="flex items-center gap-8 pt-8">
            <div className="flex flex-col">
              <span className="text-2xl font-bold">50k+</span>
              <span className="text-sm text-slate-500">Happy Customers</span>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div className="flex flex-col">
              <span className="text-2xl font-bold">10k+</span>
              <span className="text-sm text-slate-500">Products Available</span>
            </div>
          </div>
        </div>
        <div className="flex-1 relative">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl -z-10 transform scale-110" />
          <img 
            src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1200&h=800" 
            alt="Medical Supplies" 
            className="rounded-3xl shadow-2xl object-cover w-full h-[400px]"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = "https://picsum.photos/seed/medical/800/600";
            }}
          />
        </div>
      </header>

      {/* Main Content */}
      <main id="products-section" className="flex-1 px-4 md:px-8 py-12 max-w-7xl mx-auto w-full">
        {/* Category Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4 overflow-x-auto pb-4 md:pb-0 no-scrollbar">
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-slate-600 shrink-0">
              <Filter size={16} />
              <span className="text-sm font-medium">Categories:</span>
            </div>
            {mergedCategories.map(cat => (
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="group relative shrink-0"
              >
                <motion.button
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    activeCategory === cat 
                    ? 'bg-primary text-white shadow-md shadow-primary/20' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-primary/50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {cat}
                </motion.button>
                
                {/* Delete button for admin/owner (shows on hover) */}
                {(user?.role === 'admin' || user?.role === 'owner') && cat !== 'All' && (
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(cat);
                    }}
                    className="absolute -top-2.5 -right-2.5 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title={`Delete ${cat} category`}
                  >
                    <X size={12} strokeWidth={2.5} />
                  </motion.button>
                )}
              </motion.div>
            ))}
          </div>
          {(user?.role === 'admin' || user?.role === 'owner') && (
            <motion.button
              type="button"
              onClick={() => setIsAddCategoryOpen(true)}
              className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-all font-bold text-sm flex items-center justify-center gap-2 shrink-0"
              title="Add new category"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              + Add Category
            </motion.button>
          )}


        </div>

        {/* Product Grid */}
        <div id="products-section" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map(product => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className={`group relative cursor-pointer overflow-hidden rounded-[28px] border border-white/80 bg-white/95 p-3 shadow-[0_22px_55px_-32px_rgba(15,23,42,0.35)] transition-all ${
                  isShopAvailable
                    ? 'hover:border-emerald-200/80 hover:shadow-[0_32px_75px_-35px_rgba(16,185,129,0.35)]'
                    : 'grayscale hover:border-slate-200/80 hover:shadow-[0_28px_65px_-35px_rgba(15,23,42,0.22)]'
                }`}
              >
                <div className="pointer-events-none absolute inset-x-8 top-0 h-24 rounded-b-full bg-emerald-100/70 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative mb-5 overflow-hidden rounded-[24px] border border-slate-100/80 bg-[linear-gradient(160deg,#f8fafc_0%,#ffffff_52%,#ecfdf5_100%)]">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.18),transparent_45%)]" />

                  <div className="absolute inset-x-4 top-4 z-10 flex items-start justify-between gap-3">
                    <span className="max-w-[70%] truncate rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700 shadow-sm backdrop-blur-sm">
                      {product.category}
                    </span>

                    <div className="flex items-center gap-2">
                      {(user?.role === 'admin' || user?.role === 'owner') && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProduct(product.id);
                          }}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/95 text-white shadow-lg shadow-red-200/80 transition-all hover:scale-105 hover:bg-red-600"
                          title="Delete product"
                        >
                          <X size={16} />
                        </button>
                      )}

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(product.id);
                        }}
                        className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white/90 backdrop-blur-sm shadow-lg shadow-slate-200/70 transition-all ${
                          wishlist.includes(product.id) ? 'text-red-500' : 'text-slate-400 hover:text-red-500'
                        }`}
                        title={wishlist.includes(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                      >
                        <Heart size={18} fill={wishlist.includes(product.id) ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </div>

                  <div className="relative aspect-[4/3] px-6 pb-6 pt-16">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="h-full w-full object-contain drop-shadow-[0_20px_30px_rgba(15,23,42,0.14)] transition-transform duration-500 group-hover:scale-[1.06]"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = `https://picsum.photos/seed/${product.id}/400/400`;
                      }}
                    />
                  </div>

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/75 to-transparent" />
                </div>

                <div className="relative px-2 pb-2">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        Curated For Care
                      </p>
                      <h3 className="line-clamp-2 text-xl font-bold leading-tight text-slate-900">
                        {product.name}
                      </h3>
                    </div>

                  </div>

                  <p className="mb-4 min-h-[48px] text-sm leading-6 text-slate-500 line-clamp-2">
                    {product.description}
                  </p>

                  {product.dosage && (
                    <div className="mb-4 inline-flex max-w-full items-center rounded-full bg-slate-100/90 px-3 py-1 text-xs font-medium text-slate-500">
                      <span className="truncate">{product.dosage}</span>
                    </div>
                  )}

                  <div className="flex items-end justify-between gap-4 border-t border-slate-100 pt-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        Price
                      </p>
                      <p className="text-3xl font-bold tracking-tight text-slate-900">
                        ₹{product.price.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
                      <span>View Details</span>
                      <ChevronRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>

                <div className="hidden relative aspect-square rounded-xl overflow-hidden mb-4 bg-slate-50">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = `https://picsum.photos/seed/${product.id}/400/400`;
                    }}
                  />
                  {(user?.role === 'admin' || user?.role === 'owner') && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProduct(product.id);
                      }}
                      className="absolute top-2 left-2 p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full transition-all shadow-md opacity-0 group-hover:opacity-100"
                      title="Delete product"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(product.id);
                    }}
                    className={`absolute bottom-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full transition-colors shadow-sm ${
                      wishlist.includes(product.id) ? 'text-red-500' : 'text-slate-400 hover:text-red-500'
                    }`}
                  >
                    <Heart size={18} fill={wishlist.includes(product.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <div className="hidden space-y-1">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{product.category}</span>
                  <h3 className="font-semibold text-slate-800 line-clamp-1">{product.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 h-8">{product.description}</p>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-lg font-bold text-slate-900">₹{product.price.toFixed(2)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Search size={32} />
            </div>
            <h3 className="text-xl font-semibold text-slate-800">No products found</h3>
            <p className="text-slate-500">Try adjusting your search or category filter.</p>
          </div>
        )}
      </main>

      {/* Features Bar */}
      <section className="bg-white border-t border-slate-200 py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary-light text-primary rounded-2xl">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="font-bold">Premium Medical Equipment</h4>
              <p className="text-sm text-slate-500">Advanced probes and diagnostic devices</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
              <Check size={24} />
            </div>
            <div>
              <h4 className="font-bold">100% Authentic</h4>
              <p className="text-sm text-slate-500">Products sourced directly from verified brands</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl">
              <Clock size={24} />
            </div>
            <div>
              <h4 className="font-bold">24/7 Support</h4>
              <p className="text-sm text-slate-500">Expert medical consultants available always</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm">
                <img src="/new-symbol.png" alt="OHM Sivamuruga Medicals Logo" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-xl font-bold text-white">E-pharmacy website</h1>
            </div>
            <p className="text-sm leading-relaxed">
              Your one-stop destination for all your healthcare needs. We provide quality medicines and health products with the convenience of online shopping.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Quick Links</h4>
            <ul className="space-y-4 text-sm">
              <li><motion.a 
                href="#" 
                whileHover={{ scale: 1.05, color: '#10b981' }}
                whileTap={{ scale: 0.95 }}
                className="hover:text-primary transition-colors inline-block"
              >About Us</motion.a></li>
              <li><motion.a 
                href="#" 
                whileHover={{ scale: 1.05, color: '#10b981' }}
                whileTap={{ scale: 0.95 }}
                className="hover:text-primary transition-colors inline-block"
              >Contact Us</motion.a></li>
              <li><motion.a 
                href="#" 
                whileHover={{ scale: 1.05, color: '#10b981' }}
                whileTap={{ scale: 0.95 }}
                className="hover:text-primary transition-colors inline-block"
              >Privacy Policy</motion.a></li>
              <li><motion.a 
                href="#" 
                whileHover={{ scale: 1.05, color: '#10b981' }}
                whileTap={{ scale: 0.95 }}
                className="hover:text-primary transition-colors inline-block"
              >Terms of Service</motion.a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Categories</h4>
            <ul className="space-y-4 text-sm">
              <li><motion.button 
                onClick={() => {
                  setActiveCategory('Medicines');
                  document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                whileHover={{ scale: 1.05, color: '#10b981' }}
                whileTap={{ scale: 0.95 }}
                className="hover:text-primary transition-colors inline-block text-left bg-none border-none cursor-pointer p-0"
              >Medicines</motion.button></li>
              <li><motion.button 
                onClick={() => {
                  setActiveCategory('Vitamins');
                  document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                whileHover={{ scale: 1.05, color: '#10b981' }}
                whileTap={{ scale: 0.95 }}
                className="hover:text-primary transition-colors inline-block text-left bg-none border-none cursor-pointer p-0"
              >Vitamins</motion.button></li>
              <li><motion.button 
                onClick={() => {
                  setActiveCategory('Baby Care');
                  document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                whileHover={{ scale: 1.05, color: '#10b981' }}
                whileTap={{ scale: 0.95 }}
                className="hover:text-primary transition-colors inline-block text-left bg-none border-none cursor-pointer p-0"
              >Baby Care</motion.button></li>
              <li><motion.button 
                onClick={() => {
                  setActiveCategory('Personal Care');
                  document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                whileHover={{ scale: 1.05, color: '#10b981' }}
                whileTap={{ scale: 0.95 }}
                className="hover:text-primary transition-colors inline-block text-left bg-none border-none cursor-pointer p-0"
              >Personal Care</motion.button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Contact Info</h4>
            <p className="text-sm mb-4">
              <span className="block mb-3">Email: Ohmsivamurugamedicals@gmail.com</span>
              <span className="block mb-3">Phone: 9994687690</span>
              <span className="block">Location: 8/94, Trichy Rd, Thottiyam, Tamil Nadu 621215, India</span>
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-slate-800 text-center text-xs">
          © 2024 E-pharmacy website. All rights reserved.
        </div>
      </footer>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col md:flex-row"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full text-slate-400 hover:text-slate-600 transition-colors shadow-sm"
              >
                <X size={20} />
              </button>

              <div className="md:w-1/2 bg-slate-50 p-8 flex flex-col items-center justify-center relative">
                {isEditingProduct ? (
                  <div className="w-full space-y-4">
                    {editProductImage && (
                      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-white">
                        <img 
                          src={editProductImage} 
                          alt="Preview" 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <div className="space-y-3">
                      <div className="relative">
                        <input 
                          type="file" 
                          ref={productImageInputRef}
                          onChange={handleProductImageUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button 
                          type="button"
                          onClick={() => productImageInputRef.current?.click()}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-primary hover:bg-primary/5 text-slate-600 hover:text-primary transition-all font-medium"
                        >
                          <Upload size={18} /> Upload Image
                        </button>
                      </div>
                      <div>
                        <input 
                          type="url" 
                          value={editProductImage.startsWith('data:') ? '' : editProductImage}
                          onChange={(e) => setEditProductImage(e.target.value)}
                          placeholder="Or paste image URL..."
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-700 text-xs">
                        <AlertCircle size={16} />
                        <span>Paste a valid image URL or upload from your system</span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleSaveProductImage}
                          disabled={!editProductImage.trim()}
                          className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Save Image
                        </button>
                        <button 
                          onClick={handleCancelEditProductImage}
                          className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <img 
                      src={selectedProduct.image} 
                      alt={selectedProduct.name}
                      className={`w-full h-full object-contain max-h-[400px] rounded-2xl shadow-lg transition-[filter] duration-300 ${
                        isShopAvailable ? 'grayscale-0' : 'grayscale'
                      }`}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = `https://picsum.photos/seed/${selectedProduct.id}/800/800`;
                      }}
                    />
                    {(user?.role === 'admin' || user?.role === 'owner') && (
                      <button 
                        onClick={handleEditProductImage}
                        className="absolute bottom-4 left-4 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl text-primary hover:bg-white transition-all font-semibold shadow-md"
                      >
                        <ImageIcon size={16} /> Edit Image
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="md:w-1/2 p-8 flex flex-col">
                <div className="flex-1">
                  <span className="text-xs font-bold text-primary uppercase tracking-widest mb-2 block">{selectedProduct.category}</span>
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">{selectedProduct.name}</h2>
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-3xl font-bold text-slate-900">₹{selectedProduct.price.toFixed(2)}</span>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-1">Description</h4>
                      <p className="text-slate-600 leading-relaxed">{selectedProduct.description}</p>
                    </div>
                    {selectedProduct.dosage && (
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 mb-1">Recommended Dosage</h4>
                        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <Clock size={16} className="text-primary" />
                          <span className="text-sm">{selectedProduct.dosage}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => toggleWishlist(selectedProduct.id)}
                    className={`flex-1 p-4 rounded-2xl border transition-all flex items-center justify-center gap-2 ${
                      wishlist.includes(selectedProduct.id) 
                        ? 'bg-red-50 border-red-100 text-red-500' 
                        : 'bg-white border-slate-200 text-slate-400 hover:text-red-500'
                    }`}
                  >
                    <Heart size={24} fill={wishlist.includes(selectedProduct.id) ? 'currentColor' : 'none'} />
                    <span>{wishlist.includes(selectedProduct.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}</span>
                  </button>
                  {(user?.role === 'admin' || user?.role === 'owner') && (
                    <button 
                      onClick={() => handleDeleteProduct(selectedProduct.id)}
                      className="flex-1 p-4 rounded-2xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-all flex items-center justify-center gap-2 font-semibold"
                    >
                      <X size={20} /> Delete Product
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <AnimatePresence>
        {isLoginOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isProcessing) {
                  setIsLoginOpen(false);
                  setLoginError('');
                  setLoginData({ email: '', password: '', name: '' });
                  setIsSignUp(false);
                }
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {isLoggedIn ? (
                <div className="p-8 text-center space-y-6">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto overflow-hidden border-2 border-white shadow-sm">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={40} />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <h3 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name}!</h3>
                      {user?.role && user.role !== 'user' && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          user.role === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                        }`}>
                          {user.role.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500">{user?.email}</p>
                  </div>
                  <div className="pt-4 space-y-3">
                    <div className="text-left px-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Account Settings</p>
                      <button 
                        onClick={() => {
                          setIsLoginOpen(false);
                          setIsProfileOpen(true);
                        }}
                        className="w-full py-3 bg-slate-50 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 transition-all flex items-center justify-center gap-2 mb-3"
                      >
                        <User size={18} /> My Profile
                      </button>
                    </div>

                    {(user?.role === 'admin' || user?.role === 'owner') && (
                      <div className="text-left px-1 pt-2">
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-2">Admin Controls</p>
                        <button 
                          onClick={() => {
                            setIsLoginOpen(false);
                            setIsResetPasswordOpen(true);
                          }}
                          className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-semibold hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                        >
                          <Shield size={18} /> Reset Owner Password
                        </button>
                        <button 
                          onClick={() => {
                            setIsLoginOpen(false);
                            handleReseedCategories();
                          }}
                          className="w-full mt-2 py-3 bg-green-50 text-green-600 rounded-xl font-semibold hover:bg-green-100 transition-all flex items-center justify-center gap-2"
                        >
                          <Plus size={18} /> Load All Categories
                        </button>
                      </div>
                    )}

                    {(user?.role === 'admin' || user?.role === 'owner' || user?.email?.toLowerCase().includes('admin') || user?.email?.toLowerCase().includes('owner')) && (
                      <div className="text-left px-1 pt-2 space-y-2">
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-2">Management Module</p>
                        <button
                          onClick={() => setIsShopAvailable(!isShopAvailable)}
                          className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                            isShopAvailable
                              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-600 hover:bg-red-100'
                          }`}
                        >
                          <CheckCircle2 size={18} /> {isShopAvailable ? 'Shop Open' : 'Shop Closed'}
                        </button>
                      </div>
                    )}

                    <div className="pt-4">
                      <button 
                        onClick={handleLogout}
                        className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                      >
                        <LogOut size={18} /> Logout
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-slate-900">{isSignUp ? 'Create Account' : 'Login'}</h3>
                    <button onClick={() => {
                      setIsLoginOpen(false);
                      setLoginError('');
                      setLoginData({ email: '', password: '', name: '' });
                      setIsSignUp(false);
                    }} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                  <form onSubmit={handleLogin} className="space-y-4">
                    {loginError && (
                      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                        <AlertCircle size={20} className="flex-shrink-0" />
                        <p className="text-sm font-medium">{loginError}</p>
                      </div>
                    )}
                    {isSignUp && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="text" 
                            required
                            value={loginData.name}
                            onChange={(e) => setLoginData({...loginData, name: e.target.value})}
                            placeholder="John Doe"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          />
                        </div>
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="email" 
                          required
                          value={loginData.email}
                          onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                          placeholder="your@email.com"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="password" 
                          required
                          value={loginData.password}
                          onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <button 
                      type="submit"
                      disabled={isProcessing || !loginData.email || !loginData.password}
                      className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (isSignUp ? 'Create Account' : 'Login to Account')}
                    </button>
                  </form>
                  <div className="text-center">
                    <p className="text-sm text-slate-500">
                      {isSignUp ? 'Already have an account?' : "Don't have an account?"} 
                      <button 
                        onClick={() => {
                          setIsSignUp(!isSignUp);
                          setLoginError('');
                          setLoginData({ email: '', password: '', name: '' });
                        }}
                        className="text-primary font-bold hover:underline ml-1"
                      >
                        {isSignUp ? 'Login' : 'Sign Up'}
                      </button>
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order History Drawer */}
      <AnimatePresence>
        {isOrderHistoryOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOrderHistoryOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[80] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Clock size={20} className="text-primary" /> Order History
                </h3>
                <button onClick={() => setIsOrderHistoryOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {orders.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                      <Clock size={32} />
                    </div>
                    <p className="text-slate-500">You haven't placed any orders yet</p>
                    <button 
                      onClick={() => setIsOrderHistoryOpen(false)}
                      className="text-primary font-semibold hover:underline"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                      <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Order ID</p>
                          <p className="text-sm font-bold text-slate-900">{order.id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Date</p>
                          <p className="text-sm font-medium text-slate-600">{order.date}</p>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        {order.items.map((item: any) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-10 h-10 rounded-lg object-cover bg-white border border-slate-100"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                              <p className="text-[10px] text-slate-500">Qty: {item.quantity}</p>
                            </div>
                            <p className="text-xs font-bold text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="text-xs font-bold text-emerald-600">{order.status}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Paid</p>
                          <p className="text-sm font-bold text-primary">₹{order.total.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Wishlist Drawer */}
      <AnimatePresence>
        {isWishlistOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWishlistOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Heart size={20} className="text-red-500 fill-red-500" /> Your Wishlist
                </h3>
                <button onClick={() => setIsWishlistOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {wishlist.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                      <Heart size={32} />
                    </div>
                    <p className="text-slate-500">Your wishlist is empty</p>
                    <button 
                      onClick={() => setIsWishlistOpen(false)}
                      className="text-primary font-semibold hover:underline"
                    >
                      Explore Products
                    </button>
                  </div>
                ) : (
                  wishlist.map(id => {
                    const product = MOCK_PRODUCTS.find(p => p.id === id);
                    if (!product) return null;
                    return (
                      <div key={id} className="flex gap-4 group">
                        <div className="relative">
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-24 h-24 rounded-xl object-cover bg-slate-50"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.src = `https://picsum.photos/seed/${product.id}/200/200`;
                            }}
                          />
                          <button 
                            onClick={() => toggleWishlist(id)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-white shadow-md rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <div className="flex-1 space-y-1">
                          <h4 className="font-semibold text-slate-800">{product.name}</h4>
                          <p className="text-xs text-slate-500">{product.category}</p>
                          <div className="flex items-center justify-between pt-2">
                            <span className="font-bold text-slate-900">₹{product.price.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

        {/* Reset Owner Password Modal */}
        <AnimatePresence>
          {isResetPasswordOpen && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsResetPasswordOpen(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                  <h3 className="text-xl font-bold flex items-center gap-2 text-blue-600">
                    <Shield size={20} /> Reset Owner Password
                  </h3>
                  <button onClick={() => setIsResetPasswordOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-8 space-y-6">
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-sm text-blue-700 leading-relaxed">
                      As an <strong>Administrator</strong>, you can set a new password for the <strong>Store Owner</strong> account.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">New Owner Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        value={newOwnerPassword}
                        onChange={(e) => setNewOwnerPassword(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="Enter new password..."
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setIsResetPasswordOpen(false)}
                      className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        if (newOwnerPassword.trim()) {
                          setOwnerPassword(newOwnerPassword);
                          setNewOwnerPassword('');
                          setIsResetPasswordOpen(false);
                          alert('Owner password has been successfully reset!');
                        }
                      }}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                    >
                      Update Password
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* My Profile Modal */}
        <AnimatePresence>
          {isProfileOpen && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsProfileOpen(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <User size={20} className="text-emerald-500" /> My Profile
                  </h3>
                  <button onClick={() => setIsProfileOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-8 text-center space-y-6">
                  <div className="relative group mx-auto w-32 h-32">
                    <div className="w-full h-full bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                      {user?.avatar ? (
                        <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User size={64} />
                      )}
                    </div>
                    <button 
                      onClick={() => profileFileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-all scale-90 group-hover:scale-100"
                    >
                      <Upload size={16} />
                    </button>
                    <input 
                      type="file" 
                      ref={profileFileInputRef}
                      onChange={handleProfileImageChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-2xl text-left space-y-3">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</p>
                        <p className="text-slate-900 font-semibold">{user?.name}</p>
                      </div>
                      <div className="h-px bg-slate-200" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                        <p className="text-slate-900 font-semibold">{user?.email}</p>
                      </div>
                      <div className="h-px bg-slate-200" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Role</p>
                        <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          user?.role === 'admin' ? 'bg-blue-100 text-blue-600' : 
                          user?.role === 'owner' ? 'bg-purple-100 text-purple-600' : 
                          'bg-emerald-100 text-emerald-600'
                        }`}>
                          {user?.role?.toUpperCase() || 'USER'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsProfileOpen(false)}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                  >
                    Close Profile
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Add Product Modal */}
        <AnimatePresence>
          {isAddProductOpen && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddProductOpen(false)}
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-y-auto flex flex-col max-h-[90vh]"
              >
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.5 }}
                  className="sticky top-0 bg-gradient-to-r from-emerald-50 via-white to-slate-50 p-6 border-b-2 border-slate-100 flex items-center justify-between rounded-t-3xl z-10 overflow-hidden relative"
                >
                  {/* Animated background shimmer */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />

                  {/* Left side - Icon and Title */}
                  <motion.div 
                    className="flex items-center gap-3 relative z-10"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    {/* Rotating Plus Icon with pulse */}
                    <motion.div
                      className="p-2 bg-emerald-100 rounded-full"
                      animate={{ 
                        rotate: 360,
                        boxShadow: [
                          "0 0 0 0 rgba(16, 185, 129, 0.6)",
                          "0 0 0 12px rgba(16, 185, 129, 0)",
                        ]
                      }}
                      transition={{ 
                        rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                        boxShadow: { duration: 2, repeat: Infinity }
                      }}
                    >
                      <Plus size={20} className="text-emerald-600" />
                    </motion.div>

                    {/* Animated Title */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                      className="flex flex-col"
                    >
                      <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
                        Add New Medicine
                      </h3>
                      <motion.div
                        className="h-1 bg-gradient-to-r from-emerald-400 to-transparent rounded-full"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.5, duration: 0.7 }}
                        style={{ originX: 0 }}
                      />
                    </motion.div>
                  </motion.div>

                  {/* Right side - Close Button */}
                  <motion.button 
                    onClick={() => setIsAddProductOpen(false)} 
                    className="relative z-10 p-2 rounded-full transition-all"
                    initial={{ opacity: 0, scale: 0, rotate: -180 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ delay: 0.4, duration: 0.5, type: "spring" }}
                    whileHover={{ 
                      scale: 1.2,
                      backgroundColor: "rgba(226, 232, 240, 0.9)",
                      rotateZ: 90
                    }}
                    whileTap={{ scale: 0.8 }}
                  >
                    <X size={20} className="text-slate-600" />
                  </motion.button>
                </motion.div>

                <form onSubmit={handleAddProduct} className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Medicine Name</label>
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="text" 
                          required
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                          placeholder="e.g., Amoxicillin 500mg"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                        <select 
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white"
                          value={newProduct.category}
                          onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                        >
                          <option value="">Select category</option>
                          {selectableCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Rate (₹)</label>
                        <input 
                          type="number" 
                          required
                          min="0"
                          step="0.01"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                          placeholder="0.00"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:display-none [&::-webkit-inner-spin-button]:display-none [&::-moz-appearance]:textfield"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 text-slate-400" size={18} />
                        <textarea 
                          required
                          rows={3}
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                          placeholder="Describe the medicine, its uses, and dosage..."
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Product Image</label>
                      <div className="flex flex-col gap-4">
                        {newProduct.image && (
                          <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                            <img 
                              src={newProduct.image} 
                              alt="Preview" 
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                            <button 
                              type="button"
                              onClick={() => setNewProduct({ ...newProduct, image: '' })}
                              className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm hover:bg-white rounded-full text-red-500 shadow-sm transition-all"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="relative">
                            <input 
                              type="file" 
                              ref={fileInputRef}
                              onChange={handleImageChange}
                              accept="image/*"
                              className="hidden"
                            />
                            <button 
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-all font-medium"
                            >
                              <Upload size={18} /> Upload from System
                            </button>
                          </div>
                          
                          <div className="relative">
                            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                              type="url" 
                              value={newProduct.image.startsWith('data:') ? '' : newProduct.image}
                              onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
                              placeholder="Or paste image URL..."
                              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={20} /> Add Product to Store
                  </motion.button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      {/* Add Category Modal */}
      {isAddCategoryOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsAddCategoryOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="bg-gradient-to-br from-white to-slate-50 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with icon */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-primary/10 to-emerald-50 border-b border-slate-200/50">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="p-2 bg-primary/20 rounded-full"
                >
                  <Plus size={24} className="text-primary" />
                </motion.div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">Add Category</h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAddCategoryOpen(false)}
                className="p-2 hover:bg-slate-200/50 rounded-full transition-colors"
              >
                <X size={24} className="text-slate-600" />
              </motion.button>
            </div>
            
            <form onSubmit={handleAddCategory} className="p-8 space-y-6">
              <div className="space-y-3">
                <motion.label 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-sm font-bold text-slate-700 flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-primary rounded-full" />
                  Category Name
                </motion.label>
                <motion.input
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Vitamins, Supplements..."
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all bg-white/80 backdrop-blur-sm font-medium"
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 text-slate-900 font-bold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(16, 185, 129, 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-emerald-600 text-white font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <motion.span
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ✓
                  </motion.span>
                  Create Category
                </motion.button>
              </div>
            </form>

            {/* Decorative elements */}
            <motion.div
              className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl"
              animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-300/5 rounded-full blur-3xl"
              animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>
      )}


    </div>
  );
}




