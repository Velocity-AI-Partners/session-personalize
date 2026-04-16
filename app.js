// ── Configuration ──────────────────────────────────────────────
const WEBHOOK_URL = 'https://velocityaipartners.app.n8n.cloud/webhook/session-personalize';

const SUPABASE_URL = 'https://jjckotsrhuxxftwmdlwc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqY2tvdHNyaHV4eGZ0d21kbHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MTU4ODUsImV4cCI6MjA4MzM5MTg4NX0.AAQSDK4gu7lDUrFFk540HHELQ85S0vyATNQT6up-pXE';
const ADD_TO_CALENDAR_URL = SUPABASE_URL + '/functions/v1/add-to-calendar';
const ADD_TO_CALENDAR_SECRET = 'vcal_k8m2p4x7w9';

const LOGO_BASE = SUPABASE_URL + '/storage/v1/object/public/location-logos/logos/';

const LOCATIONS = {
  'stretch-zone-westborough': {
    name: 'Stretch Zone Westborough',
    logo: LOGO_BASE + 'stretch-zone-westborough-1771338230095.png',
    address: '600 Union St Suite 102, Westborough, MA 01581',
    timezone: 'America/New_York'
  },
  'stretch-zone-west-boylston': {
    name: 'Stretch Zone West Boylston',
    logo: LOGO_BASE + 'stretch-zone-west-boylston-1771338222411.png',
    address: '342 W Boylston St, West Boylston, MA 01583',
    timezone: 'America/New_York'
  },
  'stretch-zone-baton-rouge': {
    name: 'Stretch Zone Baton Rouge',
    logo: LOGO_BASE + 'stretch-zone-west-boylston-1771338222411.png',
    address: '7575 Jefferson Hwy Suite E, Baton Rouge, LA 70806',
    timezone: 'America/Chicago'
  },
  'stretch-zone-dfw': {
    name: 'Stretch Zone Southlake',
    logo: LOGO_BASE + 'stretch-zone-west-boylston-1771338222411.png',
    address: '405 N Carroll Ave, Southlake, TX 76092',
    timezone: 'America/Chicago'
  },
  'stretchlab-carlsbad': {
    name: 'StretchLab Carlsbad',
    logo: LOGO_BASE + 'stretchlab-carlsbad-1771338129474.webp',
    address: '1850 Marron Rd Suite 102, Carlsbad, CA 92008',
    timezone: 'America/Los_Angeles'
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

if (customerName) {
  summaryEl.textContent = 'Hi ' + customerName.split(' ')[0] + '! Tell us how to make your session great.';
} else {
  summaryEl.textContent = 'Help us customize your upcoming session.';
}

// ── Render appointment card ───────────────────────────────────
function formatApptDate(dateStr) {
  // Input examples: "November 20, 2026", "Nov 20, 2026", "2026-11-20"
  var d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

if (bookingDate && bookingTime) {
  document.getElementById('appt-date').textContent = formatApptDate(bookingDate);
  document.getElementById('appt-time').textContent = bookingTime;
  if (loc && loc.address) {
    document.getElementById('appt-address').textContent = loc.address;
    document.getElementById('appt-address-row').style.display = 'flex';
  }
  if (instructor) {
    document.getElementById('appt-instructor').textContent = instructor;
    document.getElementById('appt-instructor-row').style.display = 'flex';
  }
  document.getElementById('appointment-card').style.display = 'block';
  renderCalendarButtons();
}

// ── Add-to-calendar links ─────────────────────────────────────
function toIsoDate(dateStr) {
  var MONTHS = { January:'01', February:'02', March:'03', April:'04', May:'05', June:'06', July:'07', August:'08', September:'09', October:'10', November:'11', December:'12', Jan:'01', Feb:'02', Mar:'03', Apr:'04', Jun:'06', Jul:'07', Aug:'08', Sep:'09', Oct:'10', Nov:'11', Dec:'12' };
  var m = dateStr.match(/(\w+)\s+(\d+),?\s*(\d{4})/);
  if (m && MONTHS[m[1]]) return m[3] + '-' + MONTHS[m[1]] + '-' + m[2].padStart(2, '0');
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  var d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  return '';
}

function toIsoTime(timeStr) {
  var m = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return '';
  var h = parseInt(m[1], 10);
  if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12;
  if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
  return String(h).padStart(2, '0') + ':' + m[2];
}

function renderCalendarButtons() {
  var container = document.getElementById('calendar-buttons');
  if (!container) return;
  var isoDate = toIsoDate(bookingDate);
  var isoTime = toIsoTime(bookingTime);
  if (!isoDate || !isoTime || !loc) return;

  container.innerHTML = '<div class="cal-loading">Loading calendar options...</div>';

  fetch(ADD_TO_CALENDAR_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-secret': ADD_TO_CALENDAR_SECRET },
    body: JSON.stringify({
      title: 'Session at ' + loc.name,
      event_date: isoDate,
      event_time: isoTime,
      duration_min: 60,
      location_name: loc.name,
      location_address: loc.address || '',
      description: instructor ? 'With ' + instructor : '',
      timezone: loc.timezone || 'America/New_York'
    })
  })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data || (!data.gcal_url && !data.ics_url)) {
        container.innerHTML = '';
        return;
      }
      var html = '<div class="cal-buttons"><div class="cal-label">Add to Calendar</div>';
      if (data.gcal_url) html += '<a class="cal-btn cal-btn-google" href="' + data.gcal_url + '" target="_blank" rel="noopener">&#128197; Google Calendar</a>';
      if (data.ics_url) html += '<a class="cal-btn cal-btn-apple" href="' + data.ics_url + '">&#128198; Apple / Outlook</a>';
      html += '</div>';
      container.innerHTML = html;
    })
    .catch(function() { container.innerHTML = ''; });
}

// ── Chip toggle logic ─────────────────────────────────────────
document.querySelectorAll('.chip-grid').forEach(function(grid) {
  grid.addEventListener('click', function(e) {
    var chip = e.target.closest('.chip');
    if (!chip) return;

    if (grid.id === 'budget') {
      var wasSelected = chip.classList.contains('selected');
      grid.querySelectorAll('.chip.selected').forEach(function(c) {
        c.classList.remove('selected');
      });
      if (!wasSelected) chip.classList.add('selected');
      return;
    }

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
  var budgetChips = getSelectedChips('budget');

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
    budget: budgetChips.length > 0 ? budgetChips[0] : null,
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
      budget: payload.budget,
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
