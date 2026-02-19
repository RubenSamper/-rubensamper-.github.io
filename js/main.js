let categorias = document.querySelector('.categorias');

let io = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.01,
    rootMargin: "0px 0px -20% 0px"
});

if (categorias) io.observe(categorias);

document.addEventListener("DOMContentLoaded", iniciarComparador);

function iniciarComparador() {
    var canvas = document.getElementById("myChart");
    if (!canvas) return;

    crearGrafico(canvas);
}

function crearGrafico(canvas) {
    var chart = new Chart(canvas, {
        type: "bar",
        data: {
            labels: ["ACE68", "G75 PRO", "X75 PRO", "K728 PRO"],
            datasets: [
                {
                    label: "Precio (€)",
                    data: [89.99, 59.99, 99.99, 79.99],
                    yAxisID: "yPrice",
                    borderWidth: 1
                },
                {
                    label: "Latencia (ms)",
                    data: [2.4, 3.8, 3.0, 2.0],
                    yAxisID: "yLatency",
                    type: "line",
                    tension: 0.35,
                    borderWidth: 2,
                    pointRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 800 },
            scales: {
                yPrice: {
                    type: "linear",
                    position: "left",
                    beginAtZero: true,
                    title: { display: true, text: "€" },
                    ticks: { padding: 6 }
                },
                yLatency: {
                    type: "linear",
                    position: "right",
                    beginAtZero: true,
                    grid: { drawOnChartArea: false },
                    title: { display: true, text: "ms" },
                    ticks: { padding: 6 }
                }
            }
        }
    });

    return chart;
}
