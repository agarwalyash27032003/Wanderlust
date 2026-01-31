function toggleMenu() {
  const dropdown = document.getElementById("dropdown");
  if (!dropdown) return;
  dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
}

document.addEventListener("click", function (e) {
  const menu = document.querySelector(".menu-wrapper");
  if (menu && !menu.contains(e.target)) {
    const dropdown = document.getElementById("dropdown");
    if (dropdown) dropdown.style.display = "none";
  }
});



document.querySelectorAll(".property-type").forEach(icon => {
  icon.addEventListener("click", () => {
    const type = icon.getAttribute("data-type");
    if (type) window.location.href = `/listings?type=${type}`;
  });
});


// Maps

document.addEventListener('DOMContentLoaded', () => {
  const mapElement = document.getElementById("map");
  if (!mapElement) return;

  const locationInput = document.getElementById("location");
  const cityInput = document.getElementById("city");
  const countryInput = document.getElementById("country");
  const latInput = document.getElementById("lat");
  const lngInput = document.getElementById("lng");

  /* ======================================================
     FORM PAGE MAP (New / Edit Listing)
     ====================================================== */

  if (locationInput && latInput && lngInput) {

    let defaultLat = parseFloat(latInput.value) || 20.5937;
    let defaultLng = parseFloat(lngInput.value) || 78.9629;

    const map = new maplibregl.Map({
      container: "map",
      style: "https://api.maptiler.com/maps/basic-v2/style.json?key=orQJlTV0osvHWSlRP4p9",
      center: [defaultLng, defaultLat],
      zoom: 5
    });

    let marker = new maplibregl.Marker({ draggable: true })
      .setLngLat([defaultLng, defaultLat])
      .addTo(map);

    /* ===== LIVE LOCATION + CITY + COUNTRY SEARCH ===== */

    let debounceTimer;

    async function updateMapFromAddress() {
      clearTimeout(debounceTimer);

      debounceTimer = setTimeout(async () => {
        const location = locationInput.value.trim();
        const city = cityInput?.value.trim();
        const country = countryInput?.value;

        const fullAddress = [location, city, country].filter(Boolean).join(", ");

        if (fullAddress.length < 3) return;

        try {
          const res = await fetch(
            `https://api.maptiler.com/geocoding/${encodeURIComponent(fullAddress)}.json?key=orQJlTV0osvHWSlRP4p9`
          );

          const data = await res.json();
          if (!data.features || !data.features.length) return;

          const [lng, lat] = data.features[0].center;

          map.flyTo({ center: [lng, lat], zoom: 14 });
          marker.setLngLat([lng, lat]);

          latInput.value = lat;
          lngInput.value = lng;

        } catch (err) {
          console.error("Geocoding error:", err);
        }
      }, 400);
    }

    locationInput.addEventListener("input", updateMapFromAddress);
    cityInput?.addEventListener("input", updateMapFromAddress);
    countryInput?.addEventListener("change", updateMapFromAddress);

    /* ===== DRAG MARKER ===== */

    marker.on("dragend", () => {
      const pos = marker.getLngLat();
      latInput.value = pos.lat;
      lngInput.value = pos.lng;
    });

    /* ===== CLICK MAP ===== */

    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      marker.setLngLat([lng, lat]);
      latInput.value = lat;
      lngInput.value = lng;
    });

    return; // IMPORTANT → prevents show-page map from running
  }

  /* ======================================================
     SHOW PAGE MAP (Static)
     ====================================================== */

  const lat = parseFloat(mapElement.dataset.lat);
  const lng = parseFloat(mapElement.dataset.lng);

  console.log("📍 SHOW MAP COORDS:", lat, lng);

  if (!lat || !lng) {
    console.warn("❌ Missing lat/lng for show page map");
    return;
  }

  const map = new maplibregl.Map({
    container: "map",
    style: "https://api.maptiler.com/maps/basic-v2/style.json?key=orQJlTV0osvHWSlRP4p9",
    center: [lng, lat],
    zoom: 13
  });

  new maplibregl.Marker()
    .setLngLat([lng, lat])
    .addTo(map);
});


