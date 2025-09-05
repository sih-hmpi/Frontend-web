"use client";

import { WellMapViewer } from "@/components/well-map-viewer";
import { Card } from "@/components/ui/card";

export default function MapPage() {
  return (
    <div className="h-screen p-6">
      <Card className="h-[calc(100vh-3rem)]">
        <WellMapViewer />
      </Card>
    </div>
  );
}



// "use client"

// import { EnhancedMapViewer } from "@/components/enhanced-map-viewer"

// export default function MapPage() {
//   return (
//     <div className="h-screen">
//       <EnhancedMapViewer />
//     </div>
//   )
// }
