const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Создаем папку для изображений если ее нет
const outputDir = 'png';
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Утилиты
function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// Цветовые схемы
const colorSchemes = [
    // 0: Красный и черный
    {
        name: 'Красный-черный',
        colors: ['#000000', '#330000', '#660000', '#990000', '#cc0000', '#ff0000', '#ff3333', '#ff6666']
    },
    // 1: Черный и белый
    {
        name: 'Черный-белый',
        colors: ['#000000', '#111111', '#333333', '#666666', '#999999', '#cccccc', '#eeeeee', '#ffffff']
    },
    // 2: Красный и желтый
    {
        name: 'Красный-желтый',
        colors: ['#000000', '#330000', '#660000', '#990000', '#cc3300', '#ff6600', '#ff9900', '#ffcc00']
    },
    // 3: Черный и красный (инверсная)
    {
        name: 'Черный-красный',
        colors: ['#000000', '#1a0000', '#330000', '#660000', '#990000', '#cc0000', '#ff0000', '#ff3333']
    },
    // 4: Синий градиент с черным
    {
        name: 'Синий-черный',
        colors: ['#000000', '#000033', '#000066', '#000099', '#0000cc', '#0000ff', '#3333ff', '#6666ff']
    },
    // 5: Зеленый градиент
    {
        name: 'Зеленый-черный',
        colors: ['#000000', '#001100', '#003300', '#006600', '#009900', '#00cc00', '#00ff00', '#33ff33']
    },
    // 6: Фиолетовый градиент
    {
        name: 'Фиолетовый-черный',
        colors: ['#000000', '#110011', '#330033', '#660066', '#990099', '#cc00cc', '#ff00ff', '#ff33ff']
    },
    // 7: Радужный градиент
    {
         name: 'Радужный',
        colors: ['#000000', '#330000', '#663300', '#996600', '#cccc00', '#33cc33', '#0066cc', '#6600cc']
    }
];

// Красивые константы для Джулии
const juliaConstants = [
    { cx: -0.7269, cy: 0.1889, name: "Морской конек" },
    { cx: -0.4, cy: 0.6, name: "Спираль" },
    { cx: 0.285, cy: 0.01, name: "Дендриты" },
    { cx: -0.70176, cy: -0.3842, name: "Снежинка" },
    { cx: -0.8, cy: 0.156, name: "Коралл" },
    { cx: 0.3, cy: -0.5, name: "Цветок" },
    { cx: -0.156, cy: -1.032, name: "Паутина" },
    { cx: 0.37, cy: 0.1, name: "Кружево" },
    { cx: -1.2, cy: 0.2, name: "Вихрь" },
    { cx: 0.355, cy: 0.355, name: "Симметрия" },
    { cx: -0.123, cy: 0.745, name: "Звезда" },
    { cx: 0.28, cy: 0.008, name: "Река" },
    { cx: -0.75, cy: 0.11, name: "Сердце" },
    { cx: 0.32, cy: 0.043, name: "Папоротник" }
];

// Функция интерполяции цвета
function interpolateColor(color1, color2, factor) {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);

    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);

    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);

    return [r, g, b];
}

// Получение цвета из схемы
function getColorFromScheme(scheme, t) {
    t = clamp(t, 0, 1);
    const colors = scheme.colors;

    if (t >= 1) {
        const lastColor = colors[colors.length - 1];
        return [
            parseInt(lastColor.slice(1, 3), 16),
            parseInt(lastColor.slice(3, 5), 16),
            parseInt(lastColor.slice(5, 7), 16)
        ];
    }

    if (t <= 0) {
        const firstColor = colors[0];
        return [
            parseInt(firstColor.slice(1, 3), 16),
            parseInt(firstColor.slice(3, 5), 16),
            parseInt(firstColor.slice(5, 7), 16)
        ];
    }

    const segment = 1 / (colors.length - 1);
    const index = Math.floor(t / segment);
    const factor = (t % segment) / segment;

    return interpolateColor(colors[index], colors[index + 1], factor);
}

