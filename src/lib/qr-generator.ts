'use client';

import QRCodeStyling from 'qr-code-styling';

const STYLE_MAP: Record<string, string> = {
  classic: 'square',
  rounded: 'rounded',
  dots: 'dots',
  classy: 'classy-rounded',
};

export interface QrGeneratorOptions {
  data: string;
  size?: number;
  logoUrl?: string;
  fgColor?: string;
  bgColor?: string;
  style?: 'rounded' | 'dots' | 'classy' | 'classic';
}

export async function generateQrCode(options: QrGeneratorOptions): Promise<string> {
  const {
    data,
    size = 300,
    logoUrl,
    fgColor = '#1e1b4b',
    bgColor = '#ffffff',
    style = 'classic',
  } = options;

  const qrCode = new QRCodeStyling({
    width: size,
    height: size,
    data,
    margin: 10,
    type: 'canvas',
    dotsOptions: {
      type: (STYLE_MAP[style] || 'square') as 'square' | 'rounded' | 'dots' | 'classy-rounded' | 'extra-rounded',
      color: fgColor,
    },
    backgroundOptions: {
      color: bgColor,
    },
    imageOptions: {
      crossOrigin: 'anonymous',
      margin: 6,
      imageSize: 0.35,
      hideBackgroundDots: true,
    },
    ...(logoUrl ? { image: logoUrl } : {}),
  });

  const blob = await qrCode.getRawData('png');
  if (!blob) throw new Error('Failed to generate QR code');
  return URL.createObjectURL(blob);
}
