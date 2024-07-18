const createSvgIcon = (rotation, format = 'svg') => {
    const scaledWidth = 40;
    const scaledHeight = 40;
    let text = "AB";
    let circleColor = "#1E90FF";

    // Calculate darker gradient color
    const gradientColor = darkenColor(circleColor, 0.7); // Darken by 30%
    
    // Define SVG content
    const svg = `
        <svg width="${scaledWidth}" height="${scaledHeight}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <!-- Circle representing the sun -->
            <circle cx="50" cy="50" r="30" fill="${circleColor}" stroke="${circleColor}" stroke-width="2.25"/>
            <defs>
                <linearGradient id="rayGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stop-color="${circleColor}"/>
                    <stop offset="100%" stop-color="${gradientColor}"/>
                </linearGradient>
            </defs>
            <polygon points="50,10 63.75,35 36.25,35" fill="url(#rayGradient)" stroke="${circleColor}" stroke-width="1.5" stroke-linejoin="round" transform="rotate(${rotation}, 50, 50)"/>
            <text x="50" y="60" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="#000000">${text}</text>
        </svg>`;

    if (format === 'dataURL') {
        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }
    return svg;
};

function darkenColor(hexColor, factor) {
    // Remove the '#' if present
    hexColor = hexColor.replace('#', '');

    // Parse the hex color to RGB
    const red = parseInt(hexColor.substring(0, 2), 16);
    const green = parseInt(hexColor.substring(2, 4), 16);
    const blue = parseInt(hexColor.substring(4, 6), 16);

    // Darken the RGB values
    const darkenedRed = Math.round(red * factor);
    const darkenedGreen = Math.round(green * factor);
    const darkenedBlue = Math.round(blue * factor);

    // Convert back to hexadecimal
    const darkenedHex = `#${darkenedRed.toString(16).padStart(2, '0')}${darkenedGreen.toString(16).padStart(2, '0')}${darkenedBlue.toString(16).padStart(2, '0')}`;

    return darkenedHex;
};

export {
    createSvgIcon
};