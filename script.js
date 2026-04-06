// ========== MENU DATA ==========
const menuData = [
  { name: "Espresso", price: 120, img: "espresso.jpg" },
  { name: "Latte", price: 150, img: "latte.jpg" },
  { name: "Mocha", price: 160, img: "mocha.jpg" },
  { name: "Americano", price: 130, img: "americano.jpg" },
  { name: "Matcha Latte", price: 170, img: "matcha.jpg" },
  { name: "Spanish Latte", price: 165, img: "spanish.jpg" },
  { name: "Caramel Macchiato", price: 180, img: "caramel.jpg" },
  { name: "Cold Brew", price: 140, img: "coldbrew.jpg" }
];

const promosData = [
  { title: "TommyCo Frappe is Finally Here!", desc: "Launching October 3, 2025 at 3PM—enjoy 10% OFF on all flavors! ☕", icon: "fas fa-coffee" },
  { title: "COMING SOON...", desc: "More exciting promos coming soon!", icon: "fas fa-clock" },
  { title: "COMING SOON...", desc: "More exciting promos coming soon!", icon: "fas fa-clock" },
  { title: "COMING SOON...", desc: "More exciting promos coming soon!", icon: "fas fa-clock" },
];

// ========== HELPER: Format price with commas ==========
function formatPrice(price) {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// ========== ORDER DATABASE ==========
let ordersDatabase = JSON.parse(localStorage.getItem('tommyco_orders')) || [];

function generateOrderNumber() {
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `TC-${random}`;
}

function saveOrder(order) {
  ordersDatabase.unshift(order);
  localStorage.setItem('tommyco_orders', JSON.stringify(ordersDatabase));
}

function getOrderByNumber(orderNum) {
  return ordersDatabase.find(o => o.orderNumber === orderNum);
}

function updateOrderStatus(orderNum, newStatus) {
  const order = ordersDatabase.find(o => o.orderNumber === orderNum);
  if (order) { 
    order.status = newStatus; 
    localStorage.setItem('tommyco_orders', JSON.stringify(ordersDatabase)); 
  }
}

// ========== JPG RECEIPT DOWNLOAD ==========
async function downloadReceiptAsJPG(orderNumber, items, total, timestamp) {
  const receiptTemplate = document.getElementById('receiptCaptureTemplate');
  const receiptContentDiv = document.getElementById('receiptContent');
  
  const dateStr = new Date(timestamp).toLocaleString();
  let itemsHtml = '<div style="margin: 1rem 0;"><table style="width:100%; border-collapse: collapse;">';
  items.forEach(item => {
    itemsHtml += `<tr style="border-bottom: 1px solid #F0E5D8;">
      <td style="padding: 8px 0;"><strong>${escapeHtml(item.name)}</strong> x${item.qty}</td>
      <td style="text-align: right; padding: 8px 0;">₱${formatPrice(item.price * item.qty)}</td>
    </tr>`;
  });
  itemsHtml += `</table></div>`;
  
  receiptContentDiv.innerHTML = `
    <div style="text-align: center;">
      <p style="font-size: 0.9rem; color: #C47A2E;">Order #${orderNumber}</p>
      <p style="font-size: 0.8rem; color: #8B7355;">${dateStr}</p>
    </div>
    ${itemsHtml}
    <div style="display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: 800; margin-top: 1rem; padding-top: 0.5rem; border-top: 2px solid #C47A2E;">
      <span>TOTAL</span>
      <span style="color: #C47A2E;">₱${formatPrice(total)}</span>
    </div>
    <div style="margin-top: 1rem; text-align: center; font-size: 0.75rem;">
      <p>✨ Walk-in order • Show this JPG to cashier ✨</p>
    </div>
  `;
  
  receiptTemplate.style.position = 'fixed';
  receiptTemplate.style.top = '0';
  receiptTemplate.style.left = '0';
  receiptTemplate.style.zIndex = '99999';
  receiptTemplate.style.display = 'block';
  
  try {
    const canvas = await html2canvas(receiptTemplate, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true
    });
    const image = canvas.toDataURL('image/jpeg', 0.95);
    const link = document.createElement('a');
    link.download = `TommyCo_Invoice_${orderNumber}.jpg`;
    link.href = image;
    link.click();
  } catch (err) {
    console.error('JPG generation error:', err);
    alert('Receipt generated but could not download JPG. Please try again.');
  } finally {
    receiptTemplate.style.position = 'fixed';
    receiptTemplate.style.top = '-9999px';
    receiptTemplate.style.left = '-9999px';
    receiptTemplate.style.zIndex = '-1';
  }
}

