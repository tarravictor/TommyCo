
  // MENU DATA
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
    if (order) { order.status = newStatus; localStorage.setItem('tommyco_orders', JSON.stringify(ordersDatabase)); }
  }

  // JPG RECEIPT DOWNLOAD
  async function downloadReceiptAsJPG(orderNumber, items, total, timestamp) {
    const receiptTemplate = document.getElementById('receiptCaptureTemplate');
    const receiptContentDiv = document.getElementById('receiptContent');
    
    const dateStr = new Date(timestamp).toLocaleString();
    let itemsHtml = '<div style="margin: 1rem 0;"><table style="width:100%; border-collapse: collapse;">';
    items.forEach(item => {
      itemsHtml += `<tr style="border-bottom: 1px solid #F0E5D8;">
        <td style="padding: 8px 0;"><strong>${item.name}</strong> x${item.qty}</td>
        <td style="text-align: right; padding: 8px 0;">₱${item.price * item.qty}</td>
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
        <span style="color: #C47A2E;">₱${total}</span>
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

  // Cart logic
  let cart = [];
  function addToCart(name, price) {
    let existing = cart.find(i => i.name === name);
    if (existing) existing.qty++;
    else cart.push({ name, price, qty: 1 });
    updateCartUI();
  }
  function quickOrder(name, price) { addToCart(name, price); document.getElementById('cartDrawer').classList.add('active'); }
  function removeItem(name) { cart = cart.filter(i => i.name !== name); updateCartUI(); }
  
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
      listDiv.innerHTML += `
        <div class="cart-item-row">
          <span><b>${item.name}</b> x${item.qty}</span>
          <span>₱${subtotal} <i class="fas fa-trash" style="color:#b95f1a; margin-left:12px; cursor:pointer;" onclick="removeItem('${item.name}')"></i></span>
        </div>
      `;
      receiptHtml += `${item.name} x${item.qty} — ₱${subtotal}<br>`;
    });
    if (cart.length === 0) receiptHtml = '✨ Your bag is empty. Add your favorite coffee!';
    receiptDiv.innerHTML = receiptHtml;
    totalSpan.innerText = total;
    countSpan.innerText = count;
  }

  // Checkout with JPG receipt download
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
    const totalVal = parseInt(document.getElementById('cartTotal').innerText);
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

  document.getElementById('closeModalBtn').onclick = () => modal.classList.remove('active');
  modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };

  // TRACK ORDER
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
        <p><strong>Total:</strong> ₱${order.total}</p>
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

  // Render functions
  function renderMenu() {
    const container = document.getElementById('menuGrid');
    container.innerHTML = menuData.map(item => `
      <div class="menu-item">
        <img src="${item.img}" alt="${item.name}">
        <div class="menu-info">
          <h3>${item.name}</h3>
          <div class="price">₱${item.price}</div>
          <div style="display: flex; gap: 10px;">
            <button class="btn-outline" style="padding: 8px 16px;" onclick="addToCart('${item.name}', ${item.price})">Add</button>
            <button class="btn-primary" style="padding: 8px 16px;" onclick="quickOrder('${item.name}', ${item.price})">Order now</button>
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
        <h3>${p.title}</h3>
        <p>${p.desc}</p>
      </div>
    `).join('');
  }

  // Chatbot with About Us knowledge
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
      return "TommyCo was founded by Tommy Guerrero in 2020. We started as a small cart in Sta. Ana and now we're a beloved community cafe! We source local beans from Benguet and Batangas. ☕";
    }
    if(lower.includes('track')) return "Go to the Track Order section and enter your order number like TC-1234!";
    if(lower.includes('jpg') || lower.includes('invoice') || lower.includes('receipt')) return "After placing an order, your invoice is automatically downloaded as a JPG image. Show it to the cashier! 📸";
    if(lower.includes('menu')) return "We have Espresso, Latte, Mocha, Matcha, Spanish Latte, Cold Brew, and more! Check the Menu section 🍵";
    if(lower.includes('promo')) return "Happy Hour 3-6PM (20% off), BOGO Wednesdays, Student P99 Iced Latte, and Midnight Brew after 10PM!";
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

  // Cart drawer controls
  document.getElementById('cartIconBtn').onclick = () => document.getElementById('cartDrawer').classList.add('active');
  document.getElementById('closeCart').onclick = () => document.getElementById('cartDrawer').classList.remove('active');

  window.addToCart = addToCart;
  window.quickOrder = quickOrder;
  window.removeItem = removeItem;

  renderMenu();
  renderPromos();
  updateCartUI();

 
let currentIndex = 0;

const slides = document.querySelectorAll(".carousel-img");
const dots = document.querySelectorAll(".dot");

function showSlide(index) {
  // Loop back if out of bounds
  if (index >= slides.length) currentIndex = 0;
  else if (index < 0) currentIndex = slides.length - 1;
  else currentIndex = index;

  // Hide all images
  slides.forEach((slide) => slide.classList.remove("active"));
  dots.forEach((dot) => dot.classList.remove("active"));

  // Show current
  slides[currentIndex].classList.add("active");
  dots[currentIndex].classList.add("active");
}

function changeSlide(direction) {
  showSlide(currentIndex + direction);
}

function currentSlide(index) {
  showSlide(index);
}

// Optional: auto-slide every 6 seconds
setInterval(() => {
  changeSlide(1);
}, 6000);
