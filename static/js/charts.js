// Glicelivre - Charts Module
const GlicelivreCharts = {
    chart: null,
    
    initChart() {
        const ctx = document.getElementById('glucose-chart').getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Glicemia (mg/dL)',
                    data: [],
                    borderColor: '#00d6a3',
                    backgroundColor: 'rgba(0, 214, 163, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: (context) => {
                        const value = context.raw;
                        if (value < 70) return '#dc3545';
                        if (value > 140) return '#ffc107';
                        return '#28a745';
                    },
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        callbacks: {
                            title: (context) => {
                                return context[0].label;
                            },
                            label: (context) => {
                                const value = context.raw;
                                let status = '';
                                if (value < 70) status = ' (Baixa)';
                                else if (value > 140) status = ' (Alta)';
                                else status = ' (Normal)';
                                return `${value} mg/dL${status}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#adb5bd',
                            maxTicksLimit: 8
                        }
                    },
                    y: {
                        min: 50,
                        max: 300,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#adb5bd'
                        }
                    }
                },
                elements: {
                    point: {
                        hoverBackgroundColor: '#00d6a3'
                    }
                },
                // Add reference lines for normal glucose ranges
                annotation: {
                    annotations: {
                        lowLine: {
                            type: 'line',
                            yMin: 70,
                            yMax: 70,
                            borderColor: '#dc3545',
                            borderWidth: 1,
                            borderDash: [5, 5],
                            label: {
                                content: 'Mínimo Normal (70)',
                                enabled: false
                            }
                        },
                        highLine: {
                            type: 'line',
                            yMin: 140,
                            yMax: 140,
                            borderColor: '#ffc107',
                            borderWidth: 1,
                            borderDash: [5, 5],
                            label: {
                                content: 'Máximo Normal (140)',
                                enabled: false
                            }
                        }
                    }
                }
            }
        });
        
        // Add custom reference lines
        this.addReferenceLines();
    },
    
    addReferenceLines() {
        const canvas = document.getElementById('glucose-chart');
        const ctx = canvas.getContext('2d');
        
        // Store original draw function
        const originalDraw = this.chart.draw;
        
        this.chart.draw = function() {
            originalDraw.apply(this, arguments);
            
            const chartArea = this.chartArea;
            const yAxis = this.scales.y;
            
            // Draw normal range background
            const normalMin = yAxis.getPixelForValue(70);
            const normalMax = yAxis.getPixelForValue(140);
            
            ctx.save();
            ctx.fillStyle = 'rgba(40, 167, 69, 0.1)';
            ctx.fillRect(
                chartArea.left,
                normalMax,
                chartArea.right - chartArea.left,
                normalMin - normalMax
            );
            
            // Draw reference lines
            ctx.strokeStyle = 'rgba(220, 53, 69, 0.5)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            
            // Low glucose line (70)
            const lowY = yAxis.getPixelForValue(70);
            ctx.beginPath();
            ctx.moveTo(chartArea.left, lowY);
            ctx.lineTo(chartArea.right, lowY);
            ctx.stroke();
            
            // High glucose line (140)
            ctx.strokeStyle = 'rgba(255, 193, 7, 0.5)';
            const highY = yAxis.getPixelForValue(140);
            ctx.beginPath();
            ctx.moveTo(chartArea.left, highY);
            ctx.lineTo(chartArea.right, highY);
            ctx.stroke();
            
            ctx.restore();
        };
    },
    
    updateChart(data) {
        if (!this.chart) {
            this.initChart();
        }
        
        if (data.length === 0) {
            this.chart.data.labels = [];
            this.chart.data.datasets[0].data = [];
            this.chart.update();
            return;
        }
        
        // Sort data by date/time
        const sortedData = [...data].sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA - dateB;
        });
        
        // Prepare chart data
        const labels = sortedData.map(record => {
            const date = new Date(`${record.date}T${record.time}`);
            return date.toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        });
        
        const glucoseData = sortedData.map(record => record.glucose);
        
        // Update chart
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = glucoseData;
        
        // Update point colors based on glucose levels
        this.chart.data.datasets[0].pointBackgroundColor = glucoseData.map(value => {
            if (value < 50) return '#8b0000'; // Critical low
            if (value < 70) return '#dc3545'; // Low
            if (value > 300) return '#8b0000'; // Critical high
            if (value > 180) return '#ff6b35'; // Very high
            if (value > 140) return '#ffc107'; // High
            return '#28a745'; // Normal
        });
        
        this.chart.update();
    }
};