// ========== ESCAPE HTML ==========
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// ========== CART LOGIC (with formatted prices) ==========
let cart = [];

function addToCart(name, price) {
  let existing = cart.find(i => i.name === name);
  if (existing) existing.qty++;
  else cart.push({ name, price, qty: 1 });
  updateCartUI();
}

function quickOrder(name, price) { 
  addToCart(name, price); 
  document.getElementById('cartDrawer').classList.add('active'); 
}

function removeItem(name) { 
  cart = cart.filter(i => i.name !== name); 
  updateCartUI(); 
}

function updateCartUI() {
  const listDiv = document.getElementById('cartItemsList');
  const totalSpan = document.getElementById('cartTotal');
  const countSpan = document.getElementById('cartItemCount');
  const receiptDiv = document.getElementById('receiptPreview');
  
  let total = 0, count = 0;
  listDiv.innerHTML = '';
  let receiptHtml = '🧾 <strong>Order summary</strong><br>';
  
  cart.forEach(item => {
    const subtotal = item.price * item.qty;
    total += subtotal;
    count += item.qty;
    
    // Display with formatted prices
    listDiv.innerHTML += `
      <div class="cart-item-row">
        <span><b>${escapeHtml(item.name)}</b> x${item.qty}</span>
        <span>₱${formatPrice(subtotal)} <i class="fas fa-trash" style="color:#b95f1a; margin-left:12px; cursor:pointer;" onclick="removeItem('${escapeHtml(item.name).replace(/'/g, "\\'")}')"></i></span>
      </div>
    `;
    receiptHtml += `${escapeHtml(item.name)} x${item.qty} — ₱${formatPrice(subtotal)}<br>`;
  });
  
  if (cart.length === 0) receiptHtml = '✨ Your bag is empty. Add your favorite coffee!';
  receiptDiv.innerHTML = receiptHtml;
  
  // Format total with commas
  totalSpan.innerText = formatPrice(total);
  countSpan.innerText = count;
}

// ========== CHECKOUT ==========
const modal = document.getElementById('orderModal');
const modalOrderSpan = document.getElementById('modalOrderNumber');
const modalMsg = document.getElementById('modalMessage');

document.getElementById('checkoutBtn').onclick = async () => {
  if (cart.length === 0) {
    modalMsg.innerText = 'Your cart is empty! Add some delicious drinks first.';
    modalOrderSpan.innerText = '❌';
    modal.classList.add('active');
    return;
  }
  
  const totalVal = parseInt(document.getElementById('cartTotal').innerText.replace(/,/g, ''));
  const orderNumber = generateOrderNumber();
  const timestamp = new Date().toISOString();
  const newOrder = {
    orderNumber: orderNumber,
    items: [...cart],
    total: totalVal,
    timestamp: timestamp,
    status: 'preparing'
  };
  saveOrder(newOrder);
  
  modalOrderSpan.innerText = orderNumber;
  modalMsg.innerHTML = `✅ Order #${orderNumber} confirmed! Your JPG invoice is downloading. Please show it to the cashier when paying.`;
  modal.classList.add('active');
  
  await downloadReceiptAsJPG(orderNumber, cart, totalVal, timestamp);
  
  cart = [];
  updateCartUI();
  document.getElementById('cartDrawer').classList.remove('active');
};

