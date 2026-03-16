# Graph Gallery (click-to-open)

This is a local, dependency-free “app” for browsing saved graph images with **zoom (mouse wheel)** and **pan (drag)**.

## Open

Double-click:

- `open_graph_gallery.bat`

Or run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\graph_gallery\open_graph_gallery.ps1
```

## Add graphs

1. Put image files in `graph_gallery\graphs\` (png/jpg/etc).
2. Refresh the list:

```powershell
powershell -ExecutionPolicy Bypass -File .\graph_gallery\scripts\refresh_manifest.ps1
```

## Controls

- Zoom: mouse wheel
- Pan: click + drag
- Fit / Reset / 100%: toolbar buttons
- Download: toolbar link

## Interactive graphs

Some entries (e.g. `Adduction IMALs`, `Elbow flexor IMAL`, `Neck IMAL`) are HTML-based interactive views with their own built-in toggles/controls.
