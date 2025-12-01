import React, { useEffect, useRef } from 'react';
import { generateShareLink } from '../utils/socialShare';

/**
 * WordPoster
 * Reusable Swiss-design poster generator using HTML Canvas.
 *
 * Visualizes word frequency from a paragraph:
 * - More frequent words are larger.
 * - Clean, grid-based Swiss layout with strong typography.
 *
 * Props:
 * - width, height: canvas dimensions (default 1080x1350)
 * - title: main title text
 * - subtitle: optional subtitle (e.g. country)
 * - meta: optional meta line (e.g. "Month 1 · Day 3")
 * - text: paragraph text to analyze
 * - accentColor: main accent color (default '#880000')
 * - backgroundColor: outer background (default '#F2F2F2')
 * - footerLabel: footer label text (default 'ENGLISH READING PRACTICE')
 * - footerText: footer text at bottom right (default 'By Zayn · English Daily')
 * - onPosterReady: optional callback(canvas) after render (e.g. for download)
 */
const WordPoster = ({
    width = 1080,
    height = 1350,
    title = '',
    subtitle = '',
    meta = '',
    text = '',
    accentColor = '#880000',
    backgroundColor = '#F2F2F2',
    footerLabel = 'ENGLISH READING PRACTICE',
    footerText = 'By Zayn · English Daily',
    statistics,
    progress,
    month,
    day,
    onPosterReady
}) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Setup canvas size
        canvas.width = width;
        canvas.height = height;

        // Clear and background
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);

        const outerMargin = 80;
        const cardRadius = 0;
        const cardX = outerMargin;
        const cardY = outerMargin;
        const cardWidth = width - outerMargin * 2;
        const cardHeight = height - outerMargin * 2;

        // White card
        ctx.fillStyle = '#FFFFFF';
        if (cardRadius > 0) {
            ctx.beginPath();
            ctx.moveTo(cardX + cardRadius, cardY);
            ctx.lineTo(cardX + cardWidth - cardRadius, cardY);
            ctx.quadraticCurveTo(cardX + cardWidth, cardY, cardX + cardWidth, cardY + cardRadius);
            ctx.lineTo(cardX + cardWidth, cardY + cardHeight - cardRadius);
            ctx.quadraticCurveTo(cardX + cardWidth, cardY + cardHeight, cardX + cardWidth - cardRadius, cardY + cardHeight);
            ctx.lineTo(cardX + cardRadius, cardY + cardHeight);
            ctx.quadraticCurveTo(cardX, cardY + cardHeight, cardX, cardY + cardHeight - cardRadius);
            ctx.lineTo(cardX, cardY + cardRadius);
            ctx.quadraticCurveTo(cardX, cardY, cardX + cardRadius, cardY);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
        }

        const innerMargin = outerMargin + 60;
        const innerWidth = width - innerMargin * 2;

        // Swiss grid: top header band
        let yPos = innerMargin;

        // Single header line: e.g. "MONTH 1 · DAY 1 · INDONESIA"
        if (meta || subtitle) {
            ctx.font = 'bold 22px Arial, sans-serif';
            ctx.textAlign = 'left';

            if (meta && subtitle) {
                const metaText = meta.toUpperCase();
                const dotText = ' · ';
                const countryText = subtitle.toUpperCase();

                // Draw meta + dot in gray
                ctx.fillStyle = '#666666';
                const metaFull = metaText + dotText;
                ctx.fillText(metaFull, innerMargin, yPos + 10);

                // Measure to position country text immediately after, in red
                const metaWidth = ctx.measureText(metaFull).width;
                ctx.fillStyle = accentColor;
                ctx.fillText(countryText, innerMargin + metaWidth, yPos + 10);
            } else {
                const headerLine = (meta || subtitle.toUpperCase());
                ctx.fillStyle = subtitle && !meta ? accentColor : '#666666';
                ctx.fillText(headerLine.toUpperCase(), innerMargin, yPos + 10);
            }

            // Extra space after header line before the big title
            yPos += 90;
        }

        // Title (large, left-aligned, wrapped)
        if (title) {
            // Slightly smaller title for tighter feel (also visually reduces kerning)
            ctx.font = 'bold 56px Arial, sans-serif';
            ctx.fillStyle = '#111111';
            const words = title.split(' ');
            let line = '';
            const lineHeight = 64;
            for (let i = 0; i < words.length; i++) {
                const testLine = line + words[i] + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > innerWidth && i > 0) {
                    ctx.fillText(line.trim(), innerMargin, yPos);
                    line = words[i] + ' ';
                    yPos += lineHeight;
                } else {
                    line = testLine;
                }
            }
            if (line) {
                ctx.fillText(line.trim(), innerMargin, yPos);
                // Reduced gap after title for tighter layout
                yPos += lineHeight - 10;
            }
        }

        // Compute word frequencies from text
        const normalize = (w) =>
            w.toLowerCase().replace(/[.,!?;:()"'\-]/g, '').trim();

        const rawWords = text.split(/\s+/).map(normalize).filter(Boolean);

        const freqMap = new Map();
        rawWords.forEach((w) => {
            freqMap.set(w, (freqMap.get(w) || 0) + 1);
        });

        // Sort by frequency (desc) then alphabetically
        const entries = Array.from(freqMap.entries())
            .sort((a, b) => {
                if (b[1] === a[1]) return a[0].localeCompare(b[0]);
                return b[1] - a[1];
            })
            .slice(0, 70); // keep top N words for a dense but readable cloud

        if (entries.length === 0) {
            if (onPosterReady) onPosterReady(canvas);
            return;
        }

        const counts = entries.map(([, c]) => c);
        const minCount = Math.min(...counts);
        const maxCount = Math.max(...counts);

        // Font sizes for word cloud (reduced by 5%)
        const minFont = 25;
        const maxFont = 190; // make frequent words significantly larger

        const scaleFont = (count) => {
            if (maxCount === minCount) return (minFont + maxFont) / 2;
            const ratio = (count - minCount) / (maxCount - minCount);
            return minFont + ratio * (maxFont - minFont);
        };

        // Layout area for word cloud
        // Expand cloud area to make it more prominent and position higher
        const cloudHeightCalc = cardY + cardHeight - 210 - yPos;
        const cloudTop = yPos - (cloudHeightCalc * 0.10); // Move cloud 10% higher for better balance
        const cloudHeight = cardY + cardHeight - 210 - cloudTop; // optimized reserved space below
        const cloudLeft = innerMargin;
        const cloudWidth = innerWidth;

        // Draw a subtle grid background to enhance Swiss feel
        ctx.save();
        ctx.strokeStyle = 'rgba(0,0,0,0.03)';
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = cloudLeft; x <= cloudLeft + cloudWidth; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, cloudTop);
            ctx.lineTo(x, cloudTop + cloudHeight);
            ctx.stroke();
        }
        for (let y = cloudTop; y <= cloudTop + cloudHeight; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(cloudLeft, y);
            ctx.lineTo(cloudLeft + cloudWidth, y);
            ctx.stroke();
        }
        ctx.restore();

        // Word cloud-style layout inside the cloud area
        // Inspired by wordle-style posters: bigger words near center, smaller around.
        const placedRects = [];

        const doesOverlap = (rect) => {
            return placedRects.some(r =>
                rect.x < r.x + r.width &&
                rect.x + rect.width > r.x &&
                rect.y < r.y + r.height &&
                rect.y + rect.height > r.y
            );
        };

        const centerX = cloudLeft + cloudWidth / 2;
        const centerY = cloudTop + cloudHeight / 2;
        const cloudRadius = Math.min(cloudWidth, cloudHeight) * 0.456; // cloud radius reduced by 5%

        entries.forEach(([word, count], index) => {
            const fontSize = scaleFont(count);
            ctx.font = `bold ${fontSize}px Arial, sans-serif`;
            const textWidth = ctx.measureText(word).width;
            const textHeight = fontSize * 1.1;

            // Try to place on an outward spiral from center
            let angle = Math.random() * Math.PI * 2;
            // Higher frequency => start closer to the center
            const norm = maxCount === minCount ? 1 : (count - minCount) / (maxCount - minCount);
            let radius = (1 - norm) * 40; // frequent words almost at center, rare ones start further
            // Limit spiral to circular cloud radius
            const maxRadius = cloudRadius;
            let placed = false;

            for (let attempt = 0; attempt < 900 && radius < maxRadius; attempt++) {
                const x = centerX + radius * Math.cos(angle) - textWidth / 2;
                const y = centerY + radius * Math.sin(angle) + textHeight / 2;

                const rect = {
                    x,
                    y: y - textHeight,
                    width: textWidth,
                    height: textHeight
                };

                const withinBounds =
                    rect.x >= cloudLeft &&
                    rect.x + rect.width <= cloudLeft + cloudWidth &&
                    rect.y >= cloudTop &&
                    rect.y + rect.height <= cloudTop + cloudHeight;

                // Enforce circular cloud: center of rect must be inside cloudRadius
                const rectCenterX = rect.x + rect.width / 2;
                const rectCenterY = rect.y + rect.height / 2;
                const distFromCenter = Math.hypot(rectCenterX - centerX, rectCenterY - centerY);
                const insideCircle = distFromCenter + Math.max(rect.width, rect.height) / 2 <= cloudRadius;

                if (withinBounds && insideCircle && !doesOverlap(rect)) {
                    // Draw word
                    ctx.fillStyle = index === 0 ? accentColor : '#111111';
                    ctx.fillText(word, rect.x, rect.y + textHeight * 0.8);

                    placedRects.push(rect);
                    placed = true;
                    break;
                }

                angle += Math.PI / 18;
                radius += 3;
            }

            // If couldn't place nicely, skip this word
            if (!placed) return;
        });

        // --- Progress stats and QR (bottom band above footer) ---
        const footerY = cardY + cardHeight - 80;
        // Move stats block a bit higher to create more breathing room above the footer
        const statsTop = footerY - 130;

        const safeStats = statistics || {};
        const safeProgress = progress || {};
        const totalWordsRead = safeStats.totalWordsRead || 0;
        const totalTime = safeStats.totalTimePracticed || 0;
        const currentStreak = safeProgress.currentStreak || 0;

        const formatMinutes = (seconds) => {
            const minutes = Math.floor((seconds || 0) / 60);
            return `${minutes}m`;
        };

        // \"My Progress\" header
        ctx.textAlign = 'left';
        ctx.font = 'bold 16px Arial, sans-serif';
        ctx.fillStyle = '#777777';
        ctx.fillText('MY PROGRESS', innerMargin, statsTop);

        // Three-column stats layout with QR code on right
        const rowY = statsTop + 40;
        const col1X = innerMargin;
        const col2X = innerMargin + innerWidth / 3.2;
        const col3X = innerMargin + (innerWidth / 3.2) * 2;

        // Column 1: Words Read
        ctx.font = 'bold 28px Arial, sans-serif';
        ctx.fillStyle = accentColor;
        ctx.fillText(totalWordsRead.toLocaleString(), col1X, rowY);

        ctx.font = 'bold 11px Arial, sans-serif';
        ctx.fillStyle = '#777777';
        ctx.fillText('WORDS READ', col1X, rowY + 18);

        // Column 2: Time Practiced
        ctx.font = 'bold 28px Arial, sans-serif';
        ctx.fillStyle = accentColor;
        ctx.fillText(formatMinutes(totalTime), col2X, rowY);

        ctx.font = 'bold 11px Arial, sans-serif';
        ctx.fillStyle = '#777777';
        ctx.fillText('TIME PRACTICED', col2X, rowY + 18);

        // Column 3: Current Streak
        ctx.font = 'bold 28px Arial, sans-serif';
        ctx.fillStyle = accentColor;
        ctx.fillText(`${currentStreak} DAYS`, col3X, rowY);

        ctx.font = 'bold 11px Arial, sans-serif';
        ctx.fillStyle = '#777777';
        ctx.fillText('CURRENT STREAK', col3X, rowY + 18);

        // QR Code section (compact, on the right)
        const shareLink = generateShareLink(month, day);
        const qrCodeSize = 72; // Reduced by 30% total for very compact appearance
        const qrCodeX = cardX + cardWidth - 60 - qrCodeSize;
        const qrCodeY = statsTop + 4; // Moved up slightly for better alignment

        // Generate QR code using API
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrCodeSize}x${qrCodeSize}&data=${encodeURIComponent(shareLink)}&bgcolor=FFFFFF&color=000000&margin=1`;

        const qrImage = new Image();
        qrImage.crossOrigin = 'anonymous';
        qrImage.onload = () => {
            // Draw subtle border
            ctx.strokeStyle = '#E0E0E0';
            ctx.lineWidth = 1;
            ctx.strokeRect(qrCodeX - 1, qrCodeY - 1, qrCodeSize + 2, qrCodeSize + 2);

            // Draw QR code
            ctx.drawImage(qrImage, qrCodeX, qrCodeY, qrCodeSize, qrCodeSize);

            if (onPosterReady) {
                onPosterReady(canvas);
            }
        };
        qrImage.onerror = () => {
            // If QR code fails to load, still call onPosterReady
            if (onPosterReady) {
                onPosterReady(canvas);
            }
        };
        qrImage.src = qrApiUrl;

        // Footer band
        ctx.fillStyle = accentColor;
        ctx.textAlign = 'left';
        // Thin accent line positioned just above footer label
        ctx.fillRect(innerMargin, footerY - 34, 80, 6);

        ctx.font = 'bold 22px Arial, sans-serif';
        ctx.fillStyle = '#222222';
        ctx.fillText(footerLabel, innerMargin, footerY);

        // Footer text at the bottom right
        ctx.font = 'normal 18px Arial, sans-serif';
        ctx.fillStyle = '#777777';
        ctx.textAlign = 'right';
        ctx.fillText(footerText, cardX + cardWidth - 60, footerY);

    }, [width, height, title, subtitle, meta, text, accentColor, backgroundColor, footerLabel, footerText, month, day, statistics, progress, onPosterReady]);

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `poster-${Date.now()}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.click();
    };

    return (
        <div style={{ width: '100%', maxWidth: `${width}px` }}>
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    borderRadius: '1rem',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.12)'
                }}
            />
            <div className="mt-3 flex justify-end">
                <button
                    type="button"
                    onClick={handleDownload}
                    className="px-3 py-1.5 text-xs font-semibold rounded-md bg-[#880000] text-white hover:bg-[#770000] transition-colors shadow-sm"
                >
                    Download Poster (JPG)
                </button>
            </div>
        </div>
    );
};

export default WordPoster;