// Close modal
document.getElementById('closeModalBtn').onclick = () => modal.classList.remove('active');
modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };

// ========== TRACK ORDER ==========
const trackBtn = document.getElementById('trackBtn');
const trackInput = document.getElementById('trackOrderInput');
const trackPanel = document.getElementById('trackResultPanel');
const trackDetailsDiv = document.getElementById('trackDetails');

function displayTrackStatus(orderNum) {
  const order = getOrderByNumber(orderNum);
  if (!order) {
    trackDetailsDiv.innerHTML = `<div class="order-status"><i class="fas fa-exclamation-circle"></i> Order #${orderNum} not found. Please check the number or place an order first.</div>`;
    trackPanel.classList.add('active');
    return;
  }
  
  let statusIcon = '';
  let statusText = '';
  switch(order.status) {
    case 'preparing': statusIcon = '🟡'; statusText = 'Preparing your coffee ☕'; break;
    case 'ready': statusIcon = '✅'; statusText = 'Ready for pickup! Head to the counter.'; break;
    case 'completed': statusIcon = '🏁'; statusText = 'Order completed. Thank you!'; break;
    default: statusText = order.status;
  }
  
  let itemsList = order.items.map(i => `${i.name} x${i.qty}`).join(', ');
  trackDetailsDiv.innerHTML = `
    <div class="order-status">
      <h4><i class="fas fa-receipt"></i> Order #${order.orderNumber}</h4>
      <p><strong>Status:</strong> ${statusIcon} ${statusText}</p>
      <p><strong>Items:</strong> ${itemsList}</p>
      <p><strong>Total:</strong> ₱${formatPrice(order.total)}</p>
      <p><strong>Placed:</strong> ${new Date(order.timestamp).toLocaleString()}</p>
      ${order.status === 'preparing' ? '<button class="btn-outline" style="margin-top:10px;" onclick="simulateReady(\''+order.orderNumber+'\')">🔔 Mark as Ready (Demo)</button>' : ''}
    </div>
  `;
  trackPanel.classList.add('active');
}

window.simulateReady = (orderNum) => {
  updateOrderStatus(orderNum, 'ready');
  displayTrackStatus(orderNum);
};

trackBtn.onclick = () => {
  const orderId = trackInput.value.trim().toUpperCase();
  if (!orderId) {
    trackDetailsDiv.innerHTML = `<div class="order-status">Please enter an order number (e.g., TC-1234)</div>`;
    trackPanel.classList.add('active');
    return;
  }
  displayTrackStatus(orderId);
};

trackInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') trackBtn.click(); });

