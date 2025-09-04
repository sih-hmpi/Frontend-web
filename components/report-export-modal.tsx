"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { downloadBlob, type RasterRecord, toCSV } from "@/lib/mock-utils"

type Props = {
  data: RasterRecord[]
}

export function ReportExportModal({ data }: Props) {
  const [open, setOpen] = useState(false)

  function exportJSON() {
    downloadBlob(JSON.stringify(data, null, 2), "map-view.json", "application/json")
  }
  function exportCSV() {
    downloadBlob(toCSV(data), "map-view.csv", "text/csv")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Export</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Current View</DialogTitle>
        </DialogHeader>
        <div className="flex gap-3">
          <Button onClick={exportCSV}>Download CSV</Button>
          <Button variant="secondary" onClick={exportJSON}>
            Download JSON
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