// Функция для создания круглых углов
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// Генерация фрактала Мандельброта
function generateMandelbrot(index, colorScheme, zoomLevel) {
    const width = 400;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Очищаем canvas с прозрачным фоном
    ctx.clearRect(0, 0, width, height);

    // Создаем обрезанный путь с круглыми углами
    roundRect(ctx, 0, 0, width, height, 20);
    ctx.clip();

    // Определяем область просмотра в зависимости от уровня зума
    let centerX, centerY, scale;

    if (zoomLevel === 1) {
        // Общий вид
        centerX = -0.5;
        centerY = 0;
        scale = 0.005;
    } else if (zoomLevel === 2) {
        // Средний зум - интересные области
        const centers = [
            [-0.743643887037151, 0.13182590420533],  // Известная деталь
            [-1.25066, 0.02012],                     // Другая интересная область
            [-0.1592, -1.0317],                      // Еще одна
            [0.273, 0.007]                           // И еще
        ];
        const center = centers[Math.floor(Math.random() * centers.length)];
        centerX = center[0];
        centerY = center[1];
        scale = randomInRange(0.0005, 0.002);
    } else {
        // Максимальный зум - детали
        centerX = randomInRange(-1.5, 1.5);
        centerY = randomInRange(-1.5, 1.5);
        scale = randomInRange(0.0001, 0.001);
    }

    const maxIterations = 200 + zoomLevel * 50;
    const aspectRatio = width / height;

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    // Генерация фрактала
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let zx = (x - width / 2) * scale * aspectRatio + centerX;
            let zy = (y - height / 2) * scale + centerY;

            let cx = zx;
            let cy = zy;
            let iteration = 0;

            while (zx * zx + zy * zy < 4 && iteration < maxIterations) {
                const xtemp = zx * zx - zy * zy + cx;
                zy = 2 * zx * zy + cy;
                zx = xtemp;
                iteration++;
            }

            const idx = (y * width + x) * 4;

            if (iteration === maxIterations) {
                // Внутренние точки
                data[idx] = 0;
                data[idx + 1] = 0;
                data[idx + 2] = 0;
                data[idx + 3] = 255;
            } else {
                // Улучшенное окрашивание
                const zn = Math.sqrt(zx * zx + zy * zy);
                const nu = Math.log(Math.log(zn) / Math.LN2) / Math.LN2;
                const smoothIter = iteration + 1 - nu;
                const t = clamp(smoothIter / maxIterations, 0, 1);

                // Добавляем некоторую текстуру
                const texture = 0.1 * Math.sin(iteration * 0.1);
                const finalT = clamp(t + texture, 0, 1);

                const [r, g, b] = getColorFromScheme(colorScheme, finalT);

                data[idx] = r;
                data[idx + 1] = g;
                data[idx + 2] = b;
                data[idx + 3] = 255;
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);

    // Добавляем белую рамку
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    roundRect(ctx, 1, 1, width - 2, height - 2, 20);
    ctx.stroke();


    // Сохранение
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(outputDir, `${index.toString().padStart(2, '0')}.png`), buffer);

    return `Мандельброт #${index} - ${colorScheme.name}, зум ${zoomLevel}x`;
}

