// ── Configuration ──────────────────────────────────────────────
const WEBHOOK_URL = 'https://velocityaipartners.app.n8n.cloud/webhook/session-personalize';

const SUPABASE_URL = 'https://jjckotsrhuxxftwmdlwc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqY2tvdHNyaHV4eGZ0d21kbHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MTU4ODUsImV4cCI6MjA4MzM5MTg4NX0.AAQSDK4gu7lDUrFFk540HHELQ85S0vyATNQT6up-pXE';

const LOGO_BASE = SUPABASE_URL + '/storage/v1/object/public/location-logos/logos/';

const LOCATIONS = {
  'stretch-zone-westborough': {
    name: 'Stretch Zone Westborough',
    logo: LOGO_BASE + 'stretch-zone-westborough-1771338230095.png'
  },
  'stretch-zone-west-boylston': {
    name: 'Stretch Zone West Boylston',
    logo: LOGO_BASE + 'stretch-zone-west-boylston-1771338222411.png'
  },
  'stretch-zone-baton-rouge': {
    name: 'Stretch Zone Baton Rouge',
    logo: LOGO_BASE + 'stretch-zone-west-boylston-1771338222411.png'
  },
  'stretch-zone-dfw': {
    name: 'Stretch Zone Southlake',
    logo: LOGO_BASE + 'stretch-zone-west-boylston-1771338222411.png'
  },
  'stretchlab-carlsbad': {
    name: 'StretchLab Carlsbad',
    logo: LOGO_BASE + 'stretchlab-carlsbad-1771338129474.webp'
  }
};

// ── Parse URL params ──────────────────────────────────────────
const params = new URLSearchParams(window.location.search);
const locationSlug = params.get('location') || '';
const customerName = params.get('name') || '';
const customerPhone = params.get('phone') || '';
const bookingDate = params.get('date') || '';
const bookingTime = params.get('time') || '';
const instructor = params.get('instructor') || '';
const memberId = params.get('member_id') || '';
const bookingId = params.get('booking_id') || '';
const userId = params.get('user_id') || params.get('lid') || params.get('customerId') || '';

// ── Populate header ───────────────────────────────────────────
const loc = LOCATIONS[locationSlug];
const logoEl = document.getElementById('location-logo');
const summaryEl = document.getElementById('booking-summary');

if (loc) {
  logoEl.src = loc.logo;
  logoEl.alt = loc.name + ' Logo';
  document.title = 'Personalize Your Session | ' + loc.name;
} else {
  logoEl.classList.add('hidden');
}

if (customerName && bookingDate && bookingTime) {
  const firstName = customerName.split(' ')[0];
  summaryEl.textContent = 'Hi ' + firstName + '! Help us make your ' + bookingDate + ' at ' + bookingTime + ' session even better.';
} else if (customerName) {
  summaryEl.textContent = 'Hi ' + customerName.split(' ')[0] + '! Help us customize your upcoming session.';
} else {
  summaryEl.textContent = 'Help us customize your upcoming session.';
}

// ── Chip toggle logic ─────────────────────────────────────────
document.querySelectorAll('.chip-grid').forEach(function(grid) {
  grid.addEventListener('click', function(e) {
    var chip = e.target.closest('.chip');
    if (!chip) return;
    chip.classList.toggle('selected');

    // Toggle "Other" input visibility
    if (chip.classList.contains('chip-other')) {
      var inputId = chip.id.replace('-chip', '-input');
      var otherInput = document.getElementById(inputId);
      if (otherInput) {
        if (chip.classList.contains('selected')) {
          otherInput.classList.remove('hidden');
          otherInput.focus();
        } else {
          otherInput.classList.add('hidden');
          otherInput.value = '';
        }
      }
    }
  });
});

function getSelectedChips(containerId) {
  var chips = document.querySelectorAll('#' + containerId + ' .chip.selected');
  var values = Array.from(chips).map(function(c) { return c.dataset.value; });
  // Replace "other" with the actual typed text
  var otherInput = document.getElementById(containerId.replace('s', 's') + '-other-input');
  // Try the correct ID pattern
  if (containerId === 'focus-areas') otherInput = document.getElementById('focus-other-input');
  if (containerId === 'goals') otherInput = document.getElementById('goals-other-input');
  if (otherInput && otherInput.value.trim() && values.indexOf('other') !== -1) {
    values = values.filter(function(v) { return v !== 'other'; });
    values.push(otherInput.value.trim());
  }
  return values;
}

// ── Form submission ───────────────────────────────────────────
var form = document.getElementById('personalize-form');
var submitBtn = document.getElementById('submit-btn');
var btnText = document.getElementById('btn-text');
var btnLoading = document.getElementById('btn-loading');
var errorMsg = document.getElementById('error-message');
var successScreen = document.getElementById('success-screen');

form.addEventListener('submit', function(e) {
  e.preventDefault();
  errorMsg.classList.add('hidden');

  var focusAreas = getSelectedChips('focus-areas');
  var goals = getSelectedChips('goals');
  var intensity = document.querySelector('input[name="intensity"]:checked');

  var payload = {
    location_slug: locationSlug,
    location_name: loc ? loc.name : locationSlug,
    customer_name: customerName,
    customer_phone: customerPhone,
    member_id: memberId,
    user_id: userId,
    booking_id: bookingId,
    booking_date: bookingDate,
    booking_time: bookingTime,
    instructor: instructor,
    focus_areas: focusAreas,
    goals: goals,
    injuries: document.getElementById('injuries').value.trim(),
    activity: document.getElementById('activity').value.trim(),
    intensity: intensity ? intensity.value : 'moderate',
    lifestyle: document.getElementById('lifestyle').value.trim(),
    notes: document.getElementById('notes').value.trim(),
    submitted_at: new Date().toISOString()
  };

  // Disable button, show loading
  submitBtn.disabled = true;
  btnText.classList.add('hidden');
  btnLoading.classList.remove('hidden');

  // Send to Supabase directly (insert into session_preferences table)
  var supabasePromise = fetch(SUPABASE_URL + '/rest/v1/session_preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      location_slug: payload.location_slug,
      location_name: payload.location_name,
      customer_name: payload.customer_name,
      customer_phone: payload.customer_phone,
      member_id: payload.member_id || null,
      booking_id: payload.booking_id || null,
      booking_date: payload.booking_date || null,
      booking_time: payload.booking_time || null,
      instructor: payload.instructor || null,
      focus_areas: payload.focus_areas,
      goals: payload.goals,
      injuries: payload.injuries || null,
      activity: payload.activity || null,
      intensity: payload.intensity,
      lifestyle: payload.lifestyle || null,
      notes: payload.notes || null
    })
  });

  // Send to n8n webhook (for email + CRM note update)
  var webhookPromise = WEBHOOK_URL !== 'PLACEHOLDER_WEBHOOK_URL'
    ? fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(function() { /* webhook failure is non-blocking */ })
    : Promise.resolve();

  Promise.all([supabasePromise, webhookPromise])
    .then(function(results) {
      var supabaseRes = results[0];
      if (!supabaseRes.ok) {
        throw new Error('Failed to save preferences');
      }
      // Show success
      form.classList.add('hidden');
      successScreen.classList.remove('hidden');
    })
    .catch(function() {
      errorMsg.classList.remove('hidden');
      submitBtn.disabled = false;
      btnText.classList.remove('hidden');
      btnLoading.classList.add('hidden');
    });
});
