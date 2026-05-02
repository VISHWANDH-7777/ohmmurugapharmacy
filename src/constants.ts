import { Type } from "@google/genai";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  requiresPrescription: boolean;
  dosage?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export const CATEGORIES = [
  "All",
  "Pain Relief",
  "Vitamins & Supplements",
  "First Aid",
  "Personal Care",
  "Baby Care",
  "Cold & Flu",
  "Digestive Health",
  "Medical Devices",
  "Supports & Braces"
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Paracetamol 500mg",
    category: "Pain Relief",
    price: 30,
    description: "Effective relief from pain and fever. Suitable for headaches, toothache, and cold symptoms.",
    image: "https://images.unsplash.com/photo-1584308666721-bb8bd1f9913d?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false,
    dosage: "1-2 tablets every 4-6 hours"
  },
  {
    id: "2",
    name: "Vitamin C 1000mg",
    category: "Vitamins & Supplements",
    price: 60,
    description: "High-strength Vitamin C to support your immune system and overall health.",
    image: "https://images.unsplash.com/photo-1616671285441-fb7b5b24d721?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false,
    dosage: "1 tablet daily"
  },
  {
    id: "3",
    name: "Amoxicillin 250mg",
    category: "Cold & Flu",
    price: 120,
    description: "Antibiotic used to treat various bacterial infections.",
    image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false,
    dosage: "As directed by physician"
  },
  {
    id: "4",
    name: "Infrared Thermometer",
    category: "Medical Devices",
    price: 1250,
    description: "Non-contact infrared thermometer for fast and accurate temperature readings.",
    image: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "5",
    name: "Antacid Liquid 200ml",
    category: "Digestive Health",
    price: 110,
    description: "Fast-acting relief from heartburn, indigestion, and trapped wind.",
    image: "https://images.unsplash.com/photo-1550573105-15864539da71?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false,
    dosage: "10-20ml after meals"
  },
  {
    id: "6",
    name: "Baby Gentle Lotion",
    category: "Baby Care",
    price: 280,
    description: "Hypoallergenic and dermatologist-tested lotion for delicate baby skin.",
    image: "https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "7",
    name: "Ibuprofen 200mg",
    category: "Pain Relief",
    price: 45,
    description: "Anti-inflammatory painkiller for relief from muscle pain, backache, and period pain.",
    image: "https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false,
    dosage: "1-2 tablets every 4 hours"
  },
  {
    id: "8",
    name: "Omega-3 Fish Oil",
    category: "Vitamins & Supplements",
    price: 650,
    description: "Supports heart, brain, and eye health with essential fatty acids.",
    image: "https://images.unsplash.com/photo-1514733670139-4d87a1941d55?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false,
    dosage: "2 capsules daily"
  },
  {
    id: "9",
    name: "Ortho Pain Relief Oil",
    category: "Pain Relief",
    price: 245,
    description: "Ayurvedic herbal oil for effective relief from joint pain, back pain, and muscle stiffness.",
    image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false,
    dosage: "Massage gently on affected area"
  },
  {
    id: "10",
    name: "Automatic Pill Dispenser",
    category: "Medical Devices",
    price: 4500,
    description: "Smart pill dispenser with alarm and phone app connectivity to ensure timely medication.",
    image: "https://images.unsplash.com/photo-1550573105-15864539da71?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "11",
    name: "Face Masks (Pack of 50)",
    category: "First Aid",
    price: 150,
    description: "3-ply surgical masks with high filtration efficiency and comfortable ear loops.",
    image: "https://images.unsplash.com/photo-1584483766114-2cea6facdf57?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "12",
    name: "First Aid Kit (Essential)",
    category: "First Aid",
    price: 850,
    description: "Comprehensive first aid kit containing bandages, antiseptic, scissors, and more.",
    image: "https://images.unsplash.com/photo-1583947581924-860bda6a26df?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "13",
    name: "Blood Glucose Monitor",
    category: "Medical Devices",
    price: 1850,
    description: "Fast and accurate blood glucose monitoring system with test strips and lancets.",
    image: "https://images.unsplash.com/photo-1576073719710-4182507df300?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "14",
    name: "Hand Sanitizer 500ml",
    category: "Personal Care",
    price: 180,
    description: "Kills 99.9% of germs without water. Contains Aloe Vera for skin hydration.",
    image: "https://images.unsplash.com/photo-1584483766114-2cea6facdf57?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "15",
    name: "Blood Pressure Monitor",
    category: "Medical Devices",
    price: 2450,
    description: "Fully automatic digital blood pressure monitor with large display and memory.",
    image: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "16",
    name: "Back Support Belt",
    category: "Supports & Braces",
    price: 1200,
    description: "Adjustable compression back support belt for posture correction and pain relief.",
    image: "https://images.unsplash.com/photo-1590233641138-81402918f54a?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "17",
    name: "Knee Brace Support",
    category: "Supports & Braces",
    price: 850,
    description: "Breathable knee brace with side stabilizers for sports and injury recovery.",
    image: "https://images.unsplash.com/photo-1590233641138-81402918f54a?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "18",
    name: "Compression Socks",
    category: "Supports & Braces",
    price: 450,
    description: "Graduated compression socks for improved circulation and reduced leg fatigue.",
    image: "https://images.unsplash.com/photo-1582719202047-76d3432ee323?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "19",
    name: "Diabetic Foot Cream",
    category: "Personal Care",
    price: 350,
    description: "Specialized moisturizing cream for diabetic foot care to prevent dryness and cracks.",
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "20",
    name: "Smart Body Scale",
    category: "Medical Devices",
    price: 1950,
    description: "Bluetooth smart scale that tracks weight, BMI, body fat, and muscle mass.",
    image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "21",
    name: "Electric Hot Water Bag",
    category: "Pain Relief",
    price: 450,
    description: "Quick-heating electric hot water bag for heat therapy and pain relief.",
    image: "https://images.unsplash.com/photo-1584308666721-bb8bd1f9913d?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "22",
    name: "Nebulizer Machine",
    category: "Medical Devices",
    price: 2850,
    description: "Compact compressor nebulizer for effective respiratory therapy.",
    image: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "23",
    name: "Memory Foam Pillow",
    category: "Personal Care",
    price: 1550,
    description: "Orthopedic memory foam pillow for neck support and better sleep quality.",
    image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "24",
    name: "Oxygen Concentrator",
    category: "Medical Devices",
    price: 35000,
    description: "Portable oxygen concentrator for continuous oxygen supply. High purity.",
    image: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "25",
    name: "Pulse Oximeter",
    category: "Medical Devices",
    price: 950,
    description: "Finger pulse oximeter for quick SpO2 and pulse rate monitoring.",
    image: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "26",
    name: "Hot & Cold Gel Pack",
    category: "Pain Relief",
    price: 250,
    description: "Reusable gel pack for both hot and cold therapy. Flexible and durable.",
    image: "https://images.unsplash.com/photo-1584308666721-bb8bd1f9913d?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "27",
    name: "Antiseptic Liquid 500ml",
    category: "First Aid",
    price: 185,
    description: "Powerful antiseptic liquid for first aid, surface disinfection, and personal hygiene.",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "28",
    name: "Adhesive Bandages (100ct)",
    category: "First Aid",
    price: 120,
    description: "Assorted sizes of breathable, flexible adhesive bandages for minor cuts and scrapes.",
    image: "https://images.unsplash.com/photo-1590233641138-81402918f54a?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "29",
    name: "Sterile Gauze Pads (25ct)",
    category: "First Aid",
    price: 210,
    description: "Highly absorbent sterile gauze pads for wound dressing and cleaning.",
    image: "https://images.unsplash.com/photo-1583947581924-860bda6a26df?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "30",
    name: "Medical Micropore Tape",
    category: "First Aid",
    price: 85,
    description: "Gentle, breathable paper tape for securing dressings and bandages on sensitive skin.",
    image: "https://images.unsplash.com/photo-1584483766114-2cea6facdf57?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "31",
    name: "Burn Relief Gel 50g",
    category: "First Aid",
    price: 320,
    description: "Soothing gel for immediate relief from minor burns, scalds, and sunburn.",
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "32",
    name: "Hydrogen Peroxide 3%",
    category: "First Aid",
    price: 65,
    description: "First aid antiseptic to help prevent infection in minor cuts, scrapes, and burns.",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "33",
    name: "First Aid Scissors & Tweezers",
    category: "First Aid",
    price: 275,
    description: "Stainless steel medical-grade tools for precision first aid tasks.",
    image: "https://images.unsplash.com/photo-1583947581924-860bda6a26df?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "34",
    name: "Elastic Crepe Bandage",
    category: "First Aid",
    price: 145,
    description: "High-quality elastic bandage for support and compression in sprains and strains.",
    image: "https://images.unsplash.com/photo-1590233641138-81402918f54a?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "35",
    name: "Cotton Balls (100ct)",
    category: "First Aid",
    price: 95,
    description: "Soft and absorbent 100% pure cotton balls for wound cleaning and makeup removal.",
    image: "https://images.unsplash.com/photo-1583947581924-860bda6a26df?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "36",
    name: "Alcohol Prep Pads (100ct)",
    category: "First Aid",
    price: 150,
    description: "Individually wrapped 70% Isopropyl Alcohol swabs for skin disinfection.",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "37",
    name: "Eye Wash Solution 100ml",
    category: "First Aid",
    price: 225,
    description: "Sterile eye wash solution for flushing out dust, debris, and chemicals from the eyes.",
    image: "https://images.unsplash.com/photo-1550573105-15864539da71?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "38",
    name: "Instant Cold Spray 150ml",
    category: "First Aid",
    price: 380,
    description: "Rapid cooling spray for immediate relief from sports-related sprains and strains.",
    image: "https://images.unsplash.com/photo-1584308666721-bb8bd1f9913d?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "39",
    name: "Digital Thermometer",
    category: "Medical Devices",
    price: 250,
    description: "High-precision digital thermometer for oral, axillary, or rectal use. Fast 10-second reading.",
    image: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "40",
    name: "Ankle Binder / Support",
    category: "Supports & Braces",
    price: 350,
    description: "Elastic ankle binder providing effective support and compression to weak or injured ankles.",
    image: "https://images.unsplash.com/photo-1590233641138-81402918f54a?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "41",
    name: "Wrist Splint / Brace",
    category: "Supports & Braces",
    price: 550,
    description: "Ergonomic wrist brace with metal splint for carpal tunnel relief and injury support.",
    image: "https://images.unsplash.com/photo-1590233641138-81402918f54a?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "42",
    name: "Cervical Collar",
    category: "Supports & Braces",
    price: 450,
    description: "Soft foam cervical collar for neck support and immobilization during recovery.",
    image: "https://images.unsplash.com/photo-1590233641138-81402918f54a?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "43",
    name: "TENS Machine",
    category: "Medical Devices",
    price: 3500,
    description: "Dual-channel TENS unit for drug-free nerve stimulation and chronic pain management.",
    image: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "44",
    name: "Electric Heating Pad",
    category: "Pain Relief",
    price: 1250,
    description: "Large electric heating pad with adjustable temperature settings for deep muscle relaxation.",
    image: "https://images.unsplash.com/photo-1584308666721-bb8bd1f9913d?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "45",
    name: "Massage Gun",
    category: "Medical Devices",
    price: 4800,
    description: "Professional percussion massage gun for deep tissue recovery and muscle soreness relief.",
    image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "46",
    name: "Steam Inhaler / Vaporizer",
    category: "Medical Devices",
    price: 850,
    description: "3-in-1 steam inhaler for respiratory relief, facial sauna, and room humidification.",
    image: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "47",
    name: "Incentive Spirometer",
    category: "Medical Devices",
    price: 450,
    description: "Deep breathing exerciser to help improve lung function and prevent respiratory complications.",
    image: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "48",
    name: "Sterile Eye Pad",
    category: "First Aid",
    price: 45,
    description: "Individually wrapped sterile eye pad with bandage for eye injury protection.",
    image: "https://images.unsplash.com/photo-1583947581924-860bda6a26df?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "49",
    name: "Triangular Bandage",
    category: "First Aid",
    price: 110,
    description: "Multi-purpose non-woven triangular bandage for slings and splinting.",
    image: "https://images.unsplash.com/photo-1590233641138-81402918f54a?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "50",
    name: "Safety Pins (50ct)",
    category: "First Aid",
    price: 35,
    description: "Assorted sizes of durable safety pins for securing bandages and dressings.",
    image: "https://images.unsplash.com/photo-1583947581924-860bda6a26df?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "51",
    name: "Medical Gloves (100ct)",
    category: "First Aid",
    price: 450,
    description: "Powder-free nitrile medical examination gloves for hygiene and protection.",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "52",
    name: "Wrist BP Monitor",
    category: "Medical Devices",
    price: 1850,
    description: "Compact wrist-type digital blood pressure monitor for easy on-the-go tracking.",
    image: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "53",
    name: "Professional First Aid Kit",
    category: "First Aid",
    price: 2450,
    description: "Large, wall-mountable first aid kit for offices, schools, and large households.",
    image: "https://images.unsplash.com/photo-1583947581924-860bda6a26df?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  },
  {
    id: "54",
    name: "Antiseptic Wipes (50ct)",
    category: "First Aid",
    price: 195,
    description: "Alcohol-free antiseptic wipes for cleaning wounds and skin without stinging.",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400&h=400",
    requiresPrescription: false
  }
];
