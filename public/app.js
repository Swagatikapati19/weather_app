document.addEventListener('DOMContentLoaded', () => {
  const citySelect = document.getElementById('city-select');
  const fetchBtn = document.getElementById('fetch-btn');
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error-msg');
  const weatherCard = document.getElementById('weather-card');
  const historySection = document.getElementById('history-section');
  const historyList = document.getElementById('history-list');
  const cityChips = document.querySelectorAll('.city-chip');

  // Elements inside the weather card
  const wCity = document.getElementById('w-city');
  const wTimestamp = document.getElementById('w-timestamp');
  const wIcon = document.getElementById('w-icon');
  const wDescription = document.getElementById('w-description');
  const wTemp = document.getElementById('w-temp');
  const wTempStat = document.getElementById('w-temp-stat');
  const wHumidity = document.getElementById('w-humidity');
  const wWind = document.getElementById('w-wind');

  // Enable/disable the fetch button when a city is selected
  citySelect.addEventListener('change', () => {
    fetchBtn.disabled = !citySelect.value;
    updateActiveChip(citySelect.value);
  });

  // Fetch weather on button click
  fetchBtn.addEventListener('click', () => {
    if (citySelect.value) {
      fetchWeather(citySelect.value);
    }
  });

  // Quick city chip buttons
  cityChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const city = chip.dataset.city;
      citySelect.value = city;
      fetchBtn.disabled = false;
      updateActiveChip(city);
      fetchWeather(city);
    });
  });

  function updateActiveChip(city) {
    cityChips.forEach((c) => c.classList.remove('active'));
    if (city) {
      const active = document.querySelector(`.city-chip[data-city="${city}"]`);
      if (active) active.classList.add('active');
    }
  }

  function showLoading() {
    loadingEl.classList.remove('hidden');
    weatherCard.classList.add('hidden');
    errorEl.classList.add('hidden');
  }

  function hideLoading() {
    loadingEl.classList.add('hidden');
  }

  function showError(message) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
    weatherCard.classList.add('hidden');
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatTimeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  }

  async function fetchWeather(city) {
    showLoading();

    try {
      const response = await fetch(`/api/weather/${encodeURIComponent(city)}`);
      const data = await response.json();

      hideLoading();

      if (!response.ok) {
        showError(data.error || 'Failed to fetch weather data');
        return;
      }

      // Populate weather card
      wCity.textContent = data.city;
      wTimestamp.textContent = formatDate(data.timestamp);
      wIcon.src = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;
      wIcon.alt = data.description;
      wDescription.textContent = data.description;
      wTemp.textContent = `${data.temperature}\u00B0C`;
      wTempStat.textContent = `${data.temperature}\u00B0C`;
      wHumidity.textContent = `${data.humidity}%`;
      wWind.textContent = `${data.wind_speed} m/s`;

      weatherCard.classList.remove('hidden');
      errorEl.classList.add('hidden');

      // Fetch and display history
      fetchHistory(city);
    } catch (err) {
      hideLoading();
      showError('Network error. Please check your connection and try again.');
      console.error('Fetch error:', err);
    }
  }

  async function fetchHistory(city) {
    try {
      const response = await fetch(
        `/api/weather/history/${encodeURIComponent(city)}`
      );
      const data = await response.json();

      if (!response.ok || !Array.isArray(data) || data.length === 0) {
        historySection.classList.add('hidden');
        return;
      }

      historyList.innerHTML = '';

      data.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
          <img
            src="https://openweathermap.org/img/wn/${item.icon}.png"
            alt="${item.description}"
          />
          <div class="history-info">
            <div class="history-city">${item.city}</div>
            <div class="history-desc">${item.description}</div>
          </div>
          <div class="history-temp">${item.temperature}\u00B0C</div>
          <div class="history-time">${formatTimeAgo(item.timestamp)}</div>
        `;
        historyList.appendChild(div);
      });

      historySection.classList.remove('hidden');
    } catch (err) {
      console.error('History fetch error:', err);
      historySection.classList.add('hidden');
    }
  }
});
