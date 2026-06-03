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
  rubberBorder: false,
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

export function MatConfigurator() {
  const [config, setConfig] = useState<MatConfig>(DEFAULT_CONFIG)
  const [activeTab, setActiveTab] = useState("mat")
  const [suggestedColorCodes, setSuggestedColorCodes] = useState<string[]>([])
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null)

  // Load logo image when dataUrl changes
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

  const handleLogoUpload = useCallback((file: File, dataUrl: string) => {
    // Reset oude AI-suggesties zodra een nieuw logo wordt geladen
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
  }, [config.logo, updateConfig])

  const handleLogoUpdate = useCallback((updates: Partial<MatConfig["logo"]>) => {
    updateConfig({
      logo: { ...config.logo, ...updates },
    })
  }, [config.logo, updateConfig])

  const handleSizeSelect = useCallback((sizeString: string) => {
    if (sizeString === "custom") {
      updateConfig({
        size: { ...config.size, isCustom: true },
      })
    } else {
      const size = STANDARD_SIZES.find((s) => `${s.width}x${s.height}` === sizeString)
      if (size) {
        updateConfig({
          size: { width: size.width, height: size.height, isCustom: false },
        })
      }
    }
  }, [config.size, updateConfig])

  const handleReset = useCallback(() => {
    setConfig(DEFAULT_CONFIG)
    setSuggestedColorCodes([])
    setLogoImage(null)
  }, [])

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
            <Button size="sm">
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
                            onClick={() => updateConfig({ type: "indoor" })}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                              config.type === "indoor"
                                ? "border-foreground bg-foreground/5"
                                : "border-border hover:border-muted-foreground"
                            }`}
                          >
                            <div className="font-medium text-sm">Indoor</div>
                            <div className="text-xs text-muted-foreground">Soft carpet finish</div>
                          </button>
                          <button
                            onClick={() => updateConfig({ type: "outdoor" })}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                              config.type === "outdoor"
                                ? "border-foreground bg-foreground/5"
                                : "border-border hover:border-muted-foreground"
                            }`}
                          >
                            <div className="font-medium text-sm">Outdoor</div>
                            <div className="text-xs text-muted-foreground">Weather resistant</div>
                          </button>
                        </div>
                      </div>

                      {/* Placement */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Placement</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => updateConfig({ placement: "floor" })}
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
                            onClick={() => updateConfig({ placement: "frame" })}
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

                      {/* Size */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Size (cm)</Label>
                        <Select
                          value={config.size.isCustom ? "custom" : `${config.size.width}x${config.size.height}`}
                          onValueChange={handleSizeSelect}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STANDARD_SIZES.map((size) => (
                              <SelectItem key={size.label} value={`${size.width}x${size.height}`}>
                                {size.label}
                              </SelectItem>
                            ))}
                            <SelectItem value="custom">Custom Size</SelectItem>
                          </SelectContent>
                        </Select>

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
                                    size: { ...config.size, width: parseInt(e.target.value) || 30 },
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
                                    size: { ...config.size, height: parseInt(e.target.value) || 30 },
                                  })
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* Rubber Border */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">Rubber Border</Label>
                          <p className="text-xs text-muted-foreground">Adds durability (+15%)</p>
                        </div>
                        <Switch
                          checked={config.rubberBorder}
                          onCheckedChange={(v) => updateConfig({ rubberBorder: v })}
                        />
                      </div>

                      <Separator />

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
                      {/* Current Selection */}
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

                      {/* Color Palette */}
                      <ColorPalette
                        selectedCode={config.colorCode}
                        onSelect={(code) => updateConfig({ colorCode: code })}
                        suggestedCodes={suggestedColorCodes}
                        onResetSuggestions={handleResetSuggestions}
                      />
                    </TabsContent>

                    <TabsContent value="logo" className="mt-0 space-y-6">
                      {/* Logo Upload */}
                      <LogoUploader
                        currentFile={config.logo.file}
                        onUpload={handleLogoUpload}
                        onColorSuggestionsFound={handleColorSuggestionsFound}
                      />

                      {config.logo.dataUrl && (
                        <>
                          <Separator />

                          {/* Logo Colors for Pricing */}
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
            {/* Live Canvas */}
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

            {/* Quick Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-3">
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="font-medium text-sm capitalize">{config.type}</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs text-muted-foreground">Size</p>
                <p className="font-medium text-sm">
                  {config.size.width} × {config.size.height} cm
                </p>
              </Card>
              <Card className="p-3">
                <p className="text-xs text-muted-foreground">Color</p>
                <p className="font-medium text-sm">{selectedColor?.name || "-"}</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs text-muted-foreground">Border</p>
                <p className="font-medium text-sm">{config.rubberBorder ? "Rubber" : "Standard"}</p>
              </Card>
            </div>
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