// Генерация фрактала Джулия
function generateJulia(index, colorScheme, zoomLevel) {
    const width = 400;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Очищаем canvas
    ctx.clearRect(0, 0, width, height);

    // Создаем обрезанный путь с круглыми углами
    roundRect(ctx, 0, 0, width, height, 20);
    ctx.clip();

    // Выбираем константу
    const constant = juliaConstants[Math.floor(Math.random() * juliaConstants.length)];
    const cx = constant.cx;
    const cy = constant.cy;

    // Определяем масштаб в зависимости от уровня зума
    let scale, centerX, centerY;

    if (zoomLevel === 1) {
        // Общий вид
        scale = randomInRange(0.01, 0.02);
        centerX = randomInRange(-0.5, 0.5);
        centerY = randomInRange(-0.5, 0.5);
    } else if (zoomLevel === 2) {
        // Средний зум
        scale = randomInRange(0.005, 0.01);
        centerX = randomInRange(-0.3, 0.3);
        centerY = randomInRange(-0.3, 0.3);
    } else {
        // Максимальный зум
        scale = randomInRange(0.001, 0.005);
        centerX = randomInRange(-0.2, 0.2);
        centerY = randomInRange(-0.2, 0.2);
    }

    const maxIterations = 250 + zoomLevel * 50;
    const aspectRatio = width / height;

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    // Генерация фрактала
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let zx = (x - width / 2) * scale * aspectRatio + centerX;
            let zy = (y - height / 2) * scale + centerY;

            let iteration = 0;

            while (iteration < maxIterations) {
                const zx2 = zx * zx;
                const zy2 = zy * zy;

                if (zx2 + zy2 > 4) break;

                const zxNew = zx2 - zy2 + cx;
                zy = 2 * zx * zy + cy;
                zx = zxNew;

                iteration++;
            }

            const idx = (y * width + x) * 4;

            if (iteration === maxIterations) {
                // Внутренние точки - темные тона из схемы
                const [r, g, b] = getColorFromScheme(colorScheme, 0.1);
                data[idx] = Math.floor(r * 0.3);
                data[idx + 1] = Math.floor(g * 0.3);
                data[idx + 2] = Math.floor(b * 0.3);
                data[idx + 3] = 255;
            } else {
                // Сглаженное окрашивание
                const zn = Math.sqrt(zx * zx + zy * zy);
                const nu = Math.log(Math.log(zn) / Math.LN2) / Math.LN2;
                const smoothIter = iteration + 1 - nu;
                let t = clamp(smoothIter / maxIterations, 0, 1);

                // Улучшаем видимость деталей
                t = Math.pow(t, 0.6);

                // Добавляем волновой эффект для лепестков
                const angle = Math.atan2(zy, zx);
                const wave = 0.15 * Math.sin(angle * 8 + iteration * 0.05);
                const finalT = clamp(t + wave, 0, 1);

                const [r, g, b] = getColorFromScheme(colorScheme, finalT);

                data[idx] = r;
                data[idx + 1] = g;
                data[idx + 2] = b;
                data[idx + 3] = 255;
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);

    // Добавляем белую рамку
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    roundRect(ctx, 1, 1, width - 2, height - 2, 20);
    ctx.stroke();

    // Сохранение
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(outputDir, `${index.toString().padStart(2, '0')}.png`), buffer);

    return `Джулия #${index} - ${constant.name}, ${colorScheme.name}, зум ${zoomLevel}x`;
}

// Основная функция генерации
function generateAllFractals() {
    console.log('🚀 Начинаю генерацию 40 фракталов...\n');

    const startTime = Date.now();
    const results = [];

    // Очищаем папку перед генерацией
    const files = fs.readdirSync(outputDir);
    for (const file of files) {
        if (file.endsWith('.png')) {
            fs.unlinkSync(path.join(outputDir, file));
        }
    }

    // Генерируем 20 Мандельбротов
    for (let i = 1; i <= 20; i++) {
        const colorScheme = colorSchemes[(i - 1) % colorSchemes.length];
        const zoomLevel = (i % 3) + 1; // 1, 2 или 3

        const result = generateMandelbrot(i, colorScheme, zoomLevel);
        results.push(result);
        console.log(`✓ ${result}`);
    }

    // Генерируем 20 Джулий
    for (let i = 21; i <= 40; i++) {
        const colorScheme = colorSchemes[(i - 21) % colorSchemes.length];
        const zoomLevel = ((i - 21) % 3) + 1; // 1, 2 или 3

        const result = generateJulia(i, colorScheme, zoomLevel);
        results.push(result);
        console.log(`✓ ${result}`);
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log(`\n✅ Генерация завершена за ${duration.toFixed(2)} секунд`);
    console.log(`📁 Изображения сохранены в папке: ${outputDir}/`);
    console.log(`🖼️  Всего создано: 40 изображений (20 Мандельброт + 20 Джулия)`);
    console.log(`🎨 Использовано цветовых схем: ${colorSchemes.length}`);
    console.log(`🔍 Уровни увеличения: 1x, 2x, 3x`);
};
    // Запускаем
    generateAllFractals();

