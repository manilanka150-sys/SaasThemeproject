// ✅ API BASE URL
const API_URL = "http://localhost:5000";

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const forgotForm = document.getElementById('forgotForm');

/* ==============================
   FEATURE ANIMATION + DESCRIPTION
   ============================== */
const features = document.querySelectorAll('.feature');

const revealFeatures = () => {
  features.forEach(feature => {
    const pos = feature.getBoundingClientRect().top;
    if (pos < window.innerHeight - 100) {
      feature.style.opacity = "1";
      feature.style.transform = "translateY(0)";
    }
  });
};

window.addEventListener('scroll', revealFeatures);
window.addEventListener('load', revealFeatures);

// Toggle feature descriptions
features.forEach(feature => {
  feature.addEventListener('click', () => {
    const desc = feature.querySelector('.feature-desc');
    if (!desc) return;

    if (desc.style.display === 'block') {
      desc.style.display = 'none';
      desc.style.opacity = 0;
    } else {
      document.querySelectorAll('.feature-desc').forEach(d => {
        d.style.display = 'none';
        d.style.opacity = 0;
      });
      desc.textContent = feature.dataset.desc;
      desc.style.display = 'block';
      setTimeout(() => desc.style.opacity = 1, 50);
    }
  });
});

/* ==============================
   MODALS (LOGIN / REGISTER / FORGOT)
   ============================== */
const modals = document.querySelectorAll('.modal');
const closeModalBtns = document.querySelectorAll('.modal .close');

function openModal(id) {
  modals.forEach(m => m.style.display = 'none'); // close all first
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'block';
}

// Close modal
closeModalBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    btn.closest('.modal').style.display = 'none';
  });
});

// Close modal on outside click
window.addEventListener('click', e => {
  modals.forEach(modal => {
    if (e.target === modal) modal.style.display = 'none';
  });
});

// Switch modals links
document.getElementById('showRegister')?.addEventListener('click', e => {
  e.preventDefault();
  openModal('registerModal');
});
document.getElementById('showForgot')?.addEventListener('click', e => {
  e.preventDefault();
  openModal('forgotModal');
});
document.getElementById('showLoginFromRegister')?.addEventListener('click', e => {
  e.preventDefault();
  openModal('loginModal');
});
document.getElementById('showLoginFromForgot')?.addEventListener('click', e => {
  e.preventDefault();
  openModal('loginModal');
});

/* ==============================
   LOGIN / LOGOUT
   ============================== */
const loginButton = document.getElementById('loginBtn');
const logoutButton = document.getElementById('logoutBtn');

function updateAuthButtons() {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  if (loginButton) loginButton.style.display = isLoggedIn ? 'none' : 'inline-block';
  if (logoutButton) logoutButton.style.display = isLoggedIn ? 'inline-block' : 'none';
}
updateAuthButtons();

loginButton?.addEventListener('click', () => openModal('loginModal'));

logoutButton?.addEventListener('click', () => {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('token'); // ✅ remove token on logout
  alert('Logged out successfully');
  updateAuthButtons();

  // Remove active state from all pricing plans
  const plans = document.querySelectorAll('.plan');
  plans.forEach(p => {
    p.classList.remove('active');
    const btn = p.querySelector('.choose-plan');
    if (btn) btn.classList.remove('active');
  });

  // Clear all form fields
  if (loginForm) loginForm.reset();
  if (registerForm) registerForm.reset();
  if (forgotForm) forgotForm.reset();
});

/* ==============================
   LOGIN FORM SUBMISSION
   ============================== */
loginForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  if (!email || !password) { alert('Enter email & password'); return; }

  try {
    const res = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.msg);

    alert(data.msg);
    modals.forEach(m => m.style.display = 'none');

    localStorage.setItem('isLoggedIn', 'true'); // keep for UI
    localStorage.setItem('token', data.token); // ✅ IMPORTANT improvement

    updateAuthButtons();
  } catch (err) {
    alert(err.message);
  }
});

