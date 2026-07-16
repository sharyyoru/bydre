"use client"

import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { CollageSettings, ShapeAnalysis } from "@/lib/collage"
import { Download, Save, Sparkles } from "lucide-react"

interface ControlsPanelProps {
  settings: CollageSettings
  onSettingsChange: (settings: Partial<CollageSettings>) => void
  onExport: () => void
  onSave: () => void
  canExport: boolean
  exporting: boolean
  shapeAnalysis?: ShapeAnalysis
}

export function ControlsPanel({
  settings,
  onSettingsChange,
  onExport,
  onSave,
  canExport,
  exporting,
  shapeAnalysis,
}: ControlsPanelProps) {
  const handleUseSuggested = () => {
    if (shapeAnalysis) {
      onSettingsChange({
        gridRows: shapeAnalysis.optimalGridRows,
        gridCols: shapeAnalysis.optimalGridCols,
      })
    }
  }

  return (
    <div className="space-y-6 p-4">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Layout Settings</h3>
          {shapeAnalysis && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleUseSuggested}
              className="text-xs"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Use Suggested
            </Button>
          )}
        </div>

        {shapeAnalysis && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg text-sm">
            <p className="font-medium mb-1">Recommended Grid</p>
            <p className="text-muted-foreground">
              {shapeAnalysis.optimalGridRows}×{shapeAnalysis.optimalGridCols} (Shape fills ~{Math.round(shapeAnalysis.coverageArea * 100)}% of canvas)
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label className="text-sm mb-2 block">
              Grid Columns: {settings.gridCols}
            </Label>
            <Slider
              value={[settings.gridCols]}
              onValueChange={([value]: number[]) => onSettingsChange({ gridCols: value })}
              min={5}
              max={50}
              step={1}
              className="w-full"
            />
          </div>

          <div>
            <Label className="text-sm mb-2 block">
              Grid Rows: {settings.gridRows}
            </Label>
            <Slider
              value={[settings.gridRows]}
              onValueChange={([value]: number[]) => onSettingsChange({ gridRows: value })}
              min={5}
              max={50}
              step={1}
              className="w-full"
            />
          </div>

          <div>
            <Label className="text-sm mb-2 block">
              Padding: {settings.padding}px
            </Label>
            <Slider
              value={[settings.padding]}
              onValueChange={([value]: number[]) => onSettingsChange({ padding: value })}
              min={0}
              max={20}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Visual Effects</h3>

        <div className="space-y-2">
          <button
            onClick={() => onSettingsChange({ effect: 'color', gradientColors: undefined })}
            className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
              settings.effect === 'color'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <p className="font-medium text-sm">Original Colors</p>
            <p className="text-xs text-muted-foreground">Keep images as uploaded</p>
          </button>

          <button
            onClick={() => onSettingsChange({ effect: 'bw', gradientColors: undefined })}
            className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
              settings.effect === 'bw'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <p className="font-medium text-sm">Black & White</p>
            <p className="text-xs text-muted-foreground">Convert to grayscale</p>
          </button>

          <button
            onClick={() =>
              onSettingsChange({
                effect: 'gradient',
                gradientColors: settings.gradientColors || ['#000000', '#ffffff'],
              })
            }
            className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
              settings.effect === 'gradient'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <p className="font-medium text-sm">Gradient Overlay</p>
            <p className="text-xs text-muted-foreground">Apply color gradient</p>
          </button>

          {settings.effect === 'gradient' && (
            <div className="pl-3 space-y-2 mt-3">
              <div>
                <Label className="text-xs mb-1 block">Start Color</Label>
                <input
                  type="color"
                  value={settings.gradientColors?.[0] || '#000000'}
                  onChange={(e) =>
                    onSettingsChange({
                      gradientColors: [e.target.value, settings.gradientColors?.[1] || '#ffffff'],
                    })
                  }
                  className="w-full h-10 rounded border cursor-pointer"
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">End Color</Label>
                <input
                  type="color"
                  value={settings.gradientColors?.[1] || '#ffffff'}
                  onChange={(e) =>
                    onSettingsChange({
                      gradientColors: [settings.gradientColors?.[0] || '#000000', e.target.value],
                    })
                  }
                  className="w-full h-10 rounded border cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t">
        <Button
          onClick={onSave}
          variant="outline"
          className="w-full"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Project
        </Button>

        <Button
          onClick={onExport}
          disabled={!canExport || exporting}
          className="w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          {exporting ? 'Exporting...' : 'Export PNG (200 DPI)'}
        </Button>

        {canExport && (
          <p className="text-xs text-muted-foreground text-center">
            Export size: ~15,700px for 2-meter print
          </p>
        )}
      </div>
    </div>
  )
}
