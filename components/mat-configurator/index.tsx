"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ColorPalette } from "./color-palette"
import { MatCanvas } from "./mat-canvas"
import { LogoUploader } from "./logo-uploader"
import { PriceCalculator } from "./price-calculator"
import { RenderPreview } from "./render-preview"
import { STANDARD_SIZES, type MatConfig, MAT_COLORS } from "@/lib/mat-config"
import { Layers, Palette, Image as ImageIcon, ShoppingCart, RotateCcw, Plus, Minus } from "lucide-react"

const DEFAULT_CONFIG: MatConfig = {
  type: "indoor",
  placement: "floor",
  orientation: "landscape",
  rubberBorder: true,
  size: {
    width: 85,
    height: 115,
    isCustom: false,
  },
  colorCode: "C1",
  logo: {
    file: null,
    dataUrl: null,
    position: { x: 0.5, y: 0.5 },
    scale: 1,
    rotation: 0,
  },
  quantity: 1,
  logoColors: 1,
}

type IndoorSubtype = "normal" | "eco" | "luxe" | "budget"
type OutdoorSubtype = "outdoor1" | "outdoor2" | "outdoor3" | "outdoor4"
type VisibleTypeBlock = "indoor" | "outdoor" | null

export function MatConfigurator() {
  const [config, setConfig] = useState<MatConfig>(DEFAULT_CONFIG)
  const [activeTab, setActiveTab] = useState("mat")
  const [suggestedColorCodes, setSuggestedColorCodes] = useState<string[]>([])
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null)

  const [indoorSubtype, setIndoorSubtype] = useState<IndoorSubtype>("normal")
  const [outdoorSubtype, setOutdoorSubtype] = useState<OutdoorSubtype>("outdoor1")
  const [visibleTypeBlock, setVisibleTypeBlock] = useState<VisibleTypeBlock>(null)

  useEffect(() => {
    if (config.logo.dataUrl) {
      const img = new window.Image()
      img.crossOrigin = "anonymous"
      img.onload = () => setLogoImage(img)
      img.src = config.logo.dataUrl
    } else {
      setLogoImage(null)
    }
  }, [config.logo.dataUrl])

  const updateConfig = useCallback((updates: Partial<MatConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }))
  }, [])

  const handleMatTypeChange = useCallback(
    (type: "indoor" | "outdoor") => {
      updateConfig({ type })
      setVisibleTypeBlock(type)

      if (type === "indoor") {
        setIndoorSubtype("normal")
      }

      if (type === "outdoor") {
        setOutdoorSubtype("outdoor1")
      }
    },
    [updateConfig]
  )

  const handleLogoUpload = useCallback(
    (file: File, dataUrl: string) => {
      setSuggestedColorCodes([])

      updateConfig({
        logo: {
          ...config.logo,
          file,
          dataUrl,
          position: { x: 0.5, y: 0.5 },
          scale: 1,
          rotation: 0,
        },
      })
    },
    [config.logo, updateConfig]
  )

  const handleLogoUpdate = useCallback(
    (updates: Partial<MatConfig["logo"]>) => {
      updateConfig({
        logo: { ...config.logo, ...updates },
      })
    },
    [config.logo, updateConfig]
  )

  const handleReset = useCallback(() => {
    setConfig(DEFAULT_CONFIG)
    setSuggestedColorCodes([])
    setLogoImage(null)
    setIndoorSubtype("normal")
    setOutdoorSubtype("outdoor1")
    setVisibleTypeBlock(null)
  }, [])

  const parseEuroAmount = (value: string): number | null => {
    if (!value) return null

    let cleaned = value.replace(/€/g, "").replace(/\s/g, "").trim()

    if (cleaned.includes(".") && cleaned.includes(",")) {
      const lastDot = cleaned.lastIndexOf(".")
      const lastComma = cleaned.lastIndexOf(",")

      if (lastComma > lastDot) {
        // Europese stijl: 1.234,56
        cleaned = cleaned.replace(/\./g, "").replace(",", ".")
      } else {
        // Engelse stijl: 1,234.56
        cleaned = cleaned.replace(/,/g, "")
      }
    } else if (cleaned.includes(",")) {
      // bv 41,68
      cleaned = cleaned.replace(",", ".")
    }
    // alleen punt? dan niets doen, bv 41.68

    const parsed = Number(cleaned)
    return Number.isFinite(parsed) ? parsed : null
  }

  const getDisplayedConfiguratorTotal = (): number | null => {
    const bodyText = document.body.innerText || ""

    // Zoek eerst expliciet naar een "Total" blok met een eurobedrag erna
    const totalMatch = bodyText.match(/Total[\s\S]{0,80}?€\s*[\d.,]+/i)
    if (totalMatch) {
      const euroMatch = totalMatch[0].match(/€\s*[\d.,]+/)
      if (euroMatch) {
        return parseEuroAmount(euroMatch[0])
      }
    }

    // Fallback: neem laatste eurobedrag op pagina
    const allMatches = [...bodyText.matchAll(/€\s*[\d.,]+/g)]
    if (allMatches.length > 0) {
      const lastMatch = allMatches[allMatches.length - 1][0]
      return parseEuroAmount(lastMatch)
    }

    return null
  }

  const handleAddToCart = useCallback(async () => {
    try {
      const canvas = document.getElementById("carpetz-mat-preview-canvas") as HTMLCanvasElement | null

      if (!canvas) {
        alert("Mat preview canvas niet gevonden.")
        return
      }

      // 1) Volledige mat preview als PNG
      const previewDataUrl = canvas.toDataURL("image/png")

      // 2) Upload preview naar WordPress
      const uploadResponse = await fetch("https://www.carpetz.be/wp-json/carpetz/v1/upload-preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: previewDataUrl,
        }),
      })

      const uploadResult = await uploadResponse.json()

      if (!uploadResponse.ok || !uploadResult?.success || !uploadResult?.url) {
        console.error("Upload preview mislukt:", uploadResult)
        alert("Preview upload mislukt.")
        return
      }

      const previewUrl = uploadResult.url

      // 3) Totale prijs uit de zichtbare calculator halen
      const totalPrice = getDisplayedConfiguratorTotal()

      if (totalPrice === null) {
        alert("Prijs kon niet uit de configurator gehaald worden.")
        return
      }

      console.log("Totaalprijs uit configurator:", totalPrice)

      // 4) Alles doorsturen naar WooCommerce
      const params = new URLSearchParams({
        "add-to-cart": "5950",
        quantity: String(config.quantity),
        preview_url: previewUrl,
        custom_price: String(totalPrice),
        mat_type: config.type,
        placement: config.placement,
        orientation: config.orientation,
        size_label: `${config.size.width} x ${config.size.height} cm`,
        width_cm: String(config.size.width),
        height_cm: String(config.size.height),
        rubber_border: config.rubberBorder ? "Ja" : "Nee",
        logo_colors: String(config.logoColors),
        color_code: config.colorCode,
        is_custom_size: config.size.isCustom ? "Ja" : "Nee",
      })

      const url = `https://www.carpetz.be/winkelwagen/?${params.toString()}`

      if (window.top) {
        window.top.location.href = url
      } else {
        window.location.href = url
      }
    } catch (error) {
      console.error("handleAddToCart error:", error)
      alert("Er is iets misgegaan bij het toevoegen aan de winkelwagen.")
    }
  }, [config])

  const handleColorSuggestionsFound = useCallback((codes: string[]) => {
    setSuggestedColorCodes(codes)
  }, [])

  const handleResetSuggestions = useCallback(() => {
    setSuggestedColorCodes([])
  }, [])

  const selectedColor = MAT_COLORS.find((c) => c.code === config.colorCode)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-foreground flex items-center justify-center">
              <Layers className="w-5 h-5 text-background" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Logo Mat Configurator</h1>
              <p className="text-sm text-muted-foreground">Design your custom entrance mat</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>      