/* ==============================
   REGISTER FORM SUBMISSION
   ============================== */
registerForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const fullName = document.getElementById('fullName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const country = document.getElementById('country').value.trim();
  const password = document.getElementById('registerPassword').value.trim();
  const confirm = document.getElementById('registerConfirmPassword').value.trim();

  if (!fullName || !email || !country || !password || !confirm) { alert('Fill all fields'); return; }
  if (password !== confirm) { alert('Passwords do not match'); return; }

  try {
    const res = await fetch(`${API_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, country, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg);

    alert(data.msg);
    modals.forEach(m => m.style.display = 'none');

    localStorage.setItem('isLoggedIn', 'true'); // for UI
    
    // 🔥 Optional: Auto-login after register if backend sends token later
    if (data.token) {
      localStorage.setItem('token', data.token);
    }

    updateAuthButtons();
  } catch (err) {
    alert(err.message);
  }
});

/* ==============================
   FORGOT PASSWORD FORM SUBMISSION
   ============================== */
forgotForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('forgotEmail').value.trim();
  const newPassword = document.getElementById('forgotNewPassword').value.trim();
  const confirmPassword = document.getElementById('forgotConfirmPassword').value.trim();

  if (!email || !newPassword || !confirmPassword) { alert('Fill all fields'); return; }
  if (newPassword !== confirmPassword) { alert('Passwords do not match'); return; }

  try {
    const res = await fetch(`${API_URL}/api/forgot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg);

    alert(data.msg);
    document.getElementById('forgotModal').style.display = 'none';
    openModal('loginModal');
  } catch (err) {
    alert(err.message);
  }
});

/* ==============================
   HERO BUTTON SCROLL
   ============================== */
const heroBtn = document.querySelector('.hero-btn');
heroBtn?.addEventListener('click', () => {
  const pricingSection = document.getElementById('pricing');
  if (pricingSection) {
    pricingSection.scrollIntoView({ behavior: 'smooth' });
  }
});

/* ==============================
   PRICING PLAN SELECTION
   ============================== */
const plans = document.querySelectorAll('.plan');

plans.forEach(plan => {
  plan.addEventListener('click', () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn) {
      const loginModal = document.getElementById('loginModal');
      if (loginModal) loginModal.style.display = 'block';
      return;
    }

    plans.forEach(p => {
      p.classList.remove('active');
      const btn = p.querySelector('.choose-plan');
      if (btn) btn.classList.remove('active');
    });

    plan.classList.add('active');
    const chooseBtn = plan.querySelector('.choose-plan');
    if (chooseBtn) chooseBtn.classList.add('active');
  });
});

/* ==============================
   FAQ TOGGLE
   ============================== */
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
  item.addEventListener('click', () => {
    faqItems.forEach(faq => {
      if(faq !== item){
        faq.classList.remove('active');
      }
    });
    item.classList.toggle('active');
  });
});

// Highlight current page in header nav
const navLinks = document.querySelectorAll('.header nav a');
const currentPage = window.location.pathname.split("/").pop(); // gets current file like "home.html"

navLinks.forEach(link => {
  const linkPage = link.getAttribute('href');
  if (linkPage === currentPage) {
    link.classList.add('active'); // add green highlight
  } else {
    link.classList.remove('active'); // remove if previously active
  }
});

/* ==============================
   CONTACT FORM (UPDATED)
   ============================== */
const messageForm = document.getElementById('messageForm');

messageForm?.addEventListener('submit', async function(e) {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const query = document.getElementById('query').value.trim();

  if (!name || !email || !query) {
    alert('Please fill in all fields before submitting.');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, query })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.msg);

    alert(`Thank you ${name}, your message has been sent successfully!`);
    messageForm.reset();

  } catch (err) {
    alert(err.message || "Server error. Please try again.");
  }
});