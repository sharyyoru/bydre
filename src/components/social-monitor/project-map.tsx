"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api"
import { Badge } from "@/components/ui/badge"
import { formatAED } from "@/lib/social-monitor/format"

interface Project {
  id: string
  name: string
  developer_name: string | null
  district_name: string | null
  status: "available" | "sold_out" | "launch" | null
  price_min: number | null
  price_max: number | null
  price_per_sqft: number | null
  handover_date: string | null
  latitude: number | null
  longitude: number | null
}

interface ProjectMapProps {
  projects: Project[]
  workspaceId: string
}

const containerStyle = {
  width: "100%",
  height: "500px",
  borderRadius: "12px",
}

// Dubai center coordinates
const defaultCenter = {
  lat: 25.2048,
  lng: 55.2708,
}

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ],
}

export function ProjectMap({ projects, workspaceId }: ProjectMapProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [keyError, setKeyError] = useState<string | null>(null)

  // Fetch API key from backend
  useEffect(() => {
    async function fetchApiKey() {
      try {
        const res = await fetch(`/api/social-monitor/maps-key?workspace_id=${workspaceId}`)
        if (res.ok) {
          const json = await res.json()
          setApiKey(json.apiKey)
        } else {
          const json = await res.json().catch(() => ({}))
          setKeyError(json.error || "Failed to load Google Maps API key")
        }
      } catch {
        setKeyError("Failed to load Google Maps API key")
      }
    }
    fetchApiKey()
  }, [workspaceId])

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || "",
  })

  // Filter projects with valid coordinates
  const mappableProjects = useMemo(
    () => projects.filter((p) => p.latitude && p.longitude),
    [projects]
  )

  // Calculate map bounds to fit all markers
  const bounds = useMemo(() => {
    if (!mappableProjects.length) return null
    const b = new google.maps.LatLngBounds()
    mappableProjects.forEach((p) => {
      if (p.latitude && p.longitude) {
        b.extend({ lat: p.latitude, lng: p.longitude })
      }
    })
    return b
  }, [mappableProjects])

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      setMap(map)
      if (bounds) {
        map.fitBounds(bounds)
        // Add padding
        const listener = google.maps.event.addListenerOnce(map, "idle", () => {
          const currentZoom = map.getZoom()
          if (currentZoom && currentZoom > 14) {
            map.setZoom(14)
          }
        })
      }
    },
    [bounds]
  )

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  const getMarkerIcon = (status: string | null): google.maps.Symbol => {
    let color = "#6B7280" // gray default
    if (status === "available") color = "#10B981" // emerald
    if (status === "launch") color = "#3B82F6" // blue
    if (status === "sold_out") color = "#EF4444" // red

    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 0.9,
      strokeColor: "#ffffff",
      strokeWeight: 2,
      scale: 10,
    }
  }

  const formatHandover = (date: string | null) => {
    if (!date) return "TBA"
    return new Date(date).toLocaleDateString("en-GB", {
      month: "short",
      year: "numeric",
    })
  }

  const statusBadge = (status: string | null) => {
    switch (status) {
      case "available":
        return <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Available</Badge>
      case "sold_out":
        return <Badge className="bg-red-100 text-red-700 border-0 text-xs">Sold Out</Badge>
      case "launch":
        return <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">Launching</Badge>
      default:
        return null
    }
  }

  if (keyError) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-muted/30 rounded-xl">
        <p className="text-sm text-muted-foreground">
          {keyError}. Configure Google Maps API key in API Settings.
        </p>
      </div>
    )
  }

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-muted/30 rounded-xl">
        <p className="text-sm text-muted-foreground">Loading map configuration...</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-muted/30 rounded-xl">
        <p className="text-sm text-muted-foreground">
          Failed to load Google Maps. Check your API key in API Settings.
        </p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-muted/30 rounded-xl">
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    )
  }

  if (!mappableProjects.length) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-muted/30 rounded-xl">
        <p className="text-sm text-muted-foreground">
          No projects with location data. Project coordinates may be missing from the source.
        </p>
      </div>
    )
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={defaultCenter}
      zoom={11}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={mapOptions}
    >
      {mappableProjects.map((project) => (
        <Marker
          key={project.id}
          position={{ lat: project.latitude!, lng: project.longitude! }}
          icon={getMarkerIcon(project.status)}
          onClick={() => setSelectedProject(project)}
        />
      ))}

      {selectedProject && selectedProject.latitude && selectedProject.longitude && (
        <InfoWindow
          position={{ lat: selectedProject.latitude, lng: selectedProject.longitude }}
          onCloseClick={() => setSelectedProject(null)}
        >
          <div className="p-2 min-w-[200px] max-w-[280px]">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-sm text-gray-900">{selectedProject.name}</h3>
              {statusBadge(selectedProject.status)}
            </div>
            {selectedProject.developer_name && (
              <p className="text-xs text-gray-600 mb-1">
                by {selectedProject.developer_name}
              </p>
            )}
            {selectedProject.district_name && (
              <p className="text-xs text-gray-500 mb-2">{selectedProject.district_name}</p>
            )}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Price/sqft:</span>
                <br />
                <span className="font-medium">
                  {selectedProject.price_per_sqft
                    ? `AED ${Math.round(selectedProject.price_per_sqft).toLocaleString()}`
                    : "—"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Handover:</span>
                <br />
                <span className="font-medium">{formatHandover(selectedProject.handover_date)}</span>
              </div>
            </div>
            {(selectedProject.price_min || selectedProject.price_max) && (
              <div className="mt-2 pt-2 border-t text-xs">
                <span className="text-gray-500">Starting from:</span>
                <br />
                <span className="font-medium text-emerald-700">
                  {formatAED(selectedProject.price_min || selectedProject.price_max || 0)}
                </span>
              </div>
            )}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  )
}
