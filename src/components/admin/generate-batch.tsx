'use client';

import { useState, useRef, useEffect, useCallback, createElement } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  QrCode,
  Download,
  Sparkles,
  Palette,
  Layout,
  ImageIcon,
  Loader2,
  Check,
  Package,
  RefreshCw,
  Home,
  Wifi,
  List,
  Bell,
  ShieldCheck,
} from 'lucide-react';
import { generateUniqueCodes } from '@/lib/activation-code';
import { downloadPdf, type QrCodeForPdf } from '@/lib/pdf-export';
import { QRCodeSVG } from 'qrcode.react';
import { createRoot } from 'react-dom/client';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DesignConfig {
  dotsColor: string;
  backgroundColor: string;
  dotsType: string;
  cornersSquareType: string;
  cornersDotType: string;
  errorCorrectionLevel: string;
  logoPreset: string;
}

const DOT_TYPES = [
  { value: 'rounded', label: 'Arrondi' },
  { value: 'dots', label: 'Points' },
  { value: 'classy', label: 'Classique' },
  { value: 'classy-rounded', label: 'Classique arrondi' },
  { value: 'square', label: 'Carré' },
  { value: 'extra-rounded', label: 'Extra arrondi' },
];

const CORNER_SQUARE_TYPES = [
  { value: 'square', label: 'Carré' },
  { value: 'extra-rounded', label: 'Extra arrondi' },
];

const CORNER_DOT_TYPES = [
  { value: 'square', label: 'Carré' },
  { value: 'dot', label: 'Rond' },
];

const ERROR_LEVELS = [
  { value: 'L', label: 'L (7%)' },
  { value: 'M', label: 'M (15%)' },
  { value: 'Q', label: 'Q (25%)' },
  { value: 'H', label: 'H (30%)' },
];

const LOGO_PRESETS = [
  { value: '', label: 'Aucun', icon: 'none' },
  { value: 'wifi', label: 'Wi-Fi', icon: 'wifi' },
  { value: 'home', label: 'Maison', icon: 'home' },
  { value: 'list', label: 'Liste', icon: 'list' },
  { value: 'bell', label: 'Portier', icon: 'bell' },
  { value: 'shield', label: 'Urgence', icon: 'shield' },
];

const BATCH_TEMPLATES: Record<string, { label: string; description: string; quantity: number; design: Partial<DesignConfig> }> = {
  airbnb: {
    label: 'Pack Airbnb',
    description: '10 QR codes parfaits pour les hôtes Airbnb',
    quantity: 10,
    design: { dotsColor: '#FF5A5F', backgroundColor: '#FFFFFF', dotsType: 'rounded', cornersSquareType: 'extra-rounded', cornersDotType: 'dot', logoPreset: 'home' },
  },
  famille: {
    label: 'Pack Famille',
    description: '15 QR codes pour organiser la vie de famille',
    quantity: 15,
    design: { dotsColor: '#10B981', backgroundColor: '#F0FDF4', dotsType: 'dots', cornersSquareType: 'square', cornersDotType: 'dot', logoPreset: 'home' },
  },
  bureau: {
    label: 'Pack Bureau',
    description: '10 QR codes professionnels pour le bureau',
    quantity: 10,
    design: { dotsColor: '#1E293B', backgroundColor: '#FFFFFF', dotsType: 'classy', cornersSquareType: 'extra-rounded', cornersDotType: 'square', logoPreset: 'wifi' },
  },
};

const DEFAULT_DESIGN: DesignConfig = {
  dotsColor: '#10B981',
  backgroundColor: '#FFFFFF',
  dotsType: 'rounded',
  cornersSquareType: 'extra-rounded',
  cornersDotType: 'dot',
  errorCorrectionLevel: 'M',
  logoPreset: '',
};

/* ------------------------------------------------------------------ */
/*  SVG → PNG conversion utility (browser-only, zero native deps)       */
/* ------------------------------------------------------------------ */

/** Convert an inline SVG element to a PNG data-URL */
function svgElementToPngDataUrl(svgEl: SVGSVGElement, size: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const svgData = new XMLSerializer().serializeToString(svgEl);
    // Use data URL instead of blob — more reliable for Image loading
    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('No 2d context')); return; }
      ctx.drawImage(img, 0, 0, size, size);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('SVG image load failed'));
    img.src = svgUrl;
  });
}

/**
 * Fallback QR PNG generator using qrcode.react (pure JS, no native deps).
 * Renders QRCodeSVG into a hidden container, extracts the SVG, converts to PNG.
 */