// Bookings - Payment + Calendar
document.addEventListener("DOMContentLoaded", async () => {

  const checkin = document.getElementById("checkin");
  const checkout = document.getElementById("checkout");
  const payBtn = document.getElementById("pay-btn");
  const listingId = document.getElementById("listingId")?.value;
  const guestsInput = document.getElementById("guests");

  if (!checkin || !checkout || !payBtn || !listingId || !guestsInput) {
    return;
  }

  /* -------- Fetch booked dates -------- */
  let disabledDates = [];
  try {
    const res = await fetch(`/listings/${listingId}/bookings/booked-dates`);
    const data = await res.json();
    disabledDates = data.bookedDates || [];
  } catch (err) {
    console.warn("⚠️ Could not load booked dates");
  }

  /* -------- Flatpickr -------- */
  const checkoutPicker = flatpickr(checkout, {
    dateFormat: "Y-m-d",
    disable: disabledDates
  });

  flatpickr(checkin, {
    dateFormat: "Y-m-d",
    minDate: "today",
    disable: disabledDates,

    onChange(selectedDates, dateStr) {
      if (!selectedDates.length) return;

      //Add 1 day to check-in
      const minCheckoutDate = new Date(selectedDates[0]);
      minCheckoutDate.setDate(minCheckoutDate.getDate() + 1);

      checkoutPicker.set("minDate", minCheckoutDate);

      //Reset checkout if invalid
      if (
        checkoutPicker.selectedDates.length &&
        checkoutPicker.selectedDates[0] < minCheckoutDate
      ) {
        checkoutPicker.clear();
      }

      checkoutPicker.open();
    }
  });

  //Razorpay Payment 
  payBtn.addEventListener("click", async () => {
    const checkIn = checkin.value;
    const checkOut = checkout.value;
    const guests = Number(guestsInput.value) || 1;

    if (!checkIn || !checkOut) {
      alert("Please select check-in and check-out dates");
      return;
    }

    const res = await fetch("/payment/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, checkIn, checkOut, guests })
    });

    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }

    const order = await res.json();

    const rzp = new Razorpay({
      key: window.RAZORPAY_KEY,
      amount: order.amount,
      currency: "INR",
      name: "Wanderlust",
      description: "Property Booking",
      order_id: order.id,

      handler: async (response) => {
        const verify = await fetch("/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...response,
            listingId,
            checkIn,
            checkOut,
            guests
          })
        });

        const result = await verify.json();
        if (result.success) {
          window.location.href = "/my-bookings";
        } else {
          alert("Payment verification failed");
        }
      },

      theme: { color: "#e04343" }
    });

    rzp.open();
  });
});

// Sort By

document.addEventListener("DOMContentLoaded", () => {
  const customSelect = document.querySelector(".custom-select");
  if (!customSelect) return;

  const selected = customSelect.querySelector(".selected");
  const options = customSelect.querySelector(".sort-by-options");

  selected.addEventListener("click", (e) => {
    e.stopPropagation();
    options.classList.toggle("show");
  });

  document.querySelectorAll(".sort-by-options li").forEach(option => {
    option.addEventListener("click", () => {
      const value = option.dataset.value;

      // Preserve existing query params
      const url = new URL(window.location.href);

      if (value) {
        url.searchParams.set("sort", value);
      } else {
        url.searchParams.delete("sort");
      }

      window.location.href = url.toString();
    });
  });

  document.addEventListener("click", () => {
    options.classList.remove("show");
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const filterToggle = document.getElementById("filter-toggle");
  const filtersWrapper = document.getElementById("filters-wrapper");
  const submitBtn = document.getElementById("filters-form-submit-button");
  const closeBtn = document.querySelector(".close-filters");
  const body = document.body;

  // Guard: only run if filters exist
  if (!filterToggle || !filtersWrapper) return;

  // OPEN
  filterToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    filtersWrapper.classList.add("active");
    submitBtn?.classList.add("active");
    body.classList.add("no-scroll");
  });

  // CLOSE (X button)
  closeBtn?.addEventListener("click", () => {
    filtersWrapper.classList.remove("active");
    submitBtn?.classList.remove("active");
    body.classList.remove("no-scroll");
  });

  // CLOSE on outside click
  document.addEventListener("click", (e) => {
    if (!filtersWrapper.contains(e.target) && !filterToggle.contains(e.target)) {
      filtersWrapper.classList.remove("active");
      submitBtn?.classList.remove("active");
      body.classList.remove("no-scroll");
    }
  });
});
