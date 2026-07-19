const fs = require('fs');
const path = require('path');

// Helper to generate seed.sql containing exactly the required numbers
function generateSeed() {
  const usersCount = 15;
  const suppliersCount = 25;
  const productsCount = 100;
  const transactionsCount = 500;
  const passwordHash = '$2a$10$xQ7UVVPIX3gO0Nc3wNDOzeOHe4O1JB.AcIVe6MUJkSWInewIZPZJi'; // admin123

  let sql = `-- Rich Localized Seed Data (Indian ERP Edition)
USE smart_inventory;

-- 1. Categories
INSERT INTO categories (id, name, description) VALUES
(1, 'Packaged Foods', 'Biscuits, noodles, flour, and packed daily staples'),
(2, 'Dairy & Beverages', 'Butter, milk, tea, coffee, and drinks'),
(3, 'Personal Care', 'Shampoo, soaps, oral hygiene, and cosmetics'),
(4, 'Household Essentials', 'Cleaning detergents, salts, oils, and pantry pulses'),
(5, 'Confectionery & Snacks', 'Chocolates, chips, sweets, and munchies')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Warehouses
INSERT INTO warehouses (id, name, location, capacity, warehouse_code) VALUES
(1, 'Hyderabad Central Warehouse', 'Plot 42, IDA Jeedimetla, Hyderabad, TS, 500055', 20000, 'WH-HYD-01'),
(2, 'Bengaluru Distribution Centre', '7th Mile, Nelamangala Road, Bengaluru, KA, 562123', 15000, 'WH-BLR-02'),
(3, 'Mumbai Depot HQ', 'Building C, Logistics Park, Bhiwandi, Thane, MH, 421302', 25000, 'WH-BOM-03'),
(4, 'Visakhapatnam Wharf Warehouse', 'Block B, APIIC Autonagar, Visakhapatnam, AP, 530012', 12000, 'WH-VTZ-04'),
(5, 'Chennai Hub', 'Redhills GNT Road, Chennai, TN, 600052', 15000, 'WH-MAA-05')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 3. Users (15 Users)
INSERT INTO users (id, username, email, password_hash, role, profile_picture, warehouse_id, status) VALUES
`;

  // Generate 15 users
  const roles = ['Admin', 'Manager', 'Staff'];
  const userRows = [];
  for (let i = 1; i <= usersCount; i++) {
    let username = `operator_${i}`;
    let role = roles[i % roles.length];
    if (i === 1) { username = 'admin'; role = 'Admin'; }
    else if (i === 2) { username = 'manager'; role = 'Manager'; }
    else if (i === 3) { username = 'staff'; role = 'Staff'; }

    const profilePic = `https://images.unsplash.com/photo-${1500000000000 + i * 100000}?w=100&auto=format&fit=crop&q=80`;
    const whId = role === 'Admin' ? 'NULL' : ((i % 5) + 1);
    userRows.push(`(${i}, '${username}', '${username}@smartinventory.com', '${passwordHash}', '${role}', '${profilePic}', ${whId}, 'Active')`);
  }
  sql += userRows.join(',\n') + '\nON DUPLICATE KEY UPDATE username=VALUES(username);\n\n';

  // Generate 25 suppliers
  sql += `-- 4. Suppliers (25 Suppliers)\nINSERT INTO suppliers (id, name, contact_name, email, phone, address, gstin, pan) VALUES\n`;
  const supplierCompanies = [
    'ITC Limited', 'Reliance Consumer', 'Hindustan Unilever', 'Britannia Industries', 'Nestle India',
    'Amul Dairy Coop', 'Godrej Consumer', 'Dabur India', 'Marico Limited', 'Patanjali Ayurved',
    'Apollo Pharmacy', 'Metro Cash & Carry', 'BigBasket Wholesale', 'TATA Consumer Products', 'Adani Wilmar',
    'Haldiram Foods', 'Parle Products', 'Marico Foods', 'Wipro Consumer Care', 'Colgate-Palmolive India',
    'Pepsico India', 'Coca-Cola India', 'Mother Dairy', 'Dharampal Satyapal Group', 'Balaji Wafers'
  ];
  const states = ['TS', 'KA', 'MH', 'AP', 'TN', 'DL', 'GJ', 'WB', 'UP', 'HR'];
  const supplierRows = [];
  for (let i = 1; i <= suppliersCount; i++) {
    const name = supplierCompanies[i - 1];
    const contact = `Representative ${i}`;
    const email = `sales@${name.toLowerCase().replace(/\s+/g, '')}.com`;
    const phone = `+91-98${String(10000000 + i * 12345).substring(0, 8)}`;
    const address = `Industrial Sector ${i * 2}, Plot ${i * 7}, ${states[i % states.length]}, India`;
    const gstStateCode = String(10 + i).padStart(2, '0');
    const pan = `ABCDE${String(1000 + i)}F`;
    const gstin = `${gstStateCode}${pan}1Z${i % 9}`;
    supplierRows.push(`(${i}, '${name}', '${contact}', '${email}', '${phone}', '${address}', '${gstin}', '${pan}')`);
  }
  sql += supplierRows.join(',\n') + '\nON DUPLICATE KEY UPDATE name=VALUES(name);\n\n';

  // Generate 100 products
  sql += `-- 5. Products (100 Products)\nINSERT INTO products (id, sku, name, description, mrp, purchase_price, selling_price, gst_rate, hsn_code, unit, batch_number, expiry_date, barcode, qr_code, min_stock_level, max_stock_level, image_url, category_id, supplier_id) VALUES\n`;
  
  const productNames = [
    'Amul Butter 500g', 'Aashirvaad Atta 10kg', 'Tata Salt 1kg', 'Parle-G Biscuit Package', 'Maggi 2-Min Masala Noodles',
    'Dove Shampoo Repair 650ml', 'Dettol Soap Protect 125g', 'Surf Excel Powder 5kg', 'Colgate Toothpaste Strong 500g', 'Good Day Cookies Cashew',
    'Fortune Sunflower Oil 5L', 'Saffola Gold Blend Oil 5L', 'Britannia Whole Wheat Bread', 'Red Label Strong Tea 1kg', 'Bru Instant Coffee 200g',
    'Daawat Rozana Basmati 5kg', 'Refined Sugar Premium 5kg', 'Unpolished Toor Dal 2kg', 'Split Urad Dal split 2kg', 'Tata Sampann Turmeric 500g',
    'Amul Taza Milk 1L', 'Amul Cheese Slices 200g', 'Mother Dairy Dahi 400g', 'Lijjat Papad Garlic 200g', 'Catch Coriander Powder 200g',
    'Haldiram Bhujia Sev 350g', 'Kurkure Masala Munch 90g', 'Lay’s Magic Masala 90g', 'Cadbury Dairy Milk Silk 150g', 'Nestle KitKat 4-Finger',
    'Pepsi Soft Drink 750ml', 'Coca-Cola Zero Sugar 750ml', 'Sprite Lemon Drink 750ml', 'Tropicana Orange Juice 1L', 'Paper Boat Aam Panna 250ml',
    'Vim Dishwash Gel 500ml', 'Lizol Floor Cleaner 2L', 'Harpic Toilet Cleaner 1L', 'Comfort Fabric Conditioner', 'Dettol Antiseptic Liquid 500ml',
    'Nivea Creme Moisturizer 200ml', 'Pears Pure Soap 125g', 'Clinic Plus Shampoo 650ml', 'Head & Shoulders Cool Menthol', 'Axe Signature Body Spray',
    'Sensodyne Toothpaste 150g', 'Close-Up Red Hot Gel 150g', 'Gillette Shaving Foam 200g', 'Himalaya Neem Face Wash 200ml', 'Vaseline Body Lotion 400ml',
    'Aashirvaad Multigrain Atta 5kg', 'Pillsbury Chakki Fresh Atta 5kg', 'Fortune Mustard Oil 1L', 'Dhara Groundnut Oil 1L', 'Tata Salt Lite 1kg',
    'Catch Black Pepper 100g', 'MDH Deggi Mirch 100g', 'Everest Garam Masala 100g', 'Everest Sabji Masala 100g', 'Tata Tea Premium 1kg',
    'Nescafe Classic Coffee 200g', 'Bournvita Health Drink 1kg', 'Horlicks Malt Drink 1kg', 'Boost Energy Drink 1kg', 'Real Mixed Fruit Juice 1L',
    'Uncle Chipps Spicy Treat 90g', 'Bingo Mad Angles 90g', 'Parle Monaco Salty Biscuits', 'Britannia Marie Gold 250g', 'Sunfeast Dark Fantasy 300g',
    'Ferrero Rocher T16 pack', 'Hershey’s Chocolate Syrup 600g', 'Kellogg’s Corn Flakes 875g', 'Bagrry’s Rolled Oats 1kg', 'Saffola Masala Oats 500g',
    'Kissan Tomato Ketchup 1kg', 'Veeba Eggless Mayonnaise 250g', 'FunFoods Peanut Butter 350g', 'Amul Fresh Cream 250ml', 'Yakult Probiotic Drink 5-Pack',
    'Vico Vajradanti Toothpaste', 'Biotique Neem Body Wash', 'Lifebuoy Total Soap 125g', 'Savlon Antiseptic Soap', 'Pond’s Sandal Powder 400g',
    'Ariel Matic Front Load 2kg', 'Rin Detergent Bar 250g', 'Colin Glass Cleaner 500ml', 'Hit Flying Insect Killer 400ml', 'Baygon Cockroach Spray 400ml',
    'Whisper Choice Wings 20 pads', 'Stayfree Secure Extra Large', 'Garnier Hair Color Natural', 'Godrej Rich Black Powder', 'Parachute Coconut Oil 500ml',
    'Dabur Amla Hair Oil 450ml', 'Keo Karpin Hair Oil 300ml', 'Fiama Di Wills Body Wash', 'Wild Stone Code Body Spray', 'Park Avenue Premium Cologne'
  ];

  const productRows = [];
  for (let i = 1; i <= productsCount; i++) {
    const sku = `SKU-IND-${String(1000 + i)}`;
    const name = productNames[i - 1] || `FMCG Product ${i}`;
    const desc = `Premium localized FMCG inventory item number ${i}`;
    
    // Set prices
    const mrp = parseFloat((30 + i * 7.5).toFixed(2));
    const purchase = parseFloat((mrp * 0.75).toFixed(2));
    const selling = parseFloat((mrp * 0.9).toFixed(2));
    
    const gstRates = [0.00, 5.00, 12.00, 18.00, 28.00];
    const gst = gstRates[i % gstRates.length];
    
    const hsn = `0${String(40000000 + i * 2311).substring(0, 7)}`;
    const units = ['Pieces', 'Boxes', 'Cartons'];
    const unit = units[i % units.length];
    
    const batch = `BAT-IND-${100 + i}`;
    const expiry = `2027-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`;
    const barcode = `890${String(1000000000 + i * 762413).substring(0, 10)}`;
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${sku}`;
    
    const catId = (i % 5) + 1;
    const supId = (i % 25) + 1;
    const minStock = 10 + (i % 20);
    const maxStock = minStock * 10;
    const imageUrl = `https://images.unsplash.com/photo-${1543083115 + i * 100}?w=200&auto=format&fit=crop&q=80`;

    productRows.push(`(${i}, '${sku}', '${name}', '${desc}', ${mrp}, ${purchase}, ${selling}, ${gst}, '${hsn}', '${unit}', '${batch}', '${expiry}', '${barcode}', '${qr}', ${minStock}, ${maxStock}, '${imageUrl}', ${catId}, ${supId})`);
  }
  sql += productRows.join(',\n') + '\nON DUPLICATE KEY UPDATE sku=VALUES(sku);\n\n';

  // Generate Stock levels
  sql += `-- 6. Stock Levels (Active quantities inside warehouses)\nINSERT INTO stock_levels (warehouse_id, product_id, quantity, rack_number) VALUES\n`;
  const stockRows = [];
  for (let w = 1; w <= 5; w++) {
    for (let p = 1; p <= productsCount; p++) {
      // Not all products in all warehouses
      if ((p + w) % 3 !== 0) {
        // Stock quantity
        const qty = 50 + ((p * w) % 250);
        const rack = `RCK-${String.fromCharCode(64 + w)}-${String(p).padStart(2, '0')}`;
        stockRows.push(`(${w}, ${p}, ${qty}, '${rack}')`);
      }
    }
  }
  sql += stockRows.join(',\n') + '\nON DUPLICATE KEY UPDATE quantity=VALUES(quantity);\n\n';

  // Generate 500 transactions (inflow, outflow, transfers) over the past 6 months
  sql += `-- 7. Stock Transactions (Exactly 500 entries for charts and reports)\nINSERT INTO stock_transactions (id, product_id, from_warehouse_id, to_warehouse_id, quantity, type, user_id, notes, invoice_number, po_number, created_at) VALUES\n`;
  
  const transRows = [];
  const transTypes = ['IN', 'OUT', 'TRANSFER'];
  const notesTemplates = [
    'Procured from primary vendor', 
    'Direct sale fulfillment dispatch', 
    'Internal inventory balance transfer',
    'Bulk restocking cargo arrival', 
    'Customer order delivery shipping', 
    'Depot rebalancing transport'
  ];

  let currentId = 1;
  const now = new Date();
  
  for (let i = 1; i <= transactionsCount; i++) {
    const pId = (i % productsCount) + 1;
    const type = transTypes[i % transTypes.length];
    
    let fromWh = 'NULL';
    let toWh = 'NULL';
    let qty = 10 + (i % 80);
    let note = '';
    
    if (type === 'IN') {
      toWh = (i % 5) + 1;
      note = notesTemplates[0];
    } else if (type === 'OUT') {
      fromWh = (i % 5) + 1;
      note = notesTemplates[1];
    } else {
      fromWh = (i % 5) + 1;
      toWh = ((i + 1) % 5) + 1;
      if (fromWh === toWh) {
        toWh = (toWh % 5) + 1;
      }
      note = notesTemplates[2];
    }

    const uId = (i % usersCount) + 1;
    const inv = `INV-GST-${1000 + i}`;
    const po = `PO-IND-${2000 + i}`;

    // Stagger dates over the last 6 months
    const date = new Date();
    date.setDate(now.getDate() - Math.floor(i * 0.35)); // staggers back about 175 days
    const dateString = date.toISOString().slice(0, 19).replace('T', ' ');

    transRows.push(`(${currentId}, ${pId}, ${fromWh}, ${toWh}, ${qty}, '${type}', ${uId}, '${note}', '${inv}', '${po}', '${dateString}')`);
    currentId++;
  }

  sql += transRows.join(',\n') + '\nON DUPLICATE KEY UPDATE quantity=VALUES(quantity);\n';

  fs.writeFileSync(path.join(process.cwd(), 'database', 'seed.sql'), sql, 'utf8');
  console.log('Successfully generated database/seed.sql with complete ERP records!');
}

generateSeed();
