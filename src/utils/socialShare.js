// Social sharing utilities

const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
};

export const generateShareLink = (month, day) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/m${month}-day${day}`;
};

export const shareToSocial = async (month, day, statistics, progress, activeData) => {
    const shareLink = generateShareLink(month, day);
    const shareTextWithoutLink = `Today I learned about ${activeData?.country || 'a new place'}! 📚\n\n` +
        `Read: "${activeData?.title || 'English Reading Practice'}"\n\n` +
        `My Progress:\n` +
        `📖 ${statistics?.totalWordsRead || 0} words read\n` +
        `⏱️ ${formatTime(statistics?.totalTimePracticed || 0)} practiced\n` +
        `🔥 ${progress?.currentStreak || 0} day streak`;
    
    // For clipboard (fallback), include the link in text
    const shareTextWithLink = `${shareTextWithoutLink}\n\nPractice with me: ${shareLink}`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'English Reading Practice',
                text: shareTextWithoutLink,
                url: shareLink
            });
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error sharing:', error);
                copyToClipboard(shareTextWithLink);
            }
        }
    } else {
        copyToClipboard(shareTextWithLink);
    }
};

export const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        } catch (err) {
            document.body.removeChild(textArea);
            return false;
        }
    }
};

export const generateShareImage = async (month, day, statistics, progress, activeData) => {
    const canvas = document.createElement('canvas');
    // 4:5 aspect ratio like Save Image
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');

    // Background - light gray like Save Image
    ctx.fillStyle = '#F2F2F2';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const margin = 80;
    const accentColor = '#880000';
    
    // White card
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(margin, margin, canvas.width - margin * 2, canvas.height - margin * 2);

    const innerMargin = margin + 60;
    const innerWidth = canvas.width - innerMargin * 2;

    // Header section
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillStyle = '#666666';
    ctx.textAlign = 'left';
    ctx.fillText('30 DAY READING CHALLENGE', innerMargin, innerMargin + 40);
    ctx.fillText(`MONTH ${month}`, innerMargin, innerMargin + 80);

    // Large day number - Swiss design
    ctx.font = 'bold 200px Arial, sans-serif';
    ctx.fillStyle = accentColor;
    ctx.textAlign = 'right';
    ctx.fillText(`${day < 10 ? '0' : ''}${day}`, canvas.width - innerMargin, innerMargin + 140);
    ctx.textAlign = 'left';

    // Country and title
    let yPos = innerMargin + 250;
    ctx.font = 'bold 30px Arial, sans-serif';
    ctx.fillStyle = accentColor;
    ctx.fillText((activeData?.country || 'UNKNOWN').toUpperCase(), innerMargin, yPos);
    
    yPos += 80;
    ctx.font = 'bold 70px Arial, sans-serif';
    ctx.fillStyle = '#000000';
    const titleWords = (activeData?.title || 'Reading Practice').split(' ');
    let currentLine = '';
    let lineHeight = 80;
    
    for (let i = 0; i < titleWords.length; i++) {
        const testLine = currentLine + titleWords[i] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > innerWidth && i > 0) {
            ctx.fillText(currentLine.trim(), innerMargin, yPos);
            yPos += lineHeight;
            currentLine = titleWords[i] + ' ';
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) {
        ctx.fillText(currentLine.trim(), innerMargin, yPos);
        yPos += lineHeight + 40;
    }

    // Statistics section - Swiss design
    yPos += 60;
    const progressYPos = yPos;
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillStyle = '#666666';
    ctx.fillText('MY PROGRESS', innerMargin, yPos);
    
    yPos += 100;
    const stats = [
        { label: 'WORDS READ', value: (statistics?.totalWordsRead || 0).toLocaleString() },
        { label: 'TIME PRACTICED', value: formatTime(statistics?.totalTimePracticed || 0) },
        { label: 'CURRENT STREAK', value: `${progress?.currentStreak || 0} DAYS` }
    ];

    stats.forEach((stat, index) => {
        ctx.font = 'bold 60px Arial, sans-serif';
        ctx.fillStyle = accentColor;
        ctx.fillText(stat.value, innerMargin, yPos);
        
        ctx.font = 'bold 20px Arial, sans-serif';
        ctx.fillStyle = '#666666';
        ctx.fillText(stat.label, innerMargin, yPos + 40);
        
        yPos += 120;
    });

    // Generate QR code using simple canvas approach
    const shareLink = generateShareLink(month, day);
    const qrCodeSize = 200;
    const qrCodeX = canvas.width - innerMargin - qrCodeSize;
    const qrCodeY = progressYPos;
    
    try {
        // Use QR code API service (simple and reliable)
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrCodeSize}x${qrCodeSize}&data=${encodeURIComponent(shareLink)}&bgcolor=FFFFFF&color=000000&margin=2`;
        
        const qrImage = new Image();
        qrImage.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
            qrImage.onload = resolve;
            qrImage.onerror = reject;
            qrImage.src = qrApiUrl;
        });
        
        // Draw white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(qrCodeX - 10, qrCodeY - 10, qrCodeSize + 20, qrCodeSize + 20);
        
        // Draw QR code
        ctx.drawImage(qrImage, qrCodeX, qrCodeY, qrCodeSize, qrCodeSize);
    } catch (error) {
        console.error('Error generating QR code:', error);
    }

    // Footer - adjusted positioning to avoid overlap
    const footerY = canvas.height - margin - 60;
    
    // Accent line - positioned above the footer text with proper spacing
    ctx.fillStyle = accentColor;
    ctx.fillRect(innerMargin, footerY - 50, 60, 6);

    // Footer text
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillStyle = accentColor;
    ctx.textAlign = 'left';
    ctx.fillText('ENGLISH FLUENCY JOURNEY', innerMargin, footerY - 20);
    
    ctx.font = 'normal 18px Arial, sans-serif';
    ctx.fillStyle = '#666666';
    ctx.fillText(shareLink, innerMargin, footerY + 10);
    
    ctx.font = 'normal 24px Arial, sans-serif';
    ctx.fillStyle = '#666666';
    ctx.textAlign = 'right';
    ctx.fillText('By Zayn', canvas.width - innerMargin, footerY - 10);

    return canvas.toDataURL('image/png');
};