async function generateFallbackQrPng(
  data: string,
  size: number,
  fgColor: string,
  bgColor: string,
  level: string,
): Promise<string> {
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(
    createElement(QRCodeSVG, {
      value: data,
      size,
      bgColor,
      fgColor,
      level: level as 'L' | 'M' | 'Q' | 'H',
    }),
  );

  // Wait for React to commit the render
  await new Promise((r) => setTimeout(r, 150));

  const svgEl = container.querySelector('svg');
  if (!svgEl) {
    root.unmount();
    document.body.removeChild(container);
    throw new Error('Fallback: SVG element not rendered');
  }

  // Ensure the SVG has xmlns for proper PNG conversion
  if (!svgEl.getAttribute('xmlns')) {
    svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }

  const pngUrl = await svgElementToPngDataUrl(svgEl, size);
  root.unmount();
  document.body.removeChild(container);
  return pngUrl;
}

/* ------------------------------------------------------------------ */
/*  SVG Logo presets (as data URIs)                                    */
/* ------------------------------------------------------------------ */

function getPresetLogoDataUrl(preset: string): string {
  const svgs: Record<string, string> = {
    wifi: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/></svg>`,
    home: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    list: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>`,
    bell: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`,
    shield: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>`,
  };
  const svg = svgs[preset];
  if (!svg) return '';
  return `data:image/svg+xml;base64,${typeof btoa !== 'undefined' ? btoa(svg) : Buffer.from(svg).toString('base64')}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
function GeneratedQrGrid({ codes, design }: { codes: string[]; design: DesignConfig }) {
  const qrLevel = (['L','M','Q','H'] as const).includes(design.errorCorrectionLevel as any)
    ? (design.errorCorrectionLevel as 'L' | 'M' | 'Q' | 'H')
    : 'M';
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-4 w-4" />
          QR codes générés ({codes.length})
        </CardTitle>
        <CardDescription>Scannez ou téléchargez vos QR codes en PDF.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[500px] overflow-y-auto">
          {codes.map((code) => (
            <div key={code} className="flex flex-col items-center gap-2 rounded-lg border bg-white p-3" style={{ backgroundColor: design.backgroundColor }}>
              <QRCodeSVG value={"https://qrdomotik.com/activate/" + code} size={120} bgColor={design.backgroundColor} fgColor={design.dotsColor} level={qrLevel} />
              <span className="font-mono text-[10px] font-semibold text-center break-all leading-tight">{code}</span>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { navigator.clipboard.writeText(code); toast.success("Code " + code + " copié !"); }}>Copier</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function GenerateBatch() {
  /* ---- state ---- */
  const [quantity, setQuantity] = useState(10);
  const [design, setDesign] = useState<DesignConfig>(DEFAULT_DESIGN);
  const [batchName, setBatchName] = useState('');
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);

  /* ---- refs ---- */
  const previewRef = useRef<HTMLDivElement>(null);
  const qrInstanceRef = useRef<any>(null);
  const fallbackRef = useRef(false);

  /* ---- state ---- */
  const [showFallback, setShowFallback] = useState(false);

  /* ---- QR preview ---- */
  const updateQrPreview = useCallback(async () => {
    if (fallbackRef.current || !previewRef.current) return;
    try {
      const QRCodeStyling = (await import('qr-code-styling')).default;

      const opts: any = {
        width: 280,
        height: 280,
        type: 'svg',
        data: 'https://qrdomotik.com/activate/QR-XXXXXXXX',
        dotsOptions: {
          color: design.dotsColor,
          type: design.dotsType,
        },
        backgroundOptions: {
          color: design.backgroundColor,
        },
        cornersSquareOptions: {
          color: design.dotsColor,
          type: design.cornersSquareType,
        },
        cornersDotOptions: {
          color: design.dotsColor,
          type: design.cornersDotType,
        },
        qrOptions: {
          errorCorrectionLevel: design.errorCorrectionLevel,
        },
        imageOptions: {
          crossOrigin: 'anonymous',
          margin: 8,
          imageSize: 0.35,
        },
      };

      if (design.logoPreset) {
        opts.image = getPresetLogoDataUrl(design.logoPreset);
      }

      if (qrInstanceRef.current) {
        qrInstanceRef.current.update(opts);
      } else {
        previewRef.current.innerHTML = '';
        const instance = new QRCodeStyling(opts);
        instance.append(previewRef.current);
        qrInstanceRef.current = instance;
      }
    } catch (err) {
      console.error('QR preview error — switching to SVG fallback:', err);
      fallbackRef.current = true;
      setShowFallback(true);
      if (previewRef.current) previewRef.current.innerHTML = '';
      qrInstanceRef.current = null;
    }
  }, [design]);

  useEffect(() => {
    const timer = setTimeout(updateQrPreview, 100);
    return () => clearTimeout(timer);
  }, [updateQrPreview]);

  /* ---- template ---- */
  const applyTemplate = (key: string) => {
    const tpl = BATCH_TEMPLATES[key];
    if (!tpl) return;
    setQuantity(tpl.quantity);
    setDesign((prev) => ({ ...prev, ...tpl.design }));
    setActiveTemplate(key);
    qrInstanceRef.current = null;
    toast.success(`Template « ${tpl.label} » appliqué`);
  };

  const resetTemplate = () => {
    setActiveTemplate(null);
    setQuantity(10);
    setDesign(DEFAULT_DESIGN);
    qrInstanceRef.current = null;
  };

  /* ---- generate batch ---- */
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const codes = generateUniqueCodes(quantity);
      const designConfig = JSON.stringify(design);

      const res = await fetch('/api/admin/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity,
          designConfig,
          batchName: batchName || undefined,
          activationCodes: codes,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur lors de la génération');
      }

      const data = await res.json();
      setGeneratedCodes(codes);
      setBatchId(data.id || null);
      toast.success(`${quantity} QR codes générés avec succès !`);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  };

  /* ---- export PDF ---- */
  const handleExportPdf = async () => {
    if (generatedCodes.length === 0) return;
    setIsExporting(true);
    try {
      const qrCodes: QrCodeForPdf[] = [];

      for (const code of generatedCodes) {
        const data = `https://qrdomotik.com/activate/${code}`;
        const imageUrl = await generateFallbackQrPng(
          data, 400, design.dotsColor, design.backgroundColor, design.errorCorrectionLevel,
        );
        qrCodes.push({ code, imageUrl });
      }

      await downloadPdf({
        qrCodes,
        format: 'a4',
        batchName: batchName || `Lot ${batchId?.slice(0, 8)}`,
      });

      toast.success('PDF téléchargé !');
    } catch (err: any) {
      toast.error("Erreur lors de l'export PDF");
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  /* ---- design updaters ---- */
  const updateDesign = (partial: Partial<DesignConfig>) => {
    setDesign((prev) => ({ ...prev, ...partial }));
    qrInstanceRef.current = null;
  };

  const presetIcon = (icon: string) => {
    switch (icon) {
      case 'wifi': return <Wifi className="h-4 w-4" />;
      case 'home': return <Home className="h-4 w-4" />;
      case 'list': return <List className="h-4 w-4" />;
      case 'bell': return <Bell className="h-4 w-4" />;
      case 'shield': return <ShieldCheck className="h-4 w-4" />;
      default: return <ImageIcon className="h-4 w-4" />;
    }
  };

  /* ================================================================ */
  /*  RENDER                                                            */
  /* ================================================================ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Générer un lot de QR codes</h2>
        <p className="text-muted-foreground">
          Créez un lot de QR codes physiques avec un design personnalisé, puis exportez-les en PDF pour l'impression.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ====== LEFT: FORM ====== */}
        <div className="lg:col-span-3 space-y-6">
          {/* Templates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Templates prêts à l'emploi
              </CardTitle>
              <CardDescription>Choisissez un template pour pré-remplir la configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(BATCH_TEMPLATES).map(([key, tpl]) => (
                  <button
                    key={key}
                    onClick={() => applyTemplate(key)}
                    className={`relative flex flex-col items-start gap-1 rounded-lg border-2 p-4 text-left transition-all hover:shadow-md ${
                      activeTemplate === key
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    {activeTemplate === key && (
                      <div className="absolute top-2 right-2">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <span className="font-semibold text-sm">{tpl.label}</span>
                    <span className="text-xs text-muted-foreground">{tpl.description}</span>
                    <Badge variant="secondary" className="mt-1 w-fit text-xs">
                      {tpl.quantity} codes
                    </Badge>
                  </button>
                ))}
              </div>
              {activeTemplate && (
                <Button variant="ghost" size="sm" className="mt-3" onClick={resetTemplate}>
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Réinitialiser
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Configuration Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Layout className="h-4 w-4" />
                Configuration du lot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantité</Label>
                  <Select value={String(quantity)} onValueChange={(v) => setQuantity(Number(v))}>
                    <SelectTrigger id="quantity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 QR codes</SelectItem>
                      <SelectItem value="15">15 QR codes</SelectItem>
                      <SelectItem value="20">20 QR codes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batchName">Nom du lot (optionnel)</Label>
                  <Input
                    id="batchName"
                    placeholder="ex: Pack Dakar Jan 2026"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Design Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="h-4 w-4" />
                Design du QR Code
              </CardTitle>
              <CardDescription>Personnalisez l'apparence de vos QR codes</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="style" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="style">Style & Couleurs</TabsTrigger>
                  <TabsTrigger value="logo">Logo central</TabsTrigger>
                </TabsList>

                <TabsContent value="style" className="space-y-5 mt-4">
                  {/* Colors */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Couleur des points</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={design.dotsColor}
                          onChange={(e) => updateDesign({ dotsColor: e.target.value })}
                          className="h-10 w-14 cursor-pointer rounded-md border border-input bg-transparent"
                        />
                        <Input
                          value={design.dotsColor}
                          onChange={(e) => updateDesign({ dotsColor: e.target.value })}
                          className="font-mono text-sm"
                          maxLength={7}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Couleur de fond</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={design.backgroundColor}
                          onChange={(e) => updateDesign({ backgroundColor: e.target.value })}
                          className="h-10 w-14 cursor-pointer rounded-md border border-input bg-transparent"
                        />
                        <Input
                          value={design.backgroundColor}
                          onChange={(e) => updateDesign({ backgroundColor: e.target.value })}
                          className="font-mono text-sm"
                          maxLength={7}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Dot style */}
                  <div className="space-y-2">
                    <Label>Style des points</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {DOT_TYPES.map((t) => (
                        <button
                          key={t.value}
                          onClick={() => updateDesign({ dotsType: t.value })}
                          className={`rounded-md border-2 px-3 py-2 text-xs font-medium transition-all ${
                            design.dotsType === t.value
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-primary/40'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Corner styles */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Style des coins</Label>
                      <Select
                        value={design.cornersSquareType}
                        onValueChange={(v) => updateDesign({ cornersSquareType: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CORNER_SQUARE_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Style points de coin</Label>
                      <Select
                        value={design.cornersDotType}
                        onValueChange={(v) => updateDesign({ cornersDotType: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CORNER_DOT_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Error correction */}
                  <div className="space-y-2">
                    <Label>Correction d'erreur</Label>
                    <Select
                      value={design.errorCorrectionLevel}
                      onValueChange={(v) => updateDesign({ errorCorrectionLevel: v })}
                    >
                      <SelectTrigger className="w-full sm:w-1/2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ERROR_LEVELS.map((l) => (
                          <SelectItem key={l.value} value={l.value}>
                            {l.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="logo" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {LOGO_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => updateDesign({ logoPreset: preset.value })}
                        className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 transition-all ${
                          design.logoPreset === preset.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/40'
                        }`}
                      >
                        {presetIcon(preset.icon)}
                        <span className="text-sm font-medium">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Le logo sera affiché au centre du QR code. Utilisez un niveau de correction H pour un meilleur résultat avec logo.
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              className="flex-1"
              onClick={handleGenerate}
              disabled={isGenerating || generatedCodes.length > 0}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération en cours...
                </>
              ) : generatedCodes.length > 0 ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Lot généré ({generatedCodes.length} codes)
                </>
              ) : (
                <>
                  <QrCode className="mr-2 h-4 w-4" />
                  Générer {quantity} QR codes
                </>
              )}
            </Button>

            {generatedCodes.length > 0 && (
              <>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleExportPdf}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Télécharger PDF (A4)
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={() => {
                    setGeneratedCodes([]);
                    setBatchId(null);
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Nouveau lot
                </Button>
              </>
            )}
          </div>

          {generatedCodes.length > 0 && <GeneratedQrGrid codes={generatedCodes} design={design} />}
        </div>

        {/* ====== RIGHT: QR PREVIEW ====== */}
        <div className="lg:col-span-2">
          <Card className="sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <QrCode className="h-4 w-4" />
                Aperçu en temps réel
              </CardTitle>
              <CardDescription>
                Le QR code se met à jour automatiquement avec vos réglages.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                {/* QR Preview Container */}
                <div
                  className="rounded-xl border-2 border-dashed border-muted-foreground/20 bg-white p-4"
                  style={{ backgroundColor: design.backgroundColor }}
                >
                  <div
                    ref={previewRef}
                    className="flex items-center justify-center"
                    style={{ width: 280, height: 280 }}
                  >
                    {showFallback && (
                      <QRCodeSVG
                        value="https://qrdomotik.com/activate/QR-XXXXXXXX"
                        size={280}
                        bgColor={design.backgroundColor}
                        fgColor={design.dotsColor}
                        level={design.errorCorrectionLevel as 'L' | 'M' | 'Q' | 'H'}
                      />
                    )}
                  </div>
                </div>

                {/* Design Summary */}
                <div className="w-full space-y-2 rounded-lg bg-muted/50 p-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Points</span>
                    <span className="font-medium">{DOT_TYPES.find((t) => t.value === design.dotsType)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Coins</span>
                    <span className="font-medium">{CORNER_SQUARE_TYPES.find((t) => t.value === design.cornersSquareType)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Correction</span>
                    <span className="font-medium">{design.errorCorrectionLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Logo</span>
                    <span className="font-medium">{LOGO_PRESETS.find((p) => p.value === design.logoPreset)?.label || 'Aucun'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}