// ========== RENDER FUNCTIONS (with formatted prices) ==========
function renderMenu() {
  const container = document.getElementById('menuGrid');
  container.innerHTML = menuData.map(item => `
    <div class="menu-item">
      <img src="${item.img}" alt="${item.name}" onerror="this.src='https://placehold.co/300x200?text=Coffee'">
      <div class="menu-info">
        <h3>${escapeHtml(item.name)}</h3>
        <div class="price">₱${formatPrice(item.price)}</div>
        <div style="display: flex; gap: 10px;">
          <button class="btn-outline" style="padding: 8px 16px;" onclick="addToCart('${escapeHtml(item.name).replace(/'/g, "\\'")}', ${item.price})">Add</button>
          <button class="btn-primary" style="padding: 8px 16px;" onclick="quickOrder('${escapeHtml(item.name).replace(/'/g, "\\'")}', ${item.price})">Order now</button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderPromos() {
  const container = document.getElementById('promosContainer');
  container.innerHTML = promosData.map(p => `
    <div class="promo-card">
      <i class="${p.icon}"></i>
      <h3>${escapeHtml(p.title)}</h3>
      <p>${escapeHtml(p.desc)}</p>
    </div>
  `).join('');
}

// ========== CHATBOT WITH ABOUT US KNOWLEDGE ==========
const chatFab = document.getElementById('chatFab');
const chatWin = document.getElementById('chatWindow');
const closeChat = document.getElementById('closeChat');
const sendChatBtn = document.getElementById('sendChat');
const chatInput = document.getElementById('chatInput');
const chatMsgs = document.getElementById('chatMessages');

chatFab.onclick = () => chatWin.classList.toggle('open');
closeChat.onclick = () => chatWin.classList.remove('open');

function addMsg(msg, isUser) {
  let div = document.createElement('div');
  div.className = isUser ? 'user-msg' : 'bot-msg';
  div.innerText = msg;
  chatMsgs.appendChild(div);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
}

function botReply(text) {
  let lower = text.toLowerCase();
  if(lower.includes('about') || lower.includes('story') || lower.includes('founder')) {
    return "TommyCo was founded by Mr. Martin Magundayao in 2020. We started as a small cart in Sta. Ana and now we're a beloved community cafe! We source local beans from the community. ☕";
  }
  if(lower.includes('track')) return "Go to the Track Order section and enter your order number like TC-1234!";
  if(lower.includes('jpg') || lower.includes('invoice') || lower.includes('receipt')) return "After placing an order, your invoice is automatically downloaded as a JPG image. Show it to the cashier! 📸";
  if(lower.includes('menu')) return "We have Espresso, Latte, Mocha, Matcha, Spanish Latte, Cold Brew, and more! Check the Menu section 🍵";
  if(lower.includes('promo')) return "TommyCo Frappe is Finally Here! Launching October 3, 2025 at 3PM—enjoy 10% OFF on all flavors! ☕";
  if(lower.includes('location') || lower.includes('address')) return "📍 2284 Road15 Fabie Estate Sta. Ana, Manila. Open 3 PM to 12 AM daily!";
  return "I'm TommyBarista! Ask me about our story, menu, promos, order tracking, location, or JPG invoices. ☕";
}

function sendMessage() {
  let msg = chatInput.value.trim();
  if(!msg) return;
  addMsg(msg, true);
  chatInput.value = '';
  setTimeout(() => { addMsg(botReply(msg), false); }, 400);
}

sendChatBtn.onclick = sendMessage;
chatInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMessage(); });

// ========== CART DRAWER CONTROLS ==========
document.getElementById('cartIconBtn').onclick = () => document.getElementById('cartDrawer').classList.add('active');
document.getElementById('closeCart').onclick = () => document.getElementById('cartDrawer').classList.remove('active');

// ========== MAKE FUNCTIONS GLOBAL ==========
window.addToCart = addToCart;
window.quickOrder = quickOrder;
window.removeItem = removeItem;

// ========== FIXED CAROUSEL JAVASCRIPT ==========
function initCarousel() {
  const slides = document.querySelectorAll(".carousel-img");
  const dots = document.querySelectorAll(".dot");
  if (!slides.length || !dots.length) return;
  
  let currentIndex = 0;
  
  function showSlide(index) {
    if (index >= slides.length) currentIndex = 0;
    else if (index < 0) currentIndex = slides.length - 1;
    else currentIndex = index;
    
    slides.forEach((slide) => slide.classList.remove("active"));
    dots.forEach((dot) => dot.classList.remove("active"));
    
    slides[currentIndex].classList.add("active");
    dots[currentIndex].classList.add("active");
  }
  
  window.changeSlide = function(direction) {
    showSlide(currentIndex + direction);
  };
  
  window.currentSlide = function(index) {
    showSlide(index);
  };
  
  // Auto-slide every 6 seconds
  setInterval(() => {
    if (slides.length) {
      showSlide(currentIndex + 1);
    }
  }, 6000);
  
  // Attach click handlers to dots
  dots.forEach((dot, idx) => {
    dot.onclick = () => showSlide(idx);
  });
  
  showSlide(0);
}

// ========== INITIALIZE EVERYTHING ON DOM READY ==========
document.addEventListener('DOMContentLoaded', () => {
  renderMenu();
  renderPromos();
  updateCartUI();
  initCarousel();
});