<Button size="sm" onClick={handleAddToCart}>
  <ShoppingCart className="w-4 h-4 mr-2" />
  Add to Cart
</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr_320px] lg:grid-cols-[380px_1fr] gap-6">
          {/* Configuration Panel */}
          <Card className="lg:sticky lg:top-24 lg:h-[calc(100vh-120px)] flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Configure Your Mat</CardTitle>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4">
                  <TabsTrigger value="mat" className="data-[state=active]:bg-muted rounded-b-none gap-1.5">
                    <Layers className="w-4 h-4" />
                    Mat
                  </TabsTrigger>
                  <TabsTrigger value="colors" className="data-[state=active]:bg-muted rounded-b-none gap-1.5">
                    <Palette className="w-4 h-4" />
                    Colors
                  </TabsTrigger>
                  <TabsTrigger value="logo" className="data-[state=active]:bg-muted rounded-b-none gap-1.5">
                    <ImageIcon className="w-4 h-4" />
                    Logo
                  </TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1">
                  <div className="px-4 py-4">
                    <TabsContent value="mat" className="mt-0 space-y-6">
                      {/* Mat Type */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Mat Type</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleMatTypeChange("indoor")}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                              visibleTypeBlock === "indoor"
                                ? "border-foreground bg-foreground/5"
                                : "border-border hover:border-muted-foreground"
                            }`}
                          >
                            <div className="font-medium text-sm">Indoor</div>
                            <div className="text-xs text-muted-foreground">Soft carpet finish</div>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleMatTypeChange("outdoor")}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                              visibleTypeBlock === "outdoor"
                                ? "border-foreground bg-foreground/5"
                                : "border-border hover:border-muted-foreground"
                            }`}
                          >
                            <div className="font-medium text-sm">Outdoor</div>
                            <div className="text-xs text-muted-foreground">Weather resistant</div>
                          </button>
                        </div>
                      </div>

                      {/* Indoor Type */}
                      {visibleTypeBlock === "indoor" && (
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Indoor Type</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setIndoorSubtype("normal")}
                              className={`p-3 rounded-lg border-2 transition-all text-left ${
                                indoorSubtype === "normal"
                                  ? "border-foreground bg-foreground/5"
                                  : "border-border hover:border-muted-foreground"
                              }`}
                            >
                              <div className="font-medium text-sm">Normal</div>
                              <div className="text-xs text-muted-foreground">Standard quality</div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setIndoorSubtype("eco")}
                              className={`p-3 rounded-lg border-2 transition-all text-left ${
                                indoorSubtype === "eco"
                                  ? "border-foreground bg-foreground/5"
                                  : "border-border hover:border-muted-foreground"
                              }`}
                            >
                              <div className="font-medium text-sm">Eco</div>
                              <div className="text-xs text-muted-foreground">Sustainable option</div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setIndoorSubtype("luxe")}
                              className={`p-3 rounded-lg border-2 transition-all text-left ${
                                indoorSubtype === "luxe"
                                  ? "border-foreground bg-foreground/5"
                                  : "border-border hover:border-muted-foreground"
                              }`}
                            >
                              <div className="font-medium text-sm">Luxe</div>
                              <div className="text-xs text-muted-foreground">Premium finish</div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setIndoorSubtype("budget")}
                              className={`p-3 rounded-lg border-2 transition-all text-left ${
                                indoorSubtype === "budget"
                                  ? "border-foreground bg-foreground/5"
                                  : "border-border hover:border-muted-foreground"
                              }`}
                            >
                              <div className="font-medium text-sm">Budget</div>
                              <div className="text-xs text-muted-foreground">Entry-level option</div>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Outdoor Type */}
                      {visibleTypeBlock === "outdoor" && (
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Outdoor Type</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setOutdoorSubtype("outdoor1")}
                              className={`p-3 rounded-lg border-2 transition-all text-left ${
                                outdoorSubtype === "outdoor1"
                                  ? "border-foreground bg-foreground/5"
                                  : "border-border hover:border-muted-foreground"
                              }`}
                            >
                              <div className="font-medium text-sm">Outdoor 1</div>
                              <div className="text-xs text-muted-foreground">Standard outdoor use</div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setOutdoorSubtype("outdoor2")}
                              className={`p-3 rounded-lg border-2 transition-all text-left ${
                                outdoorSubtype === "outdoor2"
                                  ? "border-foreground bg-foreground/5"
                                  : "border-border hover:border-muted-foreground"
                              }`}
                            >
                              <div className="font-medium text-sm">Outdoor 2</div>
                              <div className="text-xs text-muted-foreground">Extra scraper effect</div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setOutdoorSubtype("outdoor3")}
                              className={`p-3 rounded-lg border-2 transition-all text-left ${
                                outdoorSubtype === "outdoor3"
                                  ? "border-foreground bg-foreground/5"
                                  : "border-border hover:border-muted-foreground"
                              }`}
                            >
                              <div className="font-medium text-sm">Outdoor 3</div>
                              <div className="text-xs text-muted-foreground">Heavy-duty option</div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setOutdoorSubtype("outdoor4")}
                              className={`p-3 rounded-lg border-2 transition-all text-left ${
                                outdoorSubtype === "outdoor4"
                                  ? "border-foreground bg-foreground/5"
                                  : "border-border hover:border-muted-foreground"
                              }`}
                            >
                              <div className="font-medium text-sm">Outdoor 4</div>
                              <div className="text-xs text-muted-foreground">Premium outdoor finish</div>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Placement */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Placement</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateConfig({
                                placement: "floor",
                                rubberBorder: true,
                              })
                            }
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                              config.placement === "floor"
                                ? "border-foreground bg-foreground/5"
                                : "border-border hover:border-muted-foreground"
                            }`}
                          >
                            <div className="font-medium text-sm">Floor</div>
                            <div className="text-xs text-muted-foreground">Standard placement</div>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              updateConfig({
                                placement: "frame",
                                rubberBorder: false,
                              })
                            }
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                              config.placement === "frame"
                                ? "border-foreground bg-foreground/5"
                                : "border-border hover:border-muted-foreground"
                            }`}
                          >
                            <div className="font-medium text-sm">In-Floor Frame</div>
                            <div className="text-xs text-muted-foreground">Recessed mounting</div>
                          </button>
                        </div>
                      </div>

                      {/* Orientation */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Orientation</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => updateConfig({ orientation: "landscape" })}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              config.orientation === "landscape"
                                ? "border-foreground bg-foreground/5"
                                : "border-border hover:border-muted-foreground"
                            }`}
                          >
                            <div className="w-12 h-8 mx-auto mb-2 bg-muted-foreground/20 rounded" />
                            <div className="text-xs">Landscape</div>
                          </button>

                          <button
                            type="button"
                            onClick={() => updateConfig({ orientation: "portrait" })}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              config.orientation === "portrait"
                                ? "border-foreground bg-foreground/5"
                                : "border-border hover:border-muted-foreground"
                            }`}
                          >
                            <div className="w-8 h-12 mx-auto mb-2 bg-muted-foreground/20 rounded" />
                            <div className="text-xs">Portrait</div>
                          </button>
                        </div>
                      </div>
                        {config.placement !== "frame" && (
                        <>
                          <Separator />

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-sm font-medium">Rubber Border</Label>
                            </div>
                            <Switch
                              checked={config.rubberBorder}
                              onCheckedChange={(v) => updateConfig({ rubberBorder: v })}
                            />
                          </div>

                          <Separator />
                        </>
                      )}

                      {/* Size as blocks */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Size (cm)</Label>

                        <div className="grid grid-cols-2 gap-2">
                          {STANDARD_SIZES.map((size) => {
                            const isSelected =
                              !config.size.isCustom &&
                              config.size.width === size.width &&
                              config.size.height === size.height

                            return (
                              <button
                                key={size.label}
                                type="button"
                                onClick={() =>
                                  updateConfig({
                                    size: {
                                      width: size.width,
                                      height: size.height,
                                      isCustom: false,
                                    },
                                  })
                                }
                                className={`p-3 rounded-lg border-2 transition-all text-left ${
                                  isSelected
                                    ? "border-foreground bg-foreground/5"
                                    : "border-border hover:border-muted-foreground"
                                }`}
                              >
                                <div className="font-medium text-sm">{size.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {size.width} × {size.height} cm
                                </div>
                              </button>
                            )
                          })}

                          <button
                            type="button"
                            onClick={() =>
                              updateConfig({
                                size: {
                                  ...config.size,
                                  isCustom: true,
                                },
                              })
                            }
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                              config.size.isCustom
                                ? "border-foreground bg-foreground/5"
                                : "border-border hover:border-muted-foreground"
                            }`}
                          >
                            <div className="font-medium text-sm">Custom Size</div>
                            <div className="text-xs text-muted-foreground">Enter your own dimensions</div>
                          </button>
                        </div>

                        {config.size.isCustom && (
                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Width (cm)</Label>
                              <Input
                                type="number"
                                min={30}
                                max={300}
                                value={config.size.width}
                                onChange={(e) =>
                                  updateConfig({
                                    size: {
                                      ...config.size,
                                      width: parseInt(e.target.value) || 30,
                                      isCustom: true,
                                    },
                                  })
                                }
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Height (cm)</Label>
                              <Input
                                type="number"
                                min={30}
                                max={300}
                                value={config.size.height}
                                onChange={(e) =>
                                  updateConfig({
                                    size: {
                                      ...config.size,
                                      height: parseInt(e.target.value) || 30,
                                      isCustom: true,
                                    },
                                  })
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Rubber Border only when not frame */}
                    

                      {/* Quantity */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Quantity</Label>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateConfig({ quantity: Math.max(1, config.quantity - 1) })}
                            disabled={config.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>

                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={config.quantity}
                            onChange={(e) =>
                              updateConfig({
                                quantity: Math.max(1, Math.min(100, parseInt(e.target.value) || 1)),
                              })
                            }
                            className="w-20 text-center"
                          />

                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateConfig({ quantity: Math.min(100, config.quantity + 1) })}
                            disabled={config.quantity >= 100}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        {config.quantity >= 5 && (
                          <Badge variant="secondary" className="text-xs">
                            Volume discount applied!
                          </Badge>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="colors" className="mt-0 space-y-6">
                      {selectedColor && (
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          <div
                            className="w-10 h-10 rounded-md border border-border"
                            style={{ backgroundColor: selectedColor.hex }}
                          />
                          <div>
                            <p className="font-medium text-sm">{selectedColor.name}</p>
                            <p className="text-xs text-muted-foreground">{selectedColor.code}</p>
                          </div>
                        </div>
                      )}

                      <ColorPalette
                        selectedCode={config.colorCode}
                        onSelect={(code) => updateConfig({ colorCode: code })}
                        suggestedCodes={suggestedColorCodes}
                        onResetSuggestions={handleResetSuggestions}
                      />
                    </TabsContent>

                    <TabsContent value="logo" className="mt-0 space-y-6">
                      <LogoUploader
                        currentFile={config.logo.file}
                        onUpload={handleLogoUpload}
                        onColorSuggestionsFound={handleColorSuggestionsFound}
                      />

                      {config.logo.dataUrl && (
                        <>
                          <Separator />

                          <div className="space-y-3">
                            <Label className="text-sm font-medium">Logo Colors</Label>
                            <Select
                              value={config.logoColors.toString()}
                              onValueChange={(v) => updateConfig({ logoColors: parseInt(v) })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 color (included)</SelectItem>
                                <SelectItem value="2">2 colors (+€5)</SelectItem>
                                <SelectItem value="3">3 colors (+€10)</SelectItem>
                                <SelectItem value="4">4 colors (+€15)</SelectItem>
                                <SelectItem value="5">5+ colors (+€20)</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              Number of distinct colors in your logo for printing
                            </p>
                          </div>
                        </>
                      )}
                    </TabsContent>
                  </div>
                </ScrollArea>
              </Tabs>
            </CardContent>
          </Card>

          {/* Preview Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Live Preview</CardTitle>
                  <RenderPreview config={config} logoImage={logoImage} />
                </div>
              </CardHeader>

              <CardContent>
                <MatCanvas config={config} onLogoUpdate={handleLogoUpdate} />
              </CardContent>
            </Card>
          </div>

          {/* Price Calculator - Desktop */}
          <div className="hidden xl:block">
            <div className="sticky top-24">
              <PriceCalculator config={config} />
            </div>
          </div>
        </div>

        {/* Price Calculator - Mobile/Tablet */}
        <div className="xl:hidden mt-6">
          <PriceCalculator config={config} />
        </div>
      </main>
    </div>
  )
}
