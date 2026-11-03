(function () {
  const canvas = document.getElementById("priceChart");
  const caption = document.getElementById("chartCaption");
  const alertBox = document.getElementById("alert");
  const sourceLine = document.getElementById("sourceLine");
  const priceFormat = new Intl.NumberFormat("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const signedFormat = new Intl.NumberFormat("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: "exceptZero",
  });

  function formatPrice(value) {
    return priceFormat.format(value);
  }

  function showError(message) {
    alertBox.textContent = message;
    alertBox.classList.remove("d-none");
    caption.textContent = "Wykres niedostępny.";
  }

  function csvUrl() {
    const fromQuery = new URLSearchParams(window.location.search).get("csv");
    const raw = (fromQuery || canvas.dataset.csv || "").trim();
    const parts = raw.split("/");
    if (!raw || raw.includes("://") || raw.startsWith("//") || parts.includes("..")) {
      throw new Error("Niedozwolona ścieżka pliku CSV.");
    }
    return raw;
  }

  function parseCsv(text) {
    const lines = text
      .replace(/^\uFEFF/, "")
      .trim()
      .split(/\r?\n/)
      .filter(Boolean);
    if (lines.length < 2) {
      throw new Error("Plik CSV nie zawiera danych.");
    }

    const headers = lines[0].split(",").map((header) => header.trim().toLowerCase());
    const dateIdx = headers.indexOf("date");
    const closeIdx = headers.indexOf("close");
    const tickerIdx = headers.indexOf("ticker");
    if (dateIdx === -1 || closeIdx === -1) {
      throw new Error("CSV musi mieć kolumny date i close.");
    }

    const points = [];
    for (let i = 1; i < lines.length; i += 1) {
      const cells = lines[i].split(",").map((cell) => cell.trim());
      const close = Number(cells[closeIdx].replace(",", "."));
      const date = cells[dateIdx];
      if (!date || Number.isNaN(close)) {
        throw new Error("Niepoprawny wiersz CSV: " + lines[i]);
      }
      points.push({
        date: date,
        close: close,
        ticker: tickerIdx === -1 ? "" : cells[tickerIdx],
      });
    }
    return points;
  }

  function render(points, url) {
    const ticker = points[0].ticker || "Instrument";
    const first = points[0].close;
    const last = points[points.length - 1].close;
    const min = Math.min.apply(null, points.map((point) => point.close));
    const max = Math.max.apply(null, points.map((point) => point.close));
    const change = last - first;
    const changePct = (change / first) * 100;
    const up = change >= 0;
    const color = up ? "#0f7b4c" : "#b42318";

    document.title = "TechALL — " + ticker;
    sourceLine.textContent = ticker + " · plik " + url + " · " + points.length + " sesji";
    document.getElementById("statLast").textContent = formatPrice(last);
    const changeNode = document.getElementById("statChange");
    changeNode.textContent = signedFormat.format(change) + " (" + signedFormat.format(changePct) + "%)";
    changeNode.classList.toggle("text-success", up);
    changeNode.classList.toggle("text-danger", !up);
    document.getElementById("statMin").textContent = formatPrice(min);
    document.getElementById("statMax").textContent = formatPrice(max);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    new Chart(canvas, {
      type: "line",
      data: {
        labels: points.map((point) => point.date),
        datasets: [
          {
            label: "Cena zamknięcia",
            data: points.map((point) => point.close),
            borderColor: color,
            backgroundColor: up ? "rgba(15, 123, 76, 0.12)" : "rgba(180, 35, 24, 0.12)",
            fill: true,
            tension: 0.15,
            pointRadius: 0,
            pointHoverRadius: 4,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: reducedMotion ? false : undefined,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (context) {
                return "Zamknięcie: " + formatPrice(context.parsed.y);
              },
            },
          },
        },
        scales: {
          x: {
            ticks: { maxTicksLimit: 8, maxRotation: 0 },
            grid: { display: false },
          },
          y: {
            ticks: {
              callback: function (value) {
                return formatPrice(value);
              },
            },
          },
        },
      },
    });

    const summary =
      ticker +
      ": " +
      points[0].date +
      " – " +
      points[points.length - 1].date +
      ". Ostatnie zamknięcie " +
      formatPrice(last) +
      ".";
    canvas.setAttribute("aria-label", "Wykres liniowy ceny zamknięcia. " + summary);
    caption.textContent = summary;
  }

  async function main() {
    try {
      const url = csvUrl();
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Nie udało się pobrać pliku CSV (" + response.status + ").");
      }
      render(parseCsv(await response.text()), url);
    } catch (error) {
      showError(error.message || "Nie udało się wyświetlić wykresu.");
    }
  }

  main();
})();
